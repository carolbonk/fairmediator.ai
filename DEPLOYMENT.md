# FairMediator Deployment Guide

> **Master deployment guide with BOTH serverless and traditional options**

**Last Updated:** January 3, 2026

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
- **Cost:** $0/month
- **Best for:** Full-featured apps with cron jobs, no timeout limits

### Deployment Steps

**Step 1: Deploy Backend to Render**

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   ```
   Name: fairmediator-backend
   Root Directory: backend
   Build Command: npm install
   Start Command: npm start
   ```
5. Add environment variables:
   ```
   HUGGINGFACE_API_KEY=your_key_here
   MONGODB_URI=mongodb+srv://...
   REDIS_ENABLED=true
   REDIS_URL=your_upstash_redis_url
   NODE_ENV=production
   ```
6. Click "Create Web Service"
7. Copy the service URL (e.g., `https://fairmediator-backend.onrender.com`)

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
