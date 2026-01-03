/**
 * Agent System Routes
 * Exposes AI agents for autonomous task execution
 */

const express = require('express');
const router = express.Router();
const agentSystem = require('../services/ai/agentSystem');
const logger = require('../config/logger');

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
router.post('/execute', async (req, res) => {
  try {
    const { agent, task, context = {} } = req.body;

    if (!agent || !task) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: agent, task'
      });
    }

    logger.info(`Executing agent: ${agent} with task: ${task}`);

    const result = await agentSystem.executeAgent(agent, task, context);

    return res.json(result);
  } catch (error) {
    logger.error('Agent execution failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/agents/search
 * Quick mediator search using agent
 *
 * Body:
 * {
 *   "query": "employment mediator in Los Angeles with tech experience"
 * }
 */
router.post('/search', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: query'
      });
    }

    const result = await agentSystem.executeAgent(
      'mediator_search_agent',
      query,
      { source: 'api' }
    );

    return res.json(result);
  } catch (error) {
    logger.error('Agent search failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

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
router.post('/research', async (req, res) => {
  try {
    const { mediatorName, aspects = [] } = req.body;

    if (!mediatorName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: mediatorName'
      });
    }

    const task = `Research mediator: ${mediatorName}. Focus on: ${aspects.join(', ') || 'all aspects'}`;

    const result = await agentSystem.executeAgent(
      'research_agent',
      task,
      { mediatorName, aspects }
    );

    return res.json(result);
  } catch (error) {
    logger.error('Agent research failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

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
router.post('/coordinate', async (req, res) => {
  try {
    const { task, requirements = [] } = req.body;

    if (!task) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: task'
      });
    }

    const enhancedTask = requirements.length > 0
      ? `${task}\nRequirements: ${requirements.join(', ')}`
      : task;

    const result = await agentSystem.executeAgent(
      'coordinator_agent',
      enhancedTask,
      { requirements }
    );

    return res.json(result);
  } catch (error) {
    logger.error('Agent coordination failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/agents/available
 * List all available agents
 */
router.get('/available', async (req, res) => {
  try {
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

    return res.json({
      success: true,
      agents
    });
  } catch (error) {
    logger.error('Failed to list agents:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
