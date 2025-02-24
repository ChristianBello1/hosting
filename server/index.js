// server/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { seedDemoData, resetDemoData } = require('./seed/demoData');

const { 
  sanitizeBody, 
  sanitizeParams, 
  sanitizeQuery, 
  mongoSanitize 
} = require('./middleware/sanitization');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const monitoringRoutes = require('./routes/monitoring');
const fileRoutes = require('./routes/fileRoutes');
const backupRoutes = require('./routes/backupRoutes');

const app = express();

// Configurazione trust proxy per Render
app.set('trust proxy', 1);

// Configurazione base per i rate limiter
const limiterConfig = {
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // limite di richieste per finestra
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  }
};

// Rate limiters
const apiLimiter = rateLimit({
  ...limiterConfig,
  max: 100 // Limite per le API generiche
});

const authLimiter = rateLimit({
  ...limiterConfig,
  windowMs: 60 * 60 * 1000, // 1 ora
  max: 5 // Limite più basso per i tentativi di login
});

const sensitiveRouteLimiter = rateLimit({
  ...limiterConfig,
  windowMs: 60 * 60 * 1000, // 1 ora
  max: 3 // Limite molto basso per le route sensibili
});

const monitoringLimiter = rateLimit({
  ...limiterConfig,
  max: 300 // Limite più alto per il monitoring
});

// Definizione origini consentite
const allowedOrigins = [
  'https://cliente-sigma.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

if (process.env.ADDITIONAL_ORIGINS) {
  allowedOrigins.push(...process.env.ADDITIONAL_ORIGINS.split(','));
}

// Funzione per identificare i health checks
const isHealthCheck = (req) => {
  return (
    req.headers['user-agent']?.includes('Render') ||
    req.headers['user-agent']?.includes('Go-http-client') ||
    req.path.includes('/health')
  );
};

// Middleware di logging
const logMiddleware = (req, res, next) => {
  req._startTime = Date.now();
  
  if (!isHealthCheck(req)) {
    const requestInfo = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl || req.url,
      path: req.path,
      query: req.query,
      ip: req.ip,
      headers: {
        origin: req.get('origin'),
        referer: req.get('referer'),
        'user-agent': req.get('user-agent'),
        host: req.get('host'),
        'content-type': req.get('content-type'),
        authorization: req.headers.authorization ? 'Present' : 'None'
      }
    };

    if (req.method !== 'GET') {
      requestInfo.body = req.body;
    }

    console.log('\n=== INCOMING REQUEST ===');
    console.log(JSON.stringify(requestInfo, null, 2));

    // Monitor response
    const originalSend = res.send;
    res.send = function(data) {
      const duration = Date.now() - req._startTime;
      
      console.log('\n=== OUTGOING RESPONSE ===');
      console.log({
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`
      });
      
      return originalSend.apply(res, arguments);
    };
  }

  next();
};

// Configurazione CORS
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Middleware di base
app.use(cors(corsOptions));
app.use(express.json());
app.use(logMiddleware);

// Middleware di sicurezza
app.use(mongoSanitize);
app.use(sanitizeBody);
app.use(sanitizeParams);
app.use(sanitizeQuery);

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Root routes
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Cliente API Server - DEMO VERSION',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      files: '/api/files',
      monitoring: '/api/monitoring'
    }
  });
});

app.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Cliente API v1 - DEMO VERSION',
    docs: '/api/docs'
  });
});

// Reset demo data (solo per la versione demo)
app.post('/api/reset-demo', async (req, res) => {
  try {
    await resetDemoData();
    res.json({ 
      success: true, 
      message: 'Demo data reset successfully' 
    });
  } catch (error) {
    console.error('Error resetting demo data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error resetting demo data' 
    });
  }
});

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', sensitiveRouteLimiter);
app.use('/api/auth/reset-password', sensitiveRouteLimiter);
app.use('/api/monitoring', monitoringLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/backup', backupRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const healthCheck = {
    status: 'operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    mode: 'DEMO',
    services: {
      api: 'up',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    }
  };

  if (!isHealthCheck(req) || !global.firstHealthCheckLogged) {
    console.log('Health Check:', {
      ...healthCheck,
      userAgent: req.get('user-agent')
    });
    global.firstHealthCheckLogged = true;
  }

  res.json(healthCheck);
});

// 404 handler
app.use((req, res) => {
  const response = {
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  };

  if (!isHealthCheck(req)) {
    console.log('404 Not Found:', response);
  }
  
  res.status(404).json(response);
});

// Error handling
app.use(errorHandler);

// Global error handler
app.use((err, req, res, next) => {
  const errorResponse = {
    status: 'error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    path: req.path,
    timestamp: new Date().toISOString()
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  if (!isHealthCheck(req)) {
    console.error('Global error handler:', {
      ...errorResponse,
      stack: err.stack
    });
  }

  res.status(err.status || 500).json(errorResponse);
});

// Uncaught exception handler
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', {
    error: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });

  if (process.env.NODE_ENV === 'production') {
    // Implement production error notification here
  }
});

// Unhandled rejection handler
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', {
    error: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal. Performing graceful shutdown...');
  
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 5000;

// Database connection and server start
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log('Connected to MongoDB');
      
      // Seed demo data
      try {
        await seedDemoData();
        console.log('Initial demo data seeding completed');
      } catch (error) {
        console.error('Error seeding demo data:', error);
      }
      
      // Reset demo data periodicamente (ogni 24 ore)
      const RESET_INTERVAL = 24 * 60 * 60 * 1000; // 24 ore
      setInterval(async () => {
        try {
          await resetDemoData();
          console.log('Scheduled demo data reset completed');
        } catch (error) {
          console.error('Error during scheduled demo data reset:', error);
        }
      }, RESET_INTERVAL);
      
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode (DEMO VERSION)`);
        console.log('CORS configured for origins:', allowedOrigins);
      });
    })
    .catch(err => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });
}

module.exports = app;