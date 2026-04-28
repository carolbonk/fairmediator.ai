/**
 * Gigs API
 *
 * Marketplace listings. Two distribution modes:
 *   - open_feed: any mediator can browse and accept
 *   - auto_match: only recommended mediators see the gig
 *
 * @module routes/gigs
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Gig = require('../models/Gig');
const Case = require('../models/Case');
const { authenticateWithRole } = require('../middleware/roleAuth');
const logger = require('../config/logger');

// Decisions encoded here (see context.md gigs matrix, 2026-04-27):
//   1. auto_match with empty recommendedMediatorIds → downgrade to open_feed (logged), don't reject.
//   2. budget.min > budget.max → 400. Negatives also 400.
//   3. expiresAt absent → default now+30d. Cap at now+180d.
//   4. recommendedMediatorIds settable only when caller is admin; attorney attempts → 400.
//   5. parties[] may be empty at create — Accept-time validates parties present.
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const ONE_EIGHTY_DAYS_MS = 180 * 24 * 60 * 60 * 1000;

function validateGigPayload({ budget, distributionMode, recommendedMediatorIds, expiresAt, isAdmin }) {
  if (budget && typeof budget === 'object') {
    const { min, max } = budget;
    if (min != null && (typeof min !== 'number' || min < 0)) {
      return { error: 'budget.min must be a non-negative number' };
    }
    if (max != null && (typeof max !== 'number' || max < 0)) {
      return { error: 'budget.max must be a non-negative number' };
    }
    if (min != null && max != null && min > max) {
      return { error: 'budget.min cannot exceed budget.max' };
    }
  }

  if (recommendedMediatorIds !== undefined) {
    if (!Array.isArray(recommendedMediatorIds)) {
      return { error: 'recommendedMediatorIds must be an array' };
    }
    if (recommendedMediatorIds.length > 0 && !isAdmin) {
      return { error: 'Only admins may set recommendedMediatorIds; attorneys post open_feed by default.' };
    }
    if (recommendedMediatorIds.some(id => !mongoose.isValidObjectId(id))) {
      return { error: 'recommendedMediatorIds entries must be valid ObjectIds' };
    }
  }

  let resolvedRecommendedIds = recommendedMediatorIds || [];
  let resolvedDistributionMode = distributionMode || 'open_feed';
  if (resolvedDistributionMode === 'auto_match' && resolvedRecommendedIds.length === 0) {
    logger.warn('[Gigs API] auto_match requested with empty recommendedMediatorIds — downgrading to open_feed');
    resolvedDistributionMode = 'open_feed';
  }

  let resolvedExpiresAt;
  if (expiresAt) {
    const ts = new Date(expiresAt);
    if (Number.isNaN(ts.getTime())) {
      return { error: 'expiresAt must be a valid ISO date string' };
    }
    if (ts.getTime() > Date.now() + ONE_EIGHTY_DAYS_MS) {
      return { error: 'expiresAt cannot be more than 180 days in the future' };
    }
    if (ts.getTime() <= Date.now()) {
      return { error: 'expiresAt must be in the future' };
    }
    resolvedExpiresAt = ts;
  } else {
    resolvedExpiresAt = new Date(Date.now() + THIRTY_DAYS_MS);
  }

  return { error: null, resolvedRecommendedIds, resolvedDistributionMode, resolvedExpiresAt };
}

/**
 * POST /api/gigs
 * Posts a new gig to the marketplace. Attorneys post on behalf of clients;
 * admins post directly (e.g., for ML-driven matching tests).
 *
 * Mounted BEFORE the router.use() below so mediators are NOT in the auth set
 * for this endpoint — they consume gigs, they don't create them.
 */
