/**
 * Model Metrics Service
 * Calculates and tracks AI model performance metrics (F1, precision, recall, etc.)
 * Core component of Active Learning pipeline
 */

const ModelVersion = require('../../models/ModelVersion');
const ConflictFeedback = require('../../models/ConflictFeedback');
const logger = require('../../config/logger');

class ModelMetrics {
  /**
   * Calculate F1 score from predictions and ground truth
   * @param {Array} predictions - Array of prediction objects: { id, predicted: boolean }
   * @param {Array} groundTruth - Array of ground truth objects: { id, actual: boolean }
   * @returns {Object} - Metrics: { f1Score, precision, recall, accuracy, confusionMatrix }
   */
  calculateF1(predictions, groundTruth) {
    // Create maps for quick lookup
    const predMap = new Map(predictions.map(p => [p.id, p.predicted]));
    const truthMap = new Map(groundTruth.map(t => [t.id, t.actual]));

    // Ensure we're comparing same samples
    const commonIds = predictions
      .map(p => p.id)
      .filter(id => truthMap.has(id));

    if (commonIds.length === 0) {
      throw new Error('No common samples between predictions and ground truth');
    }

    // Calculate confusion matrix
    let truePositives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    let falseNegatives = 0;

    commonIds.forEach(id => {
      const predicted = predMap.get(id);
      const actual = truthMap.get(id);

      if (predicted && actual) truePositives++;
      else if (predicted && !actual) falsePositives++;
      else if (!predicted && !actual) trueNegatives++;
      else if (!predicted && actual) falseNegatives++;
    });

    // Calculate metrics
    const precision = truePositives + falsePositives === 0
      ? 0
      : truePositives / (truePositives + falsePositives);

    const recall = truePositives + falseNegatives === 0
      ? 0
      : truePositives / (truePositives + falseNegatives);

    const f1Score = precision + recall === 0
      ? 0
      : 2 * (precision * recall) / (precision + recall);

    const accuracy = (truePositives + trueNegatives) / commonIds.length;

    return {
      f1Score: Math.round(f1Score * 10000) / 10000,  // 4 decimal places
      precision: Math.round(precision * 10000) / 10000,
      recall: Math.round(recall * 10000) / 10000,
      accuracy: Math.round(accuracy * 10000) / 10000,
      confusionMatrix: {
        truePositives,
        falsePositives,
        trueNegatives,
        falseNegatives
      },
      samples: commonIds.length
    };
  }

  /**
   * Evaluate conflict detection model using human feedback
   * @param {String} modelVersion - Version to evaluate (or 'current' for active model)
   * @param {Object} options - Evaluation options
   * @returns {Object} - Evaluation results with metrics
   */
  async evaluateConflictModel(modelVersion = 'current', options = {}) {
    const {
      startDate = null,
      endDate = new Date(),
      minFeedbackConfidence = 0.7,  // Only use high-confidence human feedback
      testSetSize = null  // Limit test set size (null = use all)
    } = options;

    try {
      logger.info(`Evaluating conflict detection model: ${modelVersion}`);

      // 1. Get model info
      let model;
      if (modelVersion === 'current') {
        model = await ModelVersion.getActiveModel('conflict_detection');
        if (!model) {
          throw new Error('No active conflict detection model found');
        }
      } else {
        model = await ModelVersion.findOne({ version: modelVersion });
        if (!model) {
          throw new Error(`Model version ${modelVersion} not found`);
        }
      }

      // 2. Fetch human feedback (ground truth)
      const feedbackQuery = {
        'feedback.confidence': { $gte: minFeedbackConfidence }
      };

      if (startDate) {
        feedbackQuery.createdAt = { $gte: startDate, $lte: endDate };
      }

      let feedbackData = await ConflictFeedback.find(feedbackQuery)
        .select('prediction feedback')
        .lean();

      if (testSetSize && feedbackData.length > testSetSize) {
        // Randomly sample if we have more data than needed
        feedbackData = this.randomSample(feedbackData, testSetSize);
      }

      if (feedbackData.length === 0) {
        logger.warn('No feedback data available for evaluation');
        return {
          success: false,
          reason: 'insufficient_data',
          samplesFound: 0
        };
      }

      logger.info(`Found ${feedbackData.length} feedback samples for evaluation`);

      // 3. Prepare predictions and ground truth
      const predictions = feedbackData.map(f => ({
        id: f._id.toString(),
        predicted: f.prediction.hasConflict
      }));

      const groundTruth = feedbackData.map(f => ({
        id: f._id.toString(),
        actual: f.feedback.hasConflict
      }));

      // 4. Calculate metrics
      const metrics = this.calculateF1(predictions, groundTruth);

      logger.info(`Evaluation complete: F1=${metrics.f1Score}, Precision=${metrics.precision}, Recall=${metrics.recall}`);

      // 5. Return results
      return {
        success: true,
        modelVersion: model.version,
        modelType: model.modelType,
        metrics,
        evaluation: {
          startDate: startDate || feedbackData[feedbackData.length - 1].createdAt,
          endDate,
          testSetSize: feedbackData.length,
          minFeedbackConfidence
        },
        timestamp: new Date()
      };

    } catch (error) {
      logger.error('Error evaluating model:', error);
      throw error;
    }
  }

