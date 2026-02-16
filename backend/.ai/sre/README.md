# SRE Automated Bug Fixer

Automated system that detects and fixes common issues in the FairMediator codebase.

## Features

- **Security Vulnerability Detection**: Scans for npm vulnerabilities via `npm audit`
- **Dependency Management**: Detects outdated packages and suggests updates
- **Code Quality**: Finds console.log statements, ESLint violations
- **Automated Fixing**: Automatically applies safe fixes
- **Dry-Run Mode**: Preview changes before applying
- **Git Backup**: Creates backup commits before making changes
- **Comprehensive Reports**: JSON reports saved to `.ai/sre/reports/`

## Installation

The SRE agent is already installed with the backend. Dependencies:
- `glob` - File pattern matching
- Node.js built-in `child_process`, `fs`, `path`

## Scheduling

### ⏰ Automatic (CRON)
The SRE agent runs automatically **every Sunday at 2:00 AM** via the backend CRON scheduler (`src/services/scraping/cronScheduler.js`).

It will:
- Scan for security vulnerabilities, outdated dependencies, and code quality issues
- Automatically fix safe issues
- Create git backup before applying changes
- Generate report in `.ai/sre/reports/`
- Log results to console

**To enable/disable:** The CRON job runs automatically when the backend server is running.

### 🎯 Manual (On-Demand)
You can trigger the SRE agent manually anytime:

## Usage

### Scan for Issues (No Fixes)

```bash
cd backend
npm run sre:scan
```

This will:
- Scan for security vulnerabilities
- Check for outdated dependencies
- Detect code quality issues
- Display summary (no changes applied)

### Auto-Fix Issues

```bash
npm run sre:fix
```

This will:
1. Scan for all issues
2. Classify as auto-fixable, needs review, or manual only
3. Create git backup commit
4. Apply automatic fixes for safe issues
5. Generate report

### Dry-Run (Preview Only)

```bash
npm run sre:dry-run
```

This will:
- Show what would be fixed
- Preview commands that would be run
- No actual changes applied

## What Gets Auto-Fixed

### ✅ Safe to Auto-Fix

1. **Security vulnerabilities** (non-breaking)
   - Runs `npm audit fix` for patch/minor updates
   - Only fixes if no breaking changes

2. **Console.log statements** (frontend only)
   - Replaces `console.log` with `logger.debug`
   - Adds logger import if missing
   - Only in production code (excludes test files)

3. **ESLint auto-fixable violations**
   - Runs `npm run lint:fix`
   - Formatting, unused imports, etc.

### ⏸️ Needs Review

1. **Major version updates**
   - Breaking changes require human review
   - Listed in "needs review" section

2. **Security fixes with breaking changes**
   - Flagged for manual review

### ❌ Manual Only

1. **Backend console.log statements**
   - Requires proper logger setup first

2. **Complex code quality issues**
   - Architectural changes

3. **Configuration changes**
   - Custom setup required

## Example Output

```bash
$ npm run sre:scan

╔════════════════════════════════════════════════════════════╗
║                    SRE AGENT v1.0                          ║
║            Automated Issue Detection & Fixing              ║
╚════════════════════════════════════════════════════════════╝

🔍 SRE Agent: Starting scan...

📡 Running security detector...
   Found 0 security issues
📡 Running dependencies detector...
   Found 2 dependency issues
📡 Running code quality detector...
   Found 3 code quality issues

✅ Scan complete: 5 total issues found

============================================================
📊 SCAN RESULTS
============================================================

✅ Auto-fixable: 3
⏸️  Needs review: 2
❌ Manual only: 0

💡 Run "npm run sre:fix" to apply auto-fixes
   Run "npm run sre:fix -- --dry-run" to preview changes
```

```bash
$ npm run sre:fix

🔧 SRE Agent: Applying automatic fixes...

📦 Created backup commit

🔧 Applying automatic fixes...

📊 Auto-fixable: 3
⏸️  Needs review: 2
❌ Manual only: 0

   ✅ Fixed: console.log in components/HybridSearch.jsx
   ✅ Fixed: console.log in pages/HomePage.jsx
   ✅ Fixed: console.log in components/StatisticsPanel.jsx

✅ Applied 3 fixes

============================================================
📊 SRE AGENT REPORT
============================================================

📈 Summary:
   Total issues found: 5
   Auto-fixed: 3
   Failed fixes: 0
   Needs review: 2
   Manual only: 0

🔍 By Severity:
   🟡 medium: 2
   🟢 low: 3

📦 By Category:
   • dependencies: 2
   • logging: 3

💡 Recommendations:
   🟠 Review and manually apply fixes
      2 issues need human review before applying fixes

============================================================

📄 Report saved: .ai/sre/reports/sre-report-2026-02-16_18-30-45.json

⏱️  Completed in 3.42s

✅ SRE Agent completed successfully
```

