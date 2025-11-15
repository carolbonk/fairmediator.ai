/**
 * Dashboard Routes
 * Provides analytics and usage statistics
 * DRY: Reuses auth middleware and analytics service
 */

const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analytics/analyticsService');
const { authenticate, requireTier } = require('../middleware/auth');

/**
 * GET /api/dashboard/stats
 * Get user's personal dashboard statistics
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;

    const stats = await analyticsService.getUserStats(req.user._id, days);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
});

/**
 * GET /api/dashboard/trends
 * Get search trends for the user
 */
router.get('/trends', authenticate, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;

    const trends = await analyticsService.getSearchTrends(days);

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({ error: 'Failed to retrieve trends' });
  }
});

/**
 * GET /api/dashboard/popular-mediators
 * Get most viewed mediators
 */
router.get('/popular-mediators', authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const mediators = await analyticsService.getPopularMediators(limit);

    res.json({
      success: true,
      data: mediators
    });
  } catch (error) {
    console.error('Get popular mediators error:', error);
    res.status(500).json({ error: 'Failed to retrieve popular mediators' });
  }
});

/**
 * GET /api/dashboard/platform
 * Get platform-wide analytics (admin/premium only for now)
 */
router.get('/platform', authenticate, requireTier('premium'), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;

    const stats = await analyticsService.getPlatformStats(days);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get platform stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve platform statistics' });
  }
});

/**
 * GET /api/dashboard/conversion-funnel
 * Get conversion funnel statistics (premium feature)
 */
router.get('/conversion-funnel', authenticate, requireTier('premium'), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;

    const funnel = await analyticsService.getConversionFunnel(days);

    res.json({
      success: true,
      data: funnel
    });
  } catch (error) {
    console.error('Get conversion funnel error:', error);
    res.status(500).json({ error: 'Failed to retrieve conversion funnel' });
  }
});

module.exports = router;
