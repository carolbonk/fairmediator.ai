/**
 * Jest Setup File for Backend Tests
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.MONGODB_URI = 'mongodb://test:test@localhost:27017/fairmediator_test?authSource=admin';

// Increase test timeout for integration tests
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests (optional)
global.console = {
  ...console,
  // Uncomment to suppress logs during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Global test utilities
global.testUtils = {
  // Helper to create mock request object
  mockRequest: (body = {}, params = {}, query = {}, headers = {}, user = null) => ({
    body,
    params,
    query,
    headers,
    user,
  }),

  // Helper to create mock response object
  mockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.set = jest.fn().mockReturnValue(res);
    return res;
  },

  // Helper to create mock next function
  mockNext: () => jest.fn(),
};

// Clean up after all tests
afterAll(async () => {
  // Close any open database connections, etc.
  // await mongoose.connection.close();
});
