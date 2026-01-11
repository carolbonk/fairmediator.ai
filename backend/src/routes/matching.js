const express = require('express');
const router = express.Router();
const matchingEngine = require('../services/matching/matchingEngine');
const swotGenerator = require('../services/matching/swotGenerator');
const Mediator = require('../models/Mediator');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { sendSuccess, sendError, sendValidationError, sendNotFound, asyncHandler } = require('../utils/responseHandlers');

/**
 * POST /api/matching/search
 * Search and rank mediators based on criteria
 */
router.post('/search', optionalAuth, asyncHandler(async (req, res) => {
  const { criteria, options } = req.body;

  if (!criteria) {
    return sendValidationError(res, 'Search criteria required');
  }

  const results = await matchingEngine.findMatchingMediators(criteria, options);

  sendSuccess(res, {
    matches: results,
    count: results.length,
    criteria
  });
}));

/**
 * POST /api/matching/score
 * Calculate match score for a specific mediator
 */
router.post('/score', authenticate, asyncHandler(async (req, res) => {
  const { mediatorId, criteria, weights } = req.body;

  if (!mediatorId || !criteria) {
    return sendValidationError(res, 'mediatorId and criteria are required');
  }

  const mediator = await Mediator.findById(mediatorId);

  if (!mediator) {
    return sendNotFound(res, 'Mediator');
  }

  const score = await matchingEngine.calculateOverallScore(mediator, criteria, weights);

  sendSuccess(res, score);
}));

/**
 * POST /api/matching/compare
 * Compare multiple mediators side-by-side
 */
router.post('/compare', authenticate, asyncHandler(async (req, res) => {
  const { mediatorIds, criteria } = req.body;

  if (!mediatorIds || !Array.isArray(mediatorIds) || mediatorIds.length === 0) {
    return sendValidationError(res, 'mediatorIds array is required');
  }

  if (!criteria) {
    return sendValidationError(res, 'criteria is required');
  }

  const comparison = await matchingEngine.compareMediators(mediatorIds, criteria);

  sendSuccess(res, comparison);
}));

/**
 * POST /api/matching/recommend
 * Get personalized mediator recommendations
 */
router.post('/recommend', authenticate, asyncHandler(async (req, res) => {
  const { criteria } = req.body;
  const userId = req.user._id;

  if (!criteria) {
    return sendValidationError(res, 'criteria is required');
  }

  const recommendations = await matchingEngine.getRecommendations(userId, criteria);

  sendSuccess(res, recommendations);
}));

/**
 * POST /api/matching/swot
 * Generate SWOT analysis for a mediator
 */
router.post('/swot', authenticate, asyncHandler(async (req, res) => {
  const { mediatorId, contextData } = req.body;

  if (!mediatorId) {
    return sendValidationError(res, 'mediatorId is required');
  }

  const swot = await swotGenerator.generateSwot(mediatorId, contextData || {});

  sendSuccess(res, swot);
}));

/**
 * POST /api/matching/swot/compare
 * Compare SWOT analysis for multiple mediators
 */
router.post('/swot/compare', authenticate, asyncHandler(async (req, res) => {
  const { mediatorIds, contextData } = req.body;

  if (!mediatorIds || !Array.isArray(mediatorIds)) {
    return sendValidationError(res, 'mediatorIds array is required');
  }

  const comparison = await swotGenerator.compareSwot(mediatorIds, contextData || {});

  sendSuccess(res, comparison);
}));

/**
 * GET /api/matching/swot/:mediatorId/export
 * Export SWOT analysis as markdown or JSON
 */
router.get('/swot/:mediatorId/export', authenticate, asyncHandler(async (req, res) => {
  const { mediatorId } = req.params;
  const { format = 'json' } = req.query;

  const swot = await swotGenerator.generateSwot(mediatorId);

  if (format === 'markdown') {
    const markdown = swotGenerator.exportAsMarkdown(swot);
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="swot_${mediatorId}.md"`);
    res.send(markdown);
  } else {
    const json = swotGenerator.exportAsJson(swot);
    sendSuccess(res, json);
  }
}));

module.exports = router;
