# Security Quick Start Guide

This is a quick reference for implementing the security enhancements in FairMediator.

---

## Prerequisites

- Node.js installed
- MongoDB connection configured
- Free Sentry account (optional but recommended)

---

## 5-Minute Setup

### 1. Install Frontend Dependencies

```bash
cd frontend
npm install @sentry/react
```

### 2. Generate Secrets

```bash
# Generate JWT secret
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate refresh secret
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Update Environment Variables

**Backend** (`/backend/.env`):
```bash
# Copy from output above
JWT_SECRET=your_generated_secret_here
JWT_REFRESH_SECRET=your_generated_refresh_secret_here

# Optional: Sign up at https://sentry.io/signup/
SENTRY_DSN=https://your-sentry-dsn@sentry.io/your-project-id
```

**Frontend** (`/frontend/.env`):
```bash
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/your-frontend-project-id
```

### 4. Restart Servers

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

---

## What Was Created

### Backend Files

```
backend/src/
├── middleware/
│   ├── auth.js                    # JWT authentication
│   ├── errorHandler.js            # Error handling
│   ├── security.js                # Security utilities
│   ├── validation.js              # Input validation
│   └── validationSchemas.js       # Validation rules
└── config/
    └── sentry.js                  # Error tracking
```

### Documentation

```
docs/
├── SECURITY.md                     # Main security documentation
├── SECURITY_AUDIT_REPORT.md        # Audit findings and results
├── SECURITY_IMPLEMENTATION_GUIDE.md # Step-by-step implementation
└── ERROR_HANDLING_FRONTEND.md      # React error handling
```

---

## Quick Tests

### Test Input Validation

```bash
# Should reject invalid email
curl -X POST http://localhost:5001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": ""}'

# Expected: 400 Bad Request with validation error
```

### Test NoSQL Injection Protection

```bash
# Should block MongoDB operators
curl "http://localhost:5001/api/mediators?location=\$gt"

# Expected: 400 Bad Request - operators not allowed
```

### Test Rate Limiting

```bash
# Send many requests
for i in {1..101}; do curl http://localhost:5001/api/mediators; done

# Expected: 429 Too Many Requests on request 101
```

---

## Key Features Implemented

✅ Input validation on all routes
✅ NoSQL injection protection
✅ XSS protection
✅ JWT authentication framework
✅ Tier-based authorization
✅ Usage-based rate limiting
✅ Centralized error handling
✅ Sentry error tracking
✅ Enhanced security headers
✅ Request sanitization

---

## Security Checklist

### Before Production

- [ ] Set NODE_ENV=production
- [ ] Generate strong JWT secrets (32+ chars)
- [ ] Configure Sentry DSN
- [ ] Enable HTTPS/TLS
- [ ] Set CORS_ORIGIN to production domain
- [ ] Review rate limits
- [ ] Run npm audit
- [ ] Test authentication flow
- [ ] Verify error tracking

### After Production

- [ ] Monitor Sentry dashboard
- [ ] Check rate limit violations
- [ ] Review access logs
- [ ] Update dependencies monthly
- [ ] Run security audit quarterly

---

## Common Issues

### Validation Too Strict?
Edit `/backend/src/middleware/validationSchemas.js`:
```javascript
// Make field optional
email: emailSchema.optional()

// Increase limits
message: sanitizedString.max(5000)
```

### Rate Limiting Too Aggressive?
Edit `/backend/src/server.js`:
```javascript
const limiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 200, // Higher limit
});
```

### Sentry Not Working?
1. Check SENTRY_DSN is set correctly
2. Verify environment variable is loaded
3. Check Sentry.io project is active
4. Look for initialization errors in console

---

## Next Steps

1. Read `/docs/SECURITY.md` for comprehensive documentation
2. Follow `/docs/SECURITY_IMPLEMENTATION_GUIDE.md` for detailed setup
3. Review `/docs/SECURITY_AUDIT_REPORT.md` for audit results
4. Implement `/docs/ERROR_HANDLING_FRONTEND.md` for React

---

## Support

- **Documentation**: `/docs/SECURITY.md`
- **Implementation**: `/docs/SECURITY_IMPLEMENTATION_GUIDE.md`
- **Issues**: Open a GitHub issue
- **Security**: security@fairmediator.com

---

**Quick Reference Card**

| Task | Command |
|------|---------|
| Generate secret | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| Run audit | `npm audit` |
| Test endpoint | `curl -X POST http://localhost:5001/api/chat -H "Content-Type: application/json" -d '{}'` |
| Check Sentry | Visit https://sentry.io |

---

**Last Updated**: 2025-11-14
**Status**: ✅ Ready to use
