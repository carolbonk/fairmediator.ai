const cron = require('node-cron');
const mediatorScraper = require('./mediatorScraper');
const affiliationDetector = require('./affiliationDetector');
const Mediator = require('../../models/Mediator');
const UsageLog = require('../../models/UsageLog');
const ConflictAlert = require('../../models/ConflictAlert');
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
   * Daily conflict alert scan — runs at 6:00 AM UTC
   * For each user who viewed a mediator in the last 30 days:
   *   - If that mediator has a high ideology score or flagged affiliations
   *     AND no alert was created in the last 7 days for that pair → create one.
   */
  scheduleDailyConflictAlerts() {
    const job = cron.schedule('0 6 * * *', async () => {
      logger.info('[AlertsCron] Starting daily conflict alert scan');
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // Find (userId, mediatorId) pairs from recent profile views
        const recentViews = await UsageLog.aggregate([
          {
            $match: {
              type: 'profileView',
              createdAt: { $gte: thirtyDaysAgo },
              userId: { $exists: true },
              resourceId: { $exists: true }
            }
          },
          {
            $group: {
              _id: { userId: '$userId', mediatorId: '$resourceId' }
            }
          }
        ]);

        let created = 0;

        for (const view of recentViews) {
          const { userId, mediatorId } = view._id;
          if (!userId || !mediatorId) continue;

          // Skip if an alert already exists for this pair in the last 7 days
          const recentAlert = await ConflictAlert.findOne({
            userId,
            mediatorId,
            createdAt: { $gte: sevenDaysAgo }
          }).lean();
          if (recentAlert) continue;

          const mediator = await Mediator.findById(mediatorId)
            .select('name ideologyScore biasIndicators conflictRisk')
            .lean();
          if (!mediator) continue;

          const absScore = Math.abs(mediator.ideologyScore || 0);
          const hasAffiliations = (mediator.biasIndicators?.politicalAffiliations?.length || 0) > 0;
          const hasDonations = (mediator.biasIndicators?.donationHistory?.length || 0) > 0;
          const riskLevel = mediator.conflictRisk?.level;

          let alertType = null;
          let severity = 'LOW';
          let message = '';

          if (riskLevel === 'HIGH') {
            alertType = 'new_conflict';
            severity = 'HIGH';
            message = `${mediator.name} has a HIGH conflict risk rating based on recent analysis.`;
          } else if (absScore >= 6) {
            alertType = 'high_bias';
            severity = 'HIGH';
            message = `${mediator.name} has a strong ideology score (${mediator.ideologyScore > 0 ? '+' : ''}${mediator.ideologyScore?.toFixed(1)}). Review before selecting.`;
          } else if (hasAffiliations || hasDonations) {
            alertType = 'new_affiliation';
            severity = 'MEDIUM';
            message = `${mediator.name} has political affiliations or donation history on record.`;
          }

          if (!alertType) continue;

          await ConflictAlert.create({ userId, mediatorId, mediatorName: mediator.name, alertType, severity, message });
          created++;
        }

        logger.info(`[AlertsCron] Done — ${created} new alerts created`);
      } catch (error) {
        logger.error('[AlertsCron] Error during conflict alert scan', { error: error.message });
      }
    }, { timezone: 'UTC' });

    this.jobs.push({ name: 'dailyConflictAlerts', job });
    logger.info('Scheduled daily conflict alert scan (6:00 AM UTC)');
  }

  /**
   * Start all scheduled jobs
   */
  startAll() {
    this.scheduleDailyRefresh();
    this.scheduleWeeklySREAgent();
    this.scheduleWeeklyAffiliationAnalysis();
    this.scheduleFreeTierReset();
    this.scheduleDailyConflictAlerts();
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
