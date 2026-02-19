/**
 * ConflictAlert Model
 * Stores per-user alerts when a mediator they've viewed has new conflict signals.
 */

const mongoose = require('mongoose');

const conflictAlertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  mediatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mediator',
    required: true
  },
  // Denormalized — avoids a join on every bell-icon poll
  mediatorName: {
    type: String,
    required: true
  },
  alertType: {
    type: String,
    enum: ['new_conflict', 'risk_change', 'new_affiliation', 'high_bias'],
    default: 'new_conflict'
  },
  severity: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    default: 'MEDIUM'
  },
  message: {
    type: String,
    required: true,
    maxlength: 300
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

// Index for fast unread-count queries
conflictAlertSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

// Prevent duplicate alerts for the same (user, mediator, type) within 7 days
conflictAlertSchema.index(
  { userId: 1, mediatorId: 1, alertType: 1, createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30 } // TTL: auto-delete after 30 days
);

module.exports = mongoose.model('ConflictAlert', conflictAlertSchema);
