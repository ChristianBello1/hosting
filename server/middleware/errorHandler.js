// server/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Errori di validazione Mongoose
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  // Errori di duplicati Mongoose
  if (err.code === 11000) {
    return res.status(409).json({
      message: 'Duplicate Entry',
      field: Object.keys(err.keyPattern)[0]
    });
  }

  // Errori di Cast Mongoose (es. ObjectId invalido)
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: 'Invalid ID format'
    });
  }

  // Errori JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token expired'
    });
  }

  // Errori personalizzati
  if (err.status) {
    return res.status(err.status).json({
      message: err.message
    });
  }

  // Errore generico del server
  return res.status(500).json({
    message: 'Internal Server Error'
  });
};

module.exports = errorHandler;