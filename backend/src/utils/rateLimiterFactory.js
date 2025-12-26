/**
 * Rate Limiter Factory
 * DRY utility to eliminate duplicate rate limiter configuration
 */

const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

/**
 * Standardized rate limit handler
 * Logs when rate limits are exceeded
 */
const rateLimitHandler = (req, res) => {
  logger.security.auth('RATE_LIMIT_EXCEEDED', req.user?._id, {
    ip: req.ip,
    path: req.path,
    method: req.method
  });

  res.status(429).json({
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: res.getHeader('Retry-After')
  });
};

/**
 * Create a rate limiter with standardized configuration
 * @param {Object} options - Rate limiter options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum number of requests
 * @param {string} options.message - Error message
 * @param {boolean} options.skipSuccessfulRequests - Whether to skip counting successful requests
 * @param {Function} options.keyGenerator - Custom key generator function
 * @returns {Function} - Express rate limiter middleware
 */
const createRateLimiter = ({
  windowMs,
  max,
  message = 'Too many requests from this IP, please try again later',
  skipSuccessfulRequests = false,
  keyGenerator = null
}) => {
  const config = {
    windowMs,
    max,
    message,
    skipSuccessfulRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler
  };

  if (keyGenerator) {
    config.keyGenerator = keyGenerator;
  }

  return rateLimit(config);
};

/**
 * Pre-configured rate limiters for common use cases
 */
const rateLimiters = {
  // Global API rate limit: 100 requests per 15 minutes
  global: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later'
  }),

  // Authentication endpoints: 5 attempts per 15 minutes
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
    message: 'Too many login attempts, please try again later'
  }),

  // Registration: 3 accounts per hour
  registration: createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: 'Too many accounts created from this IP, please try again later'
  }),

  // Password reset: 3 attempts per hour
  passwordReset: createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: 'Too many password reset attempts, please try again later'
  }),

  // Email verification: 3 attempts per hour
  emailVerification: createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: 'Too many verification emails sent, please try again later'
  }),

  // Chat API: 30 messages per minute
  chat: createRateLimiter({
    windowMs: 60 * 1000,
    max: 30,
    message: 'Too many messages, please slow down'
  }),

  // Search: 60 searches per minute
  search: createRateLimiter({
    windowMs: 60 * 1000,
    max: 60,
    message: 'Too many searches, please try again later'
  }),

  // Subscription changes: 10 per hour
  subscription: createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: 'Too many subscription changes, please try again later'
  })
};

module.exports = {
  createRateLimiter,
  rateLimiters
};
