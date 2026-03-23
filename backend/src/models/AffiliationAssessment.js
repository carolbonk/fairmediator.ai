/**
 * AffiliationAssessment Model
 * ML-scored affiliation assessments with audit trails
 * Connects mediators to firms/organizations with confidence scores
 */

const mongoose = require('mongoose');

const affiliationAssessmentSchema = new mongoose.Schema({
  // Core Relationship
  mediatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mediator',
    required: true,
    index: true
  },

  firmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Firm',
    index: true
  },

  // For cases where firm isn't in our database yet
  firmName: String,
  firmType: String,

  // Relationship Details
  affiliationType: {
    type: String,
    enum: [
      'current_employer',
      'past_employer',
      'partner',
      'of_counsel',
      'member',
      'board_member',
      'advisor',
      'consultant',
      'client',
      'opposing_counsel',
      'co_counsel',
      'other'
    ],
    required: true
  },

  role: String, // e.g., "Senior Partner", "Associate", "Board Member"

  // Temporal
  startDate: Date,
  endDate: Date,
  isCurrent: {
    type: Boolean,
    default: false
  },
  durationMonths: Number,

  // ML Scoring
  confidenceScore: {
    type: Number,
    min: 0,
    max: 1,
    required: true,
    default: 0.5
  }, // ML model confidence in this affiliation

  influenceScore: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
  }, // How much this affiliation influences bias

  conflictRiskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }, // Conflict of interest risk (0-100)

  // Evidence & Sources
  sources: [{
    type: {
      type: String,
      enum: ['FEC', 'Senate_LDA', 'LinkedIn', 'RECAP', 'Manual', 'Scraped', 'Signal']
    },
    url: String,
    confidence: Number,
    extractedAt: Date,
    signalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Signal'
    }
  }],

  supportingSignals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Signal'
  }], // Signals that support this affiliation

  // Model Info
  modelVersion: String, // e.g., "v1.0", "manual", "rule-based"
  scoringMethod: {
    type: String,
    enum: ['ml_model', 'rule_based', 'manual', 'hybrid'],
    default: 'rule_based'
  },

  scoringDetails: {
    features: mongoose.Schema.Types.Mixed, // Features used for scoring
    modelName: String,
    threshold: Number,
    alternativeScores: mongoose.Schema.Types.Mixed // Scores from other models
  },

  // Validation & Review
  validationStatus: {
    type: String,
    enum: ['pending', 'validated', 'disputed', 'invalidated', 'needs_review'],
    default: 'pending'
  },

  reviewedBy: {
    userId: mongoose.Schema.Types.ObjectId,
    date: Date,
    notes: String,
    action: String // e.g., "approved", "rejected", "modified"
  },

  // Conflict Detection
  hasConflict: {
    type: Boolean,
    default: false
  },

  conflictDetails: {
    type: String,
    enum: ['NONE', 'POTENTIAL', 'CONFIRMED', 'RESOLVED'],
    default: 'NONE'
  },

  conflictEntities: [String], // Entities that conflict with this affiliation

  // User Feedback
  userReports: [{
    userId: mongoose.Schema.Types.ObjectId,
    reportType: String, // e.g., "incorrect", "outdated", "missing_info"
    comment: String,
    reportedAt: Date
  }],

  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },

  flags: [{
    type: String,
    enum: ['high_confidence', 'low_confidence', 'needs_verification', 'conflicting_sources', 'high_risk']
  }],

  notes: String,
  internalNotes: String, // For admin/reviewer notes

  // Audit Trail
  changeHistory: [{
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    changedBy: mongoose.Schema.Types.ObjectId,
    changedAt: Date,
    reason: String
  }]
}, {
  timestamps: true
});

// Indexes
affiliationAssessmentSchema.index({ mediatorId: 1, firmId: 1 });
affiliationAssessmentSchema.index({ mediatorId: 1, isCurrent: 1 });
affiliationAssessmentSchema.index({ firmId: 1, affiliationType: 1 });
affiliationAssessmentSchema.index({ confidenceScore: -1 });
affiliationAssessmentSchema.index({ conflictRiskScore: -1 });
affiliationAssessmentSchema.index({ validationStatus: 1 });
affiliationAssessmentSchema.index({ createdAt: -1 });

