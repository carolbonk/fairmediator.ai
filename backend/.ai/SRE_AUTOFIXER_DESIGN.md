# SRE Automated Bug Fixer Design

## Overview
Automated system that detects and fixes common issues in the codebase. Triggered by SRE agent or manually via CLI.

## Architecture

### 1. SRE Agent (Detector)
Runs periodic or on-demand checks to identify issues:
- **Security vulnerabilities** (npm audit)
- **Outdated dependencies** (npm outdated)
- **Code quality** (ESLint, unused imports, console.log)
- **Build failures**
- **Test failures**
- **Environment misconfigurations**
- **Missing files** (.env.example, documentation)

### 2. Issue Classifier
Categorizes detected issues:
- **Auto-fixable**: Safe to fix automatically (e.g., npm audit fix, format code)
- **Needs review**: Requires human decision (e.g., breaking API changes)
- **Manual only**: Too complex/risky to automate

### 3. Auto-Fixer (Executor)
Applies fixes for auto-fixable issues:
- Runs fix commands (npm audit fix, npm update)
- Modifies files (remove console.log, add missing configs)
- Updates dependencies
- Formats code

### 4. Reporter
Generates reports:
- What was detected
- What was fixed automatically
- What needs manual review
- Diff/changelog of changes

## Implementation Plan

### Phase 1: SRE Agent Core
```
backend/.ai/sre/
  ├── agent.js              # Main SRE agent orchestrator
  ├── detectors/
  │   ├── security.js       # npm audit, known CVEs
  │   ├── dependencies.js   # Outdated packages
  │   ├── codeQuality.js    # ESLint, unused code
  │   ├── build.js          # Build/test failures
  │   └── config.js         # Missing configs
  ├── fixers/
  │   ├── security.js       # Auto-fix vulnerabilities
  │   ├── dependencies.js   # Update packages
  │   ├── codeQuality.js    # Format, remove logs
  │   └── config.js         # Generate configs
  ├── classifier.js         # Classify issues
  └── reporter.js           # Generate reports
```

### Phase 2: Trigger Mechanisms
1. **CLI Command**: `npm run sre:fix`
2. **Git Hook**: Pre-commit check + auto-fix
3. **GitHub Action**: Weekly scheduled run
4. **Manual**: Via SRE dashboard

### Phase 3: Safety Mechanisms
- **Dry-run mode**: Preview changes before applying
- **Backup**: Git commit before applying fixes
- **Rollback**: Revert if fixes break build
- **Approval**: Require human approval for risky fixes

## Example Workflow

```bash
# 1. SRE agent detects issues
$ npm run sre:scan

# Output:
# ⚠️  Found 8 issues:
#   🔴 3 security vulnerabilities (auto-fixable)
#   🟡 2 outdated dependencies (needs review)
#   🔵 3 console.log statements (auto-fixable)

# 2. Auto-fix safe issues
$ npm run sre:fix --auto

# Output:
# ✅ Fixed 6 issues:
#   ✅ npm audit fix (3 vulnerabilities)
#   ✅ Removed 3 console.log statements
#
# ⏸️  2 issues need review:
#   ⏸️  React 18 → 19 (breaking changes)
#   ⏸️  Vite 5 → 6 (new config format)

# 3. Review and apply manual fixes
$ npm run sre:fix --review
```

## Auto-Fixable Issue Types

### 1. Security Vulnerabilities
- **Detection**: `npm audit`
- **Fix**: `npm audit fix` (non-breaking)
- **Safety**: Only fix if no breaking changes

### 2. Code Quality
- **Detection**: Grep for console.log, unused imports
- **Fix**: Remove/replace with logger
- **Safety**: Verify build passes after fix

### 3. Formatting
- **Detection**: ESLint/Prettier violations
- **Fix**: `npm run lint:fix`
- **Safety**: Very safe, only formatting

### 4. Missing Configs
- **Detection**: Check for .env.example, README
- **Fix**: Generate from templates
- **Safety**: Only create if missing

### 5. Outdated Dependencies (minor/patch)
- **Detection**: `npm outdated`
- **Fix**: `npm update` (semver safe)
- **Safety**: Only patch/minor versions

## Configuration

```json
// .ai/sre/config.json
{
  "autoFix": {
    "enabled": true,
    "dryRun": false,
    "createBackup": true,
    "requireApproval": ["dependencies", "security:breaking"]
  },
  "detectors": {
    "security": { "enabled": true, "severity": ["high", "critical"] },
    "dependencies": { "enabled": true, "maxAge": 180 },
    "codeQuality": { "enabled": true },
    "build": { "enabled": true }
  },
  "notifications": {
    "slack": false,
    "email": false,
    "console": true
  }
}
```

## Benefits

1. **Saves Time**: Automatically fixes routine issues
2. **Consistent**: Same fixes applied every time
3. **Fast**: Runs in seconds, not hours
4. **Safe**: Dry-run, backup, rollback mechanisms
5. **Auditable**: Full report of what changed

## Next Steps

1. Implement core SRE agent with detectors
2. Add auto-fixers for safe issue types
3. Create CLI commands
4. Add safety mechanisms (backup, rollback)
5. Integrate with git hooks or CI/CD
