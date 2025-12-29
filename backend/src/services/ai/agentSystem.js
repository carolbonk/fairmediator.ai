/**
 * AI Agent System
 * Autonomous agents that can use tools, make decisions, and execute tasks
 * No LangChain - Pure custom implementation
 */

const hfClient = require('../huggingface/hfClient');
const memorySystem = require('./memorySystem');
const chainSystem = require('./chainSystem');
const logger = require('../../config/logger');

class Agent {
  constructor(config) {
    this.name = config.name;
    this.role = config.role;
    this.systemPrompt = config.systemPrompt;
    this.tools = config.tools || [];
    this.maxIterations = config.maxIterations || 5;
    this.temperature = config.temperature || 0.7;
  }

  /**
   * Execute agent with given task
   * @param {string} task - Task description
   * @param {object} context - Additional context
   */
  async execute(task, context = {}) {
    const iterations = [];
    let currentThought = task;
    let finalAnswer = null;

    try {
      for (let i = 0; i < this.maxIterations; i++) {
        logger.info(`Agent ${this.name} - Iteration ${i + 1}/${this.maxIterations}`);

        // Think: Decide what to do next
        const thought = await this.think(currentThought, iterations, context);

        // Act: Execute the action
        const action = await this.act(thought, context);

        iterations.push({
          iteration: i + 1,
          thought: thought.reasoning,
          action: action.name,
          result: action.result,
          timestamp: new Date()
        });

        // Check if task is complete
        if (action.isComplete || thought.isComplete) {
          finalAnswer = action.result;
          break;
        }

        // Prepare next iteration
        currentThought = `Previous action: ${action.name}
Result: ${JSON.stringify(action.result)}

Continue working on: ${task}`;
      }

      return {
        success: true,
        answer: finalAnswer,
        iterations,
        agent: this.name
      };
    } catch (error) {
      logger.error(`Agent ${this.name} execution failed:`, error);
      return {
        success: false,
        error: error.message,
        iterations,
        agent: this.name
      };
    }
  }

  /**
   * Think step: Decide what action to take
   */
  async think(task, history, context) {
    const historyText = history.map(h =>
      `Iteration ${h.iteration}: ${h.thought}\nAction: ${h.action}\nResult: ${JSON.stringify(h.result)}`
    ).join('\n\n');

    const toolDescriptions = this.tools.map(t =>
      `- ${t.name}: ${t.description}`
    ).join('\n');

    const thinkPrompt = `You are ${this.name}, ${this.role}.

${this.systemPrompt}

Available tools:
${toolDescriptions}
- finish: Use when task is complete

Previous iterations:
${historyText || 'None yet'}

Current task: ${task}

Think step-by-step:
1. What do I know so far?
2. What information do I still need?
3. Which tool should I use next?
4. Am I done with the task?

Respond in JSON format:
{
  "reasoning": "your step-by-step thinking",
  "next_action": "tool_name",
  "action_input": "input for the tool",
  "is_complete": false
}`;

    const response = await hfClient.chat([
      { role: 'user', content: thinkPrompt }
    ], { temperature: this.temperature, maxTokens: 500 });

    // Parse JSON from response
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      logger.error('Error parsing agent thought:', e);
    }

    // Fallback
    return {
      reasoning: response.content,
      next_action: 'finish',
      action_input: response.content,
      is_complete: true
    };
  }

  /**
   * Act step: Execute the chosen action
   */
  async act(thought, context) {
    const actionName = thought.next_action || thought.nextAction;
    const actionInput = thought.action_input || thought.actionInput;

    // Special case: finish action
    if (actionName === 'finish') {
      return {
        name: 'finish',
        result: actionInput,
        isComplete: true
      };
    }

    // Find and execute tool
    const tool = this.tools.find(t => t.name === actionName);

    if (!tool) {
      logger.warn(`Tool "${actionName}" not found, finishing`);
      return {
        name: actionName,
        result: `Tool not found: ${actionName}`,
        isComplete: true
      };
    }

    try {
      const result = await tool.execute(actionInput, context);

      return {
        name: actionName,
        result,
        isComplete: false
      };
    } catch (error) {
      logger.error(`Tool ${actionName} execution failed:`, error);
      return {
        name: actionName,
        result: `Error: ${error.message}`,
        isComplete: false
      };
    }
  }
}

class AgentSystem {
  constructor() {
    this.agents = new Map();
    this.initializeDefaultAgents();
  }

  /**
   * Register a new agent
   */
  registerAgent(name, config) {
    const agent = new Agent({ name, ...config });
    this.agents.set(name, agent);
    logger.info(`Registered agent: ${name}`);
    return agent;
  }

