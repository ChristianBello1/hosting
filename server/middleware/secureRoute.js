// server/middleware/secureRoute.js
const secureRoute = (options = {}) => {
  return (req, res, next) => {
    // Verifica CORS avanzata per richieste non-GET
    if (req.method !== 'GET') {
      const origin = req.get('origin');
      if (!origin || !process.env.ALLOWED_ORIGINS.split(',').includes(origin)) {
        return res.status(403).json({
          status: 'error',
          message: 'Invalid origin'
        });
      }
    }

    // Verifica content-type per richieste con body
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return res.status(400).json({
          status: 'error',
          message: 'Content-Type must be application/json'
        });
      }
    }

    // Aggiunge headers di sicurezza
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    // Se richiesto, verifica che la richiesta sia HTTPS
    if (options.requireHttps && !req.secure) {
      return res.status(403).json({
        status: 'error',
        message: 'HTTPS required'
      });
    }

    next();
  };
};

module.exports = secureRoute;