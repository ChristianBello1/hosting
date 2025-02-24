// server/services/resourceMonitoring.js
const { sendResourceAlert } = require('./emailService');

const THRESHOLDS = {
  disk: 90, // 90% dello spazio disco
  ram: 85,  // 85% della RAM
  cpu: 80   // 80% della CPU
};

class ResourceMonitor {
  static async checkResources(client) {
    const alerts = [];
    const resources = await this.getResourceUsage(client);

    // Controlla spazio disco
    if ((resources.disk.used / resources.disk.total) * 100 >= THRESHOLDS.disk) {
      alerts.push({
        type: 'disk',
        message: `Spazio disco quasi esaurito per ${client.companyName}. Utilizzo: ${Math.round(resources.disk.used / resources.disk.total * 100)}%`,
        severity: 'high'
      });
    }

    // Controlla RAM
    if ((resources.ram.used / resources.ram.total) * 100 >= THRESHOLDS.ram) {
      alerts.push({
        type: 'ram',
        message: `Utilizzo RAM elevato per ${client.companyName}. Utilizzo: ${Math.round(resources.ram.used / resources.ram.total * 100)}%`,
        severity: 'medium'
      });
    }

    // Controlla CPU
    if (resources.cpu.usage >= THRESHOLDS.cpu) {
      alerts.push({
        type: 'cpu',
        message: `Utilizzo CPU elevato per ${client.companyName}. Utilizzo: ${resources.cpu.usage}%`,
        severity: 'medium'
      });
    }

    // Se ci sono alert, salva e invia notifiche
    if (alerts.length > 0) {
      await this.saveAlerts(client._id, alerts);
      await this.sendNotifications(client, alerts);
    }

    return alerts;
  }

  static async saveAlerts(clientId, alerts) {
    // Salva gli alert nel database
    const alertDoc = new ResourceAlert({
      clientId,
      alerts,
      timestamp: new Date()
    });
    await alertDoc.save();
  }

  static async sendNotifications(client, alerts) {
    // Invia email di notifica agli admin
    await sendResourceAlert(client, alerts);
  }
}

module.exports = ResourceMonitor;