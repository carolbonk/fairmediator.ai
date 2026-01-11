/**
 * Multi-Perspective AI Routes
 * Provides liberal, neutral, and conservative AI mediator perspectives
 */

const express = require('express');
const router = express.Router();
const multiPerspectiveAgents = require('../services/huggingface/multiPerspectiveAgents');
const { sendSuccess, sendError, sendValidationError, asyncHandler } = require('../utils/responseHandlers');

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
router.post('/all', asyncHandler(async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message) {
    return sendValidationError(res, 'Missing required field: message');
  }

  const perspectives = await multiPerspectiveAgents.getAllPerspectives(message, history);

  sendSuccess(res, {
    perspectives,
    message: 'Retrieved responses from all three AI perspectives'
  });
}));

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
router.post('/single', asyncHandler(async (req, res) => {
  const { perspective, message, history = [] } = req.body;

  if (!perspective || !message) {
    return sendValidationError(res, 'Missing required fields: perspective, message');
  }

  const validPerspectives = ['liberal', 'neutral', 'conservative'];
  if (!validPerspectives.includes(perspective)) {
    return sendValidationError(res, `Invalid perspective. Must be one of: ${validPerspectives.join(', ')}`);
  }

  const response = await multiPerspectiveAgents.getResponse(perspective, message, history);

  sendSuccess(res, { perspective: response });
}));

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
router.post('/compare', asyncHandler(async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message) {
    return sendValidationError(res, 'Missing required field: message');
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

  sendSuccess(res, {
    comparison,
    message: 'Retrieved and compared all three perspectives'
  });
}));

/**
 * GET /api/perspectives/info
 * Get information about available perspectives
 */
router.get('/info', asyncHandler(async (req, res) => {
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

  sendSuccess(res, {
    perspectives,
    message: 'Three AI perspectives available for balanced mediation'
  });
}));

module.exports = router;
