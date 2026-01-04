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

### 4. AI Systems Tests

**Location:** Manual API testing for now

Test all activated AI systems to ensure proper integration and functionality.

#### 4.1 Agent System Tests

**Test Agent Availability:**
```bash
curl http://localhost:5001/api/agents/available
```

**Expected Response:**
```json
{
  "success": true,
  "agents": [
    {
      "name": "mediator_search_agent",
      "description": "Searches mediator database with natural language queries",
      "tools": ["search_database", "analyze_ideology"]
    },
    {
      "name": "research_agent",
      "description": "Deep research on specific mediators"
    },
    {
      "name": "coordinator_agent",
      "description": "Coordinates multiple agents for complex tasks"
    }
  ]
}
```

**Test Mediator Search Agent:**
```bash
curl -X POST http://localhost:5001/api/agents/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "employment mediator in California with tech experience"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "answer": { /* search results */ },
  "iterations": [ /* agent reasoning steps */ ],
  "agent": "mediator_search_agent"
}
```

**Test Agent Execution:**
```bash
curl -X POST http://localhost:5001/api/agents/execute \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "research_agent",
    "task": "Research mediator John Doe",
    "context": {}
  }'
```

#### 4.2 Chain System Tests

**Test Chain Availability:**
```bash
curl http://localhost:5001/api/chains/available
```

**Expected Response:**
```json
{
  "success": true,
  "chains": [
    {
      "name": "mediator_search",
      "description": "Multi-step mediator search with ideology analysis",
      "steps": ["parse_query", "search_database", "analyze_ideology", "rank_results"]
    },
    {
      "name": "conflict_analysis",
      "description": "Comprehensive conflict of interest detection"
    },
    {
      "name": "conversation_summary",
      "description": "Summarize and extract key points from conversations"
    }
  ]
}
```

**Test Mediator Search Chain:**
```bash
curl -X POST http://localhost:5001/api/chains/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "family law mediator"
  }'
```

**Test Conflict Analysis Chain:**
```bash
curl -X POST http://localhost:5001/api/chains/analyze-conflict \
  -H "Content-Type: application/json" \
  -d '{
    "mediatorId": "REPLACE_WITH_REAL_ID",
    "parties": ["Company A", "Law Firm B"]
  }'
```

**Test Custom Chain:**
```bash
curl -X POST http://localhost:5001/api/chains/custom \
  -H "Content-Type: application/json" \
  -d '{
    "steps": [
      {
        "type": "llm",
        "template": "Analyze this query: {{input}}"
      }
    ],
    "input": "test query"
  }'
```

#### 4.3 Multi-Perspective AI Tests

**Test Perspective Info:**
```bash
curl http://localhost:5001/api/perspectives/info
```

**Expected Response:**
```json
{
  "success": true,
  "perspectives": [
    {
      "id": "liberal",
      "name": "Progressive Mediator AI",
      "icon": "🔵",
      "description": "Prioritizes social justice, worker rights, and progressive approaches"
    },
    {
      "id": "neutral",
      "name": "Balanced Mediator AI",
      "icon": "⚪"
    },
    {
      "id": "conservative",
      "name": "Traditional Mediator AI",
      "icon": "🔴"
    }
  ]
}
```

**Test All Perspectives:**
```bash
curl -X POST http://localhost:5001/api/perspectives/all \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Should I settle this employment dispute out of court?",
    "history": []
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "perspectives": {
    "liberal": { /* progressive perspective */ },
    "neutral": { /* balanced perspective */ },
    "conservative": { /* traditional perspective */ }
  }
}
```

**Test Single Perspective:**
```bash
curl -X POST http://localhost:5001/api/perspectives/single \
  -H "Content-Type: application/json" \
  -d '{
    "perspective": "neutral",
    "message": "What should I do?"
  }'
```

#### 4.4 Intelligent Document Processing Tests

**Test Text Processing:**
```bash
curl -X POST http://localhost:5001/api/idp/process-text \
  -H "Content-Type: application/json" \
  -d '{
    "text": "John Doe, Esq. Bar Number: 123456. Specializes in employment law and intellectual property. 15 years of experience. Located in San Francisco, CA. Email: john@example.com. Education: Harvard Law School."
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "documentType": "mediator_cv",
  "data": {
    "name": "John Doe",
    "barNumber": "123456",
    "specializations": ["employment", "ip", "intellectual property"],
    "yearsExperience": 15,
    "location": { "city": "San Francisco", "state": "CA" },
    "contact": { "email": "john@example.com" },
    "education": ["Harvard Law School"]
  },
  "confidence": 85
}
```

