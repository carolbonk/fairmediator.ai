/**
 * Chat API Tests
 * Tests for AI-powered chat with emotion detection and usage tracking
 * DRY: Reuses test patterns from auth.test.js and mediators.test.js
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server');
const User = require('../src/models/User');
const Mediator = require('../src/models/Mediator');
const UsageLog = require('../src/models/UsageLog');
const Subscription = require('../src/models/Subscription');

describe('Chat API', () => {
  let testUser;
  let testToken;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  });

  afterAll(async () => {
    // Clean up and close connection
    await User.deleteMany({});
    await Mediator.deleteMany({});
    await UsageLog.deleteMany({});
    await Subscription.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear test data
    await User.deleteMany({});
    await Mediator.deleteMany({});
    await UsageLog.deleteMany({});
    await Subscription.deleteMany({});

    // Create test user
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
      });

    testUser = userResponse.body.data.user;
    testToken = userResponse.body.data.accessToken;

    // Create test mediators
    await Mediator.create([
      {
        name: 'John Doe',
        email: 'john@example.com',
        practiceAreas: ['Civil Rights', 'Employment'],
        yearsExperience: 15,
        location: { city: 'San Francisco', state: 'CA' },
        ideologyScore: -1.2,
        rating: 4.5,
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        practiceAreas: ['Business', 'Corporate'],
        yearsExperience: 20,
        location: { city: 'New York', state: 'NY' },
        ideologyScore: 0.5,
        rating: 4.8,
      },
    ]);
  });

  describe('POST /api/chat - AI chat with usage tracking', () => {
    it('should process chat message and track usage', async () => {
      const response = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          message: 'I need a mediator for an employment dispute',
          history: []
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();
      expect(response.body.model).toBeDefined();
      expect(response.body.usage.aiCallsToday).toBe(1);
      expect(response.body.usage.aiCallLimit).toBe(20);

      // Check emotion detection results
      expect(response.body.emotion).toBeDefined();
      expect(response.body.emotion.user).toBeDefined();
      expect(response.body.emotion.assistant).toBeDefined();

      // Verify usage log was created
      const usageLog = await UsageLog.findOne({
        user: testUser._id,
        eventType: 'ai_call',
      });
      expect(usageLog).toBeDefined();
      expect(usageLog.metadata.messageLength).toBeGreaterThan(0);
    });

    it('should handle conversation history', async () => {
      const response = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          message: 'What about New York?',
          history: [
            { role: 'user', content: 'I need a mediator in California' },
            { role: 'assistant', content: 'Here are mediators in California...' }
          ]
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();

      // Check that history was logged
      const usageLog = await UsageLog.findOne({
        user: testUser._id,
        eventType: 'ai_call',
      });
      expect(usageLog.metadata.historyLength).toBe(2);
    });

    it('should enforce daily AI call limit for free tier', async () => {
      // Use up all 20 calls
      for (let i = 0; i < 20; i++) {
        await request(app)
          .post('/api/chat')
          .set('Authorization', `Bearer ${testToken}`)
          .send({
            message: `Test message ${i}`,
            history: []
          })
          .expect(200);
      }

      // 21st call should fail
      const response = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          message: 'This should fail',
          history: []
        })
        .expect(403);

      expect(response.body.error).toContain('daily AI call limit');
    });

    it('should not enforce limit for premium users', async () => {
      // Upgrade user to premium
      await User.findByIdAndUpdate(testUser._id, { subscriptionTier: 'premium' });

      // Perform more than 20 calls
      for (let i = 0; i < 22; i++) {
        await request(app)
          .post('/api/chat')
          .set('Authorization', `Bearer ${testToken}`)
          .send({
            message: `Premium test ${i}`,
            history: []
          })
          .expect(200);
      }

      const response = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          message: 'Premium unlimited',
          history: []
        })
        .expect(200);

      expect(response.body.usage.aiCallLimit).toBe('unlimited');
    });

    it('should validate required fields', async () => {
      await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          history: []
        })
        .expect(400);

      await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          message: 123 // Invalid type
        })
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/chat')
        .send({
          message: 'Test',
          history: []
        })
        .expect(401);
    });

    it('should include emotion detection in response', async () => {
      const response = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          message: 'I am very angry about this dispute!',
          history: []
        })
        .expect(200);

      expect(response.body.emotion).toBeDefined();
      expect(response.body.emotion.user).toHaveProperty('emotion');
      expect(response.body.emotion.user).toHaveProperty('sentiment');
      expect(response.body.emotion.user).toHaveProperty('confidence');
      expect(response.body.emotion.assistant).toHaveProperty('emotion');
    });
  });
});
