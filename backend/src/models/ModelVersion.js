/**
 * ModelVersion Model
 * Tracks AI model versions, metrics, and performance over time
 * Used for Active Learning pipeline and model management
 */

const mongoose = require('mongoose');

const modelVersionSchema = new mongoose.Schema({
  // Model identification
  version: {
    type: String,
    required: true,
    unique: true,
    // Format: "1.0.0", "1.1.0", "2.0.0"
  },
  modelType: {
    type: String,
    required: true,
    enum: [
      'conflict_detection',  // Conflict of interest detection
      'ideology_classification', // Political ideology classification
      'sentiment_analysis',  // Text sentiment analysis
      'mediator_matching'    // Mediator recommendation scoring
    ],
    index: true
  },

  // Performance metrics
  metrics: {
    // Classification metrics
    f1Score: {
      type: Number,
      min: 0,
      max: 1
    },
    precision: {
      type: Number,
      min: 0,
      max: 1
    },
    recall: {
      type: Number,
      min: 0,
      max: 1
    },
    accuracy: {
      type: Number,
      min: 0,
      max: 1
    },

    // Additional metrics
    confusionMatrix: {
      truePositives: Number,
      falsePositives: Number,
      trueNegatives: Number,
      falseNegatives: Number
    },

    // Sample statistics
    samples: {
      type: Number,
      required: true
    },
    testSetSize: Number,
    trainSetSize: Number,

    // Performance by class (for multi-class problems)
    perClassMetrics: [{
      className: String,
      f1: Number,
      precision: Number,
      recall: Number,
      support: Number  // Number of samples in this class
    }]
  },

  // Model configuration
  hyperparameters: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
    // Example: { learning_rate: 0.001, batch_size: 32, epochs: 10 }
  },

  modelArchitecture: {
    type: String
    // Example: "distilbert-base-uncased", "roberta-large", "custom-lstm"
  },

  // Training information
  trainingData: {
    examples: {
      type: Number,
      required: true
    },
    sources: [{
      type: String
      // Example: "human_feedback", "initial_seed", "synthetic"
    }],
    startDate: Date,
    endDate: Date,
    trainingDuration: Number  // in seconds
  },

  // Evaluation information
  evaluation: {
    testSetId: String,
    evaluationDate: {
      type: Date,
      default: Date.now
    },
    evaluationDuration: Number,  // in seconds
    evaluatedBy: {
      type: String,
      default: 'system'
      // Could be: "system", "manual", "a/b_test"
    }
  },

  // Deployment status
  isActive: {
    type: Boolean,
    default: false,
    index: true
  },
  deployedAt: Date,
  deactivatedAt: Date,

  // Version history
  previousVersion: {
    type: String,
    ref: 'ModelVersion'
  },
  improvementOverPrevious: {
    type: Number
    // Percentage improvement in F1 score
  },

  // Model artifacts
  artifacts: {
    modelPath: String,          // Path to saved model weights
    checkpointPath: String,     // Path to training checkpoint
    configPath: String,         // Path to model config
    vocabularyPath: String,     // Path to tokenizer vocabulary
    size: Number                // Model size in bytes
  },

  // Metadata
  notes: String,
  createdBy: {
    type: String,
    default: 'system'
  },
  tags: [String]  // E.g., ["production", "experimental", "hotfix"]

}, {
  timestamps: true  // Adds createdAt and updatedAt
});

// Indexes for efficient querying
modelVersionSchema.index({ modelType: 1, isActive: 1 });
modelVersionSchema.index({ modelType: 1, 'metrics.f1Score': -1 });
modelVersionSchema.index({ createdAt: -1 });

// Virtual: Performance grade
modelVersionSchema.virtual('performanceGrade').get(function() {
  if (!this.metrics || !this.metrics.f1Score) return 'N/A';

  const f1 = this.metrics.f1Score;
  if (f1 >= 0.90) return 'A';
  if (f1 >= 0.80) return 'B';
  if (f1 >= 0.70) return 'C';
  if (f1 >= 0.60) return 'D';
  return 'F';
});

// Static method: Get active model for a type
modelVersionSchema.statics.getActiveModel = async function(modelType) {
  return this.findOne({ modelType, isActive: true });
};

// Static method: Get model performance history
modelVersionSchema.statics.getPerformanceHistory = async function(modelType, limit = 10) {
  return this.find({ modelType })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('version metrics.f1Score metrics.accuracy createdAt isActive');
};

// Static method: Get best performing model
modelVersionSchema.statics.getBestModel = async function(modelType) {
  return this.findOne({ modelType })
    .sort({ 'metrics.f1Score': -1 })
    .limit(1);
};

// Static method: Compare two versions
modelVersionSchema.statics.compareVersions = async function(version1, version2) {
  const [v1, v2] = await Promise.all([
    this.findOne({ version: version1 }),
    this.findOne({ version: version2 })
  ]);

  if (!v1 || !v2) {
    throw new Error('One or both versions not found');
  }

  return {
    version1: {
      version: v1.version,
      f1Score: v1.metrics.f1Score,
      precision: v1.metrics.precision,
      recall: v1.metrics.recall,
      samples: v1.metrics.samples
    },
    version2: {
      version: v2.version,
      f1Score: v2.metrics.f1Score,
      precision: v2.metrics.precision,
      recall: v2.metrics.recall,
      samples: v2.metrics.samples
    },
    improvement: {
      f1Score: ((v2.metrics.f1Score - v1.metrics.f1Score) / v1.metrics.f1Score * 100).toFixed(2) + '%',
      precision: ((v2.metrics.precision - v1.metrics.precision) / v1.metrics.precision * 100).toFixed(2) + '%',
      recall: ((v2.metrics.recall - v1.metrics.recall) / v1.metrics.recall * 100).toFixed(2) + '%'
    },
    winner: v2.metrics.f1Score > v1.metrics.f1Score ? v2.version : v1.version
  };
};

// Instance method: Activate this version (deactivate others)
modelVersionSchema.methods.activate = async function() {
  // Deactivate all other versions of same type
  await this.constructor.updateMany(
    { modelType: this.modelType, isActive: true },
    { isActive: false, deactivatedAt: new Date() }
  );

  // Activate this version
  this.isActive = true;
  this.deployedAt = new Date();
  await this.save();

  return this;
};

// Instance method: Calculate improvement over previous version
modelVersionSchema.methods.calculateImprovement = async function() {
  if (!this.previousVersion) return null;

  const prev = await this.constructor.findOne({ version: this.previousVersion });
  if (!prev || !prev.metrics || !prev.metrics.f1Score) return null;

  if (!this.metrics || !this.metrics.f1Score) return null;

  const improvement = ((this.metrics.f1Score - prev.metrics.f1Score) / prev.metrics.f1Score) * 100;
  this.improvementOverPrevious = improvement;

  return improvement;
};

// Pre-save hook: Auto-calculate improvement
modelVersionSchema.pre('save', async function(next) {
  if (this.isNew && this.previousVersion && !this.improvementOverPrevious) {
    await this.calculateImprovement();
  }
  next();
});

module.exports = mongoose.model('ModelVersion', modelVersionSchema);
