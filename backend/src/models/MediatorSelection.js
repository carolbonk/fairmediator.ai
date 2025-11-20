/**
 * Mediator Selection Model
 * Tracks which mediators users view, select, and contact
 */

const mongoose = require('mongoose');

const mediatorSelectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow anonymous users
  },

  mediatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mediator',
    required: true
  },

  // Case context
  caseType: {
    type: String,
    enum: ['employment', 'business', 'family', 'real_estate', 'contract', 'ip', 'construction', 'healthcare', 'other'],
    required: false
  },

  jurisdiction: {
    state: String,
    city: String
  },

  // Detected characteristics
  ideologyDetected: {
    type: String,
    enum: ['liberal', 'conservative', 'moderated'],
    default: 'moderated'
  },

  emotionDetected: {
    type: String,
    enum: ['frustrated', 'urgent', 'calm', 'moderated'],
    default: 'moderated'
  },

  // Parties involved (for conflict tracking)
  partiesInvolved: [String],

  // Selection stage
  action: {
    type: String,
    enum: ['viewed', 'clicked', 'contacted', 'scheduled_call', 'hired'],
    required: true
  },

  // Why they selected this mediator
  selectionReason: {
    ideology: Boolean,
    experience: Boolean,
    location: Boolean,
    price: Boolean,
    rating: Boolean,
    practiceArea: Boolean
  },

  // Chat context (what they asked)
  userQuery: String,
  aiRecommendation: String,

  // Timestamp
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for fast queries
mediatorSelectionSchema.index({ mediatorId: 1, action: 1 });
mediatorSelectionSchema.index({ caseType: 1, 'jurisdiction.state': 1 });
mediatorSelectionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('MediatorSelection', mediatorSelectionSchema);
