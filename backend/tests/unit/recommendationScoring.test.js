/**
 * Recommendation Scoring Tests
 * Tests 7-factor mediator scoring algorithm
 */

const RecommendationScoring = require('../../src/services/ai/recommendationScoring');
const Mediator = require('../../src/models/Mediator');

describe('RecommendationScorer', () => {
  let scorer;
  let expert, novice, specialist;

  beforeEach(async () => {
    scorer = new RecommendationScoring();

    // Use `specializations` — practiceAreas is a virtual alias stored as specializations
    expert = await Mediator.create({
      name: 'Expert Mediator',
      email: 'expert@scoring-test.com',
      specializations: ['Technology', 'IP', 'Corporate'],
      jurisdiction: 'CA',
      location: { city: 'San Francisco', state: 'CA' },
      yearsExperience: 25,
      rating: 4.9,
      totalCases: 500,
      ideologyScore: 0
    });

    novice = await Mediator.create({
      name: 'Novice Mediator',
      email: 'novice@scoring-test.com',
      specializations: ['Family Law'],
      jurisdiction: 'NY',
      location: { city: 'New York', state: 'NY' },
      yearsExperience: 2,
      rating: 3.5,
      totalCases: 10,
      ideologyScore: -5
    });

    specialist = await Mediator.create({
      name: 'IP Specialist',
      email: 'specialist@scoring-test.com',
      specializations: ['IP', 'Technology'],
      jurisdiction: 'CA',
      location: { city: 'San Jose', state: 'CA' },
      yearsExperience: 15,
      rating: 4.7,
      totalCases: 200,
      ideologyScore: 3
    });
  });

  describe('scoreMediator', () => {
    test('should return comprehensive score breakdown', async () => {
      const caseContext = {
        practiceAreas: ['Technology'],
        location: 'CA',
        ideologyPreference: 'neutral'
      };

      const result = await scorer.scoreMediator(expert._id, caseContext);

      expect(result).toHaveProperty('totalScore');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('recommendation');

      expect(result.breakdown).toHaveProperty('experienceScore');
      expect(result.breakdown).toHaveProperty('ratingScore');
      expect(result.breakdown).toHaveProperty('practiceAreaMatch');
      expect(result.breakdown).toHaveProperty('locationMatch');
      expect(result.breakdown).toHaveProperty('ideologyMatch');
      expect(result.breakdown).toHaveProperty('popularityScore');
      expect(result.breakdown).toHaveProperty('availabilityScore');
    });

    test('should score expert mediator higher than novice for Technology cases', async () => {
      const caseContext = {
        practiceAreas: ['Technology'],
        location: 'CA'
      };

      const expertScore = await scorer.scoreMediator(expert._id, caseContext);
      const noviceScore = await scorer.scoreMediator(novice._id, caseContext);

      expect(expertScore.totalScore).toBeGreaterThan(noviceScore.totalScore);
    });

    test('should give higher practiceAreaMatch to specialist for IP cases', async () => {
      const caseContext = { practiceAreas: ['IP'] };

      const specialistScore = await scorer.scoreMediator(specialist._id, caseContext);
      const noviceScore = await scorer.scoreMediator(novice._id, caseContext);

      expect(specialistScore.breakdown.practiceAreaMatch).toBeGreaterThan(
        noviceScore.breakdown.practiceAreaMatch
      );
    });

    test('should give higher locationMatch to CA mediator for CA cases', async () => {
      const caseContext = { practiceAreas: ['Technology'], location: 'CA' };

      const caScore = await scorer.scoreMediator(expert._id, caseContext);
      const nyScore = await scorer.scoreMediator(novice._id, caseContext);

      expect(caScore.breakdown.locationMatch).toBeGreaterThan(nyScore.breakdown.locationMatch);
    });

    test('should score neutral mediator higher for neutral ideology preference', async () => {
      const neutralContext = {
        practiceAreas: ['Technology'],
        ideologyPreference: 'neutral'
      };

      const neutralScore = await scorer.scoreMediator(expert._id, neutralContext); // ideologyScore: 0
      const liberalScore = await scorer.scoreMediator(novice._id, neutralContext);  // ideologyScore: -5

      expect(neutralScore.breakdown.ideologyMatch).toBeGreaterThan(
        liberalScore.breakdown.ideologyMatch
      );
    });

    test('should return a valid recommendation label', async () => {
      const result = await scorer.scoreMediator(expert._id, { practiceAreas: ['Technology'] });

      expect(['Highly Recommended', 'Recommended', 'Consider', 'Not Recommended'])
        .toContain(result.recommendation);
    });
  });

  describe('rankMediators', () => {
    test('should return sorted array by total score', async () => {
      const caseContext = {
        practiceAreas: ['Technology'],
        location: 'CA',
        ideologyPreference: 'neutral'
      };

      const ranked = await scorer.rankMediators([expert._id, novice._id, specialist._id], caseContext);

      expect(Array.isArray(ranked)).toBe(true);
      expect(ranked.length).toBe(3);

      for (let i = 0; i < ranked.length - 1; i++) {
        expect(ranked[i].totalScore).toBeGreaterThanOrEqual(ranked[i + 1].totalScore);
      }
    });

    test('should respect limit parameter', async () => {
      const ranked = await scorer.rankMediators(
        [expert._id, novice._id, specialist._id],
        { practiceAreas: ['Technology'] },
        2
      );
      expect(ranked.length).toBe(2);
    });

    test('should handle empty mediator list', async () => {
      const ranked = await scorer.rankMediators([], {});
      expect(ranked).toEqual([]);
    });
  });

  describe('getTopRecommendations', () => {
    test('should return scored mediator objects', async () => {
      const recommendations = await scorer.getTopRecommendations(
        { practiceAreas: ['Technology'] },
        10
      );

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toHaveProperty('mediator');
      expect(recommendations[0]).toHaveProperty('score');
      expect(recommendations[0]).toHaveProperty('recommendation');
    });

    test('should filter by practice area (specializations)', async () => {
      const recommendations = await scorer.getTopRecommendations({ practiceAreas: ['IP'] }, 5);

      recommendations.forEach(rec => {
        expect(rec.mediator.specializations).toContain('IP');
      });
    });

    test('should respect limit', async () => {
      const recommendations = await scorer.getTopRecommendations({}, 2);
      expect(recommendations.length).toBeLessThanOrEqual(2);
    });
  });
});
