# Netlify Deployment Guide - FairMediator

**Status:** Complete serverless deployment (frontend + backend on Netlify)

## Architecture

```
Frontend (Static) → Netlify CDN
Backend (Express) → Netlify Functions (/.netlify/functions/api)
Database → MongoDB Atlas (M0 Free Tier)
Storage → Netlify Blobs
Email → Resend
AI → HuggingFace API
```

**Cost:** $0/month (100% free tier)

---

## Prerequisites

- [x] GitHub repository with code pushed
- [x] Netlify account (free)
- [x] MongoDB Atlas account with connection string
- [x] HuggingFace API key
- [x] Resend API key (optional)
- [x] Domain configured in Resend (if using email)

---

## Step 1: Deploy to Netlify

### Option A: Deploy from GitHub (Recommended)

1. **Login to Netlify:** https://app.netlify.com
2. **Click "Add new site" → "Import an existing project"**
3. **Connect to GitHub** and select `fairmediator.ai` repository
4. **Configure build settings:**
   - **Base directory:** Leave empty
   - **Build command:** `cd frontend && npm install && npm run build && cd ../backend && npm install`
   - **Publish directory:** `frontend/dist`
   - **Functions directory:** `netlify/functions`

5. **Click "Deploy site"** (will fail first time - need environment variables)

### Option B: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy from project root
netlify deploy --prod
```

---

## Step 2: Configure Environment Variables

Go to **Site settings → Environment variables** and add:

### Required Variables

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fairmediator

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-different-from-jwt

# AI/ML
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxx

# Environment
NODE_ENV=production

# CORS (use your Netlify URL or custom domain)
CORS_ORIGIN=https://fairmediator.ai
```

### Optional Variables

```bash
# Email (if using Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# Netlify Blobs (auto-configured by Netlify)
# NETLIFY_SITE_ID=auto
# NETLIFY_TOKEN=auto

# Stripe (if implementing premium tier later)
# STRIPE_SECRET_KEY=sk_test_xxxxx
# STRIPE_WEBHOOK_SECRET=whsec_xxxxx
# STRIPE_PREMIUM_PRICE_ID=price_xxxxx
```

---

## Step 3: Trigger Redeploy

After setting environment variables:

1. Go to **Deploys** tab
2. Click **"Trigger deploy" → "Clear cache and deploy site"**
3. Wait for build to complete (~2-3 minutes)

---

## Step 4: Configure Custom Domain (Optional)

### If you own fairmediator.ai:

1. Go to **Site settings → Domain management**
2. Click **"Add custom domain"**
3. Enter `fairmediator.ai`
4. Follow DNS configuration instructions:
   - Add `A` record: `75.2.60.5`
   - Add `CNAME` record: `www` → `your-site.netlify.app`
5. Enable HTTPS (automatic via Let's Encrypt)

### Netlify will automatically:
- Provision SSL certificate
- Handle www redirects
- Enable HTTP/2

---

## Step 5: Verify Deployment

### Test API Endpoints

```bash
# Health check
curl https://fairmediator.ai/api/mediators

# Should return: 200 OK with mediator list

# Auth endpoint
curl https://fairmediator.ai/api/csrf-token

# Should return: CSRF token
```

### Test Frontend

1. Visit https://fairmediator.ai
2. Click "Login" (should load login page)
3. Try searching for mediators
4. Check browser console for errors

---

## How It Works

### Request Flow

```
User Browser
    ↓
https://fairmediator.ai/api/mediators
    ↓
Netlify Edge (CDN)
    ↓
Redirect: /api/* → /.netlify/functions/api/*
    ↓
Netlify Function (api.js)
    ↓
Express App (backend/src/server.js)
    ↓
MongoDB Atlas
```

### Cold Start Performance

- **First request:** ~1-2 seconds (cold start)
- **Subsequent requests:** ~100-300ms
- **MongoDB connection:** Reused across requests

### Function Limits (Netlify Free Tier)

- **125,000 requests/month** (included)
- **100 hours runtime/month** (included)
- **Function timeout:** 10 seconds (configured)
- **Function size:** 50 MB (our backend is ~15 MB)

---

## Monitoring & Debugging

### View Function Logs

1. Go to **Functions** tab in Netlify dashboard
2. Click on `api` function
3. View real-time logs

### Enable Function Analytics

1. Go to **Analytics** tab
2. Enable function analytics (free)
3. Monitor:
   - Request count
   - Error rate
   - Execution time
   - Cold starts

### Common Issues

**❌ "Function execution timed out"**
- Check MongoDB connection (may be slow on free tier)
- Increase timeout in `netlify.toml` (max 26 seconds on Pro plan)

**❌ "Module not found"**
- Run `cd backend && npm install` locally
- Check `netlify.toml` includes backend files
- Redeploy with cache cleared

**❌ "CORS error"**
- Check `CORS_ORIGIN` environment variable
- Must match your domain exactly
- Include protocol (https://)

**❌ "MongoDB connection error"**
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas allows Netlify IPs (set to 0.0.0.0/0)
- Ensure database user has read/write permissions

---

## MongoDB Atlas Configuration

### Allow Netlify Functions

1. Go to MongoDB Atlas → **Network Access**
2. Click **"Add IP Address"**
3. Select **"Allow access from anywhere"** (0.0.0.0/0)
   - Netlify Functions use dynamic IPs
   - Security is handled by connection string authentication

### Connection String Format

```
mongodb+srv://username:password@cluster.mongodb.net/fairmediator?retryWrites=true&w=majority
```

### Performance Tips

- Enable **connection pooling** (already configured in backend)
- Use **indexes** for frequent queries
- Monitor **slow queries** in Atlas

---

## Rollback Strategy

If deployment fails:

1. Go to **Deploys** tab
2. Find previous working deploy
3. Click **"..." → "Publish deploy"**
4. Instantly rolls back to that version

---

## Cost Breakdown (Free Tier)

| Service | Free Tier | Usage | Cost |
|---------|-----------|-------|------|
| Netlify Hosting | 100 GB bandwidth | ~5 GB/month | $0 |
| Netlify Functions | 125k requests | ~10k/month | $0 |
| MongoDB Atlas | 512 MB storage | ~100 MB | $0 |
| HuggingFace API | Unlimited* | Rate limited | $0 |
| Resend Email | 100/day | ~10/day | $0 |
| **Total** | | | **$0/month** |

*HuggingFace free tier has rate limiting (~1 req/sec)

---

## Next Steps

1. ✅ Backend deployed to Netlify Functions
2. ✅ Frontend deployed to Netlify CDN
3. ✅ MongoDB Atlas connected
4. ✅ Custom domain configured (fairmediator.ai)
5. 🔄 Monitor logs for errors
6. 🔄 Test all features in production
7. 🔄 Set up uptime monitoring (optional)

---

## Support

- **Netlify Docs:** https://docs.netlify.com
- **MongoDB Atlas:** https://docs.atlas.mongodb.com
- **HuggingFace:** https://huggingface.co/docs

---

**Deployment Date:** January 26, 2026
**Status:** ✅ Production Ready
