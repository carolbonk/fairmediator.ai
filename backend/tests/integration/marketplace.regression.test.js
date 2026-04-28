/**
 * Regression tests for the four bug fixes shipped in commits
 * 40be741, e1214d7, 00656c0, 6b89467 (2026-04-27 marketplace session).
 *
 * Each describe block pins one fix so the bug can't silently come back.
 * Self-contained: doesn't depend on global.testUtils or seeded data.
 */

const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../../src/server');
const User = require('../../src/models/User');
const Mediator = require('../../src/models/Mediator');
const Gig = require('../../src/models/Gig');
const Case = require('../../src/models/Case');
const { generateRoleToken } = require('../../src/middleware/roleAuth');

async function makeUser({ accountType, role = 'user', email }) {
  const user = await User.create({
    email,
    password: 'TestPassword123!',  // pragma: allowlist secret
    name: `${accountType} ${role}`,
    accountType,
    role,
    emailVerified: true
  });
  // Routes use authenticateWithRole, which validates the role-scoped token (not the access token).
  return { user, token: generateRoleToken(user) };
}

async function makeMediator(user) {
  return Mediator.create({
    userId: user._id,
    name: user.name,
    email: user.email,
    specializations: ['Probate Disputes'],
    yearsExperience: 5
  });
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

describe('regression: 2026-04-27 marketplace session bug fixes', () => {
  describe('PUT /api/mediators/my-profile rejects non-array payloads (commit 40be741)', () => {
    let mediatorToken;
    beforeEach(async () => {
      const { user, token } = await makeUser({ accountType: 'mediator', email: 'med-reg@example.com' });
      await makeMediator(user);
      mediatorToken = token;
    });

    it('rejects non-array practiceAreas (deprecated alias)', async () => {
      const res = await request(app)
        .put('/api/mediators/my-profile')
        .set(auth(mediatorToken))
        .send({ practiceAreas: 'not-an-array' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects non-array specializations', async () => {
      const res = await request(app)
        .put('/api/mediators/my-profile')
        .set(auth(mediatorToken))
        .send({ specializations: 42 });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('accepts a valid deprecated-alias array', async () => {
      const res = await request(app)
        .put('/api/mediators/my-profile')
        .set(auth(mediatorToken))
        .send({ practiceAreas: ['Family Law', 'Commercial Litigation'] });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.practiceAreas).toEqual(expect.arrayContaining(['Family Law', 'Commercial Litigation']));
    });
  });

  describe('POST /api/gigs validates payload (commit e1214d7)', () => {
    let attorneyToken, adminToken;
    beforeEach(async () => {
      attorneyToken = (await makeUser({ accountType: 'attorney', email: 'atty-reg@example.com' })).token;
      adminToken = (await makeUser({ accountType: 'attorney', role: 'admin', email: 'admin-reg@example.com' })).token;
    });

    it('rejects budget.min > budget.max', async () => {
      const res = await request(app)
        .post('/api/gigs')
        .set(auth(attorneyToken))
        .send({ title: 'T', disputeType: 'commercial', budget: { min: 9999, max: 100 } });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/budget\.min.*budget\.max/);
    });

    it('rejects negative budget', async () => {
      const res = await request(app)
        .post('/api/gigs')
        .set(auth(attorneyToken))
        .send({ title: 'T', disputeType: 'commercial', budget: { min: -1, max: 100 } });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/non-negative/);
    });

    it('rejects expiresAt > 180 days in the future', async () => {
      const far = new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString();
      const res = await request(app)
        .post('/api/gigs')
        .set(auth(attorneyToken))
        .send({ title: 'T', disputeType: 'commercial', expiresAt: far });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/180 days/);
    });

    it('rejects past expiresAt', async () => {
      const past = new Date(Date.now() - 1000).toISOString();
      const res = await request(app)
        .post('/api/gigs')
        .set(auth(attorneyToken))
        .send({ title: 'T', disputeType: 'commercial', expiresAt: past });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/future/);
    });

    it('rejects attorney attempting recommendedMediatorIds', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post('/api/gigs')
        .set(auth(attorneyToken))
        .send({ title: 'T', disputeType: 'commercial', recommendedMediatorIds: [fakeId] });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/admin/);
    });

    it('downgrades auto_match with empty recs to open_feed', async () => {
      const res = await request(app)
        .post('/api/gigs')
        .set(auth(attorneyToken))
        .send({ title: 'T', disputeType: 'family', distributionMode: 'auto_match' });
      expect(res.status).toBe(201);
      expect(res.body.gig.distributionMode).toBe('open_feed');
    });

    it('defaults expiresAt to ~30 days when omitted', async () => {
      const before = Date.now();
      const res = await request(app)
        .post('/api/gigs')
        .set(auth(attorneyToken))
        .send({ title: 'T', disputeType: 'commercial' });
      expect(res.status).toBe(201);
      const ms = new Date(res.body.gig.expiresAt).getTime() - before;
      const oneDay = 24 * 60 * 60 * 1000;
      expect(ms).toBeGreaterThan(29 * oneDay);
      expect(ms).toBeLessThan(31 * oneDay);
    });
  });

  describe('POST /api/gigs/:id/accept atomic claim+accept (commit 00656c0)', () => {
    let attorneyToken, mediatorToken, mediatorUser;
    beforeEach(async () => {
      attorneyToken = (await makeUser({ accountType: 'attorney', email: 'atty-acc@example.com' })).token;
      const med = await makeUser({ accountType: 'mediator', email: 'med-acc@example.com' });
      mediatorToken = med.token;
      mediatorUser = med.user;
      await makeMediator(med.user);
    });

    it('flips fresh open gig directly to accepted in one call', async () => {
      const created = await request(app)
        .post('/api/gigs')
        .set(auth(attorneyToken))
        .send({ title: 'Accept-flow gig', disputeType: 'commercial' });
      expect(created.status).toBe(201);
      const gigId = created.body.gig._id;

      const accepted = await request(app)
        .post(`/api/gigs/${gigId}/accept`)
        .set(auth(mediatorToken));

      expect(accepted.status).toBe(201);
      expect(accepted.body.success).toBe(true);
      expect(accepted.body.gig.status).toBe('accepted');
      expect(String(accepted.body.gig.claimedBy.userId)).toBe(String(mediatorUser._id));
      expect(String(accepted.body.gig.acceptedBy.userId)).toBe(String(mediatorUser._id));
      expect(accepted.body.gig.promotedToCaseId).toBeTruthy();
    });

    it('creates Case with auto-generated caseNumber (commit 6b89467)', async () => {
      const created = await request(app)
        .post('/api/gigs')
        .set(auth(attorneyToken))
        .send({ title: 'Case-creation gig', disputeType: 'commercial' });
      const accepted = await request(app)
        .post(`/api/gigs/${created.body.gig._id}/accept`)
        .set(auth(mediatorToken));

      expect(accepted.body.case.caseNumber).toMatch(/^CASE-\d{4}-\d{6}$/);
      expect(accepted.body.case.status).toBe('mediator_selected');
      expect(String(accepted.body.case.mediator.userId)).toBe(String(mediatorUser._id));
    });

    it('rejects re-accept on terminal state (409)', async () => {
      const created = await request(app)
        .post('/api/gigs')
        .set(auth(attorneyToken))
        .send({ title: 'Terminal-state gig', disputeType: 'commercial' });
      const gigId = created.body.gig._id;

      await request(app).post(`/api/gigs/${gigId}/accept`).set(auth(mediatorToken));
      const second = await request(app).post(`/api/gigs/${gigId}/accept`).set(auth(mediatorToken));

      expect(second.status).toBe(409);
      expect(second.body.currentStatus).toBe('accepted');
    });
  });

  describe('GET /api/cases?status=all returns all cases (commit 6b89467)', () => {
    let mediatorToken, mediatorUser;
    beforeEach(async () => {
      const med = await makeUser({ accountType: 'mediator', email: 'med-cases@example.com' });
      mediatorToken = med.token;
      mediatorUser = med.user;
      await makeMediator(med.user);

      // Seed cases in three statuses spanning ACTIVE_STATUSES and outside.
      const cb = mediatorUser._id;
      await Case.create({
        title: 'Active case 1', disputeType: 'commercial', status: 'mediator_selected',
        mediator: { userId: mediatorUser._id, assignedAt: new Date() }, createdBy: cb
      });
      await Case.create({
        title: 'Active case 2', disputeType: 'family', status: 'in_mediation',
        mediator: { userId: mediatorUser._id, assignedAt: new Date() }, createdBy: cb
      });
      await Case.create({
        title: 'Closed case', disputeType: 'commercial', status: 'settled',
        mediator: { userId: mediatorUser._id, assignedAt: new Date() }, createdBy: cb
      });
    });

    it('?status=all returns all 3 (the bug fix — was returning 0)', async () => {
      const res = await request(app)
        .get('/api/cases?status=all')
        .set(auth(mediatorToken));
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(3);
    });

    it('?status=active returns only ACTIVE_STATUSES matches (2)', async () => {
      const res = await request(app)
        .get('/api/cases?status=active')
        .set(auth(mediatorToken));
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
    });

    it('?status=settled returns 1 (specific-status path unchanged)', async () => {
      const res = await request(app)
        .get('/api/cases?status=settled')
        .set(auth(mediatorToken));
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
    });

    it('no status param returns all (no-filter default unchanged)', async () => {
      const res = await request(app)
        .get('/api/cases')
        .set(auth(mediatorToken));
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(3);
    });
  });
});
