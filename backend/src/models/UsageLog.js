/**
 * UsageLog Model
 * Track all user actions for analytics
 */

const mongoose = require('mongoose');

const usageLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  eventType: {
    type: String,
    enum: ['search', 'profileView', 'aiCall', 'upgrade', 'registration'],
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    // Search metadata
    filters: {
      practiceArea: String,
      jurisdiction: String,
      ideology: String,
      minRating: Number,
      excludeAffiliations: [String]
    },
    resultCount: Number,
    page: Number,

    // Profile view metadata
    mediatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mediator'
    },

    // AI call metadata
    query: String,
    responseLength: Number,
    emotion: {
      user: String,
      assistant: String
    },

    // Upgrade metadata
    fromTier: String,
    toTier: String,
    amount: Number,

    // Generic metadata
    additionalInfo: mongoose.Schema.Types.Mixed
  },
  sessionId: String,
  ipAddress: String,
  userAgent: String
}, {
  timestamps: false // We use timestamp field instead
});

// Indexes for efficient querying
usageLogSchema.index({ user: 1, timestamp: -1 });
usageLogSchema.index({ user: 1, eventType: 1, timestamp: -1 });
usageLogSchema.index({ eventType: 1, timestamp: -1 });
usageLogSchema.index({ timestamp: -1 });

// Static method to get user stats
usageLogSchema.statics.getUserStats = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        user: userId,
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Static method to get daily activity
usageLogSchema.statics.getDailyActivity = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        user: userId,
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

// Static method to get popular mediators
usageLogSchema.statics.getPopularMediators = async function(days = 30, limit = 10) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        eventType: 'profileView',
        timestamp: { $gte: startDate },
        'metadata.mediatorId': { $exists: true }
      }
    },
    {
      $group: {
        _id: '$metadata.mediatorId',
        viewCount: { $sum: 1 }
      }
    },
    {
      $sort: { viewCount: -1 }
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'mediators',
        localField: '_id',
        foreignField: '_id',
        as: 'mediator'
      }
    },
    {
      $unwind: '$mediator'
    }
  ]);
};

module.exports = mongoose.model('UsageLog', usageLogSchema);
