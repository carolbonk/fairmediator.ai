/**
 * AI Chain System
 * Custom chain implementation without LangChain
 * Chains multiple AI operations together in sequence
 */

const hfClient = require('../huggingface/hfClient');
const memorySystem = require('./memorySystem');
const ragEngine = require('./ragEngine');
const logger = require('../../config/logger');

class ChainSystem {
  constructor() {
    this.chains = new Map();
  }

  /**
   * Create a new chain
   * @param {string} name - Chain name
   * @param {Array} steps - Array of chain steps
   */
  registerChain(name, steps) {
    this.chains.set(name, steps);
    logger.info(`Registered chain: ${name} with ${steps.length} steps`);
  }

  /**
   * Execute a chain
   * @param {string} chainName - Name of chain to execute
   * @param {object} input - Initial input
   * @param {object} context - Additional context
   */
  async executeChain(chainName, input, context = {}) {
    const chain = this.chains.get(chainName);

    if (!chain) {
      throw new Error(`Chain "${chainName}" not found`);
    }

    let currentInput = input;
    const results = [];

    try {
      for (const [index, step] of chain.entries()) {
        logger.info(`Executing step ${index + 1}/${chain.length}: ${step.name}`);

        const stepResult = await this.executeStep(step, currentInput, context);

        results.push({
          step: step.name,
          input: currentInput,
          output: stepResult,
          timestamp: new Date()
        });

        // Pass output to next step
        currentInput = stepResult;
      }

      return {
        success: true,
        finalOutput: currentInput,
        steps: results
      };
    } catch (error) {
      logger.error(`Chain execution failed at step ${results.length + 1}:`, error);
      return {
        success: false,
        error: error.message,
        steps: results,
        failedStep: results.length
      };
    }
  }

  /**
   * Execute a single step
   */
  async executeStep(step, input, context) {
    const { type, config, name } = step;

    switch (type) {
      case 'llm':
        return await this.executeLLMStep(config, input, context);

      case 'retrieval':
        return await this.executeRetrievalStep(config, input, context);

      case 'memory':
        return await this.executeMemoryStep(config, input, context);

      case 'transform':
        return await this.executeTransformStep(config, input, context);

      case 'custom':
        return await config.execute(input, context);

      default:
        throw new Error(`Unknown step type: ${type}`);
    }
  }

  /**
   * Execute LLM step
   */
  async executeLLMStep(config, input, context) {
    const { systemPrompt, template, temperature = 0.7, maxTokens = 500 } = config;

    // Build prompt from template
    const prompt = this.renderTemplate(template, { input, ...context });

    const messages = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const response = await hfClient.chat(messages, { temperature, maxTokens });

    return response.content;
  }

  /**
   * Execute retrieval step (RAG)
   */
  async executeRetrievalStep(config, input, context) {
    const { topK = 5, filters = {} } = config;

    const results = await ragEngine.processQuery(input, context.conversationHistory || [], {
      topK,
      filters
    });

    return results;
  }

  /**
   * Execute memory step
   */
  async executeMemoryStep(config, input, context) {
    const { action, userId, conversationId } = config;

    switch (action) {
      case 'retrieve':
        return await memorySystem.buildMemoryContext(userId, conversationId, input);

      case 'store':
        return await memorySystem.storeConversation(userId, conversationId, {
          role: 'user',
          content: input,
          timestamp: new Date().toISOString()
        });

      case 'extract_facts':
        return await memorySystem.extractFactsFromConversation([{ role: 'user', content: input }]);

      default:
        throw new Error(`Unknown memory action: ${action}`);
    }
  }

  /**
   * Execute transform step
   */
  async executeTransformStep(config, input, context) {
    const { transform } = config;

    if (typeof transform === 'function') {
      return await transform(input, context);
    }

    throw new Error('Transform step requires a transform function');
  }

  /**
   * Render template with variables
   */
  renderTemplate(template, variables) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  }
}

// Create singleton instance
const chainSystem = new ChainSystem();

// ============================================================================
// PRE-BUILT CHAINS
// ============================================================================

/**
 * Mediator Search Chain
 * 1. Retrieve user preferences from memory
 * 2. Search mediators using RAG
 * 3. Generate personalized recommendations
 */
chainSystem.registerChain('mediator_search', [
  {
    name: 'retrieve_preferences',
    type: 'memory',
    config: {
      action: 'retrieve',
      userId: '{{userId}}',
      conversationId: '{{conversationId}}'
    }
  },
  {
    name: 'search_mediators',
    type: 'retrieval',
    config: {
      topK: 10,
      filters: {}
    }
  },
  {
    name: 'generate_recommendations',
    type: 'llm',
    config: {
      systemPrompt: 'You are FairMediator AI. Generate personalized mediator recommendations.',
      template: `Based on the user's query: "{{input}}"

Available mediators and their match scores:
{{searchResults}}

Provide a personalized recommendation highlighting the best matches and why they fit the user's needs.`,
      temperature: 0.5,
      maxTokens: 600
    }
  }
]);

/**
 * Conflict Analysis Chain
 * 1. Extract parties from query
 * 2. Check conflicts for mediators
 * 3. Generate risk assessment
 */
chainSystem.registerChain('conflict_analysis', [
  {
    name: 'extract_parties',
    type: 'llm',
    config: {
      systemPrompt: 'Extract party names from legal text.',
      template: `Extract all party names from this text: "{{input}}"

Return ONLY a JSON array: ["Party 1", "Party 2"]`,
      temperature: 0.2,
      maxTokens: 200
    }
  },
  {
    name: 'check_conflicts',
    type: 'custom',
    config: {
      execute: async (parties, context) => {
        // Custom conflict checking logic
        const Mediator = require('../../models/Mediator');
        const mediators = await Mediator.find().limit(10);

        // Parse parties from JSON
        let partyList = [];
        try {
          const jsonMatch = parties.match(/\[[\s\S]*?\]/);
          if (jsonMatch) {
            partyList = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          logger.error('Error parsing parties:', e);
        }

        // Check conflicts
        const conflicts = [];
        for (const mediator of mediators) {
          const mediatorConflicts = await mediator.detectConflicts(partyList);
          if (mediatorConflicts.length > 0) {
            conflicts.push({
              mediatorName: mediator.name,
              conflicts: mediatorConflicts
            });
          }
        }

        return conflicts;
      }
    }
  },
  {
    name: 'generate_risk_assessment',
    type: 'llm',
    config: {
      systemPrompt: 'You are a legal conflict assessment AI.',
      template: `Conflicts detected:
{{input}}

Provide a risk assessment and recommendations for handling these conflicts.`,
      temperature: 0.4,
      maxTokens: 500
    }
  }
]);

/**
 * Conversation Summarization Chain
 * 1. Retrieve conversation history
 * 2. Summarize key points
 * 3. Extract facts to remember
 * 4. Store in long-term memory
 */
chainSystem.registerChain('conversation_summary', [
  {
    name: 'retrieve_history',
    type: 'memory',
    config: {
      action: 'retrieve',
      userId: '{{userId}}',
      conversationId: '{{conversationId}}'
    }
  },
  {
    name: 'summarize',
    type: 'llm',
    config: {
      systemPrompt: 'Summarize conversation history concisely.',
      template: `Conversation history:
{{input}}

Provide a 2-3 sentence summary of key points and decisions.`,
      temperature: 0.3,
      maxTokens: 200
    }
  },
  {
    name: 'extract_facts',
    type: 'memory',
    config: {
      action: 'extract_facts'
    }
  }
]);

module.exports = chainSystem;
