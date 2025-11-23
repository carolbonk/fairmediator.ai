/**
 * Mediator Recommendation Scoring System
 */

const Mediator = require('../../models/Mediator');
const UsageLog = require('../../models/UsageLog');

class RecommendationScoring {
  /**
   * Score and rank mediators for a specific case
   */
  async scoreMediator(mediatorId, caseContext) {
    try {
      const mediator = await Mediator.findById(mediatorId);

      if (!mediator) {
        throw new Error('Mediator not found');
      }

      const scores = {
        experienceScore: this.calculateExperienceScore(mediator),
        ratingScore: this.calculateRatingScore(mediator),
        practiceAreaMatch: await this.calculatePracticeAreaMatch(mediator, caseContext),
        locationMatch: this.calculateLocationMatch(mediator, caseContext),
        ideologyMatch: this.calculateIdeologyMatch(mediator, caseContext),
        popularityScore: await this.calculatePopularityScore(mediator),
        availabilityScore: this.calculateAvailabilityScore(mediator)
      };

      // Weighted total score
      const weights = {
        experienceScore: 0.20,
        ratingScore: 0.25,
        practiceAreaMatch: 0.25,
        locationMatch: 0.10,
        ideologyMatch: 0.10,
        popularityScore: 0.05,
        availabilityScore: 0.05
      };

      const totalScore = Object.keys(scores).reduce((sum, key) => {
        return sum + (scores[key] * weights[key]);
      }, 0);

      return {
        mediatorId,
        mediatorName: mediator.name,
        totalScore: Math.round(totalScore * 100) / 100,
        breakdown: scores,
        weights,
        recommendation: this.getRecommendationLevel(totalScore)
      };
    } catch (error) {
      console.error('Scoring error:', error);
      throw error;
    }
  }

  /**
   * Calculate experience score
   * DRY: Years of experience + profile completeness
   */
  calculateExperienceScore(mediator) {
    const years = mediator.yearsExperience || 0;
    const completeness = mediator.profileCompleteness || 0;

    // Experience: 0-30 years mapped to 0-70 points
    const experiencePoints = Math.min(years * 2.33, 70);

    // Completeness: 0-100% mapped to 0-30 points
    const completenessPoints = completeness * 0.3;

    return Math.min(experiencePoints + completenessPoints, 100);
  }

  /**
   * Calculate rating score
   * DRY: Based on average rating and number of reviews
   */
  calculateRatingScore(mediator) {
    const rating = mediator.rating || 0;
    const reviewCount = mediator.reviewCount || 0;

    // Base score from rating (0-5 stars to 0-80 points)
    const ratingPoints = (rating / 5) * 80;

    // Bonus points for having reviews (0-20 points)
    const reviewBonus = Math.min(reviewCount * 2, 20);

    return Math.min(ratingPoints + reviewBonus, 100);
  }

  /**
   * Calculate practice area match
   * DRY: Fuzzy matching of practice areas
   */
  async calculatePracticeAreaMatch(mediator, caseContext) {
    if (!caseContext.practiceAreas || caseContext.practiceAreas.length === 0) {
      return 50; // Neutral score if no preference
    }

    const mediatorAreas = (mediator.practiceAreas || []).map(a => a.toLowerCase());
    const requestedAreas = caseContext.practiceAreas.map(a => a.toLowerCase());

    // Calculate overlap
    const matches = requestedAreas.filter(area =>
      mediatorAreas.some(mArea => 
        mArea.includes(area) || area.includes(mArea)
      )
    );

    const matchPercentage = (matches.length / requestedAreas.length) * 100;

    return Math.round(matchPercentage);
  }

  /**
   * Calculate location match
   * DRY: Distance-based or exact match
   */
  calculateLocationMatch(mediator, caseContext) {
    if (!caseContext.location) {
      return 50; // Neutral score if no preference
    }

    const mediatorLocation = (mediator.location?.state || '').toLowerCase();
    const requestedLocation = caseContext.location.toLowerCase();

    // Exact state match
    if (mediatorLocation === requestedLocation) {
      return 100;
    }

    // City match
    const mediatorCity = (mediator.location?.city || '').toLowerCase();
    if (mediatorCity.includes(requestedLocation) || requestedLocation.includes(mediatorCity)) {
      return 80;
    }

    // No match
    return 20;
  }

  /**
   * Calculate ideology match
   * DRY: Preference-based scoring
   */
  calculateIdeologyMatch(mediator, caseContext) {
    if (!caseContext.ideologyPreference) {
      return 50; // Neutral if no preference
    }

    const mediatorScore = mediator.ideologyScore || 0;
    const preference = caseContext.ideologyPreference.toLowerCase();

    // Map preferences to score ranges
    const ranges = {
      'liberal': { min: -2, max: -0.5 },
      'neutral': { min: -0.5, max: 0.5 },
      'conservative': { min: 0.5, max: 2 }
    };

    const range = ranges[preference];

    if (!range) {
      return 50;
    }

    // Check if mediator falls within preferred range
    if (mediatorScore >= range.min && mediatorScore <= range.max) {
      return 100;
    }

    // Partial match (close to range)
    const distance = Math.min(
      Math.abs(mediatorScore - range.min),
      Math.abs(mediatorScore - range.max)
    );

    return Math.max(0, 100 - (distance * 50));
  }

  /**
   * Calculate popularity score
   * DRY: Based on profile views
   */
  async calculatePopularityScore(mediator) {
    try {
      const views = await UsageLog.countDocuments({
        eventType: 'profile_view',
        'metadata.mediatorId': mediator._id
      });

      // 0-100 views mapped to 0-100 points
      return Math.min(views, 100);
    } catch (error) {
      return 50; // Default neutral score
    }
  }

  /**
   * Calculate availability score
   * DRY: Placeholder for future scheduling integration
   */
  calculateAvailabilityScore(mediator) {
    // Placeholder - could integrate with calendar API
    // For now, verified mediators get higher score
    return mediator.isVerified ? 80 : 50;
  }

  /**
   * Get recommendation level
   * DRY: Consistent categorization
   */
  getRecommendationLevel(score) {
    if (score >= 80) {
      return 'Highly Recommended';
    }
    if (score >= 60) {
      return 'Recommended';
    }
    if (score >= 40) {
      return 'Consider';
    }
    return 'Not Recommended';
  }

  /**
   * Score and rank multiple mediators
   * DRY: Batch scoring with sorting
   */
  async scoreAndRankMediators(mediatorIds, caseContext) {
    const scores = await Promise.all(
      mediatorIds.map(id => this.scoreMediator(id, caseContext))
    );

    // Sort by total score descending
    scores.sort((a, b) => b.totalScore - a.totalScore);

    return {
      rankings: scores,
      topRecommendation: scores[0],
      averageScore: scores.reduce((sum, s) => sum + s.totalScore, 0) / scores.length
    };
  }
}

// Export both class and instance
module.exports = RecommendationScoring;
module.exports.instance = new RecommendationScoring();
