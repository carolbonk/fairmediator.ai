const express = require('express');
const router = express.Router();
const mediatorScraper = require('../services/scraping/mediatorScraper');
const affiliationDetector = require('../services/scraping/affiliationDetector');
const Mediator = require('../models/Mediator');
const { authenticate, requireTier } = require('../middleware/auth');
const { sendSuccess, sendError, sendValidationError, asyncHandler } = require('../utils/responseHandlers');

/**
 * POST /api/scraping/scrape-profile
 * Manually scrape a single mediator profile
 * Admin only
 */
router.post('/scrape-profile', authenticate, requireTier('admin'), asyncHandler(async (req, res) => {
  const { url, sourceType, useDynamic } = req.body;

  if (!url) {
    return sendValidationError(res, 'URL is required');
  }

  const mediator = await mediatorScraper.scrapeMediatorProfile(
    url,
    sourceType || 'manual',
    useDynamic || false
  );

  return sendSuccess(res, mediator, 200, 'Mediator profile scraped successfully');
}));

/**
 * POST /api/scraping/analyze-mediator
 * Analyze mediator for affiliations and bias
 */
router.post('/analyze-mediator', authenticate, asyncHandler(async (req, res) => {
  const { mediatorId } = req.body;

  if (!mediatorId) {
    return sendValidationError(res, 'mediatorId is required');
  }

  const analysis = await affiliationDetector.analyzeMediatorProfile(mediatorId);

  return sendSuccess(res, analysis);
}));

/**
 * POST /api/scraping/check-conflicts
 * Check for conflicts between mediator and parties
 */
router.post('/check-conflicts', authenticate, asyncHandler(async (req, res) => {
  const { mediatorId, parties } = req.body;

  if (!mediatorId || !parties || !Array.isArray(parties)) {
    return sendValidationError(res, 'mediatorId and parties (array) are required');
  }

  const conflicts = await affiliationDetector.checkConflicts(mediatorId, parties);

  return sendSuccess(res, conflicts);
}));

/**
 * GET /api/scraping/affiliation-graph/:mediatorId
 * Get affiliation network graph for a mediator
 */
router.get('/affiliation-graph/:mediatorId', authenticate, asyncHandler(async (req, res) => {
  const { mediatorId } = req.params;

  const graph = await affiliationDetector.buildAffiliationGraph(mediatorId);

  return sendSuccess(res, graph);
}));

/**
 * GET /api/scraping/stats
 * Get scraping statistics
 */
router.get('/stats', authenticate, asyncHandler(async (req, res) => {
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

  return sendSuccess(res, {
    totalMediators,
    verifiedMediators,
    activeMediators,
    avgDataQuality: Math.round(avgDataQuality[0]?.avg || 0),
    ideologyDistribution
  });
}));

module.exports = router;
