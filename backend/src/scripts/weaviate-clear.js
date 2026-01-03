/**
 * Weaviate Clear Script
 * Deletes all vectors from Weaviate (useful for testing)
 *
 * Usage: node src/scripts/weaviate-clear.js
 * Or: make weaviate-clear
 */

require('dotenv').config();
const weaviateClient = require('../config/weaviate');

async function clear() {
  console.log('🗑️  Clearing Weaviate Data...\n');

  try {
    // Connect
    console.log('1️⃣  Connecting to Weaviate...');
    await weaviateClient.connect();

    if (!weaviateClient.isConnected) {
      console.error('❌ Failed to connect');
      process.exit(1);
    }

    console.log('✅ Connected\n');

    // Clear all data
    console.log('2️⃣  Clearing all mediators...');
    const deleted = await weaviateClient.clearAll();
    console.log(`✅ Deleted ${deleted} vectors\n`);

    console.log('✅ Weaviate cleared!');
    console.log('\n📝 To re-populate:');
    console.log('   make weaviate-sync');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Clear failed:', error.message);
    process.exit(1);
  }
}

clear();
