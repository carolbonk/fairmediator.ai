/**
 * Free Tier Monitor
 * Tracks daily usage of all free tier services to prevent exhaustion.
 * Persists counts to MongoDB so quotas survive server restarts.
 *
 * CRITICAL: Must NOT exhaust free tiers before end of month
 */

const logger = require('../config/logger');

// Lazy-require to avoid issues before mongoose is connected
function getQuotaModel() {
  return require('../models/FreeTierQuota');
}

// Free Tier Limits (from environment variables with fallback defaults)
const FREE_TIER_LIMITS = {
  huggingface: {
    monthly: parseInt(process.env.HUGGINGFACE_MONTHLY_LIMIT) || 10000,
    daily: parseInt(process.env.HUGGINGFACE_DAILY_LIMIT) || 333, // 10k/month ÷ 30 days
    name: 'Hugging Face API'
  },
  mongodb: {
    monthly: parseInt(process.env.MONGODB_SIZE_LIMIT) || (512 * 1024 * 1024),
    daily: null, // Size-based, not request-based
    name: 'MongoDB Atlas'
  },
  resend: {
    monthly: parseInt(process.env.RESEND_MONTHLY_LIMIT) || 3000,
    daily: parseInt(process.env.RESEND_DAILY_LIMIT) || 90,
    name: 'Resend Email'
  },
  scraping: {
    monthly: parseInt(process.env.SCRAPING_MONTHLY_LIMIT) || 15000,
    daily: parseInt(process.env.SCRAPING_DAILY_LIMIT) || 450,
    name: 'Web Scraping'
  }
};

// Warning thresholds (from environment variables with fallback defaults)
const THRESHOLDS = {
  warning: parseFloat(process.env.FREE_TIER_WARNING_THRESHOLD) || 0.70,
  alert: parseFloat(process.env.FREE_TIER_ALERT_THRESHOLD) || 0.85,
  critical: parseFloat(process.env.FREE_TIER_CRITICAL_THRESHOLD) || 0.95,
  stop: parseFloat(process.env.FREE_TIER_STOP_THRESHOLD) || 1.0
};

class FreeTierMonitor {
  constructor() {
    this.usage = {};
    this.alerts = [];
    this.resetDaily();
  }

  /**
   * Reset daily counters (run at midnight via cron)
   */
  resetDaily() {
    const today = new Date().toISOString().split('T')[0];

    Object.keys(FREE_TIER_LIMITS).forEach(service => {
      if (!this.usage[service]) {
        this.usage[service] = {};
      }

      this.usage[service][today] = {
        count: 0,
        limit: FREE_TIER_LIMITS[service].daily,
        started: new Date()
      };
    });

    logger.info('Free tier daily counters reset', { date: today });
  }

  /**
   * Load today's persisted counts from MongoDB and merge into memory.
   * Call this once after the mongoose connection is established.
   */
  async initFromDB() {
    const today = new Date().toISOString().split('T')[0];
    try {
      const FreeTierQuota = getQuotaModel();
      const records = await FreeTierQuota.find({ date: today });

      records.forEach(record => {
        if (!this.usage[record.service]) {
          this.usage[record.service] = {};
        }
        // Merge: take the higher of in-memory vs DB (in case of concurrent writes)
        const inMemory = this.usage[record.service][today]?.count || 0;
        this.usage[record.service][today] = {
          count: Math.max(inMemory, record.count),
          limit: FREE_TIER_LIMITS[record.service]?.daily,
          started: new Date()
        };
      });

      logger.info('Free tier quotas loaded from MongoDB', { date: today, servicesLoaded: records.length });
    } catch (error) {
      // Non-fatal: fall back to in-memory tracking
      logger.warn('Could not load free tier quotas from MongoDB', { error: error.message });
    }
  }

  /**
   * Persist a service's count to MongoDB (async, non-blocking).
   */
  _persistToDb(service, date, count) {
    const FreeTierQuota = getQuotaModel();
    FreeTierQuota.findOneAndUpdate(
      { service, date },
      {
        $set: { limit: FREE_TIER_LIMITS[service]?.daily },
        $max: { count } // Only ever increase persisted count
      },
      { upsert: true }
    ).catch(err => {
      logger.warn('Free tier quota persist failed', { service, error: err.message });
    });
  }

