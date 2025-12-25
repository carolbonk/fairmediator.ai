# Security Policy

## Overview

FairMediator is committed to maintaining the highest security standards to protect our users' data and ensure the integrity of our platform. This document outlines our security practices, vulnerability disclosure policy, and how to report security issues.

## Supported Versions

We actively maintain security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## Security Features

### Authentication & Authorization

- **JWT-based authentication** with short-lived access tokens (15 minutes) and long-lived refresh tokens (30 days)
- **bcrypt password hashing** with salt rounds for secure password storage
- **Password complexity requirements:**
  - Minimum 12 characters
  - Must contain uppercase and lowercase letters
  - Must contain at least one number
  - Must contain at least one special character (@$!%*?&)
- **Account lockout mechanism:** Accounts are automatically locked for 15 minutes after 5 failed login attempts
- **Subscription tier-based access control** for feature gating

### Data Protection

- **HTTPS enforcement** in production environments
- **Enhanced security headers:**
  - Content Security Policy (CSP)
  - HTTP Strict Transport Security (HSTS)
  - X-Frame-Options (clickjacking protection)
  - X-Content-Type-Options (MIME sniffing protection)
  - Referrer-Policy
  - Permissions-Policy
- **CORS configuration** with origin whitelisting
- **Environment variable validation** to prevent misconfiguration

### Input Validation & Sanitization

- **Comprehensive Joi schemas** for all API endpoints
- **Input sanitization** to prevent XSS attacks
- **Regex escaping** to prevent ReDoS (Regular Expression Denial of Service) attacks
- **MongoDB injection protection** through strict type validation
- **Request size limits** to prevent DoS attacks

### Rate Limiting

- **Global API rate limiting:** 100 requests per 15 minutes per IP address
- **Authentication endpoint rate limiting:** 5 login attempts per 15 minutes
- **Per-tier rate limiting** for premium vs. free users

### Monitoring & Logging

- **Usage logging** for all security-relevant events:
  - User registration
  - Login attempts (successful and failed)
  - Password reset requests
  - Account lockouts
  - API usage patterns
- **Error handling** that doesn't leak sensitive information
- **Security event tracking** for anomaly detection

### Third-Party Integration Security

- **HuggingFace API:** API keys stored securely in environment variables
- **Stripe:** Payment processing with webhook signature verification (when enabled)
- **MongoDB:** Secure connection strings with authentication

## Reporting a Vulnerability

We take security vulnerabilities seriously and appreciate responsible disclosure. If you discover a security vulnerability in FairMediator, please follow these steps:

### How to Report

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, please report security issues by emailing:

**security@fairmediator.com** *(or create a private security advisory on GitHub)*

### What to Include

Please provide the following information in your report:

1. **Description** of the vulnerability
2. **Steps to reproduce** the issue
3. **Potential impact** of the vulnerability
4. **Suggested fix** (if you have one)
5. **Your contact information** for follow-up questions
6. **Whether you want public acknowledgment** when we fix the issue

### What to Expect

- **Acknowledgment:** We will acknowledge receipt of your vulnerability report within 48 hours
- **Assessment:** We will assess the vulnerability and provide an initial response within 5 business days
- **Updates:** We will keep you informed about our progress towards a fix
- **Resolution:** We aim to patch critical vulnerabilities within 30 days
- **Disclosure:** We will coordinate with you on the timing of public disclosure

### Safe Harbor

We consider security research conducted in accordance with this policy to be:

- **Authorized** concerning any applicable anti-hacking laws
- **Lawful** and we will not initiate legal action against researchers
- **Conducted in good faith** and we will work with you to understand and resolve the issue

We ask that you:

- Not access or modify data that doesn't belong to you
- Not perform any attack that could harm the availability of our services
- Not use social engineering, phishing, or physical attacks
- Not publicly disclose the vulnerability before we've had a chance to address it

## Security Best Practices for Contributors

If you're contributing to FairMediator, please follow these security guidelines:

### Code Security

