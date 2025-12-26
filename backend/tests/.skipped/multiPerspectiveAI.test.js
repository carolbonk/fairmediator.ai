/**
 * Multi-Perspective AI Tests
 * Tests liberal, neutral, and conservative AI agents
 */

// Skip entire suite if no API key
if (!process.env.HUGGINGFACE_API_KEY) {
  describe.skip('MultiPerspectiveAgents (SKIPPED - No HUGGINGFACE_API_KEY)', () => {
    test('placeholder', () => {
      console.log('⚠️  Get FREE HuggingFace API key at: https://huggingface.co/settings/tokens');
    });
  });
} else {

const MultiPerspectiveAgents = require('../src/services/huggingface/multiPerspectiveAgents');
const skipTests = false;

describe('MultiPerspectiveAgents', () => {
  let agents;

  beforeAll(() => {
    if (skipTests) {
      console.log('⚠️  Skipping MultiPerspectiveAgents tests - HUGGINGFACE_API_KEY not set');
      console.log('   Get FREE at: https://huggingface.co/settings/tokens');
      return;
    }
    agents = new MultiPerspectiveAgents();
  });

  describe('getAllPerspectives', () => {
    (skipTests ? test.skip : test)('should return responses from all three perspectives', async () => {
      const message = 'What factors should I consider when choosing a mediator for a labor dispute?';
      const result = await agents.getAllPerspectives(message, []);

      expect(result).toHaveProperty('liberal');
      expect(result).toHaveProperty('neutral');
      expect(result).toHaveProperty('conservative');

      expect(result.liberal).toHaveProperty('message');
      expect(result.neutral).toHaveProperty('message');
      expect(result.conservative).toHaveProperty('message');

      expect(result.liberal.perspective).toBe('liberal');
      expect(result.neutral.perspective).toBe('neutral');
      expect(result.conservative.perspective).toBe('conservative');
    }, 30000); // 30s timeout for API calls

    (skipTests ? test.skip : test)('should include perspective icons', async () => {
      const message = 'Test question';
      const result = await agents.getAllPerspectives(message, []);

      expect(result.liberal.icon).toBe('🔵');
      expect(result.neutral.icon).toBe('⚪');
      expect(result.conservative.icon).toBe('🔴');
    }, 30000);

    (skipTests ? test.skip : test)('should handle conversation history', async () => {
      const history = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi, how can I help?' }
      ];
      const message = 'Continue our discussion';

      const result = await agents.getAllPerspectives(message, history);

      expect(result.liberal).toHaveProperty('message');
      expect(result.neutral).toHaveProperty('message');
      expect(result.conservative).toHaveProperty('message');
    }, 30000);

    (skipTests ? test.skip : test)('should handle errors gracefully', async () => {
      // Invalid input
      const result = await agents.getAllPerspectives('', []);

      // Should still return structure even with errors
      expect(result).toHaveProperty('liberal');
      expect(result).toHaveProperty('neutral');
      expect(result).toHaveProperty('conservative');
    }, 30000);
  });

  describe('getPerspectiveByName', () => {
    (skipTests ? test.skip : test)('should return liberal perspective', async () => {
      const result = await agents.getPerspectiveByName('liberal', 'Test question', []);

      expect(result.perspective).toBe('liberal');
      expect(result.icon).toBe('🔵');
      expect(result).toHaveProperty('message');
    }, 30000);

    (skipTests ? test.skip : test)('should return neutral perspective', async () => {
      const result = await agents.getPerspectiveByName('neutral', 'Test question', []);

      expect(result.perspective).toBe('neutral');
      expect(result.icon).toBe('⚪');
    }, 30000);

    (skipTests ? test.skip : test)('should return conservative perspective', async () => {
      const result = await agents.getPerspectiveByName('conservative', 'Test question', []);

      expect(result.perspective).toBe('conservative');
      expect(result.icon).toBe('🔴');
    }, 30000);

    (skipTests ? test.skip : test)('should throw error for invalid perspective', async () => {
      await expect(
        agents.getPerspectiveByName('invalid', 'Test', [])
      ).rejects.toThrow();
    });
  });

  describe('compareResponses', () => {
    (skipTests ? test.skip : test)('should return structured comparison of all perspectives', async () => {
      const message = 'Should mediators disclose political affiliations?';
      const comparison = await agents.compareResponses(message, []);

      expect(comparison).toHaveProperty('question');
      expect(comparison).toHaveProperty('perspectives');
      expect(comparison.perspectives).toHaveLength(3);

      expect(comparison.perspectives[0]).toHaveProperty('name');
      expect(comparison.perspectives[0]).toHaveProperty('icon');
      expect(comparison.perspectives[0]).toHaveProperty('response');
    }, 30000);

    (skipTests ? test.skip : test)('should include summary of differences', async () => {
      const message = 'Test question';
      const comparison = await agents.compareResponses(message, []);

      expect(comparison).toHaveProperty('summary');
      expect(typeof comparison.summary).toBe('string');
    }, 30000);
  });
});

} // End conditional require
