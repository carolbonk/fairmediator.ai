/**
 * Inspect Graph Data
 * Check raw entity and relationship records
 */

const mongoose = require('mongoose');
const { Entity, Relationship } = require('../graph_analyzer/models/graph_schema');

require('dotenv').config();

async function inspect() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get sample entities
    console.log('📊 SAMPLE ENTITIES (first 5):');
    const entities = await Entity.find().limit(5);
    entities.forEach(e => {
      console.log(`\nEntity ID: ${e._id}`);
      console.log(`  Type: ${e.type}`);
      console.log(`  Name: ${e.name}`);
      console.log(`  Metadata: ${JSON.stringify(e.metadata)}`);
    });

    // Get sample relationships
    console.log('\n\n📊 SAMPLE RELATIONSHIPS (first 5):');
    const relationships = await Relationship.find().limit(5);
    for (const rel of relationships) {
      console.log(`\nRelationship ID: ${rel._id}`);
      console.log(`  Type: ${rel.type}`);
      console.log(`  From: ${rel.fromId}`);
      console.log(`  To: ${rel.toId}`);
      console.log(`  Metadata: ${JSON.stringify(rel.metadata)}`);
    }

    // Check for Kenneth Feinberg specifically (we know he has data)
    console.log('\n\n📊 SEARCHING FOR KENNETH FEINBERG:');
    const Mediator = require('../models/Mediator');
    const kenneth = await Mediator.findOne({ name: 'Kenneth Feinberg' });
    if (kenneth) {
      console.log(`Found Kenneth Feinberg: ${kenneth._id}`);

      const kennethRels = await Relationship.find({ fromId: kenneth._id });
      console.log(`  Relationships: ${kennethRels.length}`);

      if (kennethRels.length > 0) {
        console.log(`  First relationship:`);
        console.log(`    Type: ${kennethRels[0].type}`);
        console.log(`    To: ${kennethRels[0].toId}`);
        console.log(`    Metadata: ${JSON.stringify(kennethRels[0].metadata)}`);
      }
    } else {
      console.log('Kenneth Feinberg not found in database');
    }

    await mongoose.connection.close();
    console.log('\n✅ Done!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

inspect();
