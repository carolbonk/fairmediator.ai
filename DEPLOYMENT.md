# FairMediator Deployment Guide

## Deploy to Render + MongoDB Atlas (100% FREE)

This guide will help you deploy FairMediator backend to Render's free tier with MongoDB Atlas.

---

## Step 1: Set Up MongoDB Atlas (5 minutes)

MongoDB Atlas provides a **FREE 512MB database** - perfect for getting started!

### 1.1 Create Account
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up with Google/GitHub (fastest) or email
3. **No credit card required!**

### 1.2 Create Free Cluster
1. Click **"Build a Database"**
2. Select **"M0 FREE"** tier
   - 512 MB storage
   - Shared RAM
   - No credit card needed
3. Choose **AWS** as provider
4. Select region closest to you (or Oregon to match Render)
5. Name your cluster: `fairmediator` (or any name)
6. Click **"Create"**

### 1.3 Create Database User
1. In the **Security Quickstart**, create a database user:
   - Username: `fairmediator_user` (or your choice)
   - Password: Click **"Autogenerate Secure Password"** and **SAVE IT!**
   - Click **"Create User"**

### 1.4 Allow Network Access
1. Still in Security Quickstart, under **"Where would you like to connect from?"**
2. Click **"Add My Current IP Address"** (for local development)
3. **Important:** Also click **"Add IP Address"** and enter `0.0.0.0/0`
   - This allows Render to connect (Render uses dynamic IPs)
4. Click **"Finish and Close"**

### 1.5 Get Connection String
1. Click **"Connect"** on your cluster
2. Choose **"Connect your application"**
3. Select **"Node.js"** driver and version **"5.5 or later"**
4. **Copy the connection string** - it looks like:
   ```
   mongodb+srv://fairmediator_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. **Replace `<password>`** with the password you saved earlier
6. **Add database name** after `.net/`:
   ```
   mongodb+srv://fairmediator_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/fairmediator?retryWrites=true&w=majority
   ```
7. **Save this connection string** - you'll need it for Render!

---

## Step 2: Get Hugging Face API Key (2 minutes)

Your AI features need this **FREE** API key:

1. Go to https://huggingface.co/join
2. Sign up (no credit card needed)
3. Go to https://huggingface.co/settings/tokens
4. Click **"New token"**
   - Name: `FairMediator`
   - Type: **"Read"**
5. Click **"Generate"**
6. **Copy and save the token** (starts with `hf_...`)

---

## Step 3: Deploy to Render (5 minutes)

### 3.1 Push Code to GitHub
```bash
# Make sure all changes are committed
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

### 3.2 Create Render Account
1. Go to https://render.com
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (easiest - auto-connects your repos)
4. **No credit card required!**

### 3.3 Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Find and select your **FairMediator** repository
3. Configure:
   - **Name:** `fairmediator-backend` (or your choice)
   - **Region:** Oregon (or closest to your MongoDB region)
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
   - **Plan:** **"Free"**

### 3.4 Add Environment Variables
Click **"Advanced"** → **"Add Environment Variable"** and add these:

**Required Variables:**
```
MONGODB_URI = [Paste your MongoDB Atlas connection string from Step 1.5]
HUGGINGFACE_API_KEY = [Paste your Hugging Face token from Step 2]
NODE_ENV = production
PORT = 5000
```

**Auto-generated (Render creates these for you):**
- `JWT_SECRET` - Click "Generate" button
- `JWT_REFRESH_SECRET` - Click "Generate" button
- `SESSION_SECRET` - Click "Generate" button

**Set these after frontend is deployed:**
```
CORS_ORIGIN = https://your-frontend-url.com
FRONTEND_URL = https://your-frontend-url.com
```

**Optional (for later if you enable Stripe):**
```
# STRIPE_SECRET_KEY = sk_test_...
# STRIPE_WEBHOOK_SECRET = whsec_...
# STRIPE_PREMIUM_PRICE_ID = price_...
```

### 3.5 Deploy!
1. Click **"Create Web Service"**
2. Render will:
   - Clone your repo
   - Install dependencies
   - Start your server
   - Give you a URL like: `https://fairmediator-backend.onrender.com`

**First deployment takes 2-3 minutes.** Watch the logs!

---

## Step 4: Verify Deployment

### 4.1 Check Health Endpoint
Visit: `https://your-app-name.onrender.com/health`

You should see:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-15T...",
  "ai": "configured"
}
```

### 4.2 Check Logs
In Render dashboard, click **"Logs"** tab to see:
```
✅ MongoDB connected successfully
ℹ️  Stripe not configured - Running in free-only mode
🚀 FairMediator backend running on port 5000
```

---

## Step 5: Update Frontend

Update your frontend API URL to point to Render:

**In `frontend/.env.production` or Vite config:**
```
VITE_API_URL=https://your-app-name.onrender.com/api
```

Then redeploy your frontend!

---

## Important Notes

### Free Tier Limitations
- ✅ **Always free** - no time limits
- ⚠️ **Sleeps after 15 min inactivity** (cold start ~30 sec on first request)
- ⚠️ **750 hours/month** (enough for 1 service running 24/7)
- ⚠️ **Limited to 512MB RAM**

### Cold Starts
Free tier services "spin down" after 15 minutes of no requests. First request after that takes ~30 seconds to wake up.

**Solutions:**
1. **Upgrade to $7/month** - removes cold starts
2. **Use a ping service** - Keep alive with cron jobs (not recommended, wastes resources)
3. **Just accept it** - Fine for demos/MVPs

### Auto-Deploys
Render automatically redeploys when you push to `main` branch! 🎉

---

## Troubleshooting

### "MongoDB connection error"
- Check your `MONGODB_URI` includes the password
- Check MongoDB Atlas allowed `0.0.0.0/0` IP address
- Check database name is in the connection string

### "AI not configured"
- Check `HUGGINGFACE_API_KEY` is set in Render env vars
- Token should start with `hf_`

### "Build failed"
- Check `package.json` exists in `/backend` folder
- Check all dependencies are in `package.json`
- View logs in Render dashboard

### Service won't start
- Check `PORT` is set to `5000`
- Check start command is `cd backend && npm start`
- View logs for specific error

---

## Cost Breakdown

### Current Setup: $0/month
- ✅ Render Free Tier: **$0**
- ✅ MongoDB Atlas Free (M0): **$0**
- ✅ Hugging Face API: **$0**

### When You Outgrow Free Tier:
- Render Starter (no cold starts): **$7/month**
- MongoDB Atlas M2: **$9/month**
- Total: **$16/month** for production-ready setup

---

## Next Steps

1. ✅ Backend deployed on Render
2. ⬜ Deploy frontend (Netlify, Vercel, or Render static site)
3. ⬜ Point custom domain (optional)
4. ⬜ Set up monitoring (Render includes basic monitoring)
5. ⬜ Add Stripe (when ready to charge users)

---

## Support

- **Render Docs:** https://render.com/docs
- **MongoDB Atlas Docs:** https://docs.atlas.mongodb.com/
- **Hugging Face Docs:** https://huggingface.co/docs

**Need help?** Check the logs in Render dashboard or MongoDB Atlas monitoring.
