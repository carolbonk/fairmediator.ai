/**
 * Dashboard Routes
 * Provides analytics and usage statistics
 * DRY: Reuses auth middleware and analytics service
 */

const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analytics/analyticsService');
const { authenticate, requireTier } = require('../middleware/auth');
const { asyncHandler, sendSuccess, sendError } = require('../utils/responseHandlers');

/**
 * GET /api/dashboard/stats
 * Get user's personal dashboard statistics
 */
router.get('/stats', authenticate, asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const stats = await analyticsService.getUserStats(req.user._id, days);
  sendSuccess(res, stats);
}));

/**
 * GET /api/dashboard/trends
 * Get search trends for the user
 */
router.get('/trends', authenticate, asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const trends = await analyticsService.getSearchTrends(days);
  sendSuccess(res, trends);
}));

/**
 * GET /api/dashboard/popular-mediators
 * Get most viewed mediators
 */
router.get('/popular-mediators', authenticate, asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const mediators = await analyticsService.getPopularMediators(limit);
  sendSuccess(res, mediators);
}));

/**
 * GET /api/dashboard/platform
 * Get platform-wide analytics (admin/premium only for now)
 */
router.get('/platform', authenticate, requireTier('premium'), asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const stats = await analyticsService.getPlatformStats(days);
  sendSuccess(res, stats);
}));

/**
 * GET /api/dashboard/conversion-funnel
 * Get conversion funnel statistics (premium feature)
 */
router.get('/conversion-funnel', authenticate, requireTier('premium'), asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const funnel = await analyticsService.getConversionFunnel(days);
  sendSuccess(res, funnel);
}));

module.exports = router;
