#!/usr/bin/env node
/**
 * Daily Model Evaluation Cron Job
 * Runs at 3 AM daily to calculate F1 scores for active models
 * Part of Active Learning pipeline
 */

require('dotenv').config();
const mongoose = require('mongoose');
const modelMetrics = require('../ai/modelMetrics');
const ModelVersion = require('../../models/ModelVersion');
const logger = require('../../config/logger');

async function runDailyEvaluation() {
  try {
    logger.info('Starting daily model evaluation job');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('MongoDB connected for model evaluation');

    // Get active conflict detection model
    const activeModel = await ModelVersion.getActiveModel('conflict_detection');

    if (!activeModel) {
      logger.warn('No active model found for evaluation — create one via POST /api/models/versions');
      process.exit(0);
    }

    logger.info('Evaluating model', {
      version: activeModel.version,
      lastEvaluation: activeModel.evaluation?.evaluationDate || 'Never',
      currentF1: activeModel.metrics?.f1Score || 'N/A'
    });

    // Evaluate model using recent feedback (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const evaluation = await modelMetrics.evaluateConflictModel('current', {
      startDate: sevenDaysAgo,
      minFeedbackConfidence: 0.7  // Only use high-confidence human feedback
    });

    if (!evaluation.success) {
      logger.warn('Evaluation skipped due to insufficient data', {
        reason: evaluation.reason,
        samples: evaluation.samplesFound
      });
      process.exit(0);
    }

    // Display results
    const { metrics } = evaluation;
    logger.info('Evaluation complete', {
      f1Score: metrics.f1Score,
      precision: metrics.precision,
      recall: metrics.recall,
      accuracy: metrics.accuracy,
      samples: metrics.samples,
      confusionMatrix: metrics.confusionMatrix
    });

    // Update model with new metrics
    activeModel.metrics = metrics;
    activeModel.evaluation = {
      ...activeModel.evaluation,
      evaluationDate: new Date(),
      evaluatedBy: 'daily_cron_job',
      testSetSize: evaluation.evaluation.testSetSize
    };
    await activeModel.save();

    logger.info('Model metrics updated in database');

    // Check if model meets quality threshold
    const threshold = 0.75;
    if (metrics.f1Score < threshold) {
      logger.warn('Model performance below threshold', {
        f1Score: metrics.f1Score,
        threshold,
        version: activeModel.version
      });
    } else {
      logger.info('Model performance acceptable', {
        f1Score: metrics.f1Score,
        version: activeModel.version
      });
    }

    // Get performance trend
    const trends = await modelMetrics.getPerformanceTrends('conflict_detection', 30);
    if (trends.length > 1) {
      const latest = trends[trends.length - 1];
      const previous = trends[trends.length - 2];
      const change = ((latest.f1Score - previous.f1Score) / previous.f1Score * 100).toFixed(2);
      logger.info('Model performance trend', { change: `${change}%`, direction: change > 0 ? 'improved' : change < 0 ? 'decreased' : 'unchanged' });
    }

    // Log summary
    logger.info('Daily model evaluation complete', {
      version: activeModel.version,
      f1Score: metrics.f1Score,
      precision: metrics.precision,
      recall: metrics.recall,
      samples: metrics.samples,
      meetsThreshold: metrics.f1Score >= threshold
    });


    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    logger.error('Daily model evaluation failed', {
      error: error.message,
      stack: error.stack
    });

    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      // Ignore disconnect errors
    }

    process.exit(1);
  }
}

// Run the job
if (require.main === module) {
  runDailyEvaluation();
}

module.exports = runDailyEvaluation;
