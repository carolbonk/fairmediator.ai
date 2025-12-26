# Contributing to FairMediator

Thank you for your interest in contributing to FairMediator! This document provides guidelines for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in Issues
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Your environment (OS, Node version, etc.)

### Reporting Security Vulnerabilities

**DO NOT** create public issues for security vulnerabilities.

Please report security issues to: security@fairmediator.com

See [SECURITY.md](SECURITY.md) for details.

### Suggesting Features

1. Check if the feature has been suggested in Issues
2. Create a new issue with:
   - Clear use case description
   - Expected behavior
   - Why this feature would be valuable

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes:**
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed
   - Follow DRY principles (see below)
   - Ensure security best practices (see below)

4. **Test your changes:**
   ```bash
   # Backend tests
   cd backend && npm test

   # Frontend tests
   cd frontend && npm test

   # Security scan
   npm audit
   ```

5. **Commit with clear messages:**
   ```bash
   git commit -m "feat: add mediator search filtering"
   git commit -m "fix: resolve affiliation detection bug"
   git commit -m "docs: update API documentation"
   git commit -m "security: fix XSS vulnerability in search"
   ```

6. **Push and create PR:**
   ```bash
   git push origin feature/your-feature-name
   ```

## Development Guidelines

### Code Style

**JavaScript/React:**
- Use ES6+ features
- 2 spaces for indentation
- Semicolons required
- Meaningful variable names
- JSDoc comments for functions

**Python:**
- Follow PEP 8
- Type hints where appropriate
- Docstrings for all functions
- 4 spaces for indentation

### DRY Principles (Don't Repeat Yourself)

We prioritize code reusability and maintainability:

**Backend Utilities:**
- Use `/backend/src/utils/responseHandlers.js` for API responses
  ```javascript
  const { sendSuccess, sendError } = require('../utils/responseHandlers');

  // Instead of: res.status(200).json({ success: true, data: users })
  sendSuccess(res, users);

  // Instead of: res.status(500).json({ error: 'Failed' })
  sendError(res, 500, 'Failed to fetch users');
  ```

- Use `/backend/src/utils/sanitization.js` for input sanitization
  ```javascript
  const { sanitizeObject } = require('../utils/sanitization');
  const clean = sanitizeObject(req.body);
  ```

- Use `/backend/src/utils/rateLimiterFactory.js` for rate limiting
  ```javascript
  const { rateLimiters } = require('../utils/rateLimiterFactory');
  router.post('/login', rateLimiters.auth, loginHandler);
  ```

**Frontend Utilities:**
- Use `/frontend/src/utils/apiFactory.js` for API calls
  ```javascript
  import { createApiEndpoint } from '../utils/apiFactory';
  const getUsers = createApiEndpoint('get', '/api/users');
  ```

- Use `/frontend/src/components/common/LoadingSpinner.jsx` for loading states
  ```jsx
  import LoadingSpinner from '../components/common/LoadingSpinner';
  {isLoading && <LoadingSpinner size="lg" color="blue" />}
  ```

- Use `/frontend/src/components/common/EmptyState.jsx` for empty data
  ```jsx
  import EmptyState from '../components/common/EmptyState';
  <EmptyState title="No mediators found" description="Try adjusting your filters" />
  ```

**Before creating new code, check if:**
- Similar functionality exists in utils/
- You can extract reusable logic
- You're duplicating patterns from other files

### Security Best Practices

**CRITICAL: All contributors must follow these security guidelines**

1. **Never commit secrets:**
   ```bash
   # Add to .gitignore
   .env
   .env.local
   .env.production
   ```

2. **Input validation:**
   ```javascript
   // Always validate user input
   const schema = Joi.object({
     email: Joi.string().email().required(),
     password: Joi.string().min(12).required()
   });
   ```

3. **Output sanitization:**
   ```javascript
   // Use sanitization utils
   const { sanitizeObject } = require('../utils/sanitization');
   req.body = sanitizeObject(req.body);
   ```

4. **Authentication checks:**
   ```javascript
   // Always use authentication middleware
   router.get('/profile', authenticate, getProfile);
   ```

