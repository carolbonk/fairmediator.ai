/**
 * Populate Mediator Data Script
 *
 * Loads seed mediators and runs scrapers to populate:
 * - FEC campaign finance data
 * - Senate LDA lobbying disclosures
 * - RECAP court case history
 *
 * Usage: node src/scripts/populateMediatorData.js [--limit=10]
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Mediator = require('../models/Mediator');
const FECScraper = require('../graph_analyzer/scrapers/fec_scraper');
const SenateLDAScraper = require('../graph_analyzer/scrapers/senate_lda_scraper');
const PACERScraper = require('../graph_analyzer/scrapers/pacer_scraper');
const { Entity, Relationship } = require('../graph_analyzer/models/graph_schema');

// Load environment variables
require('dotenv').config();

// Parse command line arguments
const args = process.argv.slice(2);
const limitMatch = args.find(arg => arg.startsWith('--limit='));
const LIMIT = limitMatch ? parseInt(limitMatch.split('=')[1]) : null;
const DRY_RUN = args.includes('--dry-run');

// Initialize scrapers
const fecScraper = new FECScraper();
const ldaScraper = new SenateLDAScraper();
const recapScraper = new PACERScraper();

// Statistics
const stats = {
  mediators: { total: 0, created: 0, skipped: 0 },
  fec: { searched: 0, found: 0, donations: 0 },
  lda: { searched: 0, found: 0, filings: 0 },
  recap: { searched: 0, found: 0, cases: 0 },
  errors: []
};

// Status file path
const STATUS_FILE = path.join(__dirname, '../../data/population_status.json');

/**
 * Update status file for frontend popup
 */
function updateStatus(status, message, currentIndex = 0) {
  const statusData = {
    status, // 'loading', 'rate_limited', 'complete', 'error'
    message,
    progress: {
      mediators: currentIndex,
      total: stats.mediators.total
    },
    stats: {
      fec: {
        found: stats.fec.found,
        donations: stats.fec.donations
      },
      lda: {
        found: stats.lda.found,
        filings: stats.lda.filings
      }
    },
    lastUpdated: new Date().toISOString()
  };

  // Add ETA if loading
  if (status === 'loading' && currentIndex > 0) {
    const avgTimePerMediator = 15; // ~15 seconds per mediator with delays
    const remaining = stats.mediators.total - currentIndex;
    const etaSeconds = remaining * avgTimePerMediator;
    statusData.eta = new Date(Date.now() + etaSeconds * 1000).toISOString();
  }

  // Add retry time if rate-limited
  if (status === 'rate_limited') {
    statusData.retryAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
  }

  // Ensure data directory exists
  const dataDir = path.dirname(STATUS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(STATUS_FILE, JSON.stringify(statusData, null, 2));
}

/**
 * Connect to MongoDB
 */
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

/**
 * Load seed mediators from JSON file
 */
function loadSeedMediators() {
  const seedPath = path.join(__dirname, '../../data/seed_mediators.json');
  const data = fs.readFileSync(seedPath, 'utf8');
  const mediators = JSON.parse(data);

  if (LIMIT) {
    return mediators.slice(0, LIMIT);
  }

  return mediators;
}

/**
 * Create or update mediator in database
 */
async function createMediator(mediatorData) {
  try {
    // Check if mediator already exists
    const existing = await Mediator.findOne({ name: mediatorData.name });

    if (existing) {
      console.log(`  ⏭️  Mediator already exists: ${mediatorData.name}`);
      stats.mediators.skipped++;
      return existing;
    }

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would create: ${mediatorData.name}`);
      stats.mediators.created++;
      return { _id: 'dry-run-id', ...mediatorData };
    }

    // Create new mediator
    const mediator = new Mediator(mediatorData);
    mediator.calculateDataQuality();
    await mediator.save();

    console.log(`  ✅ Created mediator: ${mediatorData.name}`);
    stats.mediators.created++;
    return mediator;

  } catch (error) {
    console.error(`  ❌ Error creating mediator ${mediatorData.name}:`, error.message);
    stats.errors.push({ type: 'mediator_creation', name: mediatorData.name, error: error.message });
    return null;
  }
}

/**
 * Scrape FEC data for mediator
 */
async function scrapeFECData(mediator) {
  try {
    console.log(`  🔍 Searching FEC for: ${mediator.name}`);
    stats.fec.searched++;

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would scrape FEC data`);
      return;
    }

    // Search for donations
    const donations = await fecScraper.searchIndividualDonations(mediator.name, {
      state: mediator.location?.state,
      minDate: '2010-01-01' // Last 15+ years
    });

    if (donations && donations.length > 0) {
      console.log(`    ✅ Found ${donations.length} FEC donations`);
      stats.fec.found++;
      stats.fec.donations += donations.length;

      // Store in graph database
      await fecScraper.storeMediatorDonationData(mediator._id, mediator.name, donations);
    } else {
      console.log(`    ℹ️  No FEC donations found`);
    }

  } catch (error) {
    console.error(`    ❌ FEC scraping error:`, error.message);
    stats.errors.push({ type: 'fec', name: mediator.name, error: error.message });
  }
}

/**
 * Scrape Senate LDA data for mediator
 */
