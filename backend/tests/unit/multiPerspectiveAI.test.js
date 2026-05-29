/**
 * Multi-Perspective AI Tests
 * Tests liberal, neutral, and conservative AI agents
 */

jest.mock('../../src/services/huggingface/hfClient', () => ({
  chat: jest.fn(),
  extractStructured: jest.fn(),
  healthCheck: jest.fn().mockResolvedValue({ status: 'ok' }),
  featureExtraction: jest.fn().mockResolvedValue([])
}));

const hfClient = require('../../src/services/huggingface/hfClient');
const agents = require('../../src/services/huggingface/multiPerspectiveAgents');

beforeEach(() => {
  hfClient.chat.mockImplementation(async (messages) => {
    const systemPrompt = messages[0]?.content || '';
    let perspective = 'neutral';
    if (systemPrompt.includes('progressive')) perspective = 'liberal';
    else if (systemPrompt.includes('conservative')) perspective = 'conservative';
    return {
      content: `Balanced response from ${perspective} perspective on the topic.`,
      role: 'assistant',
      model: 'test-model',
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
    };
  });
});

describe('MultiPerspectiveAgents', () => {
  describe('getAllPerspectives', () => {
    test('should return responses from all three perspectives', async () => {
      const result = await agents.getAllPerspectives('What factors matter in mediator selection?', []);

      expect(result).toHaveProperty('liberal');
      expect(result).toHaveProperty('neutral');
      expect(result).toHaveProperty('conservative');

      expect(result.liberal).toHaveProperty('message');
      expect(result.neutral).toHaveProperty('message');
      expect(result.conservative).toHaveProperty('message');

      expect(result.liberal.perspective).toBe('liberal');
      expect(result.neutral.perspective).toBe('neutral');
      expect(result.conservative.perspective).toBe('conservative');
    });

    test('should include perspective icons', async () => {
      const result = await agents.getAllPerspectives('Test question', []);

      expect(result.liberal.icon).toBe('🔵');
      expect(result.neutral.icon).toBe('⚪');
      expect(result.conservative.icon).toBe('🔴');
    });

    test('should pass conversation history to each agent', async () => {
      const history = [
        { role: 'user', content: 'Previous question' },
        { role: 'assistant', content: 'Previous answer' }
      ];
      const result = await agents.getAllPerspectives('Follow-up question', history);

      expect(result.liberal).toHaveProperty('message');
      expect(result.neutral).toHaveProperty('message');
      expect(result.conservative).toHaveProperty('message');
    });

    test('should call hfClient.chat three times (once per perspective)', async () => {
      hfClient.chat.mockClear();
      await agents.getAllPerspectives('Test', []);
      expect(hfClient.chat).toHaveBeenCalledTimes(3);
    });
  });

  describe('getResponse', () => {
    test('should return liberal perspective with correct icon', async () => {
      const result = await agents.getResponse('liberal', 'Test question', []);

      expect(result.perspective).toBe('liberal');
      expect(result.icon).toBe('🔵');
      expect(result).toHaveProperty('message');
      expect(result.message.length).toBeGreaterThan(0);
    });

    test('should return neutral perspective with correct icon', async () => {
      const result = await agents.getResponse('neutral', 'Test question', []);

      expect(result.perspective).toBe('neutral');
      expect(result.icon).toBe('⚪');
    });

    test('should return conservative perspective with correct icon', async () => {
      const result = await agents.getResponse('conservative', 'Test question', []);

      expect(result.perspective).toBe('conservative');
      expect(result.icon).toBe('🔴');
    });

    test('should throw for invalid perspective', async () => {
      await expect(
        agents.getResponse('invalid', 'Test', [])
      ).rejects.toThrow();
    });
  });

  describe('compareResponses', () => {
    test('should return structured comparison with all three perspectives', async () => {
      const comparison = await agents.compareResponses(
        'Should mediators disclose political affiliations?',
        []
      );

      expect(comparison).toHaveProperty('question');
      expect(comparison).toHaveProperty('perspectives');
      expect(comparison.perspectives).toHaveLength(3);

      expect(comparison.perspectives[0]).toHaveProperty('name');
      expect(comparison.perspectives[0]).toHaveProperty('icon');
      expect(comparison.perspectives[0]).toHaveProperty('response');
    });

    test('should include a summary field', async () => {
      const comparison = await agents.compareResponses('Test question', []);

      expect(comparison).toHaveProperty('summary');
      expect(typeof comparison.summary).toBe('string');
    });

    test('should echo the question back in the result', async () => {
      const question = 'What makes a good mediator?';
      const comparison = await agents.compareResponses(question, []);

      expect(comparison.question).toBe(question);
    });
  });
});
