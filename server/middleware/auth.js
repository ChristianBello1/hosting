// server/middleware/auth.js
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  // Permetti le richieste OPTIONS per il CORS
  if (req.method === 'OPTIONS') {
    return res.status(200)
      .set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Max-Age': '86400'
      })
      .end();
  }

  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('Auth failed: No token provided');
      return res.status(401).json({ message: 'No authentication token, authorization denied' });
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    console.log('Auth successful for user:', verified.id);
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    res.status(401).json({ message: 'Token verification failed, authorization denied' });
  }
};

module.exports = auth;