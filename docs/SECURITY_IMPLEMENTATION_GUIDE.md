# Security Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the security enhancements created during the security audit. Follow these steps to apply all security measures to your FairMediator application.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Backend Implementation](#backend-implementation)
3. [Frontend Implementation](#frontend-implementation)
4. [Testing Security](#testing-security)
5. [Deployment Checklist](#deployment-checklist)

---

## Quick Start

### 1. Update Environment Variables

**Backend** (`/backend/.env`):
```bash
# Generate strong secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env
JWT_SECRET=your_generated_secret_here
JWT_REFRESH_SECRET=your_generated_refresh_secret_here

# Sign up for free Sentry account: https://sentry.io/signup/
SENTRY_DSN=https://your-sentry-dsn@sentry.io/your-project-id
```

**Frontend** (`/frontend/.env`):
```bash
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/your-frontend-project-id
```

### 2. Install Dependencies

Already installed:
- Backend: `@sentry/node`, `@sentry/profiling-node`, `joi` (already in package.json)
- Frontend: Need to install `@sentry/react`

```bash
cd frontend
npm install @sentry/react
```

---

## Backend Implementation

### Step 1: Update server.js

Replace your current `/backend/src/server.js` with the enhanced version:

```javascript
/**
 * FairMediator Backend Server
 * Main entry point with security enhancements
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

// Import Sentry configuration
const {
  initSentry,
  requestHandler,
  tracingHandler,
  errorHandler: sentryErrorHandler,
} = require('./config/sentry');

// Import security middleware
const {
  requestId,
  requestLogger,
  sanitizeBody,
  noSQLInjectionProtection,
  corsOptions,
  secureHeaders,
} = require('./middleware/security');

// Import error handling
const {
  errorHandler,
  notFoundHandler,
  handleUnhandledRejection,
  handleUncaughtException,
} = require('./middleware/errorHandler');

// Import routes
const mediatorRoutes = require('./routes/mediators');
const chatRoutes = require('./routes/chat');
const affiliationRoutes = require('./routes/affiliations');

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize Sentry (must be first)
initSentry(app);

// Sentry request handler (must be first middleware)
app.use(requestHandler());
app.use(tracingHandler());

// Security middleware
app.use(helmet(secureHeaders));
app.use(cors(corsOptions));

// Request tracking
app.use(requestId);
if (process.env.NODE_ENV === 'development') {
  app.use(requestLogger);
}

// Body parsing middleware
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Security sanitization
app.use(sanitizeBody);
app.use(noSQLInjectionProtection);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    sentry: process.env.SENTRY_DSN ? 'configured' : 'not configured',
  });
});

// API routes
app.use('/api/mediators', mediatorRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/affiliations', affiliationRoutes);

// Sentry error handler (must be before other error handlers)
app.use(sentryErrorHandler());

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', handleUnhandledRejection);

// Handle uncaught exceptions
process.on('uncaughtException', handleUncaughtException);

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Shutting down gracefully...');

  // Close MongoDB connection
  await mongoose.connection.close();

  // Close Sentry
  if (process.env.SENTRY_DSN) {
    const { close } = require('./config/sentry');
    await close();
  }

  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 FairMediator backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Security: Enhanced with validation, sanitization, and monitoring`);
});

module.exports = app;
```

### Step 2: Update Routes with Validation

**Update `/backend/src/routes/mediators.js`:**

```javascript
/**
 * Mediator Routes with Validation
 */

const express = require('express');
const router = express.Router();
const Mediator = require('../models/Mediator');
const ideologyClassifier = require('../services/huggingface/ideologyClassifier');
const { validate } = require('../middleware/validation');
const { mediatorSchemas } = require('../middleware/validationSchemas');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');

/**
 * GET /api/mediators
 * Get all mediators with optional filtering
 */
