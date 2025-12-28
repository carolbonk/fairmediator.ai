/**
 * Test Helper Functions
 * Reusable utilities for testing across the application
 */

const request = require('supertest');

/**
 * Make authenticated request
 * @param {object} app - Express app
 * @param {string} method - HTTP method (get, post, put, delete)
 * @param {string} url - Endpoint URL
 * @param {string} token - JWT token
 * @param {object} data - Request body (for POST/PUT)
 */
const authenticatedRequest = (app, method, url, token, data = null) => {
  const req = request(app)[method](url).set('Authorization', `Bearer ${token}`);

  if (data) {
    req.send(data);
  }

  return req;
};

/**
 * Expect API success response
 */
const expectSuccess = (response, statusCode = 200) => {
  expect(response.status).toBe(statusCode);
  expect(response.body).toHaveProperty('success', true);
  return response.body.data || response.body;
};

/**
 * Expect API error response
 * Handles both standard errors and validation errors
 */
const expectError = (response, statusCode = 400, errorMessage = null) => {
  expect(response.status).toBe(statusCode);

  // Validation errors may not have 'success' field
  const hasSuccess = response.body.hasOwnProperty('success');
  const hasError = response.body.hasOwnProperty('error');

  if (hasSuccess) {
    expect(response.body.success).toBe(false);
  }

  // Error message should exist in some form
  expect(hasError).toBe(true);

  if (errorMessage) {
    expect(response.body.error).toContain(errorMessage);
  }

  return response.body;
};

/**
 * Wait for a condition to be true
 */
const waitFor = (condition, timeout = 5000, interval = 100) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, interval);
      }
    };

    check();
  });
};

/**
 * Create test data in bulk
 */
const createBulkTestData = async (Model, count, generator) => {
  const items = [];

  for (let i = 0; i < count; i++) {
    const item = await Model.create(generator(i));
    items.push(item);
  }

  return items;
};

/**
 * Mock external API calls
 */
const mockExternalAPI = (module, method, mockResponse) => {
  return jest.spyOn(module, method).mockResolvedValue(mockResponse);
};

/**
 * Simulate delay (for testing loading states, etc.)
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Assert that an array contains objects with specific properties
 */
const expectArrayToContainObjectsWithProperties = (array, properties) => {
  array.forEach(item => {
    properties.forEach(prop => {
      expect(item).toHaveProperty(prop);
    });
  });
};

/**
 * Generate random test data
 */
const generateTestData = {
  email: (index = '') => `test${index}@example.com`,
  phone: () => `555-${Math.floor(1000 + Math.random() * 9000)}`,
  name: (index = '') => `Test User ${index}`,
  password: () => 'TestPassword123!',
  mongoId: () => require('mongoose').Types.ObjectId().toString()
};

module.exports = {
  authenticatedRequest,
  expectSuccess,
  expectError,
  waitFor,
  createBulkTestData,
  mockExternalAPI,
  delay,
  expectArrayToContainObjectsWithProperties,
  generateTestData
};
