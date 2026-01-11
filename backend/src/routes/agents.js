/**
 * Agent System Routes
 * Exposes AI agents for autonomous task execution
 */

const express = require('express');
const router = express.Router();
const agentSystem = require('../services/ai/agentSystem');
const { sendSuccess, sendValidationError, sendError, asyncHandler } = require('../utils/responseHandlers');

/**
 * POST /api/agents/execute
 * Execute a specific agent
 *
 * Body:
 * {
 *   "agent": "mediator_search_agent",
 *   "task": "Find mediators specializing in tech IP in California",
 *   "context": { "userId": "123" }
 * }
 */
router.post('/execute', asyncHandler(async (req, res) => {
  const { agent, task, context = {} } = req.body;

  if (!agent || !task) {
    return sendValidationError(res, 'Missing required fields: agent, task');
  }

  const result = await agentSystem.executeAgent(agent, task, context);
  return sendSuccess(res, result);
}));

/**
 * POST /api/agents/search
 * Quick mediator search using agent
 *
 * Body:
 * {
 *   "query": "employment mediator in Los Angeles with tech experience"
 * }
 */
router.post('/search', asyncHandler(async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return sendValidationError(res, 'Missing required field: query');
  }

  const result = await agentSystem.executeAgent(
    'mediator_search_agent',
    query,
    { source: 'api' }
  );

  return sendSuccess(res, result);
}));

/**
 * POST /api/agents/research
 * Deep research on mediator using agent
 *
 * Body:
 * {
 *   "mediatorName": "John Doe",
 *   "aspects": ["credentials", "conflicts", "ideology"]
 * }
 */
router.post('/research', asyncHandler(async (req, res) => {
  const { mediatorName, aspects = [] } = req.body;

  if (!mediatorName) {
    return sendValidationError(res, 'Missing required field: mediatorName');
  }

  const task = `Research mediator: ${mediatorName}. Focus on: ${aspects.join(', ') || 'all aspects'}`;

  const result = await agentSystem.executeAgent(
    'research_agent',
    task,
    { mediatorName, aspects }
  );

  return sendSuccess(res, result);
}));

/**
 * POST /api/agents/coordinate
 * Complex task coordination using multiple agents
 *
 * Body:
 * {
 *   "task": "Find and verify 5 employment mediators in California",
 *   "requirements": ["tech experience", "no BigLaw conflicts"]
 * }
 */
router.post('/coordinate', asyncHandler(async (req, res) => {
  const { task, requirements = [] } = req.body;

  if (!task) {
    return sendValidationError(res, 'Missing required field: task');
  }

  const enhancedTask = requirements.length > 0
    ? `${task}\nRequirements: ${requirements.join(', ')}`
    : task;

  const result = await agentSystem.executeAgent(
    'coordinator_agent',
    enhancedTask,
    { requirements }
  );

  return sendSuccess(res, result);
}));

/**
 * GET /api/agents/available
 * List all available agents
 */
router.get('/available', asyncHandler(async (req, res) => {
  // Return list of available agents
  const agents = [
    {
      name: 'mediator_search_agent',
      description: 'Searches mediator database with natural language queries',
      tools: ['search_database', 'analyze_ideology']
    },
    {
      name: 'research_agent',
      description: 'Deep research on specific mediators',
      tools: ['check_credentials', 'analyze_conflicts']
    },
    {
      name: 'coordinator_agent',
      description: 'Coordinates multiple agents for complex tasks',
      tools: ['delegate_to_search_agent', 'delegate_to_research_agent']
    }
  ];

  return sendSuccess(res, { agents });
}));

module.exports = router;
