/**
 * Verify Population Script
 * Quick verification of populated data in MongoDB
 */

const mongoose = require('mongoose');
const Mediator = require('../models/Mediator');
const { Entity, Relationship } = require('../graph_analyzer/models/graph_schema');

require('dotenv').config();

async function verifyData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Count mediators
    const mediatorCount = await Mediator.countDocuments();
    console.log('📊 MEDIATOR DATA:');
    console.log(`  Total mediators: ${mediatorCount}`);

    // Sample 5 mediators
    const sampleMediators = await Mediator.find().limit(5).select('name location practiceAreas');
    console.log('\n  Sample mediators:');
    sampleMediators.forEach(m => {
      console.log(`    - ${m.name} (${m.location?.city}, ${m.location?.state})`);
    });

    // Count entities by type
    console.log('\n📊 GRAPH DATABASE - ENTITIES:');

    const entityTypes = await Entity.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    let totalEntities = 0;
    entityTypes.forEach(type => {
      console.log(`  ${type._id}: ${type.count}`);
      totalEntities += type.count;
    });
    console.log(`  TOTAL ENTITIES: ${totalEntities}`);

    // Count relationships by type
    console.log('\n📊 GRAPH DATABASE - RELATIONSHIPS:');

    const relTypes = await Relationship.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    let totalRelationships = 0;
    relTypes.forEach(type => {
      console.log(`  ${type._id}: ${type.count}`);
      totalRelationships += type.count;
    });
    console.log(`  TOTAL RELATIONSHIPS: ${totalRelationships}`);

    // Get mediators with graph data
    console.log('\n📊 MEDIATORS WITH GRAPH DATA:');

    const mediatorsWithData = await Relationship.aggregate([
      { $group: { _id: '$fromId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    for (const med of mediatorsWithData) {
      const mediator = await Mediator.findById(med._id);
      if (mediator) {
        console.log(`  ${mediator.name}: ${med.count} relationships`);
      }
    }

    // Sample lobbying data
    console.log('\n📊 LOBBYING DATA SAMPLE:');
    const lobbyingRels = await Relationship.find({ type: 'LOBBIED_FOR' })
      .populate('fromId')
      .limit(3);

    if (lobbyingRels.length > 0) {
      for (const rel of lobbyingRels) {
        const mediator = await Mediator.findById(rel.fromId);
        const client = await Entity.findById(rel.toId);
        console.log(`  ${mediator?.name} → ${client?.name} (${rel.metadata?.year})`);
      }
    } else {
      console.log('  No lobbying relationships found');
    }

    // Sample donation data
    console.log('\n📊 DONATION DATA SAMPLE:');
    const donationRels = await Relationship.find({ type: 'DONATED_TO' })
      .populate('fromId')
      .limit(3);

    if (donationRels.length > 0) {
      for (const rel of donationRels) {
        const mediator = await Mediator.findById(rel.fromId);
        const recipient = await Entity.findById(rel.toId);
        console.log(`  ${mediator?.name} → ${recipient?.name} ($${rel.metadata?.amount})`);
      }
    } else {
      console.log('  No donation relationships found');
    }

    await mongoose.connection.close();
    console.log('\n✅ Verification complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyData();
