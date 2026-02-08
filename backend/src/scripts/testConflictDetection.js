/**
 * Test Conflict Detection Script
 * Tests the graph-based conflict detection API with real mediator data
 */

const mongoose = require('mongoose');
const Mediator = require('../models/Mediator');
const graphService = require('../graph_analyzer/services/graph_service');

require('dotenv').config();

async function testConflictDetection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get some sample mediators
    const mediators = await Mediator.find().limit(5);
    console.log(`📊 Testing conflict detection on ${mediators.length} mediators:\n`);

    for (const mediator of mediators) {
      console.log(`\n🔍 Testing: ${mediator.name}`);
      console.log(`   ID: ${mediator._id}`);

      // Test with sample case parties
      const testParties = [
        'ABC Corporation',
        'XYZ Industries',
        'Democratic National Committee',
        'Republican National Committee'
      ];

      for (const party of testParties) {
        try {
          const result = await graphService.analyzeConflict(
            mediator._id.toString(),
            party,
            { maxDepth: 3 }
          );

          console.log(`\n   Party: ${party}`);
          console.log(`     Risk Score: ${result.riskScore || 0}`);
          console.log(`     Conflict Paths: ${result.paths?.length || 0}`);

          if (result.paths && result.paths.length > 0) {
            console.log('     Sample path:');
            const path = result.paths[0];
            console.log(`       ${path.mediator} → ${path.entity} (${path.relationshipType}, weight: ${path.weight})`);
          }

        } catch (error) {
          console.log(`\n   Party: ${party}`);
          console.log(`     ❌ Error: ${error.message}`);
        }
      }
    }

    await mongoose.connection.close();
    console.log('\n✅ Testing complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testConflictDetection();
