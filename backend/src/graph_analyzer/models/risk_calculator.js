/**
 * Risk Calculator - Computes Conflict Risk Scores
 *
 * Analyzes graph paths between mediators and opposing parties to calculate
 * affiliation risk scores based on relationship strength and type.
 *
 * @module graph_analyzer/models/risk_calculator
 */

const { RISK_WEIGHTS, RISK_THRESHOLDS } = require('./graph_schema');
const logger = require('../../config/logger');

/**
 * Calculate risk score based on relationship paths
 *
 * @param {Array} paths - Array of relationship paths from graph analysis
 * @returns {Object} Risk assessment with score, level, and recommendation
 */
function calculateRiskScore(paths) {
  if (!paths || paths.length === 0) {
    return {
      riskScore: 0,
      riskLevel: 'GREEN',
      recommendation: '✅ CLEAR: No relationships found between mediator and opposing party.',
      totalPaths: 0,
      strongestPath: null
    };
  }

  let maxScore = 0;
  let strongestPath = null;
  const pathScores = [];

  // Calculate score for each path
  for (const path of paths) {
    let pathScore = 0;
    const relationships = path.relationships || [];

    for (const rel of relationships) {
      const weight = RISK_WEIGHTS[rel.type] || 0;
      const confidence = rel.confidence || 1.0;

      // Weight by confidence and relationship recency
      const ageMultiplier = calculateAgeMultiplier(rel.metadata);
      pathScore += weight * confidence * ageMultiplier;
    }

    pathScores.push({
      path,
      score: pathScore
    });

    if (pathScore > maxScore) {
      maxScore = pathScore;
      strongestPath = path;
    }
  }

  // Determine risk level
  const riskLevel = determineRiskLevel(maxScore);
  const recommendation = generateRecommendation(riskLevel, maxScore, strongestPath);

  return {
    riskScore: Math.round(maxScore),
    riskLevel,
    recommendation,
    totalPaths: paths.length,
    strongestPath,
    allPathScores: pathScores.sort((a, b) => b.score - a.score).slice(0, 5) // Top 5 paths
  };
}

/**
 * Calculate age multiplier for relationship recency
 * More recent relationships have higher weight
 *
 * @param {Object} metadata - Relationship metadata with date information
 * @returns {Number} Multiplier between 0.3 and 1.0
 */
function calculateAgeMultiplier(metadata) {
  if (!metadata || !metadata.date) {
    return 1.0; // No date info = assume current
  }

  const relationshipDate = new Date(metadata.date);
  const now = new Date();
  const yearsAgo = (now - relationshipDate) / (1000 * 60 * 60 * 24 * 365);

  if (yearsAgo < 1) return 1.0;      // Within last year = full weight
  if (yearsAgo < 3) return 0.9;      // 1-3 years ago = 90%
  if (yearsAgo < 5) return 0.7;      // 3-5 years ago = 70%
  if (yearsAgo < 10) return 0.5;     // 5-10 years ago = 50%
  return 0.3;                         // 10+ years ago = 30%
}

/**
 * Determine risk level based on score
 *
 * @param {Number} score - Calculated risk score
 * @returns {String} Risk level: 'GREEN', 'YELLOW', or 'RED'
 */
function determineRiskLevel(score) {
  if (score < RISK_THRESHOLDS.GREEN) {
    return 'GREEN';
  } else if (score < RISK_THRESHOLDS.RED) {
    return 'YELLOW';
  } else {
    return 'RED';
  }
}

/**
 * Generate human-readable recommendation
 *
 * @param {String} riskLevel - Risk level (GREEN/YELLOW/RED)
 * @param {Number} score - Risk score
 * @param {Object} strongestPath - Strongest relationship path
 * @returns {String} Recommendation text
 */
function generateRecommendation(riskLevel, score, strongestPath) {
  switch (riskLevel) {
    case 'GREEN':
      return `✅ CLEAR: Risk score of ${Math.round(score)} is below threshold (${RISK_THRESHOLDS.GREEN}). No significant conflicts detected.`;

    case 'YELLOW':
      const yellowDetails = strongestPath
        ? ` Primary concern: ${describeStrongestRelationship(strongestPath)}.`
        : '';
      return `⚠️ CAUTION: Risk score of ${Math.round(score)} indicates potential conflicts.${yellowDetails} Consider additional due diligence.`;

    case 'RED':
      const redDetails = strongestPath
        ? ` Critical issue: ${describeStrongestRelationship(strongestPath)}.`
        : '';
      return `🚨 HIGH RISK: Risk score of ${Math.round(score)} indicates significant conflicts.${redDetails} Strong recommendation to select different mediator.`;

    default:
      return `Risk score: ${Math.round(score)}`;
  }
}

