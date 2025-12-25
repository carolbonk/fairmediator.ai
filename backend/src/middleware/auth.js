/**
 * Authentication Middleware
 * Handles JWT token verification and subscription tier checks
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Validate JWT_SECRET is set
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

/**
 * Authenticate middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Require specific subscription tier
 * Use after authenticate middleware
 */
const requireTier = (tier) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const tierHierarchy = { free: 0, premium: 1 };
    const requiredLevel = tierHierarchy[tier];
    const userLevel = tierHierarchy[req.user.subscriptionTier];

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        error: `This feature requires a ${tier} subscription`,
        requiredTier: tier,
        currentTier: req.user.subscriptionTier
      });
    }

    next();
  };
};

/**
 * Optional authentication
 * Attaches user if token is present, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token, continue without user
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select('-password');
    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Token invalid, continue without user
    next();
  }
};

/**
 * Check usage limits
 * Verifies user hasn't exceeded their tier limits for a specific action
 */
const checkUsageLimit = (actionType) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Premium users have unlimited access
    if (req.user.subscriptionTier === 'premium') {
      return next();
    }

    // Check if user can perform action
    if (!req.user.canPerformAction(actionType)) {
      const limits = {
        search: 5,
        profileView: 10,
        aiCall: 20
      };

      return res.status(429).json({
        error: `Daily ${actionType} limit reached`,
        limit: limits[actionType],
        message: 'Upgrade to premium for unlimited access',
        upgradeUrl: '/upgrade'
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  requireTier,
  optionalAuth,
  checkUsageLimit
};
