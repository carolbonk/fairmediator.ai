/**
 * Jest Test Setup File
 * Runs before all tests - sets up global configuration, mocks, and utilities
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Setup: Runs once before all tests
beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Disconnect any existing connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // Connect to in-memory database
  await mongoose.connect(mongoUri);

  console.log('✅ Test database connected');
});

// Cleanup: Runs once after all tests
afterAll(async () => {
  // Close database connection
  await mongoose.disconnect();

  // Stop in-memory MongoDB
  await mongoServer.stop();

  console.log('✅ Test database disconnected');
});

// Before each test
beforeEach(async () => {
  // Clear all collections before each test
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    await collections[key].deleteMany();
  }
});

// Global test utilities
global.testUtils = {
  /**
   * Create a mock user for testing
   */
  createMockUser: async (overrides = {}) => {
    const User = require('../src/models/User');
    return await User.create({
      email: 'test@example.com',
      password: 'TestPassword123!',
      name: 'Test User',
      emailVerified: true,
      ...overrides
    });
  },

  /**
   * Generate JWT token for testing
   */
  generateAuthToken: (user) => {
    return user.generateAccessToken();
  },

  /**
   * Create mock mediator for testing
   */
  createMockMediator: async (overrides = {}) => {
    const Mediator = require('../src/models/Mediator');
    return await Mediator.create({
      name: 'Test Mediator',
      email: 'mediator@example.com',
      phone: '555-0100',
      practiceAreas: ['Family Law'],
      yearsExperience: 10,
      location: { city: 'Test City', state: 'CA' },
      ...overrides
    });
  }
};

// Suppress console logs during tests (optional)
if (process.env.SILENT_TESTS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
}

// Global timeout for async operations
jest.setTimeout(10000);
