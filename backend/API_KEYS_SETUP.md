# API Keys Setup Guide - AI Features

This guide walks you through obtaining **FREE** API keys for the AI Conflict Graph Analyzer and Settlement Predictor features.

---

## Overview

All three APIs are **100% FREE** for production use:
- **FEC API**: Unlimited requests, no rate limits
- **CourtListener RECAP**: 5,000 requests/day (enough for 150+ mediators/day)
- **OpenSecrets**: 200 requests/day (sufficient for our needs)

---

## 1. FEC API (Federal Election Commission)

**What it does**: Tracks campaign donations to detect political affiliations and potential conflicts.

**Cost**: FREE, unlimited requests

### Step-by-Step Setup:

1. **Visit the Developer Portal**:
   - Go to: https://api.open.fec.gov/developers/

2. **Get Your API Key** (no account required!):
   - Scroll down to the "Get API Key" section
   - Enter your email address
   - Click "Sign up"

3. **Check Your Email**:
   - You'll receive an email instantly with your API key
   - Subject: "Your API.data.gov API key"

4. **Add to .env File**:
   ```bash
   FEC_API_KEY=your_key_from_email_here
   ```

5. **Test Your Key**:
   ```bash
   curl "https://api.open.fec.gov/v1/candidates/?api_key=YOUR_KEY&sort=name"
   ```

**Tip**: You can use `DEMO_KEY` for testing, but it has stricter rate limits (40 req/hour). Get a real key for production!

---

## 2. CourtListener RECAP API

**What it does**: Searches federal court records to find shared cases and opposing counsel relationships.

**Cost**: FREE, 5,000 requests/day

### Step-by-Step Setup:

1. **Create a Free Account**:
   - Go to: https://www.courtlistener.com/register/
   - Fill out registration form (email + password)
   - Click "Sign Up"

2. **Verify Your Email**:
   - Check your inbox for verification email
   - Click the verification link

3. **Get Your API Token**:
   - Log in to CourtListener
   - Go to: https://www.courtlistener.com/help/api/rest/
   - Scroll down to the "Authentication" section
   - Your API token will be displayed (looks like: `Token 1234567890abcdef...`)

4. **Add to .env File**:
   ```bash
   RECAP_API_KEY=1234567890abcdef1234567890abcdef12345678
   ```
   *(Just the token part, without "Token " prefix)*

5. **Test Your Key**:
   ```bash
   curl -H "Authorization: Token YOUR_TOKEN" \
     "https://www.courtlistener.com/api/rest/v3/search/?q=mediation"
   ```

**Rate Limit**: 5,000 requests/day = ~208 requests/hour

---

## 3. OpenSecrets API

**What it does**: Tracks lobbying disclosures to detect corporate influence and potential conflicts.

**Cost**: FREE, 200 requests/day

### Step-by-Step Setup:

1. **Sign Up for API Access**:
   - Go to: https://www.opensecrets.org/api/admin/index.php?function=signup
   - Fill out the form:
     - **Name**: Your full name
     - **Email**: Your email address
     - **Organization**: (optional - you can put "Personal Project" or "Fair Mediator")
     - **Use Case**: "Mediator conflict of interest detection for legal mediation platform"
   - Click "Submit"

2. **Wait for Email** (usually within 1 hour, check spam folder):
   - Subject: "OpenSecrets.org API Registration"
   - Contains your API key (looks like: `abcdef1234567890`)

3. **Add to .env File**:
   ```bash
   OPENSECRETS_API_KEY=abcdef1234567890
   ```

4. **Test Your Key**:
   ```bash
   curl "http://www.opensecrets.org/api/?method=getLegislators&id=CA&apikey=YOUR_KEY&output=json"
   ```

**Rate Limit**: 200 requests/day (resets at midnight EST)

**Important**: If you don't receive the email within 24 hours, email api@crp.org with your registration details.

---

## 4. Verify All Keys Are Working

Once you've added all three keys to your `.env` file, test them:

```bash
# From backend directory
cd backend

# Start the backend server
npm run dev

# In a new terminal, test the conflict graph endpoint
curl http://localhost:5001/health

# Test FEC scraping (replace with actual mediator ID)
curl -X POST http://localhost:5001/api/graph/scrape-mediator \
  -H "Content-Type: application/json" \
  -d '{
    "mediatorId": "test123",
    "mediatorName": "John Smith",
    "sources": ["fec", "lobbying"]
  }'
```

---

## Rate Limit Summary

| API | Daily Limit | Hourly Limit | Cost |
|-----|-------------|--------------|------|
| **FEC** | Unlimited | Unlimited | FREE |
| **CourtListener** | 5,000 | ~208 | FREE |
| **OpenSecrets** | 200 | ~8 | FREE |

**Total Cost**: $0/month

---

## Troubleshooting

### "API key not found" error
- Check that you've added the key to `.env` file (not `.env.example`)
- Restart your backend server after updating `.env`
- Verify no extra spaces before/after the key

### "Rate limit exceeded" error
- **FEC**: Switch from `DEMO_KEY` to your personal key
- **CourtListener**: Wait 24 hours for limit reset, or contact support for higher limits
- **OpenSecrets**: Implement caching (already done in `base_scraper.js`)

### CourtListener token not working
- Make sure you're using just the token string, not "Token xyz..."
- Try regenerating your token in account settings

### OpenSecrets key request delayed
- Check spam folder
- Wait up to 24 hours (manual approval)
- Email api@crp.org if no response after 24 hours

---

## Security Best Practices

1. **Never commit `.env` to Git** (already in `.gitignore`)
2. **Use environment variables in production** (Netlify Env Vars)
3. **Rotate keys every 6 months** for security
4. **Monitor usage** via our `/api/monitoring` dashboard

---

## Next Steps

After adding all keys:
1. ✅ Test each API endpoint individually
2. ✅ Run `npm run dev` to start backend
3. ✅ Check `/api/monitoring` dashboard for usage stats
4. ✅ Proceed to data collection: `python backend/src/ml_models/settlement_predictor/data/collect_fca_data.py`

---

**Questions?** Check the main [AI_FEATURES_README.md](./AI_FEATURES_README.md) for full documentation.
