/**
 * Conflict Detection Model Retraining Script
 * Active Learning - Uses human feedback to improve conflict detection
 *
 * This script:
 * 1. Fetches high-value training examples from ConflictFeedback
 * 2. Prepares training data in the format needed for model fine-tuning
 * 3. Exports data for manual model retraining or automated pipeline
 * 4. Updates model version and marks examples as used
 */

require('dotenv').config();
const mongoose = require('mongoose');
const ConflictFeedback = require('../models/ConflictFeedback');
const Mediator = require('../models/Mediator');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../config/logger');

class ConflictModelRetrainer {
  constructor() {
    this.modelVersion = process.env.CONFLICT_MODEL_VERSION || '1.0.0';
    this.minExamples = 100; // Minimum examples needed for retraining
    this.outputDir = path.join(__dirname, '../../data/training');
  }

  /**
   * Main retraining workflow
   */
  async retrain(options = {}) {
    const {
      limit = 1000,
      exportOnly = false,
      modelType = 'classification' // 'classification' or 'regression'
    } = options;

    try {
      console.log('🤖 Starting Conflict Detection Model Retraining\n');

      // Step 1: Fetch training data
      console.log('📊 Fetching training data from feedback...');
      const trainingExamples = await this.fetchTrainingData(limit);

      if (trainingExamples.length < this.minExamples) {
        console.log(`⚠️  Insufficient training data: ${trainingExamples.length}/${this.minExamples} examples`);
        console.log('Need more human feedback before retraining.');
        return {
          success: false,
          reason: 'insufficient_data',
          examples: trainingExamples.length,
          required: this.minExamples
        };
      }

      console.log(`✅ Loaded ${trainingExamples.length} training examples\n`);

      // Step 2: Prepare training data
      console.log('🔧 Preparing training data...');
      const preparedData = await this.prepareTrainingData(trainingExamples, modelType);
      console.log(`✅ Prepared ${preparedData.train.length} training examples\n`);

      // Step 3: Export data
      console.log('💾 Exporting training data...');
      const exportPaths = await this.exportTrainingData(preparedData);
      console.log('✅ Data exported to:');
      Object.entries(exportPaths).forEach(([key, filepath]) => {
        console.log(`   ${key}: ${filepath}`);
      });

      if (exportOnly) {
        console.log('\n✅ Export complete (retraining skipped)');
        return {
          success: true,
          mode: 'export_only',
          exportPaths,
          examples: trainingExamples.length
        };
      }

      // Step 4: Generate model metrics report
      console.log('\n📈 Generating performance metrics...');
      const metrics = await this.generateMetricsReport(trainingExamples);
      await this.exportMetrics(metrics);
      console.log('✅ Metrics report generated\n');

      // Step 5: Mark examples as used for retraining
      console.log('🏷️  Marking examples as used for retraining...');
      const feedbackIds = trainingExamples.map(ex => ex._id);
      await ConflictFeedback.markAsRetrained(feedbackIds);
      console.log(`✅ Marked ${feedbackIds.length} examples as used\n`);

      // Step 6: Display recommendations
      console.log('📝 Recommendations for next steps:');
      console.log('   1. Review exported training data files');
      console.log('   2. Fine-tune conflict detection model using prepared datasets');
      console.log('   3. Evaluate model on validation set');
      console.log('   4. Update CONFLICT_MODEL_VERSION in .env');
      console.log('   5. Deploy updated model to production\n');

      console.log('✅ Retraining preparation complete!\n');

      return {
        success: true,
        mode: 'full_retrain',
        exportPaths,
        metrics,
        examples: trainingExamples.length,
        modelVersion: this.modelVersion
      };

    } catch (error) {
      console.error('❌ Error during retraining:', error);
      logger.error('Model retraining error:', error);
      throw error;
    }
  }

