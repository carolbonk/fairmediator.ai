# Security Audit Report - April 8, 2026

## Executive Summary
This report addresses two high-priority security findings from the comprehensive security audit:
1. Docker container vulnerabilities in `fairmediator-ml:latest`
2. CSRF protection exemptions for AI endpoints

---

## 1. Docker Container Vulnerabilities

### Scan Results
- **Image**: `fairmediator-ml:latest` (1.71GB, created 2026-03-31)
- **Packages Scanned**: 252
- **Vulnerable Packages**: 22
- **Total Vulnerabilities**: 99
  - Critical: 0
  - High: 10 ⚠️
  - Medium: 9
  - Low: 76
  - Unspecified: 6

### High Severity Vulnerabilities (Immediate Action Required)

#### Python Package Vulnerabilities

1. **setuptools** (3 HIGH CVEs)
   - CVE-2022-40897: Inefficient Regular Expression Complexity (ReDoS)
   - CVE-2025-47273: Path Traversal
   - CVE-2024-6345: Code Injection
   - **Fix**: Upgrade to `setuptools>=78.1.1`

2. **starlette** (2 HIGH CVEs)
   - CVE-2024-47874: Resource exhaustion (DoS)
   - CVE-2024-24762: Known component vulnerabilities
   - **Fix**: Upgrade to `starlette>=0.47.2`

3. **fastapi** (1 HIGH CVE)
   - CVE-2024-24762: Known component vulnerabilities
   - **Fix**: Upgrade to `fastapi>=0.109.1`

4. **wheel** (1 HIGH CVE)
   - CVE-2026-24049: Path Traversal
   - **Fix**: Upgrade to patched version or replace

5. **pillow** (1 HIGH CVE)
   - CVE-2026-25990: Out-of-bounds Write (potential RCE)
   - **Fix**: Upgrade to `pillow>=12.1.1`

6. **python-multipart** (1 HIGH CVE)
   - CVE-2026-24486: Path Traversal
   - **Fix**: Upgrade to `python-multipart>=0.0.22`

#### System Package Vulnerabilities

7. **openssl** (1 HIGH CVE)
   - CVE-2026-31790: OpenSSL vulnerability
   - **Fix**: Upgrade Debian base image to get `openssl>=3.5.5-1~deb13u2`

### Medium Severity Vulnerabilities

8. **requests** (3 MEDIUM CVEs)
   - CVE-2024-35195: Incorrect Control Flow
   - CVE-2024-47081: Insufficiently Protected Credentials
   - CVE-2026-25645: Insecure Temporary File
   - **Fix**: Upgrade to `requests>=2.33.0`

9. **tar** (2 MEDIUM CVEs)
   - CVE-2026-5704, CVE-2025-45582
   - **Fix**: Update Debian system packages

### Remediation Steps

#### Option 1: Update requirements.txt (Recommended)
```python
# Add to backend/requirements.txt or ML service requirements
setuptools>=78.1.1
starlette>=0.47.2
fastapi>=0.109.1
pillow>=12.1.1
python-multipart>=0.0.22
requests>=2.33.0
```

Then rebuild the Docker image:
```bash
cd backend
docker build -t fairmediator-ml:latest -f Dockerfile .
docker scout cves fairmediator-ml:latest
```

#### Option 2: Update Dockerfile Base Image
```dockerfile
# Update to latest Debian Trixie with security patches
FROM python:3.11-slim-trixie

# Update system packages
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
        openssl \
    && rm -rf /var/lib/apt/lists/*
```

#### Option 3: Automated Scanning in CI/CD
Add to `.github/workflows/security-scan.yml`:
```yaml
- name: Scan Docker image for CVEs
  run: |
    docker scout cves fairmediator-ml:latest --exit-code --only-severity critical,high
```

### Risk Assessment
- **Impact**: HIGH - Potential for RCE, DoS, data exfiltration
- **Likelihood**: MEDIUM - Requires specific attack conditions
- **Priority**: 🔴 **CRITICAL** - Address within 7 days

---

## 2. AI Endpoint CSRF Protection Analysis

### Current Configuration
CSRF protection is **disabled** for all AI endpoints in `backend/src/server.js:188-195`:

```javascript
if (
  req.path.startsWith('/api/agents') ||
  req.path.startsWith('/api/chains') ||
  req.path.startsWith('/api/perspectives') ||
  req.path.startsWith('/api/idp') ||
  req.path.startsWith('/api/qa')
) {
  return next(); // Skip CSRF
}
```

