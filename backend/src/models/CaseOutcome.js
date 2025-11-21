const mongoose = require('mongoose');

const caseOutcomeSchema = new mongoose.Schema({
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
    enum: ['employment', 'business', 'family', 'real_estate', 'contract', 'ip', 'construction', 'healthcare', 'other'],
    required: true
  },
  jurisdiction: {
    state: String,
    city: String
  },
  outcome: {
    type: String,
    enum: ['settled', 'resolved', 'ongoing', 'abandoned', 'escalated'],
    required: true
  },
  settlementReached: {
    type: Boolean,
    default: false
  },
  settlementDays: {
    type: Number,
    min: 0
  },
  totalCost: {
    type: Number,
    min: 0
  },
  userSatisfaction: {
    type: Number,
    min: 1,
    max: 5
  },
  wouldRecommend: Boolean,
  feedback: String,
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

caseOutcomeSchema.index({ mediatorId: 1, outcome: 1 });
caseOutcomeSchema.index({ caseType: 1, outcome: 1 });
caseOutcomeSchema.index({ userSatisfaction: -1 });

caseOutcomeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('CaseOutcome', caseOutcomeSchema);
