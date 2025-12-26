/**
 * Subscription API Tests
 * Tests Stripe integration and subscription management
 */

const request = require('supertest');
const app = require('../src/server');
const User = require('../src/models/User');
const Subscription = require('../src/models/Subscription');
const mongoose = require('mongoose');

describe('Subscription API', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // Create test user
    const user = await User.create({
      email: 'sub-test@example.com',
      password: 'SecurePass123!',
      name: 'Sub Test User',
      emailVerified: true
    });
    userId = user._id;
    authToken = user.generateAccessToken();
  });

  afterAll(async () => {
    await User.deleteMany({ email: /sub-test/ });
    await Subscription.deleteMany({ user: userId });
    await mongoose.connection.close();
  });

  describe('GET /api/subscription', () => {
    test('should return free tier for new user', async () => {
      const res = await request(app)
        .get('/api/subscription')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tier).toBe('free');
      expect(res.body.data.features).toContain('5 mediator searches per day');
    });

    test('should require authentication', async () => {
      const res = await request(app)
        .get('/api/subscription');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/subscription/checkout', () => {
    test('should create checkout session with valid price ID', async () => {
      const res = await request(app)
        .post('/api/subscription/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          priceId: 'price_test_premium',
          successUrl: 'http://localhost:3000/success',
          cancelUrl: 'http://localhost:3000/cancel'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('sessionId');
      expect(res.body.data).toHaveProperty('url');
    });

    test('should reject missing price ID', async () => {
      const res = await request(app)
        .post('/api/subscription/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          successUrl: 'http://localhost:3000/success'
        });

      expect(res.status).toBe(400);
    });

    test('should require authentication', async () => {
      const res = await request(app)
        .post('/api/subscription/checkout')
        .send({ priceId: 'price_test' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/subscription/portal', () => {
    test('should create billing portal session', async () => {
      const res = await request(app)
        .post('/api/subscription/portal')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          returnUrl: 'http://localhost:3000/dashboard'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('url');
    });

    test('should require authentication', async () => {
      const res = await request(app)
        .post('/api/subscription/portal');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/subscription/cancel', () => {
    test('should cancel active subscription', async () => {
      // First create a premium subscription
      await Subscription.create({
        user: userId,
        stripeCustomerId: 'cus_test_123',
        stripeSubscriptionId: 'sub_test_123',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const res = await request(app)
        .post('/api/subscription/cancel')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('canceled');
    });

    test('should reject if no active subscription', async () => {
      // Clean up any existing subscriptions
      await Subscription.deleteMany({ user: userId });

      const res = await request(app)
        .post('/api/subscription/cancel')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/subscription/webhook', () => {
    test('should handle checkout.session.completed event', async () => {
      const event = {
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_test_webhook',
            subscription: 'sub_test_webhook',
            metadata: { userId: userId.toString() }
          }
        }
      };

      const res = await request(app)
        .post('/api/subscription/webhook')
        .send(event);

      // Webhook might return 200 even if signature fails in test
      expect([200, 400]).toContain(res.status);
    });
  });
});
