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
const compression = require('compression');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const logger = require('./config/logger');
const { sanitizeInput, mongoSanitizeMiddleware } = require('./middleware/sanitization');
const { csrfProtection, csrfErrorHandler, getCsrfToken} = require('./middleware/csrf');
const { globalLimiter } = require('./middleware/rateLimiting');
const { errorMonitoringMiddleware, notFoundHandler } = require('./middleware/errorMonitoring');

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
const feedbackRoutes = require('./routes/feedback');
const agentRoutes = require('./routes/agents');
const chainRoutes = require('./routes/chains');
const perspectiveRoutes = require('./routes/perspectives');
const idpRoutes = require('./routes/idp');
const qaRoutes = require('./routes/qa');
const monitoringRoutes = require('./routes/monitoring');
const storageRoutes = require('./routes/storage');
const modelsRoutes = require('./routes/models');
const conflictRoutes = require('./graph_analyzer/api/conflict_routes');
const graphRoutes = require('./routes/graph'); // Simplified graph routes for frontend
const settlementRoutes = require('./routes/settlement');
const settlementWrapperRoutes = require('./routes/settlement_wrapper'); // Simplified settlement predictor
const dataPopulationRoutes = require('./routes/dataPopulation'); // Data population status API
const alertsRoutes = require('./routes/alerts'); // ConflictAlerts system

// Import cron scheduler and free tier monitor
const cronScheduler = require('./services/scraping/cronScheduler');
const { monitor } = require('./utils/freeTierMonitor');

const app = express();
const PORT = process.env.PORT || 5001;

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
// Reject wildcard origin when credentials: true is set (would be rejected by browsers anyway,
// but we prevent the misconfiguration at the server level for defense-in-depth).
const rawCorsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
const corsOrigin = rawCorsOrigin === '*'
  ? (() => { logger.warn('[Security] CORS_ORIGIN=* is unsafe with credentials; falling back to localhost'); return 'http://localhost:3000'; })()
  : rawCorsOrigin;

app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // 10 minutes
}));

// Compression middleware - gzip responses for better performance
app.use(compression({
  // Only compress responses larger than 1kb
  threshold: 1024,
  // Compression level (0-9, 6 is default balance)
  level: 6
}));

// Body parsing middleware (must come before CSRF)
// 100kb is generous for chat history and typical JSON payloads.
// File uploads go through multer (analysis: 1MB, storage: 10MB) and bypass this limit.
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
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
    req.path === '/api/csrf-token' ||
    // AI API routes - exempt for testing and programmatic access
    req.path.startsWith('/api/agents') ||
    req.path.startsWith('/api/chains') ||
    req.path.startsWith('/api/perspectives') ||
    req.path.startsWith('/api/idp') ||
    req.path.startsWith('/api/qa')
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
  .then(async () => {
    logger.info('MongoDB connected successfully');

    // Restore today's free tier quota counts from MongoDB after restart
    await monitor.initFromDB();
  })
  .catch(err => {
    logger.error('MongoDB connection error', { error: err.message, stack: err.stack });
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
app.use('/api/feedback', feedbackRoutes);
app.use('/api/agents', agentRoutes); // AI Agent system - autonomous task execution
app.use('/api/chains', chainRoutes); // AI Chain system - multi-step workflows
app.use('/api/perspectives', perspectiveRoutes); // Multi-perspective AI - balanced mediation
app.use('/api/idp', idpRoutes); // Intelligent Document Processing - PDF/text extraction
app.use('/api/qa', qaRoutes); // Quality Assurance - automated validation
app.use('/api/monitoring', monitoringRoutes); // Free tier monitoring dashboard + MongoDB Atlas monitoring
app.use('/api/storage', storageRoutes); // File storage with Netlify Blobs (images, documents)
app.use('/api/models', modelsRoutes); // AI model versioning, metrics, and active learning
app.use('/api/graph', graphRoutes); // Simplified graph API for frontend conflict checking
app.use('/api/alerts', alertsRoutes); // ConflictAlerts — per-user notifications
app.use('/api/graph/admin', conflictRoutes); // Advanced graph admin routes (scraping, entity management)
app.use('/api/settlement', settlementWrapperRoutes); // Simplified settlement predictor for general mediation
app.use('/api/settlement/fca', settlementRoutes); // Advanced FCA settlement predictor (ML-based)
app.use('/api/data-population', dataPopulationRoutes); // Data population status and progress tracking

// CSRF error handler
app.use(csrfErrorHandler);

// Error logging middleware
app.use(logger.errorLogger);

// MongoDB error monitoring middleware (replaces Sentry)
app.use(errorMonitoringMiddleware);

// 404 handler
app.use(notFoundHandler);

// Detect serverless environment
const isServerless = process.env.AWS_LAMBDA_FUNCTION_NAME ||
                     process.env.NETLIFY ||
                     process.env.VERCEL;

// Start server (only if not in test mode AND not in serverless)
if (process.env.NODE_ENV !== 'test' && !isServerless) {
  app.listen(PORT, async () => {
    logger.info(`FairMediator backend running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`AI: ${process.env.HUGGINGFACE_API_KEY ? 'Hugging Face configured' : 'Not configured'}`);

    // Only start cron jobs in production AND non-serverless environments
    if (process.env.NODE_ENV === 'production' && !isServerless) {
      cronScheduler.startAll();
    }
  });
}

module.exports = app;
