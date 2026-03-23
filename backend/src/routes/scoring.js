/**
 * Scoring Routes
 * Endpoints for deterministic bias and affiliation scoring
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../utils/responseHandlers');
const {
  extractEntities,
  scoreLeaning,
  scoreAffiliation,
  rankAndSplit
} = require('../services/scoring/deterministicScoring');
const logger = require('../config/logger');

/**
 * POST /api/scoring/extract-entities
 * Extract entities from text using rule-based NER
 * Public (for testing and development)
 */
router.post('/extract-entities', asyncHandler(async (req, res) => {
  const { text, options } = req.body;

  if (!text) {
    return res.status(400).json({
      error: 'Text is required',
      example: { text: 'John Doe works at Smith & Associates LLC and donated to the Democratic Party.' }
    });
  }

  const result = extractEntities(text, options);

  logger.info('Entities extracted', {
    textLength: text.length,
    entitiesFound: result.total
  });

  return res.json(result);
}));

/**
 * GET /api/scoring/leaning/:mediatorId
 * Calculate political leaning score for a mediator
 * Authenticated
 */
router.get('/leaning/:mediatorId', authenticate, asyncHandler(async (req, res) => {
  const { mediatorId } = req.params;
  const {
    includeEvidence = 'true',
    includeDisclaimer = 'true',
    weightByRecency = 'true'
  } = req.query;

  const options = {
    includeEvidence: includeEvidence === 'true',
    includeDisclaimer: includeDisclaimer === 'true',
    weightByRecency: weightByRecency === 'true'
  };

  const result = await scoreLeaning(mediatorId, options);

  logger.info('Leaning score calculated', {
    mediatorId,
    score: result.score,
    confidence: result.confidence,
    signalCount: result.totalSignals
  });

  return res.json(result);
}));

/**
 * POST /api/scoring/leaning/batch
 * Calculate leaning scores for multiple mediators
 * Authenticated, rate-limited
 */
router.post('/leaning/batch', authenticate, asyncHandler(async (req, res) => {
  const { mediatorIds, options } = req.body;

  if (!mediatorIds || !Array.isArray(mediatorIds)) {
    return res.status(400).json({
      error: 'mediatorIds array is required',
      example: { mediatorIds: ['id1', 'id2', 'id3'], options: {} }
    });
  }

  if (mediatorIds.length > 50) {
    return res.status(400).json({
      error: 'Maximum 50 mediators per batch request'
    });
  }

  const results = [];

  for (const mediatorId of mediatorIds) {
    try {
      const result = await scoreLeaning(mediatorId, options || {});
      results.push({
        mediatorId,
        ...result
      });
    } catch (error) {
      results.push({
        mediatorId,
        error: error.message,
        score: 0,
        confidence: 0
      });
    }
  }

  logger.info('Batch leaning scores calculated', {
    totalMediators: mediatorIds.length,
    successful: results.filter(r => !r.error).length
  });

  return res.json({
    total: results.length,
    results,
    timestamp: new Date().toISOString()
  });
}));

/**
 * GET /api/scoring/affiliation/:mediatorId/:firmId
 * Calculate affiliation score and conflict risk
 * Authenticated
 */
router.get('/affiliation/:mediatorId/:firmId', authenticate, asyncHandler(async (req, res) => {
  const { mediatorId, firmId } = req.params;
  const {
    includeEvidence = 'true',
    includeDisclaimer = 'true'
  } = req.query;

  const options = {
    includeEvidence: includeEvidence === 'true',
    includeDisclaimer: includeDisclaimer === 'true'
  };

  const result = await scoreAffiliation(mediatorId, firmId, options);

  logger.info('Affiliation scored', {
    mediatorId,
    firmId,
    confidence: result.confidence,
    conflictRisk: result.conflictRisk
  });

  return res.json(result);
}));

/**
 * POST /api/scoring/rank
 * Rank and split mediators by criteria
 * Authenticated, admin only
 */
router.post('/rank', authenticate, requireRole(['admin']), asyncHandler(async (req, res) => {
  const { mediatorIds, criteria, options } = req.body;

  if (!mediatorIds || !Array.isArray(mediatorIds)) {
    return res.status(400).json({
      error: 'mediatorIds array is required',
      example: {
        mediatorIds: ['id1', 'id2'],
        criteria: {},
        options: { splitBy: 'ideology', maxResults: 100 }
      }
    });
  }

  const result = await rankAndSplit(mediatorIds, criteria || {}, options || {});

  logger.info('Mediators ranked', {
    total: result.total,
    splitBy: result.splitBy,
    high: result.counts?.high,
    medium: result.counts?.medium,
    low: result.counts?.low
  });

  return res.json(result);
}));