router.get(
  '/',
  validate(mediatorSchemas.getMediators),
  asyncHandler(async (req, res) => {
    const {
      practiceArea,
      location,
      ideology,
      minExperience,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (practiceArea) {
      query.practiceAreas = { $in: [practiceArea] };
    }

    if (location) {
      query['location.state'] = new RegExp(location, 'i');
    }

    if (ideology) {
      const ideologyMap = {
        liberal: { $lte: -1 },
        conservative: { $gte: 1 },
        neutral: { $gt: -1, $lt: 1 },
      };
      query.ideologyScore = ideologyMap[ideology.toLowerCase()];
    }

    if (minExperience) {
      query.yearsExperience = { $gte: parseInt(minExperience) };
    }

    const mediators = await Mediator.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ rating: -1, yearsExperience: -1 });

    const total = await Mediator.countDocuments(query);

    res.json({
      success: true,
      data: mediators,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  })
);

/**
 * GET /api/mediators/:id
 */
router.get(
  '/:id',
  validate(mediatorSchemas.getMediator),
  asyncHandler(async (req, res) => {
    const mediator = await Mediator.findById(req.params.id);

    if (!mediator) {
      throw new NotFoundError('Mediator not found');
    }

    res.json({
      success: true,
      data: mediator,
    });
  })
);

/**
 * POST /api/mediators
 */
router.post(
  '/',
  validate(mediatorSchemas.createMediator),
  asyncHandler(async (req, res) => {
    const mediator = new Mediator(req.body);
    mediator.calculateCompleteness();

    await mediator.save();

    res.status(201).json({
      success: true,
      data: mediator,
    });
  })
);

/**
 * PUT /api/mediators/:id
 */
router.put(
  '/:id',
  validate(mediatorSchemas.updateMediator),
  asyncHandler(async (req, res) => {
    const mediator = await Mediator.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdated: Date.now() },
      { new: true, runValidators: true }
    );

    if (!mediator) {
      throw new NotFoundError('Mediator not found');
    }

    mediator.calculateCompleteness();
    await mediator.save();

    res.json({
      success: true,
      data: mediator,
    });
  })
);

/**
 * POST /api/mediators/:id/analyze-ideology
 */
router.post(
  '/:id/analyze-ideology',
  validate(mediatorSchemas.analyzeIdeology),
  asyncHandler(async (req, res) => {
    const mediator = await Mediator.findById(req.params.id);

    if (!mediator) {
      throw new NotFoundError('Mediator not found');
    }

    const analysis = await ideologyClassifier.classifyIdeology(mediator);

    mediator.ideologyScore = analysis.score;
    mediator.ideologyLabel = analysis.label;
    mediator.ideologyConfidence = analysis.confidence;
    mediator.ideologyAnalysis = {
      factors: analysis.factors,
      summary: analysis.summary,
      analyzedAt: new Date(),
    };

    await mediator.save();

    res.json({
      success: true,
      data: {
        mediator,
        analysis,
      },
    });
  })
);

module.exports = router;
```

**Update `/backend/src/routes/chat.js`:**

```javascript
/**
 * Chat Routes with Validation
 */

const express = require('express');
const router = express.Router();
const chatService = require('../services/huggingface/chatService');
const { validate } = require('../middleware/validation');
const { chatSchemas } = require('../middleware/validationSchemas');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * POST /api/chat
 */
router.post(
  '/',
  validate(chatSchemas.sendMessage),
  asyncHandler(async (req, res) => {
    const { message, history = [] } = req.body;

    const result = await chatService.processQuery(message, history);

    res.json({
      success: true,
      ...result,
    });
  })
);

/**
 * POST /api/chat/stream
 */
router.post(
  '/stream',
  validate(chatSchemas.streamMessage),
  asyncHandler(async (req, res) => {
    const { message, history = [] } = req.body;

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    await chatService.streamResponse(message, history, chunk => {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    });

    res.write('data: [DONE]\n\n');
    res.end();
  })
);

module.exports = router;
```

### Step 3: Create Config Directory

```bash
mkdir -p /Users/carolbonk/Desktop/FairMediator/backend/src/config
```

The `sentry.js` file has already been created in the config directory.

---

## Frontend Implementation

### Step 1: Create Error Boundary Component

Create `/frontend/src/components/ErrorBoundary.jsx` using the code from `ERROR_HANDLING_FRONTEND.md`.

### Step 2: Create Sentry Configuration

Create `/frontend/src/config/sentry.js` using the code from `ERROR_HANDLING_FRONTEND.md`.

### Step 3: Update main.jsx

```javascript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { initSentry } from './config/sentry';
import App from './App.jsx';
import './index.css';

// Initialize Sentry
initSentry();

const SentryApp = Sentry.withProfiler(App);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<div>An error has occurred</div>}>
      <SentryApp />
    </Sentry.ErrorBoundary>
  </StrictMode>
);
```

### Step 4: Update App.jsx

Wrap your app with ErrorBoundary:

```jsx
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      {/* Your existing app code */}
    </ErrorBoundary>
  );
}

