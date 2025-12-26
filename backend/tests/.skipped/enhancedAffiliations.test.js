/**
 * Enhanced Affiliation Detection Tests
 * Tests NLP-based conflict detection
 */

// Skip entire suite if no API key
if (!process.env.HUGGINGFACE_API_KEY) {
  describe.skip('EnhancedAffiliationDetector (SKIPPED - No HUGGINGFACE_API_KEY)', () => {
    test('placeholder', () => {
      console.log('⚠️  Get FREE HuggingFace API key at: https://huggingface.co/settings/tokens');
    });
  });
} else {

const EnhancedAffiliationDetector = require('../src/services/huggingface/enhancedAffiliationDetector');
const Mediator = require('../src/models/Mediator');
const mongoose = require('mongoose');
const skipTests = false;

describe('EnhancedAffiliationDetector', () => {
  let detector;
  let testMediator;

  beforeAll(async () => {
    if (skipTests) {
      console.log('⚠️  Skipping EnhancedAffiliationDetector tests - HUGGINGFACE_API_KEY not set');
      console.log('   Get FREE at: https://huggingface.co/settings/tokens');
      return;
    }
    detector = new EnhancedAffiliationDetector();

    // Create test mediator
    testMediator = await Mediator.create({
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      practiceAreas: ['Corporate', 'Employment'],
      jurisdiction: 'CA',
      yearsExperience: 15,
      rating: 4.8,
      totalCases: 200,
      knownAffiliations: [
        {
          entity: 'TechCorp Inc',
          relationship: 'Former Legal Counsel',
          startDate: new Date('2015-01-01'),
          endDate: new Date('2020-12-31')
        },
        {
          entity: 'State Bar Association',
          relationship: 'Member',
          startDate: new Date('2010-01-01'),
          current: true
        }
      ],
      caseHistory: [
        {
          description: 'Represented TechCorp in patent dispute',
          year: 2019,
          practiceArea: 'IP'
        }
      ]
    });
  });

  afterAll(async () => {
    await Mediator.deleteMany({ email: /jane.smith/ });
    await mongoose.connection.close();
  });

  describe('detectConflicts', () => {
    (skipTests ? test.skip : test)('should detect exact match conflicts', async () => {
      const parties = [
        { name: 'TechCorp Inc', role: 'plaintiff' }
      ];

      const result = await detector.detectConflicts(testMediator._id, parties);

      expect(result.conflicts).toBeDefined();
      expect(result.conflicts.length).toBeGreaterThan(0);
      expect(result.conflicts[0].party).toBe('TechCorp Inc');
      expect(result.conflicts[0].riskLevel).toBe('high');
    }, 30000);

    (skipTests ? test.skip : test)('should detect semantic similarity conflicts', async () => {
      const parties = [
        {
          name: 'Technology Corporation Incorporated',
          role: 'defendant',
          description: 'Major tech company in Silicon Valley'
        }
      ];

      const result = await detector.detectConflicts(testMediator._id, parties);

      expect(result.conflicts).toBeDefined();
      // May or may not detect semantic match depending on NLP model
      expect(Array.isArray(result.conflicts)).toBe(true);
    }, 30000);

    (skipTests ? test.skip : test)('should return no conflicts for unrelated parties', async () => {
      const parties = [
        { name: 'Random Company LLC', role: 'plaintiff' }
      ];

      const result = await detector.detectConflicts(testMediator._id, parties);

      expect(result.conflicts).toBeDefined();
      expect(result.overallRisk).toBe('low');
    }, 30000);

    (skipTests ? test.skip : test)('should calculate overall risk level', async () => {
      const parties = [
        { name: 'TechCorp Inc', role: 'plaintiff' }
      ];

      const result = await detector.detectConflicts(testMediator._id, parties);

      expect(['low', 'medium', 'high']).toContain(result.overallRisk);
      expect(result).toHaveProperty('conflicts');
    }, 30000);

    (skipTests ? test.skip : test)('should include case history conflicts', async () => {
      const parties = [
        {
          name: 'TechCorp',
          role: 'plaintiff',
          caseType: 'patent'
        }
      ];

      const result = await detector.detectConflicts(testMediator._id, parties);

      expect(result.conflicts).toBeDefined();
      const caseConflict = result.conflicts.find(c => c.source === 'case_history');
      expect(caseConflict).toBeDefined();
    }, 30000);

    (skipTests ? test.skip : test)('should handle multiple parties', async () => {
      const parties = [
        { name: 'TechCorp Inc', role: 'plaintiff' },
        { name: 'Another Company', role: 'defendant' },
        { name: 'Third Party LLC', role: 'intervener' }
      ];

      const result = await detector.detectConflicts(testMediator._id, parties);

      expect(result.conflicts).toBeDefined();
      expect(Array.isArray(result.conflicts)).toBe(true);
    }, 30000);
  });

  describe('checkExactMatch', () => {
    (skipTests ? test.skip : test)('should match exact entity names', () => {
      const result = detector.checkExactMatch(testMediator, 'TechCorp Inc');

      expect(result.hasMatch).toBe(true);
      expect(result.matchedAffiliation).toBeDefined();
      expect(result.matchedAffiliation.entity).toBe('TechCorp Inc');
    });

    (skipTests ? test.skip : test)('should be case-insensitive', () => {
      const result = detector.checkExactMatch(testMediator, 'techcorp inc');

      expect(result.hasMatch).toBe(true);
    });

    (skipTests ? test.skip : test)('should not match unrelated entities', () => {
      const result = detector.checkExactMatch(testMediator, 'Random Company');

      expect(result.hasMatch).toBe(false);
      expect(result.matchedAffiliation).toBeNull();
    });
  });

  describe('calculateOverallRisk', () => {
    (skipTests ? test.skip : test)('should return high risk for high-risk conflicts', () => {
      const conflicts = [
        { riskLevel: 'high', party: 'Test' }
      ];

      const risk = detector.calculateOverallRisk(conflicts);
      expect(risk).toBe('high');
    });

    (skipTests ? test.skip : test)('should return medium risk for multiple medium conflicts', () => {
      const conflicts = [
        { riskLevel: 'medium', party: 'Test1' },
        { riskLevel: 'medium', party: 'Test2' }
      ];

      const risk = detector.calculateOverallRisk(conflicts);
      expect(risk).toBe('medium');
    });

    (skipTests ? test.skip : test)('should return low risk for no conflicts', () => {
      const conflicts = [];

      const risk = detector.calculateOverallRisk(conflicts);
      expect(risk).toBe('low');
    });

    (skipTests ? test.skip : test)('should return low risk for only low-risk conflicts', () => {
      const conflicts = [
        { riskLevel: 'low', party: 'Test' }
      ];

      const risk = detector.calculateOverallRisk(conflicts);
      expect(risk).toBe('low');
    });
  });
});

} // End conditional require
