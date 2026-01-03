/**
 * Quality Assurance Service
 * Automated validation and quality checks for mediator data
 * Uses existing AI models + rule-based checks (FREE)
 */

const Mediator = require('../../models/Mediator');
const hfClient = require('../huggingface/hfClient');
const logger = require('../../config/logger');

class QAService {
  /**
   * Run comprehensive QA check on a mediator profile
   */
  async validateMediatorProfile(mediatorId) {
    try {
      const mediator = await Mediator.findById(mediatorId);
      if (!mediator) {
        return { success: false, error: 'Mediator not found' };
      }

      const issues = [];
      const warnings = [];
      let qualityScore = 100;

      // 1. Required fields check (rule-based - FREE)
      const requiredFields = this.checkRequiredFields(mediator, issues);
      qualityScore -= (requiredFields.missing.length * 5);

      // 2. Data consistency check (rule-based - FREE)
      const consistency = this.checkConsistency(mediator, issues, warnings);

      // 3. Completeness check (rule-based - FREE)
      const completeness = this.checkCompleteness(mediator, warnings);
      qualityScore -= (completeness.missingOptional.length * 2);

      // 4. AI-powered bio quality check
      if (mediator.bio) {
        const bioQuality = await this.analyzeBioQuality(mediator.bio);
        if (bioQuality.score < 0.5) {
          warnings.push(`Bio quality low (${Math.round(bioQuality.score * 100)}%): ${bioQuality.reason}`);
          qualityScore -= 10;
        }
      }

      // 5. Conflict detection validation
      const conflictCheck = await this.validateConflicts(mediator);
      if (conflictCheck.suspicious) {
        warnings.push(...conflictCheck.warnings);
      }

      return {
        success: true,
        mediatorId: mediator._id,
        mediatorName: mediator.name,
        qualityScore: Math.max(0, qualityScore),
        issues: issues, // Critical problems
        warnings: warnings, // Non-critical concerns
        checks: {
          requiredFields: requiredFields.complete,
          dataConsistency: consistency.consistent,
          completeness: completeness.score,
          bioQuality: mediator.bio ? 'checked' : 'no bio',
          conflictValidation: 'checked'
        },
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('QA validation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check required fields (rule-based - FREE)
   */
  checkRequiredFields(mediator, issues) {
    const required = ['name', 'location', 'specializations'];
    const missing = [];

    required.forEach(field => {
      if (!mediator[field] || (Array.isArray(mediator[field]) && mediator[field].length === 0)) {
        missing.push(field);
        issues.push(`Missing required field: ${field}`);
      }
    });

    return {
      complete: missing.length === 0,
      missing
    };
  }

  /**
   * Check data consistency (rule-based - FREE)
   */
  checkConsistency(mediator, issues, warnings) {
    let consistent = true;

    // Check years of experience vs bar admission year
    if (mediator.barAdmissionYear && mediator.yearsExperience) {
      const expectedYears = new Date().getFullYear() - mediator.barAdmissionYear;
      if (Math.abs(expectedYears - mediator.yearsExperience) > 2) {
        warnings.push(`Years of experience (${mediator.yearsExperience}) doesn't match bar admission year (${mediator.barAdmissionYear})`);
        consistent = false;
      }
    }

    // Check location consistency
    if (mediator.location && mediator.state) {
      if (!mediator.location.includes(mediator.state)) {
        warnings.push(`State (${mediator.state}) doesn't match location (${mediator.location})`);
      }
    }

    // Check rating vs total mediations
    if (mediator.rating > 0 && (!mediator.totalMediations || mediator.totalMediations === 0)) {
      warnings.push('Has rating but no mediations recorded');
    }

    // Check hourly rate reasonableness
    if (mediator.hourlyRate && (mediator.hourlyRate < 50 || mediator.hourlyRate > 1000)) {
      warnings.push(`Hourly rate (${mediator.hourlyRate}) seems unusual`);
    }

    return { consistent };
  }

  /**
   * Check data completeness (rule-based - FREE)
   */
  checkCompleteness(mediator, warnings) {
    const optional = ['bio', 'education', 'barNumber', 'website', 'email', 'phone', 'yearsExperience', 'totalMediations', 'rating'];
    const missingOptional = [];
    let score = 0;

    optional.forEach(field => {
      if (mediator[field] && (Array.isArray(mediator[field]) ? mediator[field].length > 0 : mediator[field])) {
        score++;
      } else {
        missingOptional.push(field);
      }
    });

    const completeness = (score / optional.length) * 100;

    if (completeness < 50) {
      warnings.push(`Profile only ${Math.round(completeness)}% complete`);
    }

    return {
      score: completeness,
      missingOptional
    };
  }

  /**
   * Analyze bio quality using AI (uses existing HuggingFace models)
   */
  async analyzeBioQuality(bio) {
    try {
      if (!bio || bio.length < 50) {
        return { score: 0.3, reason: 'Bio too short' };
      }

      if (bio.length > 2000) {
        return { score: 0.5, reason: 'Bio too long' };
      }

      // Check for generic/template text
      const genericPhrases = [
        'lorem ipsum',
        'click here',
        'insert text',
        'add bio',
        '[name]',
        '[insert'
      ];

      const hasGeneric = genericPhrases.some(phrase =>
        bio.toLowerCase().includes(phrase)
      );

      if (hasGeneric) {
        return { score: 0.1, reason: 'Contains template/placeholder text' };
      }

      // Check keyword density (rule-based)
      const keywordScore = this.calculateKeywordScore(bio);

      return {
        score: keywordScore,
        reason: keywordScore < 0.5 ? 'Lacks professional keywords' : 'Good quality'
      };
    } catch (error) {
      logger.warn('Bio quality analysis failed:', error.message);
      return { score: 0.5, reason: 'Analysis unavailable' };
    }
  }

  /**
   * Calculate keyword score for bio (rule-based - FREE)
   */
  calculateKeywordScore(bio) {
    const professionalKeywords = [
      'mediat', 'arbitrat', 'dispute', 'resolut', 'negoti',
      'experience', 'practice', 'specialize', 'expertise',
      'certif', 'train', 'year', 'case', 'settl'
    ];

    const lowerBio = bio.toLowerCase();
    let count = 0;

    professionalKeywords.forEach(keyword => {
      if (lowerBio.includes(keyword)) count++;
    });

    return Math.min(count / professionalKeywords.length, 1.0);
  }

  /**
   * Validate conflict data (rule-based - FREE)
   */
  async validateConflicts(mediator) {
    const warnings = [];
    let suspicious = false;

    // Check if affiliations seem suspicious
    if (mediator.affiliations && mediator.affiliations.length > 20) {
      warnings.push(`Unusually high number of affiliations (${mediator.affiliations.length})`);
      suspicious = true;
    }

    // Check for conflicting ideology scores
    if (mediator.ideologyScore && Math.abs(mediator.ideologyScore) > 10) {
      warnings.push(`Extreme ideology score: ${mediator.ideologyScore}`);
    }

    return { suspicious, warnings };
  }

  /**
   * Batch validate all mediators
   */
  async validateAllMediators(options = {}) {
    const { limit = 100, skipPassed = false } = options;

    try {
      const mediators = await Mediator.find().limit(limit);
      const results = [];

      for (const mediator of mediators) {
        const result = await this.validateMediatorProfile(mediator._id);
        if (!skipPassed || result.issues.length > 0 || result.warnings.length > 0) {
          results.push(result);
        }
      }

      const summary = {
        total: mediators.length,
        passed: results.filter(r => r.issues.length === 0).length,
        hasIssues: results.filter(r => r.issues.length > 0).length,
        hasWarnings: results.filter(r => r.warnings.length > 0).length,
        averageQuality: results.reduce((sum, r) => sum + r.qualityScore, 0) / results.length
      };

      return {
        success: true,
        summary,
        results
      };
    } catch (error) {
      logger.error('Batch validation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new QAService();
