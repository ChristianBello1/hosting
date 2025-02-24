// server/middleware/enhancedAuth.js
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const enhancedAuth = async (req, res, next) => {
  try {
    // Verifica la presenza del token
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Authentication required' 
      });
    }

    // Verifica il token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verifica che l'admin esista ancora e sia attivo
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) {
      return res.status(401).json({ 
        status: 'error',
        message: 'User no longer exists' 
      });
    }

    // Aggiungi informazioni all'oggetto request
    req.user = admin;
    req.token = token;

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        status: 'error',
        message: 'Invalid token' 
      });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        status: 'error',
        message: 'Token expired' 
      });
    }
    res.status(401).json({ 
      status: 'error',
      message: 'Authentication failed' 
    });
  }
};

module.exports = enhancedAuth;