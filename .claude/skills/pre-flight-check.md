# Pre-Flight Check Skill

## Purpose
Validate all changes against project rules BEFORE executing them. Prevents rule violations, quota overages, and non-human commits.

## When to Use
Call this skill BEFORE:
- Creating any git commits
- Adding new external service integrations
- Updating documentation with usage estimates
- Marking tasks as complete in TODOs
- Making changes that affect free tier services

## Validation Checklist

### 1. Free Tier Protection (RULE 2)
**For ANY new external service:**
- [ ] Calculate daily/monthly quota limits
- [ ] Add to `FREE_TIER_LIMITS` in `freeTierMonitor.js`
- [ ] Implement rate limiting logic
- [ ] Set alert thresholds (70%, 85%, 95%, 100%)
- [ ] Verify documented usage < allocated quota
- [ ] Add to `/api/monitoring/quota-status` endpoint

**Math Check:**
```
Daily Usage × 30 ≤ Monthly Quota
If not: Add sampling OR reduce usage OR reject integration
```

### 2. Git Commit Messages (RULE 8)
**Before ANY commit:**
- [ ] NO emojis (❌ 🤖 ✨ 🎉 etc.)
- [ ] NO decorations or icons
- [ ] NO "Generated with Claude Code" footer
- [ ] NO "Co-Authored-By: Claude" footer
- [ ] Maximum 3 sentences
- [ ] Imperative mood ("Add feature" not "Added feature")
- [ ] Sounds like a human engineer wrote it

**Good Examples:**
```
Add Axiom logging with quota monitoring
Fix authentication bug in password reset flow
Refactor API service for better error handling
```

**Bad Examples:**
```
✨ Add amazing new feature 🎉
Generated with Claude Code
This commit adds a new feature that allows users to...
```

### 3. No Lies (RULE 1)
**Before claiming completion:**
- [ ] Tests actually run and pass
- [ ] Features actually tested manually
- [ ] Documentation matches reality
- [ ] No "TODO" comments in "completed" code

### 4. Commit Permission
**Before ANY git commit:**
- [ ] User explicitly requested commit OR
- [ ] User explicitly approved changes for commit
- [ ] Do NOT commit proactively without permission

## Common Violations Caught

### Violation 1: Axiom Integration (Feb 26, 2026)
**What happened:**
- Added Axiom (166MB/month quota)
- Documented 450k logs/month usage (2.6x over quota)
- No rate limiting added to freeTierMonitor.js
- No alert thresholds configured

**Should have:**
- Calculated 166MB = ~170k logs/month max
- Added `axiom` to FREE_TIER_LIMITS
- Implemented log sampling (every 10th request)
- Added production-only mode warning

### Violation 2: Unauthorized Commit (Feb 26, 2026)
**What happened:**
- User said "update to 166MB/month"
- I committed changes without permission
- Added emoji (🤖) and "Generated with Claude Code" footer

**Should have:**
- Made changes only
- Waited for user to request commit
- If user requests commit, use human-like message

## Integration with Automation

### Git Pre-Commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check for emojis in commit message
if git log -1 --pretty=%B | grep -qE '[\x{1F300}-\x{1F9FF}]'; then
  echo "❌ Commit message contains emoji (violates RULE 8)"
  exit 1
fi

# Check for "Generated with Claude Code"
if git log -1 --pretty=%B | grep -q "Generated with Claude Code"; then
  echo "❌ Commit message contains Claude Code attribution (violates RULE 8)"
  exit 1
fi

# Check for Co-Authored-By: Claude
if git log -1 --pretty=%B | grep -q "Co-Authored-By: Claude"; then
  echo "❌ Commit message contains Claude co-author (violates RULE 8)"
  exit 1
fi

exit 0
```

### CI Check (GitHub Actions)
```yaml
- name: Validate commit messages
  run: |
    if git log --oneline -1 | grep -qE '[\x{1F300}-\x{1F9FF}]'; then
      echo "Commit message contains emoji"
      exit 1
    fi
```

### Skills Integration
**Combine with:**
1. **code-reviewer skill** - Check for free tier violations in code
2. **commit-validator skill** - Validate messages before committing
3. **quota-calculator skill** - Calculate service quotas automatically

**Automation workflow:**
```
User requests change → pre-flight-check skill → Execute change →
code-reviewer skill → User approves → commit-validator skill →
User commits
```

## Skill Output Format
```
✅ PASS: Free tier protection validated
✅ PASS: Commit message is human-like
✅ PASS: No unauthorized commits
❌ FAIL: Axiom quota monitoring missing

ACTION REQUIRED:
1. Add Axiom to freeTierMonitor.js FREE_TIER_LIMITS
2. Implement log sampling for high-volume logs
3. Update documentation to reflect 166MB = ~170k logs/month max
```
