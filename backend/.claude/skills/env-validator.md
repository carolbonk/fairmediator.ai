# Environment Variable Validator

## Purpose
Ensure all required environment variables are documented, set correctly, and synchronized between environments. Prevent runtime failures due to missing configuration.

## When to Use
- After adding new API integrations
- Before deployment to production
- When onboarding new developers
- After modifying .env files
- As part of deployment-checklist

## Validation Checks

### 1. Code → .env Sync
- Scan all backend code for `process.env.XXX` usage
- Compare with backend/.env and backend/.env.example
- Flag variables used in code but not documented

### 2. .env → .env.example Sync
- Compare backend/.env with backend/.env.example
- Ensure .env.example has placeholder for every variable
- Check .env.example doesn't contain real secrets
- Verify comments are helpful

### 3. Backend vs Root .env Sync
- For Docker deployment, some vars need to be in root .env
- Check critical vars exist in both places:
  - JWT_SECRET
  - SESSION_SECRET
  - AXIOM_* variables
  - API keys needed by Docker

### 4. Required Variable Check
Must be set (non-empty):
- NODE_ENV
- PORT
- MONGODB_URI
- JWT_SECRET
- SESSION_SECRET
- AXIOM_DATASET, AXIOM_TOKEN (if AXIOM_ENABLED=true)

### 5. Format Validation
- MongoDB URI format: `mongodb+srv://` or `mongodb://`
- JWT secrets: minimum 32 characters
- Port numbers: 1-65535
- Boolean flags: 'true' or 'false' (not 1/0)
- URLs: valid http:// or https://

### 6. Security Check
- No .env.example with real secrets
- .env files in .gitignore
- Secrets are sufficiently random (not 'changeme', 'test123')

## Task Execution

1. **Scan Code for process.env Usage**
   ```bash
   grep -rh "process\.env\.[A-Z_]*" backend/src --no-filename | \
   grep -oE "process\.env\.[A-Z_]+" | \
   sed 's/process\.env\.//' | \
   sort -u
   ```

2. **Extract Variables from .env**
   ```bash
   grep -E "^[A-Z_]+=" backend/.env | cut -d= -f1 | sort
   ```

3. **Compare Lists**
   - Variables in code but not in .env = Missing config
   - Variables in .env but not in code = Unused (cleanup opportunity)

4. **Check .env.example**
   ```bash
   diff <(grep -E "^[A-Z_]+=" backend/.env | cut -d= -f1 | sort) \
        <(grep -E "^[A-Z_]+=" backend/.env.example | cut -d= -f1 | sort)
   ```

5. **Validate Required Variables**
   ```bash
   # Source .env and check required vars are non-empty
   source backend/.env
   [ -z "$JWT_SECRET" ] && echo "ERROR: JWT_SECRET not set"
   ```

6. **Check Docker Environment**
   ```bash
   # Verify docker-compose.yml references match .env
   grep -oE '\$\{[A-Z_]+\}' docker-compose.yml | \
   sed 's/[${}\r]//g' | sort -u
   ```

## Example Output

```
🔧 ENVIRONMENT VARIABLE VALIDATION

BACKEND CODE SCAN:
Found 42 environment variables in use

✅ All code variables documented in .env
⚠️  3 variables in .env not used in code (cleanup opportunity):
   - OLD_API_KEY
   - DEPRECATED_FEATURE_FLAG
   - UNUSED_SECRET

DOCUMENTATION CHECK:
✅ .env.example up-to-date
❌ .env.example contains real secret:
   - RESEND_API_KEY=re_bSc853Yb... (should be: your_resend_api_key_here)

DOCKER ENVIRONMENT:
⚠️  CSRF_SECRET in docker-compose.yml but not in root .env
✅ All other Docker variables properly configured

REQUIRED VARIABLES:
✅ NODE_ENV=development
✅ PORT=5001
✅ MONGODB_URI set
✅ JWT_SECRET set (64 chars)
❌ SESSION_SECRET too short (32 chars, recommend 64+)
✅ AXIOM_TOKEN set

FORMAT VALIDATION:
✅ MongoDB URI format valid
✅ PORT is numeric (5001)
⚠️  CORS_ORIGIN=http://localhost:3000 (consider HTTPS in prod)

RECOMMENDATION:
1. Remove real secret from .env.example
2. Add CSRF_SECRET to root .env
3. Regenerate SESSION_SECRET with 64+ characters
4. Clean up unused variables: OLD_API_KEY, DEPRECATED_FEATURE_FLAG, UNUSED_SECRET
```

## Fix Commands Generated

```bash
# Fix SESSION_SECRET length
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))" >> backend/.env

# Add CSRF_SECRET to root .env
echo "CSRF_SECRET=\${CSRF_SECRET}" >> .env

# Clean up unused variables
sed -i '' '/^OLD_API_KEY=/d' backend/.env
sed -i '' '/^DEPRECATED_FEATURE_FLAG=/d' backend/.env
```

## Exit Codes
- 0: All validations passed
- 1: Warnings only (safe to proceed)
- 2: Critical issues (missing required vars, security issues)