/**
 * Describe the strongest relationship in a path
 *
 * @param {Object} path - Path object with relationships
 * @returns {String} Human-readable description
 */
function describeStrongestRelationship(path) {
  if (!path || !path.relationships || path.relationships.length === 0) {
    return 'Unknown relationship';
  }

  // Find highest-weighted relationship in path
  const strongest = path.relationships.reduce((max, rel) => {
    const weight = RISK_WEIGHTS[rel.type] || 0;
    return weight > (RISK_WEIGHTS[max.type] || 0) ? rel : max;
  }, path.relationships[0]);

  const descriptions = {
    WORKED_AT: 'mediator previously worked at opposing firm',
    SHARED_CASE: 'mediator collaborated with opposing counsel on past cases',
    CO_AUTHORED: 'mediator co-authored publications with opposing party',
    DONATED_TO: 'mediator and opposing counsel donated to same political candidates',
    ATTENDED_TOGETHER: 'mediator attended conferences with opposing party',
    OPPOSING_COUNSEL: 'mediator previously opposed this party in litigation'
  };

  const baseDescription = descriptions[strongest.type] || 'relationship detected';

  // Add metadata details if available
  if (strongest.metadata) {
    if (strongest.type === 'SHARED_CASE' && strongest.metadata.caseNumber) {
      return `${baseDescription} (Case: ${strongest.metadata.caseNumber})`;
    }
    if (strongest.type === 'WORKED_AT' && strongest.metadata.role) {
      return `${baseDescription} as ${strongest.metadata.role}`;
    }
    if (strongest.type === 'DONATED_TO' && strongest.metadata.candidate) {
      return `${baseDescription}: ${strongest.metadata.candidate}`;
    }
  }

  return baseDescription;
}

/**
 * Calculate aggregate risk across multiple opposing parties
 * Useful when checking conflicts for multiple parties at once
 *
 * @param {Array} individualRisks - Array of individual risk assessments
 * @returns {Object} Aggregated risk assessment
 */
function calculateAggregateRisk(individualRisks) {
  if (!individualRisks || individualRisks.length === 0) {
    return {
      overallRiskLevel: 'GREEN',
      maxRiskScore: 0,
      flaggedParties: [],
      recommendation: 'No conflicts detected across all parties.'
    };
  }

  const maxRisk = individualRisks.reduce((max, risk) => {
    return risk.riskScore > max.riskScore ? risk : max;
  }, individualRisks[0]);

  const flaggedParties = individualRisks.filter(risk =>
    risk.riskLevel === 'YELLOW' || risk.riskLevel === 'RED'
  );

  return {
    overallRiskLevel: maxRisk.riskLevel,
    maxRiskScore: maxRisk.riskScore,
    flaggedParties: flaggedParties.length,
    highestRiskParty: maxRisk.opposingEntity,
    recommendation: flaggedParties.length === 0
      ? '✅ CLEAR: No conflicts detected across all parties.'
      : `⚠️ CONFLICTS DETECTED: ${flaggedParties.length} partie(s) flagged. Highest risk: ${maxRisk.riskLevel} (${maxRisk.riskScore} points).`
  };
}

/**
 * Validate risk calculation inputs
 *
 * @param {Object} params - Parameters for risk calculation
 * @returns {Object} Validation result
 */
function validateRiskInputs(params) {
  const errors = [];

  if (!params.mediatorId) {
    errors.push('Mediator ID is required');
  }

  if (!params.opposingPartyId) {
    errors.push('Opposing party ID is required');
  }

  if (params.mediatorId === params.opposingPartyId) {
    errors.push('Mediator and opposing party cannot be the same entity');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  calculateRiskScore,
  calculateAgeMultiplier,
  determineRiskLevel,
  generateRecommendation,
  describeStrongestRelationship,
  calculateAggregateRisk,
  validateRiskInputs
};