## Configuration

Edit `.ai/sre/config.json`:

```json
{
  "autoFix": {
    "enabled": true,
    "dryRun": false,
    "createBackup": true,
    "requireApproval": ["dependencies:major", "security:breaking"]
  },
  "detectors": {
    "security": {
      "enabled": true,
      "severity": ["low", "moderate", "high", "critical"]
    },
    "dependencies": {
      "enabled": true,
      "maxAgeDays": 180,
      "autoUpdateTypes": ["patch", "minor"]
    },
    "codeQuality": {
      "enabled": true,
      "checks": ["console.log", "unused-imports", "eslint"]
    }
  },
  "thresholds": {
    "maxAutoFixes": 20,
    "maxFileChanges": 50
  }
}
```

## Architecture

```
.ai/sre/
├── agent.js              # Main orchestrator
├── cli.js               # Command-line interface
├── config.json          # Configuration
├── reporter.js          # Report generation
├── detectors/
│   ├── security.js      # npm audit scanner
│   ├── dependencies.js  # npm outdated scanner
│   └── codeQuality.js   # Code quality scanner
├── fixers/
│   ├── security.js      # Security vulnerability fixer
│   └── codeQuality.js   # Code quality fixer
└── reports/             # Generated reports (timestamped JSON)
```

## Workflow

1. **Detection**: Run all enabled detectors in parallel
2. **Classification**: Categorize issues as auto-fixable, needs review, or manual
3. **Backup**: Create git commit before applying changes
4. **Fixing**: Apply automatic fixes for safe issues
5. **Reporting**: Generate comprehensive JSON report + console summary
6. **Verification**: (Optional) Run tests to ensure fixes didn't break anything

## Integration Options

### Git Hook (Pre-commit)

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
npm run sre:scan
```

### GitHub Actions (Weekly)

```yaml
name: SRE Agent

on:
  schedule:
    - cron: '0 2 * * 0'  # Every Sunday at 2 AM

jobs:
  sre-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd backend && npm install
      - run: cd backend && npm run sre:fix
      - run: git diff
```

### Manual Trigger

```bash
# Run before deployment
npm run sre:scan

# Run after major changes
npm run sre:fix

# Run weekly as maintenance
npm run sre:dry-run
```

## Safety Mechanisms

1. **Git Backup**: Creates commit before making changes
2. **Dry-Run Mode**: Preview all changes before applying
3. **Classification**: Only auto-fix proven-safe issue types
4. **Thresholds**: Limits on max fixes per run
5. **Rollback**: Use `git reset HEAD~1` to undo changes

## Reports

Reports are saved to `.ai/sre/reports/sre-report-{timestamp}.json`:

```json
{
  "timestamp": "2026-02-16T18:30:45.123Z",
  "summary": {
    "total_issues": 5,
    "auto_fixed": 3,
    "fix_errors": 0,
    "needs_review": 2,
    "manual_only": 0,
    "by_severity": { "medium": 2, "low": 3 },
    "by_category": { "dependencies": 2, "logging": 3 }
  },
  "issues": {
    "security": [],
    "dependencies": [...],
    "code_quality": [...]
  },
  "fixes": [...],
  "needsReview": [...],
  "recommendations": [...]
}
```

## Troubleshooting

### "Permission denied" error

```bash
chmod +x .ai/sre/cli.js
```

### "glob not found" error

```bash
npm install glob --save-dev
```

### Backup commit failed

Make sure you have no uncommitted changes or run with `--no-backup`:

```bash
# Not recommended, but available
node .ai/sre/cli.js --fix --no-backup
```

## Future Enhancements

- [ ] Build verification after fixes
- [ ] Test suite execution
- [ ] Slack/Email notifications
- [ ] Dependency vulnerability scoring
- [ ] Performance impact analysis
- [ ] Automatic PR creation for fixes

## License

Part of FairMediator project (MIT License)
