/**
 * SearchHistory Model
 * Tracks user mediator searches for history and analytics
 */

const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  // User who performed the search
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Search query text
  query: {
    type: String,
    trim: true,
    maxlength: 500
  },

  // Search filters applied
  filters: {
    specialization: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    minRating: {
      type: Number,
      min: 0,
      max: 5
    },
    maxRate: {
      type: Number,
      min: 0
    },
    minExperience: {
      type: Number,
      min: 0
    },
    ideologyRange: {
      min: {
        type: Number,
        min: -10,
        max: 10
      },
      max: {
        type: Number,
        min: -10,
        max: 10
      }
    },
    conflictType: {
      type: String,
      trim: true
    },
    // Any other custom filters
    custom: mongoose.Schema.Types.Mixed
  },

  // Number of results returned
  resultsCount: {
    type: Number,
    default: 0,
    min: 0
  },

  // Top mediator IDs from results (for ML/recommendation purposes)
  topResults: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mediator'
  }],

  // Did user interact with results?
  interaction: {
    clicked: {
      type: Boolean,
      default: false
    },
    saved: {
      type: Boolean,
      default: false
    },
    contacted: {
      type: Boolean,
      default: false
    }
  },

  // When the search was performed
  searchedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Index for recent searches
searchHistorySchema.index({ userId: 1, searchedAt: -1 });

// Index for analytics (most common searches)
searchHistorySchema.index({ 'filters.specialization': 1, 'filters.location': 1 });

// TTL index - automatically delete searches older than 90 days
searchHistorySchema.index({ searchedAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
