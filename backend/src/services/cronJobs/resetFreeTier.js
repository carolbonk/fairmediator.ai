#!/usr/bin/env node
/**
 * Free Tier Reset Cron Job
 * Runs at midnight daily to reset daily usage counters
 */

require('dotenv').config();
const { monitor } = require('../../utils/freeTierMonitor');
const logger = require('../../config/logger');

async function resetFreeTier() {
  try {
    logger.info('Starting free tier reset job');
    console.log('🔄 Resetting daily free tier counters...');

    // Get stats before reset
    const beforeStats = monitor.getStats();
    const alerts = monitor.getAlerts(5);

    logger.info('Pre-reset stats', {
      stats: beforeStats,
      recentAlerts: alerts
    });

    // Log any services that hit limits
    Object.entries(beforeStats).forEach(([service, stats]) => {
      if (stats.status === 'EXHAUSTED' || stats.status === 'CRITICAL') {
        logger.warn(`Service ${service} hit limits`, {
          current: stats.current,
          limit: stats.dailyLimit,
          percentage: stats.percentage
        });
        console.log(`⚠️ ${stats.name}: ${stats.percentage}% used (${stats.current}/${stats.dailyLimit})`);
      }
    });

    // Reset daily counters
    monitor.resetDaily();

    // Get stats after reset
    const afterStats = monitor.getStats();

    logger.info('Free tier counters reset successfully', {
      before: beforeStats,
      after: afterStats
    });
    console.log('✅ Daily free tier counters reset successfully');

    // Log summary
    console.log('\nDaily Usage Summary:');
    Object.entries(beforeStats).forEach(([service, stats]) => {
      console.log(`  ${stats.name}: ${stats.current || 0} / ${stats.dailyLimit || 'N/A'}`);
    });

  } catch (error) {
    logger.error('Free tier reset job failed', {
      error: error.message,
      stack: error.stack
    });
    console.error('❌ Free tier reset error:', error.message);
    process.exit(1);
  }
}

// Run the job
resetFreeTier()
  .then(() => {
    console.log('Free tier reset job finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Free tier reset job failed:', error);
    process.exit(1);
  });
