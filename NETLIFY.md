# Netlify Deployment Guide

**Architecture: Serverless (Netlify Functions)**

> **📌 Use this guide if:** You want serverless deployment (no dedicated backend server)
>
> **🔄 Alternative:** For traditional deployment (dedicated Node.js backend), see [DEPLOYMENT.md](./DEPLOYMENT.md)

Complete guide for deploying FairMediator to Netlify with **FREE** serverless functions and forms.

---

## 🚀 Quick Deploy (3 Minutes)

```bash
# 1. Commit and push your code
git add .
git commit -m "Deploy to Netlify"
git push origin main

# 2. Connect to Netlify
# Go to https://netlify.com → "Add new site" → "Import from GitHub"
# Select your FairMediator repository

# 3. Configure environment variables
# In Netlify Dashboard → Site settings → Environment variables
# Add: HUGGINGFACE_API_KEY = [your key from https://huggingface.co/settings/tokens]

# 4. Deploy!
# Netlify auto-deploys when you push to main
```

**Or use Makefile:**
```bash
make netlify-deploy
```

---

## 📦 What's Included

### 1. Netlify Functions (Serverless Backend)
- **FREE**: 125,000 requests/month, 100 hours runtime
- **Location**: `netlify/functions/`
- **Endpoints**:
  - `/.netlify/functions/chat` - HuggingFace chat proxy
  - `/.netlify/functions/check-affiliations` - Conflict detection

### 2. Netlify Forms (Feedback System)
- **FREE**: 100 submissions/month
- **Location**: `frontend/src/components/FeedbackForm.jsx`
- **URL**: `https://your-site.netlify.app/feedback`

### 3. Free SSL & CDN
- Automatic HTTPS via Let's Encrypt
- Global CDN for fast loading
- Auto-renewal (no maintenance needed)

---

## 🔧 Setup Instructions

### Step 1: Install Netlify CLI (Optional - for local testing)

```bash
npm install -g netlify-cli
netlify login
```

### Step 2: Test Locally

```bash
# Using Makefile
make netlify-dev

# Or directly
netlify dev
```

This starts `http://localhost:8888` with:
- Frontend at `/`
- Functions at `/.netlify/functions/*`

### Step 3: Deploy to Production

#### Option A: Auto-deploy via Git (Recommended)
```bash
git push origin main  # Netlify auto-deploys
```

#### Option B: Manual deploy
```bash
netlify deploy --prod
```

### Step 4: Configure Environment Variables

1. Go to **Netlify Dashboard** → Your site
2. Navigate to **Site settings** → **Environment variables**
3. Click **"Add a variable"**
4. Add:
   ```
   Key: HUGGINGFACE_API_KEY
   Value: [Your HuggingFace API key]
   ```
5. **Trigger redeploy** (Deploys → Trigger deploy)

### Step 5: Add Custom Domain (Optional)

1. **Netlify Dashboard** → **Domain settings**
2. Click **"Add custom domain"**
3. Enter `fairmediator.ai`
4. Follow DNS instructions
5. **SSL auto-provisions** (2-5 minutes)

---

## 📝 File Structure

```
FairMediator/
├── netlify/
│   └── functions/              # Serverless functions
│       ├── chat.js            # Chat endpoint
│       ├── check-affiliations.js
│       └── package.json
├── frontend/
│   └── src/
│       ├── components/
│       │   └── FeedbackForm.jsx
│       ├── pages/
│       │   └── FeedbackPage.jsx
│       └── services/
│           └── netlifyApi.js   # Optional API wrapper
└── netlify.toml               # Netlify configuration
```

---

## 🎯 Available Endpoints

### Chat Function
```bash
POST /.netlify/functions/chat
Content-Type: application/json

{
  "message": "I need a mediator for a business dispute",
  "history": []
}

# Response:
{
  "message": "AI-generated response",
  "model": "meta-llama/Meta-Llama-3-8B-Instruct",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Affiliation Check
```bash
POST /.netlify/functions/check-affiliations
Content-Type: application/json

{
  "mediatorName": "John Doe",
  "mediatorBio": "Former partner at BigLaw LLC...",
  "parties": ["BigLaw LLC", "Tech Corp"]
}

