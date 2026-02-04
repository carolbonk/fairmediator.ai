/**
 * Test Script for Multi-Signal Bias Detection
 * Tests the integrated bias scoring system with weighted signals
 */

const multiSignalBiasDetection = require('../../src/services/ai/multiSignalBiasDetection');
const queryExpansion = require('../../src/services/ai/queryExpansion');

console.log('🧪 Starting Multi-Signal Bias Detection Tests...\n');

// Test 1: Query Expansion
function testQueryExpansion() {
  console.log('=== Test 1: Query Expansion ===');

  const testQueries = [
    'divorce case',
    'employment discrimination',
    'ip dispute',
    'construction defect',
    'medical malpractice'
  ];

  testQueries.forEach(query => {
    const expansion = queryExpansion.expandQuery(query, {
      maxExpansions: 5,
      includeSynonyms: true,
      includeAbbreviations: true,
      practiceAreaExpansion: true
    });

    console.log(`\nQuery: "${query}"`);
    console.log(`Expanded terms (${expansion.expansionCount} added):`, expansion.expanded.slice(0, 5));
  });

  console.log('\n✅ Query Expansion Test Complete\n');
}

// Test 2: Multi-Signal Bias Detection (Low Bias)
function testLowBiasScenario() {
  console.log('=== Test 2: Low Bias Scenario ===');

  const signals = {
    caseOutcomes: {
      totalCases: 5,
      wins: 2,
      losses: 3,
      winRate: 40,
      statistically_significant: true
    },
    caseHistory: {
      hasConflict: true,
      conflicts: [
        { caseNumber: '1:20-cv-01234', dateFiled: '2020-05-15', confidence: 0.85 }
      ]
    },
    linkedinData: {
      mutualConnectionsCount: 3,
      relationshipStrength: { strengthLevel: 'weak', confidence: 0.5 }
    },
    affiliations: [],
    donations: [],
    publicStatements: []
  };

  const result = multiSignalBiasDetection.calculateBiasScore(signals);

  console.log('\nBias Score:', result.biasScore);
  console.log('Bias Level:', result.biasLevel);
  console.log('Recommendation:', result.recommendation);
  console.log('Active Signals:', result.signalCount);
  console.log('\nSignal Breakdown:');
  result.breakdown.forEach(signal => {
    console.log(`  ${signal.signal}: score=${signal.individualScore.toFixed(2)}, contribution=${signal.contribution.toFixed(2)} (${signal.percentageOfTotal}%)`);
  });

  console.log('\n✅ Low Bias Test Complete\n');
}

// Test 3: Multi-Signal Bias Detection (High Bias)
function testHighBiasScenario() {
  console.log('=== Test 3: High Bias Scenario ===');

  const signals = {
    caseOutcomes: {
      totalCases: 10,
      wins: 8,
      losses: 2,
      winRate: 80,
      statistically_significant: true
    },
    caseHistory: {
      hasConflict: true,
      conflicts: [
        { caseNumber: '1:22-cv-01234', dateFiled: '2023-05-15', confidence: 0.9 },
        { caseNumber: '1:23-cv-05678', dateFiled: '2024-03-20', confidence: 0.95 },
        { caseNumber: '1:24-cv-09876', dateFiled: '2025-01-10', confidence: 0.85 }
      ]
    },
    linkedinData: {
      mutualConnectionsCount: 45,
      relationshipStrength: { strengthLevel: 'very_strong', confidence: 0.9 }
    },
    affiliations: [
      { name: 'California State Bar Association', isCurrent: true },
      { name: 'San Francisco Mediators Guild', isCurrent: true }
    ],
    donations: [
      { recipient: 'Democratic Party', amount: 5000, year: 2024 },
      { recipient: 'Biden Campaign', amount: 2500, year: 2024 }
    ],
    publicStatements: [
      { statement: 'Strong liberal views on labor rights', sentiment: 'liberal' },
      { statement: 'Supports progressive policies', sentiment: 'liberal' }
    ]
  };

  const result = multiSignalBiasDetection.calculateBiasScore(signals);

  console.log('\n🚨 High Bias Scenario:');
  console.log('Bias Score:', result.biasScore);
  console.log('Bias Level:', result.biasLevel);
  console.log('Recommendation:', result.recommendation);
  console.log('Active Signals:', result.signalCount);
  console.log('\nSignal Breakdown:');
  result.breakdown.forEach(signal => {
    console.log(`  ${signal.signal}: score=${signal.individualScore.toFixed(2)}, contribution=${signal.contribution.toFixed(2)} (${signal.percentageOfTotal}%)`);
  });

  console.log('\n✅ High Bias Test Complete\n');
}

