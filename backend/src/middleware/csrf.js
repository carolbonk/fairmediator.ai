/**
 * CSRF Protection Middleware
 * Protects against Cross-Site Request Forgery attacks
 */

const csurf = require('csurf');
const logger = require('../config/logger');

// Configure CSRF protection
// Using cookie-based tokens for stateless JWT authentication
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600000 // 1 hour
  }
});

/**
 * CSRF error handler middleware
 */
const csrfErrorHandler = (err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') {
    return next(err);
  }

  // Log CSRF violation
  logger.security.csrfViolation(
    req.ip || req.connection.remoteAddress,
    {
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('user-agent'),
      userId: req.user?._id
    }
  );

  // Handle invalid CSRF token
  res.status(403).json({
    error: 'Invalid CSRF token',
    message: 'Form submission failed. Please refresh the page and try again.'
  });
};

/**
 * Endpoint to get CSRF token
 * GET /api/csrf-token
 */
const getCsrfToken = (req, res) => {
  res.json({
    success: true,
    csrfToken: req.csrfToken()
  });
};

module.exports = {
  csrfProtection,
  csrfErrorHandler,
  getCsrfToken
};
