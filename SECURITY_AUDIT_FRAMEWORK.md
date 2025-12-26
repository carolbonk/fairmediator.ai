# Security Audit Framework

## Overview

This document outlines the comprehensive security audit framework for FairMediator, including penetration testing procedures, compliance checklists, and third-party assessment guidelines.

---

## 1. Automated Security Testing

### Daily Automated Scans (GitHub Actions)

✅ **Already Implemented:**
- NPM audit (backend & frontend)
- Python Safety check
- CodeQL security analysis
- TruffleHog secret scanning
- Dependency review for PRs
- Trivy container scanning

**Location:** `/.github/workflows/security-scan.yml`

**Runs:** Daily at 2 AM UTC + on every push/PR

---

## 2. Manual Security Testing Checklist

### Pre-Release Security Checklist

Before any production deployment, verify:

#### Authentication & Authorization
- [ ] Password complexity requirements enforced (12+ chars, mixed case, numbers, special)
- [ ] Account lockout after 5 failed attempts works
- [ ] JWT tokens stored in httpOnly cookies (not localStorage)
- [ ] CSRF protection active on all state-changing endpoints
- [ ] Email verification required for new accounts
- [ ] Role-based access control (RBAC) functioning correctly
- [ ] Session timeout enforced (15 min access, 30 day refresh)

#### Input Validation & Sanitization
- [ ] All API endpoints have Joi validation
- [ ] XSS protection active (HTML sanitization)
- [ ] MongoDB injection prevention working
- [ ] SQL injection N/A (NoSQL only)
- [ ] File upload validation (type, size limits)
- [ ] Regex patterns escaped (ReDoS prevention)

#### Security Headers
- [ ] HTTPS enforced in production
- [ ] Content Security Policy (CSP) configured
- [ ] HSTS header with preload
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Referrer-Policy set
- [ ] Permissions-Policy configured

#### Secrets & Configuration
- [ ] No hardcoded secrets in codebase
- [ ] All env variables validated on startup
- [ ] Secret rotation procedures documented
- [ ] `.env` files in `.gitignore`
- [ ] Production secrets in secure vault (not committed)

#### Logging & Monitoring
- [ ] Winston logging operational
- [ ] Security events logged
- [ ] Sentry error tracking active (if configured)
- [ ] Log rotation functioning (90 days security, 30 days error)
- [ ] No sensitive data in logs

#### Network & Infrastructure
- [ ] MongoDB authentication enabled
- [ ] MongoDB TLS/SSL for Atlas connections
- [ ] Docker containers isolated (custom network)
- [ ] Resource limits on containers
- [ ] Only necessary ports exposed
- [ ] Firewall rules configured

---

## 3. Penetration Testing Schedule

### Internal Penetration Testing

**Frequency:** Quarterly

**Tools to Use:**
1. **OWASP ZAP** - Automated web application scanner
2. **Burp Suite** - Manual penetration testing
3. **Metasploit** - Exploitation framework
4. **Nikto** - Web server scanner
5. **SQLMap** - SQL injection testing (verify NoSQL protection)

**Test Areas:**
- Authentication bypass attempts
- Authorization escalation
- Injection attacks (NoSQL, XSS, command injection)
- CSRF attacks
- Session management
- Business logic flaws
- API security
- Rate limiting bypass attempts
- File upload vulnerabilities
- Information disclosure

### Third-Party Security Audit

**Frequency:** Annually (or before major releases)

**Recommended Vendors:**
- **Bugcrowd** - Bug bounty platform
- **HackerOne** - Managed bug bounty
- **Synack** - On-demand pentest
- **Cobalt.io** - Pentest-as-a-Service
- **Bishop Fox** - Professional security consultancy

**Scope:**
- Full application security assessment
- API security testing
- Infrastructure review
- Source code review
- Compliance gap analysis

---

## 4. Penetration Testing Procedures

### OWASP ZAP Testing (Automated)

```bash
# Install OWASP ZAP
docker pull owasp/zap2docker-stable

# Run baseline scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://your-app.com \
  -r zap-report.html

# Run full scan
docker run -t owasp/zap2docker-stable zap-full-scan.py \
  -t https://your-app.com \
  -r zap-full-report.html
```

### Burp Suite Testing (Manual)

1. **Setup:**
   - Configure browser to proxy through Burp (127.0.0.1:8080)
   - Import SSL certificate
   - Set target scope

2. **Spider the application:**
   - Let Burp crawl all endpoints
   - Review site map

3. **Active scanning:**
   - Run active scanner
   - Review findings

4. **Manual testing:**
   - Test authentication mechanisms
   - Test authorization (IDOR, privilege escalation)
   - Test input validation
   - Test business logic
   - Test session management

### SQL Injection Testing (Verify NoSQL Protection)

```bash
# Install SQLMap
pip install sqlmap

# Test endpoints
sqlmap -u "https://your-app.com/api/mediators?location=test" \
  --batch \
  --risk=3 \
  --level=5
```

**Expected Result:** All tests should fail (NoSQL protection working)

---

## 5. Security Metrics & KPIs

### Track These Metrics Monthly