1. **Never commit secrets:**
   - No API keys, passwords, or tokens in code
   - Use environment variables for all sensitive configuration
   - Review `.gitignore` before committing

2. **Input validation:**
   - Always validate and sanitize user input
   - Use Joi schemas for API endpoints
   - Escape regex patterns before use

3. **Authentication & Authorization:**
   - Never bypass authentication checks
   - Always verify user permissions before performing actions
   - Use the provided middleware (`authenticate`, `requireTier`)

4. **Dependencies:**
   - Keep dependencies up to date
   - Run `npm audit` regularly
   - Review security advisories for dependencies

5. **Error handling:**
   - Don't leak sensitive information in error messages
   - Log errors securely
   - Use generic error messages for users

### Code Review Checklist

Before submitting a pull request, ensure:

- [ ] No hardcoded secrets or credentials
- [ ] Input validation is implemented
- [ ] Authentication/authorization checks are in place
- [ ] Error messages don't leak sensitive information
- [ ] Dependencies are up to date (run `npm audit`)
- [ ] Security headers are properly configured
- [ ] Rate limiting is considered for new endpoints
- [ ] Database queries are protected against injection
- [ ] File uploads (if any) are validated and sanitized

## Security Architecture

### Backend (Node.js/Express)

```
┌─────────────────────────────────────────────────────┐
│                   Client Request                     │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│              HTTPS Enforcement                       │
│         (Redirect HTTP → HTTPS in prod)              │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│           Security Headers (Helmet)                  │
│   CSP, HSTS, X-Frame-Options, etc.                  │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│            CORS Configuration                        │
│         (Origin whitelisting)                        │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│          Global Rate Limiting                        │
│      (100 req/15min per IP)                         │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│         Input Validation (Joi)                       │
│      (Schema validation & sanitization)              │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│      Authentication Middleware                       │
│      (JWT verification)                              │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│      Authorization Middleware                        │
│  (Subscription tier & usage limits)                  │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│            Route Handler                             │
│      (Business logic)                                │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│          Response with Headers                       │
└─────────────────────────────────────────────────────┘
```

### Frontend (React)

- **HTTPS-only** communication with backend
- **Content Security Policy** enforcement
- **Input sanitization** before rendering user-generated content
- **Secure token storage** (considering migration to httpOnly cookies)

### Database (MongoDB)

- **Authentication** required for all connections
- **Encrypted passwords** using bcrypt
- **Connection string security** via environment variables
- **Schema validation** at application layer

## Compliance & Standards

We strive to comply with:

- **OWASP Top 10** security risks mitigation
- **CWE Top 25** most dangerous software weaknesses
- **GDPR** data protection requirements (when applicable)
- **CCPA** privacy requirements (when applicable)

## Security Roadmap

Planned security enhancements:

- [ ] Multi-Factor Authentication (MFA/2FA)
- [ ] Email verification for new accounts
- [ ] CSRF token implementation
- [ ] httpOnly cookie-based JWT storage
- [ ] Automated dependency vulnerability scanning in CI/CD
- [ ] Web Application Firewall (WAF) integration
- [ ] Advanced threat detection and monitoring
- [ ] Regular third-party security audits
- [ ] SOC 2 compliance
- [ ] Field-level encryption for sensitive data

## Security Contacts

For security-related inquiries:

- **Email:** security@fairmediator.com
- **GitHub Security Advisories:** [Create a security advisory](https://github.com/your-org/fairmediator/security/advisories/new)
- **PGP Key:** Available upon request

## Acknowledgments

We thank the following security researchers for responsible disclosure:

*(This section will be updated as vulnerabilities are responsibly disclosed and fixed)*

## Version History

| Version | Date       | Changes                                           |
|---------|------------|---------------------------------------------------|
| 1.0     | 2024-01-XX | Initial security policy                           |
| 1.1     | 2024-XX-XX | Added account lockout and enhanced validation     |

---

**Last Updated:** January 2025

Thank you for helping keep FairMediator and our users safe!
