const express = require('express');
const router = express.Router();
const matchingEngine = require('../services/matching/matchingEngine');
const swotGenerator = require('../services/matching/swotGenerator');
const Mediator = require('../models/Mediator');
const { authenticate, optionalAuth } = require('../middleware/auth');

/**
 * POST /api/matching/search
 * Search and rank mediators based on criteria
 */
router.post('/search', optionalAuth, async (req, res) => {
  try {
    const { criteria, options } = req.body;

    if (!criteria) {
      return res.status(400).json({ error: 'Search criteria required' });
    }

    const results = await matchingEngine.findMatchingMediators(criteria, options);

    res.json({
      success: true,
      data: {
        matches: results,
        count: results.length,
        criteria
      }
    });
  } catch (error) {
    console.error('Matching error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/matching/score
 * Calculate match score for a specific mediator
 */
router.post('/score', authenticate, async (req, res) => {
  try {
    const { mediatorId, criteria, weights } = req.body;

    if (!mediatorId || !criteria) {
      return res.status(400).json({
        error: 'mediatorId and criteria are required'
      });
    }

    const mediator = await Mediator.findById(mediatorId);
    
    if (!mediator) {
      return res.status(404).json({ error: 'Mediator not found' });
    }

    const score = await matchingEngine.calculateOverallScore(mediator, criteria, weights);

    res.json({
      success: true,
      data: score
    });
  } catch (error) {
    console.error('Scoring error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/matching/compare
 * Compare multiple mediators side-by-side
 */
router.post('/compare', authenticate, async (req, res) => {
  try {
    const { mediatorIds, criteria } = req.body;

    if (!mediatorIds || !Array.isArray(mediatorIds) || mediatorIds.length === 0) {
      return res.status(400).json({
        error: 'mediatorIds array is required'
      });
    }

    if (!criteria) {
      return res.status(400).json({ error: 'criteria is required' });
    }

    const comparison = await matchingEngine.compareMediators(mediatorIds, criteria);

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('Comparison error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/matching/recommend
 * Get personalized mediator recommendations
 */
router.post('/recommend', authenticate, async (req, res) => {
  try {
    const { criteria } = req.body;
    const userId = req.user._id;

    if (!criteria) {
      return res.status(400).json({ error: 'criteria is required' });
    }

    const recommendations = await matchingEngine.getRecommendations(userId, criteria);

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/matching/swot
 * Generate SWOT analysis for a mediator
 */
router.post('/swot', authenticate, async (req, res) => {
  try {
    const { mediatorId, contextData } = req.body;

    if (!mediatorId) {
      return res.status(400).json({ error: 'mediatorId is required' });
    }

    const swot = await swotGenerator.generateSwot(mediatorId, contextData || {});

    res.json({
      success: true,
      data: swot
    });
  } catch (error) {
    console.error('SWOT generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/matching/swot/compare
 * Compare SWOT analysis for multiple mediators
 */
router.post('/swot/compare', authenticate, async (req, res) => {
  try {
    const { mediatorIds, contextData } = req.body;

    if (!mediatorIds || !Array.isArray(mediatorIds)) {
      return res.status(400).json({
        error: 'mediatorIds array is required'
      });
    }

    const comparison = await swotGenerator.compareSwot(mediatorIds, contextData || {});

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('SWOT comparison error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/matching/swot/:mediatorId/export
 * Export SWOT analysis as markdown or JSON
 */
router.get('/swot/:mediatorId/export', authenticate, async (req, res) => {
  try {
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
      res.json({
        success: true,
        data: json
      });
    }
  } catch (error) {
    console.error('SWOT export error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
