const mongoose = require('mongoose');

const usageLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Event type
    eventType: {
      type: String,
      required: true,
      enum: [
        'search',
        'profile_view',
        'ai_call',
        'export',
        'saved_search',
        'login',
        'logout',
        'signup',
        'subscription_upgrade',
        'subscription_downgrade',
        'subscription_cancel',
        'password_reset',
        'email_sent',
      ],
      index: true,
    },
    // Event details
    eventData: {
      // Search-specific
      query: {
        type: String,
      },
      filters: {
        type: mongoose.Schema.Types.Mixed,
      },
      resultsCount: {
        type: Number,
      },

      // Profile view
      mediatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mediator',
      },

      // AI call
      aiModel: {
        type: String,
      },
      tokensUsed: {
        type: Number,
      },
      responseTime: {
        type: Number, // milliseconds
      },

      // Export
      exportFormat: {
        type: String,
        enum: ['pdf', 'csv', 'json'],
      },
      exportSize: {
        type: Number, // bytes
      },

      // General metadata
      metadata: {
        type: mongoose.Schema.Types.Mixed,
      },
    },
    // User context at time of event
    userContext: {
      subscriptionTier: {
        type: String,
        enum: ['free', 'premium', 'enterprise'],
      },
      dailySearchCount: {
        type: Number,
      },
      dailyProfileViewCount: {
        type: Number,
      },
    },
    // Technical details
    technical: {
      ipAddress: {
        type: String,
      },
      userAgent: {
        type: String,
      },
      device: {
        type: String,
        enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      },
      browser: {
        type: String,
      },
      os: {
        type: String,
      },
      referrer: {
        type: String,
      },
    },
    // Analytics
    sessionId: {
      type: String,
      index: true,
    },
    posthogEventId: {
      type: String, // For correlation with PostHog events
    },
    // Performance metrics
    performance: {
      duration: {
        type: Number, // milliseconds
      },
      statusCode: {
        type: Number,
      },
      error: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for analytics queries
usageLogSchema.index({ user: 1, eventType: 1 });
usageLogSchema.index({ user: 1, createdAt: -1 });
usageLogSchema.index({ eventType: 1, createdAt: -1 });
usageLogSchema.index({ sessionId: 1 });
usageLogSchema.index({ createdAt: -1 });
usageLogSchema.index({ 'userContext.subscriptionTier': 1, eventType: 1 });

// TTL index - automatically delete logs older than 90 days (for GDPR compliance)
usageLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// Static methods for analytics

// Get usage stats for a user
usageLogSchema.statics.getUserStats = async function (userId, startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        avgDuration: { $avg: '$performance.duration' },
      },
    },
  ]);
};

// Get overall platform stats
usageLogSchema.statics.getPlatformStats = async function (startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: {
          eventType: '$eventType',
          tier: '$userContext.subscriptionTier',
        },
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$user' },
      },
    },
    {
      $project: {
        eventType: '$_id.eventType',
        tier: '$_id.tier',
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
      },
    },
  ]);
};

// Get daily active users
usageLogSchema.statics.getDailyActiveUsers = async function (date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const result = await this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      },
    },
    {
      $group: {
        _id: '$user',
      },
    },
    {
      $count: 'totalUsers',
    },
  ]);

  return result[0]?.totalUsers || 0;
};

// Get most popular searches
usageLogSchema.statics.getPopularSearches = async function (limit = 10) {
  return await this.aggregate([
    {
      $match: {
        eventType: 'search',
        'eventData.query': { $exists: true, $ne: null },
      },
    },
    {
      $group: {
        _id: '$eventData.query',
        count: { $sum: 1 },
        avgResults: { $avg: '$eventData.resultsCount' },
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: limit,
    },
  ]);
};

// Get conversion funnel data
usageLogSchema.statics.getConversionFunnel = async function (startDate, endDate) {
  const funnelSteps = ['signup', 'search', 'profile_view', 'subscription_upgrade'];

  const results = await Promise.all(
    funnelSteps.map(async step => {
      const users = await this.distinct('user', {
        eventType: step,
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      });

      return {
        step,
        uniqueUsers: users.length,
      };
    })
  );

  return results;
};

// Static method to log an event (helper)
usageLogSchema.statics.logEvent = async function (eventData) {
  try {
    const log = new this(eventData);
    await log.save();
    return log;
  } catch (error) {
    console.error('Error logging event:', error);
    // Don't throw - logging failures shouldn't break the app
    return null;
  }
};

const UsageLog = mongoose.model('UsageLog', usageLogSchema);

module.exports = UsageLog;
