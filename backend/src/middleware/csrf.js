/**
 * CSRF Protection Middleware
 * Protects against Cross-Site Request Forgery attacks
 *
 * Using csrf-csrf package (modern, secure alternative to deprecated csurf)
 * Implements Double Submit Cookie pattern with signed tokens
 */

const { doubleCsrf } = require('csrf-csrf');
const logger = require('../config/logger');

// Configure CSRF protection with csrf-csrf
// Uses double submit cookie pattern with signed tokens
const {
  generateToken, // Generates a CSRF token pair
  doubleCsrfProtection, // Middleware to validate CSRF tokens
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || process.env.SESSION_SECRET,
  cookieName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600000, // 1 hour
    path: '/'
  },
  size: 64, // Token size in bytes
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'], // Methods that don't require CSRF
  getTokenFromRequest: (req) => {
    // Check multiple places for CSRF token
    return req.headers['x-csrf-token'] ||
           req.headers['x-xsrf-token'] ||
           req.body?._csrf ||
           req.query?._csrf;
  }
});

/**
 * CSRF protection middleware
 * Apply to routes that need CSRF protection (POST, PUT, DELETE, PATCH)
 */
const csrfProtection = doubleCsrfProtection;

/**
 * CSRF error handler middleware
 * Enhanced error logging and user-friendly messages
 */
const csrfErrorHandler = (err, req, res, next) => {
  // Check if error is CSRF-related
  if (err.code === 'EBADCSRFTOKEN' || err.message?.includes('csrf') || err.message?.includes('CSRF')) {
    // Log CSRF violation
    logger.security.csrfViolation(
      req.ip || req.connection.remoteAddress,
      {
        method: req.method,
        url: req.originalUrl,
        userAgent: req.get('user-agent'),
        userId: req.user?._id,
        error: err.message
      }
    );

    // Handle invalid CSRF token
    return res.status(403).json({
      error: 'Invalid CSRF token',
      message: 'Form submission failed. Please refresh the page and try again.',
      code: 'CSRF_VALIDATION_FAILED'
    });
  }

  // Not a CSRF error, pass to next error handler
  next(err);
};

/**
 * Endpoint to get CSRF token
 * GET /api/csrf-token
 *
 * Generates and returns a CSRF token for the client
 */
const getCsrfToken = (req, res) => {
  try {
    const token = generateToken(req, res);

    res.json({
      success: true,
      csrfToken: token,
      // Also set in response header for convenience
      _meta: {
        cookieName: 'x-csrf-token',
        headerName: 'x-csrf-token'
      }
    });
  } catch (error) {
    logger.error('Failed to generate CSRF token', { error: error.message });
    res.status(500).json({
      error: 'Failed to generate CSRF token',
      message: 'Please try again later'
    });
  }
};

/**
 * Middleware to inject CSRF token into response for all requests
 * Useful for SPA applications
 */
const injectCsrfToken = (req, res, next) => {
  try {
    // Generate token for the response
    const token = generateToken(req, res);

    // Add to response locals so templates/responses can access it
    res.locals.csrfToken = token;

    next();
  } catch (error) {
    logger.error('Failed to inject CSRF token', { error: error.message });
    next(); // Continue even if token generation fails
  }
};

module.exports = {
  csrfProtection,
  csrfErrorHandler,
  getCsrfToken,
  generateToken,
  injectCsrfToken
};