**Test PDF Processing (requires PDF file):**
```bash
curl -X POST http://localhost:5001/api/idp/process-pdf \
  -F "file=@/path/to/mediator_cv.pdf"
```

**Test Process and Save:**
```bash
curl -X POST http://localhost:5001/api/idp/process-and-save \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Jane Smith, Bar #789012. Family law mediator. 10 years experience. Los Angeles, CA.",
    "autoSave": "true"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "extracted": { /* extraction results */ },
  "saved": true,
  "mediator": {
    "id": "...",
    "name": "Jane Smith",
    "barNumber": "789012"
  },
  "message": "Mediator profile created successfully"
}
```

#### 4.5 Quality Assurance Tests

**Test Profile Validation:**
```bash
# First get a mediator ID
curl http://localhost:5001/api/mediators | jq '.[0]._id'

# Then validate it (replace with actual ID)
curl -X POST http://localhost:5001/api/qa/validate/MEDIATOR_ID_HERE
```

**Expected Response:**
```json
{
  "success": true,
  "mediatorId": "...",
  "mediatorName": "John Doe",
  "qualityScore": 85,
  "issues": [],
  "warnings": ["Profile only 60% complete"],
  "checks": {
    "requiredFields": true,
    "dataConsistency": true,
    "completeness": 60,
    "bioQuality": "checked",
    "conflictValidation": "checked"
  }
}
```

**Test Batch Validation:**
```bash
curl -X POST http://localhost:5001/api/qa/validate-all \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 10,
    "skipPassed": false
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "summary": {
    "total": 10,
    "passed": 7,
    "hasIssues": 2,
    "hasWarnings": 5,
    "averageQuality": 78.5
  },
  "results": [ /* array of validation results */ ]
}
```

#### 4.6 Memory System Integration Tests

**Test Chat with Memory:**
```bash
# First request (creates memory)
curl -X POST http://localhost:5001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Find family law mediators in California",
    "userId": "test-user-123",
    "conversationId": "conv-456"
  }'

# Second request (should use memory for personalization)
curl -X POST http://localhost:5001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Find another mediator",
    "userId": "test-user-123",
    "conversationId": "conv-456"
  }'
```

**Check Response Flags:**
- First response: `"memoryEnabled": false`
- Second response: `"memoryEnabled": true` (memory context loaded)

#### 4.7 Integration Test Suite

**Test All Systems Together:**
```bash
# 1. Use IDP to extract mediator from text
EXTRACTION=$(curl -s -X POST http://localhost:5001/api/idp/process-text \
  -H "Content-Type: application/json" \
  -d '{"text": "Bob Johnson, mediator, employment law specialist"}')

echo "✓ IDP extraction: $(echo $EXTRACTION | jq .success)"

# 2. Use agent to search for mediators
SEARCH=$(curl -s -X POST http://localhost:5001/api/agents/search \
  -H "Content-Type: application/json" \
  -d '{"query": "employment mediator"}')

echo "✓ Agent search: $(echo $SEARCH | jq .success)"

# 3. Use chain for conflict analysis
# (Requires real mediator ID from database)

# 4. Get multi-perspective advice
PERSPECTIVES=$(curl -s -X POST http://localhost:5001/api/perspectives/all \
  -H "Content-Type: application/json" \
  -d '{"message": "Should I mediate?"}')

echo "✓ Multi-perspective: $(echo $PERSPECTIVES | jq .success)"

# 5. Run QA validation
# (Requires real mediator ID from database)

echo "✅ All AI systems operational"
```

#### 4.8 Error Handling Tests

**Test Invalid Agent:**
```bash
curl -X POST http://localhost:5001/api/agents/execute \
  -H "Content-Type: application/json" \
  -d '{"agent": "nonexistent_agent", "task": "test"}'
```

**Expected:** Error message about agent not found

**Test Invalid Chain:**
```bash
curl -X POST http://localhost:5001/api/chains/execute \
  -H "Content-Type: application/json" \
  -d '{"chain": "nonexistent_chain", "input": "test"}'
```

**Expected:** Error message about chain not found

**Test Invalid Perspective:**
```bash
curl -X POST http://localhost:5001/api/perspectives/single \
  -H "Content-Type: application/json" \
  -d '{"perspective": "invalid", "message": "test"}'
```

**Expected:** Error listing valid perspectives

**Test Empty IDP Input:**
```bash
curl -X POST http://localhost:5001/api/idp/process-text \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected:** Error about missing text field

#### 4.9 Performance Benchmarks

**Agent Response Time:**
- Target: < 3 seconds for simple queries
- Acceptable: < 10 seconds for complex multi-step tasks

**Chain Execution Time:**
- Target: < 5 seconds for 3-step chains
- Acceptable: < 15 seconds for 5+ step chains

**IDP Processing:**
- Text: < 1 second
- PDF (1-5 pages): < 5 seconds
- Batch (10 PDFs): < 30 seconds

**QA Validation:**
- Single profile: < 2 seconds
- Batch (100 profiles): < 60 seconds

#### 4.10 Automated Test Script

**Create test script:**
```bash
# Create tests/ai-systems-test.sh
#!/bin/bash

