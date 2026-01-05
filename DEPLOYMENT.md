# FairMediator Deployment Guide

> **Master deployment guide with BOTH serverless and traditional options**

**Last Updated:** January 4, 2026

---

## 📑 Quick Navigation

- [Deployment Options Comparison](#deployment-options-comparison)
- [Option 1: Serverless (Netlify Functions)](#option-1-serverless-netlify-functions)
- [Option 2: Traditional (Render + Netlify)](#option-2-traditional-render--netlify)
- [Troubleshooting](#troubleshooting)

---

## Deployment Options Comparison

| Feature | Option 1: Serverless | Option 2: Traditional |
|---------|---------------------|----------------------|
| **Frontend** | Netlify | Netlify |
| **Backend** | Netlify Functions | Render Web Service |
| **Database** | MongoDB Atlas | MongoDB Atlas |
| **Cost** | $0/month | $0/month |
| **Timeout** | 10 seconds | No limit |
| **Cron Jobs** | ❌ No | ✅ Yes |
| **Cold Starts** | ✅ None | ⚠️ After 15 min |
| **Redis Cache** | ❌ Limited | ✅ Full support |
| **Best For** | Simple apps | Full-featured apps |

---

## Option 1: Serverless (Netlify Functions)

### Overview
- **Frontend + Backend:** Netlify Functions (serverless)
- **Database:** MongoDB Atlas (free M0)
- **Cost:** $0/month, 125k requests/month
- **Best for:** Simple apps, quick deployment, no maintenance

### Quick Deploy (3 minutes)

```bash
# 1. Push to GitHub
git push origin main

# 2. Connect to Netlify (one-time)
# Go to netlify.com → "Add new site" → Import from GitHub

# 3. Add environment variable
# Netlify Dashboard → Environment variables
# Add: HUGGINGFACE_API_KEY

# 4. Auto-deploys on every push!
```

### What Gets Deployed

**Netlify Functions:**
- `/.netlify/functions/chat` - AI chat endpoint
- `/.netlify/functions/check-affiliations` - Conflict detection

**Netlify Forms:**
- Feedback system at `/feedback`

**Auto Features:**
- ✅ Free HTTPS via Let's Encrypt
- ✅ Global CDN - Fast worldwide delivery
- ✅ Automatic builds on git push
- ✅ Preview deploys for pull requests

### Environment Variables Needed

```bash
# In Netlify Dashboard → Site settings → Environment variables
HUGGINGFACE_API_KEY=your_key_here
MONGODB_URI=mongodb+srv://...
```

### Limitations

- ⚠️ **10 second timeout** - Long-running operations will fail
- ⚠️ **No cron jobs** - Can't schedule automated tasks
- ⚠️ **125k requests/month** - Free tier limit
- ⚠️ **Limited Redis** - Can use but not recommended

### When to Use

✅ Use Serverless if:
- You have simple, fast operations
- You don't need scheduled tasks
- You want zero maintenance
- Your app handles <125k requests/month

❌ Don't use if:
- You need cron jobs
- Operations take >10 seconds
- You need full Redis caching
- You have complex AI workflows

---

## Option 2: Traditional (Render + Netlify)

### Overview
- **Frontend:** Netlify (static hosting)
- **Backend:** Render (free tier with sleep)
- **Database:** MongoDB Atlas (free M0)
- **Cron Jobs:** Automated via Render (daily/weekly scraping, free tier reset)
- **Cost:** $0/month
- **Best for:** Full-featured apps with cron jobs, no timeout limits

### Prerequisites

You'll need free accounts for:
1. ✅ **GitHub** - Already have it
2. ✅ **Netlify** - Already configured
3. 🆕 **Render** - Sign up at https://render.com
4. 🆕 **MongoDB Atlas** - Sign up at https://mongodb.com/cloud/atlas
5. 🆕 **Upstash Redis** - Sign up at https://upstash.com
6. 🆕 **Hugging Face** - Sign up at https://huggingface.co
7. 🆕 **Weaviate Cloud** - Sign up at https://console.weaviate.cloud

### Deployment Steps

**Step 1: Deploy Backend to Render**

> **Note:** The project includes `backend/render.yaml` which automatically configures the web service AND cron jobs.

1. Go to https://render.com
2. Sign up with GitHub (easiest - auto-connects repositories)
3. From Dashboard, click "New +" → "Web Service"
4. Connect your GitHub repository: `FairMediator`
5. Render will detect `render.yaml` and offer to create ALL services:
   - ✅ `fairmediator-backend` (web service)
   - ✅ `fairmediator-scraping-daily` (cron - 2 AM daily)
   - ✅ `fairmediator-scraping-weekly` (cron - 3 AM Sunday)
   - ✅ `fairmediator-tier-reset` (cron - midnight daily)
6. Click "Create Services" - Render creates everything automatically!

**Step 2: Configure Environment Variables**

After services are created, add environment variables to the web service:

1. Go to `fairmediator-backend` service
2. Click "Environment" tab
3. Add these variables:

**Required Environment Variables:**
```bash
# Server Configuration
NODE_ENV=production
PORT=5001
CORS_ORIGIN=https://fairmediator.netlify.app
FRONTEND_URL=https://fairmediator.netlify.app

# Security Secrets (generate secure 64-byte hex strings)
JWT_SECRET=fd571a8bdc0635476b8b4231e7baa90c13c33f009bcb139562fc792cf75960c070823e0786601a9b68933963d6a43c4a43204199c6bd73030df74cefcf9521a9
JWT_REFRESH_SECRET=57bdab8d99ac0d35655403b0468ae1652257af2f24a27db10aed43f2d3fd367b32b8ff47919926b03b6f3e5aa62ab60e9666674c737e5cdc04e9a15c79066993
SESSION_SECRET=ae93a520421fc102a0448cd35e690976f9dd3a6f6099b2d04428721bceaf9284ed3be532404e6f50673e070ed9aedd5e0d04e277024a64cbbec95bf1e2ab24e8

# MongoDB Atlas (from Step 3)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fairmediator

# Redis Cache (from Step 4)
REDIS_ENABLED=true
REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_ENDPOINT.upstash.io:6379

# Hugging Face API (from Step 5)
HUGGINGFACE_API_KEY=hf_YOUR_API_KEY_HERE

# Weaviate Vector DB (from Step 6)
WEAVIATE_ENABLED=true
WEAVIATE_URL=fairmediator-xxxxx.weaviate.network
WEAVIATE_API_KEY=YOUR_WEAVIATE_API_KEY
```

**Optional Services:**
```bash
# Sentry Error Tracking
SENTRY_DSN=https://your-sentry-dsn.ingest.sentry.io

# Stripe Payment Processing
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend Email Service
RESEND_API_KEY=re_...
```

**Step 3: Setup MongoDB Atlas (FREE)**

1. Go to https://mongodb.com/cloud/atlas
2. Create account (no credit card required)
3. Click "Build a Database" → Choose "FREE" tier (M0 Sandbox)
4. Configure cluster:
   - Provider: **AWS**
   - Region: **us-west-2 (Oregon)** - same region as Render
   - Cluster Name: `FairMediator`
5. Create database user:
   - Username: `fairmediator`
   - Password: Generate secure password (save it!)
6. Network Access:
   - Click "Network Access" → "Add IP Address"
   - Select "Allow access from anywhere" (0.0.0.0/0)
   - This is safe because you still need username/password
7. Get connection string:
   - Click "Connect" → "Connect your application"
   - Copy connection string:
     ```
     mongodb+srv://fairmediator:PASSWORD@cluster.mongodb.net/fairmediator
     ```
   - Replace `PASSWORD` with your actual password
8. Add `MONGODB_URI` to Render environment variables

**Step 4: Setup Upstash Redis (FREE)**

1. Go to https://upstash.com
2. Sign up (no credit card required)
3. Create database:
   - Name: `fairmediator-cache`
   - Type: **Regional**
   - Region: **us-west-1** (closest to Render Oregon)
4. Copy Redis URL from database details:
   ```
   redis://default:YOUR_PASSWORD@YOUR_ENDPOINT.upstash.io:6379
   ```
5. Add to Render:
   - `REDIS_ENABLED`: `true`
   - `REDIS_URL`: (from step 4)

**Step 5: Setup Hugging Face API (FREE)**

1. Go to https://huggingface.co
2. Sign up (no credit card required)
3. Go to Settings → Access Tokens
4. Create new token:
   - Name: `fairmediator-production`
   - Type: **Read**
5. Copy token (starts with `hf_`)
6. Add `HUGGINGFACE_API_KEY` to Render

**Step 6: Setup Weaviate Cloud (FREE)**

1. Go to https://console.weaviate.cloud
2. Sign up (no credit card required)
3. Create sandbox cluster:
   - Name: `fairmediator`
   - Sandbox duration: 14 days (auto-converts to free persistent)
4. Get credentials:
   - URL: `fairmediator-xxxxx.weaviate.network`
   - Click "Generate API Key"
5. Add to Render:
   - `WEAVIATE_ENABLED`: `true`
   - `WEAVIATE_URL`: (from step 4)
   - `WEAVIATE_API_KEY`: (from step 4)

7. Your backend is now live at: `https://fairmediator-backend.onrender.com`

**Step 2: Deploy Frontend to Netlify**

1. Go to https://netlify.com
2. Click "Add new site" → "Import from GitHub"
3. Select your repository
4. Configure:
   ```
   Base directory: frontend
   Build command: npm run build
   Publish directory: frontend/build
   ```
5. Add environment variable:
   ```
   REACT_APP_API_URL=https://fairmediator-backend.onrender.com
   ```
6. Click "Deploy site"

**Step 3: Configure MongoDB Atlas**

1. Go to https://cloud.mongodb.com
2. Create free M0 cluster
3. Add database user
4. Whitelist all IPs (0.0.0.0/0)
5. Copy connection string
6. Add to both Render and Netlify env vars

### Features Available

**Render Backend:**
- ✅ **No timeout limits** - Long-running AI operations work
- ✅ **Cron jobs** - Scheduled scraping and updates
- ✅ **Redis caching** - Full support for token optimization
- ✅ **All AI systems** - Agent, chain, memory systems available
- ⚠️ **Sleeps after 15 min** - First request after sleep takes ~30 seconds

**Netlify Frontend:**
- ✅ **Global CDN** - Fast worldwide
- ✅ **Auto SSL** - Free HTTPS
- ✅ **Preview deploys** - For pull requests
- ✅ **Forms** - Feedback collection

### Environment Variables Needed

**Render (Backend):**
```bash
HUGGINGFACE_API_KEY=your_key_here
MONGODB_URI=mongodb+srv://...
REDIS_ENABLED=true
REDIS_URL=redis://default:xxx@xxx.upstash.io:6379
REDIS_DAILY_LIMIT=9000
NODE_ENV=production
PORT=5001
```

**Netlify (Frontend):**
```bash
REACT_APP_API_URL=https://fairmediator-backend.onrender.com
```

### Free Tier Limits

| Service | Free Tier | What You Use |
|---------|-----------|--------------|
| **Render** | 750 hrs/mo | ~720 hrs (sleeps after 15 min) |
| **Netlify** | 100GB bandwidth | ~5GB typical |
| **MongoDB** | 512MB storage | ~50MB for 500 mediators |
| **Upstash Redis** | 10k commands/day | ~1k-5k with caching |

### When to Use

✅ Use Traditional if:
- You need cron jobs for auto-scraping
- You have operations >10 seconds
- You want full Redis caching (70-90% token savings)
- You need all AI features available

❌ Don't use if:
- You can't tolerate 30-second cold starts
- You want instant response times 24/7
- You prefer zero maintenance

---

## Troubleshooting

### Render sleeps too often
**Solution:** Upgrade to paid tier ($7/mo) or use external uptime monitor (free)
```bash
# Free uptime monitors:
# - UptimeRobot.com (5 min checks)
# - Freshping.io (1 min checks)
```

### Netlify Functions timeout
**Problem:** Operation takes >10 seconds
**Solution:** Switch to Option 2 (Render backend)

### Environment variables not working
**Check:**
1. Correct spelling (case-sensitive)
2. No quotes around values in Netlify/Render dashboards
3. Redeploy after adding new variables

### CORS errors
**Fix:** Add to `backend/src/server.js`:
```javascript
app.use(cors({
  origin: ['https://your-site.netlify.app', 'http://localhost:3000'],
  credentials: true
}));
```

### MongoDB connection fails
**Check:**
1. IP whitelist includes 0.0.0.0/0
2. Database user has read/write permissions
3. Connection string has correct password (URL-encoded)

### SSL / HTTPS not working
**Problem:** Domain works on HTTP but shows "Not Secure" (no HTTPS)
**Solution:**
1. Go to Netlify Dashboard > Site Settings > Domain Management > HTTPS
2. Click "Verify DNS configuration" or "Provision Certificate"
3. Wait for "Let's Encrypt Certificate" to appear (can take up to 24h after DNS changes)
4. Click "Force HTTPS" to redirect all traffic to secure version
**Cost:** Free (included with Netlify)

---

## Recommended Setup

**For most users:** Use **Option 2** (Render + Netlify)

**Why:**
- Full feature set (cron, Redis, no timeouts)
- 70-90% token savings with Redis caching
- Still 100% free
- Cold starts are acceptable tradeoff

**Only use Option 1 if:**
- You have very simple operations
- You don't need any scheduled tasks
- You want absolute zero maintenance

---

**For complete setup including Redis, Weaviate, and all services, see:** [SETUP.md](./SETUP.md)
