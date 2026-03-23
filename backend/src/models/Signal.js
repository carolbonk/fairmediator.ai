/**
 * Signal Model
 * Individual bias/affiliation signals extracted from various sources
 * Supports deterministic scoring pipeline with evidence tracking
 */

const mongoose = require('mongoose');

const signalSchema = new mongoose.Schema({
  // Subject (who this signal is about)
  mediatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mediator',
    required: true,
    index: true
  },

  // Signal Classification
  signalType: {
    type: String,
    enum: [
      'EMPLOYMENT',        // Current or past employment
      'MEMBERSHIP',        // Professional organization membership
      'PUBLICATION',       // Published articles, books, papers
      'SPEAKING',          // Speaking engagements, presentations
      'DONATION',          // Political donations
      'ENDORSEMENT',       // Public endorsements
      'CASE_INVOLVEMENT',  // Case participation
      'EDUCATION',         // Educational background
      'AWARD',             // Awards, recognitions
      'CERTIFICATION',     // Professional certifications
      'SOCIAL_MEDIA',      // Social media activity
      'NEWS_MENTION',      // News article mentions
      'OTHER'
    ],
    required: true,
    index: true
  },

  // Signal Content
  entity: {
    type: String,
    required: true,
    index: true
    // The organization, person, or topic involved
    // e.g., "American Bar Association", "Democratic Party", "John Doe"
  },

  entityType: {
    type: String,
    enum: ['organization', 'person', 'case', 'topic', 'event', 'publication'],
    required: true
  },

  relationship: {
    type: String,
    required: true
    // e.g., "employed by", "member of", "donated to", "spoke at"
  },

  description: String, // Human-readable description of the signal

  // Temporal Info
  dateStart: Date,
  dateEnd: Date,
  isCurrent: {
    type: Boolean,
    default: false
  },

  // Source & Evidence
  source: {
    type: String,
    required: true,
    enum: ['FEC', 'Senate_LDA', 'LinkedIn', 'RECAP', 'Manual', 'Scraped', 'User_Submitted', 'AI_Extracted']
  },

  sourceUrl: String, // URL where this signal was found
  sourceDate: Date,  // When the source published this information

  evidence: {
    rawText: String,        // Original text containing the signal
    keywords: [String],     // Keywords that matched
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    },
    extractionMethod: String // e.g., "regex", "NER", "manual", "API"
  },

  // Bias Scoring
  leaningScore: {
    type: Number,
    min: -10,
    max: 10,
    default: 0
  }, // Political leaning implied by this signal

  influenceWeight: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
  }, // How much this signal should influence overall score

  conflictRisk: {
    type: String,
    enum: ['NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'NONE'
  },

  // Validation
  validationStatus: {
    type: String,
    enum: ['unvalidated', 'validated', 'disputed', 'invalidated'],
    default: 'unvalidated'
  },

  validatedBy: {
    userId: mongoose.Schema.Types.ObjectId,
    date: Date,
    method: String // e.g., "manual_review", "cross_reference", "source_verification"
  },

  // Related Entities
  relatedFirm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Firm'
  },

  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },

  flags: [{
    type: String,
    enum: ['duplicate', 'outdated', 'needs_review', 'high_priority', 'disputed']
  }],

  notes: String,
  tags: [String]
}, {
  timestamps: true
});

// Indexes
signalSchema.index({ mediatorId: 1, signalType: 1 });
signalSchema.index({ entity: 1, entityType: 1 });
signalSchema.index({ source: 1, validationStatus: 1 });
signalSchema.index({ leaningScore: 1 });
signalSchema.index({ conflictRisk: 1 });
signalSchema.index({ createdAt: -1 });

// Calculate influence weight based on signal type and recency
signalSchema.methods.calculateInfluenceWeight = function() {
  const baseWeights = {
    EMPLOYMENT: 0.8,
    DONATION: 0.7,
    MEMBERSHIP: 0.6,
    CASE_INVOLVEMENT: 0.7,
    PUBLICATION: 0.5,
    SPEAKING: 0.5,
    ENDORSEMENT: 0.8,
    EDUCATION: 0.4,
    AWARD: 0.3,
    CERTIFICATION: 0.3,
    SOCIAL_MEDIA: 0.2,
    NEWS_MENTION: 0.4,
    OTHER: 0.3
  };

  let weight = baseWeights[this.signalType] || 0.5;

  // Boost current relationships
  if (this.isCurrent) {
    weight *= 1.2;
  }

  // Decay based on age
  if (this.dateEnd) {
    const yearsAgo = (new Date() - new Date(this.dateEnd)) / (1000 * 60 * 60 * 24 * 365);
    if (yearsAgo > 5) {
      weight *= 0.5; // 50% weight if more than 5 years old
    } else if (yearsAgo > 2) {
      weight *= 0.7; // 70% weight if 2-5 years old
    }
  }

  // Boost if validated
  if (this.validationStatus === 'validated') {
    weight *= 1.1;
  }

  // Cap at 1.0
  this.influenceWeight = Math.min(weight, 1.0);
  return this.influenceWeight;
};

// Static method to aggregate signals for a mediator
signalSchema.statics.aggregateForMediator = async function(mediatorId) {
  const signals = await this.find({
    mediatorId,
    isActive: true,
    validationStatus: { $ne: 'invalidated' }
  });

  const aggregation = {
    totalSignals: signals.length,
    byType: {},
    bySource: {},
    averageLeaning: 0,
    highRiskCount: 0,
    validatedCount: 0
  };

  let totalWeightedLeaning = 0;
  let totalWeight = 0;

  signals.forEach(signal => {
    // Count by type
    aggregation.byType[signal.signalType] = (aggregation.byType[signal.signalType] || 0) + 1;

    // Count by source
    aggregation.bySource[signal.source] = (aggregation.bySource[signal.source] || 0) + 1;

    // Weighted average leaning
    totalWeightedLeaning += signal.leaningScore * signal.influenceWeight;
    totalWeight += signal.influenceWeight;

    // Risk counts
    if (signal.conflictRisk === 'HIGH' || signal.conflictRisk === 'CRITICAL') {
      aggregation.highRiskCount++;
    }

    // Validation counts
    if (signal.validationStatus === 'validated') {
      aggregation.validatedCount++;
    }
  });

  aggregation.averageLeaning = totalWeight > 0 ? totalWeightedLeaning / totalWeight : 0;
  aggregation.validationRate = signals.length > 0 ? aggregation.validatedCount / signals.length : 0;

  return aggregation;
};

module.exports = mongoose.model('Signal', signalSchema);
