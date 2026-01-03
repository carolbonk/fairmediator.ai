/**
 * Multi-Perspective AI Routes
 * Provides liberal, neutral, and conservative AI mediator perspectives
 */

const express = require('express');
const router = express.Router();
const multiPerspectiveAgents = require('../services/huggingface/multiPerspectiveAgents');
const logger = require('../config/logger');

/**
 * POST /api/perspectives/all
 * Get responses from all three AI perspectives
 *
 * Body:
 * {
 *   "message": "Should I settle this employment dispute?",
 *   "history": [{"role": "user", "content": "..."}]
 * }
 */
router.post('/all', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: message'
      });
    }

    logger.info('Getting multi-perspective responses for:', message.substring(0, 50));

    const perspectives = await multiPerspectiveAgents.getAllPerspectives(message, history);

    return res.json({
      success: true,
      perspectives,
      message: 'Retrieved responses from all three AI perspectives'
    });
  } catch (error) {
    logger.error('Multi-perspective request failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/perspectives/single
 * Get response from a specific perspective
 *
 * Body:
 * {
 *   "perspective": "liberal",  // or "neutral" or "conservative"
 *   "message": "What should I do?",
 *   "history": []
 * }
 */
router.post('/single', async (req, res) => {
  try {
    const { perspective, message, history = [] } = req.body;

    if (!perspective || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: perspective, message'
      });
    }

    const validPerspectives = ['liberal', 'neutral', 'conservative'];
    if (!validPerspectives.includes(perspective)) {
      return res.status(400).json({
        success: false,
        error: `Invalid perspective. Must be one of: ${validPerspectives.join(', ')}`
      });
    }

    logger.info(`Getting ${perspective} perspective for:`, message.substring(0, 50));

    const response = await multiPerspectiveAgents.getResponse(perspective, message, history);

    return res.json({
      success: true,
      perspective: response
    });
  } catch (error) {
    logger.error(`${req.body.perspective} perspective request failed:`, error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/perspectives/compare
 * Get all perspectives and compare them
 *
 * Body:
 * {
 *   "message": "How should this dispute be resolved?",
 *   "history": []
 * }
 */
router.post('/compare', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: message'
      });
    }

    const perspectives = await multiPerspectiveAgents.getAllPerspectives(message, history);

    // Analyze differences and similarities
    const comparison = {
      perspectives: perspectives,
      analysis: {
        commonGround: [],
        keyDifferences: [],
        recommendations: []
      }
    };

    // Note: This is a placeholder for deeper analysis
    // You could use another AI call here to analyze the three perspectives

    return res.json({
      success: true,
      comparison,
      message: 'Retrieved and compared all three perspectives'
    });
  } catch (error) {
    logger.error('Perspective comparison failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/perspectives/info
 * Get information about available perspectives
 */
router.get('/info', async (req, res) => {
  try {
    const perspectives = [
      {
        id: 'liberal',
        name: 'Progressive Mediator AI',
        icon: '🔵',
        description: 'Prioritizes social justice, worker rights, and progressive approaches',
        focus: ['Equity', 'Social justice', 'Progressive solutions', 'Civil liberties']
      },
      {
        id: 'neutral',
        name: 'Balanced Mediator AI',
        icon: '⚪',
        description: 'Strictly neutral, fact-based approach with pragmatic solutions',
        focus: ['Objectivity', 'Facts', 'Balanced view', 'Practical compromise']
      },
      {
        id: 'conservative',
        name: 'Traditional Mediator AI',
        icon: '🔴',
        description: 'Emphasizes legal frameworks, contracts, and traditional methods',
        focus: ['Legal precedent', 'Property rights', 'Personal responsibility', 'Traditional methods']
      }
    ];

    return res.json({
      success: true,
      perspectives,
      message: 'Three AI perspectives available for balanced mediation'
    });
  } catch (error) {
    logger.error('Failed to get perspective info:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
