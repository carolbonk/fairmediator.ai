# Pre-Flight Command

Comprehensive pre-commit validation with automated checks and skill integration.

## What It Does

Runs multiple validation checks before creating a commit:
1. Security scan (secrets, vulnerabilities)
2. Quota guard (prevent commits when quota critical)
3. Environment validation
4. Docker configuration check (if modified)
5. API documentation sync (if routes modified)
6. Generate RULE 8 compliant commit message
7. Create commit with staged files

## Execution Steps

### 1. Review Changes
```bash
git status
git diff --stat
```

### 2. Run Security Scan
Invoke `security-scan` skill:
- Check for secrets in staged files
- Verify .env not committed
- Run npm audit for vulnerabilities
- Scan for dangerous code patterns

**Block commit if**: Critical vulnerabilities or secrets found

### 3. Check Quota Status
Invoke `quota-guard` skill:
- Query `/api/monitoring/quota-status`
- Check all free tier services
- Warn if any service >85%
- Block if any service >95%

**Block commit if**: Critical quota exhaustion

### 4. Validate Environment
If .env files modified, invoke `env-validator` skill:
- Check all process.env variables documented
- Verify .env.example in sync
- Validate required variables set

### 5. Validate Docker
If docker-compose.yml or Dockerfile modified, invoke `docker-validate` skill:
- Validate docker-compose.yml syntax
- Check environment variables
- Verify build contexts

### 6. Check API Documentation
If route files modified, invoke `api-doc-sync` skill:
- Scan backend/src/routes for changes
- Check documentation is current
- Flag undocumented endpoints

### 7. Generate Commit Message
Invoke `commit-validator` skill:
- Analyze git diff
- Draft RULE 8 compliant message
- Validate: max 3 sentences, no emojis, imperative mood

### 8. Create Commit
- Stage relevant files
- Create commit with validated message
- Verify with git status

## Important Rules

**RULE 8 Compliance**:
- ✅ Maximum 3 sentences
- ✅ No emojis (❌ 🤖 ✨ 🎉 📝)
- ✅ No "Generated with Claude Code" footer
- ✅ No "Co-Authored-By: Claude" footer
- ✅ Imperative mood ("Add" not "Added")
- ✅ Write like a human engineer

**Files to Exclude**:
- Test files (test-*.js, *.test.js)
- Temporary files
- node_modules
- .DS_Store

## Example Execution Flow

```
🚀 PRE-FLIGHT CHECKS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[1/6] Security Scan
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Running security-scan skill...
✅ No secrets detected
✅ .env files not staged
⚠️  1 moderate npm vulnerability (axios)
✅ No dangerous code patterns
Result: PASS with warnings

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[2/6] Quota Guard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Running quota-guard skill...
✅ All services <70% quota
✅ Hugging Face: 45% (150/333)
✅ Axiom: 23% (1300/5666)
Result: PASS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[3/6] Environment Validation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Skipped (no .env changes)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[4/6] Docker Validation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Running docker-validate skill...
✅ docker-compose.yml valid
✅ All env vars present
Result: PASS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[5/6] API Documentation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Skipped (no route changes)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[6/6] Commit Message
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Running commit-validator skill...

Proposed commit message:
───────────────────────────────────────────
Add Axiom centralized logging with quota-aware filtering. Configure Winston transport to send warn/error/security logs to Axiom cloud while preserving all logs locally. Include pre-flight command and commit validator for streamlined development workflow.
───────────────────────────────────────────

Validation:
✅ 3 sentences
✅ No emojis
✅ Imperative mood
✅ No Claude Code footer
✅ Human-like style

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 4 checks passed
⚠️  1 warning (axios vulnerability - non-blocking)
❌ 0 blockers

Ready to commit? [Y/n]:
```

## Quick Mode

For simple commits without full checks:
```bash
/pre-flight --quick
```

Runs only:
- Security scan
- Commit message validation

## Strict Mode

For production deployments:
```bash
/pre-flight --strict
```

Adds:
- Run all tests
- Full dependency audit
- Deployment checklist
