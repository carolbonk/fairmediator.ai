# Security Scan Skill

## Purpose
Pre-commit security validation to catch vulnerabilities before they reach production. Prevent leaking secrets, credentials, and common security issues.

## When to Use
- Before every commit (integrate with /pre-flight)
- After adding new dependencies
- Before deployments
- After modifying authentication/authorization code

## Security Checks

### 1. Secret Detection
Scan staged files for:
- API keys: `xaat-`, `sk-`, `hf_`, `re_`, `nfp_`
- MongoDB URIs with passwords: `mongodb+srv://.*:.*@`
- JWT secrets in code
- Private keys: `BEGIN PRIVATE KEY`, `BEGIN RSA PRIVATE KEY`
- AWS credentials: `AKIA[0-9A-Z]{16}`
- Generic secrets: `password\s*=\s*['"][^'"]+['"]`

**Exception**: Allow in backend/.env (not committed) and documentation files

### 2. Environment File Check
- Ensure .env files are in .gitignore
- Verify .env is NOT staged
- Check .env.example exists and is up-to-date
- Warn if .env.example contains real secrets

### 3. Dependency Vulnerabilities
- Run `npm audit --audit-level=high` in backend
- Run `npm audit --audit-level=high` in frontend
- Flag critical/high vulnerabilities
- Suggest remediation (npm audit fix)

### 4. Code Security Patterns

**SQL Injection Check**:
- Search for string concatenation in queries
- Flag raw SQL without parameterization
- Look for `db.query("SELECT * FROM " + userInput)`

**XSS Check**:
- Flag `dangerouslySetInnerHTML` in React
- Check for unescaped user input in templates
- Verify CSP headers configured

**Authentication Check**:
- Ensure password fields use bcrypt/argon2 (not plain text)
- Check JWT secrets are from env vars
- Verify rate limiting on auth endpoints

**CORS Check**:
- Flag `CORS_ORIGIN=*` in production
- Ensure CORS_ORIGIN uses env var
- Check credentials allowed only for specific origins

### 5. File Permission Check
- Ensure sensitive files are not world-readable
- Check .env files have 600 permissions
- Verify logs directory permissions

## Task Execution

1. **Run Secret Scan**
   ```bash
   git diff --cached | grep -iE "(api[_-]?key|secret|password|token|private[_-]?key)" || echo "No secrets found"
   ```

2. **Check .env Files**
   ```bash
   git diff --cached --name-only | grep -E "^\.env$|^backend/\.env$" && echo "⚠️  WARNING: .env file staged!"
   ```

3. **Run NPM Audit**
   ```bash
   cd backend && npm audit --audit-level=high --json
   cd frontend && npm audit --audit-level=high --json
   ```

4. **Scan Code Patterns**
   - Use grep/ripgrep to find dangerous patterns
   - Check recently modified files only

5. **Generate Report**
   - List all findings by severity
   - Provide remediation steps
   - Exit with code 1 if critical issues found

## Example Output

```
🔒 SECURITY SCAN

✅ No secrets detected in staged files
✅ .env files not staged
⚠️  backend/.env.example may contain real email (carolainebonk@gmail.com)
✅ No SQL injection patterns found
✅ CORS properly configured
❌ 2 high vulnerabilities in backend dependencies

HIGH VULNERABILITIES:
- axios@1.6.0: SSRF vulnerability (CVE-2023-45857)
  Fix: npm install axios@1.6.8

- express@4.18.0: ReDoS in content negotiation
  Fix: npm install express@4.19.2

RECOMMENDATION: Fix vulnerabilities before committing
Run: cd backend && npm audit fix
```

## Exit Codes
- 0: No security issues
- 1: Warnings only (allow commit with notice)
- 2: Critical issues (block commit)
