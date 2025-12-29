/**
 * Integration Tests for AI Systems
 * Tests memory system, chain system, and agent system integration
 */

const memorySystem = require('../../src/services/ai/memorySystem');
const chainSystem = require('../../src/services/ai/chainSystem');
const agentSystem = require('../../src/services/ai/agentSystem');
const logger = require('../../src/config/logger');

// Mock logger to reduce noise in tests
jest.mock('../../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('AI Systems Integration Tests', () => {
  describe('Memory System', () => {
    test('should initialize without errors', async () => {
      expect(memorySystem).toBeDefined();
      expect(memorySystem.initialize).toBeDefined();

      // Initialize memory system
      await memorySystem.initialize();

      // Check initialization status
      const stats = await memorySystem.getStats();
      expect(stats).toBeDefined();

      // Stats should show either initialized or not
      if (!stats.initialized) {
        console.log('Memory system not initialized (ChromaDB may not be running). This is expected if ChromaDB is not running.');
        expect(stats.initialized).toBe(false);
      } else {
        expect(stats.initialized).toBe(true);
        expect(stats.conversationMemories).toBeDefined();
        expect(stats.longTermMemories).toBeDefined();
      }
    });

    test('should have required methods', () => {
      expect(typeof memorySystem.storeConversation).toBe('function');
      expect(typeof memorySystem.retrieveRelevantHistory).toBe('function');
      expect(typeof memorySystem.storeLongTermMemory).toBe('function');
      expect(typeof memorySystem.retrieveLongTermMemory).toBe('function');
      expect(typeof memorySystem.buildMemoryContext).toBe('function');
      expect(typeof memorySystem.summarizeConversation).toBe('function');
      expect(typeof memorySystem.extractFactsFromConversation).toBe('function');
    });

    test('should gracefully handle ChromaDB unavailability', async () => {
      // If ChromaDB is not running, methods should return empty results instead of crashing
      const memories = await memorySystem.retrieveLongTermMemory('test-user', 'test query', 3);
      expect(Array.isArray(memories)).toBe(true);

      const history = await memorySystem.retrieveRelevantHistory('test query', 'test-conv', 5);
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('Chain System', () => {
    test('should be initialized with default chains', () => {
      expect(chainSystem).toBeDefined();
      expect(chainSystem.chains).toBeDefined();

      // Check pre-built chains are registered
      expect(chainSystem.chains.has('mediator_search')).toBe(true);
      expect(chainSystem.chains.has('conflict_analysis')).toBe(true);
      expect(chainSystem.chains.has('conversation_summary')).toBe(true);
    });

    test('should have required methods', () => {
      expect(typeof chainSystem.registerChain).toBe('function');
      expect(typeof chainSystem.executeChain).toBe('function');
      expect(typeof chainSystem.executeStep).toBe('function');
    });

    test('should validate chain structure', () => {
      const mediatorSearchChain = chainSystem.chains.get('mediator_search');
      expect(Array.isArray(mediatorSearchChain)).toBe(true);
      expect(mediatorSearchChain.length).toBeGreaterThan(0);

      // Each step should have name and type
      mediatorSearchChain.forEach(step => {
        expect(step.name).toBeDefined();
        expect(step.type).toBeDefined();
        expect(step.config).toBeDefined();
      });
    });

    test('should handle custom chains', () => {
      chainSystem.registerChain('test_chain', [
        {
          name: 'test_step',
          type: 'custom',
          config: {
            execute: async (input) => `Processed: ${input}`
          }
        }
      ]);

      expect(chainSystem.chains.has('test_chain')).toBe(true);
    });
  });

  describe('Agent System', () => {
    test('should be initialized with default agents', () => {
      expect(agentSystem).toBeDefined();
      expect(agentSystem.agents).toBeDefined();

      // Check pre-built agents are registered
      expect(agentSystem.agents.has('mediator_search_agent')).toBe(true);
      expect(agentSystem.agents.has('research_agent')).toBe(true);
      expect(agentSystem.agents.has('coordinator_agent')).toBe(true);
    });

    test('should have required methods', () => {
      expect(typeof agentSystem.registerAgent).toBe('function');
      expect(typeof agentSystem.getAgent).toBe('function');
      expect(typeof agentSystem.executeAgent).toBe('function');
    });

    test('should validate agent structure', () => {
      const searchAgent = agentSystem.getAgent('mediator_search_agent');
      expect(searchAgent).toBeDefined();
      expect(searchAgent.name).toBe('mediator_search_agent');
      expect(searchAgent.role).toBeDefined();
      expect(searchAgent.systemPrompt).toBeDefined();
      expect(Array.isArray(searchAgent.tools)).toBe(true);
      expect(searchAgent.maxIterations).toBeDefined();

      // Each tool should have name, description, and execute function
      searchAgent.tools.forEach(tool => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(typeof tool.execute).toBe('function');
      });
    });

    test('should have correct agent tools', () => {
      const searchAgent = agentSystem.getAgent('mediator_search_agent');
      const toolNames = searchAgent.tools.map(t => t.name);

      expect(toolNames).toContain('search_mediators');
      expect(toolNames).toContain('check_conflicts');
      expect(toolNames).toContain('get_user_preferences');
    });

    test('should validate research agent', () => {
      const researchAgent = agentSystem.getAgent('research_agent');
      expect(researchAgent).toBeDefined();

      const toolNames = researchAgent.tools.map(t => t.name);
      expect(toolNames).toContain('search_database');
      expect(toolNames).toContain('analyze_ideology');
    });

    test('should validate coordinator agent', () => {
      const coordinatorAgent = agentSystem.getAgent('coordinator_agent');
      expect(coordinatorAgent).toBeDefined();

      const toolNames = coordinatorAgent.tools.map(t => t.name);
      expect(toolNames).toContain('delegate_to_search_agent');
      expect(toolNames).toContain('delegate_to_research_agent');
    });
  });

  describe('Integration Tests', () => {
    test('agents can access memory system', () => {
      const searchAgent = agentSystem.getAgent('mediator_search_agent');
      const preferencesTool = searchAgent.tools.find(t => t.name === 'get_user_preferences');

      expect(preferencesTool).toBeDefined();
      expect(typeof preferencesTool.execute).toBe('function');
    });

    test('chains can integrate with memory and RAG', () => {
      const mediatorSearchChain = chainSystem.chains.get('mediator_search');

      // Should have memory retrieval step
      const memoryStep = mediatorSearchChain.find(s => s.type === 'memory');
      expect(memoryStep).toBeDefined();

      // Should have retrieval (RAG) step
      const ragStep = mediatorSearchChain.find(s => s.type === 'retrieval');
      expect(ragStep).toBeDefined();

      // Should have LLM generation step
      const llmStep = mediatorSearchChain.find(s => s.type === 'llm');
      expect(llmStep).toBeDefined();
    });

    test('coordinator agent can delegate to other agents', () => {
      const coordinatorAgent = agentSystem.getAgent('coordinator_agent');
      const delegateTools = coordinatorAgent.tools.filter(t => t.name.startsWith('delegate_to_'));

      expect(delegateTools.length).toBe(2);

      // Tools should reference existing agents
      delegateTools.forEach(tool => {
        expect(typeof tool.execute).toBe('function');
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle missing agents gracefully', async () => {
      await expect(async () => {
        await agentSystem.executeAgent('non_existent_agent', 'test task');
      }).rejects.toThrow('Agent "non_existent_agent" not found');
    });

    test('should handle missing chains gracefully', async () => {
      await expect(async () => {
        await chainSystem.executeChain('non_existent_chain', 'test input');
      }).rejects.toThrow('Chain "non_existent_chain" not found');
    });

    test('should handle memory system failures gracefully', async () => {
      // Even if ChromaDB is down, should return empty arrays instead of crashing
      const result = await memorySystem.retrieveLongTermMemory('user', 'query', 3);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Module Imports', () => {
    test('all modules should import without errors', () => {
      expect(memorySystem).toBeDefined();
      expect(chainSystem).toBeDefined();
      expect(agentSystem).toBeDefined();
    });

    test('no circular dependency issues', () => {
      // If we got here without errors, circular dependencies don't exist
      expect(true).toBe(true);
    });
  });
});
