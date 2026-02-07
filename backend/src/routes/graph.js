/**
 * Graph API Routes - Frontend-Compatible Wrappers
 *
 * Simplified conflict detection routes for frontend integration
 * Wraps graph_analyzer conflict routes with batch support
 *
 * @module routes/graph
 */

const express = require('express');
const router = express.Router();
const logger = require('../config/logger');
const { authenticate } = require('../middleware/auth');
const graphService = require('../graph_analyzer/services/graph_service');
const { validateRiskInputs } = require('../graph_analyzer/models/risk_calculator');

/**
 * POST /api/graph/check-conflicts
 * Check conflicts for a single mediator against multiple parties
 *
 * Body: {
 *   mediatorId: string,
 *   parties: string[] - Array of party names
 * }
 */
router.post('/check-conflicts', async (req, res) => {
  try {
    const { mediatorId, parties } = req.body;

    if (!mediatorId || !parties || !Array.isArray(parties)) {
      return res.status(400).json({
        success: false,
        error: 'mediatorId and parties array are required'
      });
    }

    // Analyze conflicts against all parties
    const conflictChecks = await Promise.allSettled(
      parties.map(party =>
        graphService.analyzeConflict(mediatorId, party, { maxDepth: 3 })
      )
    );

    // Aggregate results
    const paths = [];
    let maxRiskScore = 0;
    let riskLevel = 'GREEN';

    conflictChecks.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        const analysis = result.value;

        // Collect conflict paths
        if (analysis.paths && analysis.paths.length > 0) {
          paths.push(...analysis.paths);
        }

        // Track max risk
        if (analysis.riskScore > maxRiskScore) {
          maxRiskScore = analysis.riskScore;
          riskLevel = analysis.riskLevel;
        }
      }
    });

    res.json({
      mediatorId,
      parties,
      riskLevel,
      riskScore: maxRiskScore,
      paths,
      conflictCount: paths.length
    });

  } catch (error) {
    logger.error('[GraphRoutes] Error checking conflicts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check conflicts',
      message: error.message
    });
  }
});

/**
 * POST /api/graph/batch-check-conflicts
 * Check conflicts for multiple mediators against parties
 *
 * Body: {
 *   mediatorIds: string[],
 *   parties: string[]
 * }
 */
router.post('/batch-check-conflicts', async (req, res) => {
  try {
    const { mediatorIds, parties } = req.body;

    if (!mediatorIds || !Array.isArray(mediatorIds) || !parties || !Array.isArray(parties)) {
      return res.status(400).json({
        success: false,
        error: 'mediatorIds and parties arrays are required'
      });
    }

    // Limit batch size
    if (mediatorIds.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Batch size limited to 50 mediators'
      });
    }

    // Check conflicts for each mediator
    const results = {};

    await Promise.allSettled(
      mediatorIds.map(async (mediatorId) => {
        const conflictChecks = await Promise.allSettled(
          parties.map(party =>
            graphService.analyzeConflict(mediatorId, party, { maxDepth: 3 })
          )
        );

        const paths = [];
        let maxRiskScore = 0;
        let riskLevel = 'GREEN';

        conflictChecks.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            const analysis = result.value;

            if (analysis.paths && analysis.paths.length > 0) {
              paths.push(...analysis.paths);
            }

            if (analysis.riskScore > maxRiskScore) {
              maxRiskScore = analysis.riskScore;
              riskLevel = analysis.riskLevel;
            }
          }
        });

        results[mediatorId] = {
          riskLevel,
          riskScore: maxRiskScore,
          paths,
          conflictCount: paths.length
        };
      })
    );

    res.json(results);

  } catch (error) {
    logger.error('[GraphRoutes] Error batch checking conflicts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to batch check conflicts',
      message: error.message
    });
  }
});

/**
 * GET /api/graph/relationships
 * Get relationship paths between two entities
 *
 * Query: entity1, entity2
 */
router.get('/relationships', async (req, res) => {
  try {
    const { entity1, entity2 } = req.query;

    if (!entity1 || !entity2) {
      return res.status(400).json({
        success: false,
        error: 'entity1 and entity2 query parameters are required'
      });
    }

    const paths = await graphService.findPaths(entity1, entity2, { maxDepth: 4 });

    res.json({
      entity1,
      entity2,
      pathCount: paths.length,
      paths
    });

  } catch (error) {
    logger.error('[GraphRoutes] Error finding relationships:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find relationships',
      message: error.message
    });
  }
});

module.exports = router;