  /**
   * Fetch high-value training examples from feedback
   */
  async fetchTrainingData(limit) {
    const feedback = await ConflictFeedback.find({
      status: 'reviewed',
      isHighValue: true,
      usedForRetraining: false
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('mediatorId');

    return feedback;
  }

  /**
   * Prepare training data in format for model fine-tuning
   */
  async prepareTrainingData(examples, modelType) {
    const prepared = {
      train: [],
      validation: [],
      test: []
    };

    // Shuffle examples
    const shuffled = examples.sort(() => Math.random() - 0.5);

    // Split: 70% train, 15% validation, 15% test
    const trainSize = Math.floor(shuffled.length * 0.7);
    const valSize = Math.floor(shuffled.length * 0.15);

    const trainExamples = shuffled.slice(0, trainSize);
    const valExamples = shuffled.slice(trainSize, trainSize + valSize);
    const testExamples = shuffled.slice(trainSize + valSize);

    // Convert to training format
    prepared.train = trainExamples.map(ex => this.formatExample(ex, modelType));
    prepared.validation = valExamples.map(ex => this.formatExample(ex, modelType));
    prepared.test = testExamples.map(ex => this.formatExample(ex, modelType));

    return prepared;
  }

  /**
   * Format single example for model training
   */
  formatExample(feedback, modelType) {
    const mediator = feedback.mediatorId;

    // Input features
    const input = {
      // Mediator profile
      mediator_name: mediator.name,
      mediator_location: `${mediator.location?.city || ''}, ${mediator.location?.state || ''}`,
      mediator_specializations: mediator.specializations || [],
      mediator_years_experience: mediator.yearsExperience || 0,
      mediator_ideology_score: mediator.ideologyScore || 0,
      mediator_affiliations: mediator.affiliations?.map(a => ({
        type: a.type,
        name: a.name,
        role: a.role,
        is_current: a.isCurrent
      })) || [],
      mediator_cases: mediator.cases?.length || 0,

      // Case context
      case_parties: feedback.parties,
      case_type: feedback.caseType,

      // AI prediction (for analysis)
      ai_prediction: {
        has_conflict: feedback.prediction.hasConflict,
        risk_level: feedback.prediction.riskLevel,
        confidence: feedback.prediction.confidence,
        detected_conflicts: feedback.prediction.detectedConflicts
      }
    };

    // Ground truth label
    const label = modelType === 'classification'
      ? feedback.feedback.hasConflict
      : this.riskLevelToScore(feedback.feedback.actualRiskLevel);

    // Additional metadata
    const metadata = {
      feedback_id: feedback._id.toString(),
      mediator_id: mediator._id.toString(),
      prediction_error: feedback.predictionError,
      is_high_value: feedback.isHighValue,
      reviewer_confidence: feedback.feedback.confidence,
      actual_conflicts: feedback.feedback.actualConflicts || []
    };

    return {
      input,
      label,
      metadata
    };
  }

  /**
   * Convert risk level to numeric score
   */
  riskLevelToScore(riskLevel) {
    const mapping = {
      'none': 0,
      'low': 0.25,
      'medium': 0.5,
      'high': 1.0
    };
    return mapping[riskLevel] || 0;
  }

  /**
   * Export training data to files
   */
  async exportTrainingData(preparedData) {
    // Ensure output directory exists
    await fs.mkdir(this.outputDir, { recursive: true });

    const timestamp = new Date().toISOString().split('T')[0];
    const paths = {};

    // Export train, validation, test sets
    for (const [split, data] of Object.entries(preparedData)) {
      const filename = `conflict_${split}_${timestamp}.json`;
      const filepath = path.join(this.outputDir, filename);

      await fs.writeFile(filepath, JSON.stringify(data, null, 2));
      paths[split] = filepath;
    }

    // Export combined dataset
    const combinedPath = path.join(this.outputDir, `conflict_combined_${timestamp}.json`);
    await fs.writeFile(combinedPath, JSON.stringify(preparedData, null, 2));
    paths.combined = combinedPath;

    // Export JSONL format (common for ML training)
    const jsonlPath = path.join(this.outputDir, `conflict_train_${timestamp}.jsonl`);
    const jsonlData = preparedData.train.map(ex => JSON.stringify(ex)).join('\n');
    await fs.writeFile(jsonlPath, jsonlData);
    paths.jsonl = jsonlPath;

    return paths;
  }

  /**
   * Generate performance metrics report
   */
  async generateMetricsReport(trainingExamples) {
    const total = trainingExamples.length;

    // Count prediction errors
    const errorCounts = {
      false_positive: 0,
      false_negative: 0,
      correct: 0,
      partial: 0
    };

    trainingExamples.forEach(ex => {
      errorCounts[ex.predictionError]++;
    });

    // Breakdown by case type
    const byCaseType = {};
    trainingExamples.forEach(ex => {
      if (!byCaseType[ex.caseType]) {
        byCaseType[ex.caseType] = {
          total: 0,
          correct: 0,
          false_positive: 0,
          false_negative: 0
        };
      }
      byCaseType[ex.caseType].total++;
      byCaseType[ex.caseType][ex.predictionError]++;
    });

    // Overall metrics
    const accuracy = total > 0 ? (errorCounts.correct / total) * 100 : 0;

    return {
      total_examples: total,
      error_distribution: errorCounts,
      accuracy: accuracy.toFixed(2),
      by_case_type: byCaseType,
      model_version: this.modelVersion,
      generated_at: new Date().toISOString()
    };
  }

  /**
   * Export metrics to file
   */
  async exportMetrics(metrics) {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `metrics_${timestamp}.json`;
    const filepath = path.join(this.outputDir, filename);

    await fs.writeFile(filepath, JSON.stringify(metrics, null, 2));

    console.log('\n📊 Training Data Metrics:');
    console.log(`   Total Examples: ${metrics.total_examples}`);
    console.log(`   Current Accuracy: ${metrics.accuracy}%`);
    console.log(`   False Positives: ${metrics.error_distribution.false_positive}`);
    console.log(`   False Negatives: ${metrics.error_distribution.false_negative}`);
    console.log(`   Correct Predictions: ${metrics.error_distribution.correct}`);

    return filepath;
  }

  /**
   * Get current model performance from all historical feedback
   */
  async getCurrentPerformance() {
    return await ConflictFeedback.getPerformanceMetrics();
  }
}

// CLI interface
async function main() {
  try {
    console.log(`
╔══════════════════════════════════════════════════════╗
║   Conflict Detection Model Retraining               ║
╚══════════════════════════════════════════════════════╝
`);

    // Parse CLI arguments
    const args = process.argv.slice(2);
    const exportOnly = args.includes('--export-only');
    const limit = parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1]) || 1000;

    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Run retraining
    const retrainer = new ConflictModelRetrainer();

    // Show current performance
    console.log('📊 Current Model Performance:');
    const currentPerf = await retrainer.getCurrentPerformance();
    console.log(`   Accuracy: ${currentPerf.accuracy}%`);
    console.log(`   Precision: ${currentPerf.precision}%`);
    console.log(`   Recall: ${currentPerf.recall}%`);
    console.log(`   F1 Score: ${currentPerf.f1Score}%\n`);

    const result = await retrainer.retrain({
      limit,
      exportOnly
    });

    if (result.success) {
      console.log('✅ SUCCESS!');
    } else {
      console.log(`⚠️  ${result.reason}`);
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = ConflictModelRetrainer;
