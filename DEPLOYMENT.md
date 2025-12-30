# FairMediator Deployment Guide

**Architecture: Traditional (Dedicated Backend)**

> **📌 Use this guide if:** You want to deploy a Node.js backend server on Render/Vercel/Railway
>
> **🔄 Alternative:** For serverless deployment (no dedicated backend), see [NETLIFY.md](./NETLIFY.md)

Complete guide to deploy FairMediator with dedicated backend server + static frontend.

## Table of Contents

1. [Overview](#overview)
2. [Backend Deployment (Render + MongoDB)](#backend-deployment)
3. [Frontend Deployment (Netlify)](#frontend-deployment)
4. [SSL/HTTPS Setup](#ssl-https-setup)
5. [Post-Deployment Checklist](#post-deployment-checklist)
6. [Troubleshooting](#troubleshooting)

---

## Overview

**Deployment Stack:**
- **Backend**: Render (Node.js)
- **Database**: MongoDB Atlas
- **Frontend**: Netlify (React)
- **Domain**: IONOS (or any registrar)
- **SSL**: Free (Netlify automatic)
- **Total Cost**: **$0/month** (free tier)

**Time Required**: 30-60 minutes

---

## Backend Deployment

### Step 1: MongoDB Atlas Setup (5 minutes)

MongoDB Atlas provides a **FREE 512MB database**.

#### 1.1 Create Account

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up with Google/GitHub or email
3. **No credit card required**

#### 1.2 Create Free Cluster

1. Click **"Build a Database"**
2. Select **"M0 FREE"** tier
   - 512 MB storage
   - Shared RAM
   - No credit card needed
3. Choose **AWS** as provider
4. Select region closest to you (Oregon for Render)
5. Name: `fairmediator`
6. Click **"Create"**

#### 1.3 Create Database User

1. In Security Quickstart:
   - Username: `fairmediator_user`
   - Password: Click **"Autogenerate Secure Password"** and **SAVE IT**
   - Click **"Create User"**

#### 1.4 Allow Network Access

1. Click **"Add My Current IP Address"** (for local testing)
2. **Important**: Also click **"Add IP Address"** → Enter `0.0.0.0/0`
   - This allows Render to connect
3. Click **"Finish and Close"**

#### 1.5 Get Connection String

1. Click **"Connect"** on your cluster
2. Choose **"Connect your application"**
3. Select **Node.js** driver
4. **Copy the connection string**:
   ```
   mongodb+srv://fairmediator_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. **Replace `<password>`** with your saved password
6. **Add database name** after `.net/`:
   ```
   mongodb+srv://fairmediator_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/fairmediator?retryWrites=true&w=majority
   ```
7. **Save this string** for Render

---

### Step 2: Get Hugging Face API Key (2 minutes)

1. Go to https://huggingface.co/join
2. Sign up (no credit card)
3. Go to https://huggingface.co/settings/tokens
4. Click **"New token"**
   - Name: `FairMediator`
   - Type: **Read**
5. **Copy and save the token** (starts with `hf_`)

---

### Step 3: Deploy Backend to Render (5 minutes)

#### 3.1 Push Code to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### 3.2 Create Render Account

1. Go to https://render.com
2. Click **"Get Started for Free"**
3. Sign up with **GitHub**
4. **No credit card required**

#### 3.3 Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Select your **FairMediator** repository
3. Configure:
   - **Name**: `fairmediator-backend`
   - **Region**: Oregon
   - **Branch**: `main`
   - **Runtime**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: **Free**

#### 3.4 Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**:

**Required:**
```
MONGODB_URI = [Your MongoDB connection string from Step 1.5]
HUGGINGFACE_API_KEY = [Your HuggingFace token from Step 2]
NODE_ENV = production
PORT = 5000
```

**Auto-generate these** (click "Generate"):
```
JWT_SECRET = [Click Generate]
JWT_REFRESH_SECRET = [Click Generate]
SESSION_SECRET = [Click Generate]
```

**Set after frontend is deployed:**
```
CORS_ORIGIN = https://your-frontend.netlify.app
FRONTEND_URL = https://your-frontend.netlify.app
```

#### 3.5 Deploy

1. Click **"Create Web Service"**
2. Wait 2-3 minutes for first deploy
3. You'll get a URL: `https://fairmediator-backend.onrender.com`

#### 3.6 Verify Backend

Visit: `https://your-backend.onrender.com/health`

Should see:
```json
{
  "status": "healthy",
  "timestamp": "2025-...",
  "ai": "configured"
}
```

---

## Frontend Deployment

### Step 4: Deploy to Netlify (10 minutes)

#### 4.1 Update Frontend Config

Edit `frontend/.env.production`:
```bash
VITE_API_URL=https://your-backend.onrender.com/api
```

Commit changes:
```bash
git add frontend/.env.production
git commit -m "Update API URL for production"
git push origin main
```

#### 4.2 Create Netlify Account

1. Go to https://app.netlify.com/signup
2. Sign up with **GitHub**
3. **No credit card required**

#### 4.3 Deploy Site

1. Click **"Add new site"** → **"Import an existing project"**
2. Click **"Deploy with GitHub"**
3. Select your **FairMediator** repository
4. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
5. Click **"Deploy site"**

Wait 2-3 minutes. You'll get a URL like:
```
https://random-name-123.netlify.app
```

#### 4.4 Update Backend CORS

1. Go back to **Render dashboard**
2. Your backend service → **Environment**
3. Update these variables:
   ```
   CORS_ORIGIN = https://your-site.netlify.app
   FRONTEND_URL = https://your-site.netlify.app
   ```
4. Save (Render auto-redeploys)

#### 4.5 Test Application

Visit your Netlify URL. You should see FairMediator working!

---

## SSL HTTPS Setup

### Step 5: Add Custom Domain & SSL (30 minutes)

If you have a custom domain (e.g., `fairmediator.ai` from IONOS), follow these steps to get **free SSL**.

#### 5.1 Disable Domain Guard on IONOS

**Only needed if you have Domain Guard enabled:**

1. Go to **IONOS Control Panel**: https://my.ionos.com
2. Navigate to **Domains & SSL** → **Domains**
3. Select `fairmediator.ai`
4. Find **"Domain Guard"** section
5. Click **"Disable Domain Guard"**
6. Confirm

#### 5.2 Add Custom Domain in Netlify

1. Go to **Netlify Dashboard**
2. Your site → **Site settings** → **Domain management**
3. Click **"Add custom domain"**
4. Enter: `fairmediator.ai`
5. Click **"Verify"** → **"Add domain"**
6. Click **"Add domain alias"**
7. Enter: `www.fairmediator.ai`
8. Click **"Add domain alias"**

#### 5.3 Configure DNS in IONOS

**Option A: Using IONOS DNS (Recommended)**

1. IONOS → Domains → `fairmediator.ai` → **DNS**
2. **Add A Record**:
   - Type: `A`
   - Name: `@` (or blank)
   - Value: `75.2.60.5`
   - TTL: `3600`
   - Save

3. **Add CNAME Record**:
   - Type: `CNAME`
   - Name: `www`
   - Value: `your-site.netlify.app`
   - TTL: `3600`
   - Save

**Delete conflicting records:**
- Remove old A records pointing to different IPs
- Remove old CNAME for www

**Option B: Using Netlify DNS (Easier)**

1. Netlify → Domain management → **"Use Netlify DNS"**
2. Click **"Set up Netlify DNS"**
3. Netlify shows nameservers:
   ```
   dns1.p01.nsone.net
   dns2.p01.nsone.net
   dns3.p01.nsone.net
   dns4.p01.nsone.net
   ```

4. Update in IONOS:
   - IONOS → Domains → **Nameservers**
   - Select **"Custom nameservers"**
   - Enter Netlify's nameservers
   - Save

#### 5.4 Wait for DNS Propagation

**Time**: 5 minutes to 48 hours (usually 30 minutes)

**Check status:**
```bash
nslookup fairmediator.ai
# Should show: 75.2.60.5
```

Or visit: https://www.whatsmydns.net/

#### 5.5 Netlify Auto-Provisions SSL

Once DNS is verified:
1. Netlify → Domain management → **HTTPS**
2. Should show: **"Your site has HTTPS enabled"** ✅
3. If not, click **"Verify DNS configuration"**
4. Wait 5 more minutes

#### 5.6 Enable Force HTTPS

1. Still in HTTPS section
2. Toggle **"Force HTTPS"** to **ON**
3. This redirects `http://` → `https://`

#### 5.7 Test SSL

Visit your domain:
- `https://fairmediator.ai` → Should show green padlock 🔒
- `http://fairmediator.ai` → Should redirect to HTTPS
- `https://www.fairmediator.ai` → Should work

**Check SSL grade:**
https://www.ssllabs.com/ssltest/analyze.html?d=fairmediator.ai

Should get **A** or **A+** rating.

#### 5.8 Optional: Cancel IONOS SSL

If you have a paid SSL certificate from IONOS:
1. IONOS → **SSL Certificates**
2. Find `*.fairmediator.ai`
3. Click **"Cancel"** or **"Don't renew"**
4. **Save €60-120/year** (Netlify SSL is free!)

---

## Post-Deployment Checklist

### Quick Verification

- [ ] Backend health endpoint returns 200 OK
- [ ] Frontend loads at Netlify URL
- [ ] Custom domain resolves correctly
- [ ] HTTPS works with green padlock
- [ ] HTTP redirects to HTTPS
- [ ] API calls from frontend to backend work
- [ ] User registration works
- [ ] User login works
- [ ] Email verification works (if Resend configured)
- [ ] AI features work (mediator matching)

### Performance Check

```bash
# Check backend health
curl https://your-backend.onrender.com/health

# Check frontend loads
curl -I https://fairmediator.ai

# Check HTTPS redirect
curl -I http://fairmediator.ai
# Should return: Location: https://fairmediator.ai
```

### SSL Verification

**Check common SSL errors:**

| Error | Solution |
|-------|----------|
| `NET::ERR_CERT_COMMON_NAME_INVALID` | Verify domain added correctly in Netlify |
| `NET::ERR_CERT_AUTHORITY_INVALID` | Wait for Let's Encrypt cert (click "Renew certificate") |
| `NET::ERR_CERT_DATE_INVALID` | Certificate expired - click "Renew certificate" |
| `Mixed Content` | Update all URLs to HTTPS in code |
| `DNS_PROBE_FINISHED_NXDOMAIN` | Check DNS records in IONOS |

---

## Troubleshooting

### Backend Issues

#### "MongoDB connection error"
- Check `MONGODB_URI` includes password
- Check MongoDB Atlas allowed `0.0.0.0/0`
- Check database name in connection string

#### "AI not configured"
- Check `HUGGINGFACE_API_KEY` is set
- Token should start with `hf_`

#### "Build failed"
- Check `package.json` exists in `/backend`
- View logs in Render dashboard

#### Service won't start
- Check `PORT=5000`
- Check start command: `cd backend && npm start`
- Check logs for errors

### Frontend Issues

#### "Cannot connect to backend"
- Check `VITE_API_URL` is correct
- Check CORS_ORIGIN in backend env vars
- Check backend is running

#### Build fails
- Check Node version (use v18+)
- Check dependencies in `package.json`
- View build logs in Netlify

### SSL Issues

#### DNS not propagating
```bash
# Clear DNS cache
# macOS:
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Windows:
ipconfig /flushdns

# Linux:
sudo systemd-resolve --flush-caches
```

Try from different network (mobile data)

#### Certificate provisioning failed
1. Netlify → HTTPS → **"Verify DNS configuration"**
2. If still fails → **"Renew certificate"**
3. Check for CAA records blocking Let's Encrypt

#### Mixed content warnings
- Site loads with HTTPS but "Not Secure" warning
- Open DevTools (F12) → Console → Look for mixed content errors
- Update all `http://` URLs to `https://` in your code

### Email Issues (if using IONOS email)

If email stops working after DNS changes:

Add MX records:
```
Type: MX
Name: @
Priority: 10
Value: mx00.ionos.com

Type: MX
Name: @
Priority: 10
Value: mx01.ionos.com
```

---

## Free Tier Limitations

### Render (Backend)

- ✅ **Always free** - no time limits
- ⚠️ **Sleeps after 15 min inactivity** (cold start ~30 sec)
- ⚠️ **750 hours/month** (enough for 24/7)
- ⚠️ **Limited to 512MB RAM**

**Solutions for cold starts:**
1. Upgrade to $7/month (no cold starts)
2. Accept it (fine for demos/MVPs)

### MongoDB Atlas

- ✅ **512 MB storage**
- ✅ **No time limits**
- ⚠️ **Shared resources**

Upgrade to M2 ($9/month) for dedicated resources.

### Netlify

- ✅ **100 GB bandwidth/month**
- ✅ **300 build minutes/month**
- ✅ **Free SSL**
- ✅ **No cold starts**

Perfect for most MVPs!

---

## Cost Breakdown

### Current Setup: $0/month

- ✅ Render Free: **$0**
- ✅ MongoDB Atlas M0: **$0**
- ✅ Netlify Free: **$0**
- ✅ HuggingFace API: **$0**
- ✅ Netlify SSL: **$0**

### When You Outgrow Free Tier:

| Service | Free Tier | Paid Tier | Cost |
|---------|-----------|-----------|------|
| **Render** | 512MB RAM, cold starts | No cold starts | **$7/month** |
| **MongoDB** | 512MB | 2GB dedicated | **$9/month** |
| **Netlify** | 100GB bandwidth | 1TB bandwidth | **$0-19/month** |
| **Cloudflare WAF** | Basic DDoS | Full WAF + DDoS | **$20/month** |
| **Resend Email** | 100/day | 50K/month | **$0-20/month** |
| **Sentry** | 5K errors/month | 100K errors/month | **$0-26/month** |

**Total for production**: **$16-101/month** (depending on features)

---

## Next Steps

After deployment:

1. **Configure Security**:
   - Add Resend API key for emails
   - Add Sentry DSN for monitoring
   - Set up Cloudflare WAF (see `/WAF_INTEGRATION_GUIDE.md`)

2. **Set Up Payments**:
   - Add Stripe API keys
   - Configure subscription plans
   - Test payment flow

3. **Monitoring**:
   - Set up uptime monitoring (UptimeRobot)
   - Configure Sentry alerts
   - Review Render logs regularly

4. **Performance**:
   - Enable Cloudflare CDN
   - Optimize images
   - Add Redis caching (when needed)

5. **Compliance**:
   - Add privacy policy
   - Add terms of service
   - GDPR compliance (if EU users)

---

## Support Resources

**Platform Docs:**
- **Render**: https://render.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com/
- **Netlify**: https://docs.netlify.com/
- **IONOS**: https://www.ionos.com/help/

**Tools:**
- **DNS Check**: https://www.whatsmydns.net/
- **SSL Test**: https://www.ssllabs.com/ssltest/
- **Mixed Content**: https://www.whynopadlock.com/

**FairMediator Docs:**
- Security: See `/SECURITY.md`
- WAF Setup: See `/WAF_INTEGRATION_GUIDE.md`
- Development: See `/README.md`

---

## Quick Reference

### Deployment URLs

**Backend:**
- Render: `https://your-backend.onrender.com`
- Health: `https://your-backend.onrender.com/health`

**Frontend:**
- Netlify: `https://your-site.netlify.app`
- Custom: `https://fairmediator.ai`

**Services:**
- MongoDB: https://cloud.mongodb.com/
- Render: https://dashboard.render.com/
- Netlify: https://app.netlify.com/
- IONOS: https://my.ionos.com/

### Environment Variables

**Backend (Render):**
```
MONGODB_URI=mongodb+srv://...
HUGGINGFACE_API_KEY=hf_...
NODE_ENV=production
PORT=5000
JWT_SECRET=...
JWT_REFRESH_SECRET=...
SESSION_SECRET=...
CORS_ORIGIN=https://fairmediator.ai
FRONTEND_URL=https://fairmediator.ai
```

**Frontend (Netlify):**
```
VITE_API_URL=https://your-backend.onrender.com/api
```

### DNS Records (IONOS)

```
Type    Name    Value                           TTL
A       @       75.2.60.5                       3600
CNAME   www     your-site.netlify.app           3600
```

---

**Last Updated:** December 26, 2024
**Deployment Status:** Production-Ready ✅
