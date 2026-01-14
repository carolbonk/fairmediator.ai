/**
 * Error Monitoring Middleware
 * Replaces Sentry with MongoDB-based error tracking
 */

const mongoMonitoring = require('../services/monitoring/mongoMonitoring');
const logger = require('../config/logger');

/**
 * Express error monitoring middleware
 * Logs errors to MongoDB and Winston
 */
function errorMonitoringMiddleware(err, req, res, next) {
  // Log to Winston (files + console)
  logger.error('Express error:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id
  });

  // Log to MongoDB for monitoring dashboard
  mongoMonitoring.logError(err, {
    req,
    userId: req.user?.id,
    sessionId: req.session?.id
  }).catch(logErr => {
    logger.warn('Failed to log error to MongoDB:', logErr);
  });

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(err.statusCode || err.status || 500).json({
    success: false,
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
}

/**
 * Async error handler wrapper
 * Catches async errors and passes them to error middleware
 */
function asyncErrorHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Not found handler (404)
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
}

module.exports = {
  errorMonitoringMiddleware,
  asyncErrorHandler,
  notFoundHandler
};
