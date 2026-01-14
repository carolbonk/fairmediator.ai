/**
 * Initialize Vector Embeddings for MongoDB Atlas Vector Search
 * Generates and stores embeddings for all existing mediators
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Mediator = require('../models/Mediator');
const embeddingService = require('../services/ai/embeddingService');
const logger = require('../config/logger');

async function initializeVectorDB() {
  try {
    console.log('🚀 Starting MongoDB Atlas vector embedding initialization...\n');

    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');

    // Get current stats
    const stats = await embeddingService.getStats();
    console.log('📊 Current embedding stats:');
    console.log(`   Total mediators: ${stats.total}`);
    console.log(`   Already indexed: ${stats.indexed}`);
    console.log(`   Not indexed: ${stats.notIndexed}`);
    console.log(`   Model: ${stats.model}`);
    console.log(`   Dimensions: ${stats.dimensions}\n`);

    // Display vector search index instructions
    if (stats.notIndexed > 0 || process.argv.includes('--show-index')) {
      console.log('📋 MongoDB Atlas Vector Search Index Setup:\n');
      const instructions = embeddingService.getIndexInstructions();
      console.log(instructions.instructions.join('\n'));
      console.log('\n   Index Definition (JSON):');
      console.log('   ' + JSON.stringify(instructions.index.definition, null, 2).replace(/\n/g, '\n   '));
      console.log('');
    }

    // Option to clear existing embeddings
    if (process.argv.includes('--clear')) {
      console.log('🗑️  Clearing existing embeddings...');
      const cleared = await embeddingService.clearAll();
      console.log(`✅ Cleared embeddings from ${cleared.cleared} mediators\n`);
    }

    // Fetch mediators that need indexing
    console.log('🔍 Fetching mediators that need indexing...');
    const query = process.argv.includes('--clear') || process.argv.includes('--reindex')
      ? { isActive: true }
      : { isActive: true, embedding: { $exists: false } };

    const mediators = await Mediator.find(query);
    console.log(`✅ Found ${mediators.length} mediators to index\n`);

    if (mediators.length === 0) {
      console.log('⚠️  No mediators need indexing');
      console.log('   Use --reindex flag to re-index all mediators');
      return;
    }

    // Batch index mediators
    console.log('⚡ Generating embeddings and storing in MongoDB...');
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

    console.log('\n🎉 Embedding generation complete!');
    console.log(`\n📊 Final Results:`);
    console.log(`   ✅ Successfully indexed: ${totalIndexed}`);
    console.log(`   ❌ Failed: ${totalFailed}`);
    console.log(`   📈 Success rate: ${((totalIndexed / mediators.length) * 100).toFixed(1)}%`);

    // Verify final stats
    const finalStats = await embeddingService.getStats();
    console.log(`\n📊 Final embedding stats:`);
    console.log(`   Total mediators: ${finalStats.total}`);
    console.log(`   Indexed: ${finalStats.indexed}`);
    console.log(`   Model: ${finalStats.model}`);

    // Test search (only if vector index exists)
    console.log('\n🔍 Testing semantic search...');
    const testQuery = 'employment dispute mediator in California';
    console.log(`   Query: "${testQuery}"`);

    try {
      const searchResults = await embeddingService.searchSimilar(testQuery, { topK: 3 });

      if (searchResults.length === 0) {
        console.log('\n   ⚠️  No results found.');
        console.log('   This means the MongoDB Atlas Vector Search index has not been created yet.');
        console.log('   Please create the index using the instructions above.\n');
      } else {
        console.log(`   Found ${searchResults.length} results:\n`);
        searchResults.forEach((result, index) => {
          console.log(`   ${index + 1}. ${result.metadata.name}`);
          console.log(`      Similarity: ${(result.similarity * 100).toFixed(1)}%`);
          console.log(`      Location: ${result.metadata.location_city}, ${result.metadata.location_state}`);
          console.log(`      Specializations: ${result.metadata.specializations || 'N/A'}\n`);
        });
        console.log('✅ Vector search is working! Embeddings are ready for RAG queries.\n');
      }
    } catch (error) {
      console.log('\n   ⚠️  Vector search test failed.');
      console.log('   Error:', error.message);
      console.log('   Please create the MongoDB Atlas Vector Search index using the instructions above.\n');
    }

  } catch (error) {
    console.error('❌ Error initializing vector embeddings:', error);
    logger.error('Vector embedding initialization error:', error);
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
║   MongoDB Atlas Vector Search Initialization        ║
╚══════════════════════════════════════════════════════╝

Usage:
  node initializeVectorDB.js              # Index new mediators only
  node initializeVectorDB.js --clear      # Clear all and re-index
  node initializeVectorDB.js --reindex    # Re-index all mediators
  node initializeVectorDB.js --show-index # Show index setup instructions
`);

  initializeVectorDB();
}

module.exports = initializeVectorDB;
