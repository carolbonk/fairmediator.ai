# API Keys Setup Guide

Quick guide to obtain **FREE** API keys for conflict detection.

## Required APIs (2)

- **FEC API**: Unlimited requests, campaign finance data
- **CourtListener RECAP**: 5,000 requests/day, federal court records

## ❌ OpenSecrets API - DISCONTINUED (April 15, 2025)

OpenSecrets shut down their public API after 17 years. If you need lobbying data, contact commercial@opensecrets.org for custom solutions. Our platform works without it.

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

## 3. Verify Keys Are Working

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

## Rate Limits

| API | Daily Limit | Cost |
|-----|-------------|------|
| **FEC** | Unlimited | FREE |
| **CourtListener** | 5,000 | FREE |

**Total Cost**: $0/month

---

## Troubleshooting

**"API key not found"**: Check `.env` file, restart server, verify no extra spaces

**"Rate limit exceeded"**:
- FEC: Use personal key (not DEMO_KEY)
- CourtListener: Wait 24 hours or contact support

**CourtListener token not working**: Use token string only (no "Token " prefix)
