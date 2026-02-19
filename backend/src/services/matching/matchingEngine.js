const Mediator = require('../../models/Mediator');
const { escapeRegex } = require('../../utils/sanitization');

/**
 * Mediator Matching & Scoring Engine
 * Implements scoring logic based on expertise, rate, ideology, and affiliation risk
 */
class MatchingEngine {
  constructor() {
    this.defaultWeights = {
      expertise: 0.35,
      experience: 0.20,
      ideology: 0.15,
      location: 0.15,
      conflictRisk: 0.15
    };
  }

  /**
   * Calculate expertise match score
   */
  calculateExpertiseScore(mediator, requiredSpecializations) {
    if (!requiredSpecializations || requiredSpecializations.length === 0) {
      return 50; // Neutral score if no requirements
    }

    const mediatorSpecs = (mediator.specializations || []).map(s => s.toLowerCase());
    const requiredSpecs = requiredSpecializations.map(s => s.toLowerCase());

    const matches = requiredSpecs.filter(req => 
      mediatorSpecs.some(med => 
        med.includes(req) || req.includes(med)
      )
    );

    const score = (matches.length / requiredSpecs.length) * 100;
    return Math.round(score);
  }

  /**
   * Calculate experience score
   */
  calculateExperienceScore(mediator) {
    const years = mediator.yearsExperience || 0;
    
    if (years === 0) return 0;
    if (years < 3) return 40;
    if (years < 5) return 60;
    if (years < 10) return 75;
    if (years < 15) return 85;
    if (years < 20) return 95;
    return 100;
  }

  /**
   * Calculate ideology match score
   */
  calculateIdeologyScore(mediator, preferredIdeology) {
    if (!preferredIdeology) return 50; // Neutral if no preference

    const score = mediator.ideologyScore || 0;
    
    const ranges = {
      'very_liberal': { min: -10, max: -5 },
      'liberal': { min: -5, max: -2 },
      'neutral': { min: -2, max: 2 },
      'conservative': { min: 2, max: 5 },
      'very_conservative': { min: 5, max: 10 }
    };

    const range = ranges[preferredIdeology];
    if (!range) return 50;

    // Perfect match if within range
    if (score >= range.min && score <= range.max) {
      return 100;
    }

    // Calculate distance from preferred range
    const distance = score < range.min ? 
      range.min - score : 
      score - range.max;

    // Decrease score based on distance
    const matchScore = Math.max(0, 100 - (distance * 10));
    return Math.round(matchScore);
  }

  /**
   * Calculate location match score
   */
  calculateLocationScore(mediator, preferredLocation) {
    if (!preferredLocation) return 50;

    const medLocation = mediator.location || {};
    
    // Exact city match
    if (preferredLocation.city && 
        medLocation.city?.toLowerCase() === preferredLocation.city.toLowerCase()) {
      return 100;
    }

    // State match
    if (preferredLocation.state && 
        medLocation.state?.toLowerCase() === preferredLocation.state.toLowerCase()) {
      return 70;
    }

    // Country match
    if (preferredLocation.country && 
        medLocation.country?.toLowerCase() === preferredLocation.country.toLowerCase()) {
      return 40;
    }

    return 0;
  }

  /**
   * Calculate conflict risk score (inverse - lower risk = higher score)
   */
  async calculateConflictScore(mediator, parties = []) {
    if (!parties || parties.length === 0) return 100;

    const conflicts = await mediator.detectConflicts(parties);
    
    if (conflicts.length === 0) return 100;

    const highRisk = conflicts.filter(c => c.riskLevel === 'high').length;
    const mediumRisk = conflicts.filter(c => c.riskLevel === 'medium').length;
    const lowRisk = conflicts.filter(c => c.riskLevel === 'low').length;

    // Severe penalty for high risk, moderate for medium, light for low
    const penaltyScore = (highRisk * 50) + (mediumRisk * 20) + (lowRisk * 5);
    const score = Math.max(0, 100 - penaltyScore);

    return Math.round(score);
  }