/**
 * GET /api/scoring/methodology
 * Get detailed explanation of scoring methodology
 * Public
 */
router.get('/methodology', (req, res) => {
  res.json({
    version: '1.0.0',
    lastUpdated: '2026-02-27',
    methods: {
      entityExtraction: {
        name: 'Rule-Based Named Entity Recognition',
        description: 'Uses regex patterns to identify organizations, people, and political keywords',
        confidence: 'Medium (0.7)',
        limitations: [
          'May miss context-dependent entities',
          'Limited to predefined patterns',
          'Does not handle ambiguity well'
        ],
        disclaimer: 'Entity extraction uses rule-based patterns and may miss some entities or incorrectly classify others. Manual review recommended for accuracy.'
      },
      leaningScore: {
        name: 'Deterministic Weighted Average',
        description: 'Calculates political leaning from -10 (very liberal) to +10 (very conservative) based on weighted signals',
        formula: 'Σ(signal.leaningScore × signal.weight) / Σ(signal.weight)',
        weights: {
          employment: 0.8,
          donation: 0.7,
          membership: 0.6,
          publication: 0.5,
          validation_boost: 1.2,
          recency_decay: '50% after 5 years, 70% after 2 years'
        },
        confidence: 'Based on signal count (max 10), validation rate, and data quality',
        labels: {
          'VERY_LIBERAL': '≤ -5',
          'LIBERAL': '-5 to -2',
          'LEANS_LIBERAL': '-2 to -0.5',
          'NEUTRAL': '-0.5 to 0.5',
          'LEANS_CONSERVATIVE': '0.5 to 2',
          'CONSERVATIVE': '2 to 5',
          'VERY_CONSERVATIVE': '≥ 5'
        },
        disclaimer: 'Political leaning scores are estimates based on available public data (donations, memberships, statements). Scores should not be interpreted as definitive measures of bias. Mediators have the right to opt out of ideology classification. All mediators are presumed to maintain professional impartiality regardless of personal views.'
      },
      affiliationScore: {
        name: 'Deterministic Signal Aggregation',
        description: 'Assesses affiliation strength and conflict risk based on multiple signals',
        confidence: 'Increases with signal count and validation: 0.4 (1 signal), 0.6 (2 signals), up to 0.95 (3+ validated)',
        conflictRisk: {
          formula: 'Base risk (by type) × current multiplier × confidence multiplier',
          baseRiskByType: {
            opposing_counsel: 70,
            client: 60,
            partner: 50,
            current_employer: 40,
            past_employer: 20,
            member: 15,
            other: 10
          },
          multipliers: {
            current: 1.5,
            high_confidence: 1.2
          }
        },
        disclaimer: 'Affiliation assessments are based on publicly available information and may be incomplete. Conflict risk scores are estimates and should not replace professional conflict checking. All parties should conduct independent due diligence.'
      },
      ranking: {
        name: 'Deterministic Ranking',
        description: 'Ranks mediators by ideology, conflict risk, or data quality',
        splitThresholds: {
          ideology: { high: 5, medium: 2, low: 0.5 },
          conflictRisk: { high: 60, medium: 40, low: 20 },
          dataQuality: { high: 80, medium: 50, low: 20 }
        },
        disclaimer: 'Rankings are based on calculated scores from available data. Rankings should be used as guidance only and not as definitive assessments. All mediators maintain professional standards regardless of ranking.'
      }
    },
    ethicalConsiderations: [
      'All scores are estimates based on limited public data',
      'Mediators may opt out of ideology classification',
      'Professional impartiality is presumed regardless of personal views',
      'Scores should inform, not replace, professional judgment',
      'Independent due diligence is always recommended',
      'Data completeness and accuracy vary by mediator'
    ],
    dataPrivacy: [
      'Only publicly available information is used',
      'Mediators can request data removal',
      'No personally identifiable information beyond public records',
      'All sources are cited in evidence arrays'
    ]
  });
});

module.exports = router;
