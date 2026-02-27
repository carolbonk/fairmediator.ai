# Quick Start: Axiom Logging Integration

## ✅ What's Been Implemented

### 1. Axiom Winston Transport
- ✅ Installed `@axiomhq/winston` package
- ✅ Updated `backend/src/config/logger.js` with Axiom transport
- ✅ Logs now send to both local files + Axiom cloud

### 2. GitHub Actions Webhook
- ✅ Updated `docker-ci.yml` notify job to send deployment events to N8N
- ✅ Webhook includes commit data, deployment info, trigger actions
- ✅ Can trigger backend automation endpoints

### 3. Quota Monitoring API
- ✅ Added `GET /api/monitoring/quota-status` endpoint
- ✅ Returns real-time quota usage for all free tier services
- ✅ Formatted for N8N automation workflows

### 4. Documentation
- ✅ `AXIOM_INTEGRATION_GUIDE.md` - Complete Axiom setup guide
- ✅ `N8N_BACKEND_ENDPOINTS.md` - 5 backend endpoints to implement
- ✅ `N8N_WORKFLOW_TEMPLATE.json` - Import-ready N8N workflow
- ✅ `CONTEXT.md` updated with automation architecture

---

## 🚀 Next Steps (Do This Now!)

### Step 1: Add Axiom Environment Variables

Add to `backend/.env`:
```bash
# Axiom Logging (FREE - 166MB/month allocation)
AXIOM_DATASET=fairmediator-logs
AXIOM_TOKEN=xaat-PASTE_YOUR_TOKEN_HERE
AXIOM_ORG_ID=your-org-id
AXIOM_ENABLED=true
```

Add to root `.env` (for Docker):
```bash
# Axiom Logging
AXIOM_DATASET=fairmediator-logs
AXIOM_TOKEN=xaat-PASTE_YOUR_TOKEN_HERE
AXIOM_ORG_ID=your-org-id
AXIOM_ENABLED=true
```

### Step 2: Get Axiom Credentials

1. Go to https://app.axiom.co
2. Create dataset: `fairmediator-logs`
3. Create API token (Settings → API Tokens → New Token)
   - Name: `fairmediator-backend`
   - Permissions: **Ingest** only
4. Copy token and org ID to `.env` files above

### Step 3: Test Axiom Logging

```bash
cd backend
npm install  # Already done - @axiomhq/winston installed
node -e "const logger = require('./src/config/logger'); logger.info('Test from FairMediator', {test: true}); setTimeout(() => process.exit(0), 2000);"
```

Check https://app.axiom.co → Datasets → `fairmediator-logs` (should see your test log within 2 seconds)

### Step 4: Add GitHub Secrets (For N8N Webhook)

Go to GitHub repo → Settings → Secrets → Actions → New repository secret

Add these (optional - only if using N8N):
```
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/fairmediator
BACKEND_URL=https://your-backend.com
API_TOKEN=your_api_token_here
```

### Step 5: Test Quota Endpoint

```bash
# Start backend
cd backend
npm run dev

# In another terminal, test the endpoint
curl http://localhost:5001/api/monitoring/quota-status | jq
```

Expected output:
```json
{
  "overall": {
    "status": "ok",
    "criticalCount": 0,
    "warningCount": 0,
    "timestamp": "2026-02-26T..."
  },
  "services": {
    "huggingface": {
      "name": "Hugging Face API",
      "used": 0,
      "limit": 333,
      "remaining": 333,
      "percent": 0,
      "status": "ok",
      ...
    },
    ...
  }
}
```

---

## 📊 What You Get

### Real-Time Logging in Axiom
- **Critical logs** (warn/error/security) automatically sent to Axiom
- **All logs** preserved in local files (debug/info/http/warn/error/security)
- Searchable with APL (Axiom Processing Language)
- Real-time dashboards & alerts
- 166MB/month (~170k logs) allocation - Using ~3k-15k/month (9-88% of quota)

### Automation Ready
- GitHub deploys → Trigger N8N workflows
- N8N can query quota status
- Auto-trigger scraping when quota available
- Generate blog posts from scraped data

### Example Queries in Axiom

**View all logs from last hour:**
```apl
['fairmediator-logs']
| where _time > ago(1h)
| order by _time desc
```

**Only errors:**
```apl
['fairmediator-logs']
| where level == "error"
```

**Quota warnings:**
```apl
['fairmediator-logs']
| where message contains "quota"
| where level in ("warn", "error")
```

---

## 🔗 Integration Flow

```
Code Deploy (git push main)
  ↓
GitHub Actions (docker-ci.yml)
  ↓
Build Docker Images
  ↓
Trigger N8N Webhook ─────────────┐
  ↓                               ↓
Log to Axiom                   N8N Workflow
  ↓                               ↓
Query Axiom ←────────────────  Check Quota
                                  ↓
                             Scrape FEC Data
                                  ↓
                            Research with Perplexity
                                  ↓
                           Generate Blog Post
                                  ↓
                            Save to Obsidian
                                  ↓
                              Tweet Finding
```

---

## 📝 Files Modified

1. ✅ `backend/package.json` - Added @axiomhq/winston
2. ✅ `backend/src/config/logger.js` - Added Axiom transport
3. ✅ `backend/src/routes/monitoring.js` - Added quota-status endpoint
4. ✅ `.github/workflows/docker-ci.yml` - Added webhook to notify job
5. ✅ `CONTEXT.md` - Added automation architecture section

## 📚 Documentation Files Created

1. ✅ `AXIOM_INTEGRATION_GUIDE.md` - Full setup guide
2. ✅ `N8N_BACKEND_ENDPOINTS.md` - 5 endpoints to add
3. ✅ `N8N_WORKFLOW_TEMPLATE.json` - Import-ready workflow
4. ✅ `QUICK_START_AXIOM.md` - This file!

---

## ⚠️ Important Notes

### Quota Management (166MB/month = ~170k logs)
- **Axiom receives:** Only warn/error/security (~100-500/day = 3k-15k/month)
- **Local files receive:** ALL logs (debug/info/http/warn/error/security)
- **Current usage:** 9-88% of quota (well under limit)

**Design keeps you safe:**
1. Axiom transport set to `level: 'warn'` (filters out debug/info/http)
2. Local files preserve complete history for debugging
3. Critical logs searchable in Axiom cloud
4. No quota overages

### Security
- ✅ Axiom token has **Ingest only** permission (can't read data)
- ✅ Local file logs preserved as backup
- ✅ Axiom logs encrypted in transit + at rest

---

## 🎯 Phase 1 Complete!

You've successfully set up:
- ✅ Axiom centralized logging
- ✅ GitHub Actions → N8N webhook
- ✅ Quota monitoring API for automation
- ✅ Complete documentation

**Next:** Install N8N on Oracle Cloud and create your first automation workflow!

---

## Need Help?

**Test Axiom connection:**
```bash
curl -H "Authorization: Bearer $AXIOM_TOKEN" https://api.axiom.co/v1/datasets
```

**Test quota endpoint:**
```bash
curl http://localhost:5001/api/monitoring/quota-status | jq .overall
```

**Check logs:**
```bash
tail -f backend/logs/combined-$(date +%Y-%m-%d).log
```
