# Security Scanner Skill

## Purpose
Detect exposed credentials, API keys, secrets, and security vulnerabilities before commits reach git history.

## When to Use
- Automatically via `/pre-flight` command before every commit
- When modifying environment configuration files
- Before pushing to remote repositories
- As part of CI/CD pipeline validation

## Credential Detection Patterns

### High-Risk Patterns (Block Commit)
```regex
# API Keys
- OpenAI: sk-[a-zA-Z0-9]{48}
- Anthropic: sk-ant-[a-zA-Z0-9\-]{95,}
- AWS Access: AKIA[0-9A-Z]{16}
- Stripe Secret: sk_live_[a-zA-Z0-9]{24,}
- Stripe Publishable: pk_live_[a-zA-Z0-9]{24,}

# Database Credentials
- MongoDB URI: mongodb(\+srv)?://[^:]+:[^@]+@
- PostgreSQL: postgres(ql)?://[^:]+:[^@]+@
- MySQL: mysql://[^:]+:[^@]+@

# JWT & Tokens
- JWT: eyJ[a-zA-Z0-9-_=]+\.eyJ[a-zA-Z0-9-_=]+\.[a-zA-Z0-9-_.+/=]+
- GitHub Token: ghp_[a-zA-Z0-9]{36}
- GitHub OAuth: gho_[a-zA-Z0-9]{36}
- GitHub App: (ghu|ghs)_[a-zA-Z0-9]{36}

# Generic Secrets
- Private Keys: -----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----
- Bearer Tokens: Bearer [a-zA-Z0-9\-._~+/]+=*
- Basic Auth: Authorization:\s*Basic\s+[A-Za-z0-9+/=]+
```

### Medium-Risk Patterns (Warn)
```regex
# Passwords in Code
- PASSWORD\s*=\s*["'][^"']+["']
- password\s*:\s*["'][^"']+["']
- PASS\s*=\s*["'][^"']+["']

# API Endpoints with Embedded Credentials
- https?://[^:]+:[^@]+@[a-z0-9.-]+

# Hardcoded Tokens
- token\s*=\s*["'][a-zA-Z0-9]{32,}["']
- apikey\s*=\s*["'][a-zA-Z0-9]{32,}["']
```

## File Path Scanning

### Always Block These Files
```
.env
.env.local
.env.*.local (except .env.example)
*.pem
*.key
*.p12
*.pfx
credentials.json
secrets.yaml
id_rsa
```

### Warn for These Files
```
*.ipynb (may contain hardcoded API keys in cells)
docker-compose.yml (check for hardcoded secrets)
config/*.json (verify no secrets in plain config)
```

## Scan Implementation

### 1. Pre-Commit Scan
```bash
#!/bin/bash

echo "🔒 SECURITY SCAN: Checking for exposed credentials..."

# Get list of files to be committed
FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$FILES" ]; then
  echo "✅ No files to scan"
  exit 0
fi

# Check for blocked file patterns
echo "Checking file patterns..."
BLOCKED_FILES=$(echo "$FILES" | grep -E '(^\.env$|^\.env\.|\.pem$|\.key$|credentials\.json|secrets\.yaml|id_rsa)')
if [ -n "$BLOCKED_FILES" ]; then
  echo "❌ BLOCKED: Attempting to commit sensitive files:"
  echo "$BLOCKED_FILES"
  echo ""
  echo "These files should NEVER be committed. Add them to .gitignore."
  exit 1
fi

# Scan file contents for credential patterns
echo "Scanning file contents..."
FINDINGS=""

for file in $FILES; do
  if [ -f "$file" ]; then
    # OpenAI API Keys
    if grep -qE 'sk-[a-zA-Z0-9]{48}' "$file" 2>/dev/null; then
      FINDINGS="${FINDINGS}❌ OpenAI API key found in $file\n"
    fi

    # Anthropic API Keys
    if grep -qE 'sk-ant-[a-zA-Z0-9\-]{95,}' "$file" 2>/dev/null; then
      FINDINGS="${FINDINGS}❌ Anthropic API key found in $file\n"
    fi

    # MongoDB Credentials
    if grep -qE 'mongodb(\+srv)?://[^:]+:[^@]+@' "$file" 2>/dev/null; then
      FINDINGS="${FINDINGS}❌ MongoDB credentials found in $file\n"
    fi

    # AWS Keys
    if grep -qE 'AKIA[0-9A-Z]{16}' "$file" 2>/dev/null; then
      FINDINGS="${FINDINGS}❌ AWS access key found in $file\n"
    fi

    # Stripe Keys
    if grep -qE 'sk_live_[a-zA-Z0-9]{24,}' "$file" 2>/dev/null; then
      FINDINGS="${FINDINGS}❌ Stripe secret key found in $file\n"
    fi

    # GitHub Tokens
    if grep -qE 'gh[pousr]_[a-zA-Z0-9]{36}' "$file" 2>/dev/null; then
      FINDINGS="${FINDINGS}❌ GitHub token found in $file\n"
    fi

    # Private Keys
    if grep -qE '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----' "$file" 2>/dev/null; then
      FINDINGS="${FINDINGS}❌ Private key found in $file\n"
    fi

    # JWT Tokens
    if grep -qE 'eyJ[a-zA-Z0-9-_=]+\.eyJ[a-zA-Z0-9-_=]+\.[a-zA-Z0-9-_.+/=]+' "$file" 2>/dev/null; then
      FINDINGS="${FINDINGS}⚠️  JWT token found in $file (verify if test data)\n"
    fi
  fi
done

if [ -n "$FINDINGS" ]; then
  echo ""
  echo "🚨 CREDENTIAL LEAK DETECTED 🚨"
  echo ""
  echo -e "$FINDINGS"
  echo ""
  echo "Action Required:"
  echo "1. Remove the credentials from the files"
  echo "2. Move secrets to .env files (which are gitignored)"
  echo "3. Rotate any exposed credentials immediately"
  echo "4. Re-stage your changes and try again"
  exit 1
fi

echo "✅ No credentials detected"
exit 0
```