// Calculate conflict risk score
affiliationAssessmentSchema.methods.calculateConflictRisk = function() {
  let risk = 0;

  // Base risk by affiliation type
  const typeRisk = {
    current_employer: 40,
    partner: 50,
    board_member: 45,
    past_employer: 20,
    member: 15,
    client: 60,
    opposing_counsel: 70,
    co_counsel: 30,
    other: 10
  };

  risk += typeRisk[this.affiliationType] || 10;

  // Boost if current
  if (this.isCurrent) {
    risk *= 1.5;
  }

  // Boost if high confidence
  if (this.confidenceScore > 0.8) {
    risk *= 1.2;
  }

  // Reduce if old
  if (this.endDate) {
    const yearsAgo = (new Date() - new Date(this.endDate)) / (1000 * 60 * 60 * 24 * 365);
    if (yearsAgo > 5) {
      risk *= 0.5;
    } else if (yearsAgo > 2) {
      risk *= 0.7;
    }
  }

  this.conflictRiskScore = Math.min(Math.round(risk), 100);
  return this.conflictRiskScore;
};

// Add source to affiliation
affiliationAssessmentSchema.methods.addSource = function(sourceData) {
  const existingSource = this.sources.find(s =>
    s.type === sourceData.type && s.url === sourceData.url
  );

  if (!existingSource) {
    this.sources.push({
      ...sourceData,
      extractedAt: new Date()
    });

    // Recalculate confidence based on multiple sources
    this.confidenceScore = Math.min(
      this.confidenceScore + 0.1,
      0.95 // Cap at 95%
    );
  }
};

// Log change for audit trail
affiliationAssessmentSchema.methods.logChange = function(field, oldValue, newValue, userId, reason) {
  this.changeHistory.push({
    field,
    oldValue,
    newValue,
    changedBy: userId,
    changedAt: new Date(),
    reason
  });
};

// Static method to find high-risk affiliations
affiliationAssessmentSchema.statics.findHighRisk = async function(mediatorId, threshold = 60) {
  return this.find({
    mediatorId,
    isActive: true,
    conflictRiskScore: { $gte: threshold },
    validationStatus: { $ne: 'invalidated' }
  }).populate('firmId').sort({ conflictRiskScore: -1 });
};

// Static method to aggregate by mediator
affiliationAssessmentSchema.statics.aggregateForMediator = async function(mediatorId) {
  const assessments = await this.find({
    mediatorId,
    isActive: true,
    validationStatus: { $ne: 'invalidated' }
  }).populate('firmId');

  const aggregation = {
    total: assessments.length,
    current: assessments.filter(a => a.isCurrent).length,
    byType: {},
    averageConfidence: 0,
    averageRisk: 0,
    highRiskCount: 0,
    firms: []
  };

  let totalConfidence = 0;
  let totalRisk = 0;

  assessments.forEach(assessment => {
    aggregation.byType[assessment.affiliationType] =
      (aggregation.byType[assessment.affiliationType] || 0) + 1;

    totalConfidence += assessment.confidenceScore;
    totalRisk += assessment.conflictRiskScore;

    if (assessment.conflictRiskScore >= 60) {
      aggregation.highRiskCount++;
    }

    if (assessment.firmId) {
      aggregation.firms.push({
        id: assessment.firmId._id,
        name: assessment.firmId.name,
        type: assessment.affiliationType,
        risk: assessment.conflictRiskScore
      });
    }
  });

  aggregation.averageConfidence = assessments.length > 0 ? totalConfidence / assessments.length : 0;
  aggregation.averageRisk = assessments.length > 0 ? totalRisk / assessments.length : 0;

  return aggregation;
};

module.exports = mongoose.model('AffiliationAssessment', affiliationAssessmentSchema);