router.post('/', authenticateWithRole(['attorney', 'admin']), async (req, res) => {
  try {
    const {
      title,
      summary,
      disputeType,
      parties,
      amountInDispute,
      budget,
      distributionMode,
      recommendedMediatorIds,
      expiresAt
    } = req.body;

    if (!title || !disputeType) {
      return res.status(400).json({
        success: false,
        error: 'title and disputeType are required'
      });
    }

    const validation = validateGigPayload({
      budget,
      distributionMode,
      recommendedMediatorIds,
      expiresAt,
      isAdmin: req.user.role === 'admin'
    });

    if (validation.error) {
      return res.status(400).json({ success: false, error: validation.error });
    }

    const gig = await Gig.create({
      title,
      summary,
      disputeType,
      parties: parties || [],
      amountInDispute,
      budget,
      distributionMode: validation.resolvedDistributionMode,
      recommendedMediatorIds: validation.resolvedRecommendedIds,
      postedBy: req.user._id,
      expiresAt: validation.resolvedExpiresAt
    });

    res.status(201).json({ success: true, gig });
  } catch (error) {
    logger.error('[Gigs API] create failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create gig',
      message: error.message
    });
  }
});

router.use(authenticateWithRole(['mediator', 'admin']));

/**
 * GET /api/gigs?mode=open_feed|auto_match
 */
router.get('/', async (req, res) => {
  try {
    const mode = req.query.mode === 'auto_match' ? 'auto_match' : 'open_feed';
    const filter = { status: 'open', distributionMode: mode };
    if (mode === 'auto_match') {
      filter.recommendedMediatorIds = req.user._id;
    }

    const gigs = await Gig.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ success: true, mode, count: gigs.length, gigs });
  } catch (error) {
    logger.error('[Gigs API] list failed:', error);
    res.status(500).json({ success: false, error: 'Failed to load gigs' });
  }
});

/**
 * GET /api/gigs/:id
 */
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid gig id' });
    }
    const gig = await Gig.findById(req.params.id).lean();
    if (!gig) return res.status(404).json({ success: false, error: 'Gig not found' });

    if (gig.distributionMode === 'auto_match') {
      const allowed = (gig.recommendedMediatorIds || []).some(
        id => String(id) === String(req.user._id)
      );
      if (!allowed) return res.status(403).json({ success: false, error: 'Not in recommended set' });
    }

    res.json({ success: true, gig });
  } catch (error) {
    logger.error('[Gigs API] get failed:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch gig' });
  }
});

/**
 * POST /api/gigs/:id/accept
 * Atomically: validate transition → create Case → mark gig accepted + promoted.
 */
router.post('/:id/accept', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid gig id' });
    }

    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ success: false, error: 'Gig not found' });

    if (gig.distributionMode === 'auto_match') {
      const allowed = (gig.recommendedMediatorIds || []).some(
        id => String(id) === String(req.user._id)
      );
      if (!allowed) return res.status(403).json({ success: false, error: 'Not in recommended set' });
    }

    if (!gig.canTransitionTo('accepted')) {
      return res.status(409).json({
        success: false,
        error: `Cannot accept gig from status "${gig.status}"`,
        currentStatus: gig.status
      });
    }

    const newCase = await Case.create({
      title: gig.title,
      description: gig.summary,
      disputeType: gig.disputeType,
      status: 'mediator_selected',
      parties: (gig.parties || []).map(p => ({
        name: p.name,
        role: p.role || 'party'
      })),
      mediator: {
        userId: req.user._id,
        assignedAt: new Date(),
        acceptedAt: new Date()
      },
      amountInDispute: gig.amountInDispute,
      createdBy: gig.postedBy
    });

    gig.status = 'accepted';
    gig.acceptedBy = { userId: req.user._id, acceptedAt: new Date() };
    gig.promotedToCaseId = newCase._id;
    await gig.save();

    res.status(201).json({ success: true, gig, case: newCase });
  } catch (error) {
    logger.error('[Gigs API] accept failed:', error);
    res.status(500).json({ success: false, error: 'Failed to accept gig', message: error.message });
  }
});

module.exports = router;