// Test 4: Multi-Signal Bias Detection (Moderate Bias)
function testModerateBiasScenario() {
  console.log('=== Test 4: Moderate Bias Scenario ===');

  const signals = {
    caseOutcomes: {
      totalCases: 7,
      wins: 4,
      losses: 3,
      winRate: 57,
      statistically_significant: true
    },
    caseHistory: {
      hasConflict: true,
      conflicts: [
        { caseNumber: '1:21-cv-01234', dateFiled: '2022-05-15', confidence: 0.75 },
        { caseNumber: '1:23-cv-05678', dateFiled: '2024-03-20', confidence: 0.80 }
      ]
    },
    linkedinData: {
      mutualConnectionsCount: 15,
      relationshipStrength: { strengthLevel: 'moderate', confidence: 0.6 }
    },
    affiliations: [
      { name: 'Former colleague at Law Firm XYZ', isCurrent: false }
    ],
    donations: [
      { recipient: 'Local Judge Campaign', amount: 1000, year: 2023 }
    ],
    publicStatements: []
  };

  const result = multiSignalBiasDetection.calculateBiasScore(signals);

  console.log('\n⚠️ Moderate Bias Scenario:');
  console.log('Bias Score:', result.biasScore);
  console.log('Bias Level:', result.biasLevel);
  console.log('Recommendation:', result.recommendation);
  console.log('Active Signals:', result.signalCount);
  console.log('\nSignal Breakdown:');
  result.breakdown.forEach(signal => {
    console.log(`  ${signal.signal}: score=${signal.individualScore.toFixed(2)}, contribution=${signal.contribution.toFixed(2)} (${signal.percentageOfTotal}%)`);
  });

  console.log('\n✅ Moderate Bias Test Complete\n');
}

// Test 5: Signal Weight Configuration
function testSignalWeights() {
  console.log('=== Test 5: Signal Weight Configuration ===');

  const weights = multiSignalBiasDetection.getWeights();
  console.log('\nCurrent Signal Weights:');
  Object.entries(weights).forEach(([signal, weight]) => {
    console.log(`  ${signal}: ${weight}`);
  });

  // Test weight update
  console.log('\nTesting weight update...');
  multiSignalBiasDetection.updateWeight('case_outcomes', 0.9);
  const updatedWeights = multiSignalBiasDetection.getWeights();
  console.log('Updated case_outcomes weight:', updatedWeights.case_outcomes);

  // Reset to original
  multiSignalBiasDetection.updateWeight('case_outcomes', 0.8);
  console.log('Reset case_outcomes weight:', multiSignalBiasDetection.getWeights().case_outcomes);

  console.log('\n✅ Signal Weight Configuration Test Complete\n');
}

// Test 6: Edge Cases
function testEdgeCases() {
  console.log('=== Test 6: Edge Cases ===');

  // No signals
  console.log('\n1. No signals provided:');
  const noSignals = multiSignalBiasDetection.calculateBiasScore({});
  console.log('Bias Score:', noSignals.biasScore);
  console.log('Bias Level:', noSignals.biasLevel);

  // Only one signal
  console.log('\n2. Only case outcomes (perfect win rate):');
  const singleSignal = multiSignalBiasDetection.calculateBiasScore({
    caseOutcomes: {
      totalCases: 5,
      wins: 5,
      losses: 0,
      winRate: 100,
      statistically_significant: true
    }
  });
  console.log('Bias Score:', singleSignal.biasScore);
  console.log('Bias Level:', singleSignal.biasLevel);

  // Insufficient case data
  console.log('\n3. Insufficient case data (< 3 cases):');
  const insufficientData = multiSignalBiasDetection.calculateBiasScore({
    caseOutcomes: {
      totalCases: 2,
      wins: 2,
      losses: 0,
      winRate: 100,
      statistically_significant: false
    }
  });
  console.log('Bias Score:', insufficientData.biasScore);
  console.log('Bias Level:', insufficientData.biasLevel);

  console.log('\n✅ Edge Cases Test Complete\n');
}

// Run all tests
function runAllTests() {
  try {
    testQueryExpansion();
    testLowBiasScenario();
    testHighBiasScenario();
    testModerateBiasScenario();
    testSignalWeights();
    testEdgeCases();

    console.log('✨ All Multi-Signal Bias Detection Tests Completed Successfully!\n');
  } catch (error) {
    console.error('❌ Test Error:', error.message);
    console.error(error.stack);
  }
}

runAllTests();
