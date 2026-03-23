/**
 * Test Scoring Pipeline
 * Verify deterministic scoring functions work correctly
 */

require('dotenv').config();
const mongoose = require('mongoose');
const {
  extractEntities,
  scoreLeaning,
  scoreAffiliation,
  rankAndSplit
} = require('../services/scoring/deterministicScoring');
const Mediator = require('../models/Mediator');
const Signal = require('../models/Signal');
const Firm = require('../models/Firm');
const AffiliationAssessment = require('../models/AffiliationAssessment');

// Test data
const testTexts = [
  'John Doe works at Smith & Associates LLC and donated $5,000 to the Democratic Party in 2024.',
  'Dr. Jane Smith is a member of the Federalist Society and serves on the board of the Republican Lawyers Association.',
  'The American Bar Association hosted a panel featuring mediator Robert Jones discussing conflict resolution.',
  'Mary Johnson, a partner at Wilson Corp., contributed to the Biden campaign and previously worked at the ACLU.'
];

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

async function testEntityExtraction() {
  console.log('\n📝 Testing Entity Extraction...\n');

  testTexts.forEach((text, index) => {
    console.log(`Text ${index + 1}: "${text}"\n`);
    const result = extractEntities(text, { includePositions: false });

    console.log(`  Found ${result.total} entities:`);
    result.entities.forEach(entity => {
      console.log(`    - ${entity.text} (${entity.type}) [confidence: ${entity.confidence}]`);
    });
    console.log(`  Method: ${result.method}`);
    console.log(`  Disclaimer: ${result.disclaimer}\n`);
  });
}

async function testLeaningScore() {
  console.log('\n📊 Testing Leaning Score Calculation...\n');

  // Find a mediator with signals
  const mediator = await Mediator.findOne().limit(1);

  if (!mediator) {
    console.log('⚠️  No mediators found in database. Skipping leaning score test.');
    return;
  }

  console.log(`Testing with mediator: ${mediator.name} (${mediator._id})\n`);

  // Create test signals if none exist
  const existingSignals = await Signal.countDocuments({ mediatorId: mediator._id });

  if (existingSignals === 0) {
    console.log('Creating test signals...');

    await Signal.create([
      {
        mediatorId: mediator._id,
        signalType: 'DONATION',
        entity: 'Democratic National Committee',
        entityType: 'organization',
        relationship: 'donated to',
        leaningScore: -5,
        influenceWeight: 0.7,
        source: 'FEC',
        evidence: {
          confidence: 0.8,
          extractionMethod: 'API'
        }
      },
      {
        mediatorId: mediator._id,
        signalType: 'MEMBERSHIP',
        entity: 'American Civil Liberties Union',
        entityType: 'organization',
        relationship: 'member of',
        leaningScore: -3,
        influenceWeight: 0.6,
        source: 'LinkedIn',
        evidence: {
          confidence: 0.7,
          extractionMethod: 'manual'
        }
      },
      {
        mediatorId: mediator._id,
        signalType: 'EMPLOYMENT',
        entity: 'Public Defender Office',
        entityType: 'organization',
        relationship: 'employed by',
        leaningScore: -2,
        influenceWeight: 0.8,
        isCurrent: false,
        dateEnd: new Date('2020-01-01'),
        source: 'Manual',
        evidence: {
          confidence: 0.9,
          extractionMethod: 'manual'
        }
      }
    ]);

    console.log('✅ Created 3 test signals\n');
  }

  const result = await scoreLeaning(mediator._id, {
    includeEvidence: true,
    includeDisclaimer: true,
    weightByRecency: true
  });

  console.log('Leaning Score Result:');
  console.log(`  Score: ${result.score} / 10`);
  console.log(`  Label: ${result.label}`);
  console.log(`  Confidence: ${result.confidence}`);
  console.log(`  Total Signals: ${result.totalSignals}`);
  console.log(`  Validated Signals: ${result.validatedSignals}`);
  console.log(`  Method: ${result.method}`);

  if (result.evidence && result.evidence.length > 0) {
    console.log('\n  Evidence:');
    result.evidence.slice(0, 3).forEach(e => {
      console.log(`    - ${e.type}: ${e.entity} (score: ${e.leaningScore}, weight: ${e.weight})`);
    });
  }

  console.log(`\n  Disclaimer: ${result.disclaimer}\n`);
}

