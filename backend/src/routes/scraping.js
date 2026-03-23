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

/**
 * GET /api/scraping/trigger-batch
 * Trigger batch scraping with quota checks (for N8N automation)
 * Public (secured by API token in N8N)
 *
 * Query params:
 * - scraper: fec | senate_lda | linkedin (default: fec)
 * - count: number of mediators to scrape (default: 10, max: 50)
 */
router.get('/trigger-batch', asyncHandler(async (req, res) => {
  const { monitor } = require('../utils/freeTierMonitor');
  const logger = require('../config/logger');
  const { scraper = 'fec', count = 10 } = req.query;

  const scrapCount = Math.min(parseInt(count), 50); // Max 50 per batch

  // Check quota
  if (!monitor.isAllowed('scraping')) {
    logger.warn('Batch scraping blocked - quota exhausted', {
      scraper,
      requestedCount: scrapCount
    });

    return res.status(429).json({
      error: 'Scraping quota exhausted',
      nextReset: monitor.getNextReset('scraping'),
      usage: monitor.getUsage('scraping')
    });
  }

  logger.info('Batch scraping triggered', { scraper, count: scrapCount });

  // For now, return mock data
  // In production, this would trigger actual scrapers
  const results = {
    scraper,
    count: scrapCount,
    status: 'completed',
    message: 'Batch scraping completed (mock data)',
    scraped: 0,
    timestamp: new Date().toISOString()
  };

  // Track minimal usage for the request itself
  monitor.track('scraping', 1);

  return res.json({
    success: true,
    scraped: results.scraped,
    quotaRemaining: monitor.getRemaining('scraping'),
    data: results
  });
}));

/**
 * GET /api/scraping/summary
 * Get summary of recent scraping results (for N8N automation)
 * Public
 *
 * Query params:
 * - days: number of days to analyze (default: 7)
 */
router.get('/summary', asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;
  const logger = require('../config/logger');

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - parseInt(days));

  // Query MongoDB for recent data
  const newMediators = await Mediator.countDocuments({
    createdAt: { $gte: cutoff }
  });

  // Get donation stats
  const donationStats = await Mediator.aggregate([
    {
      $match: { createdAt: { $gte: cutoff } }
    },
    {
      $unwind: { path: '$biasIndicators.donationHistory', preserveNullAndEmptyArrays: true }
    },
    {
      $group: {
        _id: null,
        totalDonations: { $sum: 1 },
        totalAmount: { $sum: '$biasIndicators.donationHistory.amount' }
      }
    }
  ]);

  // Get affiliation stats
  const affiliationStats = await Mediator.aggregate([
    {
      $match: { createdAt: { $gte: cutoff } }
    },
    {
      $unwind: { path: '$affiliations', preserveNullAndEmptyArrays: true }
    },
    {
      $group: {
        _id: null,
        totalAffiliations: { $sum: 1 }
      }
    }
  ]);

  // Get top donors
  const topDonors = await Mediator.aggregate([
    {
      $match: { createdAt: { $gte: cutoff } }
    },
    {
      $unwind: '$biasIndicators.donationHistory'
    },
    {
      $group: {
        _id: '$biasIndicators.donationHistory.recipient',
        totalAmount: { $sum: '$biasIndicators.donationHistory.amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { totalAmount: -1 }
    },
    {
      $limit: 5
    }
  ]);

  // Get top affiliations
  const topAffiliations = await Mediator.aggregate([
    {
      $match: { createdAt: { $gte: cutoff } }
    },
    {
      $unwind: '$affiliations'
    },
    {
      $group: {
        _id: '$affiliations.name',
        count: { $sum: 1 },
        type: { $first: '$affiliations.type' }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 5
    }
  ]);

  logger.info('Scraping summary retrieved', {
    days: parseInt(days),
    newMediators
  });

  return res.json({
    period: `Last ${days} days`,
    newMediators,
    newDonations: donationStats[0]?.totalDonations || 0,
    newAffiliations: affiliationStats[0]?.totalAffiliations || 0,
    totalDonationAmount: donationStats[0]?.totalAmount || 0,
    topDonors: topDonors.map(d => ({
      recipient: d._id,
      amount: d.totalAmount,
      donations: d.count
    })),
    topAffiliations: topAffiliations.map(a => ({
      name: a._id,
      count: a.count,
      type: a.type
    })),
    timestamp: new Date().toISOString()
  });
}));

module.exports = router;
