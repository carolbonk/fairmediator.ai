/**
 * SavedMediator Model
 * Tracks user bookmarks/saved mediators for quick access
 */

const mongoose = require('mongoose');

const savedMediatorSchema = new mongoose.Schema({
  // User who saved the mediator
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Mediator being saved
  mediatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mediator',
    required: true,
    index: true
  },

  // Optional notes from the user
  notes: {
    type: String,
    maxlength: 500,
    trim: true
  },

  // Optional tags for organization
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],

  // Reason for saving (optional)
  reason: {
    type: String,
    enum: ['top_match', 'recommended', 'reviewed_profile', 'referral', 'other'],
    default: 'other'
  },

  // Custom priority/rating
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },

  // When saved
  savedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate saves
savedMediatorSchema.index({ userId: 1, mediatorId: 1 }, { unique: true });

// Index for querying by tags
savedMediatorSchema.index({ userId: 1, tags: 1 });

// Index for sorting by priority and savedAt
savedMediatorSchema.index({ userId: 1, priority: -1, savedAt: -1 });

module.exports = mongoose.model('SavedMediator', savedMediatorSchema);