5. **SQL/NoSQL injection prevention:**
   ```javascript
   // Use parameterized queries, never string concatenation
   User.findById(req.params.id); // Good
   // User.find({ $where: userInput }); // BAD!
   ```

6. **XSS prevention:**
   ```javascript
   // Sanitize all user input before rendering
   // Never use dangerouslySetInnerHTML without sanitization
   ```

7. **CSRF protection:**
   ```javascript
   // Include CSRF token in state-changing requests
   headers: { 'X-CSRF-Token': csrfToken }
   ```

### Testing

- Write tests for new features
- Ensure existing tests pass
- Test security scenarios (injection attempts, auth bypass, etc.)
- Check for edge cases
- Run security scans:
  ```bash
  npm audit
  npm audit fix
  ```

### Documentation

- Update README if adding major features
- Document new API endpoints
- Add JSDoc/docstrings to code
- Update SECURITY.md for security-related changes
- Update this CONTRIBUTING.md if adding new patterns

## Project Structure

```
FairMediator/
├── frontend/                  # React + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/       # Reusable components (LoadingSpinner, EmptyState)
│   │   │   ├── auth/         # Authentication components
│   │   │   ├── dashboard/    # Dashboard components
│   │   │   └── subscription/ # Subscription components
│   │   ├── services/         # API clients
│   │   ├── utils/            # Utility functions (apiFactory)
│   │   └── App.jsx
│   └── package.json
├── backend/                   # Node.js + Express
│   ├── src/
│   │   ├── routes/           # API endpoints
│   │   ├── models/           # MongoDB schemas
│   │   ├── middleware/       # Auth, validation, sanitization, CSRF
│   │   ├── services/         # Business logic
│   │   ├── utils/            # Shared utilities (NEW!)
│   │   │   ├── responseHandlers.js  # DRY response patterns
│   │   │   ├── sanitization.js      # DRY sanitization
│   │   │   └── rateLimiterFactory.js # DRY rate limiting
│   │   ├── config/           # Configuration files
│   │   └── server.js
│   └── package.json
├── automation/               # Python scripts
├── CONTRIBUTING.md          # This file
├── SECURITY.md              # Security guidelines
├── DEPLOYMENT.md            # Deployment guide
└── README.md
```

## AI Integration (HuggingFace)

When working with HuggingFace models:

1. **Use environment variables:**
   ```javascript
   const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
   ```

2. **Handle errors gracefully:**
   ```javascript
   try {
     const response = await hfClient.query(prompt);
   } catch (error) {
     logger.error('HF API error:', error);
     // Fallback logic
   }
   ```

3. **Log usage for monitoring:**
   ```javascript
   logger.info('AI query', { model, tokens, latency });
   ```

## Code Review Checklist

Before submitting your PR, verify:

**Security:**
- [ ] No hardcoded secrets or API keys
- [ ] Input validation implemented
- [ ] Output sanitization applied
- [ ] Authentication/authorization checks in place
- [ ] No SQL/NoSQL injection vulnerabilities
- [ ] XSS prevention applied
- [ ] CSRF protection for state-changing operations
- [ ] Error messages don't leak sensitive info
- [ ] `npm audit` passes with no high/critical issues

**Code Quality:**
- [ ] No code duplication (DRY principles followed)
- [ ] Reusable utilities used from `/utils/` folders
- [ ] Meaningful variable/function names
- [ ] Comments for complex logic
- [ ] Tests added for new features
- [ ] Documentation updated

**Performance:**
- [ ] No unnecessary API calls
- [ ] Efficient database queries
- [ ] Rate limiting considered
- [ ] Caching implemented where appropriate

## Getting Help

- **Questions?** Open an issue with `question` label
- **Security concerns?** Email security@fairmediator.com
- **Feature discussions?** Start a GitHub Discussion
- **Bug reports?** Create an issue with detailed reproduction steps

## Resources

- **Security:** [SECURITY.md](SECURITY.md)
- **Deployment:** [DEPLOYMENT.md](DEPLOYMENT.md)
- **WAF Setup:** [WAF_INTEGRATION_GUIDE.md](WAF_INTEGRATION_GUIDE.md)
- **HuggingFace Docs:** https://huggingface.co/docs

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for helping make FairMediator better! 🎯⚖️
