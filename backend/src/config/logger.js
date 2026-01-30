/**
 * Centralized Security Logging with Winston
 * Logs all security-relevant events for monitoring and audit trails
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  security: 5
};

// Define level colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
  security: 'cyan'
};

winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define JSON format for file logging
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');

// Detect serverless environment (Netlify Functions, AWS Lambda, etc.)
const isServerless = process.env.AWS_LAMBDA_FUNCTION_NAME ||
                     process.env.NETLIFY ||
                     process.env.VERCEL ||
                     (process.env.NODE_ENV === 'production' && !process.env.LOGS_ENABLED);

// Define transports
const transports = [
  // Console logging (always enabled)
  new winston.transports.Console({
    format: format,
    level: process.env.LOG_LEVEL || 'info'
  })
];

// Only add file transports in non-serverless environments
if (!isServerless) {
  transports.push(
    // Error logs - daily rotation
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: jsonFormat,
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true
    }),

    // Security events - daily rotation
    new DailyRotateFile({
      filename: path.join(logsDir, 'security-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'security',
      format: jsonFormat,
      maxSize: '20m',
      maxFiles: '90d', // Keep security logs for 90 days
      zippedArchive: true
    }),

    // Combined logs - daily rotation
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: jsonFormat,
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true
    }),

    // HTTP requests - daily rotation
    new DailyRotateFile({
      filename: path.join(logsDir, 'http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      format: jsonFormat,
      maxSize: '20m',
      maxFiles: '7d',
      zippedArchive: true
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  levels,
  transports,
  exitOnError: false
});

// Security event logger helper functions
logger.security = {
  /**
   * Log user authentication events
   */
  auth: (event, userId, metadata = {}) => {
    logger.log('security', `AUTH_${event}`, {
      event: `AUTH_${event}`,
      userId,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  },

  /**
   * Log failed login attempts
   */
  failedLogin: (email, ip, metadata = {}) => {
    logger.log('security', 'FAILED_LOGIN_ATTEMPT', {
      event: 'FAILED_LOGIN_ATTEMPT',
      email,
      ip,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  },

  /**
   * Log account lockout events
   */
  accountLocked: (userId, email, ip, metadata = {}) => {
    logger.log('security', 'ACCOUNT_LOCKED', {
      event: 'ACCOUNT_LOCKED',
      userId,
      email,
      ip,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  },

  /**
   * Log suspicious activity
   */
  suspicious: (type, userId, metadata = {}) => {
    logger.log('security', `SUSPICIOUS_${type}`, {
      event: `SUSPICIOUS_${type}`,
      userId,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  },

  /**
   * Log access control violations
   */
  accessDenied: (userId, resource, action, metadata = {}) => {
    logger.log('security', 'ACCESS_DENIED', {
      event: 'ACCESS_DENIED',
      userId,
      resource,
      action,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  },

  /**
   * Log data access/modifications
   */
  dataAccess: (userId, resource, action, metadata = {}) => {
    logger.log('security', 'DATA_ACCESS', {
      event: 'DATA_ACCESS',
      userId,
      resource,
      action,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  },

  /**
   * Log CSRF token violations
   */
  csrfViolation: (ip, metadata = {}) => {
    logger.log('security', 'CSRF_VIOLATION', {
      event: 'CSRF_VIOLATION',
      ip,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  },

  /**
   * Log rate limit violations
   */
  rateLimitExceeded: (ip, endpoint, metadata = {}) => {
    logger.log('security', 'RATE_LIMIT_EXCEEDED', {
      event: 'RATE_LIMIT_EXCEEDED',
      ip,
      endpoint,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  },

  /**
   * Log password changes
   */
  passwordChange: (userId, metadata = {}) => {
    logger.log('security', 'PASSWORD_CHANGED', {
      event: 'PASSWORD_CHANGED',
      userId,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  },

  /**
   * Log email verification events
   */
  emailVerification: (userId, email, status, metadata = {}) => {
    logger.log('security', 'EMAIL_VERIFICATION', {
      event: 'EMAIL_VERIFICATION',
      userId,
      email,
      status,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }
};

// HTTP request logger middleware
logger.httpLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      userId: req.user?._id
    };

    // Log security-relevant HTTP events
    if (res.statusCode >= 400) {
      logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, logData);
    }

    // Log all authentication-related requests
    if (req.originalUrl.includes('/auth/')) {
      logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, logData);
    }
  });

  next();
};

// Error logger middleware
logger.errorLogger = (err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?._id
  });
  next(err);
};

module.exports = logger;
