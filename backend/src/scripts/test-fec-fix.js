/**
 * Test FEC Scraper Persistence Fix
 *
 * Tests the fixed FEC scraper to verify donations are properly saved to MongoDB
 */

const mongoose = require('mongoose');
const FECScraper = require('../graph_analyzer/scrapers/fec_scraper');
const { Entity, Relationship } = require('../graph_analyzer/models/graph_schema');
const Mediator = require('../models/Mediator');

require('dotenv').config();

const TEST_MEDIATOR_NAME = 'John Smith'; // Common name for testing

async function testFECScraper() {
  try {
    console.log('🧪 Testing FEC Scraper Fix\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get first mediator from database
    const mediator = await Mediator.findOne({ name: { $exists: true } }).limit(1);

    if (!mediator) {
      console.log('❌ No mediators found in database. Run populateMediatorData first.');
      process.exit(1);
    }

    console.log(`📋 Testing with mediator: ${mediator.name}`);
    console.log(`   ID: ${mediator._id}`);
    console.log(`   State: ${mediator.location?.state || 'N/A'}\n`);

    // Check existing data
    const existingRelationships = await Relationship.countDocuments({
      sourceId: mediator._id.toString(),
      relationshipType: 'DONATED_TO'
    });
    console.log(`📊 Existing DONATED_TO relationships: ${existingRelationships}\n`);

    // Initialize scraper
    const fecScraper = new FECScraper();

    // Test the fixed method
    console.log('🔄 Running FEC scraper...\n');
    const result = await fecScraper.storeMediatorDonationData(
      mediator._id.toString(),
      mediator.name,
      {
        state: mediator.location?.state,
        minDate: '2015-01-01'
      }
    );

    console.log('📈 Scraper Result:');
    console.log(`   Stored: ${result.stored} donations`);
    console.log(`   Total Amount: $${result.totalAmount?.toLocaleString() || 0}`);
    console.log(`   Top Industries:`, result.topIndustries || []);
    console.log('');

    // Verify data was persisted
    const newCount = await Relationship.countDocuments({
      sourceId: mediator._id.toString(),
      relationshipType: 'DONATED_TO'
    });

    console.log('✨ Verification:');
    console.log(`   Before: ${existingRelationships} relationships`);
    console.log(`   After: ${newCount} relationships`);
    console.log(`   New: ${newCount - existingRelationships} relationships`);

    if (newCount > existingRelationships) {
      console.log('\n✅ SUCCESS: Data was persisted to MongoDB!');
    } else if (result.stored === 0) {
      console.log('\n⚠️  No donations found for this mediator (this is expected for some mediators)');
    } else {
      console.log('\n❌ FAILURE: Data was not persisted (bug still exists)');
    }

    // Show sample relationship
    if (newCount > 0) {
      const sample = await Relationship.findOne({
        sourceId: mediator._id.toString(),
        relationshipType: 'DONATED_TO'
      }).limit(1);

      console.log('\n📄 Sample Relationship:');
      console.log(`   Committee: ${sample.metadata.candidateName || 'N/A'}`);
      console.log(`   Party: ${sample.metadata.candidateParty || 'N/A'}`);
      console.log(`   Amount: $${sample.metadata.amount || 0}`);
      console.log(`   Date: ${sample.metadata.date || 'N/A'}`);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

testFECScraper();
