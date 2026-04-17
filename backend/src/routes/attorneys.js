/**
 * Attorney Routes
 * API endpoints for attorney users
 *
 * All routes in this file are attorney-specific and require attorney accountType
 */

const express = require('express');
const router = express.Router();
const { authenticateWithRole, requirePermission } = require('../middleware/roleAuth');
const { asyncErrorHandler } = require('../middleware/errorMonitoring');
const Mediator = require('../models/Mediator');
const SavedMediator = require('../models/SavedMediator');
const SearchHistory = require('../models/SearchHistory');
const Case = require('../models/Case');

// All routes require attorney or admin role
router.use(authenticateWithRole(['attorney', 'admin']));

/**
 * GET /api/attorneys/saved-mediators
 * Get attorney's saved/bookmarked mediators
 */
router.get('/saved-mediators', requirePermission('attorney.mediators.bookmark'), asyncErrorHandler(async (req, res) => {
  const savedMediators = await SavedMediator.find({ userId: req.user._id })
    .populate({
      path: 'mediatorId',
      select: 'name specializations rating yearsExperience location totalCases isVerified'
    })
    .sort({ priority: -1, savedAt: -1 })
    .limit(parseInt(req.query.limit) || 20);

  res.json({
    success: true,
    data: savedMediators.map(sm => ({
      id: sm._id,
      mediator: sm.mediatorId,
      notes: sm.notes,
      tags: sm.tags,
      priority: sm.priority,
      savedAt: sm.savedAt
    })),
    count: savedMediators.length
  });
}));

/**
 * GET /api/attorneys/recent-searches
 * Get attorney's recent mediator searches
 */
router.get('/recent-searches', requirePermission('attorney.mediators.search'), asyncErrorHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  const recentSearches = await SearchHistory.find({ userId: req.user._id })
    .sort({ searchedAt: -1 })
    .limit(limit)
    .select('query filters resultsCount interaction searchedAt');

  res.json({
    success: true,
    data: recentSearches.map(search => ({
      id: search._id,
      query: search.query,
      filters: search.filters,
      resultsCount: search.resultsCount,
      interaction: search.interaction,
      timestamp: search.searchedAt
    })),
    count: recentSearches.length
  });
}));

/**
 * GET /api/attorneys/my-cases
 * Get attorney's active cases
 */
router.get('/my-cases', requirePermission('attorney.cases.write'), asyncErrorHandler(async (req, res) => {
  const { status, disputeType } = req.query;

  // Build query for cases where user is an attorney
  const query = {
    'attorneys.userId': req.user._id
  };

  if (status) query.status = status;
  if (disputeType) query.disputeType = disputeType;

  const cases = await Case.find(query)
    .populate('mediator.mediatorId', 'name rating specializations')
    .sort({ updatedAt: -1 })
    .select('caseNumber title disputeType status parties attorneys mediator dates amountInDispute updatedAt');

  res.json({
    success: true,
    data: cases,
    count: cases.length
  });
}));

module.exports = router;