| Metric | Target | Status |
|--------|--------|--------|
| Critical vulnerabilities | 0 | ✅ |
| High vulnerabilities | 0 | ✅ |
| Medium vulnerabilities | < 5 | ✅ |
| Dependencies outdated | < 10% | ✅ |
| Secret scan violations | 0 | ✅ |
| Failed login attempts | Monitor | ✅ |
| Account lockouts | Monitor | ✅ |
| CSRF violations | Monitor | ✅ |
| Rate limit hits | Monitor | ✅ |
| Security log review | Weekly | ⏳ |

---

## 6. Compliance Audits

### OWASP Top 10 Checklist

- [x] **A01 Broken Access Control** - RBAC + ownership checks
- [x] **A02 Cryptographic Failures** - bcrypt, JWT, HTTPS/TLS
- [x] **A03 Injection** - Joi validation + sanitization
- [x] **A04 Insecure Design** - Security-first architecture
- [x] **A05 Security Misconfiguration** - Strict env validation, CSP
- [x] **A06 Vulnerable Components** - Automated scanning, updates
- [x] **A07 Auth Failures** - Lockout, logging, strong passwords
- [x] **A08 Data Integrity Failures** - Input validation, JWT signing
- [x] **A09 Security Logging Failures** - Comprehensive Winston logging
- [x] **A10 SSRF** - Input validation, whitelisting

### GDPR Compliance (If Applicable)

- [ ] Data protection impact assessment (DPIA) completed
- [ ] Privacy policy published
- [ ] Cookie consent mechanism
- [ ] User data export functionality
- [ ] User data deletion functionality ("right to be forgotten")
- [ ] Data breach notification procedures
- [ ] Data processor agreements
- [ ] Data minimization practices

### PCI-DSS Compliance (If Processing Payments)

- [ ] Cardholder data never stored
- [ ] Use tokenization (Stripe)
- [ ] HTTPS/TLS for all payment transactions
- [ ] Regular security assessments
- [ ] Access control logs
- [ ] Vulnerability management program

---

## 7. Incident Response Procedures

### Security Incident Classification

**Severity Levels:**
- **P0 (Critical):** Active breach, data exposure, system compromise
- **P1 (High):** Vulnerability with easy exploit, potential data exposure
- **P2 (Medium):** Vulnerability requiring specific conditions
- **P3 (Low):** Theoretical vulnerability, no immediate risk

### Incident Response Steps

#### 1. Detection & Alert
- Monitor security logs
- Sentry alerts
- GitHub security advisories
- User reports

#### 2. Triage & Assessment
- Confirm the incident
- Classify severity
- Identify affected systems
- Determine scope of impact

#### 3. Containment
- Isolate affected systems
- Revoke compromised credentials
- Block malicious IP addresses
- Deploy emergency patches

#### 4. Eradication
- Remove malware/backdoors
- Patch vulnerabilities
- Reset all compromised passwords
- Rotate secrets

#### 5. Recovery
- Restore from clean backups
- Verify system integrity
- Monitor for re-infection
- Gradual service restoration

#### 6. Post-Incident
- Root cause analysis
- Document lessons learned
- Update security procedures
- Notify affected users (if required)
- Report to authorities (if required)

### Breach Notification

**Timeline:**
- **Within 72 hours:** Notify data protection authority (GDPR)
- **Without undue delay:** Notify affected users
- **Immediately:** Internal security team notification

---

## 8. Security Training

### Required Training for Team

**For Developers:**
- OWASP Top 10 awareness
- Secure coding practices
- Authentication & authorization best practices
- Input validation techniques
- Secret management
- Incident response procedures

**For Operations:**
- Infrastructure security
- Secret rotation procedures
- Monitoring & alerting
- Incident response
- Backup & recovery

**Frequency:** Quarterly sessions + on-demand training

---

## 9. Security Audit Log

Keep a record of all security audits:

| Date | Type | Auditor | Findings | Status |
|------|------|---------|----------|--------|
| 2024-12-25 | Internal | Development Team | Security implementation complete | ✅ |
| TBD | OWASP ZAP | Automated | Pending | ⏳ |
| TBD | Third-Party | TBD | Pending | ⏳ |

---

## 10. Contact Information

**Security Team:**
- Email: security@fairmediator.com
- Emergency: security+urgent@fairmediator.com
- PGP Key: Available on request

**Responsible Disclosure:**
- See `/SECURITY.md` for vulnerability reporting

**Third-Party Auditors:**
- TBD (select vendor annually)

---

## Testing Commands Reference

### Run Security Scans

```bash
# Backend NPM audit
cd backend && npm audit

# Frontend NPM audit
cd frontend && npm audit

# Python safety check
cd automation && safety check

# Secret rotation (dry run)
node backend/src/scripts/rotateSecrets.js --dry-run

# Secret rotation (actual)
node backend/src/scripts/rotateSecrets.js

# Docker security scan
docker scan fairmediator-backend:latest
```

### Manual Testing

```bash
# Test account lockout
for i in {1..6}; do
  curl -X POST http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done

# Test rate limiting
for i in {1..10}; do
  curl http://localhost:5001/api/mediators
done

# Test CSRF protection
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!@#","name":"Test"}'
```

---

**Last Updated:** December 25, 2024
**Next Review:** March 25, 2025 (Quarterly)
