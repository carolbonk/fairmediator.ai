/**
 * Authentication Middleware
 * JWT-based authentication and authorization
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AuthenticationError, AuthorizationError } = require('./errorHandler');

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Get user from database
    const user = await User.findById(decoded.userId).select('+passwordHash');

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Check if user is active
    if (user.status === 'suspended' || user.status === 'deleted') {
      throw new AuthenticationError('Account is not active');
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AuthenticationError('Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      next(new AuthenticationError('Token expired'));
    } else {
      next(error);
    }
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.userId);

      if (user && user.status === 'active') {
        req.user = user;
        req.userId = user._id;
      }
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

/**
 * Check if user has a specific subscription tier
 */
const requireTier = (...allowedTiers) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    if (!allowedTiers.includes(req.user.subscriptionTier)) {
      return next(
        new AuthorizationError(
          `This feature requires ${allowedTiers.join(' or ')} subscription`
        )
      );
    }

    next();
  };
};

/**
 * Check if user has reached their usage limit
 */
const checkUsageLimit = (limitType) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    // Premium users have unlimited access
    if (req.user.subscriptionTier === 'premium') {
      return next();
    }

    // Check specific limit
    let hasReachedLimit = false;
    let limitName = '';

    switch (limitType) {
      case 'search':
        hasReachedLimit = req.user.hasReachedSearchLimit();
        limitName = 'daily search';
        break;
      case 'profileView':
        hasReachedLimit = req.user.hasReachedProfileViewLimit();
        limitName = 'daily profile view';
        break;
      case 'aiCall':
        hasReachedLimit = req.user.hasReachedAICallLimit();
        limitName = 'daily AI call';
        break;
      default:
        return next(new Error('Invalid limit type'));
    }

    if (hasReachedLimit) {
      return next(
        new AuthorizationError(
          `You have reached your ${limitName} limit. Upgrade to premium for unlimited access.`
        )
      );
    }

    next();
  };
};

/**
 * Generate JWT token
 */
const generateToken = (userId, expiresIn = '7d') => {
  return jwt.sign(
    { userId: userId.toString() },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn }
  );
};

/**
 * Generate refresh token (longer expiry)
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId: userId.toString(), type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    { expiresIn: '30d' }
  );
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'
    );

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded.userId;
  } catch (error) {
    throw new AuthenticationError('Invalid refresh token');
  }
};

/**
 * Rate limiting per user
 */
const userRateLimit = (maxRequests, windowMinutes) => {
  const requests = new Map();

  return (req, res, next) => {
    if (!req.userId) {
      return next();
    }

    const userId = req.userId.toString();
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;

    if (!requests.has(userId)) {
      requests.set(userId, []);
    }

    const userRequests = requests.get(userId);

    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => now - time < windowMs);

    if (validRequests.length >= maxRequests) {
      return next(
        new AuthorizationError(`Rate limit exceeded. Try again in ${windowMinutes} minutes.`)
      );
    }

    validRequests.push(now);
    requests.set(userId, validRequests);

    // Cleanup old entries periodically
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

module.exports = {
  authenticate,
  optionalAuth,
  requireTier,
  checkUsageLimit,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  userRateLimit,
};
