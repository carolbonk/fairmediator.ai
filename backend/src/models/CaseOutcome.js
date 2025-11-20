/**
 * Case Outcome Model
 * Tracks final outcomes of cases for learning and improvement
 */

const mongoose = require('mongoose');

const caseOutcomeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },

  mediatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mediator',
    required: true
  },

  // Case details
  caseType: {
    type: String,
    enum: ['employment', 'business', 'family', 'real_estate', 'contract', 'ip', 'construction', 'healthcare', 'other'],
    required: true
  },

  jurisdiction: {
    state: String,
    city: String
  },

  // Final outcome
  outcome: {
    type: String,
    enum: ['settled', 'resolved', 'ongoing', 'abandoned', 'escalated'],
    required: true
  },

  // Success metrics
  settlementReached: {
    type: Boolean,
    default: false
  },

  settlementDays: {
    type: Number, // Days from hire to settlement
    min: 0
  },

  totalCost: {
    type: Number, // Total mediation cost
    min: 0
  },

  // User feedback
  userSatisfaction: {
    type: Number, // 1-5 rating
    min: 1,
    max: 5
  },

  wouldRecommend: {
    type: Boolean
  },

  feedback: String,

  // Timestamps
  hiredDate: Date,
  completedDate: Date,

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
caseOutcomeSchema.index({ mediatorId: 1, outcome: 1 });
caseOutcomeSchema.index({ caseType: 1, outcome: 1 });
caseOutcomeSchema.index({ userSatisfaction: -1 });

// Update timestamp on save
caseOutcomeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('CaseOutcome', caseOutcomeSchema);
