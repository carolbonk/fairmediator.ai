# FairMediator Deployment Guide

> **Production deployment guide - 100% Free Tier**

**Last Updated:** January 13, 2026

---

## 📑 Quick Navigation

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Production Deployment](#production-deployment)
- [Environment Configuration](#environment-configuration)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Current Stack (100% FREE)

```
Frontend (Netlify Static Hosting)
    ↓
Backend (Node.js/Express - Netlify Functions or standalone)
    ↓
├─→ MongoDB Atlas M0 (Database + Vector Search)
├─→ Netlify Blobs (File Storage - images, documents)
├─→ HuggingFace API (AI/ML inference)
└─→ Resend Email (Optional notifications)
```

**Monthly Cost:** $0

**Free Tier Limits:**
- MongoDB Atlas: 512MB storage
- Netlify: 100GB bandwidth
- Netlify Blobs: 100GB bandwidth
- HuggingFace: Rate limited (monitored)
- Resend: 100 emails/day

---

## Prerequisites

### Required Accounts (All Free)

1. **MongoDB Atlas** - Database + Vector Search
   - Sign up: https://mongodb.com/cloud/atlas
   - Free tier: M0 (512MB)
   - No credit card required

2. **HuggingFace** - AI/ML API
   - Sign up: https://huggingface.co/join
   - Free tier: Rate limited
   - Get API key: https://huggingface.co/settings/tokens

3. **Netlify** - Frontend + Functions + Storage
   - Sign up: https://netlify.com
   - Free tier: 100GB bandwidth/month
   - No credit card required

4. **GitHub** - Code repository
   - Already have it

### Optional Services

5. **Resend** - Email notifications
   - Sign up: https://resend.com
   - Free tier: 100 emails/day
   - No credit card required

---

## Production Deployment

### Step 1: Setup MongoDB Atlas (5 minutes)

**Create Free Cluster:**

1. Go to https://cloud.mongodb.com
2. Click "Build a Database" → Choose "FREE" (M0 Sandbox)
3. Configure cluster:
   - **Provider:** AWS
   - **Region:** us-west-2 (Oregon) or closest to users
   - **Cluster Name:** `FairMediator`

**Create Database User:**

1. Go to "Database Access" → "Add New Database User"
2. Authentication: Username and Password
   - Username: `fairmediator`
   - Password: Auto-generate (save it!)
3. Database User Privileges: "Read and write to any database"

**Configure Network Access:**

1. Go to "Network Access" → "Add IP Address"
2. Select "Allow access from anywhere" (0.0.0.0/0)
3. This is safe - you still need username/password to connect

**Get Connection String:**

1. Click "Connect" → "Connect your application"
2. Driver: Node.js
3. Copy connection string:
   ```
   mongodb+srv://fairmediator:<password>@cluster.mongodb.net/fairmediator?retryWrites=true&w=majority
   ```
4. Replace `<password>` with your actual password
5. Save this - you'll need it in Step 3

**Create Vector Search Index (for semantic search):**

1. Go to "Browse Collections" → Select `fairmediator` database → `mediators` collection
2. Click "Atlas Search" tab → "Create Search Index"
3. Choose "JSON Editor"
4. Index name: `mediator_vector_search`
5. Paste this definition:
   ```json
   {
     "fields": [
       {
         "type": "vector",
         "path": "embedding",
         "numDimensions": 384,
         "similarity": "cosine"
       }
     ]
   }
   ```
6. Click "Create Search Index"
7. Wait 1-2 minutes for index to become "Active"

---

### Step 2: Setup Netlify Blobs Storage (2 minutes)

**Get Credentials:**

1. Go to https://netlify.com → Your site dashboard
2. Go to "Site configuration" → "Environment variables"
3. Note your Site ID (shown in site details)
4. Create Personal Access Token:
   - Go to User settings → Applications → New access token
   - Name: `fairmediator-production`
   - Copy token (save it!)

**Save these for Step 3:**
- `NETLIFY_SITE_ID`: Your site ID
- `NETLIFY_TOKEN`: Your personal access token

---

### Step 3: Deploy to Netlify

**Option A: Automatic Deploy from GitHub (Recommended)**

1. **Connect Repository:**
   - Go to https://netlify.com
   - Click "Add new site" → "Import from GitHub"
   - Select your FairMediator repository
   - Authorize Netlify to access your repo

2. **Configure Build Settings:**
   ```
   Base directory: (leave empty)
   Build command: cd frontend && npm install && npm run build
   Publish directory: frontend/dist
   ```

3. **Add Environment Variables:**

   Go to Site settings → Environment variables → Add variables

   **Required:**
   ```bash
   # Node Environment
   NODE_ENV=production

   # MongoDB Atlas (from Step 1)
   MONGODB_URI=mongodb+srv://fairmediator:PASSWORD@cluster.mongodb.net/fairmediator

   # HuggingFace API
   HUGGINGFACE_API_KEY=hf_your_key_here

   # Security Secrets (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
   JWT_SECRET=your_64_char_hex_string_here
   JWT_REFRESH_SECRET=your_64_char_hex_string_here
   SESSION_SECRET=your_64_char_hex_string_here

   # CORS Configuration
   CORS_ORIGIN=https://your-site-name.netlify.app
   FRONTEND_URL=https://your-site-name.netlify.app

   # Netlify Blobs (from Step 2)
   NETLIFY_SITE_ID=your_site_id_here
   NETLIFY_TOKEN=your_netlify_token_here
   ```

   **Optional:**
   ```bash
   # Resend Email Service
   RESEND_API_KEY=re_your_key_here
   EMAIL_FROM=FairMediator <noreply@yourdomain.com>

   # Free Tier Limits (optional - uses defaults if not set)
   HUGGINGFACE_DAILY_LIMIT=900
   HUGGINGFACE_MONTHLY_LIMIT=30000
   RESEND_DAILY_LIMIT=90
   RESEND_MONTHLY_LIMIT=3000
   MONGODB_SIZE_LIMIT=536870912
   ```

4. **Deploy:**
   - Click "Deploy site"
   - Netlify builds and deploys automatically
   - Get your URL: `https://your-site-name.netlify.app`

5. **Update CORS_ORIGIN:**
   - Go back to Environment variables
   - Update `CORS_ORIGIN` and `FRONTEND_URL` with your actual Netlify URL
   - Trigger redeploy

**Option B: Manual Deploy with Netlify CLI**

```bash
# Install Netlify CLI (one-time)
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize site (one-time)
netlify init

# Deploy
netlify deploy --prod
```

---

### Step 4: Seed Database (Optional)

**Add mediators to database:**

```bash
# Option A: Use scraping routes (admin only)
# POST /api/scraping/mediators - scrape from sources

# Option B: Manual seed script
cd backend
node src/scripts/seed-data.js
```

**Generate embeddings for vector search:**

```bash
cd backend
node src/scripts/initializeVectorDB.js
```

This generates 384-dimensional embeddings for all mediators using HuggingFace's `sentence-transformers/all-MiniLM-L6-v2` model.

---

### Step 5: Verify Deployment

**Test Backend Health:**

```bash
curl https://your-site-name.netlify.app/.netlify/functions/health

# Should return:
# {"status":"healthy","timestamp":"...","services":{"mongodb":"connected"}}
```

**Test Frontend:**

1. Visit: `https://your-site-name.netlify.app`
2. Try searching for mediators
3. Test chat functionality
4. Check monitoring dashboard

---

## Environment Configuration

### Required Variables

```bash
# Server
NODE_ENV=production
PORT=5001

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/fairmediator

# AI/ML
HUGGINGFACE_API_KEY=hf_your_key_here

# Security
JWT_SECRET=64_char_hex_string
JWT_REFRESH_SECRET=64_char_hex_string
SESSION_SECRET=64_char_hex_string

# CORS
CORS_ORIGIN=https://your-site.netlify.app
FRONTEND_URL=https://your-site.netlify.app

# Netlify Blobs Storage
NETLIFY_SITE_ID=your_site_id
NETLIFY_TOKEN=your_netlify_token
```

### Optional Variables

```bash
# Email Service
RESEND_API_KEY=re_your_key_here
EMAIL_FROM=FairMediator <noreply@yourdomain.com>

# Free Tier Monitoring
HUGGINGFACE_DAILY_LIMIT=900
HUGGINGFACE_MONTHLY_LIMIT=30000
RESEND_DAILY_LIMIT=90
RESEND_MONTHLY_LIMIT=3000
MONGODB_SIZE_LIMIT=536870912

# Monitoring Thresholds
FREE_TIER_WARNING_THRESHOLD=0.70
FREE_TIER_ALERT_THRESHOLD=0.85
FREE_TIER_CRITICAL_THRESHOLD=0.95
FREE_TIER_STOP_THRESHOLD=1.0
```

### Generate Secrets

```bash
# Generate JWT and session secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Run this 3 times to generate all three secrets.

---

## Local Development with Docker

### Docker Compose (Development Only)

```bash
# Start MongoDB locally
docker-compose -f docker-compose.dev.yml up -d

# Stop services
docker-compose -f docker-compose.dev.yml down

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

### Local Environment Variables

**backend/.env:**

```bash
NODE_ENV=development
PORT=5001
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Local MongoDB (Docker)
MONGODB_URI=mongodb://localhost:27017/fairmediator

# Or MongoDB Atlas (cloud)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/fairmediator

# HuggingFace API (required)
HUGGINGFACE_API_KEY=hf_your_key_here

# Security (development)
JWT_SECRET=dev_secret_key
JWT_REFRESH_SECRET=dev_refresh_secret
SESSION_SECRET=dev_session_secret

# Netlify Blobs (optional in dev)
NETLIFY_SITE_ID=your_site_id
NETLIFY_TOKEN=your_token
```

---

## Troubleshooting

### MongoDB Connection Issues

**Error: "MongoServerError: bad auth"**
- Check username and password in MONGODB_URI
- Ensure password is URL-encoded (use %40 for @, %23 for #, etc.)
- Verify database user has correct permissions

**Error: "MongoTimeoutError: Could not connect"**
- Check network access in MongoDB Atlas (0.0.0.0/0 whitelisted)
- Verify connection string is correct
- Check if MongoDB cluster is running

### Netlify Deployment Issues

**Build fails with "MODULE_NOT_FOUND"**
- Check package.json has all dependencies
- Verify build command includes `npm install`
- Check Node version compatibility (use Node 18+)

**Environment variables not working**
- Verify no typos in variable names (case-sensitive)
- Don't use quotes in Netlify dashboard
- Redeploy after adding new variables

**Functions timeout**
- Netlify Functions have 10-second timeout on free tier
- For long operations, consider background jobs or splitting into smaller chunks

### CORS Errors

**Error: "Access-Control-Allow-Origin"**

1. Check `CORS_ORIGIN` environment variable matches your frontend URL exactly
2. Include protocol (https://)
3. No trailing slash
4. Redeploy after changing

**Fix in backend/src/server.js:**

```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
```

### Vector Search Not Working

**Error: "Vector search index not found"**
- Verify index name is exactly `mediator_vector_search`
- Check index status is "Active" in MongoDB Atlas
- Wait 1-2 minutes after creating index

**No mediators in search results**
- Run embedding generation: `node src/scripts/initializeVectorDB.js`
- Check mediators have `embedding` field in database
- Verify HuggingFace API key is valid

### Storage Issues

**Error: "Netlify Blobs not configured"**
- Check `NETLIFY_SITE_ID` and `NETLIFY_TOKEN` are set
- Verify token has write permissions
- Ensure site is deployed to Netlify

**Error: "Failed to upload file"**
- Check file size (Netlify Blobs free tier: 100GB bandwidth)
- Verify file format is supported
- Check token hasn't expired

### Email Service Issues

**Error: "Email daily limit reached"**
- Free tier: 100 emails/day (monitored at 90/day)
- Emails are logged in dev mode if RESEND_API_KEY not configured
- Check monitoring dashboard for usage stats

### Free Tier Monitoring

**Check current usage:**

```bash
curl https://your-site.netlify.app/.netlify/functions/monitoring/free-tier

# Returns:
# {
#   "huggingface": { "current": 123, "limit": 900, "percentage": 14 },
#   "mongodb": { "size": "45MB", "limit": "512MB" },
#   "resend": { "current": 12, "limit": 90 }
# }
```

**Alerts:**
- 70% - Warning (logged)
- 85% - Alert (logged)
- 95% - Critical (logged)
- 100% - Stop (requests blocked)

---

## Production Checklist

**Before deploying:**

- [ ] All environment variables configured in Netlify
- [ ] MongoDB Atlas cluster created and accessible
- [ ] Vector search index created in MongoDB Atlas
- [ ] Security secrets generated (JWT, session)
- [ ] CORS_ORIGIN matches your domain
- [ ] Netlify Blobs configured (optional)
- [ ] Email service configured (optional)
- [ ] `.env` files NOT committed to git

**After deploying:**

- [ ] Test backend health endpoint
- [ ] Test frontend loads correctly
- [ ] Test mediator search
- [ ] Test chat functionality
- [ ] Verify SSL/HTTPS working
- [ ] Check monitoring dashboard
- [ ] Test email notifications (if configured)
- [ ] Monitor free tier usage

---

## Monitoring & Maintenance

### Check System Health

```bash
# Health check
curl https://your-site.netlify.app/.netlify/functions/health

# MongoDB stats
curl https://your-site.netlify.app/.netlify/functions/monitoring/mongodb

# Free tier usage
curl https://your-site.netlify.app/.netlify/functions/monitoring/free-tier

# Error logs (last 24 hours)
curl https://your-site.netlify.app/.netlify/functions/monitoring/mongodb/errors
```

### MongoDB Atlas Monitoring

1. Go to https://cloud.mongodb.com
2. Select your cluster
3. Click "Metrics" tab
4. Monitor:
   - Storage size (keep under 512MB)
   - Connections (M0 allows 100 concurrent)
   - Operations per second

### Netlify Monitoring

1. Go to Netlify dashboard
2. Click "Analytics" tab
3. Monitor:
   - Bandwidth usage (keep under 100GB/month)
   - Build minutes
   - Function invocations

---

## Cost Breakdown

| Service | Free Tier | Current Usage | Cost |
|---------|-----------|---------------|------|
| **MongoDB Atlas** | 512MB | ~50MB | $0 |
| **Netlify Hosting** | 100GB bandwidth | ~5GB | $0 |
| **Netlify Blobs** | 100GB bandwidth | ~1GB | $0 |
| **HuggingFace API** | Rate limited | Monitored | $0 |
| **Resend Email** | 100/day | Optional | $0 |

**Total:** $0/month 🎉

---

## Upgrade Options (If Needed)

### When to Upgrade

**MongoDB Atlas:**
- Upgrade to M2 ($9/month) if you need >512MB storage

**Netlify:**
- Upgrade to Pro ($19/month) for >100GB bandwidth
- Get priority builds and advanced analytics

**HuggingFace:**
- Use OpenRouter API if hitting rate limits
- Track usage with monitoring dashboard

---

**For complete setup instructions, see:** [SETUP.md](./SETUP.md)

**For MongoDB vector search setup, see:** [MONGODB_VECTOR_SEARCH_SETUP.md](./MONGODB_VECTOR_SEARCH_SETUP.md)
