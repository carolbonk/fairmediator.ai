# Pre-Flight Command

Run comprehensive pre-commit security checks and create a validated commit message.

## Steps

1. **Git Status & File Staging**
   - Run `git status` to see all changes (staged and unstaged)
   - Stage all relevant files with `git add .`
   - Exclude files that should not be committed:
     - Test artifacts (test-results/, coverage/)
     - Temporary files (tmp/, temp/, *.swp)
     - Build artifacts (dist/, build/)
     - Log files (*.log, logs/)
   - Show what will be committed with `git diff --cached`

2. **Security Scan** - Invoke `security-scanner` skill to check staged files for:
   - Exposed API keys (OpenAI, Anthropic, AWS, Stripe, GitHub)
   - Database credentials (MongoDB, PostgreSQL, MySQL)
   - Private keys and certificates (.pem, .key files)
   - JWT tokens and bearer tokens
   - Blocked file patterns (.env files, credentials.json, etc.)

3. **Docker Validation** (if Docker files modified)
   - Invoke `docker-validate` skill if changes include:
     - Dockerfile (backend or frontend)
     - docker-compose.yml or docker-compose.*.yml
     - Port configuration changes
   - Validate RULE 9 compliance (4000-4499 port range)

4. **Commit Message Generation**
   - Invoke `commit-validator` skill to draft RULE 8 compliant message
   - Present commit message to user for approval

5. **Commit Execution** (if approved)
   - Create the commit with validated message (files already staged from Step 1)
   - Run `git status` after commit to verify

## Security Checklist

Before any commit is created:

- [ ] ✅ No .env files are staged (except .env.example)
- [ ] ✅ No API keys detected in staged files
- [ ] ✅ No database credentials exposed
- [ ] ✅ No private keys (.pem, .key, .p12, .pfx)
- [ ] ✅ No credentials.json or secrets files
- [ ] ✅ No JWT tokens or session cookies
- [ ] ✅ All secrets use environment variables
- [ ] ✅ .gitignore patterns are working correctly

## Important Rules

### RULE 8: Commit Messages
- Maximum 3 sentences
- No emojis (❌ 🤖 ✨ 🎉 📝 etc.)
- Imperative mood ("Add feature" not "Added feature")
- Do NOT include "Generated with Claude Code" footer
- Do NOT include "Co-Authored-By: Claude" footer
- Write like a human engineer

### RULE 9: Port Allocation
- ALL Docker ports MUST be in 4000-4499 range
- Exception: Traefik ports 80/443 (management.yml only)
- Validated automatically if Docker files modified

### RULE 10: Security (NEW)
- NEVER commit .env files (any variant except .env.example)
- NEVER commit private keys or certificates
- NEVER commit API keys or tokens
- ALWAYS use environment variables for secrets
- ALWAYS run security scan before committing

## Workflow Examples

### Standard Commit
```
User: "/pre-flight"

1. Run git status → Show all changes
2. Stage all files with git add .
3. Show staged diff
4. Security scan runs → ✅ No credentials detected
5. Generate commit message (RULE 8 compliant)
6. User approves → Commit created
```

### Blocked Commit (Credentials Detected)
```
User: "/pre-flight"

1. Run git status → Show all changes
2. Stage all files with git add .
3. Security scan runs → ❌ MongoDB credentials found in docker-compose.yml
4. COMMIT BLOCKED
5. Show findings and remediation steps:
   - Remove credentials from docker-compose.yml
   - Move to .env file (already gitignored)
   - Rotate exposed credentials
   - Re-run /pre-flight
```

### Docker Changes
```
User: "/pre-flight"

1. Run git status → docker-compose.yml modified
2. Stage all files with git add .
3. Security scan runs → ✅ Clean
4. Detect docker-compose.yml in staged files
5. Run docker-validate skill:
   - Syntax validation
   - Environment variables check
   - Port range validation (RULE 9)
   - Build context verification
6. If RULE 9 violation → COMMIT BLOCKED
7. If all pass → Generate commit message
8. User approves → Commit created
```

## Exit Behavior

- **Security scan fails** → BLOCK commit, show findings, exit
- **Docker validation fails** → BLOCK commit, show violations, exit
- **All scans pass** → Proceed to commit message generation
- **User rejects commit message** → Allow editing, re-validate
- **User approves** → Create commit, verify with git status

## Integration with Other Skills

```
pre-flight (this command)
  ├─ security-scanner skill (credential scanning)
  ├─ docker-validate skill (if Docker files changed)
  └─ commit-validator skill (message validation)
```