  /**
   * Get agent by name
   */
  getAgent(name) {
    return this.agents.get(name);
  }

  /**
   * Execute agent
   */
  async executeAgent(agentName, task, context = {}) {
    const agent = this.getAgent(agentName);

    if (!agent) {
      throw new Error(`Agent "${agentName}" not found`);
    }

    return await agent.execute(task, context);
  }

  /**
   * Initialize default agents
   */
  initializeDefaultAgents() {
    // Mediator Search Agent
    this.registerAgent('mediator_search_agent', {
      role: 'mediator search specialist',
      systemPrompt: 'You help users find the best mediator for their legal dispute. You gather requirements, search mediators, and provide recommendations.',
      tools: [
        {
          name: 'search_mediators',
          description: 'Search for mediators using semantic search. Input: search query',
          execute: async (query, context) => {
            const ragEngine = require('./ragEngine');
            const results = await ragEngine.processQuery(query, [], { topK: 5 });
            return results.mediators.map(m => ({
              name: m.name,
              location: `${m.location?.city}, ${m.location?.state}`,
              specializations: m.specializations,
              experience: m.yearsExperience
            }));
          }
        },
        {
          name: 'check_conflicts',
          description: 'Check for conflicts of interest. Input: JSON array of party names',
          execute: async (parties, context) => {
            // Parse parties
            let partyList = [];
            try {
              partyList = JSON.parse(parties);
            } catch (e) {
              return { error: 'Invalid party list format' };
            }

            const Mediator = require('../../models/Mediator');
            const mediators = await Mediator.find().limit(10);

            const conflicts = [];
            for (const mediator of mediators) {
              const mediatorConflicts = await mediator.detectConflicts(partyList);
              if (mediatorConflicts.length > 0) {
                conflicts.push({
                  mediator: mediator.name,
                  conflicts: mediatorConflicts.map(c => c.entity)
                });
              }
            }

            return conflicts;
          }
        },
        {
          name: 'get_user_preferences',
          description: 'Retrieve user preferences from memory. Input: user query',
          execute: async (query, context) => {
            const memories = await memorySystem.retrieveLongTermMemory(
              context.userId || 'guest',
              query,
              3
            );
            return memories.map(m => m.fact);
          }
        }
      ],
      maxIterations: 5,
      temperature: 0.6
    });

    // Research Agent
    this.registerAgent('research_agent', {
      role: 'legal research specialist',
      systemPrompt: 'You research mediators, analyze their backgrounds, and compile detailed reports.',
      tools: [
        {
          name: 'search_database',
          description: 'Search mediator database. Input: search criteria',
          execute: async (criteria, context) => {
            const Mediator = require('../../models/Mediator');
            const mediators = await Mediator.find({
              $text: { $search: criteria }
            }).limit(10);

            return mediators.map(m => ({
              name: m.name,
              location: m.location,
              experience: m.yearsExperience,
              specializations: m.specializations
            }));
          }
        },
        {
          name: 'analyze_ideology',
          description: 'Analyze mediator ideology. Input: mediator name',
          execute: async (name, context) => {
            const Mediator = require('../../models/Mediator');
            const mediator = await Mediator.findOne({ name: new RegExp(name, 'i') });

            if (!mediator) {
              return { error: 'Mediator not found' };
            }

            return {
              name: mediator.name,
              ideologyScore: mediator.ideologyScore,
              leaning: Math.abs(mediator.ideologyScore) < 2 ? 'neutral' :
                      mediator.ideologyScore < 0 ? 'liberal' : 'conservative'
            };
          }
        }
      ],
      maxIterations: 4,
      temperature: 0.5
    });

    // Multi-Agent Coordinator
    this.registerAgent('coordinator_agent', {
      role: 'task coordinator',
      systemPrompt: 'You coordinate multiple agents to complete complex tasks. You delegate subtasks to specialized agents.',
      tools: [
        {
          name: 'delegate_to_search_agent',
          description: 'Delegate mediator search task. Input: search request',
          execute: async (request, context) => {
            return await this.executeAgent('mediator_search_agent', request, context);
          }
        },
        {
          name: 'delegate_to_research_agent',
          description: 'Delegate research task. Input: research request',
          execute: async (request, context) => {
            return await this.executeAgent('research_agent', request, context);
          }
        }
      ],
      maxIterations: 3,
      temperature: 0.7
    });

    logger.info('Initialized default agents: mediator_search_agent, research_agent, coordinator_agent');
  }
}

module.exports = new AgentSystem();
