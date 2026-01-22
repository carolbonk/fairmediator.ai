/**
 * Dashboard Integration Tests
 * Tests dashboard analytics and statistics endpoints
 */

const request = require('supertest');
const app = require('../../src/server');
const User = require('../../src/models/User');
const UsageLog = require('../../src/models/UsageLog');
const Mediator = require('../../src/models/Mediator');
const { expectSuccess, expectError, authenticatedRequest } = require('../helpers/testHelpers');

describe('Dashboard API', () => {
  let authToken;
  let testUser;
  let premiumUser;
  let premiumToken;

  beforeEach(async () => {
    // Create free tier test user
    testUser = await User.create({
      email: 'dashboard@example.com',
      password: 'SecurePass123!',
      name: 'Dashboard User',
      emailVerified: true,
      subscriptionTier: 'free'
    });

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'dashboard@example.com',
        password: 'SecurePass123!'
      });

    if (!loginResponse.body.success || !loginResponse.body.data) {
      console.log('Login failed:', loginResponse.body);
      throw new Error('Failed to login test user');
    }

    authToken = loginResponse.body.data.token;

    // Create premium user for tier-restricted endpoints
    premiumUser = await User.create({
      email: 'premium@example.com',
      password: 'SecurePass123!',
      name: 'Premium User',
      emailVerified: true,
      subscriptionTier: 'premium'
    });

    const premiumLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'premium@example.com',
        password: 'SecurePass123!'
      });

    premiumToken = premiumLoginResponse.body.data.token;

    // Create some test usage logs
    await UsageLog.create({
      user: testUser._id,
      eventType: 'search',
      metadata: { filters: { practiceArea: 'Employment' }, resultCount: 5 },
      timestamp: new Date()
    });

    await UsageLog.create({
      user: testUser._id,
      eventType: 'profileView',
      metadata: {},
      timestamp: new Date()
    });
  });

  // Cleanup handled by setup.js beforeEach

  describe('GET /api/dashboard/stats', () => {
    it('should return user statistics for authenticated user', async () => {
      const response = await authenticatedRequest(app, 'get', '/api/dashboard/stats', authToken);

      expectSuccess(response, 200);
      expect(response.body.data).toHaveProperty('totalActions');
      expect(response.body.data).toHaveProperty('byType');
      expect(response.body.data).toHaveProperty('dailyActivity');
      expect(response.body.data).toHaveProperty('period');
      expect(response.body.data).toHaveProperty('topPracticeAreas');
    });

    it('should accept days query parameter', async () => {
      const response = await authenticatedRequest(app, 'get', '/api/dashboard/stats?days=7', authToken);

      expectSuccess(response, 200);
      expect(response.body.data).toBeDefined();
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats');

      expectError(response, 401);
    });
  });

  describe('GET /api/dashboard/trends', () => {
    it('should return search trends for authenticated user', async () => {
      const response = await authenticatedRequest(app, 'get', '/api/dashboard/trends', authToken);

      expectSuccess(response, 200);
      expect(response.body.data).toBeDefined();
    });

    it('should accept days query parameter', async () => {
      const response = await authenticatedRequest(app, 'get', '/api/dashboard/trends?days=14', authToken);

      expectSuccess(response, 200);
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/dashboard/trends');

      expectError(response, 401);
    });
  });

  describe('GET /api/dashboard/popular-mediators', () => {
    it('should return popular mediators list', async () => {
      const response = await authenticatedRequest(app, 'get', '/api/dashboard/popular-mediators', authToken);

      expectSuccess(response, 200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should accept limit query parameter', async () => {
      const response = await authenticatedRequest(app, 'get', '/api/dashboard/popular-mediators?limit=5', authToken);

      expectSuccess(response, 200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/dashboard/popular-mediators');

      expectError(response, 401);
    });
  });

  describe('GET /api/dashboard/platform', () => {
    it('should return platform stats for premium users', async () => {
      const response = await authenticatedRequest(app, 'get', '/api/dashboard/platform', premiumToken);

      expectSuccess(response, 200);
      expect(response.body.data).toBeDefined();
    });

    it('should reject free tier users', async () => {
      const response = await authenticatedRequest(app, 'get', '/api/dashboard/platform', authToken);

      expectError(response, 403);
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/dashboard/platform');

      expectError(response, 401);
    });
  });

  describe('GET /api/dashboard/conversion-funnel', () => {
    it('should return conversion funnel for premium users', async () => {
      const response = await authenticatedRequest(app, 'get', '/api/dashboard/conversion-funnel', premiumToken);

      expectSuccess(response, 200);
      expect(response.body.data).toBeDefined();
    });

    it('should reject free tier users', async () => {
      const response = await authenticatedRequest(app, 'get', '/api/dashboard/conversion-funnel', authToken);

      expectError(response, 403);
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/dashboard/conversion-funnel');

      expectError(response, 401);
    });
  });
});
