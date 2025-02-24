// server/models/ResourceAlert.js
const mongoose = require('mongoose');

const resourceAlertSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  type: {
    type: String,
    enum: ['cpu', 'ram', 'disk', 'response_time', 'uptime', 'bandwidth'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  value: {
    type: Number,
    required: true
  },
  threshold: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  acknowledged: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: Map,
    of: String
  }
});

// Indice per query più efficienti
resourceAlertSchema.index({ clientId: 1, timestamp: -1, acknowledged: 1 });

const ResourceAlert = mongoose.model('ResourceAlert', resourceAlertSchema);
module.exports = ResourceAlert;