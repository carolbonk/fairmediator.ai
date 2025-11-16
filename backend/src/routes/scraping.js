const express = require('express');
const router = express.Router();
const mediatorScraper = require('../services/scraping/mediatorScraper');
const affiliationDetector = require('../services/scraping/affiliationDetector');
const Mediator = require('../models/Mediator');
const { authenticate, requireTier } = require('../middleware/auth');

/**
 * POST /api/scraping/scrape-profile
 * Manually scrape a single mediator profile
 * Admin only
 */
router.post('/scrape-profile', authenticate, requireTier('admin'), async (req, res) => {
  try {
    const { url, sourceType, useDynamic } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const mediator = await mediatorScraper.scrapeMediatorProfile(
      url,
      sourceType || 'manual',
      useDynamic || false
    );

    res.json({
      success: true,
      message: 'Mediator profile scraped successfully',
      data: mediator
    });
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/scraping/analyze-mediator
 * Analyze mediator for affiliations and bias
 */
router.post('/analyze-mediator', authenticate, async (req, res) => {
  try {
    const { mediatorId } = req.body;

    if (!mediatorId) {
      return res.status(400).json({ error: 'mediatorId is required' });
    }

    const analysis = await affiliationDetector.analyzeMediatorProfile(mediatorId);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/scraping/check-conflicts
 * Check for conflicts between mediator and parties
 */
router.post('/check-conflicts', authenticate, async (req, res) => {
  try {
    const { mediatorId, parties } = req.body;

    if (!mediatorId || !parties || !Array.isArray(parties)) {
      return res.status(400).json({
        error: 'mediatorId and parties (array) are required'
      });
    }

    const conflicts = await affiliationDetector.checkConflicts(mediatorId, parties);

    res.json({
      success: true,
      data: conflicts
    });
  } catch (error) {
    console.error('Conflict check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/scraping/affiliation-graph/:mediatorId
 * Get affiliation network graph for a mediator
 */
router.get('/affiliation-graph/:mediatorId', authenticate, async (req, res) => {
  try {
    const { mediatorId } = req.params;

    const graph = await affiliationDetector.buildAffiliationGraph(mediatorId);

    res.json({
      success: true,
      data: graph
    });
  } catch (error) {
    console.error('Graph building error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/scraping/stats
 * Get scraping statistics
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const totalMediators = await Mediator.countDocuments();
    const verifiedMediators = await Mediator.countDocuments({ isVerified: true });
    const activeMediators = await Mediator.countDocuments({ isActive: true });
    
    const avgDataQuality = await Mediator.aggregate([
      { $group: { _id: null, avg: { $avg: '$dataQuality.completeness' } } }
    ]);

    const ideologyDistribution = await Mediator.aggregate([
      {
        $bucket: {
          groupBy: '$ideologyScore',
          boundaries: [-11, -2, 2, 11],
          default: 'neutral',
          output: { count: { $sum: 1 } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalMediators,
        verifiedMediators,
        activeMediators,
        avgDataQuality: Math.round(avgDataQuality[0]?.avg || 0),
        ideologyDistribution
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