### Endpoint Security Review

#### ❌ CRITICAL: `/api/idp/*` - Intelligent Document Processing
**Routes**: `process-pdf`, `process-text`, `process-and-save`, `batch-process`

**Current State**:
- ❌ No authentication
- ❌ No CSRF protection
- ✅ File size limits (5MB)
- ✅ File type validation (PDF/text only)

**Security Issues**:
1. **DATABASE WRITES WITHOUT AUTH**: `/api/idp/process-and-save` creates/updates Mediator records without authentication!
2. **Resource Exhaustion**: Anyone can process PDFs, consuming AI API quota
3. **Data Injection**: Attacker can inject fake mediator profiles
4. **CSRF Attack Vector**: Malicious site can POST to `/api/idp/process-and-save` and pollute database

**Risk**: 🔴 **CRITICAL**

**Required Fixes**:
```javascript
// backend/src/routes/idp.js
const { authenticate, requireRole } = require('../middleware/auth');

router.post('/process-pdf', authenticate, upload.single('file'), asyncHandler(async (req, res) => {
  // ... existing code
}));

router.post('/process-and-save', authenticate, requireRole(['admin', 'mediator']),
  upload.single('file'), asyncHandler(async (req, res) => {
  // ... existing code
}));
```

**CSRF Fix**: Remove from exemption list after adding auth.

---

#### ⚠️ HIGH: `/api/agents/*` - Agent System
**Routes**: `execute`, `search`, `research`, `coordinate`

**Current State**:
- ❌ No authentication
- ❌ No CSRF protection
- ❌ No rate limiting beyond global limits
- ✅ GET `/available` is safe (read-only)

**Security Issues**:
1. **Resource Exhaustion**: Expensive AI operations accessible to anyone
2. **API Quota Drain**: Consumes Hugging Face API quota
3. **CSRF Attack**: Attacker can drain user's AI quota via hidden POST requests

**Risk**: 🟠 **HIGH**

**Justification for CSRF Exemption**: ❌ **NOT JUSTIFIED**
- These endpoints consume resources and should require authentication
- Not read-only operations (consume API quotas, processing time)

**Required Fixes**:
```javascript
// backend/src/routes/agents.js
const { authenticate } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiting');

router.post('/execute', authenticate, aiLimiter, asyncHandler(async (req, res) => {
  // ... existing code
}));

router.post('/search', authenticate, aiLimiter, asyncHandler(async (req, res) => {
  // ... existing code
}));
```

**CSRF Fix**: Remove from exemption list after adding auth.

---

#### ⚠️ HIGH: `/api/chains/*` - Chain System
**Routes**: `execute`, `search`, `analyze-conflict`, `summarize`, `custom`

**Current State**:
- ❌ No authentication
- ❌ No CSRF protection
- ✅ GET `/available` is safe

**Security Issues**:
1. **Arbitrary Code Execution Risk**: `/custom` route accepts user-defined chain steps including "transform" functions
2. **Resource Exhaustion**: Multi-step workflows are expensive
3. **CSRF Attack**: Attacker can execute arbitrary AI chains

**Risk**: 🔴 **CRITICAL** (due to `/custom` route)

**Code Review of `/custom` Route**:
```javascript
router.post('/custom', asyncHandler(async (req, res) => {
  const { steps, input, context = {} } = req.body;

  // DANGEROUS: User controls chain steps including "transform" functions
  chainSystem.registerChain(tempChainName, steps);
```

This is a **potential RCE vector** if chainSystem evaluates transform functions!

**Required Fixes**:
```javascript
// backend/src/routes/chains.js
const { authenticate, requireRole } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiting');

// CRITICAL: Disable /custom route or restrict to admin only
router.post('/custom', authenticate, requireRole(['admin']),
  aiLimiter, asyncHandler(async (req, res) => {
  // Add validation to prevent code injection
  // ... existing code
}));
```

**CSRF Fix**: Remove from exemption list after adding auth.

---

#### ⚠️ MEDIUM: `/api/perspectives/*` - Multi-Perspective AI
**Routes**: `all`, `single`, `compare`

**Current State**:
- ❌ No authentication
- ❌ No CSRF protection
- ✅ GET `/info` is safe
- ✅ Read-only (no database writes)

**Security Issues**:
1. **Resource Exhaustion**: Calls AI APIs 1-3 times per request
2. **API Quota Drain**: Consumes Hugging Face quota
3. **CSRF Attack**: Attacker can waste user's AI quota

