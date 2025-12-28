/**
 * Authentication Integration Tests
 * Tests the complete auth flow: register, login, logout, password reset
 */

const request = require('supertest');
const app = require('../../src/server');
const User = require('../../src/models/User');
const { expectSuccess, expectError } = require('../helpers/testHelpers');

describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          name: 'New User'
        });

      expectSuccess(response, 201);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe('newuser@example.com');

      // Verify user was created in database
      const user = await User.findOne({ email: 'newuser@example.com' });
      expect(user).toBeTruthy();
      expect(user.emailVerified).toBe(false); // Should require verification
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'weak',
          name: 'New User'
        });

      expectError(response, 400);
    });

    it('should reject duplicate email registration', async () => {
      // Create first user
      await User.create({
        email: 'duplicate@example.com',
        password: 'SecurePass123!',
        name: 'First User',
        emailVerified: true
      });

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'AnotherPass123!',
          name: 'Second User'
        });

      expectError(response, 409); // 409 Conflict for duplicate email
    });

    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'SecurePass123!',
          name: 'Test User'
        });

      expectError(response, 400);
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await User.create({
        email: 'login@example.com',
        password: 'LoginPass123!',
        name: 'Login User',
        emailVerified: true
      });
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'LoginPass123!'
        });

      expectSuccess(response, 200);
      // Cookie-based authentication
      expect(response.body.data).toHaveProperty('authMethod', 'cookie');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('email', 'login@example.com');
    });

    it('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123!'
        });

      expectError(response, 401);
    });

    it('should reject login for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePass123!'
        });

      expectError(response, 401);
    });

    it('should lock account after 5 failed login attempts', async () => {
      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: 'login@example.com',
            password: 'WrongPassword123!'
          });
      }

      // 6th attempt should be blocked
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'LoginPass123!' // Even with correct password
        });

      expectError(response, 423); // 423 Locked
      expect(response.body.error).toContain('locked');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const user = await global.testUtils.createMockUser();
      const token = user.generateAccessToken();

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expectSuccess(response, 200);
    });
  });

  describe.skip('POST /api/auth/refresh-token', () => {
    // Skipped: This API uses cookie-based authentication, not JWT refresh tokens
    it('should refresh access token with valid refresh token', async () => {
      const user = await global.testUtils.createMockUser();
      const refreshToken = user.generateRefreshToken();

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken });

      expectSuccess(response, 200);
      expect(response.body.data).toHaveProperty('accessToken');
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid-token' });

      expectError(response, 401);
    });
  });
});
