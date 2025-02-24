// server/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

// Limiter per autenticazione
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 5, // 5 tentativi per finestra
  message: {
    message: 'Too many login attempts, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Limiter generale per tutte le API
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 richieste per minuto
  message: {
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Limiter per endpoint sensibili (es. reset password)
const sensitiveRouteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti invece di 1 ora
  max: 10, // 10 tentativi invece di 3
  message: {
    message: 'Too many requests for sensitive operations, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Limiter per monitoraggio
const monitoringLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 300, // aumentato da 30 a 300 richieste al minuto
  message: {
    message: 'Too many monitoring requests, please try again later'
  }
});

module.exports = {
  authLimiter,
  apiLimiter,
  sensitiveRouteLimiter,
  monitoringLimiter
};