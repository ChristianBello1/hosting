// server/services/deployment.js
const fs = require('fs').promises;
const path = require('path');

class DeploymentService {
  constructor() {
    this.sitesDir = path.join(__dirname, '../sites');
    this.ensureDirectories(); // Inizializza le directory necessarie
  }

  // Metodo per assicurarsi che le directory necessarie esistano
  async ensureDirectories() {
    try {
      await fs.mkdir(this.sitesDir, { recursive: true });
      console.log('Sites directory ensured at:', this.sitesDir);
    } catch (error) {
      console.error('Error ensuring directories:', error);
    }
  }

  async initializeClientSite(client) {
    console.log('Initializing site for client:', client._id);
    
    try {
      // Assicurati che la directory base esista
      await this.ensureDirectories();

      // Crea la directory del cliente
      const clientDir = path.join(this.sitesDir, client._id.toString());
      await fs.mkdir(clientDir, { recursive: true });
      console.log('Created client directory:', clientDir);

      // Crea un file index.html di base
      const indexPath = path.join(clientDir, 'index.html');
      const indexContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${client.companyName}</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                background-color: #f5f5f5;
              }
              .container {
                background: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                text-align: center;
              }
              h1 { color: #333; margin-bottom: 1rem; }
              p { color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Welcome to ${client.companyName}</h1>
              <p>Site under construction</p>
              <p>Last updated: ${new Date().toLocaleDateString()}</p>
            </div>
          </body>
        </html>
      `;

      await fs.writeFile(indexPath, indexContent);
      console.log('Created index.html for client');

      // Crea file di tracking del deployment
      const deploymentTracker = path.join(clientDir, '.deployment');
      const deploymentInfo = {
        clientId: client._id,
        domain: client.domain,
        plan: client.plan,
        initialDeployment: new Date().toISOString(),
        lastDeploy: new Date().toISOString(),
        deployCount: 1
      };

      await fs.writeFile(
        deploymentTracker,
        JSON.stringify(deploymentInfo, null, 2)
      );
      console.log('Created deployment tracker');

      return {
        success: true,
        url: `https://${client.domain}`,
        deployedAt: deploymentInfo.lastDeploy
      };

    } catch (error) {
      console.error('Site initialization failed:', {
        error: error.message,
        clientId: client._id,
        path: this.sitesDir
      });
      throw new Error(`Failed to initialize site: ${error.message}`);
    }
  }

  async redeployClient(clientId) {
    console.log('Starting redeploy for client:', clientId);
    
    try {
      // Assicurati che la directory base esista
      await this.ensureDirectories();

      // Verifica/crea la directory del cliente
      const clientDir = path.join(this.sitesDir, clientId.toString());
      await fs.mkdir(clientDir, { recursive: true });
      console.log('Ensured client directory exists:', clientDir);

      // Aggiorna o crea il tracker di deployment
      const deploymentTracker = path.join(clientDir, '.deployment');
      let deploymentInfo = {
        clientId: clientId,
        initialDeployment: new Date().toISOString(),
        deployCount: 1
      };

      try {
        const existingInfo = JSON.parse(await fs.readFile(deploymentTracker, 'utf8'));
        deploymentInfo = {
          ...existingInfo,
          lastDeploy: new Date().toISOString(),
          deployCount: (existingInfo.deployCount || 0) + 1
        };
      } catch (e) {
        console.log('No existing deployment tracker, creating new one');
      }

      await fs.writeFile(
        deploymentTracker,
        JSON.stringify(deploymentInfo, null, 2)
      );

      console.log('Redeploy successful:', deploymentInfo);

      return {
        success: true,
        timestamp: deploymentInfo.lastDeploy,
        deployCount: deploymentInfo.deployCount
      };

    } catch (error) {
      console.error('Redeploy failed:', {
        error: error.message,
        clientId,
        path: this.sitesDir
      });
      throw new Error(`Redeploy failed: ${error.message}`);
    }
  }
}

module.exports = new DeploymentService();