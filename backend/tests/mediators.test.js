/**
 * Mediator API Tests
 * Tests for mediator search, profile views, and conflict checking with usage tracking
 * DRY: Reuses test patterns from auth.test.js
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server');
const User = require('../src/models/User');
const Mediator = require('../src/models/Mediator');
const UsageLog = require('../src/models/UsageLog');
const Subscription = require('../src/models/Subscription');

describe('Mediator API', () => {
  let testUser;
  let testToken;
  let testMediators;

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
    testMediators = await Mediator.create([
      {
        name: 'John Liberal',
        email: 'john@example.com',
        currentFirm: 'Progressive Law',
        practiceAreas: ['Civil Rights', 'Employment'],
        yearsExperience: 15,
        location: { city: 'San Francisco', state: 'CA' },
        ideologyScore: -1.5,
        ideologyLabel: 'STRONG_LIBERAL',
        rating: 4.5,
        knownAffiliations: [
          {
            entity: 'ACLU',
            type: 'organization',
            riskLevel: 'LOW',
            details: 'Board member',
          },
        ],
      },
      {
        name: 'Jane Conservative',
        email: 'jane@example.com',
        currentFirm: 'Traditional Law Group',
        practiceAreas: ['Business', 'Corporate'],
        yearsExperience: 20,
        location: { city: 'Dallas', state: 'TX' },
        ideologyScore: 1.8,
        ideologyLabel: 'STRONG_CONSERVATIVE',
        rating: 4.8,
        knownAffiliations: [
          {
            entity: 'Chamber of Commerce',
            type: 'organization',
            riskLevel: 'MEDIUM',
            details: 'Member',
          },
        ],
      },
      {
        name: 'Bob Neutral',
        email: 'bob@example.com',
        currentFirm: 'Balanced Mediation',
        practiceAreas: ['Family', 'Civil Rights'],
        yearsExperience: 10,
        location: { city: 'Chicago', state: 'IL' },
        ideologyScore: 0.1,
        ideologyLabel: 'NEUTRAL',
        rating: 4.2,
        knownAffiliations: [],
      },
    ]);
  });

  describe('GET /api/mediators - Search with usage tracking', () => {
    it('should search mediators and track usage', async () => {
      const response = await request(app)
        .get('/api/mediators')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.usage.searchesToday).toBe(1);
      expect(response.body.usage.searchLimit).toBe(5);

      // Verify usage log was created
      const usageLog = await UsageLog.findOne({
        user: testUser._id,
        eventType: 'search',
      });
      expect(usageLog).toBeDefined();
      expect(usageLog.metadata.resultCount).toBe(3);
    });

    it('should filter by ideology', async () => {
      const response = await request(app)
        .get('/api/mediators?ideology=liberal')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].ideologyLabel).toBe('STRONG_LIBERAL');
    });

    it('should filter by practice area', async () => {
      const response = await request(app)
        .get('/api/mediators?practiceArea=Civil Rights')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should exclude affiliations', async () => {
      const response = await request(app)
        .get('/api/mediators?excludeAffiliations=ACLU')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.find(m => m.name === 'John Liberal')).toBeUndefined();
    });

    it('should enforce daily search limit for free tier', async () => {
      // Use up all 5 searches
      for (let i = 0; i < 5; i++) {
        await request(app)
          .get('/api/mediators')
          .set('Authorization', `Bearer ${testToken}`)
          .expect(200);
      }

      // 6th search should fail
      const response = await request(app)
        .get('/api/mediators')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(403);

      expect(response.body.error).toContain('daily search limit');
    });

    it('should not enforce limit for premium users', async () => {
      // Upgrade user to premium
      await User.findByIdAndUpdate(testUser._id, { subscriptionTier: 'premium' });

      // Perform more than 5 searches
      for (let i = 0; i < 7; i++) {
        await request(app)
          .get('/api/mediators')
          .set('Authorization', `Bearer ${testToken}`)
          .expect(200);
      }

      const response = await request(app)
        .get('/api/mediators')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.usage.searchLimit).toBe('unlimited');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/mediators')
        .expect(401);
    });
  });

  describe('GET /api/mediators/:id - Profile view with usage tracking', () => {
    it('should get mediator profile and track view', async () => {
      const mediatorId = testMediators[0]._id;

      const response = await request(app)
        .get(`/api/mediators/${mediatorId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('John Liberal');
      expect(response.body.usage.profileViewsToday).toBe(1);
      expect(response.body.usage.profileViewLimit).toBe(10);

      // Verify usage log was created
      const usageLog = await UsageLog.findOne({
        user: testUser._id,
        eventType: 'profile_view',
      });
      expect(usageLog).toBeDefined();
      expect(usageLog.metadata.mediatorName).toBe('John Liberal');
    });

    it('should enforce daily profile view limit for free tier', async () => {
      const mediatorId = testMediators[0]._id;

      // Use up all 10 views
      for (let i = 0; i < 10; i++) {
        await request(app)
          .get(`/api/mediators/${mediatorId}`)
          .set('Authorization', `Bearer ${testToken}`)
          .expect(200);
      }

      // 11th view should fail
      const response = await request(app)
        .get(`/api/mediators/${mediatorId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(403);

      expect(response.body.error).toContain('daily profile view limit');
    });

    it('should return 404 for non-existent mediator', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await request(app)
        .get(`/api/mediators/${fakeId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      const mediatorId = testMediators[0]._id;

      await request(app)
        .get(`/api/mediators/${mediatorId}`)
        .expect(401);
    });
  });

  describe('POST /api/mediators/check-conflicts - Conflict checking', () => {
    it('should detect affiliation conflicts', async () => {
      const mediatorIds = testMediators.map(m => m._id.toString());
      const parties = [
        { name: 'ACLU Foundation' },
        { name: 'Texas Chamber' },
      ];

      const response = await request(app)
        .post('/api/mediators/check-conflicts')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ mediatorIds, parties })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.mediators).toHaveLength(3);
      expect(response.body.data.summary.withConflicts).toBeGreaterThan(0);

      // John Liberal should have ACLU conflict
      const johnResult = response.body.data.mediators.find(
        m => m.mediatorName === 'John Liberal'
      );
      expect(johnResult.hasConflicts).toBe(true);
      expect(johnResult.conflicts).toHaveLength(1);

      // Verify usage log
      const usageLog = await UsageLog.findOne({
        user: testUser._id,
        eventType: 'conflict_check',
      });
      expect(usageLog).toBeDefined();
    });

    it('should handle no conflicts', async () => {
      const mediatorIds = [testMediators[2]._id.toString()]; // Bob Neutral has no affiliations
      const parties = [{ name: 'Random Company' }];

      const response = await request(app)
        .post('/api/mediators/check-conflicts')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ mediatorIds, parties })
        .expect(200);

      expect(response.body.data.summary.withoutConflicts).toBe(1);
    });

    it('should validate required fields', async () => {
      await request(app)
        .post('/api/mediators/check-conflicts')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ mediatorIds: [] })
        .expect(400);

      await request(app)
        .post('/api/mediators/check-conflicts')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ parties: [] })
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/mediators/check-conflicts')
        .send({ mediatorIds: ['123'], parties: [{ name: 'Test' }] })
        .expect(401);
    });
  });
});
