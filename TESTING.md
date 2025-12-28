# Testing & DevOps Guide

> **Enterprise-Grade Testing Infrastructure for FairMediator**

## 📋 Table of Contents

1. [Overview](#overview)
2. [Test Types](#test-types)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Coverage Requirements](#coverage-requirements)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Debugging](#debugging)
8. [Docker Development](#docker-development)

---

## Overview

FairMediator uses a comprehensive testing strategy with multiple layers:

- **Unit Tests** - Test individual functions/modules in isolation
- **Integration Tests** - Test API endpoints and database operations
- **E2E Tests** - Test complete user flows in the browser
- **Security Tests** - Automated vulnerability scanning
- **Performance Tests** - Load testing and benchmarking

### Test Stack

**Backend:**
- Jest (test framework)
- Supertest (HTTP testing)
- MongoDB Memory Server (in-memory database)
- Playwright (E2E testing)

**Frontend:**
- Vitest (test framework)
- React Testing Library (component testing)
- Playwright (E2E testing)

**CI/CD:**
- GitHub Actions
- Codecov (coverage tracking)
- Docker (containerization)

---

## Test Types

### 1. Unit Tests

**Location:** `/backend/tests/unit/`

Test individual functions and modules in isolation with mocked dependencies.

**Example:**
```javascript
// tests/unit/utils.test.js
const { sanitizeString } = require('../../src/utils/sanitization');

describe('sanitizeString', () => {
  it('should remove HTML tags', () => {
    const dirty = '<script>alert("xss")</script>Hello';
    const clean = sanitizeString(dirty);
    expect(clean).not.toContain('<script>');
  });
});
```

**Run:**
```bash
npm test -- --testPathPattern=tests/unit
```

### 2. Integration Tests

**Location:** `/backend/tests/integration/`

Test API endpoints, database operations, and service interactions.

**Example:**
```javascript
// tests/integration/auth.test.js
describe('POST /api/auth/login', () => {
  it('should login with correct credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Pass123!' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
  });
});
```

**Run:**
```bash
npm test -- --testPathPattern=tests/integration
```

### 3. E2E Tests

**Location:** `/backend/tests/e2e/`

Test complete user journeys in real browsers.

**Example:**
```javascript
// tests/e2e/auth-flow.spec.js
test('should complete registration flow', async ({ page }) => {
  await page.goto('/register');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'SecurePass123!');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/dashboard/);
});
```

**Run:**
```bash
npx playwright test
```

---

## Running Tests

### Quick Commands

```bash
# Run all tests
make test

# Run backend tests only
make test-backend

# Run frontend tests only
make test-frontend

# Run E2E tests
make test-e2e

# Run tests with coverage
make test-coverage

# Run tests in watch mode
make test-watch
```

### Detailed Commands

**Backend Tests:**
```bash
cd backend

# All tests
npm test

# Specific test file
npm test tests/unit/utils.test.js

# Pattern matching
npm test -- --testNamePattern="should login"

# With coverage
npm test -- --coverage

# Watch mode
npm test -- --watch

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

**Frontend Tests:**
```bash
cd frontend

# All tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

**E2E Tests:**
```bash
cd backend

# All E2E tests
npx playwright test

# Specific browser
npx playwright test --project=chromium

# With UI
npx playwright test --ui

# Debug mode
npx playwright test --debug

# Generate report
npx playwright show-report
```

---

## Writing Tests

### Test Structure

All tests follow AAA pattern (Arrange, Act, Assert):

```javascript
describe('Feature Name', () => {
  // Setup
  beforeAll(async () => {
    // Runs once before all tests
  });

  beforeEach(async () => {
    // Runs before each test
  });

  afterEach(async () => {
    // Runs after each test
  });

  afterAll(async () => {
    // Runs once after all tests
  });

  it('should do something specific', async () => {
    // Arrange - Set up test data
    const testData = { name: 'Test' };

    // Act - Execute the code
    const result = await functionUnderTest(testData);

    // Assert - Verify the result
    expect(result).toBeDefined();
    expect(result.name).toBe('Test');
  });
});
```

### Using Test Helpers

```javascript
const {
  expectSuccess,
  expectError,
  createBulkTestData
} = require('../helpers/testHelpers');

// Expect API success
const data = expectSuccess(response, 200);

// Expect API error
expectError(response, 400, 'Validation failed');

// Create bulk test data
const users = await createBulkTestData(User, 10, (i) => ({
  email: `user${i}@example.com`,
  name: `User ${i}`
}));
```

### Global Test Utilities

Available in all tests via `global.testUtils`:

```javascript
// Create mock user
const user = await global.testUtils.createMockUser({
  email: 'custom@example.com',
  subscriptionTier: 'premium'
});

// Generate auth token
const token = global.testUtils.generateAuthToken(user);

// Create mock mediator
const mediator = await global.testUtils.createMockMediator({
  name: 'Test Mediator',
  practiceAreas: ['Family Law']
});
```

---

## Coverage Requirements

### Thresholds

Minimum coverage requirements (enforced by CI):

```javascript
coverageThresholds: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70
  }
}
```

### Viewing Coverage

```bash
# Generate coverage report
npm test -- --coverage

# Open HTML report
open coverage/lcov-report/index.html
```

### Coverage Files

```
/backend/coverage/
├── lcov-report/        # HTML report (human-readable)
├── coverage-summary.json  # JSON summary
└── lcov.info           # LCOV format (for CI)
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

`.github/workflows/ci-cd.yml`

**Stages:**

1. **Security Scan**
   - npm audit (backend + frontend)
   - Secret scanning (TruffleHog)

2. **Backend Tests**
   - Unit tests
   - Integration tests
   - Coverage check (70% minimum)

3. **Frontend Tests**
   - Component tests
   - Coverage check

4. **E2E Tests**
   - Full user journey tests
   - Multi-browser testing

5. **Linting**
   - ESLint for code quality
   - Max 0 warnings

6. **Build Verification**
   - Test production build

7. **Docker Build** (main branch only)
   - Build and push Docker images

8. **Deployment** (main branch only)
   - Deploy to Render/Netlify

### Pipeline Status

View pipeline status:
- GitHub Actions tab
- Commit status checks
- Pull request checks

### Local CI Simulation

```bash
# Run same checks as CI
make lint
make security
make test
make build
```

---

## Debugging

### VS Code Debugging

**`.vscode/launch.json`** configured with:

1. **Debug Backend Server**
   - Launch backend with nodemon
   - Breakpoints in source code
   - Press F5 to start

2. **Debug Jest Tests**
   - Debug any test file
   - Set breakpoints in tests
   - Right-click test file → Debug

3. **Debug Current Test File**
   - Debug the currently open test
   - Keyboard shortcut: Cmd+Shift+D

4. **Attach to Process**
   - Attach to running Node process
   - Port 9229

### Debug Commands

```bash
# Debug backend
node --inspect-brk src/server.js

# Debug specific test
node --inspect-brk node_modules/.bin/jest tests/unit/utils.test.js

# Debug with Chrome DevTools
# 1. Run above command
# 2. Open chrome://inspect
# 3. Click "inspect" on your process
```

### Logging

```javascript
// Use logger, not console.log
const logger = require('../config/logger');

logger.info('Info message', { metadata });
logger.error('Error message', { error });
logger.security.auth('LOGIN_SUCCESS', userId, metadata);
```

**View logs:**
```bash
# Real-time logs
make logs

# Or
tail -f backend/logs/combined.log
tail -f backend/logs/security.log
```

---

## Docker Development

### Full Development Environment

```bash
# Start all services (MongoDB, Redis, Backend, Frontend, Mailhog)
make docker-dev

# Or manually
docker-compose -f docker-compose.dev.yml up
```

### Services

**MongoDB:**
- Port: 27017
- Admin UI: http://localhost:8081 (mongo-express)
- Credentials: admin/dev_password_change_in_production

**Redis:**
- Port: 6379
- Password: dev_redis_password

**Backend:**
- Port: 5001
- Debug Port: 9229

**Frontend:**
- Port: 3000

**Mailhog (Email Testing):**
- SMTP: localhost:1025
- Web UI: http://localhost:8025

### Docker Commands

```bash
# Build containers
make docker-build

# Start containers
make docker-up

# Stop containers
make docker-down

# View logs
make docker-logs

# Clean everything
make docker-clean
```

### Connect to Running Container

```bash
# Backend shell
docker exec -it fairmediator-backend-dev sh

# MongoDB shell
docker exec -it fairmediator-mongo-dev mongosh

# Redis CLI
docker exec -it fairmediator-redis-dev redis-cli
```

---

## Best Practices

### DO ✅

1. **Write tests first (TDD)**
   ```javascript
   // 1. Write test
   it('should validate email', () => {
     expect(validateEmail('test@example.com')).toBe(true);
   });

   // 2. Implement function
   // 3. Run test
   // 4. Refactor
   ```

2. **Use descriptive test names**
   ```javascript
   // Good
   it('should return 401 when JWT token is expired', () => {});

   // Bad
   it('should fail', () => {});
   ```

3. **Test one thing at a time**
   ```javascript
   // Good
   it('should hash password', () => {});
   it('should compare password with hash', () => {});

   // Bad
   it('should hash and compare password', () => {});
   ```

4. **Clean up after tests**
   ```javascript
   afterEach(async () => {
     await User.deleteMany({});
     jest.clearAllMocks();
   });
   ```

5. **Use factories for test data**
   ```javascript
   const createUser = (overrides = {}) => ({
     email: 'test@example.com',
     password: 'Pass123!',
     ...overrides
   });
   ```

### DON'T ❌

1. **Don't test implementation details**
2. **Don't share state between tests**
3. **Don't use real external APIs**
4. **Don't skip cleanup**
5. **Don't commit `.only` or `.skip`**

---

## Troubleshooting

### Tests Failing

1. **Clear Jest cache:**
   ```bash
   npx jest --clearCache
   ```

2. **Check database connection:**
   ```bash
   # Ensure MongoDB is running
   docker ps | grep mongo
   ```

3. **Update snapshots:**
   ```bash
   npm test -- -u
   ```

### Slow Tests

1. **Run tests in parallel:**
   ```bash
   npm test -- --maxWorkers=4
   ```

2. **Use `.only` for focused testing:**
   ```javascript
   it.only('should test this one', () => {});
   ```

3. **Profile slow tests:**
   ```bash
   npm test -- --verbose --detectOpenHandles
   ```

### E2E Tests Failing

1. **Update Playwright:**
   ```bash
   npx playwright install
   ```

2. **Run with UI to debug:**
   ```bash
   npx playwright test --ui
   ```

3. **Check screenshots:**
   ```bash
   open playwright-report/
   ```

---

## Quick Reference

### Common Test Commands

```bash
# Run everything
make test

# Watch mode
make test-watch

# Coverage
make test-coverage

# E2E only
make test-e2e

# Specific file
npm test tests/unit/utils.test.js

# Pattern
npm test -- --testNamePattern="login"

# Debug
node --inspect-brk node_modules/.bin/jest
```

### Coverage Goals

| Metric | Minimum | Target | Excellent |
|--------|---------|--------|-----------|
| Lines | 70% | 80% | 90%+ |
| Functions | 70% | 80% | 90%+ |
| Branches | 70% | 80% | 90%+ |
| Statements | 70% | 80% | 90%+ |

---

**Last Updated:** December 26, 2024
**Maintained By:** Development Team
**Questions?** Create an issue or check CONTRIBUTING.md
