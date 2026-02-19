/**
 * Chat Routes
 * Handles chat interactions for mediator search
 */

const express = require('express');
const router = express.Router();
const chatService = require('../services/huggingface/chatService');
const affiliationDetector = require('../services/huggingface/affiliationDetector');
const ideologyClassifier = require('../services/huggingface/ideologyClassifier');
const { sendSuccess, sendError, sendValidationError, asyncHandler } = require('../utils/responseHandlers');

/**
 * POST /api/chat
 * Process a user chat message and return mediator recommendations
 */
router.post('/', asyncHandler(async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || typeof message !== 'string') {
    return sendValidationError(res, 'Message is required and must be a string');
  }

  const result = await chatService.processQuery(message, history);

  sendSuccess(res, result);
}));

/**
 * POST /api/chat/stream
 * Stream chat responses for real-time UI
 */
router.post('/stream', asyncHandler(async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || typeof message !== 'string') {
    return sendValidationError(res, 'Message is required');
  }

  // Set headers for SSE (Server-Sent Events)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  await chatService.streamResponse(message, history, (chunk) => {
    res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
  });

  res.write('data: [DONE]\n\n');
  res.end();
}));

/**
 * POST /api/chat/enrich-mediator
 * Removed - llamaClient dependency removed during refactoring
 */
router.post('/enrich-mediator', (_req, res) => {
  res.status(404).json({ error: 'Endpoint removed' });
});

/**
 * POST /api/chat/check-conflicts
 * Deep conflict check using web scraping
 */
router.post('/check-conflicts', asyncHandler(async (req, res) => {
  const { mediatorId, parties } = req.body;

  if (!mediatorId || !parties || parties.length === 0) {
    return sendValidationError(res, 'mediatorId and parties array are required');
  }

  // Use llama affiliation detector with scraping
  const result = await affiliationDetector.detectConflicts(mediatorId, parties);

  sendSuccess(res, {
    ...result,
    timestamp: new Date()
  });
}));

/**
 * POST /api/chat/analyze-ideology
 * Analyze mediator ideology using web scraping
 */
router.post('/analyze-ideology', asyncHandler(async (req, res) => {
  const { mediatorId } = req.body;

  if (!mediatorId) {
    return sendValidationError(res, 'mediatorId is required');
  }

  // Use llama ideology classifier with scraping
  const result = await ideologyClassifier.classifyMediator(mediatorId);

  sendSuccess(res, {
    ...result,
    timestamp: new Date()
  });
}));

/**
 * GET /api/chat/scraper-health
 * Removed - llamaClient dependency removed during refactoring
 */
router.get('/scraper-health', (_req, res) => {
  res.status(404).json({ error: 'Endpoint removed' });
});

/**
 * POST /api/chat/bulk-scrape
 * Removed - llamaClient dependency removed during refactoring
 */
router.post('/bulk-scrape', (_req, res) => {
  res.status(404).json({ error: 'Endpoint removed' });
});

module.exports = router;
