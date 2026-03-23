/**
 * Deterministic Scoring Pipeline
 * Transparent, rule-based scoring for mediator bias and affiliation assessment
 * All scores include evidence arrays and explicit disclaimers
 */

const logger = require('../../config/logger');
const Signal = require('../../models/Signal');
const AffiliationAssessment = require('../../models/AffiliationAssessment');
const Firm = require('../../models/Firm');

/**
 * Extract entities from text using rule-based NER
 * Returns structured entity list with types and confidence scores
 */
const extractEntities = (text, options = {}) => {
  const {
    includePositions = false,
    minConfidence = 0.3
  } = options;

  const entities = [];

  if (!text || typeof text !== 'string') {
    return {
      entities: [],
      disclaimer: 'No text provided for entity extraction',
      method: 'rule_based_ner',
      confidence: 0
    };
  }

  // Organization patterns
  const orgPatterns = [
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:LLC|LLP|Inc\.|Corp\.|Corporation|Company|Association|Society|Foundation|Institute))/g,
    /\b((?:The\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Law\s+)?Firm)/g,
    /\b([A-Z][A-Z]+)\b/g // Acronyms (e.g., ACLU, ABA)
  ];

  orgPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        text: match[1],
        type: 'organization',
        start: includePositions ? match.index : undefined,
        end: includePositions ? match.index + match[1].length : undefined,
        confidence: 0.7,
        method: 'regex_pattern'
      });
    }
  });

  // Person names (simplified - Title + Name pattern)
  const personPattern = /\b((?:Mr\.|Ms\.|Mrs\.|Dr\.|Prof\.)\s+[A-Z][a-z]+\s+[A-Z][a-z]+)/g;
  let match;
  while ((match = personPattern.exec(text)) !== null) {
    entities.push({
      text: match[1],
      type: 'person',
      start: includePositions ? match.index : undefined,
      end: includePositions ? match.index + match[1].length : undefined,
      confidence: 0.6,
      method: 'regex_pattern'
    });
  }

  // Political keywords
  const politicalKeywords = {
    democrat: ['Democratic Party', 'DNC', 'liberal', 'progressive'],
    republican: ['Republican Party', 'RNC', 'GOP', 'conservative'],
    general: ['donation', 'contribution', 'PAC', 'Super PAC', 'campaign']
  };

  Object.entries(politicalKeywords).forEach(([category, keywords]) => {
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      while ((match = regex.exec(text)) !== null) {
        entities.push({
          text: match[0],
          type: 'political_keyword',
          category,
          start: includePositions ? match.index : undefined,
          end: includePositions ? match.index + match[0].length : undefined,
          confidence: 0.8,
          method: 'keyword_match'
        });
      }
    });
  });

  // Filter by confidence and deduplicate
  const filtered = entities
    .filter(e => e.confidence >= minConfidence)
    .reduce((acc, entity) => {
      const exists = acc.find(e =>
        e.text.toLowerCase() === entity.text.toLowerCase() &&
        e.type === entity.type
      );
      if (!exists) {
        acc.push(entity);
      }
      return acc;
    }, []);

  return {
    entities: filtered,
    total: filtered.length,
    byType: filtered.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {}),
    method: 'rule_based_ner',
    disclaimer: 'Entity extraction uses rule-based patterns and may miss some entities or incorrectly classify others. Manual review recommended for accuracy.',
    confidence: filtered.length > 0 ? 0.7 : 0.3
  };
};

/**
 * Score political leaning based on signals and evidence
 * Returns score from -10 (very liberal) to +10 (very conservative)
 */
