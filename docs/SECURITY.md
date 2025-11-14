# Security Documentation

## Table of Contents
1. [Security Architecture](#security-architecture)
2. [Authentication & Authorization](#authentication--authorization)
3. [Data Protection](#data-protection)
4. [Input Validation](#input-validation)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Security Best Practices](#security-best-practices)
8. [Reporting Security Issues](#reporting-security-issues)

---

## Security Architecture

FairMediator implements a defense-in-depth security strategy with multiple layers of protection:

### Security Layers
```
┌─────────────────────────────────────────┐
│  1. Network Layer (HTTPS, CORS)         │
├─────────────────────────────────────────┤
│  2. Application Layer (Helmet, CSP)     │
├─────────────────────────────────────────┤
│  3. Authentication (JWT)                 │
├─────────────────────────────────────────┤
│  4. Authorization (Role/Tier-based)      │
├─────────────────────────────────────────┤
│  5. Input Validation (Joi schemas)       │
├─────────────────────────────────────────┤
│  6. Data Layer (Mongoose validation)     │
├─────────────────────────────────────────┤
│  7. Monitoring (Sentry error tracking)   │
└─────────────────────────────────────────┘
```

### Key Security Components

1. **helmet.js** - Sets secure HTTP headers
2. **CORS** - Cross-Origin Resource Sharing controls
3. **JWT** - JSON Web Token authentication
4. **Joi** - Schema-based input validation
5. **bcryptjs** - Password hashing (12 rounds)
6. **Sentry** - Error tracking and monitoring
7. **express-rate-limit** - API rate limiting

---

## Authentication & Authorization

### Authentication Flow

```
User Login Request
    ↓
Email & Password Validation
    ↓
Password Hash Comparison (bcrypt)
    ↓
Generate JWT Token (7 day expiry)
    ↓
Generate Refresh Token (30 day expiry)
    ↓
Return Tokens to Client
    ↓
Client Stores in Secure Storage
    ↓
Include Token in Authorization Header
    ↓
Server Validates Token on Each Request
```

### JWT Implementation

#### Token Structure
```javascript
{
  "userId": "507f1f77bcf86cd799439011",
  "iat": 1699564800,
  "exp": 1700169600
}
```

#### Security Features
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Secret**: Minimum 32 characters, stored in environment variable
- **Expiry**: 7 days (access token), 30 days (refresh token)
- **Validation**: Every request validates signature and expiry

#### Usage in Routes
```javascript
const { authenticate, requireTier } = require('../middleware/auth');

// Protected route
router.get('/profile', authenticate, async (req, res) => {
  // req.user available here
});

// Premium-only route
router.get('/premium-feature',
  authenticate,
  requireTier('premium'),
  async (req, res) => {
    // Only premium users can access
  }
);
```

### Password Security

#### Password Requirements
- Minimum 8 characters
- Maximum 128 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (@$!%*?&)

#### Password Hashing
```javascript
// bcrypt with 12 rounds (cost factor)
const salt = await bcrypt.genSalt(12);
const hash = await bcrypt.hash(password, salt);
```

**Why 12 rounds?**
- Balances security and performance
- Takes ~300ms to hash (prevents brute force)
- Resistant to GPU-based attacks

#### Password Reset Flow
1. User requests reset via email
2. Generate cryptographically secure token
3. Hash token with SHA-256 before storing
4. Send unhashed token to user's email
5. Token expires after 1 hour
6. User submits new password with token
7. Validate token and update password

---

## Data Protection

### Sensitive Data Handling

#### Data Classification
| Classification | Examples | Protection |
|---------------|----------|------------|
| **Critical** | Passwords, API keys | Hashed, never logged |
| **Sensitive** | Email, payment info | Encrypted at rest, select: false |
| **Private** | Usage stats, preferences | Access controlled |
| **Public** | Mediator profiles | Sanitized output |

#### Database Security

**Mongoose Schema Protection**
```javascript
// Password field
passwordHash: {
  type: String,
  required: true,
  select: false  // Never included in queries by default
}

// Automatic sanitization
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.passwordResetToken;
  return obj;
};
```

**MongoDB Connection Security**
- Use connection string with authentication
- Enable TLS/SSL for Atlas connections
- Restrict IP addresses in MongoDB Atlas
- Use least-privilege database users

### Data Encryption

#### At Rest
- MongoDB encryption enabled in production
- Environment variables never committed to git
- Secrets stored in secure environment configuration

#### In Transit
- HTTPS/TLS 1.2+ required in production
- Certificate pinning for API calls
- Secure WebSocket connections (WSS)

---

## Input Validation

### Validation Strategy

All user input is validated at multiple layers:

1. **Client-side** - Immediate feedback (React forms)
2. **Schema validation** - Joi middleware (Express)
3. **Database validation** - Mongoose schemas
4. **Business logic** - Application-specific rules

### Joi Validation Middleware

#### Usage Example
```javascript
const { validate } = require('../middleware/validation');
const { userSchemas } = require('../middleware/validationSchemas');

router.post('/register',
  validate(userSchemas.register),
  async (req, res) => {
    // req.body is validated and sanitized
  }
);
```

#### Validation Features
- **Type checking** - Ensures correct data types
- **Sanitization** - Removes dangerous characters
- **XSS prevention** - Strips script tags
- **SQL/NoSQL injection prevention** - Blocks operators
- **Length limits** - Prevents buffer overflow
- **Format validation** - Email, URLs, phone numbers

### XSS Protection

#### Input Sanitization
```javascript
const sanitizeString = (value) => {
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');
};
```

#### Output Encoding
- All user-generated content is escaped before rendering
- React's JSX automatically escapes values
- Use `dangerouslySetInnerHTML` only with sanitized content

### NoSQL Injection Prevention

#### Blocked Patterns
```javascript
// These are blocked by noSQLInjectionProtection middleware
{
  "$gt": "",           // Greater than operator
  "$ne": null,         // Not equal operator
  "$where": "...",     // JavaScript execution
  "__proto__": {...}   // Prototype pollution
}
```

#### Safe Query Construction
```javascript
// BAD - Vulnerable to injection
const user = await User.findOne({ email: req.body.email });

// GOOD - Validated input
const { email } = req.body; // Already validated by Joi
const user = await User.findOne({ email });
```

---

## Error Handling

### Error Handling Strategy

#### Centralized Error Handler
All errors flow through a single handler that:
1. Logs the error securely
2. Sends to Sentry (if configured)
3. Returns safe error message to client
4. Never exposes stack traces in production

#### Error Classes
```javascript
// Custom error types
AppError               // Base error class
ValidationError        // 400 - Bad input
AuthenticationError    // 401 - Not authenticated
AuthorizationError     // 403 - Not authorized
NotFoundError         // 404 - Resource not found
RateLimitError        // 429 - Too many requests
DatabaseError         // 500 - Database error
```

#### Usage Example
```javascript
const { NotFoundError } = require('../middleware/errorHandler');

const mediator = await Mediator.findById(id);
if (!mediator) {
  throw new NotFoundError('Mediator not found');
}
```

### Sentry Integration

#### Setup
```bash
# Get free Sentry account
1. Sign up at https://sentry.io/signup/
2. Create a new project (Node.js)
3. Copy your DSN
4. Add to .env: SENTRY_DSN=your-dsn-here
```

#### Features
- **Error tracking** - Automatic error capture
- **Performance monitoring** - Transaction tracking
- **User context** - Associate errors with users
- **Breadcrumbs** - Action history before errors
- **Release tracking** - Track errors by version

#### Error Filtering
```javascript
// Errors NOT sent to Sentry
- Rate limit errors (429)
- Not found errors (404)
- Validation errors (400)
- Expected operational errors
```

#### Free Tier Limits
- 5,000 errors per month
- 10,000 transactions per month
- 50 email alerts per month

---

## Rate Limiting

### Rate Limiting Policies

#### Global Rate Limit
```javascript
// Applied to all /api/* routes
Window: 15 minutes
Max Requests: 100 per window
```

#### IP-Based Rate Limit
```javascript
// Per IP address
Window: 15 minutes
Max Requests: 100 per window
Response: 429 with retry-after header
```

#### User-Based Rate Limit
```javascript
// Per authenticated user
Window: 15 minutes
Max Requests: 150 per window
```

#### Usage-Based Limits

| Tier | Daily Searches | Daily Profile Views | Daily AI Calls |
|------|---------------|--------------------|--------------------|
| Free | 5 | 10 | 20 |
| Premium | Unlimited | Unlimited | Unlimited |

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699564800
Retry-After: 900
```

### Bypassing Rate Limits
- Premium users have higher limits
- API key authentication (future feature)
- Whitelisted IPs for monitoring/health checks

---

## Security Best Practices

### Environment Variables

#### Never Commit Secrets
```bash
# .gitignore includes
.env
.env.local
.env.*.local
secrets/
*.pem
*.key
```

#### Generate Strong Secrets
```bash
# Generate JWT secret (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate session secret
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### Secure Deployment Checklist

#### Before Production
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Set up Sentry error tracking
- [ ] Enable MongoDB encryption
- [ ] Restrict CORS origins
- [ ] Configure rate limiting
- [ ] Set secure session cookies
- [ ] Enable HSTS headers
- [ ] Implement CSP headers
- [ ] Set up automated backups
- [ ] Configure log rotation
- [ ] Review IAM permissions
- [ ] Scan dependencies for vulnerabilities

#### Dependency Security
```bash
# Audit dependencies
npm audit

# Fix automatically
npm audit fix

# Check for outdated packages
npm outdated

# Update with caution
npm update
```

### Code Security Practices

#### Avoid Dangerous Patterns
```javascript
// BAD - Command injection risk
exec(userInput);

// BAD - Code injection risk
eval(userCode);

// BAD - Path traversal risk
fs.readFile(userPath);

// BAD - Exposing error details
res.status(500).json({ error: err.stack });
```

#### Safe Patterns
```javascript
// GOOD - Validate and sanitize
const validated = schema.validate(userInput);
if (validated.error) throw new ValidationError();

// GOOD - Use parameterized queries
Model.findOne({ email: validatedEmail });

// GOOD - Safe error messages
throw new AppError('Operation failed', 500);
```

### Database Security

#### Connection String Security
```javascript
// Use environment variables
mongoose.connect(process.env.MONGODB_URI);

// Enable authentication
mongodb://username:password@host:port/database

// Use TLS for remote connections
mongodb+srv://...?retryWrites=true&w=majority
```

#### Query Security
```javascript
// Use Mongoose schemas (automatic validation)
const user = new User(data);
await user.save();

// Avoid dynamic queries
// BAD: Model.find(eval(userQuery))
// GOOD: Model.find(validatedQuery)
```

### Session Security

#### Cookie Configuration
```javascript
{
  httpOnly: true,      // Prevent XSS access
  secure: true,        // HTTPS only
  sameSite: 'strict',  // CSRF protection
  maxAge: 24*60*60*1000, // 24 hours
  signed: true         // Tamper prevention
}
```

### API Security

#### Request Validation
- Validate content-type headers
- Limit request body size (100KB default)
- Validate JSON structure
- Check for parameter pollution

#### Response Security
- Remove sensitive headers
- Set cache-control appropriately
- Include security headers
- Sanitize error messages

---

## Reporting Security Issues

### How to Report

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please email security issues to:
**security@fairmediator.com** (or create a private security advisory)

### What to Include
1. **Description** - Clear explanation of the vulnerability
2. **Impact** - Potential security impact
3. **Reproduction** - Steps to reproduce the issue
4. **Environment** - Browser, OS, version information
5. **Suggestions** - Possible fixes (if known)

### Response Timeline
- **24 hours** - Initial acknowledgment
- **7 days** - Assessment and severity classification
- **30 days** - Fix deployed (for critical issues)
- **90 days** - Public disclosure (after fix)

### Security Disclosure Policy
We follow **responsible disclosure**:
1. Report received and acknowledged
2. Issue validated and prioritized
3. Fix developed and tested
4. Fix deployed to production
5. Security advisory published
6. Reporter credited (if desired)

### Bounty Program
Currently, we do not offer a bug bounty program. However, we will:
- Credit security researchers in our security advisories
- Provide swag/recognition for significant findings
- Consider bounties on a case-by-case basis

---

## Security Audit Results

### Audit Date: 2025-11-14

#### Findings Summary

**CRITICAL: 0**
**HIGH: 0**
**MEDIUM: 0**
**LOW: 0**
**INFO: Multiple improvements implemented**

### Models Reviewed

#### User.js
✅ Password hashing with bcrypt (12 rounds)
✅ Sensitive fields marked select: false
✅ toJSON method removes sensitive data
✅ Password reset token properly hashed
✅ Email validation at schema level
✅ Usage limits enforced

#### Subscription.js
✅ Proper enum validation
✅ Stripe IDs properly indexed
✅ Cancellation tracking
✅ Feature flag controls

#### UsageLog.js
✅ TTL index for GDPR compliance (90 days)
✅ Proper indexing for performance
✅ IP address storage controlled
✅ Safe aggregation queries

### Routes Reviewed

#### mediators.js
⚠️ Needs input validation middleware (FIXED)
⚠️ MongoDB injection risk in query params (FIXED)
✅ Uses Mongoose for safe queries

#### chat.js
⚠️ Needs input sanitization (FIXED)
⚠️ No rate limiting on stream endpoint (FIXED)
✅ Basic type checking present

### Recommendations Implemented

1. ✅ Added Joi validation middleware
2. ✅ Created validation schemas for all routes
3. ✅ Added NoSQL injection protection
4. ✅ Configured Sentry error tracking
5. ✅ Enhanced security headers
6. ✅ Added request sanitization
7. ✅ Implemented usage-based rate limiting
8. ✅ Created authentication middleware

---

## Security Maintenance

### Regular Tasks

#### Weekly
- [ ] Review Sentry error logs
- [ ] Check rate limit violations
- [ ] Monitor failed login attempts

#### Monthly
- [ ] Run npm audit
- [ ] Update dependencies
- [ ] Review access logs
- [ ] Check for security advisories

#### Quarterly
- [ ] Conduct security audit
- [ ] Review and update this document
- [ ] Test disaster recovery
- [ ] Review IAM permissions
- [ ] Penetration testing (if budget allows)

### Security Contacts
- **Security Issues**: security@fairmediator.com
- **General Contact**: support@fairmediator.com

---

## Additional Resources

### Documentation
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)

### Tools
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Snyk](https://snyk.io/) - Free tier available
- [OWASP ZAP](https://www.zaproxy.org/) - Free security scanner
- [SonarQube](https://www.sonarqube.org/) - Free code quality

### Training
- [OWASP WebGoat](https://owasp.org/www-project-webgoat/)
- [NodeSchool](https://nodeschool.io/)
- [HackerOne Resources](https://www.hackerone.com/resources)

---

**Last Updated**: 2025-11-14
**Version**: 1.0.0
**Maintained By**: Security Team
