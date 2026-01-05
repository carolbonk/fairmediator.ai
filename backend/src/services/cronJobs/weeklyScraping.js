#!/usr/bin/env node
/**
 * Weekly Scraping Cron Job
 * Runs at 3 AM every Sunday for comprehensive affiliation analysis
 * Called by Render cron service
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { monitor } = require('../../utils/freeTierMonitor');
const { getTargetsByFrequency } = require('../../config/scrapingTargets');
const affiliationDetector = require('../scraping/affiliationDetector');
const Mediator = require('../../models/Mediator');
const logger = require('../../config/logger');

async function runWeeklyScraping() {
  try {
    logger.info('Starting weekly scraping job');
    console.log('🔍 Running weekly affiliation analysis...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('MongoDB connected for weekly scraping');

    // Get weekly scraping targets
    const targets = getTargetsByFrequency('weekly');
    logger.info(`Found ${targets.length} weekly scraping targets`);
    console.log(`Found ${targets.length} weekly targets`);

    // Also analyze existing mediators
    const mediators = await Mediator.find({ isActive: true }).limit(100);
    logger.info(`Found ${mediators.length} active mediators to analyze`);
    console.log(`Analyzing ${mediators.length} active mediators...`);

    let successCount = 0;
    let errorCount = 0;

    // Analyze affiliations for each mediator
    for (const mediator of mediators) {
      try {
        // Check Hugging Face quota
        if (!monitor.isAllowed('huggingface')) {
          logger.warn('Hugging Face quota exhausted, stopping');
          console.log('⚠️ Hugging Face quota exhausted, stopping');
          break;
        }

        logger.info(`Analyzing affiliations for ${mediator.name}`);
        console.log(`Analyzing ${mediator.name}...`);

        await affiliationDetector.analyzeMediatorProfile(mediator._id);

        // Track usage
        monitor.track('huggingface', 1);
        successCount++;

        // Wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        logger.error(`Failed to analyze ${mediator.name}`, {
          error: error.message,
          mediatorId: mediator._id
        });
        console.error(`❌ Failed to analyze ${mediator.name}:`, error.message);
        errorCount++;
      }
    }

    logger.info('Weekly affiliation analysis completed', {
      total: mediators.length,
      success: successCount,
      errors: errorCount
    });
    console.log(`✅ Weekly analysis complete: ${successCount} success, ${errorCount} errors`);

  } catch (error) {
    logger.error('Weekly scraping job failed', {
      error: error.message,
      stack: error.stack
    });
    console.error('❌ Weekly scraping error:', error.message);
    process.exit(1);

  } finally {
    // Close connections
    await mongoose.connection.close();
    logger.info('Weekly scraping job finished, connections closed');
  }
}

// Run the job
runWeeklyScraping()
  .then(() => {
    console.log('Weekly scraping job finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Weekly scraping job failed:', error);
    process.exit(1);
  });
