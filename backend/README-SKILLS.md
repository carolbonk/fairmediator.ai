# FairMediator Claude Code Skills & Commands

Complete guide to custom skills and slash commands for the FairMediator project.

## 📋 Quick Reference

### Slash Commands

| Command | Purpose | Usage |
|---------|---------|-------|
| `/pre-flight` | Pre-commit validation & commit creation | Before every commit |
| `/deploy` | Full deployment readiness check | Before production deployment |

### Skills

| Skill | Priority | Purpose |
|-------|----------|---------|
| `commit-validator` | High | Validate commit messages (RULE 8) |
| `security-scan` | High | Detect secrets, vulnerabilities |
| `quota-guard` | High | Prevent quota exhaustion |
| `env-validator` | Medium | Validate environment variables |
| `docker-validate` | Medium | Validate Docker configuration |
| `api-doc-sync` | Medium | Keep API docs synchronized |
| `deployment-checklist` | Medium | Pre-deployment validation |
| `branch-cleanup` | Low | Clean up stale Git branches |
| `dependency-audit` | Low | Check for outdated/vulnerable packages |

## 🚀 Workflows

### Daily Development Workflow

```bash
# 1. Make your changes
# 2. Run pre-flight before committing
/pre-flight

# This automatically:
# - Scans for security issues
# - Checks quota status
# - Validates environment if needed
# - Validates Docker if changed
# - Checks API docs if routes changed
# - Generates RULE 8 commit message
# - Creates the commit
```

### Weekly Maintenance

```bash
# 1. Check for outdated dependencies
# Invoke dependency-audit skill

# 2. Clean up old branches
# Invoke branch-cleanup skill

# 3. Review quota usage trends
# Invoke quota-guard skill
```

### Pre-Deployment Checklist

```bash
# Run comprehensive deployment check
/deploy

# This runs deployment-checklist skill which:
# - Runs all tests
# - Builds Docker images
# - Validates environment
# - Checks security
# - Verifies quota status
# - Validates API documentation
# - Tests logging/monitoring
```

## 📚 Skill Details

### 1. commit-validator

**Purpose**: Enforce RULE 8 commit message standards

**RULE 8 Requirements**:
- Maximum 3 sentences
- No emojis
- Imperative mood
- No "Generated with Claude Code" footer
- No "Co-Authored-By: Claude" footer
- Write like a human engineer

**Good Example**:
```
Add Axiom logging with quota monitoring
```

**Bad Examples**:
```
✨ Add amazing new feature 🎉
🤖 Generated with Claude Code
```

### 2. security-scan

**Purpose**: Pre-commit security validation

**Checks**:
- ✅ No secrets in staged files
- ✅ .env files not committed
- ✅ No npm vulnerabilities (high/critical)
- ✅ No SQL injection patterns
- ✅ CORS properly configured
- ✅ Rate limiting enabled

**Exit Codes**:
- 0: No issues
- 1: Warnings (non-blocking)
- 2: Critical issues (blocks commit)

### 3. quota-guard

**Purpose**: Prevent quota exhaustion on free tier services

**Monitors**:
- Hugging Face API (333/day, 10k/month)
- OpenRouter (333/day, 10k/month)
- MongoDB Atlas (512MB storage)
- Resend Email (50/day, 1500/month)
- Axiom Logging (5666/day, 170k/month)

**Thresholds**:
- <70%: Green (OK)
- 70-85%: Yellow (Warning)
- 85-95%: Orange (Critical warning)
- >95%: Red (Block action)

**Mitigation Strategies**:
```bash
# Disable non-essential features
ENABLE_REAL_TIME_SCRAPING=false

# Reduce log verbosity
LOG_LEVEL=error

# Wait for quota reset
# (Shows countdown timer)
```

### 4. env-validator

**Purpose**: Environment variable validation and sync

**Validates**:
- All `process.env.*` variables documented
- .env.example up-to-date
- Backend/.env and root .env synchronized
- Required variables set
- Format validation (URLs, secrets length, etc.)

**Common Issues Detected**:
- Missing environment variables
- .env.example with real secrets
- SESSION_SECRET too short
- Invalid MongoDB URI format
- Unused variables (cleanup opportunity)

### 5. docker-validate

**Purpose**: Validate Docker configuration before deployment

**Checks**:
- docker-compose.yml syntax
- All environment variables defined
- Build contexts exist
- Port availability
- Volume mounts valid
- Network configuration
- Health checks configured

### 6. api-doc-sync

**Purpose**: Keep API documentation synchronized with code

**Process**:
1. Scan `backend/src/routes/**/*.js` for endpoints
2. Compare with `N8N_BACKEND_ENDPOINTS.md`
3. Flag undocumented endpoints
4. Detect removed endpoints
5. Identify signature changes

