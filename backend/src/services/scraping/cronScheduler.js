const cron = require('node-cron');
const mediatorScraper = require('./mediatorScraper');
const affiliationDetector = require('./affiliationDetector');
const Mediator = require('../../models/Mediator');

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
   * Start all scheduled jobs
   */
  startAll() {
    console.log('\n📅 Starting scheduled tasks...');
    this.scheduleDailyRefresh();
    this.scheduleWeeklyAffiliationAnalysis();
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
