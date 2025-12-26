# Backend Utilities

This directory contains shared utility modules to eliminate code duplication and improve maintainability.

## Available Utilities

### responseHandlers.js

Standardized API response handlers to eliminate duplicate response patterns.

**Usage:**

```javascript
const { sendSuccess, sendError, sendNotFound } = require('../utils/responseHandlers');

// Success response
router.get('/users', async (req, res) => {
  const users = await User.find();
  sendSuccess(res, users); // 200 with { success: true, data: users }
});

// Error response
router.post('/users', async (req, res) => {
  try {
    const user = await User.create(req.body);
    sendSuccess(res, user, 201); // 201 Created
  } catch (error) {
    sendError(res, 500, 'Failed to create user');
  }
});

// Not found
router.get('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return sendNotFound(res, 'User');
  sendSuccess(res, user);
});
```

**Available functions:**
- `sendSuccess(res, data, statusCode, message)` - Send success response
- `sendError(res, statusCode, message, details)` - Send error response
- `sendValidationError(res, errors)` - Send validation errors
- `sendUnauthorized(res, message)` - Send 401 response
- `sendForbidden(res, message)` - Send 403 response
- `sendNotFound(res, resource)` - Send 404 response
- `asyncHandler(fn)` - Wrap async route handlers

---

### sanitization.js

Shared sanitization utilities to prevent XSS and NoSQL injection.

**Usage:**

```javascript
const { sanitizeObject, sanitizeString } = require('../utils/sanitization');

// Sanitize request body
router.post('/search', (req, res) => {
  const cleanQuery = sanitizeObject(req.body);
  // Use cleanQuery safely
});

// Sanitize individual string
const cleanName = sanitizeString(userInput);
```

**Available functions:**
- `sanitizeString(dirty)` - Remove HTML tags from string
- `sanitizeObject(obj)` - Recursively sanitize object (removes $, ., HTML)
- `sanitizeRequest(req, res, next)` - Middleware to sanitize req.body/query/params
- `removeDangerousChars(input)` - Remove script tags, event handlers, etc.

---

### rateLimiterFactory.js

Factory for creating rate limiters with consistent configuration.

**Usage:**

```javascript
const { rateLimiters, createRateLimiter } = require('../utils/rateLimiterFactory');

// Use pre-configured limiters
router.post('/auth/login', rateLimiters.auth, loginHandler);
router.post('/auth/register', rateLimiters.registration, registerHandler);
router.post('/chat', rateLimiters.chat, chatHandler);

// Create custom rate limiter
const customLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests
  message: 'Custom rate limit message'
});

router.post('/custom', customLimiter, handler);
```

**Pre-configured limiters:**
- `rateLimiters.global` - 100 req/15min
- `rateLimiters.auth` - 5 attempts/15min (skip successful)
- `rateLimiters.registration` - 3 accounts/hour
- `rateLimiters.passwordReset` - 3 attempts/hour
- `rateLimiters.emailVerification` - 3 emails/hour
- `rateLimiters.chat` - 30 messages/minute
- `rateLimiters.search` - 60 searches/minute
- `rateLimiters.subscription` - 10 changes/hour

---

## Why These Utilities?

### Before (Duplicated Code)

```javascript
// In routes/auth.js
res.status(500).json({ error: 'Login failed' });

// In routes/users.js
res.status(500).json({ error: 'User creation failed' });

// In routes/mediators.js
res.status(500).json({ error: 'Failed to fetch mediators' });
```

**Problems:**
- Inconsistent response format
- Duplicate error handling logic (29 occurrences!)
- Hard to change response structure globally
- No centralized logging

### After (DRY Utilities)

```javascript
const { sendError } = require('../utils/responseHandlers');

// In routes/auth.js
sendError(res, 500, 'Login failed');

// In routes/users.js
sendError(res, 500, 'User creation failed');

// In routes/mediators.js
sendError(res, 500, 'Failed to fetch mediators');
```

**Benefits:**
- ✅ Consistent response format
- ✅ Centralized logging
- ✅ Single source of truth
- ✅ Easy to modify globally
- ✅ Reduces codebase by ~15-20%

---

## Migration Guide

### Migrating Existing Routes

1. **Import utilities:**
   ```javascript
   const { sendSuccess, sendError } = require('../utils/responseHandlers');
   ```

2. **Replace response patterns:**
   ```javascript
   // Old
   res.status(200).json({ success: true, data: users });

   // New
   sendSuccess(res, users);
   ```

3. **Replace error patterns:**
   ```javascript
   // Old
   res.status(500).json({ error: 'Failed to fetch users' });

   // New
   sendError(res, 500, 'Failed to fetch users');
   ```

4. **Replace rate limiters:**
   ```javascript
   // Old (in rateLimiting.js)
   const authLimiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 5,
     // ... lots of config
   });

   // New
   const { rateLimiters } = require('../utils/rateLimiterFactory');
   router.post('/login', rateLimiters.auth, loginHandler);
   ```

---

## Testing

Test that utilities work as expected:

```javascript
// test/utils/responseHandlers.test.js
const { sendSuccess, sendError } = require('../../src/utils/responseHandlers');

describe('Response Handlers', () => {
  it('should send success response', () => {
    const res = mockResponse();
    sendSuccess(res, { id: 1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { id: 1 }
    });
  });
});
```

---

## Contributing

When adding new utilities:

1. Follow existing patterns
2. Add JSDoc comments
3. Update this README
4. Add tests
5. Update CONTRIBUTING.md

See [CONTRIBUTING.md](../../../CONTRIBUTING.md) for guidelines.
