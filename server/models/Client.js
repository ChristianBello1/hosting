// server/models/Client.js
const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  domain: {
    type: String,
    required: true,
    unique: true
  },
  siteStatus: {
    type: String,
    enum: ['creating', 'active', 'suspended', 'deployment_failed', 'inactive'],
    default: 'inactive'
  },
  plan: {
    type: String,
    enum: ['standard', 'pro', 'pro_plus'], // Questi sono i valori validi per il campo plan
    default: 'standard'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUpdate: {
    type: Date,
    default: Date.now
  }
});

const Client = mongoose.model('Client', clientSchema);
module.exports = Client;