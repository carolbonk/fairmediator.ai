/**
 * Weaviate Sync Script
 * Syncs mediators from MongoDB to Weaviate for vector search
 *
 * Usage: node src/scripts/weaviate-sync.js
 * Or: make weaviate-sync
 */

require('dotenv').config();
const mongoose = require('mongoose');
const weaviateClient = require('../config/weaviate');
const Mediator = require('../models/Mediator');

async function sync() {
  console.log('🔄 Syncing Mediators to Weaviate...\n');

  try {
    // Connect to MongoDB
    console.log('1️⃣  Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fairmediator');
    console.log('✅ Connected to MongoDB\n');

    // Connect to Weaviate
    console.log('2️⃣  Connecting to Weaviate...');
    await weaviateClient.connect();

    if (!weaviateClient.isConnected) {
      console.error('❌ Failed to connect to Weaviate');
      process.exit(1);
    }

    console.log('✅ Connected to Weaviate\n');

    // Initialize schema (if not exists)
    console.log('3️⃣  Ensuring schema exists...');
    await weaviateClient.initializeSchema();
    console.log('✅ Schema ready\n');

    // Fetch mediators from MongoDB
    console.log('4️⃣  Fetching mediators from MongoDB...');
    const mediators = await Mediator.find({ isActive: true });
    console.log(`✅ Found ${mediators.length} active mediators\n`);

    if (mediators.length === 0) {
      console.log('⚠️  No mediators to sync');
      console.log('   Add mediators to MongoDB first: make db-seed');
      process.exit(0);
    }

    // Sync to Weaviate
    console.log('5️⃣  Syncing to Weaviate...');
    let synced = 0;
    let failed = 0;

    for (const mediator of mediators) {
      try {
        await weaviateClient.upsertMediator(mediator);
        synced++;
        process.stdout.write(`   Synced: ${synced}/${mediators.length} \r`);
      } catch (error) {
        failed++;
        console.error(`\n   ❌ Failed to sync ${mediator.name}: ${error.message}`);
      }
    }

    console.log('\n');
    console.log(`✅ Sync complete!`);
    console.log(`   Synced: ${synced}`);
    console.log(`   Failed: ${failed}`);

    // Test search
    console.log('\n6️⃣  Testing search...');
    const testResults = await weaviateClient.searchMediators('business mediator', { limit: 3 });
    console.log(`✅ Search works! Found ${testResults.length} results\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

sync();
