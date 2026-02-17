const cron = require('node-cron');
const mediatorScraper = require('./mediatorScraper');
const affiliationDetector = require('./affiliationDetector');
const Mediator = require('../../models/Mediator');
const SREAgent = require('../../../.ai/sre/agent');
const { monitor } = require('../../utils/freeTierMonitor');

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
      console.log('🔄 Running daily mediator data refresh...');
      
      try {
        // Get all mediators that haven't been updated in 7+ days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const staleMediators = await Mediator.find({
          'sources.scrapedAt': { $lt: sevenDaysAgo }
        }).limit(50);

        console.log(`Found ${staleMediators.length} mediators to refresh`);

        for (const mediator of staleMediators) {
          if (mediator.sources?.length > 0) {
            try {
              const lastSource = mediator.sources[mediator.sources.length - 1];
              await mediatorScraper.scrapeMediatorProfile(
                lastSource.url,
                lastSource.sourceType,
                true // use dynamic scraping
              );
              
              // Wait 3 seconds between requests
              await new Promise(resolve => setTimeout(resolve, 3000));
            } catch (error) {
              console.error(`Failed to refresh ${mediator.name}:`, error.message);
            }
          }
        }

        console.log('✅ Daily refresh complete');
      } catch (error) {
        console.error('❌ Daily refresh error:', error.message);
      } finally {
        await mediatorScraper.close();
      }
    });

    this.jobs.push({ name: 'dailyRefresh', job });
    console.log('✅ Scheduled daily mediator refresh (2:00 AM)');
  }

  /**
   * Schedule weekly affiliation analysis
   * Runs every Sunday at 3:00 AM
   */
  scheduleWeeklyAffiliationAnalysis() {
    const job = cron.schedule('0 3 * * 0', async () => {
      console.log('🔍 Running weekly affiliation analysis...');
      
      try {
        const mediators = await Mediator.find({ isActive: true }).limit(100);
        
        console.log(`Analyzing ${mediators.length} mediators`);

        for (const mediator of mediators) {
          try {
            await affiliationDetector.analyzeMediatorProfile(mediator._id);
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`Failed to analyze ${mediator.name}:`, error.message);
          }
        }

        console.log('✅ Weekly affiliation analysis complete');
      } catch (error) {
        console.error('❌ Affiliation analysis error:', error.message);
      }
    });

    this.jobs.push({ name: 'weeklyAffiliationAnalysis', job });
    console.log('✅ Scheduled weekly affiliation analysis (Sunday 3:00 AM)');
  }

  /**
   * Schedule weekly SRE agent scan and auto-fix
   * Runs every Sunday at 2:00 AM
   */
  scheduleWeeklySREAgent() {
    const job = cron.schedule('0 2 * * 0', async () => {
      console.log('🔧 Running weekly SRE agent scan and auto-fix...');

      try {
        const agent = new SREAgent();

        // Run with auto-fix enabled and backup
        const result = await agent.run({
          dryRun: false,
          backup: true
        });

        console.log(`✅ SRE agent complete: ${result.results.fixed.length} issues fixed`);

        // Log summary
        if (result.results.needsReview.length > 0) {
          console.log(`⚠️  ${result.results.needsReview.length} issues need manual review`);
        }

      } catch (error) {
        console.error('❌ SRE agent error:', error.message);
      }
    });

    this.jobs.push({ name: 'weeklySREAgent', job });
    console.log('✅ Scheduled weekly SRE agent (Sunday 2:00 AM)');
  }

  /**
   * Schedule daily free tier counter reset
   * Runs every day at midnight UTC
   */
  scheduleFreeTierReset() {
    const job = cron.schedule('0 0 * * *', async () => {
      console.log('🔄 Resetting daily free tier counters...');

      try {
        // Log usage before reset
        const stats = monitor.getStats();
        Object.entries(stats).forEach(([, s]) => {
          if (s.dailyLimit) {
            console.log(`  ${s.name}: ${s.current || 0} / ${s.dailyLimit} (${s.percentage || 0}%)`);
          }
        });

        monitor.resetDaily();
        console.log('✅ Free tier daily counters reset');
      } catch (error) {
        console.error('❌ Free tier reset error:', error.message);
      }
    }, { timezone: 'UTC' });

    this.jobs.push({ name: 'freeTierReset', job });
    console.log('✅ Scheduled daily free tier reset (midnight UTC)');
  }

  /**
   * Start all scheduled jobs
   */
  startAll() {
    console.log('\n📅 Starting scheduled tasks...');
    this.scheduleDailyRefresh();
    this.scheduleWeeklySREAgent();
    this.scheduleWeeklyAffiliationAnalysis();
    this.scheduleFreeTierReset();
    console.log(`✅ ${this.jobs.length} cron jobs scheduled\n`);
  }

  /**
   * Stop all scheduled jobs
   */
  stopAll() {
    this.jobs.forEach(({ name, job }) => {
      job.stop();
      console.log(`Stopped: ${name}`);
    });
    this.jobs = [];
  }
}

module.exports = new CronScheduler();
