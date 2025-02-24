// server/services/monitoring.js
const PLAN_RESOURCES = require('../config/planResources');
const { checkThreshold, generateAlertMessage, PLAN_THRESHOLDS } = require('./alertThresholds');
const ResourceAlert = require('../models/ResourceAlert');

const getSystemResources = async (clientId, clientPlan = 'standard') => {
  const planLimits = PLAN_RESOURCES[clientPlan];
  const alerts = [];
  
  // Genera valori basati sull'ID del cliente
  const seed = clientId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const now = Date.now();
  
  const randomForClient = (min, max) => {
    const rand = Math.sin(seed + now) * 10000;
    return Math.floor(Math.abs(rand % (max - min) + min));
  };

  // Genera metriche basate sui limiti del piano
  const ramTotal = planLimits.ram.total;
  const storageTotal = planLimits.storage.total;

  const ramUsed = randomForClient(ramTotal * 0.3, ramTotal * 0.95);
  const storageUsed = randomForClient(storageTotal * 0.3, storageTotal * 0.95);
  const cpuUsage = randomForClient(20, 95);

  const metrics = {
    cpu: {
      usage: cpuUsage,
      cores: 8
    },
    ram: {
      used: ramUsed,
      total: ramTotal
    },
    disk: {
      used: storageUsed,
      total: storageTotal
    }
  };

  // Verifica le soglie e crea alert se necessario
  const ramPercentage = (ramUsed / ramTotal) * 100;
  const storagePercentage = (storageUsed / storageTotal) * 100;

  // CPU Alert
  const cpuSeverity = checkThreshold('cpu', cpuUsage, clientPlan);
  if (cpuSeverity) {
    const alert = new ResourceAlert({
      clientId,
      type: 'cpu',
      severity: cpuSeverity,
      value: cpuUsage,
      threshold: PLAN_THRESHOLDS[clientPlan].cpu.high,
      message: generateAlertMessage('cpu', cpuUsage, PLAN_THRESHOLDS[clientPlan].cpu.high, clientPlan)
    });
    await alert.save();
    alerts.push(alert);
  }

  // RAM Alert
  const ramSeverity = checkThreshold('ram', ramPercentage, clientPlan);
  if (ramSeverity) {
    const alert = new ResourceAlert({
      clientId,
      type: 'ram',
      severity: ramSeverity,
      value: ramPercentage,
      threshold: PLAN_THRESHOLDS[clientPlan].ram.high,
      message: generateAlertMessage('ram', ramPercentage, PLAN_THRESHOLDS[clientPlan].ram.high, clientPlan)
    });
    await alert.save();
    alerts.push(alert);
  }

  // Storage Alert
  const storageSeverity = checkThreshold('disk', storagePercentage, clientPlan);
  if (storageSeverity) {
    const alert = new ResourceAlert({
      clientId,
      type: 'disk',
      severity: storageSeverity,
      value: storagePercentage,
      threshold: PLAN_THRESHOLDS[clientPlan].disk.high,
      message: generateAlertMessage('disk', storagePercentage, PLAN_THRESHOLDS[clientPlan].disk.high, clientPlan)
    });
    await alert.save();
    alerts.push(alert);
  }

  return {
    metrics,
    alerts: alerts.length > 0 ? alerts : null
  };
};

module.exports = { getSystemResources };