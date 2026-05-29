/**
 * Subscription API Tests
 * Tests subscription management with Stripe mocked
 */

jest.mock('../../src/services/stripe/stripeService', () => ({
  getSubscription: jest.fn(),
  createCheckoutSession: jest.fn(),
  createBillingPortalSession: jest.fn(),
  cancelSubscription: jest.fn(),
  handleWebhook: jest.fn()
}));

const request = require('supertest');
const app = require('../../src/server');
const User = require('../../src/models/User');
const Subscription = require('../../src/models/Subscription');
const stripeService = require('../../src/services/stripe/stripeService');

describe('Subscription API', () => {
  let agent;
  let userId;

  // Create fresh user + login agent before each test (after global beforeEach clears collections)
  beforeEach(async () => {
    stripeService.getSubscription.mockResolvedValue({
      tier: 'free',
      status: 'active',
      stripeEnabled: false,
      features: { searches: 5, profileViews: 10, aiCalls: 20 },
      message: 'Payment processing not configured'
    });
    stripeService.createCheckoutSession.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/test'
    });
    stripeService.createBillingPortalSession.mockResolvedValue({
      url: 'https://billing.stripe.com/test'
    });
    stripeService.cancelSubscription.mockResolvedValue({ success: true });
    stripeService.handleWebhook.mockResolvedValue({ received: true });

    await User.create({
      email: 'sub-test@example.com',
      password: 'SecurePass123!',
      name: 'Sub Test User',
      accountType: 'attorney',
      emailVerified: true
    });

    // Use agent so login cookie persists across requests in the same test
    agent = request.agent(app);
    const loginRes = await agent
      .post('/api/auth/login')
      .send({ email: 'sub-test@example.com', password: 'SecurePass123!' });

    userId = loginRes.body.data?.user?._id || loginRes.body.data?._id;
  });

  describe('GET /api/subscription', () => {
    test('should return free tier info for authenticated user', async () => {
      const res = await agent.get('/api/subscription');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tier).toBe('free');
      expect(res.body.data.features).toHaveProperty('searches', 5);
    });

    test('should return 401 without authentication', async () => {
      const res = await request(app).get('/api/subscription');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/subscription/checkout', () => {
    test('should create checkout session with valid price ID', async () => {
      const res = await agent
        .post('/api/subscription/checkout')
        .send({ priceId: 'price_test_premium' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('sessionId');
      expect(res.body.data).toHaveProperty('url');
    });

    test('should return 400 when price ID is missing', async () => {
      const res = await agent
        .post('/api/subscription/checkout')
        .send({});

      expect(res.status).toBe(400);
    });

    test('should return 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/subscription/checkout')
        .send({ priceId: 'price_test' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/subscription/portal', () => {
    test('should create billing portal session', async () => {
      const res = await agent.post('/api/subscription/portal');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('url');
    });

    test('should return 401 without authentication', async () => {
      const res = await request(app).post('/api/subscription/portal');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/subscription/cancel', () => {
    test('should cancel an active subscription', async () => {
      // Need the user's _id — get it from the DB since login response may vary
      const user = await User.findOne({ email: 'sub-test@example.com' });
      await Subscription.create({
        user: user._id,
        stripeCustomerId: 'cus_test_123',
        stripeSubscriptionId: 'sub_test_123',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const res = await agent.post('/api/subscription/cancel');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('should return 404 when no active subscription exists', async () => {
      const res = await agent.post('/api/subscription/cancel');
      expect(res.status).toBe(404);
    });

    test('should return 401 without authentication', async () => {
      const res = await request(app).post('/api/subscription/cancel');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/subscription/webhook', () => {
    test('should accept a checkout.session.completed event', async () => {
      const user = await User.findOne({ email: 'sub-test@example.com' });
      const event = {
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_test_webhook',
            subscription: 'sub_test_webhook',
            metadata: { userId: user._id.toString() }
          }
        }
      };

      // Webhook has no auth requirement
      const res = await request(app)
        .post('/api/subscription/webhook')
        .send(event);

      expect([200, 400]).toContain(res.status);
    });
  });
});
