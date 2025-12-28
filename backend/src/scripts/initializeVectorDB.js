/**
 * Initialize Vector Database
 * Indexes all existing mediators in ChromaDB for semantic search
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Mediator = require('../models/Mediator');
const embeddingService = require('../services/ai/embeddingService');
const logger = require('../config/logger');

async function initializeVectorDB() {
  try {
    console.log('🚀 Starting vector database initialization...\n');

    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Initialize embedding service
    console.log('🧠 Initializing embedding service...');
    await embeddingService.initialize();
    console.log('✅ Embedding service ready\n');

    // Get current stats
    const stats = await embeddingService.getStats();
    console.log('📊 Current vector DB stats:');
    console.log(`   Collection: ${stats.collectionName}`);
    console.log(`   Documents: ${stats.count}`);
    console.log(`   Model: ${stats.model}\n`);

    // Option to clear existing embeddings
    if (process.argv.includes('--clear')) {
      console.log('🗑️  Clearing existing embeddings...');
      await embeddingService.clearAll();
      console.log('✅ Cleared all embeddings\n');
    }

    // Fetch all active mediators
    console.log('🔍 Fetching mediators from database...');
    const mediators = await Mediator.find({ isActive: true });
    console.log(`✅ Found ${mediators.length} active mediators\n`);

    if (mediators.length === 0) {
      console.log('⚠️  No mediators found to index');
      return;
    }

    // Batch index mediators
    console.log('⚡ Indexing mediators...');
    console.log('This may take a few minutes depending on the number of mediators.\n');

    const batchSize = 10;
    let totalIndexed = 0;
    let totalFailed = 0;

    for (let i = 0; i < mediators.length; i += batchSize) {
      const batch = mediators.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(mediators.length / batchSize);

      console.log(`📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} mediators)...`);

      const result = await embeddingService.indexMediators(batch);
      totalIndexed += result.indexed;
      totalFailed += result.failed;

      console.log(`   ✅ Indexed: ${result.indexed}, ❌ Failed: ${result.failed}`);
    }

    console.log('\n🎉 Vector database initialization complete!');
    console.log(`\n📊 Final Results:`);
    console.log(`   ✅ Successfully indexed: ${totalIndexed}`);
    console.log(`   ❌ Failed: ${totalFailed}`);
    console.log(`   📈 Success rate: ${((totalIndexed / mediators.length) * 100).toFixed(1)}%`);

    // Verify final stats
    const finalStats = await embeddingService.getStats();
    console.log(`\n📊 Final vector DB stats:`);
    console.log(`   Collection: ${finalStats.collectionName}`);
    console.log(`   Documents: ${finalStats.count}`);
    console.log(`   Model: ${finalStats.model}`);

    // Test search
    console.log('\n🔍 Testing semantic search...');
    const testQuery = 'employment dispute mediator in California';
    console.log(`   Query: "${testQuery}"`);

    const searchResults = await embeddingService.searchSimilar(testQuery, { topK: 3 });
    console.log(`   Found ${searchResults.length} results:\n`);

    searchResults.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.metadata.name}`);
      console.log(`      Similarity: ${(result.similarity * 100).toFixed(1)}%`);
      console.log(`      Location: ${result.metadata.location_city}, ${result.metadata.location_state}`);
      console.log(`      Specializations: ${result.metadata.specializations || 'N/A'}\n`);
    });

    console.log('✅ All done! Vector database is ready for RAG queries.\n');

  } catch (error) {
    console.error('❌ Error initializing vector database:', error);
    logger.error('Vector DB initialization error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  console.log(`
╔══════════════════════════════════════════════════════╗
║   FairMediator Vector Database Initialization       ║
╚══════════════════════════════════════════════════════╝
`);

  initializeVectorDB();
}

module.exports = initializeVectorDB;