### 2. Full Repository Scan
```bash
# Scan entire repository history for credentials
echo "🔍 Scanning git history for exposed credentials..."

# Check for .env files in history
echo "Checking for .env files in git history..."
git log --all --full-history -- "**/.env" --pretty=format:"%H %s" | head -10

# Search for common credential patterns
echo "Searching for API keys in history..."
git log --all -S"sk-" --pretty=format:"%H %s" | head -10
git log --all -S"mongodb://" --pretty=format:"%H %s" | head -10
git log --all -S"AKIA" --pretty=format:"%H %s" | head -10

# List all objects that might contain secrets
echo "Scanning git objects for sensitive files..."
git rev-list --all --objects | grep -E "(\.env[^.]|secret|credential|apikey|\.pem|\.key)"
```

## Integration with Pre-Flight

Add to `.claude/commands/pre-flight.md`:

```markdown
## Pre-Commit Security Checklist

Before creating a commit, run:

1. **Credential Scan** (invoke security-scanner skill)
   - Scan staged files for API keys, secrets, credentials
   - Block commit if high-risk patterns detected
   - Warn for medium-risk patterns

2. **File Pattern Check**
   - Verify no .env files are staged
   - Ensure no private keys (.pem, .key) are included
   - Check for credentials.json or secrets files

3. **Git History Verification**
   - Confirm sensitive files are in .gitignore
   - Validate gitignore patterns are working
```

## Response Format

### Clean Scan
```
🔒 SECURITY SCAN COMPLETE

✅ No credentials detected
✅ No blocked file patterns
✅ All staged files safe to commit

Scanned files: 12
High-risk patterns checked: 15
Medium-risk patterns checked: 8

Safe to proceed with commit.
```

### Blocked Commit
```
🚨 SECURITY SCAN FAILED

❌ CRITICAL: Exposed credentials detected

Findings:
- ❌ OpenAI API key in backend/src/config/ai.js:45
- ❌ MongoDB credentials in docker-compose.yml:78
- ❌ Private key in config/ssl/server.key

ACTION REQUIRED:
1. Remove credentials from these files
2. Move secrets to .env (already gitignored)
3. Rotate exposed credentials immediately
4. Re-stage changes and run scan again

COMMIT BLOCKED - Do not force push!
```

## Security Rules Documentation

Should be documented in CONTEXT.md:

```markdown
## 🔒 Security Rules (RULE 10)

### Never Commit These Files
- .env (any variant except .env.example)
- Private keys (*.pem, *.key, *.p12, *.pfx)
- Credentials files (credentials.json, secrets.yaml)
- SSH keys (id_rsa, id_ed25519)
- Database dumps with PII
- JWT tokens or session cookies

### Always Use Environment Variables
- API keys (OpenAI, Anthropic, AWS, Stripe, etc.)
- Database connection strings
- OAuth client secrets
- Signing keys and secrets
- Third-party service tokens

### Pre-Commit Workflow
1. Run `/pre-flight` command
2. Security scanner checks staged files
3. Credential patterns detected → Commit blocked
4. Fix issues, rotate exposed credentials
5. Re-scan and commit when clean

### If Credentials Are Exposed
1. STOP - Do not force push
2. Remove credentials from code immediately
3. Rotate all exposed credentials (API keys, passwords, tokens)
4. Clean git history (see GIT_HISTORY_CLEANING.md)
5. Force push cleaned history (coordinate with team)
6. Audit access logs for potential misuse
```

## Exit Codes
- 0: Scan passed, safe to commit
- 1: Warnings detected (review recommended)
- 2: Critical findings (commit blocked)
