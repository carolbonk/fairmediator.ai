# FairMediator Setup Guide

> **Master setup guide - All configuration in one place**

**Last Updated:** January 2, 2026

---

## 📑 Quick Navigation

**Jump to Section:**
- [Quick Start (5 min)](#-quick-start-5-minutes) ⭐ **Start here**
- [Environment Setup](#-environment-setup)
- [Database Setup](#-database-setup-mongodb--vector-db)
- [Caching Setup (Redis)](#-redis-caching-setup-optional---token-optimization) 🎯 **Saves 70-90% tokens**
- [Vector Search (Weaviate)](#-weaviate-vector-search-setup-optional) 🚀 **Semantic search**
- [Development Tools](#-development-tools)
- [Deployment](#-deployment-options)
- [Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start (5 Minutes)

**Get running locally in 5 steps:**

```bash
# 1. Clone and install
git clone <your-repo-url>
cd FairMediator
npm install

# 2. Set up environment
cp backend/.env.example backend/.env
# Edit backend/.env - add your HUGGINGFACE_API_KEY (free from huggingface.co)

# 3. Start MongoDB (choose one):
# Option A: Docker
docker run -d -p 27017:27017 mongo

# Option B: MongoDB Atlas (free cloud)
# Get connection string from mongodb.com/cloud/atlas

# 4. Start the app
npm run dev

# 5. Open browser
# Frontend: http://localhost:3000
# Backend: http://localhost:5001
```

**Done!** The app is running. Continue below for advanced features.

---

## 🔧 Environment Setup

### Required Variables

**Minimum to run locally:**

```bash
# backend/.env

# Database (choose one)
MONGODB_URI=mongodb://localhost:27017/fairmediator
# OR
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/fairmediator

# AI (FREE - get from https://huggingface.co/settings/tokens)
HUGGINGFACE_API_KEY=hf_your_free_key_here

# Server
NODE_ENV=development
PORT=5001
CORS_ORIGIN=http://localhost:3000
```

### Optional Variables (Recommended)

**For token optimization (highly recommended):**

```bash
# Redis Caching (reduces AI calls by 70-90%)
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379
# OR use Upstash (free tier): redis://default:xxx@xxx.upstash.io:6379
REDIS_DAILY_LIMIT=9000

# Weaviate Vector Search (semantic mediator search)
WEAVIATE_ENABLED=true
WEAVIATE_URL=your-cluster.weaviate.network
WEAVIATE_API_KEY=your_key_here
WEAVIATE_SCHEME=https
```

### All Variables Reference

See `backend/.env.example` for complete list with comments.

---

## 🗄️ Database Setup (MongoDB + Vector DB)

### MongoDB (Required)

**Option 1: Local MongoDB**

```bash
# Mac
brew install mongodb-community
brew services start mongodb-community

# Linux
sudo apt-get install mongodb
sudo systemctl start mongod

# Docker
docker run -d -p 27017:27017 --name mongodb mongo
```

**Option 2: MongoDB Atlas (FREE - Recommended)**

1. Go to https://mongodb.com/cloud/atlas
2. Create free M0 cluster (512MB - plenty for this project)
3. Get connection string
4. Add to `.env`: `MONGODB_URI=mongodb+srv://...`

**Seed Data (Optional):**

```bash
make db-seed
# Or: cd backend && node src/scripts/seed-data.js
```

### Vector Database (Optional - Choose One)

**Option A: Weaviate Cloud (Recommended)**

See [Weaviate Setup](#-weaviate-vector-search-setup-optional) below

**Option B: ChromaDB (Local)**

```bash
# Docker
docker run -p 8000:8000 chromadb/chroma

# Add to .env
CHROMADB_URL=http://localhost:8000
```

---

## 🎯 Redis Caching Setup (Optional - Token Optimization)

**Purpose:** Reduce AI token usage by 70-90%

**Impact:**
- Without cache: 100 users = 500 AI calls
- With cache: 100 users = 50 AI calls (90% reduction!)

### Quick Setup

**Option 1: Upstash (FREE - Production Ready)**

1. **Sign up:** https://upstash.com (no credit card)
2. **Create database:**
   - Name: `fairmediator-cache`
   - Type: Regional
   - Region: Closest to you
3. **Get URL:** Click database → Copy Redis URL
4. **Add to `.env`:**
   ```bash
   REDIS_ENABLED=true
   REDIS_URL=redis://default:xxx@xxx.upstash.io:6379
   REDIS_DAILY_LIMIT=9000  # Stay within free tier (10k/day)
   ```
5. **Restart:** `npm run dev`

**Free Tier:** 10,000 commands/day = ~1,000 users/day

**Option 2: Local Redis (Development)**

```bash
# Install
brew install redis  # Mac
sudo apt-get install redis-server  # Linux

# Start
brew services start redis  # Mac
sudo systemctl start redis  # Linux

# Add to .env
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Verification

```bash
# Check cache is working
curl http://localhost:5001/api/cache/stats

# Should show:
# {
#   "enabled": true,
#   "connected": true,
#   "commandsUsedToday": 156,
#   "dailyLimit": 9000,
#   "percentUsed": "1.7%"
# }
```

### Detailed Guide

See [REDIS_SETUP.md](./REDIS_SETUP.md) for:
- Advanced configuration
- Monitoring usage
- Troubleshooting
- Performance metrics

---

## 🚀 Weaviate Vector Search Setup (Optional)

**Your Sandbox:** `fairmediator`
**Purpose:** Vector search for semantic mediator matching

### 📑 Weaviate Quick Links

**Jump to Weaviate Section:**
- [Quick Setup (5 min)](#weaviate-quick-setup-5-minutes) ⭐ Start here
- [What You Get (Free Tier)](#what-you-get-free-tier)
- [Makefile Commands](#weaviate-makefile-commands)
- [How It Works](#how-weaviate-works)
- [Free Vectorizer](#free-huggingface-vectorizer)
- [Monitoring Usage](#monitoring-weaviate-usage)
- [Integration](#weaviate-integration-with-your-app)
- [Troubleshooting](#weaviate-troubleshooting)

---

### Weaviate Quick Setup (5 minutes)

**Step 1: Get Your Credentials**

1. Go to https://console.weaviate.cloud
2. Find your **fairmediator** sandbox
3. Click "Details" to get:
   - **Cluster URL:** `fairmediator-xxxxx.weaviate.network`
   - **API Key:** `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

**Step 2: Configure Environment**

Add to `backend/.env`:

```bash
WEAVIATE_ENABLED=true
WEAVIATE_URL=fairmediator-xxxxx.weaviate.network
WEAVIATE_API_KEY=your_actual_api_key_here
WEAVIATE_SCHEME=https
```

**Step 3: Initialize Schema**

```bash
make weaviate-setup
```

This creates the "Mediator" class in Weaviate with proper fields.

**Step 4: Sync Your Data**

```bash
# Sync mediators from MongoDB to Weaviate
make weaviate-sync
```

**Step 5: Test It**

```bash
make weaviate-test
```

---

### What You Get (FREE TIER)

| Feature | Sandbox (14 days) | After 14 Days |
|---------|-------------------|---------------|
| **Storage** | Unlimited | Converts to free cluster |
| **Requests** | Unlimited | 100k vectors free |
| **Vectorizer** | Free HuggingFace model | Same |
| **Uptime** | 100% | 99.9% SLA |
| **Cost** | $0 | $0 (stays free!) |

**Note:** After 14 days, your sandbox auto-converts to a free persistent cluster. No action needed!

---

### Weaviate Makefile Commands

```bash
# Setup (run once)
make weaviate-setup    # Initialize schema

# Regular use
make weaviate-sync     # Sync mediators from MongoDB
make weaviate-test     # Test connection & search

# Maintenance
make weaviate-clear    # Delete all vectors
```

---

### How Weaviate Works

**Before Weaviate:**
```
User: "Find family law mediator in LA"
→ MongoDB text search: "family" in specializations
→ Returns: 5 exact matches only
```

**With Weaviate:**
```
User: "divorce attorney in Los Angeles"
→ Weaviate semantic search: understands divorce ≈ family law
→ Returns: 20 relevant mediators ranked by similarity
→ Includes: "family law", "custody", "domestic relations"
```

**Improvement:** 4x more relevant results!

---

### Free HuggingFace Vectorizer

Your Weaviate uses this **FREE** model:
- Model: `sentence-transformers/all-MiniLM-L6-v2`
- Speed: Fast (384-dimensional vectors)
- Quality: Excellent for English text
- Cost: $0 (no API key needed)

---

### Monitoring Weaviate Usage

Check your usage at: https://console.weaviate.cloud

Free tier limits (you won't hit these):
- ✅ 100,000 vectors
- ✅ 5M queries/month
- ✅ 256MB RAM

**For ~500 mediators:** Uses <1% of free tier

---

### Weaviate Integration with Your App

**Option A: Replace ChromaDB (Recommended)**

Edit `backend/src/services/ai/ragEngine.js`:

```javascript
// Before (ChromaDB):
const embeddingService = require('./embeddingService');
const results = await embeddingService.searchSimilar(query);

// After (Weaviate):
const weaviateClient = require('../../config/weaviate');
const results = await weaviateClient.searchMediators(query, {
  limit: 10,
  filters: { state: 'CA' }
});
```

**Option B: Use Both**

- Weaviate: Mediator search (persistent, managed)
- ChromaDB: Memory/conversations (local, temporary)

---

### Weaviate Troubleshooting

**"Connection refused"**
- Check WEAVIATE_URL has no `https://` prefix
- Format: `fairmediator-xxxxx.weaviate.network`

**"Unauthorized"**
- Verify WEAVIATE_API_KEY is correct
- Get new key from console.weaviate.cloud

**"Schema already exists"**
- This is OK! It means setup already ran
- Safe to run `make weaviate-setup` multiple times

**"No mediators found"**
- Run `make weaviate-sync` to add data
- Check MongoDB has mediators first

---

### What Was Created

**Files:**
- `backend/src/config/weaviate.js` - Client connection
- `backend/src/scripts/weaviate-setup.js` - Schema init
- `backend/src/scripts/weaviate-test.js` - Connection test
- `backend/src/scripts/weaviate-sync.js` - Data sync
- `backend/src/scripts/weaviate-clear.js` - Clear data

**Makefile commands:**
- `make weaviate-setup`
- `make weaviate-test`
- `make weaviate-sync`
- `make weaviate-clear`

---

### Weaviate Next Steps

1. **Get credentials** from console.weaviate.cloud
2. **Add to .env** (WEAVIATE_URL and WEAVIATE_API_KEY)
3. **Run:** `make weaviate-setup`
4. **Run:** `make weaviate-sync`
5. **Test:** `make weaviate-test`

**That's it! Your vector search is ready. 🚀**

---

## 🛠️ Development Tools

### Makefile Commands

**Daily Use:**
```bash
make dev              # Start full stack (frontend + backend)
make dev-backend      # Backend only
make dev-frontend     # Frontend only
make test             # Run all tests
make clean            # Clean node_modules
```

**Database:**
```bash
make db-seed          # Seed with test data
make db-reset         # Reset database
```

**Weaviate:**
```bash
make weaviate-setup   # Initialize
make weaviate-sync    # Sync data
make weaviate-test    # Test connection
```

**Code Quality:**
```bash
make lint             # Run linters
make lint-fix         # Fix linting issues
make security         # Security audit
make format           # Format code
```

### Docker (Optional)

```bash
make docker-up        # Start all services
make docker-down      # Stop all services
make docker-logs      # View logs
make docker-clean     # Clean everything
```

---

## 🌐 Production Deployment

Choose your deployment architecture:

### Option 1: Serverless (Netlify Functions) - Recommended ⭐

**Best for:** Small-medium traffic, simplicity, 100% free
**What you get:** Frontend + serverless API + auto-SSL
**Cost:** $0/month (125k requests/month)

#### Quick Deploy (3 minutes)

```bash
# 1. Push to GitHub
git add .
git commit -m "Deploy to production"
git push origin main

# 2. Connect to Netlify (one-time)
# - Go to https://netlify.com
# - Click "Add new site" → "Import from GitHub"
# - Select FairMediator repo
# - Build settings auto-detected ✓

# 3. Add environment variables (one-time)
# Netlify Dashboard → Site settings → Environment variables
# Add these:
HUGGINGFACE_API_KEY=hf_your_key_here
NODE_ENV=production

# 4. Deploy automatically!
# Every git push to main = automatic deploy
```

**Or use Makefile:**
```bash
make netlify-deploy  # Commits and pushes
```

#### What Gets Deployed

**Netlify Functions** (`netlify/functions/`):
- `/.netlify/functions/chat` - AI chat endpoint
- `/.netlify/functions/check-affiliations` - Conflict detection
- FREE: 125k requests/month, 100 hours runtime

**Netlify Forms**:
- Feedback form at `/feedback`
- FREE: 100 submissions/month

**Frontend**:
- React SPA from `frontend/dist`
- Global CDN
- Automatic SSL/HTTPS

#### Configuration

**netlify.toml** (already configured):
```toml
[build]
  publish = "frontend/dist"
  command = "cd frontend && npm run build"
  functions = "netlify/functions"
```

#### Testing Locally

```bash
# Install CLI (one-time)
npm install -g netlify-cli
netlify login

# Test with functions
make netlify-dev
# Or: netlify dev

# Visit: http://localhost:8888
```

#### Custom Domain (Optional)

1. Netlify Dashboard → Domain settings
2. Add custom domain
3. Update DNS:
   - CNAME: `www` → `your-site.netlify.app`
   - A record: `@` → Netlify IP
4. SSL auto-provisions (2-5 min)

---

### Option 2: Traditional (Render Backend + Netlify Frontend)

**Best for:** Advanced features (cron jobs, WebSockets, long tasks)
**What you get:** Dedicated backend + static frontend
**Cost:** $0/month (with 15-min cold starts)

#### Architecture

```
Frontend (Netlify) → Backend (Render) → MongoDB Atlas
                      ├── Redis (Upstash)
                      └── Weaviate Cloud
```

#### Step 1: MongoDB Atlas (5 minutes)

1. **Create account:** https://mongodb.com/cloud/atlas
2. **Create M0 FREE cluster:**
   - Provider: AWS
   - Region: Oregon (close to Render)
   - Name: `fairmediator`
3. **Create user:**
   - Username: `fairmediator_user`
   - Password: Auto-generate & save
4. **Allow access:**
   - Add current IP
   - Add `0.0.0.0/0` (for Render)
5. **Get connection string:**
   ```
   mongodb+srv://user:PASSWORD@cluster.mongodb.net/fairmediator
   ```

#### Step 2: Get API Keys (5 minutes)

**HuggingFace (required):**
1. Sign up: https://huggingface.co/join
2. Get token: https://huggingface.co/settings/tokens
3. Create "Read" token
4. Save token: `hf_xxxxx`

**Upstash Redis (optional - for caching):**
1. Sign up: https://upstash.com
2. Create database: Regional, closest region
3. Copy Redis URL: `redis://default:xxx@xxx.upstash.io:6379`

**Weaviate (optional - for vector search):**
- Use your existing `fairmediator` sandbox
- Get URL and API key from console.weaviate.cloud

#### Step 3: Deploy Backend to Render (10 minutes)

1. **Create account:** https://render.com
2. **Create Web Service:**
   - Connect GitHub repo
   - Name: `fairmediator-backend`
   - Environment: Node
   - Build command: `cd backend && npm install`
   - Start command: `cd backend && npm start`
   - Plan: **Free**

3. **Add environment variables:**
   ```bash
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://...  # From Step 1
   HUGGINGFACE_API_KEY=hf_...     # From Step 2
   CORS_ORIGIN=https://your-frontend.netlify.app
   FRONTEND_URL=https://your-frontend.netlify.app

   # Generate these:
   JWT_SECRET=<random-64-chars>
   JWT_REFRESH_SECRET=<random-64-chars>
   SESSION_SECRET=<random-32-chars>

   # Optional (from Step 2):
   REDIS_ENABLED=true
   REDIS_URL=redis://...
   WEAVIATE_ENABLED=true
   WEAVIATE_URL=fairmediator-xxxxx.weaviate.network
   WEAVIATE_API_KEY=xxx
   ```

4. **Deploy!**
   - Render auto-deploys from main branch
   - Get URL: `https://fairmediator-backend.onrender.com`

#### Step 4: Deploy Frontend to Netlify (5 minutes)

1. **Update frontend config:**
   ```bash
   # frontend/.env.production
   VITE_API_URL=https://fairmediator-backend.onrender.com/api
   ```

2. **Deploy to Netlify:**
   - Same as Option 1 above
   - No functions needed (backend on Render)

3. **Update Render CORS:**
   - Go back to Render
   - Update `CORS_ORIGIN` to your Netlify URL
   - Redeploys automatically

#### Step 5: Test Deployment

```bash
# Test backend
curl https://fairmediator-backend.onrender.com/health

# Should return:
# {"status":"healthy","timestamp":"..."}

# Test frontend
# Visit: https://your-site.netlify.app
# Try chat interface
```

#### Render Free Tier Notes

**Limitations:**
- Sleeps after 15 min inactivity
- First request after sleep: 30-60 sec cold start
- 512 MB RAM
- 750 hours/month (enough for one service)

**Good for:**
- Development/testing
- Low-traffic production
- Cron jobs (stays awake when running)

**Upgrade to avoid cold starts:** $7/month

---

### Deployment Comparison

| Feature | Netlify Functions | Render + Netlify |
|---------|------------------|------------------|
| **Setup time** | 3 minutes | 20 minutes |
| **Cost** | $0/month | $0/month |
| **Cold starts** | None | After 15 min |
| **Request limit** | 125k/month | Unlimited |
| **Execution time** | 10 seconds | Unlimited |
| **Cron jobs** | ❌ No | ✅ Yes |
| **WebSockets** | ❌ No | ✅ Yes |
| **Best for** | Simple apps | Advanced features |

**Recommendation:**
- Start with **Option 1** (Netlify Functions)
- Migrate to **Option 2** if you need cron jobs or longer execution times

---

## 🔐 Security Setup

### Environment Variables

**Never commit these:**
- `HUGGINGFACE_API_KEY`
- `MONGODB_URI` with credentials
- `JWT_SECRET`
- `REDIS_URL` with password
- `WEAVIATE_API_KEY`

### Generate Secrets

```bash
# JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Security Checklist

- [ ] All API keys in `.env` (never in code)
- [ ] `.env` added to `.gitignore`
- [ ] CORS_ORIGIN set to your frontend domain
- [ ] Rate limiting enabled
- [ ] HTTPS in production (automatic on Netlify)

See [SECURITY.md](./SECURITY.md) for complete security guidelines.

---

## 🧪 Testing Setup

```bash
# Run all tests
make test

# Run specific tests
cd backend && npm test -- --testPathPattern=chatService

# Coverage report
make test-coverage

# Watch mode
make test-watch
```

See [TESTING.md](./TESTING.md) for testing guidelines.

---

## 🆘 Troubleshooting

### Common Issues

**"MongoDB connection failed"**
```bash
# Check MongoDB is running
mongosh  # Should connect

# Or check Docker
docker ps | grep mongo

# Fix: Start MongoDB
brew services start mongodb-community  # Mac
sudo systemctl start mongod  # Linux
docker start mongodb  # Docker
```

**"Redis connection refused"**
```bash
# Check Redis is running
redis-cli ping  # Should return PONG

# Fix: Start Redis
brew services start redis  # Mac
sudo systemctl start redis  # Linux

# Or disable Redis
# In .env: REDIS_ENABLED=false
```

**"Weaviate unauthorized"**
```bash
# Check credentials in .env
echo $WEAVIATE_API_KEY

# Fix: Get new key from console.weaviate.cloud
```

**"HuggingFace API error"**
```bash
# Check key is valid
curl https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct \
  -H "Authorization: Bearer $HUGGINGFACE_API_KEY"

# Fix: Get new key from huggingface.co/settings/tokens
```

**"Port 5001 already in use"**
```bash
# Find process
lsof -i :5001

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=5002
```

### Getting Help

1. Check [CONTEXT.md](./CONTEXT.md) - Project rules, recent changes, and state
2. Check service-specific guides:
   - [REDIS_SETUP.md](./REDIS_SETUP.md) - Redis caching details
   - [DEPLOYMENT.md](./DEPLOYMENT.md) - Both deployment options
   - Weaviate guide is in this file (see above)

---

## 📊 Free Services Used

| Service | Free Tier | What We Use | Status |
|---------|-----------|-------------|--------|
| **HuggingFace** | Unlimited* | AI chat, embeddings | ✅ Active |
| **MongoDB Atlas** | 512MB | Database | ✅ Active |
| **Netlify** | 100GB bandwidth | Frontend + Functions | ✅ Active |
| **Upstash Redis** | 10k commands/day | Caching | ⚪ Optional |
| **Weaviate Cloud** | 100k vectors | Vector search | ⚪ Optional |
| **Render** | 750 hrs/month | Backend (option 2) | ⚪ Alternative |

*Subject to rate limits

**Total Cost:** $0/month 🎉

---

## 🎯 Next Steps After Setup

1. **Test the app:** Try chat interface at http://localhost:3000
2. **Enable caching:** Set up Redis to reduce token usage
3. **Add vector search:** Set up Weaviate for semantic search (see above)
4. **Deploy:** Follow [DEPLOYMENT.md](./DEPLOYMENT.md) for both options
5. **Monitor:** Check token usage and optimize

---

## 📝 Related Documentation

- **[CONTEXT.md](./CONTEXT.md)** - Project state, rules, and token optimization (all-in-one)
- **[REDIS_SETUP.md](./REDIS_SETUP.md)** - Detailed Redis caching guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Both deployment options (serverless + traditional)
- **[README.md](./README.md)** - Project overview and quick start
- **Weaviate setup** - Included in this file (see above)

---

**Questions?** Check [CONTEXT.md](./CONTEXT.md) first (contains all project rules and token optimization)

**Need deployment help?** See [Production Deployment](#-production-deployment) or [DEPLOYMENT.md](./DEPLOYMENT.md)
