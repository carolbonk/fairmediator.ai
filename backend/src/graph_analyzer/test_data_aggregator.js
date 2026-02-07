/**
 * Test script for DataAggregator service
 * Tests buildMediatorProfile with sample data
 */

require('dotenv').config();
const mongoose = require('mongoose');
const DataAggregator = require('./services/data_aggregator');
const { Entity, Relationship } = require('./models/graph_schema');
const logger = require('../config/logger');

async function testDataAggregator() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fairmediator');
    logger.info('Connected to MongoDB for testing');

    // Create test mediator
    const testMediatorId = 'test_mediator_' + Date.now();

    await Entity.create({
      entityId: testMediatorId,
      entityType: 'Mediator',
      name: 'Test Mediator for Data Aggregator',
      dataSource: 'MANUAL',
      metadata: {
        source: 'test',
        createdAt: new Date()
      }
    });

    logger.info(`Created test mediator: ${testMediatorId}`);

    // Create test donation relationships (FEC data simulation)
    const donationDates = [
      new Date('2024-01-15'),
      new Date('2024-03-20'),
      new Date('2024-06-10'),
      new Date('2024-09-05'),
      new Date('2025-01-12')
    ];

    const donations = [];
    for (let i = 0; i < 5; i++) {
      donations.push({
        sourceType: 'Mediator',
        sourceId: testMediatorId,
        targetType: 'Candidate',
        targetId: `candidate_${i}`,
        relationshipType: 'DONATED_TO',
        weight: 30,
        dataSource: 'FEC',
        metadata: {
          amount: 500 + (i * 250), // $500, $750, $1000, $1250, $1500
          date: donationDates[i],
          candidateName: `Candidate ${String.fromCharCode(65 + i)}`,
          candidateParty: i % 2 === 0 ? 'D' : 'R',
          industry: i < 3 ? 'HEALTH' : 'DEFENSE',
          industryCategory: i < 3 ? 'Health' : 'Defense & Aerospace',
          employer: i < 3 ? 'Hospital Corp' : 'Defense Contractor',
          source: 'fec',
          confidence: 1.0,
          scrapedAt: new Date()
        },
        lastVerified: donationDates[i]
      });
    }

    await Relationship.insertMany(donations);
    logger.info(`Created ${donations.length} test donation relationships`);

    // Create test lobbying relationships (Senate LDA simulation)
    const lobbyingDates = [
      new Date('2024-02-01'),
      new Date('2024-05-01'),
      new Date('2024-08-01')
    ];

    const lobbying = [];
    for (let i = 0; i < 3; i++) {
      lobbying.push({
        sourceType: 'Mediator',
        sourceId: testMediatorId,
        targetType: 'Organization',
        targetId: `client_${i}`,
        relationshipType: 'LOBBIED_FOR',
        weight: 40,
        dataSource: 'SCRAPED',
        metadata: {
          filingId: `filing_${i}`,
          filingYear: 2024,
          filingPeriod: `Q${i + 1}`,
          registrantName: `Client Organization ${i + 1}`,
          issueAreas: i === 0 ? ['HCR', 'PHA'] : ['DEF'],
          amount: 25000 + (i * 10000),
          date: lobbyingDates[i],
          source: 'senate_lda',
          confidence: 1.0,
          scrapedAt: new Date()
        },
        lastVerified: lobbyingDates[i]
      });
    }

    await Relationship.insertMany(lobbying);
    logger.info(`Created ${lobbying.length} test lobbying relationships`);

    // Test DataAggregator.buildMediatorProfile()
    logger.info('\n========================================');
    logger.info('Testing DataAggregator.buildMediatorProfile()');
    logger.info('========================================\n');

    const profile = await DataAggregator.buildMediatorProfile(testMediatorId, {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-12-31')
    });

    console.log('\n📊 MEDIATOR PROFILE RESULTS:\n');
    console.log(JSON.stringify(profile, null, 2));

    // Verify results
    console.log('\n✅ VERIFICATION:\n');
    console.log(`Total Donations: ${profile.donations.totalContributions} (expected: 5)`);
    console.log(`Total Donation Amount: $${profile.donations.totalAmount} (expected: $5000)`);
    console.log(`Total Lobbying Filings: ${profile.lobbying.totalFilings} (expected: 3)`);
    console.log(`Total Lobbying Clients: ${profile.lobbying.totalClients} (expected: 3)`);
    console.log(`Party Breakdown:`, profile.donations.partyBreakdown);
    console.log(`Industry Breakdown:`, profile.donations.industryBreakdown);
    console.log(`Trend Data Points: ${profile.trends.length}`);

    // Cleanup test data
    logger.info('\n🧹 Cleaning up test data...');
    await Entity.deleteOne({ entityId: testMediatorId });
    await Relationship.deleteMany({ sourceId: testMediatorId });
    logger.info('Test data cleaned up');

    logger.info('\n✅ DataAggregator test completed successfully!');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    logger.error('❌ Test failed:', error);
    console.error(error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run test
testDataAggregator();
