/**
 * Standardized API Response Handlers
 * DRY utility to eliminate duplicate response patterns across routes
 */

const logger = require('../config/logger');

/**
 * Send standardized error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Object} details - Additional error details
 */
const sendError = (res, statusCode, message, details = {}) => {
  const response = {
    success: false,
    error: message,
    ...details
  };

  // Log error responses (500 level errors)
  if (statusCode >= 500) {
    logger.error('Server error', {
      statusCode,
      message,
      details
    });
  }

  return res.status(statusCode).json(response);
};

/**
 * Send standardized success response
 * @param {Object} res - Express response object
 * @param {Object|Array} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {string} message - Optional success message
 */
const sendSuccess = (res, data, statusCode = 200, message = null) => {
  const response = {
    success: true,
    ...(message && { message }),
    ...(data && { data })
  };

  return res.status(statusCode).json(response);
};

/**
 * Send validation error response
 * @param {Object} res - Express response object
 * @param {Array|Object} errors - Validation errors
 */
const sendValidationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    error: 'Validation failed',
    errors: Array.isArray(errors) ? errors : [errors]
  });
};

/**
 * Send unauthorized error response
 * @param {Object} res - Express response object
 * @param {string} message - Custom message (default: 'Unauthorized')
 */
const sendUnauthorized = (res, message = 'Unauthorized') => {
  return res.status(401).json({
    success: false,
    error: message
  });
};

/**
 * Send forbidden error response
 * @param {Object} res - Express response object
 * @param {string} message - Custom message (default: 'Forbidden')
 */
const sendForbidden = (res, message = 'Forbidden') => {
  return res.status(403).json({
    success: false,
    error: message
  });
};

/**
 * Send not found error response
 * @param {Object} res - Express response object
 * @param {string} resource - Resource type (e.g., 'User', 'Mediator')
 */
const sendNotFound = (res, resource = 'Resource') => {
  return res.status(404).json({
    success: false,
    error: `${resource} not found`
  });
};

/**
 * Async route handler wrapper
 * Catches errors and passes to error middleware
 * @param {Function} fn - Async route handler function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  sendError,
  sendSuccess,
  sendValidationError,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  asyncHandler
};
