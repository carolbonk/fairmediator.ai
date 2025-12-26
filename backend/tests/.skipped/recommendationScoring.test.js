/**
 * Recommendation Scoring Tests
 * Tests 7-factor mediator scoring algorithm
 */

const RecommendationScorer = require('../src/services/ai/recommendationScoring');
const Mediator = require('../src/models/Mediator');
const mongoose = require('mongoose');

describe('RecommendationScorer', () => {
  let scorer;
  let testMediators = [];

  beforeAll(async () => {
    scorer = new RecommendationScorer();

    // Create test mediators with varying attributes
    testMediators.push(await Mediator.create({
      name: 'Expert Mediator',
      email: 'expert@example.com',
      practiceAreas: ['Technology', 'IP', 'Corporate'],
      jurisdiction: 'CA',
      location: { city: 'San Francisco', state: 'CA' },
      yearsExperience: 25,
      rating: 4.9,
      totalCases: 500,
      availability: 'immediate',
      ideology: { score: 0, label: 'neutral' }
    }));

    testMediators.push(await Mediator.create({
      name: 'Novice Mediator',
      email: 'novice@example.com',
      practiceAreas: ['Family Law'],
      jurisdiction: 'NY',
      location: { city: 'New York', state: 'NY' },
      yearsExperience: 2,
      rating: 3.5,
      totalCases: 10,
      availability: 'limited',
      ideology: { score: -5, label: 'liberal' }
    }));

    testMediators.push(await Mediator.create({
      name: 'Specialized Mediator',
      email: 'specialist@example.com',
      practiceAreas: ['IP', 'Technology'],
      jurisdiction: 'CA',
      location: { city: 'San Jose', state: 'CA' },
      yearsExperience: 15,
      rating: 4.7,
      totalCases: 200,
      availability: 'available',
      ideology: { score: 3, label: 'conservative' }
    }));
  });

  afterAll(async () => {
    await Mediator.deleteMany({ email: /@example.com/ });
    await mongoose.connection.close();
  });

  describe('scoreMediator', () => {
    test('should return comprehensive score breakdown', async () => {
      const caseContext = {
        practiceArea: 'Technology',
        caseType: 'contract dispute',
        preferredLocation: { city: 'San Francisco', state: 'CA' },
        urgency: 'high',
        ideologyPreference: 'neutral'
      };

      const result = await scorer.scoreMediator(testMediators[0]._id, caseContext);

      expect(result).toHaveProperty('totalScore');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('recommendation');
      expect(result).toHaveProperty('reasoning');

      expect(result.breakdown).toHaveProperty('experienceScore');
      expect(result.breakdown).toHaveProperty('ratingScore');
      expect(result.breakdown).toHaveProperty('practiceAreaMatch');
      expect(result.breakdown).toHaveProperty('locationMatch');
      expect(result.breakdown).toHaveProperty('ideologyMatch');
      expect(result.breakdown).toHaveProperty('popularityScore');
      expect(result.breakdown).toHaveProperty('availabilityScore');
    });

    test('should score expert mediator higher', async () => {
      const caseContext = {
        practiceArea: 'Technology',
        preferredLocation: { city: 'San Francisco', state: 'CA' }
      };

      const expertScore = await scorer.scoreMediator(testMediators[0]._id, caseContext);
      const noviceScore = await scorer.scoreMediator(testMediators[1]._id, caseContext);

      expect(expertScore.totalScore).toBeGreaterThan(noviceScore.totalScore);
    });

    test('should prioritize practice area match', async () => {
      const caseContext = {
        practiceArea: 'IP',
        caseType: 'patent dispute'
      };

      const specialistScore = await scorer.scoreMediator(testMediators[2]._id, caseContext);

      expect(specialistScore.breakdown.practiceAreaMatch).toBeGreaterThan(15);
      expect(specialistScore.totalScore).toBeGreaterThan(60);
    });

    test('should consider location proximity', async () => {
      const caseContext = {
        practiceArea: 'Technology',
        preferredLocation: { city: 'San Francisco', state: 'CA' }
      };

      const sfScore = await scorer.scoreMediator(testMediators[0]._id, caseContext);
      const nyScore = await scorer.scoreMediator(testMediators[1]._id, caseContext);

      expect(sfScore.breakdown.locationMatch).toBeGreaterThan(nyScore.breakdown.locationMatch);
    });

    test('should match ideology preference', async () => {
      const neutralContext = {
        practiceArea: 'Technology',
        ideologyPreference: 'neutral'
      };

      const neutralScore = await scorer.scoreMediator(testMediators[0]._id, neutralContext);
      expect(neutralScore.breakdown.ideologyMatch).toBeGreaterThan(7);
    });

    test('should provide appropriate recommendation labels', async () => {
      const caseContext = {
        practiceArea: 'Technology',
        preferredLocation: { city: 'San Francisco', state: 'CA' }
      };

      const expertScore = await scorer.scoreMediator(testMediators[0]._id, caseContext);
      const noviceScore = await scorer.scoreMediator(testMediators[1]._id, caseContext);

      expect(['Highly Recommended', 'Recommended']).toContain(expertScore.recommendation);
      expect(['Consider', 'Not Recommended']).toContain(noviceScore.recommendation);
    });
  });

  describe('rankMediators', () => {
    test('should rank mediators by total score', async () => {
      const caseContext = {
        practiceArea: 'Technology',
        preferredLocation: { city: 'San Francisco', state: 'CA' },
        ideologyPreference: 'neutral'
      };

      const mediatorIds = testMediators.map(m => m._id);
      const ranked = await scorer.rankMediators(mediatorIds, caseContext);

      expect(Array.isArray(ranked)).toBe(true);
      expect(ranked.length).toBe(3);

      // Should be sorted by totalScore descending
      for (let i = 0; i < ranked.length - 1; i++) {
        expect(ranked[i].totalScore).toBeGreaterThanOrEqual(ranked[i + 1].totalScore);
      }

      // Expert should rank highest
      expect(ranked[0].mediatorId.toString()).toBe(testMediators[0]._id.toString());
    });

    test('should respect limit parameter', async () => {
      const caseContext = { practiceArea: 'Technology' };
      const mediatorIds = testMediators.map(m => m._id);

      const ranked = await scorer.rankMediators(mediatorIds, caseContext, 2);

      expect(ranked.length).toBe(2);
    });

    test('should handle empty mediator list', async () => {
      const ranked = await scorer.rankMediators([], {});

      expect(ranked).toEqual([]);
    });
  });

  describe('getTopRecommendations', () => {
    test('should return top-scored mediators from database', async () => {
      const caseContext = {
        practiceArea: 'Technology',
        preferredLocation: { city: 'San Francisco', state: 'CA' }
      };

      const recommendations = await scorer.getTopRecommendations(caseContext, 10);

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toHaveProperty('mediator');
      expect(recommendations[0]).toHaveProperty('score');
      expect(recommendations[0]).toHaveProperty('recommendation');
    });

    test('should filter by practice area', async () => {
      const caseContext = {
        practiceArea: 'IP'
      };

      const recommendations = await scorer.getTopRecommendations(caseContext, 5);

      recommendations.forEach(rec => {
        expect(rec.mediator.practiceAreas).toContain('IP');
      });
    });

    test('should respect limit parameter', async () => {
      const recommendations = await scorer.getTopRecommendations({}, 2);

      expect(recommendations.length).toBeLessThanOrEqual(2);
    });
  });
});
