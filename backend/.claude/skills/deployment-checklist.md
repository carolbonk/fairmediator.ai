# Deployment Checklist

## Purpose
Comprehensive pre-deployment verification to prevent production issues. Ensures all critical systems are ready before deploying to production.

## When to Use
- Before deploying to production
- Before pushing to main branch
- Before creating release tags
- After major feature implementations

## Deployment Checklist

### 1. Code Quality
- [ ] All tests pass (`npm test` in backend and frontend)
- [ ] No console.log statements in production code
- [ ] No commented-out code blocks
- [ ] ESLint passes with no errors
- [ ] Type checking passes (if using TypeScript)

### 2. Build & Docker
- [ ] Backend builds successfully (`npm run build` if applicable)
- [ ] Frontend builds successfully (`npm run build`)
- [ ] Docker Compose config valid (`docker compose config`)
- [ ] Docker images build without errors
- [ ] Health checks configured and working

### 3. Environment & Configuration
- [ ] All environment variables documented in .env.example
- [ ] Production .env configured on server
- [ ] No secrets committed to git
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled and configured
- [ ] Session secret is production-ready (64+ chars)
- [ ] JWT secret is production-ready (64+ chars)

### 4. Database
- [ ] MongoDB connection string correct for production
- [ ] Database migrations ready (if any)
- [ ] Database backup strategy in place
- [ ] Indexes created for performance
- [ ] Storage usage <70% of quota (512MB limit)

### 5. Security
- [ ] Security scan passed (no critical vulnerabilities)
- [ ] npm audit shows no high/critical issues
- [ ] Authentication endpoints rate-limited
- [ ] HTTPS configured (production)
- [ ] Helmet.js security headers enabled
- [ ] CSRF protection enabled
- [ ] Password reset flow tested
- [ ] Email verification working

### 6. API & External Services
- [ ] All API keys valid and production-ready
- [ ] API rate limits configured
- [ ] Webhook endpoints secured
- [ ] External service health checks passing

### 7. Free Tier Quota Management
- [ ] Quota usage <70% on all services
- [ ] Hugging Face quota healthy
- [ ] OpenRouter quota healthy
- [ ] MongoDB storage healthy
- [ ] Resend email quota healthy
- [ ] Axiom logging quota healthy
- [ ] Quota monitoring alerts configured

### 8. Logging & Monitoring
- [ ] Axiom logging working (test logs visible)
- [ ] Error tracking configured
- [ ] Log retention policies set
- [ ] Critical error alerts configured
- [ ] Quota warning alerts configured

### 9. Performance
- [ ] API response times acceptable (<500ms average)
- [ ] Database query performance optimized
- [ ] Frontend bundle size optimized
- [ ] Images optimized
- [ ] Caching configured where appropriate

### 10. Documentation
- [ ] API documentation up-to-date
- [ ] README.md updated
- [ ] Deployment guide current
- [ ] Environment variables documented
- [ ] Known issues documented

### 11. Backup & Recovery
- [ ] Database backup scheduled
- [ ] Rollback plan documented
- [ ] Previous version tagged in git
- [ ] Can restore from backup

### 12. Communication
- [ ] Team notified of deployment
- [ ] Deployment window scheduled
- [ ] Maintenance mode prepared (if needed)
- [ ] Stakeholders informed

## Task Execution

Run all checks automatically:

```bash
# 1. Run tests
echo "Running backend tests..."
cd backend && npm test

echo "Running frontend tests..."
cd ../frontend && npm test

# 2. Run builds
echo "Building backend..."
cd ../backend && npm run build 2>/dev/null || echo "No build script"

echo "Building frontend..."
cd ../frontend && npm run build

# 3. Validate Docker
echo "Validating Docker configuration..."
cd .. && docker compose config --quiet

# 4. Security scan
echo "Running security audit..."
cd backend && npm audit --audit-level=high
cd ../frontend && npm audit --audit-level=high

# 5. Check quota status
echo "Checking quota status..."
curl -s http://localhost:5001/api/monitoring/quota-status | jq '.overall'

# 6. Test Axiom logging
echo "Testing Axiom logging..."
curl -X POST http://localhost:5001/api/test/log -d '{"level":"info","message":"Deployment test"}'

# 7. Verify environment
echo "Checking environment variables..."
# Run env-validator skill

# 8. API documentation sync
echo "Checking API documentation..."
# Run api-doc-sync skill
```

## Example Output

```
🚀 DEPLOYMENT CHECKLIST

CODE QUALITY:
✅ Backend tests: 127 passed
✅ Frontend tests: 84 passed
⚠️  Found 3 console.log statements (non-blocking)
✅ No ESLint errors

BUILD & DOCKER:
✅ Frontend build successful (2.1MB)
✅ Docker config valid
✅ All health checks passing

ENVIRONMENT:
✅ All env vars documented
✅ No secrets in git
✅ CORS configured for production
⚠️  SESSION_SECRET only 32 chars (recommend 64+)

DATABASE:
✅ MongoDB connection successful
✅ Storage: 156MB/512MB (30%)
✅ All indexes created

SECURITY:
✅ Security scan passed
❌ 1 high vulnerability in axios (CVE-2023-45857)
✅ Rate limiting enabled
✅ HTTPS configured
✅ CSRF protection enabled

QUOTA STATUS:
✅ Hugging Face: 23% (77/333)
✅ OpenRouter: 15% (50/333)
✅ MongoDB: 30% (156MB/512MB)
✅ Resend: 40% (20/50)
✅ Axiom: 12% (700/5666)

LOGGING & MONITORING:
✅ Axiom logging working
✅ Test log visible in dashboard
✅ Alerts configured

DOCUMENTATION:
✅ API docs up-to-date
⚠️  3 undocumented endpoints (run api-doc-sync)

CRITICAL ISSUES (BLOCKERS): 1
❌ axios vulnerability needs fix

WARNINGS (NON-BLOCKING): 3
⚠️  SESSION_SECRET length
⚠️  console.log statements
⚠️  Undocumented endpoints

RECOMMENDATION: Fix axios vulnerability, then deploy
Command: cd backend && npm install axios@1.6.8
```

## Automated Fix Suggestions

```bash
# Fix axios vulnerability
cd backend && npm install axios@1.6.8

# Remove console.log statements
grep -r "console.log" backend/src --files-with-matches | xargs sed -i '' '/console.log/d'

# Regenerate SESSION_SECRET
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

## Exit Codes
- 0: All checks passed, ready to deploy
- 1: Warnings only (safe to deploy with caution)
- 2: Critical issues (do not deploy)
