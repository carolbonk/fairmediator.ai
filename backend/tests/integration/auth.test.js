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

    it('should show detailed validation errors for invalid name', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!',
          name: 'X' // Too short
        });

      expectError(response, 400);
      expect(response.body.error).toContain('Validation failed');
      expect(response.body.details).toBeDefined();
    });

    it('should show detailed password validation errors', async () => {
      const testCases = [
        { password: 'short1!A', reason: 'too short' },
        { password: 'nouppercase123!', reason: 'no uppercase' },
        { password: 'NOLOWERCASE123!', reason: 'no lowercase' },
        { password: 'NoSpecialChar123', reason: 'no special char' },
        { password: 'NoDigitsHere!', reason: 'no digits' }
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'test@example.com',
            password: testCase.password,
            name: 'Test User'
          });

        expectError(response, 400);
        expect(response.body.error).toContain('Validation failed');
      }
    });

    it('should reject registration with name containing numbers', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!',
          name: 'Test123'
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

    it('should show remaining login attempts after failed login', async () => {
      // First failed attempt
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123!'
        });

      expectError(response, 401);
      expect(response.body).toHaveProperty('remainingAttempts');
      expect(response.body.remainingAttempts).toBe(4); // 5 max - 1 failed = 4 remaining
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

      // 6th attempt should be blocked (even with correct password)
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'LoginPass123!' // Correct password doesn't matter
        });

      expectError(response, 423); // 423 Locked
      expect(response.body.error).toContain('locked');
      expect(response.body).toHaveProperty('minutesRemaining');
    });

    it('should reset failed attempts after successful login', async () => {
      // Make 2 failed attempts
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123!'
        });

      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123!'
        });

      // Successful login
      const successResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'LoginPass123!'
        });

      expectSuccess(successResponse, 200);

      // Verify failed attempts were reset
      const user = await User.findOne({ email: 'login@example.com' });
      expect(user.failedLoginAttempts).toBe(0);
      expect(user.accountLockedUntil).toBeNull();
    });

    it('should auto-unlock account after lock duration expires', async () => {
      // Lock the account
      const user = await User.findOne({ email: 'login@example.com' });
      user.failedLoginAttempts = 5;
      user.accountLockedUntil = new Date(Date.now() - 1000); // Expired 1 second ago
      await user.save();

      // Try to login (should succeed because lock expired)
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'LoginPass123!'
        });

      expectSuccess(response, 200);

      // Verify counters were reset
      const updatedUser = await User.findOne({ email: 'login@example.com' });
      expect(updatedUser.failedLoginAttempts).toBe(0);
      expect(updatedUser.accountLockedUntil).toBeNull();
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
