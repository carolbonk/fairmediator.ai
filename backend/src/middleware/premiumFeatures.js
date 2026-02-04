/**
 * Premium Features Middleware
 * Gates premium features based on subscription tier
 *
 * Subscription Tiers:
 * - FREE: Basic mediator search (10 searches/month)
 * - PREMIUM ($49/mo): Unlimited searches + conflict detection + advanced filters
 */

const Subscription = require('../models/Subscription');
const logger = require('../config/logger');

// Feature limits for free tier
const FREE_TIER_LIMITS = {
  searchesPerMonth: 10,
  conflictChecksPerMonth: 0, // Premium only
  exportLimit: 0,            // Premium only
  advancedFilters: false     // Premium only
};

/**
 * Check if user has active premium subscription
 * @param {object} user - User object from req.user
 * @returns {Promise<boolean>} True if premium active
 */
async function hasPremiumSubscription(user) {
  if (!user) return false;

  try {
    const subscription = await Subscription.findOne({
      user: user._id,
      status: 'active'
    });

    if (!subscription) return false;

    // Check if subscription period is still valid
    return subscription.isActive();
  } catch (error) {
    logger.error('Premium subscription check failed', {
      userId: user._id,
      error: error.message
    });
    return false;
  }
}

/**
 * Require premium subscription to access route
 * @returns {Function} Express middleware
 */
const requirePremium = () => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to access premium features'
      });
    }

    const isPremium = await hasPremiumSubscription(req.user);

    if (!isPremium) {
      logger.security.accessDenied(
        req.user._id,
        req.originalUrl,
        'premium_required',
        {
          feature: req.path,
          method: req.method
        }
      );

      return res.status(403).json({
        error: 'Premium subscription required',
        message: 'This feature is only available to premium subscribers',
        upgradeUrl: '/api/subscriptions/checkout',
        pricing: {
          monthly: '$49/month',
          features: [
            'Unlimited mediator searches',
            'RECAP conflict detection',
            'Advanced filters (ideology, win rate)',
            'Export to CSV',
            'Priority support'
          ]
        }
      });
    }

    // Add premium flag to request for downstream use
    req.isPremium = true;
    next();
  };
};

/**
 * Check usage limits for free tier
 * @param {string} featureType - Type of feature ('search', 'conflict_check', 'export')
 * @returns {Function} Express middleware
 */
const checkUsageLimit = (featureType) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Premium users have no limits
    const isPremium = await hasPremiumSubscription(req.user);
    if (isPremium) {
      req.isPremium = true;
      return next();
    }

    // Check free tier usage
    const usage = req.user.usage || {};
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Initialize usage tracking if needed
    if (!usage[featureType]) {
      usage[featureType] = { month: currentMonth, count: 0 };
    }

    // Reset counter if new month
    if (usage[featureType].month !== currentMonth) {
      usage[featureType] = { month: currentMonth, count: 0 };
    }

    // Check against limit
    const limit = FREE_TIER_LIMITS[`${featureType}sPerMonth`] || 0;

    if (usage[featureType].count >= limit) {
      logger.warn('Free tier limit exceeded', {
        userId: req.user._id,
        featureType,
        count: usage[featureType].count,
        limit
      });

      return res.status(429).json({
        error: 'Usage limit exceeded',
        message: `You have reached your free tier limit of ${limit} ${featureType}s per month`,
        currentUsage: usage[featureType].count,
        limit,
        upgradeUrl: '/api/subscriptions/checkout',
        pricing: {
          monthly: '$49/month for unlimited access'
        }
      });
    }

    // Increment usage counter
    usage[featureType].count++;

    // Save updated usage (will be saved after route handler completes)
    req.user.usage = usage;
    req.shouldSaveUser = true; // Flag for afterware to save

    // Add usage info to request
    req.usageInfo = {
      current: usage[featureType].count,
      limit,
      remaining: limit - usage[featureType].count
    };

    req.isPremium = false;
    next();
  };
};

/**
 * Middleware to save user usage after route completes
 * Should be added at app level AFTER all routes
 */
const saveUserUsage = () => {
  return async (req, res, next) => {
    // This runs after the route handler
    res.on('finish', async () => {
      if (req.shouldSaveUser && req.user) {
        try {
          await req.user.save();
          logger.info('User usage updated', {
            userId: req.user._id,
            usage: req.user.usage
          });
        } catch (error) {
          logger.error('Failed to save user usage', {
            userId: req.user._id,
            error: error.message
          });
        }
      }
    });
    next();
  };
};

/**
 * Check if user can access advanced filters
 */
const requireAdvancedFilters = () => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const isPremium = await hasPremiumSubscription(req.user);

    if (!isPremium) {
      return res.status(403).json({
        error: 'Premium feature',
        message: 'Advanced filters (ideology, win rate) are only available to premium subscribers',
        upgradeUrl: '/api/subscriptions/checkout'
      });
    }

    req.isPremium = true;
    next();
  };
};

/**
 * Get user's subscription status and limits
 * @param {object} user - User object
 * @returns {Promise<object>} Subscription info
 */
async function getUserSubscriptionInfo(user) {
  if (!user) {
    return {
      tier: 'anonymous',
      isPremium: false,
      limits: FREE_TIER_LIMITS
    };
  }

  const isPremium = await hasPremiumSubscription(user);

  if (isPremium) {
    return {
      tier: 'premium',
      isPremium: true,
      limits: {
        searchesPerMonth: Infinity,
        conflictChecksPerMonth: Infinity,
        exportLimit: Infinity,
        advancedFilters: true
      }
    };
  }

  // Calculate remaining usage for free tier
  const usage = user.usage || {};
  const currentMonth = new Date().toISOString().slice(0, 7);

  const searchUsage = usage.search?.month === currentMonth ? usage.search.count : 0;
  const conflictUsage = usage.conflict_check?.month === currentMonth ? usage.conflict_check.count : 0;

  return {
    tier: 'free',
    isPremium: false,
    limits: FREE_TIER_LIMITS,
    usage: {
      searches: {
        used: searchUsage,
        remaining: Math.max(0, FREE_TIER_LIMITS.searchesPerMonth - searchUsage)
      },
      conflictChecks: {
        used: conflictUsage,
        remaining: 0 // Premium only
      }
    }
  };
}

module.exports = {
  requirePremium,
  checkUsageLimit,
  saveUserUsage,
  requireAdvancedFilters,
  hasPremiumSubscription,
  getUserSubscriptionInfo,
  FREE_TIER_LIMITS
};
