/**
 * FairMediator Backend Server
 * Main entry point for the Express API server
 */

require('dotenv').config();

// Validate environment variables before starting server
const { validateEnv } = require('./config/validateEnv');
validateEnv();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const logger = require('./config/logger');
const { sanitizeInput, mongoSanitizeMiddleware } = require('./middleware/sanitization');
const { csrfProtection, csrfErrorHandler, getCsrfToken} = require('./middleware/csrf');
const { globalLimiter } = require('./middleware/rateLimiting');
const { initializeSentry, requestHandler, tracingHandler, errorHandler: sentryErrorHandler } = require('./config/sentry');

// Import routes
const authRoutes = require('./routes/auth');
const mediatorRoutes = require('./routes/mediators');
const chatRoutes = require('./routes/chat');
const affiliationRoutes = require('./routes/affiliations');
const subscriptionRoutes = require('./routes/subscription');
const dashboardRoutes = require('./routes/dashboard');
const scrapingRoutes = require('./routes/scraping');
const matchingRoutes = require('./routes/matching');
const analysisRoutes = require('./routes/analysis');
const learningRoutes = require('./routes/learning');
const stateMediationRoutes = require('./routes/stateMediation');

// Import cron scheduler
const cronScheduler = require('./services/scraping/cronScheduler');

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize Sentry (must be first)
const Sentry = initializeSentry(app);

// Sentry request handler (must be first middleware)
if (Sentry) {
  app.use(requestHandler());
  app.use(tracingHandler());
}

// HTTPS Enforcement (production only)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // Check if request is HTTPS
    const isHttps = req.secure ||
                    req.get('x-forwarded-proto') === 'https' ||
                    req.get('x-forwarded-ssl') === 'on';

    if (!isHttps) {
      return res.redirect(301, `https://${req.hostname}${req.url}`);
    }
    next();
  });
}

// Enhanced Security Headers with Helmet
app.use(helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind requires unsafe-inline
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api-inference.huggingface.co"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  // Prevent clickjacking
  frameguard: {
    action: 'deny'
  },
  // Prevent MIME type sniffing
  noSniff: true,
  // XSS Protection (legacy browsers)
  xssFilter: true,
  // Hide X-Powered-By header
  hidePoweredBy: true,
  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },
  // Permissions Policy
  permissionsPolicy: {
    features: {
      geolocation: ["'none'"],
      microphone: ["'none'"],
      camera: ["'none'"],
      payment: ["'none'"]
    }
  }
}));

// CORS Configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // 10 minutes
}));

// Body parsing middleware (must come before CSRF)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// HTTP request logging
app.use(logger.httpLogger);

// Input sanitization (XSS & MongoDB injection protection)
app.use(sanitizeInput);
app.use(mongoSanitizeMiddleware);

// Global rate limiting
app.use('/api/', globalLimiter);

// CSRF protection (applies to state-changing operations)
// Note: CSRF token endpoint must be accessible without CSRF check
app.get('/api/csrf-token', csrfProtection, getCsrfToken);

// Apply CSRF protection to all POST, PUT, DELETE, PATCH requests
app.use((req, res, next) => {
  // Skip CSRF for specific routes or methods
  if (
    req.method === 'GET' ||
    req.method === 'HEAD' ||
    req.method === 'OPTIONS' ||
    req.path.startsWith('/health') ||
    req.path === '/api/csrf-token'
  ) {
    return next();
  }

  // Apply CSRF protection to state-changing operations
  return csrfProtection(req, res, next);
});

// MongoDB connection with enhanced security
const mongooseOptions = {
  // Connection pool settings
  maxPoolSize: 10,
  minPoolSize: 2,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
  // Security settings
  retryWrites: true,
  retryReads: true,
  // TLS/SSL (enable in production with Atlas)
  ...(process.env.MONGODB_URI.includes('mongodb+srv') && {
    tls: true,
    tlsAllowInvalidCertificates: false,
    tlsAllowInvalidHostnames: false
  })
};

// Connect to MongoDB (skip in test mode - tests use MongoDB Memory Server)
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGODB_URI, mongooseOptions)
  .then(() => {
    logger.info('MongoDB connected successfully');
    console.log('MongoDB connected successfully');
  })
  .catch(err => {
    logger.error('MongoDB connection error', { error: err.message, stack: err.stack });
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    ai: process.env.HUGGINGFACE_API_KEY ? 'configured' : 'not configured'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/mediators', mediatorRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/affiliations', affiliationRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/scraping', scrapingRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/state-mediation', stateMediationRoutes);

// Sentry error handler (must be before other error handlers)
if (Sentry) {
  app.use(sentryErrorHandler());
}

// CSRF error handler
app.use(csrfErrorHandler);

// Error logging middleware
app.use(logger.errorLogger);

// General error handling middleware
app.use((err, req, res, _next) => {
  // Log the error
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?._id
  });

  // Don't leak error details in production
  const errorResponse = {
    error: {
      message: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  };

  res.status(err.status || 500).json(errorResponse);
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server (only if not in test mode)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`FairMediator backend running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`AI: ${process.env.HUGGINGFACE_API_KEY ? 'Hugging Face configured' : 'Not configured'}`);

    if (process.env.NODE_ENV === 'production') {
      cronScheduler.startAll();
    }
  });
}

module.exports = app;
