/**
 * Weaviate Connection Test
 * Tests connection and performs a sample search
 *
 * Usage: node src/scripts/weaviate-test.js
 * Or: make weaviate-test
 */

require('dotenv').config();
const weaviateClient = require('../config/weaviate');

async function test() {
  console.log('🧪 Testing Weaviate Connection...\n');

  try {
    // Test connection
    console.log('1️⃣  Connecting...');
    await weaviateClient.connect();

    if (!weaviateClient.isConnected) {
      console.error('❌ Connection failed');
      console.error('\n🔧 Troubleshooting:');
      console.error('   1. Check WEAVIATE_ENABLED=true in .env');
      console.error('   2. Verify WEAVIATE_URL (should be: your-cluster.weaviate.network)');
      console.error('   3. Verify WEAVIATE_API_KEY is correct');
      console.error('   4. Ensure Weaviate Cloud sandbox is active');
      process.exit(1);
    }

    console.log('✅ Connected!\n');

    // Get stats
    console.log('2️⃣  Fetching stats...');
    const stats = await weaviateClient.getStats();
    console.log(JSON.stringify(stats, null, 2));
    console.log('');

    // Test search (if data exists)
    console.log('3️⃣  Testing search...');
    const results = await weaviateClient.searchMediators('family law mediator', { limit: 3 });

    if (results.length > 0) {
      console.log(`✅ Found ${results.length} results:`);
      results.forEach((m, i) => {
        console.log(`   ${i + 1}. ${m.name} (${m.location_city}, ${m.location_state})`);
      });
    } else {
      console.log('⚠️  No mediators found in vector database');
      console.log('   Run: make weaviate-sync to add mediators');
    }

    console.log('\n✅ All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

test();
