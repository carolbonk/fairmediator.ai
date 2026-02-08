/**
 * Clean Graph Data Script
 * Removes all Entity and Relationship records to start fresh
 */

const mongoose = require('mongoose');
const { Entity, Relationship } = require('../graph_analyzer/models/graph_schema');

require('dotenv').config();

async function cleanData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Count before deletion
    const entityCount = await Entity.countDocuments();
    const relationshipCount = await Relationship.countDocuments();

    console.log('📊 CURRENT DATA:');
    console.log(`  Entities: ${entityCount}`);
    console.log(`  Relationships: ${relationshipCount}\n`);

    // Delete all
    console.log('🗑️  Deleting all graph data...');
    await Entity.deleteMany({});
    await Relationship.deleteMany({});

    console.log('✅ All graph data deleted!\n');

    // Verify
    const entityCountAfter = await Entity.countDocuments();
    const relationshipCountAfter = await Relationship.countDocuments();

    console.log('📊 AFTER CLEANUP:');
    console.log(`  Entities: ${entityCountAfter}`);
    console.log(`  Relationships: ${relationshipCountAfter}\n`);

    await mongoose.connection.close();
    console.log('✅ Done!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanData();