**Risk**: 🟠 **MEDIUM**

**Justification for CSRF Exemption**: ⚠️ **PARTIALLY JUSTIFIED**
- Endpoints are read-only (no database modifications)
- However, they consume expensive resources

**Required Fixes**:
```javascript
// backend/src/routes/perspectives.js
const { optionalAuth } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiting');

router.post('/all', optionalAuth, aiLimiter, asyncHandler(async (req, res) => {
  // Track usage if authenticated
  if (req.user) {
    await req.user.incrementUsage('ai_calls');
  }
  // ... existing code
}));
```

**CSRF Fix**: Can remain exempt IF authentication is added, since it's read-only.

---

#### ✅ SECURE: `/api/qa/*` - Quality Assurance
**Routes**: `validate/:id`, `validate-all`

**Current State**:
- ✅ Requires authentication
- ✅ Requires admin role
- ✅ CSRF exempt is acceptable (uses API key auth pattern)

**Risk**: 🟢 **LOW**

**Justification for CSRF Exemption**: ✅ **JUSTIFIED**
- Properly authenticated with role-based access control
- Admin-only operations
- Similar to B2B API pattern

**No changes required** - this is the security model all other AI endpoints should follow!

---

## Summary of Required Changes

### Immediate Actions (Within 24 hours)

1. **Add authentication to `/api/idp/*`** routes
   - Prevent unauthenticated database writes
   - Risk: CRITICAL

2. **Disable or restrict `/api/chains/custom`** route
   - Potential arbitrary code execution
   - Risk: CRITICAL

3. **Update Docker image dependencies**
   - Address 10 HIGH severity CVEs
   - Risk: CRITICAL

### High Priority (Within 7 days)

4. **Add authentication to `/api/agents/*`** routes
5. **Add authentication to `/api/chains/*`** routes (except custom, which should be disabled)
6. **Add authentication to `/api/perspectives/*`** routes
7. **Remove CSRF exemptions** after adding authentication
8. **Add dedicated AI rate limiting** to all AI endpoints

### Recommended Architecture

```javascript
// Recommended pattern for AI endpoints
const { authenticate } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiting');

router.post('/endpoint', authenticate, aiLimiter, async (req, res) => {
  // Track usage against user's tier limits
  await req.user.incrementUsage('ai_calls');

  // Execute AI operation
  const result = await aiService.execute(req.body);

  res.json(result);
});
```

### CSRF Exemption Policy

**When CSRF exemption is acceptable:**
- ✅ Read-only endpoints (GET requests)
- ✅ API key authenticated endpoints (like `/api/v1/*`)
- ✅ Admin-only endpoints with proper authentication
- ✅ Endpoints with no side effects and no resource consumption

**When CSRF protection is required:**
- ❌ Any endpoint that writes to database
- ❌ Any endpoint that consumes paid/limited resources
- ❌ Any endpoint accessible to unauthenticated users
- ❌ Any endpoint that modifies user state or quota

---

## Compliance & Best Practices

### OWASP Top 10 Violations Identified

1. **A01: Broken Access Control**
   - `/api/idp/process-and-save` allows unauthenticated database writes
   - All AI endpoints accessible without authentication

2. **A03: Injection**
   - `/api/chains/custom` may allow code injection via transform functions

3. **A05: Security Misconfiguration**
   - Overly broad CSRF exemptions
   - Missing authentication on sensitive endpoints

4. **A06: Vulnerable Components**
   - 10 HIGH severity CVEs in Docker image

### Recommended Security Headers for AI Endpoints

```javascript
// Add to server.js for AI routes
app.use('/api/agents', (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  next();
});
```

---

## Testing Checklist

Before deploying fixes:

- [ ] Verify authentication works on all AI endpoints
- [ ] Test CSRF protection doesn't block legitimate requests
- [ ] Verify rate limiting prevents abuse
- [ ] Test B2B API key access still works
- [ ] Scan updated Docker image with `docker scout`
- [ ] Run integration tests for AI endpoints
- [ ] Verify error messages don't leak sensitive info

---

## References

- OWASP CSRF Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
- Docker Scout Documentation: https://docs.docker.com/scout/
- OWASP Top 10 2021: https://owasp.org/Top10/

---

**Audit Date**: April 8, 2026
**Auditor**: Claude (Automated Security Analysis)
**Next Review**: April 15, 2026 (verify remediation)
