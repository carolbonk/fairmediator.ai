# Git History Cleaning Guide

## ⚠️ WARNING: Destructive Operation

Cleaning git history rewrites commits and changes SHAs. This is a **destructive operation** that requires:
- Coordination with all team members
- Force pushing to remote repositories
- Re-cloning for all developers

**Only proceed if credentials have been exposed in git history.**

---

## Prerequisites

### 1. Install git-filter-repo

git-filter-repo is the modern tool for rewriting git history (replaces BFG and git-filter-branch).

```bash
# macOS
brew install git-filter-repo

# Linux (Ubuntu/Debian)
sudo apt-get install git-filter-repo

# Linux (CentOS/RHEL)
sudo yum install git-filter-repo

# Or via pip
pip3 install git-filter-repo
```

### 2. Backup Your Repository

```bash
# Create a complete backup
cd /path/to/FairMediator
cd ..
cp -r FairMediator FairMediator-backup-$(date +%Y%m%d)

# Or create a bundle
cd FairMediator
git bundle create ../FairMediator-backup-$(date +%Y%m%d).bundle --all
```

### 3. Notify Team Members

Before cleaning history, notify all collaborators:
- Stop all active work on the repository
- Push all branches to remote
- Note their current branch names
- Prepare to re-clone after history is cleaned

---

## Cleaning Strategies

### Strategy 1: Remove Specific Files

Use when you know exactly which files contain credentials.

```bash
# Remove .env files from entire history
git filter-repo --path .env --invert-paths --force

# Remove multiple file patterns
git filter-repo \
  --path .env --invert-paths \
  --path backend/.env --invert-paths \
  --path config/credentials.json --invert-paths \
  --force

# Remove all .env files recursively
git filter-repo --path-glob '**/.env' --invert-paths --force
```

### Strategy 2: Remove Sensitive Data Patterns

Use when credentials are embedded in committed files.

```bash
# Create a patterns file
cat > /tmp/secrets-patterns.txt << 'EOF'
# API Keys
regex:sk-[a-zA-Z0-9]{48}==>REDACTED_OPENAI_KEY
regex:sk-ant-[a-zA-Z0-9\-]{95,}==>REDACTED_ANTHROPIC_KEY
regex:AKIA[0-9A-Z]{16}==>REDACTED_AWS_KEY

# MongoDB Credentials
regex:mongodb(\+srv)?://[^:]+:[^@]+@==>mongodb://REDACTED:REDACTED@

# GitHub Tokens
regex:ghp_[a-zA-Z0-9]{36}==>REDACTED_GITHUB_TOKEN

# Private Keys
regex:-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----.*-----END (RSA |EC |OPENSSH )?PRIVATE KEY-----==>REDACTED_PRIVATE_KEY
EOF

# Apply replacements to history
git filter-repo --replace-text /tmp/secrets-patterns.txt --force
```

### Strategy 3: Remove Entire Commits

Use when entire commits contain only sensitive configuration.

```bash
# Remove specific commits by SHA
git filter-repo --commit-callback '
  if commit.original_id in [b"d7fd979a812f2a78ad4edfbd5ed5da123aaa1c2a"]:
    commit.skip()
' --force

# Note: Use actual commit SHAs from your history
```

### Strategy 4: Clean Specific Directories

Use when an entire directory should never have been committed.

```bash
# Remove a directory from all history
git filter-repo --path config/secrets/ --invert-paths --force

# Remove multiple directories
git filter-repo \
  --path backups/ --invert-paths \
  --path temp_keys/ --invert-paths \
  --path .ipynb_checkpoints/ --invert-paths \
  --force
```

---

## Complete Cleaning Workflow

### Step 1: Identify What to Clean

```bash
# Scan for exposed files in history
git log --all --full-history -- "**/.env" --pretty=format:"%H %s"

# Search for specific patterns
git log --all -S"mongodb://" --pretty=format:"%H %s"
git log --all -S"sk-" --pretty=format:"%H %s"

# List all .env files ever committed
git log --all --full-history --diff-filter=A -- "**/.env" --pretty=format:"%H %s"
```

### Step 2: Create Cleaning Script

```bash
#!/bin/bash
# clean-git-history.sh

set -e

echo "🧹 Cleaning FairMediator git history..."
echo "⚠️  This will rewrite git history!"
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Aborted."
  exit 1
fi

# Backup current state
echo "Creating backup..."
git bundle create ../FairMediator-backup-$(date +%Y%m%d-%H%M%S).bundle --all

# Remove sensitive files
echo "Removing .env files from history..."
git filter-repo \
  --path-glob '**/.env' --invert-paths \
  --path-glob '**/.env.local' --invert-paths \
  --path-glob '**/.env.production' --invert-paths \
  --force

# Remove credential patterns
echo "Redacting API keys and credentials..."
cat > /tmp/secrets-patterns.txt << 'EOF'
regex:sk-[a-zA-Z0-9]{48}==>REDACTED_OPENAI_KEY
regex:sk-ant-[a-zA-Z0-9\-]{95,}==>REDACTED_ANTHROPIC_KEY
regex:mongodb(\+srv)?://[^:]+:[^@]+@[^/]+==>mongodb://REDACTED:REDACTED@REDACTED
regex:AKIA[0-9A-Z]{16}==>REDACTED_AWS_KEY
regex:ghp_[a-zA-Z0-9]{36}==>REDACTED_GITHUB_TOKEN
EOF

git filter-repo --replace-text /tmp/secrets-patterns.txt --force

# Remove private keys
echo "Removing private key files..."
git filter-repo \
  --path-glob '**/*.pem' --invert-paths \
  --path-glob '**/*.key' --invert-paths \
  --path-glob '**/id_rsa' --invert-paths \
  --force

echo "✅ History cleaned successfully!"
echo ""
echo "Next steps:"
echo "1. Review cleaned history: git log --oneline"
echo "2. Force push to remote: git push origin --force --all"
echo "3. Notify team to re-clone repository"
echo "4. Rotate all exposed credentials"
```

