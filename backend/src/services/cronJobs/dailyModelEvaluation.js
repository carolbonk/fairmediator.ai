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
    console.log('🔄 Running daily AI model evaluation...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('MongoDB connected for model evaluation');

    // Get active conflict detection model
    const activeModel = await ModelVersion.getActiveModel('conflict_detection');

    if (!activeModel) {
      console.log('⚠️  No active conflict detection model found');
      console.log('   Create a model version first: POST /api/models/versions');
      logger.warn('No active model found for evaluation');
      process.exit(0);
    }

    console.log(`📊 Evaluating model: ${activeModel.version}`);
    console.log(`   Last evaluation: ${activeModel.evaluation?.evaluationDate || 'Never'}`);
    console.log(`   Current F1: ${activeModel.metrics?.f1Score || 'N/A'}\n`);

    // Evaluate model using recent feedback (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    console.log('📈 Calculating metrics from feedback data...');

    const evaluation = await modelMetrics.evaluateConflictModel('current', {
      startDate: sevenDaysAgo,
      minFeedbackConfidence: 0.7  // Only use high-confidence human feedback
    });

    if (!evaluation.success) {
      console.log(`⚠️  Evaluation skipped: ${evaluation.reason}`);
      console.log(`   Samples found: ${evaluation.samplesFound || 0}`);
      logger.warn('Evaluation skipped due to insufficient data', {
        reason: evaluation.reason,
        samples: evaluation.samplesFound
      });
      process.exit(0);
    }

    // Display results
    const { metrics } = evaluation;
    console.log('\n✅ Evaluation Complete!\n');
    console.log('📊 METRICS:');
    console.log(`   F1 Score:  ${(metrics.f1Score * 100).toFixed(2)}%`);
    console.log(`   Precision: ${(metrics.precision * 100).toFixed(2)}%`);
    console.log(`   Recall:    ${(metrics.recall * 100).toFixed(2)}%`);
    console.log(`   Accuracy:  ${(metrics.accuracy * 100).toFixed(2)}%`);
    console.log(`   Samples:   ${metrics.samples}\n`);

    console.log('🔢 CONFUSION MATRIX:');
    console.log(`   True Positives:  ${metrics.confusionMatrix.truePositives}`);
    console.log(`   False Positives: ${metrics.confusionMatrix.falsePositives}`);
    console.log(`   True Negatives:  ${metrics.confusionMatrix.trueNegatives}`);
    console.log(`   False Negatives: ${metrics.confusionMatrix.falseNegatives}\n`);

    // Update model with new metrics
    activeModel.metrics = metrics;
    activeModel.evaluation = {
      ...activeModel.evaluation,
      evaluationDate: new Date(),
      evaluatedBy: 'daily_cron_job',
      testSetSize: evaluation.evaluation.testSetSize
    };
    await activeModel.save();

    console.log('✅ Model metrics updated in database\n');

    // Check if model meets quality threshold
    const threshold = 0.75;
    if (metrics.f1Score < threshold) {
      console.log(`⚠️  WARNING: F1 score (${(metrics.f1Score * 100).toFixed(2)}%) below threshold (${threshold * 100}%)`);
      console.log('   Consider retraining the model with new feedback data');
      console.log('   Run: node backend/src/scripts/retrainConflictModel.js\n');

      logger.warn('Model performance below threshold', {
        f1Score: metrics.f1Score,
        threshold,
        version: activeModel.version
      });
    } else {
      console.log(`✅ Model performing well (F1 > ${threshold * 100}%)\n`);
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

      console.log('📈 TREND (vs. last evaluation):');
      if (change > 0) {
        console.log(`   ⬆️  Improved by ${change}%`);
      } else if (change < 0) {
        console.log(`   ⬇️  Decreased by ${Math.abs(change)}%`);
      } else {
        console.log(`   ➡️  No change`);
      }
      console.log('');
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

    console.log('✅ Daily evaluation job complete\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    logger.error('Daily model evaluation failed', {
      error: error.message,
      stack: error.stack
    });
    console.error('\n❌ Evaluation error:', error.message);
    console.error(error.stack);

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
