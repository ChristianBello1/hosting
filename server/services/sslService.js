// server/services/sslService.js
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class SSLService {
  constructor() {
    this.certsDir = path.join(__dirname, '../certs');
  }

  async setupSSL(domain) {
    try {
      // Assicurati che la directory dei certificati esista
      await fs.mkdir(this.certsDir, { recursive: true });

      // Genera certificato con Let's Encrypt
      await this.generateCertificate(domain);

      return {
        cert: path.join(this.certsDir, domain, 'fullchain.pem'),
        key: path.join(this.certsDir, domain, 'privkey.pem')
      };
    } catch (error) {
      console.error('SSL setup failed:', error);
      throw error;
    }
  }

  async generateCertificate(domain) {
    return new Promise((resolve, reject) => {
      const command = `certbot certonly --standalone -d ${domain} ` +
        `--non-interactive --agree-tos --email admin@${domain} ` +
        `--cert-name ${domain} --config-dir ${this.certsDir}`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('Certbot error:', stderr);
          reject(error);
          return;
        }
        resolve(stdout);
      });
    });
  }

  async renewCertificates() {
    return new Promise((resolve, reject) => {
      exec('certbot renew', (error, stdout, stderr) => {
        if (error) {
          console.error('Certificate renewal error:', stderr);
          reject(error);
          return;
        }
        resolve(stdout);
      });
    });
  }
}

module.exports = new SSLService();