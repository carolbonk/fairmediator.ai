/**
 * Inbox API
 *
 * Cross-case conversation feed for the authenticated user, sorted
 * by lastMessageAt. Designed for client-side polling.
 *
 * @module routes/inbox
 */

const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Case = require('../models/Case');
const { authenticateWithRole } = require('../middleware/roleAuth');
const logger = require('../config/logger');

router.use(authenticateWithRole(['mediator', 'attorney', 'party', 'admin']));

/**
 * GET /api/inbox
 * Returns up to `limit` conversations involving the user, sorted desc by lastMessageAt.
 * Mediators also see all conversations on their cases (oversight rule from C6).
 *
 * Query: ?since=<ISO timestamp>  (only return conversations updated after this — for polling)
 *        ?limit=<n>              (default 50)
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const since = req.query.since ? new Date(req.query.since) : null;

    const myMediatorCases = await Case.find({ 'mediator.userId': userId }).select('_id').lean();
    const mediatorCaseIds = myMediatorCases.map(c => c._id);

    const visibility = mediatorCaseIds.length
      ? { $or: [
          { 'participants.userId': userId },
          { caseId: { $in: mediatorCaseIds } }
        ]}
      : { 'participants.userId': userId };

    const filter = since
      ? { ...visibility, lastMessageAt: { $gt: since } }
      : visibility;

    const conversations = await Conversation.find(filter)
      .sort({ lastMessageAt: -1 })
      .limit(limit)
      .populate('caseId', 'caseNumber title')
      .lean();

    res.json({
      success: true,
      count: conversations.length,
      polledAt: new Date().toISOString(),
      conversations
    });
  } catch (error) {
    logger.error('[Inbox API] failed:', error);
    res.status(500).json({ success: false, error: 'Failed to load inbox' });
  }
});

module.exports = router;