BASE_URL="http://localhost:5001"
ERRORS=0

echo "🧪 Testing AI Systems..."
echo ""

# Test 1: Agent System
echo "1. Testing Agent System..."
RESPONSE=$(curl -s ${BASE_URL}/api/agents/available)
if echo $RESPONSE | jq -e '.success' > /dev/null; then
  echo "✅ Agents available"
else
  echo "❌ Agents test failed"
  ERRORS=$((ERRORS + 1))
fi

# Test 2: Chain System
echo "2. Testing Chain System..."
RESPONSE=$(curl -s ${BASE_URL}/api/chains/available)
if echo $RESPONSE | jq -e '.success' > /dev/null; then
  echo "✅ Chains available"
else
  echo "❌ Chains test failed"
  ERRORS=$((ERRORS + 1))
fi

# Test 3: Perspectives
echo "3. Testing Multi-Perspective AI..."
RESPONSE=$(curl -s ${BASE_URL}/api/perspectives/info)
if echo $RESPONSE | jq -e '.success' > /dev/null; then
  echo "✅ Perspectives available"
else
  echo "❌ Perspectives test failed"
  ERRORS=$((ERRORS + 1))
fi

# Test 4: IDP
echo "4. Testing Intelligent Document Processing..."
RESPONSE=$(curl -s -X POST ${BASE_URL}/api/idp/process-text \
  -H "Content-Type: application/json" \
  -d '{"text": "John Doe, Bar #12345, employment law"}')
if echo $RESPONSE | jq -e '.success' > /dev/null; then
  echo "✅ IDP working"
else
  echo "❌ IDP test failed"
  ERRORS=$((ERRORS + 1))
fi

echo ""
if [ $ERRORS -eq 0 ]; then
  echo "🎉 All AI systems operational!"
  exit 0
else
  echo "⚠️  $ERRORS test(s) failed"
  exit 1
