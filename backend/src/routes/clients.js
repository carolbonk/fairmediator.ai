/**
 * Client Routes (attorneys + parties)
 *
 * The demand side of the marketplace — lawyers and disputing parties — share a
 * single router. The role guard admits both; per-endpoint `requirePermission`
 * still segregates attorney-only vs party-only capabilities, so a party hitting
 * an attorney endpoint (or vice-versa) is rejected by the permission layer.
 *
 * Mounted at /api/clients (replaces the former /api/attorneys + /api/parties).
 */

const express = require('express');
const router = express.Router();
const { authenticateWithRole, requirePermission } = require('../middleware/roleAuth');
const { asyncErrorHandler } = require('../middleware/errorMonitoring');
const Mediator = require('../models/Mediator');
const SavedMediator = require('../models/SavedMediator');
const SearchHistory = require('../models/SearchHistory');
const Case = require('../models/Case');

// Both demand-side roles (plus admin) may reach this router.
router.use(authenticateWithRole(['attorney', 'party', 'admin']));

/* ───────────────────────── Attorney capabilities ───────────────────────── */

/**
 * GET /api/clients/saved-mediators
 * Attorney's saved/bookmarked mediators.
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
 * GET /api/clients/recent-searches
 * Attorney's recent mediator searches.
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
 * GET /api/clients/my-cases
 * Attorney's active cases.
 */
router.get('/my-cases', requirePermission('attorney.cases.write'), asyncErrorHandler(async (req, res) => {
  const { status: rawStatus, disputeType: rawDisputeType } = req.query;
  const allowedStatuses = new Set(['draft', 'pending', 'active', 'in_progress', 'resolved', 'closed', 'cancelled']);
  const allowedDisputeTypes = new Set(['commercial', 'employment', 'family', 'property', 'contract', 'other']);

  // Build query for cases where user is an attorney
  const query = {
    'attorneys.userId': req.user._id
  };

  if (rawStatus !== undefined) {
    if (typeof rawStatus !== 'string' || !allowedStatuses.has(rawStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid status filter' });
    }
    query.status = rawStatus;
  }

  if (rawDisputeType !== undefined) {
    if (typeof rawDisputeType !== 'string' || !allowedDisputeTypes.has(rawDisputeType)) {
      return res.status(400).json({ success: false, message: 'Invalid disputeType filter' });
    }
    query.disputeType = rawDisputeType;
  }

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

/* ────────────────────────── Party capabilities ─────────────────────────── */

/**
 * GET /api/clients/my-case
 * The party's current (most recent active) case.
 */
router.get('/my-case', requirePermission('party.case.read'), asyncErrorHandler(async (req, res) => {
  const userCase = await Case.findOne({
    'parties.userId': req.user._id,
    status: { $nin: ['settled', 'cancelled', 'failed'] } // Only active cases
  })
    .populate('mediator.mediatorId', 'name rating specializations location')
    .populate('createdBy', 'name email')
    .sort({ updatedAt: -1 });

  if (!userCase) {
    return res.json({
      success: true,
      data: null,
      message: 'No active case found'
    });
  }

  res.json({
    success: true,
    data: userCase
  });
}));

/**
 * GET /api/clients/recommended-mediators
 * Recommended mediators for the party.
 */
router.get('/recommended-mediators', requirePermission('party.mediator.view'), asyncErrorHandler(async (req, res) => {
  const mediators = await Mediator.find({
    isActive: true
  })
    .sort({ rating: -1, totalCases: -1 })
    .limit(6)
    .select('name specializations rating yearsExperience location totalCases isVerified');

  res.json({
    success: true,
    data: mediators
  });
}));

module.exports = router;