async function testAffiliationScore() {
  console.log('\n🏢 Testing Affiliation Score Calculation...\n');

  // Find or create a test firm
  let firm = await Firm.findOne();

  if (!firm) {
    console.log('Creating test firm...');
    firm = await Firm.create({
      name: 'Smith & Associates LLC',
      type: 'law_firm',
      headquarters: {
        city: 'New York',
        state: 'NY',
        country: 'USA'
      },
      industry: 'Legal Services',
      size: 'medium'
    });
    console.log(`✅ Created firm: ${firm.name}\n`);
  }

  const mediator = await Mediator.findOne();

  if (!mediator) {
    console.log('⚠️  No mediators found. Skipping affiliation score test.');
    return;
  }

  console.log(`Testing affiliation between:`);
  console.log(`  Mediator: ${mediator.name}`);
  console.log(`  Firm: ${firm.name}\n`);

  // Create test signals for this affiliation
  const existingSignals = await Signal.countDocuments({
    mediatorId: mediator._id,
    entity: firm.name
  });

  if (existingSignals === 0) {
    console.log('Creating test affiliation signals...');

    await Signal.create([
      {
        mediatorId: mediator._id,
        signalType: 'EMPLOYMENT',
        entity: firm.name,
        entityType: 'organization',
        relationship: 'employed by',
        leaningScore: 0,
        influenceWeight: 0.8,
        isCurrent: true,
        source: 'LinkedIn',
        evidence: {
          confidence: 0.9,
          extractionMethod: 'manual'
        }
      },
      {
        mediatorId: mediator._id,
        signalType: 'MEMBERSHIP',
        entity: firm.name,
        entityType: 'organization',
        relationship: 'partner at',
        leaningScore: 0,
        influenceWeight: 0.7,
        isCurrent: true,
        source: 'Manual',
        validationStatus: 'validated',
        evidence: {
          confidence: 0.95,
          extractionMethod: 'manual'
        }
      }
    ]);

    console.log('✅ Created 2 test affiliation signals\n');
  }

  const result = await scoreAffiliation(mediator._id, firm._id, {
    includeEvidence: true,
    includeDisclaimer: true
  });

  console.log('Affiliation Score Result:');
  console.log(`  Firm: ${result.firmName}`);
  console.log(`  Type: ${result.affiliationType}`);
  console.log(`  Current: ${result.isCurrent}`);
  console.log(`  Confidence: ${result.confidence}`);
  console.log(`  Influence: ${result.influenceScore}`);
  console.log(`  Conflict Risk: ${result.conflictRisk}/100 (${result.riskLabel})`);
  console.log(`  Total Signals: ${result.totalSignals}`);
  console.log(`  Validated: ${result.validatedSignals}`);
  console.log(`  Method: ${result.method}`);

  if (result.evidence && result.evidence.length > 0) {
    console.log('\n  Evidence:');
    result.evidence.forEach(e => {
      console.log(`    - ${e.signalType}: ${e.relationship} (${e.source}, validated: ${e.validated})`);
    });
  }

  console.log(`\n  Disclaimer: ${result.disclaimer}\n`);
}

async function testRanking() {
  console.log('\n🏆 Testing Ranking & Splitting...\n');

  const mediators = await Mediator.find().limit(10);

  if (mediators.length === 0) {
    console.log('⚠️  No mediators found. Skipping ranking test.');
    return;
  }

  const mediatorIds = mediators.map(m => m._id);

  console.log(`Ranking ${mediators.length} mediators by ideology...\n`);

  const result = await rankAndSplit(mediatorIds, {}, {
    splitBy: 'ideology',
    includeScores: true,
    maxResults: 10
  });

  console.log('Ranking Result:');
  console.log(`  Total: ${result.total}`);
  console.log(`  Split By: ${result.splitBy}`);
  console.log(`  Thresholds: High ≥${result.thresholds.high}, Medium ≥${result.thresholds.medium}, Low ≥${result.thresholds.low}`);
  console.log('\n  Distribution:');
  console.log(`    High: ${result.counts.high}`);
  console.log(`    Medium: ${result.counts.medium}`);
  console.log(`    Low: ${result.counts.low}`);
  console.log(`    Minimal: ${result.counts.minimal}`);

  console.log('\n  Top 3 Ranked:');
  result.ranked.slice(0, 3).forEach((m, i) => {
    console.log(`    ${i + 1}. ${m.name} (score: ${m.score})`);
    if (m.metadata) {
      console.log(`       Ideology: ${m.metadata.ideologyLabel}, Confidence: ${m.metadata.confidence}`);
    }
  });

  console.log(`\n  Method: ${result.method}`);
  console.log(`  Disclaimer: ${result.disclaimer}\n`);
}

async function runTests() {
  try {
    await connectDB();

    console.log('='.repeat(60));
    console.log('DETERMINISTIC SCORING PIPELINE TEST SUITE');
    console.log('='.repeat(60));

    await testEntityExtraction();
    await testLeaningScore();
    await testAffiliationScore();
    await testRanking();

    console.log('='.repeat(60));
    console.log('✅ All tests completed!');
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTests();
