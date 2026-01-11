/**
 * Chain System Routes
 * Exposes AI chain workflows for multi-step task execution
 */

const express = require('express');
const router = express.Router();
const chainSystem = require('../services/ai/chainSystem');
const { sendSuccess, sendError, sendValidationError, asyncHandler } = require('../utils/responseHandlers');

/**
 * POST /api/chains/execute
 * Execute a specific chain
 *
 * Body:
 * {
 *   "chain": "mediator_search",
 *   "input": "employment mediators in California",
 *   "context": { "userId": "123" }
 * }
 */
router.post('/execute', asyncHandler(async (req, res) => {
  const { chain, input, context = {} } = req.body;

  if (!chain || !input) {
    return sendValidationError(res, 'Missing required fields: chain, input');
  }

  const result = await chainSystem.executeChain(chain, input, context);
  return sendSuccess(res, result);
}));

/**
 * POST /api/chains/search
 * Execute mediator search chain
 *
 * Body:
 * {
 *   "query": "employment mediators with tech experience"
 * }
 */
router.post('/search', asyncHandler(async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return sendValidationError(res, 'Missing required field: query');
  }

  const result = await chainSystem.executeChain(
    'mediator_search',
    query,
    { source: 'api' }
  );

  return sendSuccess(res, result);
}));

/**
 * POST /api/chains/analyze-conflict
 * Analyze potential conflicts for a mediator
 *
 * Body:
 * {
 *   "mediatorId": "12345",
 *   "parties": ["Company A", "Law Firm B"]
 * }
 */
router.post('/analyze-conflict', asyncHandler(async (req, res) => {
  const { mediatorId, parties = [] } = req.body;

  if (!mediatorId) {
    return sendValidationError(res, 'Missing required field: mediatorId');
  }

  const result = await chainSystem.executeChain(
    'conflict_analysis',
    { mediatorId, parties },
    { source: 'api' }
  );

  return sendSuccess(res, result);
}));

/**
 * POST /api/chains/summarize
 * Summarize a conversation using chain
 *
 * Body:
 * {
 *   "conversationId": "conv123",
 *   "messages": ["msg1", "msg2", "msg3"]
 * }
 */
router.post('/summarize', asyncHandler(async (req, res) => {
  const { conversationId, messages = [] } = req.body;

  if (!conversationId || messages.length === 0) {
    return sendValidationError(res, 'Missing required fields: conversationId, messages');
  }

  const result = await chainSystem.executeChain(
    'conversation_summary',
    { conversationId, messages },
    { source: 'api' }
  );

  return sendSuccess(res, result);
}));

/**
 * GET /api/chains/available
 * List all available chains
 */
router.get('/available', asyncHandler(async (req, res) => {
  const chains = [
    {
      name: 'mediator_search',
      description: 'Multi-step mediator search with ideology analysis and ranking',
      steps: ['parse_query', 'search_database', 'analyze_ideology', 'rank_results']
    },
    {
      name: 'conflict_analysis',
      description: 'Comprehensive conflict of interest detection',
      steps: ['fetch_mediator', 'check_affiliations', 'analyze_relationships', 'generate_report']
    },
    {
      name: 'conversation_summary',
      description: 'Summarize and extract key points from conversations',
      steps: ['extract_messages', 'identify_topics', 'generate_summary', 'extract_action_items']
    }
  ];

  return sendSuccess(res, { chains });
}));

/**
 * POST /api/chains/custom
 * Execute a custom chain on-the-fly
 *
 * Body:
 * {
 *   "steps": [
 *     { "type": "llm", "template": "Analyze: {{input}}" },
 *     { "type": "transform", "function": "(data) => data.toUpperCase()" }
 *   ],
 *   "input": "sample input"
 * }
 */
router.post('/custom', asyncHandler(async (req, res) => {
  const { steps, input, context = {} } = req.body;

  if (!steps || !Array.isArray(steps) || steps.length === 0) {
    return sendValidationError(res, 'Missing or invalid required field: steps (must be non-empty array)');
  }

  if (!input) {
    return sendValidationError(res, 'Missing required field: input');
  }

  // Register temporary chain
  const tempChainName = `custom_${Date.now()}`;
  chainSystem.registerChain(tempChainName, steps);

  // Execute chain
  const result = await chainSystem.executeChain(tempChainName, input, context);

  return sendSuccess(res, result);
}));

module.exports = router;