### Step 3: Execute Cleaning

```bash
chmod +x clean-git-history.sh
./clean-git-history.sh
```

### Step 4: Verify Cleaning

```bash
# Verify files are removed
git log --all --full-history -- "**/.env" --pretty=format:"%H %s"
# Should return empty

# Verify patterns are redacted
git log --all -S"mongodb://" --pretty=format:"%H %s"
git log --all -S"sk-" --pretty=format:"%H %s"

# Check repository size reduction
du -sh .git
```

### Step 5: Force Push to Remote

```bash
# ⚠️  DANGER ZONE: This will overwrite remote history

# Force push all branches
git push origin --force --all

# Force push all tags
git push origin --force --tags

# For GitHub/GitLab, you may need to temporarily disable branch protection
```

### Step 6: Team Re-Clones Repository

All team members must:

```bash
# Save any uncommitted work
cd /path/to/FairMediator
git stash

# Rename old repository
cd ..
mv FairMediator FairMediator-old

# Fresh clone
git clone https://github.com/yourusername/FairMediator.git
cd FairMediator

# Re-apply stashed work (if compatible)
# cp FairMediator-old/.env .  # Restore local config
```

---

## Post-Cleaning Actions

### 1. Rotate All Exposed Credentials

Even though they're removed from history, they were exposed:

```bash
# OpenAI API Key
# → Generate new key at platform.openai.com/api-keys

# Anthropic API Key
# → Generate new key at console.anthropic.com

# MongoDB Connection String
# → Rotate password in MongoDB Atlas

# GitHub Tokens
# → Revoke and regenerate at github.com/settings/tokens

# AWS Keys
# → Rotate in AWS IAM console

# Stripe Keys
# → Roll keys in Stripe dashboard
```

### 2. Audit Access Logs

Check if exposed credentials were misused:

```bash
# MongoDB Atlas
# → Check Database Access logs

# OpenAI
# → Check Usage page for unexpected API calls

# GitHub
# → Check Security Log in Settings

# AWS
# → Check CloudTrail for unauthorized access
```

### 3. Update .gitignore

Ensure the cleaned files won't be re-committed:

```bash
# Verify .gitignore includes:
cat .gitignore | grep -E "(\.env|\.pem|\.key|credentials)"

# Test gitignore is working
touch .env
git status | grep "nothing to commit"
```

### 4. Enable Pre-Commit Hooks

Prevent future credential leaks:

```bash
# Install pre-commit hook (from security-scanner skill)
# This will run credential scanning before every commit
```

---

## Alternative: GitHub Secret Scanning

If your repository is on GitHub, use their secret scanning:

```bash
# Check for leaked secrets
gh api repos/yourusername/FairMediator/secret-scanning/alerts

# Enable secret scanning (requires GitHub Advanced Security for private repos)
# → Go to repository Settings > Code security and analysis
# → Enable "Secret scanning"
```

---

## Troubleshooting

### "remote: error: denying non-fast-forward"

Branch protection is enabled. Temporarily disable it:
1. Go to repository Settings > Branches
2. Edit branch protection rule for main
3. Uncheck "Require linear history"
4. Force push, then re-enable protection

### "fatal: refusing to merge unrelated histories"

History was rewritten. Team members must re-clone:
```bash
git fetch origin
git reset --hard origin/main
```

### "Repository size didn't decrease"

Run git garbage collection:
```bash
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

---

## Prevention (Better Than Cleanup)

### 1. Pre-Commit Hooks

Install automatic credential scanning:
```bash
# Use the security-scanner skill via /pre-flight command
```

### 2. .gitignore Maintenance

Keep .gitignore comprehensive and up-to-date.

### 3. Education

Train team members:
- Never commit .env files
- Always use environment variables
- Review diffs before committing
- Use `/pre-flight` command before every commit

### 4. Code Review

- Require PR reviews before merging
- Use GitHub's secret scanning alerts
- Set up CI/CD credential scanning

---

## Resources

- [git-filter-repo documentation](https://github.com/newren/git-filter-repo)
- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Atlassian: Rewriting history](https://www.atlassian.com/git/tutorials/rewriting-history)

---

## Summary Checklist

- [ ] Backup repository (bundle or directory copy)
- [ ] Notify team members to stop work
- [ ] Identify files/patterns to clean
- [ ] Install git-filter-repo
- [ ] Run cleaning script
- [ ] Verify history is clean
- [ ] Force push to remote
- [ ] Team re-clones repository
- [ ] Rotate all exposed credentials
- [ ] Audit access logs for misuse
- [ ] Enable pre-commit credential scanning
- [ ] Update documentation
