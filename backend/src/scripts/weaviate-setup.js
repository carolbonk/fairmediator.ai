/**
 * Weaviate Setup Script
 * Initializes Weaviate schema for FairMediator
 *
 * Usage: node src/scripts/weaviate-setup.js
 * Or: make weaviate-setup
 */

require('dotenv').config();
const weaviateClient = require('../config/weaviate');

async function setup() {
  console.log('🚀 Weaviate Setup Starting...\n');

  try {
    // Connect to Weaviate
    console.log('1️⃣  Connecting to Weaviate...');
    await weaviateClient.connect();

    if (!weaviateClient.isConnected) {
      console.error('❌ Failed to connect to Weaviate');
      console.error('   Check your WEAVIATE_URL and WEAVIATE_API_KEY in .env');
      process.exit(1);
    }

    console.log('✅ Connected to Weaviate\n');

    // Initialize schema
    console.log('2️⃣  Initializing schema...');
    await weaviateClient.initializeSchema();
    console.log('✅ Schema initialized\n');

    // Show stats
    console.log('3️⃣  Weaviate Stats:');
    const stats = await weaviateClient.getStats();
    console.log(`   URL: ${stats.url}`);
    console.log(`   Classes: ${stats.classes}`);
    console.log(`   Version: ${stats.version || 'Unknown'}`);
    console.log(`   Modules: ${stats.modules ? Object.keys(stats.modules).join(', ') : 'Unknown'}`);

    console.log('\n✅ Weaviate setup complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Add mediators to MongoDB (if not already done)');
    console.log('   2. Sync mediators: make weaviate-sync');
    console.log('   3. Test search in your app!');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

setup();
