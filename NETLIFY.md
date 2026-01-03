# Netlify Serverless Deployment

> **📋 This file has moved to [SETUP.md](./SETUP.md#-production-deployment)**
>
> **Quick link:** [SETUP.md → Production Deployment → Option 1](./SETUP.md#option-1-serverless-netlify-functions---recommended-)

---

## Serverless Deployment (Netlify Functions)

**For complete step-by-step instructions, see:**
**[SETUP.md → Production Deployment → Option 1](./SETUP.md#option-1-serverless-netlify-functions---recommended-)**

**TL;DR:**
- Frontend + Backend: Netlify Functions (serverless)
- Database: MongoDB Atlas (free M0)
- Cost: $0/month, 125k requests/month

**Best for:** Simple apps, quick deployment, no maintenance

---

## Quick Deploy (3 minutes)

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

**All detailed instructions in:** [SETUP.md](./SETUP.md#-production-deployment)

---

## What's Included

- **Netlify Functions:** `/.netlify/functions/chat`, `/.netlify/functions/check-affiliations`
- **Netlify Forms:** Feedback system at `/feedback`
- **Auto SSL:** Free HTTPS via Let's Encrypt
- **Global CDN:** Fast worldwide delivery

**See [SETUP.md](./SETUP.md#what-gets-deployed) for complete details**