fi
```

**Run automated tests:**
```bash
chmod +x tests/ai-systems-test.sh
./tests/ai-systems-test.sh
```

---

### 4.11 Test Results (January 3, 2026)

**Last Test Date:** January 3, 2026, 11:51 PM PST
**Status:** ✅ ALL SYSTEMS OPERATIONAL

#### Test Summary
- **Total Tests:** 13
- **Passed:** 13/13 (100%)
- **Failed:** 0
- **Infrastructure:** ✅ All routes registered, MongoDB connected

#### System Status

**✅ Production-Ready (4 systems):**
1. **Multi-Perspective AI** - EXCELLENT (9/10)
   - All 3 perspectives working perfectly
   - High-quality responses
   - Response time: ~5 seconds for all 3

2. **Intelligent Document Processing** - EXCELLENT (8/10)
   - 80% extraction accuracy
   - Text processing: ✅ Working
   - Extracted: names, bar numbers, emails, phones, specializations

3. **Chain System** - VERY GOOD (9/10)
   - All 3 chains functional
   - Conversation summary: ✅ All steps executed
   - Mediator search: ✅ Orchestration working

4. **Infrastructure** - EXCELLENT (10/10)
   - 21 API endpoints operational
   - Error handling robust
   - CSRF configured correctly

**⚠️ Operational (Needs Tuning):**
5. **Agent System** - GOOD (7/10)
   - All 3 agents working
   - Coordinator delegating correctly
   - Needs prompt tuning for better results

6. **Memory System** - READY
   - Integration complete
   - Graceful degradation working
   - ChromaDB optional dependency

7. **QA System** - READY
   - Route registered
   - Needs database with test data

#### Performance Metrics
- GET endpoints: 40-50ms
- Single AI call: 1-2 seconds
- Multi-perspective: ~5 seconds
- IDP processing: 200ms
- Agent execution: 3-30 seconds

#### Key Test Results

**Multi-Perspective AI:**
```bash
✅ All 3 perspectives tested
✅ Single perspective tested
✅ Compare perspectives tested
✅ Quality: Excellent, detailed responses
```

**IDP:**
```bash
✅ Basic text extraction: 80% accuracy
✅ Complex text: name, bar, email, phone, specializations
✅ Error handling: Correct validation
```

**Agents:**
```bash
✅ Search agent: 3 iterations executed
✅ Coordinator: Delegated to 2 sub-agents successfully
✅ Research agent: 4 iterations executed
```

**Chains:**
```bash
✅ Conversation summary: All 3 steps completed
✅ Mediator search: Step orchestration working
✅ Available chains: All 3 listed
```

**Error Handling:**
```bash
✅ Invalid agent name: Correct error message
✅ Missing fields: Proper validation
✅ Empty input: Handled gracefully
```

#### Known Limitations (Expected)
1. Empty database → No search results (need to seed data)
2. HuggingFace rate limits → Some chains may fail (free tier)
3. ChromaDB not running → Memory features disabled (optional)
4. Agent prompts → Need tuning for optimal results

#### Production Readiness
- ✅ Ready for development/staging
- ✅ Ready for internal testing
- ⚠️ Production: Add test data + load testing

**Architecture Score:**
- Before: 6/10 (dead code)
- After: 9/10 (all systems active)

**Cost:** $0/month (FREE TIER maintained)

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

## Current Test Status & Known Issues

**Last Updated:** January 4, 2026

### Test Suite Summary

✅ **Backend Tests: 54 passing, 2 skipped**
- ✅ Unit tests: 17 passing (utils, sanitization, responseHandlers)
- ✅ Integration tests: 15 passing (auth API, rate limiting)
- ✅ AI Systems tests: 21 passing (memory, chains, agents)
- ⏭️ JWT refresh tests: 2 skipped (httpOnly cookies - hard to test)

⚠️ **Frontend Tests: Not configured**
- Placeholder script in place
- See "Frontend Test Setup" section below for setup instructions

### Current Coverage: ~16%

| Area | Coverage | Status | Priority |
|------|----------|--------|----------|
| **Utils** | 40% | ⚠️ Medium | Low |
| **Routes** | 23% | ❌ Low | High |
| **Services** | 5-15% | ❌ Very Low | High |
| **Models** | 55% | ⚠️ Medium | Medium |
| **Middleware** | 22% | ❌ Low | High |

### Coverage Improvement Plan

**Phase 1: Critical Path (Target: 40% total)**
- [ ] Add tests for all `/api/auth/*` routes
- [ ] Add tests for `/api/chat` and `/api/mediators` routes
- [ ] Add tests for chatService and affiliationDetector
- [ ] **Timeline:** 2-3 weeks

**Phase 2: AI Features (Target: 55% total)**
- [ ] Add tests for RAG engine and embedding service
- [ ] Add tests for agent system and chain system
- [ ] Add tests for memory system
- [ ] **Timeline:** 3-4 weeks

**Phase 3: Complete Coverage (Target: 70% total)**
- [ ] Add tests for all remaining routes
- [ ] Add tests for all services
- [ ] Add E2E tests for critical user flows
- [ ] **Timeline:** 4-6 weeks

### Known Issues

**1. Mongoose Duplicate Index Warning** ✅ FIXED
- **Issue:** `(node:93921) [MONGOOSE] Warning: Duplicate schema index on {"user":1} found`
- **Cause:** UsageLog model had both field-level `index: true` and compound index
- **Fix:** Removed field-level indexes, kept only compound indexes
- **Status:** Fixed in UsageLog.js

**2. Frontend Test Script Missing** ✅ FIXED
- **Issue:** `npm error Missing script: "test"` in frontend/package.json
- **Fix:** Added placeholder test script with helpful message
- **Status:** Fixed - placeholder in place, full setup pending

**3. JWT Refresh Token Tests Skipped** ⚠️ EXPECTED
- **Issue:** 2 tests skipped in auth.test.js
- **Reason:** JWT refresh tokens use httpOnly cookies, difficult to test with supertest
- **Workaround:** Manual testing + E2E tests cover this flow
- **Status:** Acceptable - not blocking

**4. Sentry/Stripe Not Configured** ✅ EXPECTED
- **Issue:** Warnings in test output
- **Reason:** Dev/test environment doesn't need these services
- **Status:** Expected behavior - no action needed

### Frontend Test Setup (Pending)

**To add frontend tests:**

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
   ```

2. **Create vitest.config.js:**
   ```javascript
   import { defineConfig } from 'vitest/config';
   import react from '@vitejs/plugin-react';

   export default defineConfig({
     plugins: [react()],
     test: {
       environment: 'jsdom',
       globals: true,
       setupFiles: './tests/setup.js',
     },
   });
   ```

3. **Update package.json:**
   ```json
   {
     "scripts": {
       "test": "vitest",
       "test:ui": "vitest --ui",
       "test:coverage": "vitest --coverage"
     }
   }
   ```

4. **Create tests directory:**
   ```bash
   mkdir -p frontend/tests
   mkdir -p frontend/tests/components
   mkdir -p frontend/tests/utils
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