**Output**:
- Undocumented endpoints (need docs)
- Possibly removed endpoints (update docs)
- Signature changes (breaking changes)
- Auto-generated documentation templates

### 7. deployment-checklist

**Purpose**: Comprehensive pre-deployment validation

**Checklist** (32 items):
- ✅ All tests pass
- ✅ Builds successful
- ✅ Environment configured
- ✅ Database healthy
- ✅ Security scan passed
- ✅ Quota usage <70%
- ✅ Logging working
- ✅ API docs current
- ✅ Backup strategy in place
- ✅ Team notified

**Exit Codes**:
- 0: Ready to deploy
- 1: Warnings (proceed with caution)
- 2: Critical issues (do not deploy)

### 8. branch-cleanup

**Purpose**: Clean up stale Git branches

**Categorizes Branches**:
- **Safe to delete**: Merged + >30 days old
- **Review needed**: Merged but recent
- **Keep**: Unmerged with activity
- **Investigate**: Unmerged + >60 days (abandoned?)

**Safety Rules**:
- Never delete main/develop
- Never delete current branch
- Never delete unmerged without confirmation
- Always show branch details before deletion

### 9. dependency-audit

**Purpose**: Check for outdated/vulnerable npm packages

**Checks**:
- Security vulnerabilities (npm audit)
- Outdated packages (npm outdated)
- Deprecated packages
- Unused dependencies
- Duplicate dependencies

**Severity Levels**:
- 🔴 Critical: Fix immediately
- 🟠 High: Fix before deployment
- 🟡 Moderate: Fix in next sprint
- 🟢 Low: Fix when convenient

## 🎯 Integration Examples

### Pre-Flight Integration

The `/pre-flight` command integrates multiple skills:

```
/pre-flight
  ├─ security-scan skill
  ├─ quota-guard skill
  ├─ env-validator skill (if .env modified)
  ├─ docker-validate skill (if docker files modified)
  ├─ api-doc-sync skill (if routes modified)
  └─ commit-validator skill
```

### Deploy Integration

The `/deploy` command runs:

```
/deploy
  └─ deployment-checklist skill
      ├─ Runs tests
      ├─ Invokes security-scan
      ├─ Invokes quota-guard
      ├─ Invokes env-validator
      ├─ Invokes docker-validate
      ├─ Invokes api-doc-sync
      ├─ Invokes dependency-audit
      └─ Generates deployment report
```

## 🔧 Configuration

### Customize Thresholds

Edit skills to adjust thresholds:

**quota-guard.md**:
```markdown
- WARNING: 70% → 80%
- CRITICAL: 85% → 90%
- BLOCK: 95% → 98%
```

**branch-cleanup.md**:
```markdown
- Stale: >30 days → >60 days
```

### Add Custom Checks

Extend `/pre-flight`:
```markdown
### 7. Custom Check
Invoke `custom-skill`:
- Your custom validation
- Additional checks
```

## 📖 Best Practices

1. **Always run /pre-flight before committing**
   - Catches issues early
   - Ensures RULE 8 compliance
   - Prevents quota exhaustion

2. **Run /deploy before production deployments**
   - Comprehensive validation
   - Prevents production failures
   - Documents deployment readiness

3. **Weekly maintenance**
   - dependency-audit: Check for vulnerabilities
   - branch-cleanup: Remove stale branches
   - quota-guard: Review usage trends

4. **After adding API endpoints**
   - Run api-doc-sync skill
   - Update N8N_BACKEND_ENDPOINTS.md
   - Test with N8N workflows

5. **When quota warnings appear**
   - Run quota-guard for detailed analysis
   - Review mitigation strategies
   - Adjust feature flags if needed

## 🆘 Troubleshooting

### /pre-flight not found
Skills might need session restart. Try:
```bash
# Verify files exist
ls -la .claude/commands/
ls -la .claude/skills/

# Restart Claude Code session
```

### Security scan blocking commit
```bash
# Review issues
# Invoke security-scan skill

# Fix critical issues
# Re-run /pre-flight
```

### Quota guard blocking
```bash
# Check quota status
curl http://localhost:5001/api/monitoring/quota-status | jq

# Wait for reset or adjust limits
```

## 📝 Contributing

To add new skills:

1. Create `.claude/skills/your-skill.md`
2. Follow existing skill format
3. Document purpose, checks, output
4. Add to this README
5. Integrate with /pre-flight or /deploy if needed

## 🔗 Related Documentation

- [AXIOM_INTEGRATION_GUIDE.md](../AXIOM_INTEGRATION_GUIDE.md) - Axiom logging setup
- [N8N_BACKEND_ENDPOINTS.md](../N8N_BACKEND_ENDPOINTS.md) - API documentation
- [CONTEXT.md](../CONTEXT.md) - Project architecture
