// server/routes/monitoring.js
const express = require('express');
const router = express.Router();
const ResourceAlert = require('../models/ResourceAlert');
const Client = require('../models/Client');
const { getSystemResources } = require('../services/monitoring');
const enhancedAuth = require('../middleware/enhancedAuth');

// Get resources and generate alerts
router.get('/resources/:clientId', enhancedAuth, async (req, res) => {
  try {
    const client = await Client.findById(req.params.clientId);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Assicuriamoci che client._id e client.plan esistano
    const clientData = {
      _id: client._id.toString(),
      plan: client.plan || 'standard'  // fallback al piano standard se non definito
    };

    const { metrics, alerts } = await getSystemResources(clientData._id, clientData.plan);

    // Log per debug
    console.log('Generated metrics:', metrics);

    res.json(metrics);
  } catch (error) {
    console.error('Detailed monitoring error:', error);  // Log dettagliato dell'errore
    res.status(500).json({ 
      message: 'Failed to get system resources',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

// Get active alerts
router.get('/alerts', enhancedAuth, async (req, res) => {
  try {
    const alerts = await ResourceAlert.find({ 
      acknowledged: false 
    })
    .populate('clientId', 'companyName')
    .sort({ timestamp: -1, severity: -1 })
    .limit(50);

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get alerts for specific client
router.get('/alerts/:clientId', enhancedAuth, async (req, res) => {
  try {
    const alerts = await ResourceAlert.find({
      clientId: req.params.clientId,
      acknowledged: false
    })
    .sort({ timestamp: -1, severity: -1 })
    .limit(20);

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Acknowledge alert
router.patch('/alerts/:alertId/acknowledge', enhancedAuth, async (req, res) => {
  try {
    const alert = await ResourceAlert.findByIdAndUpdate(
      req.params.alertId,
      { acknowledged: true },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;