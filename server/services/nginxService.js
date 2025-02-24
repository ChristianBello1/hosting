// server/services/nginxService.js
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

class NginxService {
  constructor() {
    // Base path per i file di configurazione nginx
    this.configDir = path.join(__dirname, '../nginx/conf.d');
    
    // Crea la directory se non esiste
    fs.mkdir(this.configDir, { recursive: true }).catch(err => {
        console.error('Error creating nginx config directory:', err);
    });
    
    // Directory del progetto
    this.projectRoot = path.resolve(__dirname, '../..');
    this.serverDir = path.resolve(__dirname, '..');
    
    this.sslService = require('./sslService');
}

  async ensureConfigDir() {
    try {
      await fs.mkdir(this.configDir, { recursive: true });
      
      // Verifica i permessi della directory
      const stats = await fs.stat(this.configDir);
      if (os.platform() !== 'win32' && stats.uid !== process.getuid()) {
        console.warn('Warning: Nginx config directory is not owned by current user');
      }
      
      return true;
    } catch (error) {
      console.error('Error ensuring Nginx config directory exists:', error);
      throw error;
    }
  }

  generateNginxConfig(domain, containerInfo, ssl = false) {
    // Estrai la porta mappata dal container
    const port = containerInfo.NetworkSettings.Ports['80/tcp'][0].HostPort;
    
    let config = `
  server {
      listen 80;
      server_name ${domain};
  
      location / {
          proxy_pass http://localhost:${port};
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
      }
  `;
  
    if (ssl) {
      config += `
      # Redirect HTTP to HTTPS
      return 301 https://$server_name$request_uri;
  }
  
  server {
      listen 443 ssl;
      server_name ${domain};
  
      ssl_certificate ${path.join(this.sslService.certsDir, domain, 'fullchain.pem')};
      ssl_certificate_key ${path.join(this.sslService.certsDir, domain, 'privkey.pem')};
      ssl_protocols TLSv1.2 TLSv1.3;
      ssl_ciphers HIGH:!aNULL:!MD5;
  
      location / {
          proxy_pass http://localhost:${port};
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
      }
  `;
    }
  
    config += `
      # Security headers
      add_header X-Frame-Options "SAMEORIGIN";
      add_header X-XSS-Protection "1; mode=block";
      add_header X-Content-Type-Options "nosniff";
      add_header Referrer-Policy "strict-origin-when-cross-origin";
      add_header Content-Security-Policy "default-src 'self';";
  }`;
  
    return config;
  }

  async updateNginxConfig(domain, config) {
    try {
      await this.ensureConfigDir();
      
      const configPath = path.join(this.configDir, `${domain}.conf`);
      await fs.writeFile(configPath, config);
      
      // Saltiamo il test nginx per ora e restituiamo true
      return true;
      
      /* Commentato il test nginx per ora
      const testResult = await this.testConfig();
      if (testResult) {
        await this.reloadNginx();
      }
      */
    } catch (error) {
      console.error('Error updating Nginx config:', error);
      throw error;
    }
  }
  
  async removeConfig(clientId) {
    try {
      const files = await fs.readdir(this.configDir);
      let removedAny = false;

      for (const file of files) {
        if (file.includes(clientId) || file.includes('domain')) {
          const configPath = path.join(this.configDir, file);
          try {
            await fs.unlink(configPath);
            console.log(`Removed Nginx config: ${file}`);
            removedAny = true;
          } catch (unlinkError) {
            console.error(`Error removing config file ${file}:`, unlinkError);
          }
        }
      }

      if (removedAny) {
        try {
          await this.reloadNginx();
        } catch (reloadError) {
          console.error('Error reloading Nginx after config removal:', reloadError);
        }
      }

      return true;
    } catch (error) {
      console.error('Error in removeConfig:', error);
      // Non consideriamo un errore se la directory non esiste
      if (error.code === 'ENOENT') {
        return true;
      }
      return false;
    }
  }

  async reloadNginx() {
    return new Promise((resolve, reject) => {
      const reloadCommand = os.platform() === 'win32'
        ? 'nginx -s reload'  // Su Windows
        : 'sudo systemctl reload nginx';  // Su Linux

      exec(reloadCommand, (error, stdout, stderr) => {
        if (error) {
          console.error('Nginx reload error:', stderr);
          reject(error);
          return;
        }
        resolve(stdout);
      });
    });
  }

  async testConfig() {
    return new Promise((resolve, reject) => {
      const testCommand = 'nginx -t';
      
      exec(testCommand, (error, stdout, stderr) => {
        if (error) {
          console.error('Nginx config test failed:', stderr);
          reject(error);
          return;
        }
        resolve(true);
      });
    });
  }
}

module.exports = new NginxService();