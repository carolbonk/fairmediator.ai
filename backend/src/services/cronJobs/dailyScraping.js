#!/usr/bin/env node
/**
 * Daily Scraping Cron Job
 * Runs at 2 AM daily to refresh stale mediator data
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { monitor } = require('../../utils/freeTierMonitor');
const { getTargetsByFrequency } = require('../../config/scrapingTargets');
const mediatorScraper = require('../scraping/mediatorScraper');
const logger = require('../../config/logger');

async function runDailyScraping() {
  try {
    logger.info('Starting daily scraping job');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('MongoDB connected for daily scraping');

    // Check free tier limits
    if (!monitor.isAllowed('scraping')) {
      logger.error('Daily scraping limit reached');
      process.exit(1);
    }

    // Get daily scraping targets
    const targets = getTargetsByFrequency('daily');
    logger.info(`Found ${targets.length} daily scraping targets`);

    let successCount = 0;
    let errorCount = 0;

    // Scrape each target
    for (const target of targets) {
      try {
        // Check if we still have quota
        if (!monitor.isAllowed('scraping')) {
          logger.warn('Scraping quota exhausted, stopping');
          break;
        }

        logger.info(`Scraping ${target.stateName} - ${target.type}`);

        await mediatorScraper.scrapeMediatorProfile(
          target.url,
          target.type,
          true // dynamic scraping
        );

        // Track usage
        monitor.track('scraping', 1);
        successCount++;

        // Respect rate limits - wait 3 seconds between requests
        await new Promise(resolve => setTimeout(resolve, 3000));

      } catch (error) {
        logger.error(`Failed to scrape ${target.stateName}`, {
          error: error.message,
          stack: error.stack,
          url: target.url
        });
        errorCount++;
      }
    }

    logger.info('Daily scraping job completed', {
      total: targets.length,
      success: successCount,
      errors: errorCount
    });

  } catch (error) {
    logger.error('Daily scraping job failed', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);

  } finally {
    // Close connections
    await mediatorScraper.close();
    await mongoose.connection.close();
    logger.info('Daily scraping job finished, connections closed');
  }
}

// Run the job
runDailyScraping()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
