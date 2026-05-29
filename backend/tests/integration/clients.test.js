/**
 * /api/clients Integration Tests
 * Verifies attorney and party roles are correctly admitted (or blocked)
 * by the merged clients router under the fixed JWT auth middleware.
 */

const request = require('supertest');
const app = require('../../src/server');
const User = require('../../src/models/User');

describe('Clients API (/api/clients)', () => {
  let attorneyAgent, partyAgent, mediatorAgent;

  beforeEach(async () => {
    await User.create([
      {
        email: 'attorney@clients-test.com',
        password: 'SecurePass123!',
        name: 'Test Attorney',
        accountType: 'attorney',
        emailVerified: true
      },
      {
        email: 'party@clients-test.com',
        password: 'SecurePass123!',
        name: 'Test Party',
        accountType: 'party',
        emailVerified: true
      },
      {
        email: 'mediator@clients-test.com',
        password: 'SecurePass123!',
        name: 'Test Mediator',
        accountType: 'mediator',
        emailVerified: true
      }
    ]);

    attorneyAgent = request.agent(app);
    partyAgent = request.agent(app);
    mediatorAgent = request.agent(app);

    await Promise.all([
      attorneyAgent.post('/api/auth/login').send({ email: 'attorney@clients-test.com', password: 'SecurePass123!' }),
      partyAgent.post('/api/auth/login').send({ email: 'party@clients-test.com', password: 'SecurePass123!' }),
      mediatorAgent.post('/api/auth/login').send({ email: 'mediator@clients-test.com', password: 'SecurePass123!' })
    ]);
  });

  describe('Router-level role guard (authenticateWithRole)', () => {
    test('attorney reaches an attorney endpoint → 200', async () => {
      const res = await attorneyAgent.get('/api/clients/saved-mediators');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('party reaches a party endpoint → 200', async () => {
      const res = await partyAgent.get('/api/clients/my-case');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('mediator is blocked at the router level → 403', async () => {
      const res = await mediatorAgent.get('/api/clients/saved-mediators');
      expect(res.status).toBe(403);
    });

    test('unauthenticated request → 401', async () => {
      const res = await request(app).get('/api/clients/saved-mediators');
      expect(res.status).toBe(401);
    });
  });

  describe('Per-endpoint permission guard (requirePermission)', () => {
    test('party hitting attorney-only endpoint → 403', async () => {
      const res = await partyAgent.get('/api/clients/saved-mediators');
      expect(res.status).toBe(403);
    });

    test('party hitting second attorney-only endpoint → 403', async () => {
      const res = await partyAgent.get('/api/clients/my-cases');
      expect(res.status).toBe(403);
    });

    test('attorney hitting party-only endpoint → 403', async () => {
      const res = await attorneyAgent.get('/api/clients/my-case');
      expect(res.status).toBe(403);
    });

    test('attorney hitting second party-only endpoint → 403', async () => {
      const res = await attorneyAgent.get('/api/clients/recommended-mediators');
      expect(res.status).toBe(403);
    });
  });

  describe('Attorney endpoints return correct data shape', () => {
    test('GET /saved-mediators returns array', async () => {
      const res = await attorneyAgent.get('/api/clients/saved-mediators');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('count');
    });

    test('GET /recent-searches returns array', async () => {
      const res = await attorneyAgent.get('/api/clients/recent-searches');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('GET /my-cases returns array', async () => {
      const res = await attorneyAgent.get('/api/clients/my-cases');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Party endpoints return correct data shape', () => {
    test('GET /my-case returns null or case object', async () => {
      const res = await partyAgent.get('/api/clients/my-case');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // null when no active case exists — that's the correct empty state
      expect(res.body).toHaveProperty('data');
    });

    test('GET /recommended-mediators returns array', async () => {
      const res = await partyAgent.get('/api/clients/recommended-mediators');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
