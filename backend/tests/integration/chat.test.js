/**
 * Chat Integration Tests
 * Tests chat endpoints with mocked HuggingFace API to avoid consuming free tier quota
 */

const request = require('supertest');
const app = require('../../src/server');
const chatService = require('../../src/services/huggingface/chatService');
const affiliationDetector = require('../../src/services/huggingface/affiliationDetector');
const ideologyClassifier = require('../../src/services/huggingface/ideologyClassifier');
const { expectSuccess, expectError } = require('../helpers/testHelpers');

describe('Chat API', () => {
  describe('POST /api/chat', () => {
    beforeEach(() => {
      // Mock chatService to avoid HuggingFace API calls
      jest.spyOn(chatService, 'processQuery').mockResolvedValue({
        response: 'Here are some mediators that match your criteria...',
        mediators: [
          {
            id: '123',
            name: 'Test Mediator',
            specializations: ['Commercial', 'Employment'],
            score: 0.95
          }
        ],
        confidence: 0.9
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should process a chat message successfully', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'I need a mediator for an employment dispute',
          history: []
        });

      expectSuccess(response, 200);
      expect(response.body.data).toHaveProperty('response');
      expect(response.body.data).toHaveProperty('mediators');
      expect(chatService.processQuery).toHaveBeenCalledWith('I need a mediator for an employment dispute', []);
    });

    it('should accept conversation history', async () => {
      const history = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi! How can I help?' }
      ];

      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'I need help finding a mediator',
          history
        });

      expectSuccess(response, 200);
      expect(chatService.processQuery).toHaveBeenCalledWith('I need help finding a mediator', history);
    });

    it('should reject empty message', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: '',
          history: []
        });

      expectError(response, 400);
    });

    it('should reject non-string message', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 123,
          history: []
        });

      expectError(response, 400);
    });

    it('should reject missing message', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          history: []
        });

      expectError(response, 400);
    });

    it('should handle errors from chat service', async () => {
      jest.spyOn(chatService, 'processQuery').mockRejectedValue(new Error('Chat service error'));

      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'test message',
          history: []
        });

      expectError(response, 500);
    });
  });

  describe('POST /api/chat/check-conflicts', () => {
    beforeEach(() => {
      // Mock affiliationDetector to avoid HuggingFace API calls
      jest.spyOn(affiliationDetector, 'detectConflicts').mockResolvedValue({
        hasConflicts: true,
        conflicts: [
          {
            party: 'ABC Corp',
            type: 'previous_client',
            riskLevel: 'high',
            description: 'Mediator previously represented ABC Corp in 2020'
          }
        ],
        riskLevel: 'high',
        recommendation: 'Consider alternate mediator due to potential conflict'
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should check for conflicts successfully', async () => {
      const response = await request(app)
        .post('/api/chat/check-conflicts')
        .send({
          mediatorId: '507f1f77bcf86cd799439011',
          parties: ['ABC Corp', 'XYZ Inc']
        });

      expectSuccess(response, 200);
      expect(response.body.data).toHaveProperty('hasConflicts');
      expect(response.body.data).toHaveProperty('conflicts');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(affiliationDetector.detectConflicts).toHaveBeenCalled();
    });

    it('should reject missing mediatorId', async () => {
      const response = await request(app)
        .post('/api/chat/check-conflicts')
        .send({
          parties: ['ABC Corp']
        });

      expectError(response, 400);
    });

    it('should reject missing parties', async () => {
      const response = await request(app)
        .post('/api/chat/check-conflicts')
        .send({
          mediatorId: '507f1f77bcf86cd799439011'
        });

      expectError(response, 400);
    });

    it('should reject empty parties array', async () => {
      const response = await request(app)
        .post('/api/chat/check-conflicts')
        .send({
          mediatorId: '507f1f77bcf86cd799439011',
          parties: []
        });

      expectError(response, 400);
    });
  });

  describe('POST /api/chat/analyze-ideology', () => {
    beforeEach(() => {
      // Mock ideologyClassifier to avoid HuggingFace API calls
      jest.spyOn(ideologyClassifier, 'classifyMediator').mockResolvedValue({
        ideology: 'neutral',
        score: 0.2,
        confidence: 0.85,
        factors: [
          'Balanced case history across political spectrum',
          'No strong political affiliations detected'
        ],
        summary: 'Mediator appears to maintain political neutrality'
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should analyze mediator ideology successfully', async () => {
      const response = await request(app)
        .post('/api/chat/analyze-ideology')
        .send({
          mediatorId: '507f1f77bcf86cd799439011'
        });

      expectSuccess(response, 200);
      expect(response.body.data).toHaveProperty('ideology');
      expect(response.body.data).toHaveProperty('score');
      expect(response.body.data).toHaveProperty('confidence');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(ideologyClassifier.classifyMediator).toHaveBeenCalled();
    });

    it('should reject missing mediatorId', async () => {
      const response = await request(app)
        .post('/api/chat/analyze-ideology')
        .send({});

      expectError(response, 400);
    });

    it('should handle classifier errors', async () => {
      jest.spyOn(ideologyClassifier, 'classifyMediator').mockRejectedValue(new Error('Classifier error'));

      const response = await request(app)
        .post('/api/chat/analyze-ideology')
        .send({
          mediatorId: '507f1f77bcf86cd799439011'
        });

      expectError(response, 500);
    });
  });

  describe('Not Implemented Endpoints', () => {
    it('POST /api/chat/enrich-mediator should return 501', async () => {
      const response = await request(app)
        .post('/api/chat/enrich-mediator')
        .send({ url: 'https://example.com' });

      expect(response.status).toBe(501);
      expect(response.body).toHaveProperty('error');
    });

    it('GET /api/chat/scraper-health should return 501', async () => {
      const response = await request(app)
        .get('/api/chat/scraper-health');

      expect(response.status).toBe(501);
      expect(response.body).toHaveProperty('error');
    });

    it('POST /api/chat/bulk-scrape should return 501', async () => {
      const response = await request(app)
        .post('/api/chat/bulk-scrape')
        .send({ urls: ['https://example.com'] });

      expect(response.status).toBe(501);
      expect(response.body).toHaveProperty('error');
    });
  });
});