const scoreLeaning = async (mediatorId, options = {}) => {
  const {
    includeEvidence = true,
    includeDisclaimer = true,
    weightByRecency = true
  } = options;

  try {
    // Get all active signals for this mediator
    const signals = await Signal.find({
      mediatorId,
      isActive: true,
      validationStatus: { $ne: 'invalidated' }
    });

    if (signals.length === 0) {
      return {
        score: 0,
        confidence: 0,
        label: 'INSUFFICIENT_DATA',
        evidence: [],
        disclaimer: 'No political activity data available. Score of 0 does not indicate neutrality, only lack of data.',
        method: 'deterministic_weighted_average',
        totalSignals: 0
      };
    }

    let totalWeightedScore = 0;
    let totalWeight = 0;
    const evidence = [];

    signals.forEach(signal => {
      // Calculate weight with recency decay if enabled
      let weight = signal.influenceWeight || 0.5;

      if (weightByRecency && signal.dateEnd) {
        const yearsAgo = (new Date() - new Date(signal.dateEnd)) / (1000 * 60 * 60 * 24 * 365);
        if (yearsAgo > 5) {
          weight *= 0.5;
        } else if (yearsAgo > 2) {
          weight *= 0.7;
        }
      }

      // Boost validated signals
      if (signal.validationStatus === 'validated') {
        weight *= 1.2;
      }

      totalWeightedScore += signal.leaningScore * weight;
      totalWeight += weight;

      if (includeEvidence) {
        evidence.push({
          type: signal.signalType,
          entity: signal.entity,
          leaningScore: signal.leaningScore,
          weight: Math.round(weight * 100) / 100,
          source: signal.source,
          date: signal.dateStart || signal.createdAt,
          validated: signal.validationStatus === 'validated'
        });
      }
    });

    const averageScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    const normalizedScore = Math.max(-10, Math.min(10, averageScore));

    // Determine label
    let label = 'NEUTRAL';
    if (normalizedScore <= -5) label = 'VERY_LIBERAL';
    else if (normalizedScore <= -2) label = 'LIBERAL';
    else if (normalizedScore < -0.5) label = 'LEANS_LIBERAL';
    else if (normalizedScore > 5) label = 'VERY_CONSERVATIVE';
    else if (normalizedScore >= 2) label = 'CONSERVATIVE';
    else if (normalizedScore > 0.5) label = 'LEANS_CONSERVATIVE';

    // Calculate confidence based on number and quality of signals
    const validatedCount = signals.filter(s => s.validationStatus === 'validated').length;
    const validationRate = validatedCount / signals.length;

    let confidence = Math.min(
      0.3 + // Base confidence
      (Math.min(signals.length, 10) / 10) * 0.4 + // Up to 0.4 for signal count
      validationRate * 0.3, // Up to 0.3 for validation rate
      0.95 // Cap at 95%
    );

    return {
      score: Math.round(normalizedScore * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      label,
      evidence: includeEvidence ? evidence.sort((a, b) => Math.abs(b.leaningScore) - Math.abs(a.leaningScore)) : undefined,
      totalSignals: signals.length,
      validatedSignals: validatedCount,
      method: 'deterministic_weighted_average',
      disclaimer: includeDisclaimer ?
        'Political leaning scores are estimates based on available public data (donations, memberships, statements). ' +
        'Scores should not be interpreted as definitive measures of bias. ' +
        'Mediators have the right to opt out of ideology classification. ' +
        'All mediators are presumed to maintain professional impartiality regardless of personal views.' :
        undefined
    };
  } catch (error) {
    logger.error('Error calculating leaning score', {
      mediatorId,
      error: error.message
    });

    return {
      score: 0,
      confidence: 0,
      label: 'ERROR',
      error: error.message,
      disclaimer: 'Error calculating political leaning score. Please contact support.'
    };
  }
};

/**
 * Score affiliation strength and conflict risk
 * Returns affiliation score and conflict risk assessment
 */
const scoreAffiliation = async (mediatorId, firmId, options = {}) => {
  const {
    includeEvidence = true,
    includeDisclaimer = true
  } = options;

  try {
    // Check if assessment already exists
    let assessment = await AffiliationAssessment.findOne({
      mediatorId,
      firmId,
      isActive: true
    }).populate('supportingSignals');

    // Get firm details
    const firm = await Firm.findById(firmId);

    if (!firm) {
      return {
        error: 'Firm not found',
        confidence: 0,
        disclaimer: 'Cannot score affiliation for non-existent firm'
      };
    }

    // Get supporting signals
    const signals = await Signal.find({
      mediatorId,
      entity: { $in: [firm.name, ...firm.aliases] },
      isActive: true,
      validationStatus: { $ne: 'invalidated' }
    });

    // Calculate confidence based on signals
    let confidence = 0;

    if (signals.length === 0) {
      confidence = 0.1; // Very low confidence with no signals
    } else if (signals.length === 1) {
      confidence = 0.4; // Single source
    } else if (signals.length === 2) {
      confidence = 0.6; // Two sources
    } else {
      confidence = Math.min(0.4 + signals.length * 0.15, 0.95); // Multiple sources
    }

    // Boost if any signals are validated
    const validatedCount = signals.filter(s => s.validationStatus === 'validated').length;
    if (validatedCount > 0) {
      confidence = Math.min(confidence + 0.1 * validatedCount, 0.95);
    }

    // Determine affiliation type from signals
    let affiliationType = 'other';
    let isCurrent = false;

    const employmentSignals = signals.filter(s => s.signalType === 'EMPLOYMENT');
    if (employmentSignals.length > 0) {
      affiliationType = 'current_employer';
      isCurrent = employmentSignals.some(s => s.isCurrent);
      if (!isCurrent) {
        affiliationType = 'past_employer';
      }
    }

    const membershipSignals = signals.filter(s => s.signalType === 'MEMBERSHIP');
    if (membershipSignals.length > 0 && affiliationType === 'other') {
      affiliationType = 'member';
      isCurrent = membershipSignals.some(s => s.isCurrent);
    }

    // Calculate influence score (how much this affects bias)
    let influenceScore = 0;

    signals.forEach(signal => {
      influenceScore += signal.influenceWeight || 0.5;
    });
    influenceScore = Math.min(influenceScore / signals.length, 1.0);

    // Calculate conflict risk
    let conflictRisk = 0;

    const riskByType = {
      current_employer: 40,
      past_employer: 20,
      partner: 50,
      member: 15,
      client: 60,
      opposing_counsel: 70,
      other: 10
    };

    conflictRisk = riskByType[affiliationType] || 10;

    if (isCurrent) {
      conflictRisk *= 1.5;
    }

    if (confidence > 0.8) {
      conflictRisk *= 1.2;
    }

    conflictRisk = Math.min(Math.round(conflictRisk), 100);

    // Prepare evidence
    const evidence = includeEvidence ? signals.map(s => ({
      signalType: s.signalType,
      relationship: s.relationship,
      source: s.source,
      date: s.dateStart || s.createdAt,
      isCurrent: s.isCurrent,
      validated: s.validationStatus === 'validated',
      description: s.description
    })) : undefined;

    return {
      firmName: firm.name,
      affiliationType,
      isCurrent,
      confidence: Math.round(confidence * 100) / 100,
      influenceScore: Math.round(influenceScore * 100) / 100,
      conflictRisk,
      riskLabel: conflictRisk >= 60 ? 'HIGH' : conflictRisk >= 40 ? 'MEDIUM' : conflictRisk >= 20 ? 'LOW' : 'MINIMAL',
      evidence,
      totalSignals: signals.length,
      validatedSignals: validatedCount,
      method: 'deterministic_signal_aggregation',
      disclaimer: includeDisclaimer ?
        'Affiliation assessments are based on publicly available information and may be incomplete. ' +
        'Conflict risk scores are estimates and should not replace professional conflict checking. ' +
        'All parties should conduct independent due diligence.' :
        undefined
    };
  } catch (error) {
    logger.error('Error scoring affiliation', {
      mediatorId,
      firmId,
      error: error.message
    });

    return {
      error: error.message,
      confidence: 0,
      disclaimer: 'Error calculating affiliation score. Please contact support.'
    };
  }
};

/**
 * Rank and split mediators by criteria
 * Returns ranked lists with transparent scoring methodology
 */
const rankAndSplit = async (mediatorIds, criteria = {}, options = {}) => {
  const {
    splitBy = 'ideology', // 'ideology', 'conflictRisk', 'dataQuality'
    splitThresholds = null,
    includeScores = true,
    includeEvidence = false,
    maxResults = 100
  } = options;

  try {
    const Mediator = require('../../models/Mediator');

    const mediators = await Mediator.find({
      _id: { $in: mediatorIds },
      isActive: true
    }).limit(maxResults);

    const scoredMediators = [];

    for (const mediator of mediators) {
      let score = 0;
      let metadata = {};

      if (splitBy === 'ideology') {
        const leaningResult = await scoreLeaning(mediator._id, { includeEvidence });
        score = Math.abs(leaningResult.score); // Absolute value for ranking
        metadata = {
          ideologyScore: leaningResult.score,
          ideologyLabel: leaningResult.label,
          confidence: leaningResult.confidence,
          signalCount: leaningResult.totalSignals
        };
      } else if (splitBy === 'conflictRisk') {
        const assessments = await AffiliationAssessment.find({
          mediatorId: mediator._id,
          isActive: true
        });

        const maxRisk = Math.max(...assessments.map(a => a.conflictRiskScore), 0);
        score = maxRisk;
        metadata = {
          maxConflictRisk: maxRisk,
          totalAffiliations: assessments.length,
          highRiskCount: assessments.filter(a => a.conflictRiskScore >= 60).length
        };
      } else if (splitBy === 'dataQuality') {
        score = mediator.dataQuality?.completeness || 0;
        metadata = {
          completeness: score,
          verified: mediator.dataQuality?.verified || false
        };
      }

      scoredMediators.push({
        mediatorId: mediator._id,
        name: mediator.name,
        score,
        metadata: includeScores ? metadata : undefined
      });
    }

    // Sort by score (descending)
    scoredMediators.sort((a, b) => b.score - a.score);

    // Split into categories
    const defaultThresholds = {
      ideology: { high: 5, medium: 2, low: 0.5 },
      conflictRisk: { high: 60, medium: 40, low: 20 },
      dataQuality: { high: 80, medium: 50, low: 20 }
    };

    const thresholds = splitThresholds || defaultThresholds[splitBy];

    const split = {
      high: scoredMediators.filter(m => m.score >= thresholds.high),
      medium: scoredMediators.filter(m => m.score >= thresholds.medium && m.score < thresholds.high),
      low: scoredMediators.filter(m => m.score >= thresholds.low && m.score < thresholds.medium),
      minimal: scoredMediators.filter(m => m.score < thresholds.low)
    };

    return {
      total: scoredMediators.length,
      splitBy,
      thresholds,
      ranked: scoredMediators,
      split,
      counts: {
        high: split.high.length,
        medium: split.medium.length,
        low: split.low.length,
        minimal: split.minimal.length
      },
      method: 'deterministic_ranking',
      disclaimer: `Rankings are based on ${splitBy} scores calculated from available data. ` +
        'Rankings should be used as guidance only and not as definitive assessments. ' +
        'All mediators maintain professional standards regardless of ranking.'
    };
  } catch (error) {
    logger.error('Error ranking mediators', {
      criteria,
      error: error.message
    });

    return {
      error: error.message,
      total: 0,
      disclaimer: 'Error ranking mediators. Please contact support.'
    };
  }
};

module.exports = {
  extractEntities,
  scoreLeaning,
  scoreAffiliation,
  rankAndSplit
};