  /**
   * Calculate overall match score
   */
  async calculateOverallScore(mediator, criteria, weights = null) {
    const w = weights || this.defaultWeights;

    const scores = {
      expertise: this.calculateExpertiseScore(mediator, criteria.specializations),
      experience: this.calculateExperienceScore(mediator),
      ideology: this.calculateIdeologyScore(mediator, criteria.ideology),
      location: this.calculateLocationScore(mediator, criteria.location),
      conflictRisk: await this.calculateConflictScore(mediator, criteria.parties)
    };

    const overallScore = 
      (scores.expertise * w.expertise) +
      (scores.experience * w.experience) +
      (scores.ideology * w.ideology) +
      (scores.location * w.location) +
      (scores.conflictRisk * w.conflictRisk);

    return {
      overallScore: Math.round(overallScore),
      breakdown: scores,
      weights: w,
      mediatorId: mediator._id,
      mediatorName: mediator.name
    };
  }

  /**
   * Find and rank mediators based on criteria
   */
  async findMatchingMediators(criteria, options = {}) {
    const {
      limit = 20,
      minScore = 50,
      weights = null
    } = options;

    // Build MongoDB query
    const query = { isActive: true };

    // Filter by location if specified
    if (criteria.location?.state) {
      query['location.state'] = new RegExp(escapeRegex(criteria.location.state), 'i');
    }

    // Filter by specializations if specified
    if (criteria.specializations?.length > 0) {
      query.specializations = { 
        $in: criteria.specializations.map(s => new RegExp(escapeRegex(s), 'i'))
      };
    }

    // Get mediators
    const mediators = await Mediator.find(query).limit(limit * 2); // Get more than needed

    // Score each mediator
    const scoredMediators = [];
    
    for (const mediator of mediators) {
      const scoreData = await this.calculateOverallScore(mediator, criteria, weights);
      
      if (scoreData.overallScore >= minScore) {
        scoredMediators.push({
          mediator: {
            _id: mediator._id,
            name: mediator.name,
            email: mediator.email,
            lawFirm: mediator.lawFirm,
            location: mediator.location,
            specializations: mediator.specializations,
            yearsExperience: mediator.yearsExperience,
            ideologyScore: mediator.ideologyScore,
            isVerified: mediator.isVerified
          },
          score: scoreData
        });
      }
    }

    // Sort by overall score (descending)
    scoredMediators.sort((a, b) => b.score.overallScore - a.score.overallScore);

    // Return top matches
    return scoredMediators.slice(0, limit);
  }

  /**
   * Get recommended mediators based on user preferences
   */
  async getRecommendations(userId, criteria) {
    // Get user's previous searches/preferences if available
    // For now, just use the criteria provided

    const matches = await this.findMatchingMediators(criteria, {
      limit: 10,
      minScore: 60
    });

    return {
      matches,
      count: matches.length,
      criteria,
      timestamp: new Date()
    };
  }

  /**
   * Compare multiple mediators side-by-side
   */
  async compareMediators(mediatorIds, criteria) {
    const comparisons = [];

    for (const mediatorId of mediatorIds) {
      const mediator = await Mediator.findById(mediatorId);
      
      if (mediator) {
        const score = await this.calculateOverallScore(mediator, criteria);
        
        comparisons.push({
          mediator: {
            _id: mediator._id,
            name: mediator.name,
            lawFirm: mediator.lawFirm,
            location: mediator.location,
            specializations: mediator.specializations,
            yearsExperience: mediator.yearsExperience,
            ideologyScore: mediator.ideologyScore
          },
          score
        });
      }
    }

    // Sort by score
    comparisons.sort((a, b) => b.score.overallScore - a.score.overallScore);

    return {
      comparisons,
      count: comparisons.length,
      criteria
    };
  }
}

module.exports = new MatchingEngine();