  /**
   * Create or update model version with evaluation metrics
   * @param {String} version - Model version (e.g., "1.0.0")
   * @param {Object} metrics - Evaluation metrics
   * @param {Object} modelInfo - Additional model information
   * @returns {Object} - Saved ModelVersion document
   */
  async saveModelVersion(version, metrics, modelInfo = {}) {
    try {
      const {
        modelType = 'conflict_detection',
        hyperparameters = {},
        modelArchitecture = null,
        trainingData = {},
        isActive = false,
        previousVersion = null
      } = modelInfo;

      // Check if version already exists
      let modelVersion = await ModelVersion.findOne({ version });

      if (modelVersion) {
        // Update existing
        modelVersion.metrics = metrics;
        if (Object.keys(hyperparameters).length > 0) {
          modelVersion.hyperparameters = hyperparameters;
        }
      } else {
        // Create new
        modelVersion = new ModelVersion({
          version,
          modelType,
          metrics,
          hyperparameters,
          modelArchitecture,
          trainingData,
          isActive,
          previousVersion,
          evaluation: {
            evaluationDate: new Date(),
            evaluatedBy: 'system'
          }
        });
      }

      await modelVersion.save();

      logger.info(`Saved model version ${version} with F1=${metrics.f1Score}`);

      return modelVersion;
    } catch (error) {
      logger.error('Error saving model version:', error);
      throw error;
    }
  }

  /**
   * Get model performance trends over time
   * @param {String} modelType - Type of model
   * @param {Number} days - Number of days to look back
   * @returns {Array} - Performance history
   */
  async getPerformanceTrends(modelType = 'conflict_detection', days = 30) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const versions = await ModelVersion.find({
        modelType,
        createdAt: { $gte: since }
      })
        .sort({ createdAt: 1 })
        .select('version metrics.f1Score metrics.precision metrics.recall createdAt isActive')
        .lean();

      return versions.map(v => ({
        version: v.version,
        date: v.createdAt,
        f1Score: v.metrics?.f1Score || 0,
        precision: v.metrics?.precision || 0,
        recall: v.metrics?.recall || 0,
        isActive: v.isActive
      }));
    } catch (error) {
      logger.error('Error getting performance trends:', error);
      throw error;
    }
  }

  /**
   * Check if model meets quality threshold
   * @param {Object} metrics - Model metrics
   * @param {Number} threshold - Minimum F1 score (default: 0.75)
   * @returns {Boolean} - True if model meets threshold
   */
  meetsQualityThreshold(metrics, threshold = 0.75) {
    return metrics.f1Score >= threshold;
  }

  /**
   * Randomly sample array
   * @param {Array} array - Array to sample
   * @param {Number} size - Sample size
   * @returns {Array} - Random sample
   */
  randomSample(array, size) {
    const shuffled = array.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, size);
  }

  /**
   * Get current model status and health
   * @param {String} modelType - Type of model
   * @returns {Object} - Model status
   */
  async getModelStatus(modelType = 'conflict_detection') {
    try {
      const activeModel = await ModelVersion.getActiveModel(modelType);

      if (!activeModel) {
        return {
          status: 'NO_ACTIVE_MODEL',
          message: `No active ${modelType} model found`,
          healthy: false
        };
      }

      const f1Score = activeModel.metrics?.f1Score || 0;
      const threshold = 0.75;

      const health = {
        status: f1Score >= threshold ? 'HEALTHY' : 'NEEDS_IMPROVEMENT',
        version: activeModel.version,
        f1Score,
        threshold,
        healthy: f1Score >= threshold,
        deployedAt: activeModel.deployedAt,
        daysActive: Math.floor((Date.now() - activeModel.deployedAt) / (1000 * 60 * 60 * 24))
      };

      return health;
    } catch (error) {
      logger.error('Error getting model status:', error);
      throw error;
    }
  }
}

// Singleton instance
const modelMetrics = new ModelMetrics();

module.exports = modelMetrics;
