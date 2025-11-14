/**
 * Additional Security Middleware
 * Supplementary security measures beyond helmet.js
 */

const crypto = require('crypto');
const { RateLimitError } = require('./errorHandler');

/**
 * Content Security Policy (CSP) configuration
 * Prevents XSS and other injection attacks
 */
const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for React
    styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", 'https://api.huggingface.co'],
    fontSrc: ["'self'", 'data:'],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  },
};

/**
 * Request ID middleware
 * Adds unique ID to each request for tracing
 */
const requestId = (req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
};

/**
 * Request logger middleware
 * Logs all incoming requests
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log request
  console.log(`[${req.id}] ${req.method} ${req.path}`);

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${req.id}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
    );
  });

  next();
};

/**
 * Sanitize request body
 * Removes null bytes and other dangerous characters
 */
const sanitizeBody = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Recursively sanitize object
 */
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    if (typeof obj === 'string') {
      // Remove null bytes
      return obj.replace(/\0/g, '');
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip prototype pollution attempts
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    sanitized[key] = sanitizeObject(value);
  }

  return sanitized;
};

/**
 * NoSQL injection protection
 * Prevents MongoDB operator injection
 */
const noSQLInjectionProtection = (req, res, next) => {
  const checkObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return;

    for (const [key, value] of Object.entries(obj)) {
      // Check for MongoDB operators
      if (key.startsWith('$')) {
        throw new Error('Invalid character in request: MongoDB operators not allowed');
      }

      // Recursively check nested objects
      if (typeof value === 'object' && value !== null) {
        checkObject(value);
      }
    }
  };

  try {
    if (req.body) checkObject(req.body);
    if (req.query) checkObject(req.query);
    if (req.params) checkObject(req.params);
    next();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * IP-based rate limiting
 * Prevents abuse from single IP addresses
 */
const ipRateLimit = (maxRequests = 100, windowMinutes = 15) => {
  const requests = new Map();
  const windowMs = windowMinutes * 60 * 1000;

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!requests.has(ip)) {
      requests.set(ip, []);
    }

    const ipRequests = requests.get(ip);

    // Remove old requests
    const validRequests = ipRequests.filter(time => now - time < windowMs);

    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil((validRequests[0] + windowMs - now) / 1000),
      });
    }

    validRequests.push(now);
    requests.set(ip, validRequests);

    // Cleanup periodically
    if (Math.random() < 0.01) {
      for (const [key, value] of requests.entries()) {
        if (value.every(time => now - time > windowMs)) {
          requests.delete(key);
        }
      }
    }

    next();
  };
};

/**
 * CORS options for production
 */
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',');

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (process.env.NODE_ENV === 'development') {
      // Allow all origins in development
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400, // 24 hours
};

/**
 * Secure headers configuration
 */
const secureHeaders = {
  contentSecurityPolicy: cspConfig,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
};

/**
 * Request size limiter
 * Prevents large payload attacks
 */
const requestSizeLimit = (maxSizeKB = 100) => {
  return (req, res, next) => {
    const contentLength = req.get('content-length');

    if (contentLength && parseInt(contentLength) > maxSizeKB * 1024) {
      return res.status(413).json({
        error: `Request too large. Maximum size is ${maxSizeKB}KB`,
      });
    }

    next();
  };
};

/**
 * Slow request detector
 * Logs slow requests for optimization
 */
const slowRequestDetector = (thresholdMs = 1000) => {
  return (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;

      if (duration > thresholdMs) {
        console.warn(`[SLOW] ${req.method} ${req.path} took ${duration}ms`);
      }
    });

    next();
  };
};

/**
 * API key validation (for future API access)
 */
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  // Validate API key format
  if (!/^fm_[a-zA-Z0-9]{32}$/.test(apiKey)) {
    return res.status(401).json({ error: 'Invalid API key format' });
  }

  // TODO: Validate against database
  // For now, just check format

  next();
};

/**
 * Prevent parameter pollution
 */
const preventParameterPollution = (whitelist = []) => {
  return (req, res, next) => {
    for (const [key, value] of Object.entries(req.query)) {
      if (Array.isArray(value) && !whitelist.includes(key)) {
        req.query[key] = value[0]; // Take first value only
      }
    }
    next();
  };
};

module.exports = {
  requestId,
  requestLogger,
  sanitizeBody,
  noSQLInjectionProtection,
  ipRateLimit,
  corsOptions,
  secureHeaders,
  requestSizeLimit,
  slowRequestDetector,
  validateApiKey,
  preventParameterPollution,
  cspConfig,
};