# Response:
{
  "hasConflict": true,
  "conflicts": [
    {
      "party": "BigLaw LLC",
      "reason": "Mentioned in mediator bio",
      "riskLevel": "high"
    }
  ],
  "riskLevel": "high"
}
```

### Feedback Form
Simply visit `/feedback` on your deployed site.

---

## 💰 Pricing & Limits

| Feature | Free Tier | Your Est. Usage | Cost |
|---------|-----------|-----------------|------|
| Functions | 125k requests/mo | ~5-10k/mo | **$0** |
| Forms | 100 submissions/mo | ~20-50/mo | **$0** |
| Bandwidth | 100 GB/mo | ~5 GB/mo | **$0** |
| SSL | Included | All domains | **$0** |
| Build minutes | 300 min/mo | ~30 min/mo | **$0** |

**Total: $0/month** unless you exceed limits (unlikely at current scale)

---

## 🛠️ Makefile Commands

```bash
make netlify-dev      # Test locally with Netlify Functions
make netlify-deploy   # Deploy to production
make netlify-status   # Check deployment status
make netlify-open     # Open site in browser
```

---

## 🧪 Testing

### Local Testing
```bash
# Start Netlify dev server
make netlify-dev

# Test functions
curl http://localhost:8888/.netlify/functions/chat \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'
```

### Production Testing
1. Deploy to Netlify
2. Visit your site and use the chat interface
3. Go to `/feedback` and submit a test form
4. Check **Netlify Dashboard** → **Forms** for submissions
5. Check **Netlify Dashboard** → **Functions** for logs

---

## 📊 Monitoring

### Netlify Dashboard

**Functions Tab:**
- View request counts
- See error logs
- Monitor performance
- Check response times

**Forms Tab:**
- View all submissions
- Export data to CSV
- Configure email notifications
- Check spam submissions

**Deploys Tab:**
- See deployment history
- View build logs
- Roll back if needed
- Trigger manual deploys

---

## 🔐 Security

### Configured Security Features
- ✅ API keys stored server-side (not in frontend)
- ✅ HTTPS automatic (Let's Encrypt SSL)
- ✅ Security headers (X-Frame-Options, XSS Protection, CSP)
- ✅ CORS headers configured
- ✅ Spam protection on forms (honeypot)
- ✅ Environment variables encrypted by Netlify

### Security Headers (in netlify.toml)
```toml
[headers.values]
  X-Frame-Options = "DENY"
  X-XSS-Protection = "1; mode=block"
  X-Content-Type-Options = "nosniff"
  Referrer-Policy = "strict-origin-when-cross-origin"
  Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
```

---

## 🆘 Troubleshooting

### Functions returning 500 errors?
1. Check environment variables in Netlify Dashboard
2. View function logs: **Netlify Dashboard** → **Functions** → Click function
3. Verify `HUGGINGFACE_API_KEY` is set correctly
4. Check HuggingFace API status

### Forms not working?
1. Forms only work on deployed sites (not localhost)
2. Ensure form has `data-netlify="true"` attribute ✅
3. Check **Netlify Dashboard** → **Forms** for submissions
4. Look for JavaScript errors in browser console

### Build failing?
1. Check build logs: **Netlify Dashboard** → **Deploys** → Click deploy
2. Verify all dependencies are in `package.json`
3. Ensure build command is correct: `cd frontend && npm run build`
4. Check Node.js version compatibility

### Custom domain SSL not provisioning?
1. Verify DNS records point to Netlify
2. Wait 2-5 minutes for SSL provisioning
3. Check **Netlify Dashboard** → **Domain settings** → **HTTPS**
4. Contact Netlify support if stuck after 24 hours

### HuggingFace rate limits?
- Free tier: ~30 requests/hour per model
- Implement request caching
- Add rate limiting in functions
- Consider HuggingFace Pro ($9/month) for higher limits

---

## 📚 Resources

- **Netlify Docs**: https://docs.netlify.com
- **Netlify Functions**: https://docs.netlify.com/functions/overview/
- **Netlify Forms**: https://docs.netlify.com/forms/setup/
- **HuggingFace API**: https://huggingface.co/docs/api-inference
- **Netlify Community**: https://answers.netlify.com

---

## ✅ Deployment Checklist

Before deploying, ensure:

- [ ] Code committed and pushed to GitHub
- [ ] HuggingFace API key ready (https://huggingface.co/settings/tokens)
- [ ] Netlify account created (https://netlify.com)
- [ ] Repository connected to Netlify
- [ ] Environment variables configured in Netlify
- [ ] Build completes successfully
- [ ] Functions tested locally (optional)
- [ ] Custom domain configured (optional)

---

## 🎉 Success!

Your FairMediator project is now running on Netlify with:
- ✅ Serverless functions (125k free requests/month)
- ✅ Form handling (100 free submissions/month)
- ✅ Free SSL certificate
- ✅ Global CDN
- ✅ Auto-deploy from Git

**Monthly Cost: $0** 🎊

Need help? Check the troubleshooting section or visit the Netlify Community forum.
