/**
 * Dashboard & Analytics API Tests
 * Tests usage stats, trends, and platform analytics
 */

const request = require('supertest');
const app = require('../src/server');
const User = require('../src/models/User');
const UsageLog = require('../src/models/UsageLog');
const Mediator = require('../src/models/Mediator');
const mongoose = require('mongoose');

describe('Dashboard API', () => {
  let freeUserToken;
  let premiumUserToken;
  let freeUserId;
  let premiumUserId;

  beforeAll(async () => {
    // Create free tier user
    const freeUser = await User.create({
      email: 'dashboard-free@example.com',
      password: 'SecurePass123!',
      name: 'Free User',
      emailVerified: true,
      subscriptionTier: 'free'
    });
    freeUserId = freeUser._id;
    freeUserToken = freeUser.generateAccessToken();

    // Create premium tier user
    const premiumUser = await User.create({
      email: 'dashboard-premium@example.com',
      password: 'SecurePass123!',
      name: 'Premium User',
      emailVerified: true,
      subscriptionTier: 'premium'
    });
    premiumUserId = premiumUser._id;
    premiumUserToken = premiumUser.generateAccessToken();

    // Create usage logs for free user
    const now = new Date();
    for (let i = 0; i < 10; i++) {
      await UsageLog.create({
        user: freeUserId,
        eventType: 'search',
        timestamp: new Date(now - i * 24 * 60 * 60 * 1000),
        metadata: { filters: { practiceArea: 'Family Law' } }
      });
    }

    // Create more usage logs
    await UsageLog.create({
      user: freeUserId,
      eventType: 'profileView',
      metadata: { mediatorId: 'test_mediator_1' }
    });

    await UsageLog.create({
      user: freeUserId,
      eventType: 'aiCall',
      metadata: { query: 'Find mediator for tech dispute' }
    });
  });

  afterAll(async () => {
    await User.deleteMany({ email: /dashboard-/ });
    await UsageLog.deleteMany({ user: { $in: [freeUserId, premiumUserId] } });
    await mongoose.connection.close();
  });

  describe('GET /api/dashboard/stats', () => {
    test('should return user stats for authenticated user', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats?days=30')
        .set('Authorization', `Bearer ${freeUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalActions');
      expect(res.body.data).toHaveProperty('byType');
      expect(res.body.data).toHaveProperty('dailyActivity');
      expect(res.body.data.byType.search).toBeGreaterThan(0);
    });

    test('should filter by time range', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats?days=7')
        .set('Authorization', `Bearer ${freeUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.dailyActivity.length).toBeLessThanOrEqual(7);
    });

    test('should require authentication', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/dashboard/trends', () => {
    test('should return search trends', async () => {
      const res = await request(app)
        .get('/api/dashboard/trends?days=30')
        .set('Authorization', `Bearer ${freeUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('topPracticeAreas');
    });

    test('should require authentication', async () => {
      const res = await request(app)
        .get('/api/dashboard/trends');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/dashboard/popular-mediators', () => {
    test('should return most viewed mediators', async () => {
      const res = await request(app)
        .get('/api/dashboard/popular-mediators?days=30&limit=10')
        .set('Authorization', `Bearer ${freeUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('should respect limit parameter', async () => {
      const res = await request(app)
        .get('/api/dashboard/popular-mediators?limit=5')
        .set('Authorization', `Bearer ${freeUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/dashboard/platform', () => {
    test('should return platform stats for premium users', async () => {
      const res = await request(app)
        .get('/api/dashboard/platform?days=30')
        .set('Authorization', `Bearer ${premiumUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalUsers');
      expect(res.body.data).toHaveProperty('activeUsers');
      expect(res.body.data).toHaveProperty('totalSearches');
    });

    test('should reject free tier users', async () => {
      const res = await request(app)
        .get('/api/dashboard/platform')
        .set('Authorization', `Bearer ${freeUserToken}`);

      expect(res.status).toBe(403);
    });

    test('should require authentication', async () => {
      const res = await request(app)
        .get('/api/dashboard/platform');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/dashboard/conversion-funnel', () => {
    test('should return conversion funnel for premium users', async () => {
      const res = await request(app)
        .get('/api/dashboard/conversion-funnel?days=30')
        .set('Authorization', `Bearer ${premiumUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('registrations');
      expect(res.body.data).toHaveProperty('searches');
      expect(res.body.data).toHaveProperty('profileViews');
      expect(res.body.data).toHaveProperty('upgrades');
    });

    test('should reject free tier users', async () => {
      const res = await request(app)
        .get('/api/dashboard/conversion-funnel')
        .set('Authorization', `Bearer ${freeUserToken}`);

      expect(res.status).toBe(403);
    });
  });
});
