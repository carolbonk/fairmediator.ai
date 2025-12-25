/**
 * Per-Endpoint Rate Limiting Configuration
 * Implements strict rate limits for different endpoint types
 */

const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

/**
 * Rate limit handler - logs violations
 */
const rateLimitHandler = (req, res) => {
  logger.security.rateLimitExceeded(
    req.ip || req.connection.remoteAddress,
    req.originalUrl,
    {
      method: req.method,
      userAgent: req.get('user-agent'),
      userId: req.user?._id
    }
  );

  res.status(429).json({
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: res.getHeader('Retry-After')
  });
};

/**
 * Global API rate limiter
 * 100 requests per 15 minutes per IP
 */
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

/**
 * Authentication endpoints rate limiter
 * 5 requests per 15 minutes per IP (strict for login/register)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  skipSuccessfulRequests: false, // Count all requests
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

/**
 * Password reset rate limiter
 * 3 requests per hour per IP
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  skipSuccessfulRequests: true, // Only count failed requests
  message: 'Too many password reset attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

/**
 * Email verification rate limiter
 * 3 requests per 10 minutes per IP
 */
const emailVerificationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3,
  message: 'Too many email verification requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

/**
 * Search endpoints rate limiter
 * 30 requests per minute per IP
 */
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  skipSuccessfulRequests: false,
  message: 'Too many search requests, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

/**
 * AI/Chat endpoints rate limiter
 * 10 requests per minute per IP (expensive operations)
 */
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  skipSuccessfulRequests: false,
  message: 'Too many AI requests, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

/**
 * File upload rate limiter
 * 5 uploads per 15 minutes per IP
 */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  skipSuccessfulRequests: false,
  message: 'Too many file uploads, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

/**
 * Admin endpoints rate limiter
 * 20 requests per minute per IP
 */
const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  skipSuccessfulRequests: false,
  message: 'Too many admin requests, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

/**
 * Dynamic rate limiter based on user tier
 * Premium users get higher limits
 */
const createDynamicLimiter = (freeTierMax, premiumTierMax, windowMs) => {
  return rateLimit({
    windowMs,
    max: (req) => {
      if (req.user && req.user.subscriptionTier === 'premium') {
        return premiumTierMax;
      }
      return freeTierMax;
    },
    skipSuccessfulRequests: false,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      return req.user?._id?.toString() || req.ip;
    }
  });
};

module.exports = {
  globalLimiter,
  authLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  searchLimiter,
  aiLimiter,
  uploadLimiter,
  adminLimiter,
  createDynamicLimiter
};
