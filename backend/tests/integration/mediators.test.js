/**
 * Mediator Integration Tests
 * Tests mediator CRUD operations and search functionality
 */

const request = require('supertest');
const app = require('../../src/server');
const Mediator = require('../../src/models/Mediator');
const ideologyClassifier = require('../../src/services/huggingface/ideologyClassifier');
const { expectSuccess, expectError, mockExternalAPI } = require('../helpers/testHelpers');

describe('Mediator API', () => {
  let testMediatorId;

  beforeAll(async () => {
    // Create test mediators
    const testMediator = await Mediator.create({
      name: 'Test Mediator',
      email: 'test.mediator@example.com',
      phone: '+1 (555) 123-4567',
      lawFirm: 'Test Law Firm',
      currentEmployer: 'Test Law Firm',
      specializations: ['Commercial', 'Employment'],
      yearsExperience: 10,
      barAdmissions: ['California State Bar'],
      location: {
        city: 'San Francisco',
        state: 'CA',
        country: 'USA'
      },
      ideologyScore: 0,
      isVerified: true,
      isActive: true
    });

    testMediatorId = testMediator._id;

    // Create additional mediators for filtering tests
    await Mediator.create({
      name: 'Liberal Mediator',
      email: 'liberal@example.com',
      lawFirm: 'Progressive Law',
      currentEmployer: 'Progressive Law',
      specializations: ['Civil Rights', 'Environmental'],
      yearsExperience: 15,
      barAdmissions: ['New York State Bar'],
      location: {
        city: 'New York',
        state: 'NY',
        country: 'USA'
      },
      ideologyScore: -5,
      isVerified: true,
      isActive: true
    });

    await Mediator.create({
      name: 'Conservative Mediator',
      email: 'conservative@example.com',
      lawFirm: 'Corporate Law Group',
      currentEmployer: 'Corporate Law Group',
      specializations: ['Corporate', 'Securities'],
      yearsExperience: 20,
      barAdmissions: ['Texas State Bar'],
      location: {
        city: 'Houston',
        state: 'TX',
        country: 'USA'
      },
      ideologyScore: 5,
      isVerified: true,
      isActive: true
    });
  });

  afterAll(async () => {
    await Mediator.deleteMany({ email: { $in: ['test.mediator@example.com', 'liberal@example.com', 'conservative@example.com'] } });
  });

  describe('GET /api/mediators', () => {
    it('should return list of mediators', async () => {
      const response = await request(app)
        .get('/api/mediators');

      expectSuccess(response, 200);
      expect(response.body.data).toHaveProperty('mediators');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.mediators)).toBe(true);
      expect(response.body.data.mediators.length).toBeGreaterThan(0);
    });

    it('should filter mediators by location', async () => {
      const response = await request(app)
        .get('/api/mediators?location=CA');

      expectSuccess(response, 200);
      expect(response.body.data.mediators.length).toBeGreaterThan(0);
      const californiaMediators = response.body.data.mediators.filter(m => m.location.state === 'CA');
      expect(californiaMediators.length).toBeGreaterThan(0);
    });

    it('should filter mediators by ideology', async () => {
      const response = await request(app)
        .get('/api/mediators?ideology=liberal');

      expectSuccess(response, 200);
      expect(response.body.data.mediators.length).toBeGreaterThan(0);
    });

    it('should filter mediators by minimum experience', async () => {
      const response = await request(app)
        .get('/api/mediators?minExperience=15');

      expectSuccess(response, 200);
      response.body.data.mediators.forEach(mediator => {
        expect(mediator.yearsExperience).toBeGreaterThanOrEqual(15);
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/mediators?page=1&limit=2');

      expectSuccess(response, 200);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
      expect(response.body.data.mediators.length).toBeLessThanOrEqual(2);
    });
  });

  describe('GET /api/mediators/:id', () => {
    it('should return a single mediator by ID', async () => {
      const response = await request(app)
        .get(`/api/mediators/${testMediatorId}`);

      expectSuccess(response, 200);
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data.name).toBe('Test Mediator');
    });

    it('should return 404 for non-existent mediator', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/mediators/${fakeId}`);

      expectError(response, 404);
    });

    it('should return 400 for invalid mediator ID', async () => {
      const response = await request(app)
        .get('/api/mediators/invalid-id');

      expectError(response, 400);
    });
  });

  describe('POST /api/mediators', () => {
    it('should create a new mediator', async () => {
      const newMediator = {
        name: 'New Test Mediator',
        email: 'new.mediator@example.com',
        lawFirm: 'New Law Firm',
        currentEmployer: 'New Law Firm',
        specializations: ['Technology', 'IP'],
        yearsExperience: 8,
        barAdmissions: ['Washington State Bar'],
        location: {
          city: 'Seattle',
          state: 'WA',
          country: 'USA'
        }
      };

      const response = await request(app)
        .post('/api/mediators')
        .send(newMediator);

      expectSuccess(response, 201);
      expect(response.body.data).toHaveProperty('name', 'New Test Mediator');
      expect(response.body.data).toHaveProperty('_id');

      // Clean up
      await Mediator.findByIdAndDelete(response.body.data._id);
    });

    it('should reject mediator without required name field', async () => {
      const invalidMediator = {
        email: 'invalid@example.com',
        lawFirm: 'Test Firm'
      };

      const response = await request(app)
        .post('/api/mediators')
        .send(invalidMediator);

      expectError(response, 400);
    });
  });

  describe('PUT /api/mediators/:id', () => {
    it('should update an existing mediator', async () => {
      const updates = {
        yearsExperience: 12,
        lawFirm: 'Updated Law Firm'
      };

      const response = await request(app)
        .put(`/api/mediators/${testMediatorId}`)
        .send(updates);

      expectSuccess(response, 200);
      expect(response.body.data.yearsExperience).toBe(12);
      expect(response.body.data.lawFirm).toBe('Updated Law Firm');
    });

    it('should return 404 for non-existent mediator', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/api/mediators/${fakeId}`)
        .send({ yearsExperience: 15 });

      expectError(response, 404);
    });
  });

  describe('POST /api/mediators/:id/analyze-ideology', () => {
    beforeEach(() => {
      // Mock ideology classifier to avoid HuggingFace API calls
      jest.spyOn(ideologyClassifier, 'classifyIdeology').mockResolvedValue({
        score: -3,
        label: 'LEAN_LIBERAL',
        confidence: 0.85,
        factors: ['Public interest work', 'Civil rights focus'],
        summary: 'Leans liberal based on case history and affiliations'
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should analyze mediator ideology', async () => {
      const response = await request(app)
        .post(`/api/mediators/${testMediatorId}/analyze-ideology`);

      expectSuccess(response, 200);
      expect(response.body.data).toHaveProperty('mediator');
      expect(response.body.data).toHaveProperty('analysis');
      expect(response.body.data.analysis).toHaveProperty('score');
      expect(response.body.data.analysis).toHaveProperty('label');
      expect(ideologyClassifier.classifyIdeology).toHaveBeenCalled();
    });

    it('should return 404 for non-existent mediator', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .post(`/api/mediators/${fakeId}/analyze-ideology`);

      expectError(response, 404);
    });
  });
});
