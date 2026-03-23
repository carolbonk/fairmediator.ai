# API Documentation Sync

## Purpose
Keep API documentation synchronized with actual backend endpoints. Prevent documentation drift and ensure N8N workflows, frontend code, and API docs stay current.

## When to Use
- After adding new API routes
- After modifying existing endpoints (params, responses)
- Before creating PRs with API changes
- During code reviews
- Before updating N8N workflows

## Documentation Files to Sync

1. **N8N_BACKEND_ENDPOINTS.md** - N8N automation integration guide
2. **README.md** (API section) - Developer documentation
3. **OpenAPI/Swagger spec** (if exists)
4. Route comments in code

## Task Execution

### 1. Scan Backend Routes
Search for all Express route definitions:
```bash
# Find all route definitions
grep -rE "router\.(get|post|put|patch|delete)\(" backend/src/routes/ --include="*.js"

# Extract endpoints
grep -rE "router\.(get|post|put|patch|delete)\(['\"]" backend/src/routes/ -h | \
grep -oE "(get|post|put|patch|delete)\(['\"][^'\"]+['\"]" | \
sed "s/['\"]//g"
```

### 2. Extract Current Endpoints
Parse route files to get:
- HTTP method (GET, POST, PUT, DELETE)
- Path (/api/mediators, /api/auth/login)
- Middleware (auth, validate, rateLimit)
- Expected parameters (req.body, req.query, req.params)
- Response format

### 3. Parse N8N_BACKEND_ENDPOINTS.md
Extract documented endpoints:
```bash
grep -E "^(GET|POST|PUT|DELETE|PATCH)" N8N_BACKEND_ENDPOINTS.md
```

### 4. Compare and Report Differences

**Undocumented Endpoints** (in code but not docs):
- Flag as "Missing Documentation"
- Generate documentation template

**Deprecated Endpoints** (in docs but not code):
- Flag as "Possibly Removed"
- Verify if intentionally removed or renamed

**Signature Changes** (different params/responses):
- Compare parameters
- Flag breaking changes

### 5. Generate Documentation Template

For undocumented endpoints, create template:
```markdown
### POST /api/new-endpoint
**Purpose**: [Description needed]
**Authentication**: Required/Not Required
**Rate Limit**: [X requests/minute]

**Request Body**:
```json
{
  "param1": "string",
  "param2": "number"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {}
}
```

**Errors**:
- 400: Bad Request
- 401: Unauthorized
- 500: Server Error
```

## Example Output

```
📚 API DOCUMENTATION SYNC

SCANNING ROUTES...
Found 47 endpoints in backend/src/routes/

DOCUMENTED ENDPOINTS:
Found 42 endpoints in N8N_BACKEND_ENDPOINTS.md

ANALYSIS:

✅ 40 endpoints properly documented

❌ UNDOCUMENTED ENDPOINTS (5):
1. GET /api/monitoring/quota-status
   File: backend/src/routes/monitoring.js:15
   Missing from: N8N_BACKEND_ENDPOINTS.md
   
2. POST /api/mediators/bulk-update
   File: backend/src/routes/mediators.js:127
   Missing from: N8N_BACKEND_ENDPOINTS.md
   
3. DELETE /api/users/:id/sessions
   File: backend/src/routes/auth.js:89
   Missing from: N8N_BACKEND_ENDPOINTS.md

⚠️  POSSIBLY REMOVED (2):
1. GET /api/legacy/stats
   Documented in N8N_BACKEND_ENDPOINTS.md but not found in code
   Last seen: Removed in commit 61f7a05
   
2. POST /api/webhooks/fec
   Documented but route file not found

🔄 SIGNATURE CHANGES (1):
1. POST /api/auth/register
   - Added field: acceptedTerms (boolean, required)
   - Documentation needs update

RECOMMENDATIONS:
1. Add documentation for 5 new endpoints
2. Remove documentation for 2 legacy endpoints
3. Update signature for /api/auth/register

GENERATE TEMPLATES?
Run with --generate flag to create documentation templates
```

## Auto-Fix Option

```bash
# Generate documentation templates for missing endpoints
# Append to N8N_BACKEND_ENDPOINTS.md
```

## Integration with Pre-Flight

Add to /pre-flight command:
```markdown
6. Check API documentation sync
   - Run api-doc-sync skill
   - Warn if undocumented endpoints found
   - Suggest adding docs before commit
```

## Exit Codes
- 0: Documentation in sync
- 1: Minor differences (warnings only)
- 2: Major differences (new endpoints, breaking changes)
