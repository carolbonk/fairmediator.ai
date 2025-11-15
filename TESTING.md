# Testing Guide for FairMediator

## Day 5 Testing Summary

We've created comprehensive test suites for all Day 5 features:

### Test Files Created (51+ tests)
1. **subscription.test.js** (12 tests) - Stripe integration
2. **dashboard.test.js** (10 tests) - Analytics and usage stats
3. **multiPerspectiveAI.test.js** (9 tests) - AI agents (requires API key)
4. **enhancedAffiliations.test.js** (10 tests) - NLP conflict detection (requires API key)
5. **recommendationScoring.test.js** (10 tests) - 7-factor scoring algorithm

## Prerequisites for Running Tests

### 1. MongoDB

Tests require a running MongoDB instance:

```bash
# Install MongoDB (if not installed)
brew install mongodb-community  # macOS
# OR
sudo apt-get install mongodb    # Linux

# Start MongoDB
brew services start mongodb-community  # macOS
# OR
sudo systemctl start mongod           # Linux
# OR
mongod --dbpath=/path/to/data/dir    # Manual start
```

### 2. Environment Variables (Optional)

Create `/backend/.env.test` file:

```bash
# Required
MONGODB_URI=mongodb://localhost:27017/fairmediator-test
JWT_SECRET=test-secret
JWT_REFRESH_SECRET=test-refresh-secret

# Optional - Tests will skip if not provided
HUGGINGFACE_API_KEY=your_free_key_here  # Get at https://huggingface.co/settings/tokens

# Optional - For subscription tests
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

## Running Tests

```bash
cd backend

# Run all tests
npm test

# Run specific test suite
npm test -- tests/subscription.test.js

# Run with coverage
npm test -- --coverage

# Run tests excluding HuggingFace tests
npm test -- --testPathIgnorePatterns="multiPerspective|enhancedAffiliations"

# Run tests with verbose output
npm test -- --verbose
```

## Test Status

### ✅ Tests Ready to Run (with MongoDB)
- subscription.test.js
- dashboard.test.js
- recommendationScoring.test.js

### ⚠️ Tests Require HuggingFace API Key
- multiPerspectiveAI.test.js (will skip if no key)
- enhancedAffiliations.test.js (will skip if no key)

### 📝 What Each Test Suite Covers

**Subscription Tests:**
- Checkout session creation
- Billing portal access
- Subscription cancellation
- Webhook handling
- Free vs Premium tier features

**Dashboard Tests:**
- User statistics retrieval
- Time range filtering (7/30/90 days)
- Search trends analysis
- Popular mediators tracking
- Platform-wide analytics (premium only)
- Conversion funnel metrics

**Recommendation Scoring Tests:**
- 7-factor scoring algorithm
- Mediator ranking
- Practice area matching
- Location proximity
- Ideology alignment
- Availability scoring

**Multi-Perspective AI Tests:**
- Liberal/Neutral/Conservative agent responses
- Conversation history handling
- Perspective comparison
- Error handling

**Enhanced Affiliations Tests:**
- Exact entity matching
- Semantic similarity detection (NLP)
- Multiple party conflict checking
- Risk level calculation (low/medium/high)
- Case history analysis

## Current Test Status (Without MongoDB)

```
❌ Subscription API: 12 tests (needs MongoDB)
❌ Dashboard API: 10 tests (needs MongoDB)
❌ Recommendation Scoring: 10 tests (needs MongoDB)
⏭️  Multi-Perspective AI: 9 tests (skipped - no API key)
⏭️  Enhanced Affiliations: 10 tests (skipped - no API key)
```

## To Get All Tests Passing

1. **Start MongoDB:**
   ```bash
   brew services start mongodb-community
   ```

2. **Optional - Add HuggingFace API key:**
   - Visit https://huggingface.co/settings/tokens
   - Create a FREE API token
   - Add to `.env.test`: `HUGGINGFACE_API_KEY=your_key`

3. **Run tests:**
   ```bash
   cd backend && npm test
   ```

## Test Coverage Goals

- ✅ Unit tests for all services
- ✅ Integration tests for all API endpoints
- ✅ Authentication and authorization tests
- ✅ Usage tracking and limits tests
- ✅ Premium feature restrictions tests
- ✅ Error handling tests

## Troubleshooting

**"MongooseError: Operation buffering timed out"**
- MongoDB is not running. Start it with `brew services start mongodb-community`

**"HUGGINGFACE_API_KEY is required"**
- Tests will auto-skip if no key is provided (this is expected)
- Get a FREE key at https://huggingface.co/settings/tokens if you want to run those tests

**"listen EADDRINUSE: address already in use"**
- Backend server is already running. Stop it before running tests.
- Kill with: `lsof -ti:5001 | xargs kill -9`

**Deprecation warnings about useNewUrlParser**
- These are harmless - MongoDB driver no longer needs these options
- Can be ignored or fixed by removing from connection options
