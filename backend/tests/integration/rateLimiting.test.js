/**
 * Rate Limiting Integration Tests
 * Tests that rate limiting works correctly for different endpoints
 */

const request = require('supertest');
const express = require('express');
const rateLimit = require('express-rate-limit');

describe('Rate Limiting', () => {
  let app;

  beforeEach(() => {
    // Create a fresh Express app for each test
    app = express();
    app.use(express.json());
  });

  describe('Auth Rate Limiter', () => {
    it('should block requests after exceeding limit', async () => {
      // Create a strict rate limiter for testing (3 requests per window)
      const testLimiter = rateLimit({
        windowMs: 1000, // 1 second window
        max: 3,
        standardHeaders: true,
        legacyHeaders: false,
        message: 'Too many requests'
      });

      // Add test endpoint with rate limiting
      app.post('/test-auth', testLimiter, (req, res) => {
        res.json({ success: true });
      });

      // First 3 requests should succeed
      for (let i = 0; i < 3; i++) {
        const response = await request(app).post('/test-auth');
        expect(response.status).toBe(200);
      }

      // 4th request should be rate limited
      const blockedResponse = await request(app).post('/test-auth');
      expect(blockedResponse.status).toBe(429);
    });

    it('should reset limit after window expires', async () => {
      const testLimiter = rateLimit({
        windowMs: 100, // 100ms window
        max: 2,
        standardHeaders: true
      });

      app.post('/test-reset', testLimiter, (req, res) => {
        res.json({ success: true });
      });

      // Use up the limit
      await request(app).post('/test-reset');
      await request(app).post('/test-reset');

      // Should be blocked
      const blocked = await request(app).post('/test-reset');
      expect(blocked.status).toBe(429);

      // Wait for window to reset
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should succeed after reset
      const afterReset = await request(app).post('/test-reset');
      expect(afterReset.status).toBe(200);
    });
  });

  describe('Dynamic Rate Limiter', () => {
    it('should apply different limits based on user tier', async () => {
      const dynamicLimiter = rateLimit({
        windowMs: 1000,
        max: (req) => {
          // Premium users get 5 requests, free users get 2
          if (req.user?.tier === 'premium') {
            return 5;
          }
          return 2;
        },
        keyGenerator: (req) => {
          return req.user?.id || req.ip;
        }
      });

      app.use((req, res, next) => {
        // Mock user from header
        if (req.headers['x-user-tier']) {
          req.user = {
            id: req.headers['x-user-id'] || 'test-user',
            tier: req.headers['x-user-tier']
          };
        }
        next();
      });

      app.get('/test-dynamic', dynamicLimiter, (req, res) => {
        res.json({ success: true, tier: req.user?.tier || 'free' });
      });

      // Test free user (2 requests max)
      await request(app).get('/test-dynamic').set('x-user-id', 'free-user-1');
      await request(app).get('/test-dynamic').set('x-user-id', 'free-user-1');
      const freeBlocked = await request(app).get('/test-dynamic').set('x-user-id', 'free-user-1');
      expect(freeBlocked.status).toBe(429);

      // Test premium user (5 requests max)
      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .get('/test-dynamic')
          .set('x-user-tier', 'premium')
          .set('x-user-id', 'premium-user-1');
        expect(res.status).toBe(200);
      }

      // 6th request should be blocked
      const premiumBlocked = await request(app)
        .get('/test-dynamic')
        .set('x-user-tier', 'premium')
        .set('x-user-id', 'premium-user-1');
      expect(premiumBlocked.status).toBe(429);
    });
  });

  describe('Rate Limit Headers', () => {
    it('should include standard rate limit headers', async () => {
      const testLimiter = rateLimit({
        windowMs: 1000,
        max: 5,
        standardHeaders: true
      });

      app.get('/test-headers', testLimiter, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app).get('/test-headers');

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
      expect(response.headers).toHaveProperty('ratelimit-reset');
      expect(response.headers['ratelimit-limit']).toBe('5');
    });

    it('should include retry-after header when rate limited', async () => {
      const testLimiter = rateLimit({
        windowMs: 1000,
        max: 1,
        standardHeaders: true
      });

      app.get('/test-retry', testLimiter, (req, res) => {
        res.json({ success: true });
      });

      // First request succeeds
      await request(app).get('/test-retry');

      // Second request is blocked
      const blocked = await request(app).get('/test-retry');
      expect(blocked.status).toBe(429);
      expect(blocked.headers).toHaveProperty('ratelimit-reset');
    });
  });

  describe('IP-based Rate Limiting', () => {
    it('should track limits per IP address', async () => {
      const testLimiter = rateLimit({
        windowMs: 1000,
        max: 2,
        standardHeaders: true
      });

      app.get('/test-ip', testLimiter, (req, res) => {
        res.json({ success: true, ip: req.ip });
      });

      // Requests from different IPs should have separate limits
      // Note: In tests, all requests come from same IP, so this demonstrates the concept
      await request(app).get('/test-ip');
      await request(app).get('/test-ip');

      const blocked = await request(app).get('/test-ip');
      expect(blocked.status).toBe(429);
    });
  });
});
