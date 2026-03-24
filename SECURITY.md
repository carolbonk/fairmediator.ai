# Security Policy

## Reporting a Vulnerability

We take the security of FairMediator seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**Email:** security@fairmediator.ai

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

- **Initial Response:** Within 48 hours
- **Status Update:** Within 7 days
- **Fix Timeline:** Varies by severity (critical issues prioritized)

### What to Expect

1. We will acknowledge receipt of your report
2. We will investigate and validate the issue
3. We will develop and test a fix
4. We will deploy the fix and notify you
5. We will publicly acknowledge your contribution (with your permission)

## Security Best Practices

### For Contributors

#### Never Commit Secrets

- **Never** commit `.env` files or API keys
- Use `.env.example` as templates with placeholder values
- Check commits with `git diff --cached` before committing
- Use the pre-commit hook (automatically blocks secrets)

#### Environment Variables

All secrets should be stored in `.env` files (excluded from git):

```bash
# ❌ WRONG - Never do this
const apiKey = "hf_abc123def456"

# ✅ CORRECT - Always use environment variables
const apiKey = process.env.HUGGINGFACE_API_KEY
```

#### Pre-commit Hooks

The repository includes pre-commit hooks that:
- Block commits containing AI watermarks (RULE 8)
- Prevent emoji usage in commit messages
- Will soon include secret detection (see below)

### For Deployers

#### Production Secrets Management

**Development:**
- Store secrets in local `.env` files (git-ignored)
- Never share `.env` files via email/Slack/Discord

**Production:**
- Use environment variables on hosting platform
- Rotate secrets regularly (every 90 days minimum)
- Use different secrets for dev/staging/production

#### API Key Rotation

If an API key is accidentally exposed:

1. **Immediately revoke** the exposed key
2. **Generate a new key** from the provider
3. **Update** all environments with new key
4. **Verify** the old key no longer works
5. **Document** the incident for audit trail

#### Supported Services

Secrets used by FairMediator:

| Service | Purpose | Free Tier | Rotation Guide |
|---------|---------|-----------|----------------|
| MongoDB Atlas | Database | 512MB | [Link](https://www.mongodb.com/docs/atlas/security/) |
| Hugging Face | AI Models | Yes | [Link](https://huggingface.co/settings/tokens) |
| Resend | Email | 100/day | [Link](https://resend.com/docs/api-reference/api-keys) |
| Axiom | Logging | 166MB/mo | [Link](https://axiom.co/docs/reference/tokens) |
| Netlify | Blob Storage | 100GB | [Link](https://docs.netlify.com/accounts-and-billing/team-management/manage-api-access/) |
| OpenRouter | AI Router | Varies | [Link](https://openrouter.ai/keys) |
| FEC API | Political Data | Unlimited | [Link](https://api.open.fec.gov/developers/) |
| RECAP API | Court Data | 5K/day | [Link](https://www.courtlistener.com/help/api/) |

## Supported Versions

| Version | Supported | Notes |
|---------|-----------|-------|
| main branch | ✅ | Current development |
| Production | ✅ | Deployed to Oracle Cloud |
| Other branches | ⚠️ | Not guaranteed |

## Security Features

### Built-in Protections

1. **Helmet.js** - HTTP security headers
2. **CORS** - Cross-origin request restrictions
3. **CSRF** - Cross-site request forgery protection
4. **Rate Limiting** - API abuse prevention
5. **JWT** - Secure authentication tokens
6. **bcrypt** - Password hashing (work factor: 10)
7. **Input Sanitization** - XSS/NoSQL injection prevention
8. **Winston Logging** - Security event tracking

### Infrastructure Security

**Docker:**
- Non-root users in containers
- Read-only filesystems where possible
- `no-new-privileges` security option
- Minimal base images (Alpine Linux)
- Network segmentation (db-network, backend-network)

**Database:**
- MongoDB Atlas with TLS/SSL
- Authenticated connections only
- IP allowlist (production)
- Encrypted at rest

**Monitoring:**
- Axiom logging (warn/error/security events)
- Free tier quota monitoring
- Rate limit tracking
- Failed login attempt logging

## Known Security Considerations

### Low-Severity Items

**csurf Dependency:**
- Deprecated package with low-severity vulnerabilities
- Currently acceptable for development
- Planned migration to `@dr.pogodin/csurf` (updated fork)
- Does not affect production security posture

### Rate Limits

To prevent abuse and stay within free tiers:

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| API Requests | 100 | 15 min |
| Authentication | 5 | 15 min |
| Password Reset | 3 | 1 hour |
| File Upload | 10 | 1 hour |

## Secure Development Workflow

### Before Committing

```bash
# 1. Check what you're committing
git diff --cached

# 2. Ensure no secrets in files
grep -r "password\|secret\|key" --include="*.js" --include="*.jsx"

# 3. Verify .env files are not staged
git status | grep ".env"

# 4. Commit with descriptive message (no emojis, no AI attribution)
git commit -m "Add user authentication with bcrypt hashing"
```

### Before Deploying

```bash
# 1. Run security audit
npm audit

# 2. Check for high/critical vulnerabilities
npm audit --audit-level=high

# 3. Fix vulnerabilities
npm audit fix

# 4. Run tests
npm test

# 5. Build Docker images
docker-compose build

# 6. Scan for vulnerabilities
docker scout cves <image-name>
```

## Incident Response

### If Secrets are Exposed

**Severity: CRITICAL**

1. **Immediate (< 5 min):**
   - Revoke exposed credentials
   - Notify team

2. **Short-term (< 1 hour):**
   - Generate new credentials
   - Update all environments
   - Verify old credentials inactive

3. **Follow-up (< 24 hours):**
   - Review access logs for abuse
   - Document incident
   - Update security procedures
   - Consider removing from git history (see below)

### Removing Secrets from Git History

If secrets were committed and pushed:

```bash
# 1. Create backup
git branch backup-before-secret-removal-$(date +%Y%m%d)

# 2. Remove file from history
git filter-repo --path <secret-file> --invert-paths --force

# 3. Force-push (requires admin bypass of branch protection)
git push --force origin main

# 4. Notify all team members to re-clone repository
```

**Note:** All collaborators must delete and re-clone the repository after history rewrite.

## Security Checklist

### For New Features

- [ ] Input validation on all user inputs
- [ ] Output sanitization to prevent XSS
- [ ] Authentication required for sensitive endpoints
- [ ] Authorization checks (user can access this resource?)
- [ ] Rate limiting applied
- [ ] Error messages don't leak sensitive info
- [ ] No secrets in code (use environment variables)
- [ ] SQL/NoSQL injection prevention
- [ ] CSRF protection on state-changing operations
- [ ] Logging for security-relevant events

### For Deployment

- [ ] All secrets in environment variables (not in code)
- [ ] Production secrets different from development
- [ ] HTTPS enabled (TLS/SSL certificates)
- [ ] Security headers configured (Helmet.js)
- [ ] Database backups enabled
- [ ] Monitoring/alerting configured
- [ ] Rate limits appropriate for production
- [ ] No debug/verbose logging in production
- [ ] No exposed admin panels
- [ ] Firewall rules configured

## Contact

- **Security Issues:** security@fairmediator.ai
- **General Support:** support@fairmediator.ai
- **GitHub Issues:** https://github.com/carolbonk/fairmediator.ai/issues (for non-security bugs)

## Acknowledgments

We appreciate the security research community and will acknowledge contributors who help us improve security (with permission).

---

**Last Updated:** March 24, 2026
**Security Version:** 1.0
