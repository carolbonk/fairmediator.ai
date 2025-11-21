const mongoose = require('mongoose');

const mediatorSelectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  mediatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mediator',
    required: true
  },
  caseType: {
    type: String,
    enum: ['employment', 'business', 'family', 'real_estate', 'contract', 'ip', 'construction', 'healthcare', 'other']
  },
  jurisdiction: {
    state: String,
    city: String
  },
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
  partiesInvolved: [String],
  action: {
    type: String,
    enum: ['viewed', 'clicked', 'contacted', 'scheduled_call', 'hired'],
    required: true
  },
  selectionReason: {
    ideology: Boolean,
    experience: Boolean,
    location: Boolean,
    price: Boolean,
    rating: Boolean,
    practiceArea: Boolean
  },
  userQuery: String,
  aiRecommendation: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

mediatorSelectionSchema.index({ mediatorId: 1, action: 1 });
mediatorSelectionSchema.index({ caseType: 1, 'jurisdiction.state': 1 });
mediatorSelectionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('MediatorSelection', mediatorSelectionSchema);
