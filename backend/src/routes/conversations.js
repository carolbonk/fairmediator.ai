/**
 * Conversations & Messages API
 *
 * Per-case messaging. Mediators assigned to a case see all threads on
 * that case; attorneys/parties see only threads they participate in.
 *
 * @module routes/conversations
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Case = require('../models/Case');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { authenticateWithRole } = require('../middleware/roleAuth');
const logger = require('../config/logger');

router.use(authenticateWithRole(['mediator', 'attorney', 'party', 'admin']));

async function userIsMediatorOnCase(userId, caseId) {
  const c = await Case.findOne({ _id: caseId, 'mediator.userId': userId }).select('_id').lean();
  return Boolean(c);
}

/**
 * GET /api/conversations?caseId=...
 * List conversations visible to the user on a case.
 */
router.get('/', async (req, res) => {
  try {
    const { caseId } = req.query;
    if (!caseId || !mongoose.isValidObjectId(caseId)) {
      return res.status(400).json({ success: false, error: 'caseId required' });
    }

    const userId = req.user._id;
    const isMediator = await userIsMediatorOnCase(userId, caseId);

    const filter = isMediator
      ? { caseId }
      : { caseId, 'participants.userId': userId };

    const conversations = await Conversation.find(filter)
      .sort({ lastMessageAt: -1 })
      .lean();

    res.json({ success: true, count: conversations.length, conversations });
  } catch (error) {
    logger.error('[Conversations API] list failed:', error);
    res.status(500).json({ success: false, error: 'Failed to list conversations' });
  }
});

/**
 * POST /api/conversations
 * Create a conversation thread on a case.
 * Body: { caseId, title?, participants: [{userId, role}] }
 */
router.post('/', async (req, res) => {
  try {
    const { caseId, title, participants } = req.body;
    if (!caseId || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ success: false, error: 'caseId and participants required' });
    }

    const conversation = await Conversation.create({
      caseId,
      title,
      participants,
      createdBy: req.user._id,
      lastMessageAt: new Date()
    });

    res.status(201).json({ success: true, conversation });
  } catch (error) {
    logger.error('[Conversations API] create failed:', error);
    res.status(500).json({ success: false, error: 'Failed to create conversation' });
  }
});

/**
 * GET /api/conversations/:id/messages
 */
router.get('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid conversation id' });
    }

    const conversation = await Conversation.findById(id).lean();
    if (!conversation) return res.status(404).json({ success: false, error: 'Not found' });

    const userId = req.user._id;
    const isMediator = await userIsMediatorOnCase(userId, conversation.caseId);
    const isParticipant = conversation.participants.some(p => String(p.userId) === String(userId));
    if (!isMediator && !isParticipant) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const messages = await Message.find({ conversationId: id })
      .sort({ createdAt: 1 })
      .limit(500)
      .lean();

    res.json({ success: true, count: messages.length, messages });
  } catch (error) {
    logger.error('[Conversations API] messages failed:', error);
    res.status(500).json({ success: false, error: 'Failed to load messages' });
  }
});

/**
 * POST /api/conversations/:id/messages
 * Body: { body, attachments? }
 */
router.post('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { body, attachments } = req.body;
    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, error: 'body required' });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) return res.status(404).json({ success: false, error: 'Not found' });

    const userId = req.user._id;
    const isMediator = await userIsMediatorOnCase(userId, conversation.caseId);
    const isParticipant = conversation.participants.some(p => String(p.userId) === String(userId));
    if (!isMediator && !isParticipant) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const message = await Message.create({
      conversationId: id,
      senderId: userId,
      body: body.trim(),
      attachments: attachments || []
    });

    conversation.lastMessageAt = message.createdAt;
    conversation.lastMessagePreview = message.body.slice(0, 240);
    await conversation.save();

    res.status(201).json({ success: true, message });
  } catch (error) {
    logger.error('[Conversations API] send failed:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

module.exports = router;