export default App;
```

### Step 5: Enhance API Error Handling

Update `/frontend/src/services/api.js`:

```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // Log to Sentry
      if (window.Sentry && status >= 500) {
        window.Sentry.captureException(error, {
          tags: {
            api_endpoint: error.config.url,
            status_code: status,
          },
        });
      }

      // Handle specific error codes
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          console.error('Forbidden:', data.error?.message);
          break;
        case 429:
          console.error('Rate limited:', data.error?.message);
          break;
        default:
          console.error('API Error:', data.error?.message);
      }
    } else if (error.request) {
      // Network error
      console.error('Network error - please check your connection');
    }

    return Promise.reject(error);
  }
);

// Existing API methods...
export const sendChatMessage = async (message, history = []) => {
  const response = await api.post('/chat', { message, history });
  return response.data;
};

export const getMediators = async (filters = {}) => {
  const response = await api.get('/mediators', { params: filters });
  return response.data;
};

export default api;
```

---

## Testing Security

### 1. Test Input Validation

```bash
# Test invalid email
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid", "password": "Test123!"}'

# Expected: 400 Bad Request with validation error

# Test SQL injection attempt
curl -X GET "http://localhost:5001/api/mediators?location=\$gt"

# Expected: 400 Bad Request - MongoDB operators blocked

# Test XSS attempt
curl -X POST http://localhost:5001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "<script>alert(1)</script>"}'

# Expected: Script tags stripped from response
```

### 2. Test Rate Limiting

```bash
# Send 101 requests rapidly
for i in {1..101}; do
  curl http://localhost:5001/api/mediators
done

# Expected: Request 101 returns 429 Too Many Requests
```

### 3. Test Error Handling

```javascript
// In your frontend, trigger an error
throw new Error('Test error');

// Expected:
// - Error boundary catches it
// - Fallback UI displayed
// - Error sent to Sentry (if configured)
```

### 4. Verify Sentry

1. Go to your Sentry dashboard
2. Trigger an error in your app
3. Check that error appears in Sentry within seconds

---

## Deployment Checklist

### Pre-Deployment

- [ ] All environment variables set
- [ ] JWT secrets generated (32+ characters)
- [ ] Sentry DSN configured
- [ ] NODE_ENV=production
- [ ] MongoDB connection string uses SSL
- [ ] CORS_ORIGIN set to production domain
- [ ] Rate limits adjusted for production
- [ ] All dependencies up to date (`npm audit`)

### Backend Deployment

- [ ] Build process complete
- [ ] Environment variables in production environment
- [ ] Health check endpoint working
- [ ] Sentry capturing errors
- [ ] Database backups configured
- [ ] Logs properly configured
- [ ] HTTPS/SSL certificate installed

### Frontend Deployment

- [ ] Build process complete (`npm run build`)
- [ ] Sentry DSN configured
- [ ] API URL points to production backend
- [ ] Error boundaries in place
- [ ] Static assets served over HTTPS

### Post-Deployment

- [ ] Test all critical user flows
- [ ] Verify error tracking in Sentry
- [ ] Check rate limiting is working
- [ ] Monitor logs for errors
- [ ] Test authentication flow
- [ ] Verify CORS configuration
- [ ] Check performance metrics

---

## Troubleshooting

### Sentry Not Working

1. Check DSN is correct
2. Verify environment variable is loaded
3. Check browser console for errors
4. Verify Sentry.io project is active

### Validation Errors Too Strict

Adjust schemas in `/backend/src/middleware/validationSchemas.js`:

```javascript
// Make a field optional
email: emailSchema.optional()

// Increase max length
message: sanitizedString.max(5000)

// Allow additional values
status: Joi.string().valid('active', 'pending', 'new_status')
```

### Rate Limiting Too Aggressive

Adjust in server.js:

```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Increase window
  max: 200, // Increase limit
});
```

### CORS Issues

Update corsOptions in `/backend/src/middleware/security.js`:

```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'https://yourdomain.com',
  'https://www.yourdomain.com',
];
```

---

## Next Steps

1. **Set up monitoring**: Configure Sentry alerts
2. **Performance optimization**: Use Sentry performance monitoring
3. **Security scanning**: Use tools like npm audit, Snyk
4. **Penetration testing**: Consider hiring security professionals
5. **Compliance**: Ensure GDPR, CCPA compliance if applicable

---

## Support

For questions or issues:
- Review `/docs/SECURITY.md`
- Check `/docs/ERROR_HANDLING_FRONTEND.md`
- Open an issue on GitHub

---

**Last Updated**: 2025-11-14
**Version**: 1.0.0