async function scrapeLDAData(mediator) {
  try {
    console.log(`  🔍 Searching Senate LDA for: ${mediator.name}`);
    stats.lda.searched++;

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would scrape LDA data`);
      return;
    }

    // Search for lobbying filings
    const filings = await ldaScraper.searchLobbyist(mediator.name);

    if (filings && filings.length > 0) {
      console.log(`    ✅ Found ${filings.length} lobbying filings`);
      stats.lda.found++;
      stats.lda.filings += filings.length;

      // Store in graph database
      await ldaScraper.storeMediatorLobbyingData(mediator._id, mediator.name, filings);
    } else {
      console.log(`    ℹ️  No lobbying filings found`);
    }

  } catch (error) {
    console.error(`    ❌ LDA scraping error:`, error.message);
    stats.errors.push({ type: 'lda', name: mediator.name, error: error.message });
  }
}

/**
 * Scrape RECAP data for mediator
 */
async function scrapeRECAPData(mediator) {
  try {
    console.log(`  🔍 Searching RECAP for: ${mediator.name}`);
    stats.recap.searched++;

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would scrape RECAP data`);
      return;
    }

    // Search for case history
    const cases = await recapScraper.searchCasesByAttorney(mediator.name);

    if (cases && cases.length > 0) {
      console.log(`    ✅ Found ${cases.length} cases`);
      stats.recap.found++;
      stats.recap.cases += cases.length;

      // Store in graph database
      await recapScraper.storeMediatorCaseData(mediator._id, mediator.name, cases);
    } else {
      console.log(`    ℹ️  No cases found`);
    }

  } catch (error) {
    console.error(`    ❌ RECAP scraping error:`, error.message);
    stats.errors.push({ type: 'recap', name: mediator.name, error: error.message });
  }
}

/**
 * Process single mediator
 */
async function processMediator(mediatorData, index, total) {
  console.log(`\n[${index + 1}/${total}] Processing: ${mediatorData.name}`);

  // Create mediator record
  const mediator = await createMediator(mediatorData);
  if (!mediator) return;

  // Run scrapers in sequence (with delays to respect rate limits)
  await scrapeFECData(mediator);
  await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay (FEC rate limit fix)

  await scrapeLDAData(mediator);
  await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay

  // Skip RECAP - requires paid PACER account
  // await scrapeRECAPData(mediator);
  // await new Promise(resolve => setTimeout(resolve, 5000));
}

/**
 * Print final statistics
 */
function printStats() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 POPULATION STATISTICS');
  console.log('='.repeat(60));

  console.log('\nMediators:');
  console.log(`  Total processed: ${stats.mediators.total}`);
  console.log(`  Created: ${stats.mediators.created}`);
  console.log(`  Skipped (existing): ${stats.mediators.skipped}`);

  console.log('\nFEC (Campaign Finance):');
  console.log(`  Searched: ${stats.fec.searched}`);
  console.log(`  Found with data: ${stats.fec.found}`);
  console.log(`  Total donations: ${stats.fec.donations}`);
  console.log(`  Success rate: ${((stats.fec.found / stats.fec.searched) * 100).toFixed(1)}%`);

  console.log('\nSenate LDA (Lobbying):');
  console.log(`  Searched: ${stats.lda.searched}`);
  console.log(`  Found with data: ${stats.lda.found}`);
  console.log(`  Total filings: ${stats.lda.filings}`);
  console.log(`  Success rate: ${((stats.lda.found / stats.lda.searched) * 100).toFixed(1)}%`);

  console.log('\nRECAP (Court Cases):');
  console.log(`  Searched: ${stats.recap.searched}`);
  console.log(`  Found with data: ${stats.recap.found}`);
  console.log(`  Total cases: ${stats.recap.cases}`);
  console.log(`  Success rate: ${((stats.recap.found / stats.recap.searched) * 100).toFixed(1)}%`);

  console.log('\nErrors:');
  console.log(`  Total errors: ${stats.errors.length}`);
  if (stats.errors.length > 0) {
    console.log('\n  Error breakdown:');
    const errorTypes = {};
    stats.errors.forEach(err => {
      errorTypes[err.type] = (errorTypes[err.type] || 0) + 1;
    });
    Object.entries(errorTypes).forEach(([type, count]) => {
      console.log(`    ${type}: ${count}`);
    });
  }

  console.log('\n' + '='.repeat(60));
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Starting mediator data population...\n');

    if (DRY_RUN) {
      console.log('⚠️  DRY RUN MODE - No data will be written\n');
    }

    if (LIMIT) {
      console.log(`⚠️  LIMIT: Processing only ${LIMIT} mediators\n`);
    }

    // Connect to database
    await connectDB();

    // Load seed data
    const seedMediators = loadSeedMediators();
    stats.mediators.total = seedMediators.length;
    console.log(`📄 Loaded ${seedMediators.length} mediators from seed file\n`);

    // Update status: Starting
    updateStatus('loading', `Loading data for ${seedMediators.length} mediators...`, 0);

    // Process each mediator
    for (let i = 0; i < seedMediators.length; i++) {
      await processMediator(seedMediators[i], i, seedMediators.length);

      // Update status after each mediator
      updateStatus('loading', `Processing mediator ${i + 1}/${seedMediators.length}...`, i + 1);
    }

    // Print statistics
    printStats();

    // Update status: Complete
    updateStatus('complete', `Data population complete! Loaded ${stats.fec.found} with FEC data, ${stats.lda.found} with lobbying data.`, seedMediators.length);

    // Close database connection
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    console.log('✨ Population complete!\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run script
main();
