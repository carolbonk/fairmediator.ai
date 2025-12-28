/**
 * ConflictFeedback Model
 * Stores human feedback on conflict detection for active learning
 * Enables continuous improvement of conflict detection models
 */

const mongoose = require('mongoose');

const conflictFeedbackSchema = new mongoose.Schema({
  // Reference to mediator being evaluated
  mediatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mediator',
    required: true,
    index: true
  },

  // Case/query context
  caseId: {
    type: String,
    index: true
  },
  parties: [{
    type: String,
    required: true
  }],
  caseType: {
    type: String,
    enum: ['employment', 'business', 'family', 'real_estate', 'contract', 'ip', 'construction', 'healthcare', 'other'],
    default: 'other'
  },

  // AI prediction
  prediction: {
    hasConflict: {
      type: Boolean,
      required: true
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'unknown'],
      default: 'unknown'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    detectedConflicts: [{
      entity: String,
      relationship: String,
      source: String, // e.g., 'affiliation', 'case_history', 'bio_analysis'
      confidence: Number
    }],
    modelVersion: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  },

  // Human feedback (ground truth)
  feedback: {
    hasConflict: {
      type: Boolean,
      required: true
    },
    actualRiskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'none'],
      required: true
    },
    actualConflicts: [{
      entity: String,
      relationship: String,
      severity: {
        type: String,
        enum: ['minor', 'moderate', 'severe']
      },
      notes: String
    }],
    notes: String, // General notes from reviewer
    confidence: {
      type: Number,
      min: 0,
      max: 1
    } // How confident is the human reviewer
  },

  // Feedback metadata
  reviewedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'legal_expert', 'mediator', 'user', 'system']
    },
    expertise: String
  },

  // Quality metrics
  isCorrectPrediction: {
    type: Boolean
  },
  predictionError: {
    type: String,
    enum: ['false_positive', 'false_negative', 'correct', 'partial']
  },

  // Active learning flags
  isHighValue: {
    type: Boolean,
    default: false
  }, // High-value examples for training (e.g., near decision boundary)
  uncertaintyScore: Number, // Model uncertainty for this prediction
  usedForRetraining: {
    type: Boolean,
    default: false
  },
  retrainingDate: Date,

  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'validated', 'disputed', 'archived'],
    default: 'pending',
    index: true
  },

  // Dispute resolution (if multiple reviewers disagree)
  disputes: [{
    reviewerId: mongoose.Schema.Types.ObjectId,
    feedback: Object,
    timestamp: Date,
    notes: String
  }],

  // Additional context
  queryText: String, // Original user query
  conversationContext: [Object], // Previous messages if applicable

  // System metadata
  source: {
    type: String,
    enum: ['api', 'admin_panel', 'batch_review', 'automated'],
    default: 'api'
  },
  tags: [String]
}, {
  timestamps: true
});

// Indexes for efficient queries
conflictFeedbackSchema.index({ mediatorId: 1, 'feedback.hasConflict': 1 });
conflictFeedbackSchema.index({ caseType: 1, status: 1 });
conflictFeedbackSchema.index({ isHighValue: 1, usedForRetraining: 1 });
conflictFeedbackSchema.index({ 'prediction.hasConflict': 1, 'feedback.hasConflict': 1 });
conflictFeedbackSchema.index({ createdAt: -1 });

// Pre-save hook: Calculate metrics
conflictFeedbackSchema.pre('save', function(next) {
  if (this.isModified('feedback.hasConflict')) {
    // Determine if prediction was correct
    this.isCorrectPrediction = this.prediction.hasConflict === this.feedback.hasConflict;

    // Classify prediction error
    if (this.isCorrectPrediction) {
      this.predictionError = 'correct';
    } else if (this.prediction.hasConflict && !this.feedback.hasConflict) {
      this.predictionError = 'false_positive';
    } else if (!this.prediction.hasConflict && this.feedback.hasConflict) {
      this.predictionError = 'false_negative';
    }

    // Mark high-value examples (disagreements are valuable for training)
    if (!this.isCorrectPrediction || this.prediction.confidence < 0.7) {
      this.isHighValue = true;
    }
  }

  next();
});

// Static methods

/**
 * Get model performance metrics
 */
conflictFeedbackSchema.statics.getPerformanceMetrics = async function(filters = {}) {
  const query = { status: 'reviewed', ...filters };

  const total = await this.countDocuments(query);
  const correct = await this.countDocuments({ ...query, isCorrectPrediction: true });
  const falsePositives = await this.countDocuments({ ...query, predictionError: 'false_positive' });
  const falseNegatives = await this.countDocuments({ ...query, predictionError: 'false_negative' });

  const accuracy = total > 0 ? (correct / total) * 100 : 0;
  const precision = (correct + falsePositives) > 0 ?
    (correct / (correct + falsePositives)) * 100 : 0;
  const recall = (correct + falseNegatives) > 0 ?
    (correct / (correct + falseNegatives)) * 100 : 0;
  const f1Score = (precision + recall) > 0 ?
    (2 * precision * recall) / (precision + recall) : 0;

  return {
    total,
    correct,
    falsePositives,
    falseNegatives,
    accuracy: accuracy.toFixed(2),
    precision: precision.toFixed(2),
    recall: recall.toFixed(2),
    f1Score: f1Score.toFixed(2)
  };
};

/**
 * Get high-value examples for retraining
 */
conflictFeedbackSchema.statics.getTrainingData = async function(limit = 1000) {
  return await this.find({
    status: 'reviewed',
    usedForRetraining: false,
    isHighValue: true
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('mediatorId', 'name location specializations yearsExperience ideologyScore affiliations');
};

/**
 * Mark examples as used for retraining
 */
conflictFeedbackSchema.statics.markAsRetrained = async function(feedbackIds) {
  return await this.updateMany(
    { _id: { $in: feedbackIds } },
    {
      $set: {
        usedForRetraining: true,
        retrainingDate: new Date()
      }
    }
  );
};

/**
 * Get feedback requiring review
 */
conflictFeedbackSchema.statics.getPendingReviews = async function(limit = 50) {
  return await this.find({ status: 'pending' })
    .sort({ createdAt: 1 }) // Oldest first
    .limit(limit)
    .populate('mediatorId', 'name location specializations');
};

module.exports = mongoose.model('ConflictFeedback', conflictFeedbackSchema);
