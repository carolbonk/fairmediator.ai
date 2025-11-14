/**
 * Error Handling Middleware
 * Centralized error handling with Sentry integration
 */

const Sentry = require('@sentry/node');

/**
 * Custom error classes
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400, true);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, true);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, true);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, true);
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, true);
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500, false);
  }
}

/**
 * Error logger
 * Logs errors and sends to Sentry if configured
 */
const logError = (err, req) => {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Details:', {
      name: err.name,
      message: err.message,
      statusCode: err.statusCode,
      stack: err.stack,
      path: req?.path,
      method: req?.method,
      ip: req?.ip,
    });
  }

  // Send to Sentry if configured and it's a non-operational error
  if (process.env.SENTRY_DSN && (!err.isOperational || err.statusCode >= 500)) {
    Sentry.withScope((scope) => {
      // Add request context
      if (req) {
        scope.setContext('request', {
          method: req.method,
          url: req.originalUrl,
          headers: {
            'user-agent': req.headers['user-agent'],
            'content-type': req.headers['content-type'],
          },
          ip: req.ip,
          query: req.query,
        });

        // Add user context if available
        if (req.user) {
          scope.setUser({
            id: req.user._id,
            email: req.user.email,
            tier: req.user.subscriptionTier,
          });
        }
      }

      // Add error context
      scope.setTag('error_type', err.name);
      scope.setLevel(err.statusCode >= 500 ? 'error' : 'warning');

      Sentry.captureException(err);
    });
  }
};

/**
 * Determine if error is operational
 */
const isOperationalError = (error) => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

/**
 * Convert error to client-safe response
 */
const getErrorResponse = (err, isDevelopment = false) => {
  const response = {
    error: {
      message: err.message || 'An unexpected error occurred',
      type: err.name || 'Error',
    },
  };

  // Add status code if it's an AppError
  if (err.statusCode) {
    response.error.code = err.statusCode;
  }

  // Add stack trace in development
  if (isDevelopment && err.stack) {
    response.error.stack = err.stack;
  }

  // Add validation details if it's a validation error
  if (err.details) {
    response.error.details = err.details;
  }

  return response;
};

/**
 * Main error handling middleware
 * Must be last middleware in the chain
 */
const errorHandler = (err, req, res, next) => {
  // Set default status code
  err.statusCode = err.statusCode || 500;

  // Log the error
  logError(err, req);

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError' && err.errors) {
    err.statusCode = 400;
    err.message = 'Validation failed';
    err.details = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    err.statusCode = 400;
    const field = Object.keys(err.keyPattern)[0];
    err.message = `${field} already exists`;
  }

  // Handle Mongoose cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    err.statusCode = 400;
    err.message = `Invalid ${err.path}: ${err.value}`;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    err.statusCode = 401;
    err.message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    err.statusCode = 401;
    err.message = 'Token expired';
  }

  // Send response
  const isDevelopment = process.env.NODE_ENV === 'development';
  const response = getErrorResponse(err, isDevelopment);

  res.status(err.statusCode).json(response);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`);
  next(error);
};

/**
 * Handle unhandled promise rejections
 */
const handleUnhandledRejection = (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);

  // Send to Sentry
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(reason);
  }

  // Exit gracefully in production (let process manager restart)
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
};

/**
 * Handle uncaught exceptions
 */
const handleUncaughtException = (error) => {
  console.error('Uncaught Exception:', error);

  // Send to Sentry
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error);
  }

  // Exit immediately - app is in undefined state
  process.exit(1);
};

module.exports = {
  // Error classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  DatabaseError,

  // Middleware
  errorHandler,
  asyncHandler,
  notFoundHandler,

  // Utilities
  logError,
  isOperationalError,

  // Process handlers
  handleUnhandledRejection,
  handleUncaughtException,
};
