const cron = require('node-cron');
const mediatorScraper = require('./mediatorScraper');
const affiliationDetector = require('./affiliationDetector');
const Mediator = require('../../models/Mediator');
const SREAgent = require('../../../.ai/sre/agent');
const { monitor } = require('../../utils/freeTierMonitor');
const logger = require('../../config/logger');

class CronScheduler {
  constructor() {
    this.jobs = [];
  }

  /**
   * Schedule daily mediator data refresh
   * Runs every day at 2:00 AM
   */
  scheduleDailyRefresh() {
    const job = cron.schedule('0 2 * * *', async () => {
      logger.info('Running daily mediator data refresh');

      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const staleMediators = await Mediator.find({
          'sources.scrapedAt': { $lt: sevenDaysAgo }
        }).limit(50);

        logger.info(`Found ${staleMediators.length} mediators to refresh`);

        for (const mediator of staleMediators) {
          if (mediator.sources?.length > 0) {
            try {
              const lastSource = mediator.sources[mediator.sources.length - 1];
              await mediatorScraper.scrapeMediatorProfile(
                lastSource.url,
                lastSource.sourceType,
                true
              );
              await new Promise(resolve => setTimeout(resolve, 3000));
            } catch (error) {
              logger.error(`Failed to refresh ${mediator.name}`, { error: error.message });
            }
          }
        }

        logger.info('Daily refresh complete');
      } catch (error) {
        logger.error('Daily refresh error', { error: error.message });
      } finally {
        await mediatorScraper.close();
      }
    });

    this.jobs.push({ name: 'dailyRefresh', job });
    logger.info('Scheduled daily mediator refresh (2:00 AM)');
  }

  /**
   * Schedule weekly affiliation analysis
   * Runs every Sunday at 3:00 AM
   */
  scheduleWeeklyAffiliationAnalysis() {
    const job = cron.schedule('0 3 * * 0', async () => {
      logger.info('Running weekly affiliation analysis');

      try {
        const mediators = await Mediator.find({ isActive: true }).limit(100);
        logger.info(`Analyzing ${mediators.length} mediators`);

        for (const mediator of mediators) {
          try {
            await affiliationDetector.analyzeMediatorProfile(mediator._id);
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            logger.error(`Failed to analyze ${mediator.name}`, { error: error.message });
          }
        }

        logger.info('Weekly affiliation analysis complete');
      } catch (error) {
        logger.error('Affiliation analysis error', { error: error.message });
      }
    });

    this.jobs.push({ name: 'weeklyAffiliationAnalysis', job });
    logger.info('Scheduled weekly affiliation analysis (Sunday 3:00 AM)');
  }

  /**
   * Schedule weekly SRE agent scan and auto-fix
   * Runs every Sunday at 2:00 AM
   */
  scheduleWeeklySREAgent() {
    const job = cron.schedule('0 2 * * 0', async () => {
      logger.info('Running weekly SRE agent scan and auto-fix');

      try {
        const agent = new SREAgent();
        const result = await agent.run({ dryRun: false, backup: true });
        logger.info('SRE agent complete', { fixed: result.results.fixed.length, needsReview: result.results.needsReview.length });
      } catch (error) {
        logger.error('SRE agent error', { error: error.message });
      }
    });

    this.jobs.push({ name: 'weeklySREAgent', job });
    logger.info('Scheduled weekly SRE agent (Sunday 2:00 AM)');
  }

  /**
   * Schedule daily free tier counter reset
   * Runs every day at midnight UTC
   */
  scheduleFreeTierReset() {
    const job = cron.schedule('0 0 * * *', async () => {
      try {
        const stats = monitor.getStats();
        logger.info('Resetting daily free tier counters', { stats });
        monitor.resetDaily();
        logger.info('Free tier daily counters reset');
      } catch (error) {
        logger.error('Free tier reset error', { error: error.message });
      }
    }, { timezone: 'UTC' });

    this.jobs.push({ name: 'freeTierReset', job });
    logger.info('Scheduled daily free tier reset (midnight UTC)');
  }

  /**
   * Start all scheduled jobs
   */
  startAll() {
    this.scheduleDailyRefresh();
    this.scheduleWeeklySREAgent();
    this.scheduleWeeklyAffiliationAnalysis();
    this.scheduleFreeTierReset();
    logger.info(`${this.jobs.length} cron jobs scheduled`);
  }

  /**
   * Stop all scheduled jobs
   */
  stopAll() {
    this.jobs.forEach(({ name, job }) => {
      job.stop();
      logger.info(`Cron job stopped: ${name}`);
    });
    this.jobs = [];
  }
}

module.exports = new CronScheduler();
