# Dependency Audit

## Purpose
Check for outdated or vulnerable npm packages. Keep dependencies secure and up-to-date while maintaining compatibility.

## When to Use
- Weekly/monthly maintenance
- Before deployments
- After security advisories
- Before major releases
- When CI/CD security checks fail

## Audit Checks

### 1. Security Vulnerabilities
Run npm audit to find known CVEs:
- Critical: Must fix immediately
- High: Fix before deployment
- Moderate: Fix in next sprint
- Low: Fix when convenient

### 2. Outdated Packages
Check for newer versions:
- Major updates (breaking changes)
- Minor updates (new features, backwards compatible)
- Patch updates (bug fixes, security)

### 3. Deprecated Packages
Find packages no longer maintained:
- Check npm deprecation warnings
- Identify packages with no recent updates (>2 years)
- Find packages with known alternatives

### 4. Dependency Tree Analysis
- Check for duplicate dependencies
- Identify circular dependencies
- Find unused dependencies

## Task Execution

### Backend Audit

```bash
cd backend

# 1. Security audit
echo "=== SECURITY AUDIT ==="
npm audit --json | jq '{
  critical: .metadata.vulnerabilities.critical,
  high: .metadata.vulnerabilities.high,
  moderate: .metadata.vulnerabilities.moderate,
  low: .metadata.vulnerabilities.low,
  total: .metadata.vulnerabilities.total
}'

# 2. Check for fixes
npm audit fix --dry-run

# 3. Check outdated packages
echo "=== OUTDATED PACKAGES ==="
npm outdated --json | jq 'to_entries[] | {
  package: .key,
  current: .value.current,
  wanted: .value.wanted,
  latest: .value.latest,
  type: .value.type
}'

# 4. List deprecated packages
npm deprecate --list 2>/dev/null || echo "No deprecated command"

# 5. Find unused dependencies
npx depcheck --json | jq '{
  unused: .dependencies,
  missing: .missing
}'
```

### Frontend Audit

```bash
cd frontend

# Same checks as backend
npm audit --json
npm outdated --json
npx depcheck --json
```

## Example Output

```
🔍 DEPENDENCY AUDIT

BACKEND (backend/package.json):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECURITY VULNERABILITIES:
🔴 Critical: 0
🟠 High: 2
🟡 Moderate: 5
🟢 Low: 3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 10 vulnerabilities

HIGH SEVERITY:
1. axios (1.6.0 → 1.6.8)
   - CVE-2023-45857: SSRF via host redirect
   - Severity: High
   - Fix: npm install axios@1.6.8
   - Used by: 23 packages
   
2. express (4.18.0 → 4.19.2)
   - CVE-2024-29041: ReDoS in content negotiation
   - Severity: High
   - Fix: npm install express@4.19.2
   - Direct dependency

MODERATE SEVERITY:
3. mongoose (7.0.0 → 7.8.2)
   - Prototype pollution in query parsing
   - Fix: npm update mongoose

OUTDATED PACKAGES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MAJOR UPDATES (breaking changes):
- winston: 3.11.0 → 4.0.0
  ⚠️  Breaking changes in log formatting
  Review: https://github.com/winstonjs/winston/releases/tag/v4.0.0
  
MINOR UPDATES (new features):
- @axiomhq/winston: 1.4.0 → 1.5.2
  ✅ Safe to update
  
- bcrypt: 5.1.0 → 5.2.1
  ✅ Safe to update
  
PATCH UPDATES (bug fixes):
- dotenv: 16.3.1 → 16.3.2
  ✅ Safe to update
  
- joi: 17.11.0 → 17.11.5
  ✅ Safe to update

DEPRECATED PACKAGES:
⚠️  request (deprecated in favor of axios)
   Current: 2.88.2
   Alternative: Use axios or node-fetch
   Used by: legacy-scraper.js
   
UNUSED DEPENDENCIES:
⚠️  3 packages installed but not used:
- moment (use date-fns instead)
- lodash (only need lodash.get)
- colors (unused)

DUPLICATE DEPENDENCIES:
⚠️  axios installed at 2 different versions:
- axios@1.6.0 (direct)
- axios@1.5.0 (via @huggingface/inference)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FRONTEND (frontend/package.json):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECURITY VULNERABILITIES:
🔴 Critical: 0
🟠 High: 0
🟡 Moderate: 1
🟢 Low: 2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 3 vulnerabilities

MODERATE SEVERITY:
1. vite (4.3.0 → 4.5.2)
   - Path traversal vulnerability
   - Fix: npm install vite@4.5.2

OUTDATED PACKAGES:
✅ Most packages up-to-date
⚠️  react-router-dom: 6.16.0 → 6.22.0 (minor update available)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUMMARY & RECOMMENDATIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 CRITICAL ACTIONS (before deployment):
1. Fix axios SSRF vulnerability
   cd backend && npm install axios@1.6.8
   
2. Fix express ReDoS vulnerability
   cd backend && npm install express@4.19.2
   
3. Fix vite path traversal
   cd frontend && npm install vite@4.5.2

🟡 RECOMMENDED ACTIONS (next sprint):
1. Update patch versions (safe)
   cd backend && npm update
   cd frontend && npm update
   
2. Remove unused dependencies
   cd backend && npm uninstall moment lodash colors
   
3. Replace deprecated 'request' package
   Refactor legacy-scraper.js to use axios

⚠️  REVIEW REQUIRED (major updates):
1. winston 3.x → 4.x
   - Review breaking changes
   - Test logging functionality
   - Update after reading migration guide

AUTOMATIC FIX AVAILABLE:
npm audit fix --force
⚠️  WARNING: May break compatibility, review first

SAFE AUTOMATIC FIX:
npm audit fix
✅ Only patches vulnerabilities without breaking changes
```

## Fix Commands

```bash
# Backend fixes
cd backend

# Critical/High severity (manual)
npm install axios@1.6.8 express@4.19.2

# Moderate severity (safe auto-fix)
npm audit fix

# Update patch versions
npm update

# Remove unused
npm uninstall moment lodash colors

# Frontend fixes
cd ../frontend

# Fix vite
npm install vite@4.5.2

# Update patches
npm update
```

## Testing After Updates

```bash
# Run tests
cd backend && npm test
cd ../frontend && npm test

# Verify build
cd backend && npm run build
cd ../frontend && npm run build

# Start development
npm run dev

# Check for runtime errors
```

## Reporting

Generate report file:
```bash
echo "Dependency Audit Report - $(date)" > audit-report.md
echo "==================================" >> audit-report.md
npm audit >> audit-report.md
```

## Integration with Pre-Flight

Add check to /pre-flight:
```markdown
- [ ] Run dependency-audit skill
- [ ] No high/critical vulnerabilities
- [ ] Outdated packages documented
```

## Exit Codes
- 0: No vulnerabilities, all packages current
- 1: Low/moderate issues only
- 2: High/critical vulnerabilities found
