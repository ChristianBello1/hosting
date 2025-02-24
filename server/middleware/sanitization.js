// server/middleware/sanitization.js
const xss = require('xss');
const mongoSanitize = require('express-mongo-sanitize');

// Sanitizza il body delle richieste da XSS
const sanitizeBody = (req, res, next) => {
  if (req.body) {
    const sanitized = {};
    for (let key in req.body) {
      // Sanitizza solo le stringhe
      sanitized[key] = typeof req.body[key] === 'string' 
        ? xss(req.body[key])
        : req.body[key];
    }
    req.body = sanitized;
  }
  next();
};

// Sanitizza i parametri delle richieste da XSS
const sanitizeParams = (req, res, next) => {
  if (req.params) {
    const sanitized = {};
    for (let key in req.params) {
      sanitized[key] = xss(req.params[key]);
    }
    req.params = sanitized;
  }
  next();
};

// Sanitizza le query da XSS
const sanitizeQuery = (req, res, next) => {
  if (req.query) {
    const sanitized = {};
    for (let key in req.query) {
      sanitized[key] = xss(req.query[key]);
    }
    req.query = sanitized;
  }
  next();
};

module.exports = {
  sanitizeBody,
  sanitizeParams,
  sanitizeQuery,
  mongoSanitize: mongoSanitize() // Previene NoSQL injection
};