  /**
   * Track a service usage
   * @param {string} service - Service name (redis, huggingface, etc)
   * @param {number} count - Number of requests/operations (default: 1)
   * @returns {boolean} - True if allowed, false if over limit
   */
  track(service, count = 1) {
    const today = new Date().toISOString().split('T')[0];

    // Initialize if needed
    if (!this.usage[service]) {
      this.usage[service] = {};
    }

    if (!this.usage[service][today]) {
      this.usage[service][today] = {
        count: 0,
        limit: FREE_TIER_LIMITS[service]?.daily,
        started: new Date()
      };
    }

    // Increment count
    this.usage[service][today].count += count;

    const current = this.usage[service][today].count;
    const limit = this.usage[service][today].limit;

    // Async persist to MongoDB (non-blocking — does not affect request latency)
    if (limit) {
      this._persistToDb(service, today, current);
    }

    // Check if service has daily limit
    if (!limit) {
      return true; // No daily limit, only size/count limits
    }

    const percentage = current / limit;

    // Log based on threshold
    if (percentage >= THRESHOLDS.stop) {
      logger.error(`FREE TIER EXHAUSTED: ${service}`, {
        current,
        limit,
        percentage: Math.round(percentage * 100) + '%'
      });
      this.addAlert(service, 'EXHAUSTED', current, limit);
      return false; // STOP - over limit
    } else if (percentage >= THRESHOLDS.critical) {
      logger.warn(`FREE TIER CRITICAL: ${service}`, {
        current,
        limit,
        percentage: Math.round(percentage * 100) + '%'
      });
      this.addAlert(service, 'CRITICAL', current, limit);
    } else if (percentage >= THRESHOLDS.alert) {
      logger.warn(`FREE TIER ALERT: ${service}`, {
        current,
        limit,
        percentage: Math.round(percentage * 100) + '%'
      });
      this.addAlert(service, 'ALERT', current, limit);
    } else if (percentage >= THRESHOLDS.warning) {
      logger.info(`Free tier warning: ${service}`, {
        current,
        limit,
        percentage: Math.round(percentage * 100) + '%'
      });
    }

    return true; // Allowed
  }

  /**
   * Add alert
   */
  addAlert(service, level, current, limit) {
    const alert = {
      service,
      level,
      current,
      limit,
      percentage: Math.round((current / limit) * 100),
      timestamp: new Date()
    };

    this.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  /**
   * Get current usage stats
   */
  getStats() {
    const today = new Date().toISOString().split('T')[0];
    const stats = {};

    Object.keys(FREE_TIER_LIMITS).forEach(service => {
      const limit = FREE_TIER_LIMITS[service];
      const todayUsage = this.usage[service]?.[today] || { count: 0 };

      stats[service] = {
        name: limit.name,
        current: todayUsage.count,
        dailyLimit: limit.daily,
        monthlyLimit: limit.monthly,
        percentage: limit.daily
          ? Math.round((todayUsage.count / limit.daily) * 100)
          : null,
        status: this.getStatus(service, today)
      };
    });

    return stats;
  }

  /**
   * Get service status
   */
  getStatus(service, date) {
    const usage = this.usage[service]?.[date];
    if (!usage || !usage.limit) return 'OK';

    const percentage = usage.count / usage.limit;

    if (percentage >= THRESHOLDS.stop) return 'EXHAUSTED';
    if (percentage >= THRESHOLDS.critical) return 'CRITICAL';
    if (percentage >= THRESHOLDS.alert) return 'ALERT';
    if (percentage >= THRESHOLDS.warning) return 'WARNING';
    return 'OK';
  }

  /**
   * Get monthly projection
   */
  getMonthlyProjection() {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const dayOfMonth = today.getDate();
    const daysRemaining = daysInMonth - dayOfMonth;

    const projections = {};

    Object.keys(FREE_TIER_LIMITS).forEach(service => {
      const stats = this.getStats()[service];
      if (!stats.dailyLimit) return;

      const avgDailyUsage = stats.current; // Simplified: use today's usage
      const projectedMonthly = avgDailyUsage * daysInMonth;
      const monthlyLimit = FREE_TIER_LIMITS[service].monthly;

      projections[service] = {
        name: stats.name,
        avgDailyUsage,
        projectedMonthly,
        monthlyLimit,
        projectedPercentage: Math.round((projectedMonthly / monthlyLimit) * 100),
        willExceed: projectedMonthly > monthlyLimit,
        daysRemaining
      };
    });

    return projections;
  }

  /**
   * Get recent alerts
   */
  getAlerts(limit = 10) {
    return this.alerts.slice(-limit).reverse();
  }

  /**
   * Check if service is allowed (before making request)
   */
  isAllowed(service) {
    const today = new Date().toISOString().split('T')[0];
    const usage = this.usage[service]?.[today];

    if (!usage || !usage.limit) return true;

    return usage.count < usage.limit;
  }

  /**
   * Get remaining quota for service
   */
  getRemaining(service) {
    const today = new Date().toISOString().split('T')[0];
    const usage = this.usage[service]?.[today];
    const limit = FREE_TIER_LIMITS[service]?.daily;

    if (!usage || !limit) return null;

    return Math.max(0, limit - usage.count);
  }
}

// Singleton instance
const monitor = new FreeTierMonitor();

// Middleware to track API usage
function trackMiddleware(service) {
  return (_req, res, next) => {
    // Track the request
    if (!monitor.isAllowed(service)) {
      return res.status(429).json({
        error: 'Daily free tier limit reached',
        service: FREE_TIER_LIMITS[service].name,
        message: 'Please try again tomorrow or upgrade to premium'
      });
    }

    // Track after response
    res.on('finish', () => {
      if (res.statusCode < 500) { // Don't count server errors
        monitor.track(service);
      }
    });

    next();
  };
}

module.exports = {
  monitor,
  trackMiddleware,
  FREE_TIER_LIMITS,
  THRESHOLDS
};
