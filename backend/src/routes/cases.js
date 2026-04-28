/**
 * Cases API Routes
 *
 * Mediator-scoped case access. The Case model is shared across personas,
 * but this router exposes only the mediator's view of it.
 *
 * @module routes/cases
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Case = require('../models/Case');
const Mediator = require('../models/Mediator');
const { authenticateWithRole } = require('../middleware/roleAuth');
const logger = require('../config/logger');

router.use(authenticateWithRole(['mediator', 'admin']));

const ACTIVE_STATUSES = ['mediator_selected', 'in_mediation', 'on_hold'];

/**
 * GET /api/cases
 * List cases assigned to the authenticated mediator.
 * Query params:
 *   - status: filter by single status, or 'active' for the active set
 *   - limit:  page size (default 50, max 200)
 *   - skip:   offset
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const { status } = req.query;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const skip = Math.max(parseInt(req.query.skip, 10) || 0, 0);

    const filter = { 'mediator.userId': userId };
    if (status === 'active') {
      filter.status = { $in: ACTIVE_STATUSES };
    } else if (status && status !== 'all') {
      filter.status = status;
    }

    const [cases, total] = await Promise.all([
      Case.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('caseNumber title disputeType status parties attorneys settlement dates amountInDispute updatedAt createdAt')
        .lean(),
      Case.countDocuments(filter)
    ]);

    res.json({ success: true, total, count: cases.length, cases });
  } catch (error) {
    logger.error('[Cases API] list failed:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch cases' });
  }
});

/**
 * GET /api/cases/:id
 * Fetch a single case the mediator owns.
 */
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid case id' });
    }
    const c = await Case.findOne({
      _id: req.params.id,
      'mediator.userId': req.user._id
    }).lean();

    if (!c) return res.status(404).json({ success: false, error: 'Case not found' });
    res.json({ success: true, case: c });
  } catch (error) {
    logger.error('[Cases API] get failed:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch case' });
  }
});

/**
 * POST /api/cases/:id/conflict-check
 * One-click conflict check: runs both affiliation (HF) and graph services
 * over the case's parties for the case's mediator, and returns a verdict.
 */
router.post('/:id/conflict-check', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid case id' });
    }

    const c = await Case.findOne({
      _id: req.params.id,
      'mediator.userId': req.user._id
    }).lean();
    if (!c) return res.status(404).json({ success: false, error: 'Case not found' });

    const partyNames = (c.parties || []).map(p => p.name).filter(Boolean);
    if (partyNames.length === 0) {
      return res.status(400).json({ success: false, error: 'Case has no named parties' });
    }

    const mediator = c.mediator?.mediatorId
      ? await Mediator.findById(c.mediator.mediatorId).lean()
      : await Mediator.findOne({ userId: req.user._id }).lean();
    if (!mediator) {
      return res.status(404).json({ success: false, error: 'Mediator profile not found' });
    }

    // Lazy-require: these pull in HF + graph services that need env vars at load time;
    // keep cases.js bootable in environments without those configured.
    const affiliationDetector = require('../services/huggingface/affiliationDetector');
    const graphService = require('../graph_analyzer/services/graph_service');

    const [affiliationResult, graphResult] = await Promise.allSettled([
      affiliationDetector.quickCheck(mediator, partyNames),
      Promise.allSettled(partyNames.map(p =>
        graphService.analyzeConflict(mediator._id, p, { maxDepth: 3 })
      ))
    ]);

    const affiliation = affiliationResult.status === 'fulfilled'
      ? affiliationResult.value
      : { error: affiliationResult.reason?.message };

    let maxRisk = 0;
    let graphLevel = 'GREEN';
    const paths = [];
    if (graphResult.status === 'fulfilled') {
      graphResult.value.forEach(r => {
        if (r.status === 'fulfilled' && r.value) {
          if (r.value.paths) paths.push(...r.value.paths);
          if (r.value.riskScore && r.value.riskScore > maxRisk) {
            maxRisk = r.value.riskScore;
            graphLevel = r.value.riskLevel || graphLevel;
          }
        }
      });
    }

    const verdict =
      graphLevel === 'RED' || affiliation?.flag === 'red' ? 'red' :
      graphLevel === 'YELLOW' || affiliation?.flag === 'yellow' ? 'yellow' :
      'green';

    res.json({
      success: true,
      verdict,
      affiliation,
      graph: { riskLevel: graphLevel, maxRiskScore: maxRisk, pathCount: paths.length, paths: paths.slice(0, 10) },
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('[Cases API] conflict-check failed:', error);
    res.status(500).json({ success: false, error: 'Conflict check failed', message: error.message });
  }
});

module.exports = router;
