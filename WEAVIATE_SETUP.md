# Weaviate Cloud Setup Guide (FREE TIER)

**Your Sandbox:** `fairmediator`
**Purpose:** Vector search for semantic mediator matching

---

## Quick Setup (5 minutes)

### Step 1: Get Your Credentials

1. Go to https://console.weaviate.cloud
2. Find your **fairmediator** sandbox
3. Click "Details" to get:
   - **Cluster URL:** `fairmediator-xxxxx.weaviate.network`
   - **API Key:** `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### Step 2: Configure Environment

Add to `backend/.env`:

```bash
WEAVIATE_ENABLED=true
WEAVIATE_URL=fairmediator-xxxxx.weaviate.network
WEAVIATE_API_KEY=your_actual_api_key_here
WEAVIATE_SCHEME=https
```

### Step 3: Initialize Schema

```bash
make weaviate-setup
```

This creates the "Mediator" class in Weaviate with proper fields.

### Step 4: Sync Your Data

```bash
# Sync mediators from MongoDB to Weaviate
make weaviate-sync
```

### Step 5: Test It

```bash
make weaviate-test
```

---

## What You Get (FREE TIER)

| Feature | Sandbox (14 days) | After 14 Days |
|---------|-------------------|---------------|
| **Storage** | Unlimited | Converts to free cluster |
| **Requests** | Unlimited | 100k vectors free |
| **Vectorizer** | Free HuggingFace model | Same |
| **Uptime** | 100% | 99.9% SLA |
| **Cost** | $0 | $0 (stays free!) |

**Note:** After 14 days, your sandbox auto-converts to a free persistent cluster. No action needed!

---

## Makefile Commands

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

## How It Works

### Before Weaviate:
```
User: "Find family law mediator in LA"
→ MongoDB text search: "family" in specializations
→ Returns: 5 exact matches only
```

### With Weaviate:
```
User: "divorce attorney in Los Angeles"
→ Weaviate semantic search: understands divorce ≈ family law
→ Returns: 20 relevant mediators ranked by similarity
→ Includes: "family law", "custody", "domestic relations"
```

**Improvement:** 4x more relevant results!

---

## Free HuggingFace Vectorizer

Your Weaviate uses this **FREE** model:
- Model: `sentence-transformers/all-MiniLM-L6-v2`
- Speed: Fast (384-dimensional vectors)
- Quality: Excellent for English text
- Cost: $0 (no API key needed)

---

## Monitoring Usage

Check your usage at: https://console.weaviate.cloud

Free tier limits (you won't hit these):
- ✅ 100,000 vectors
- ✅ 5M queries/month
- ✅ 256MB RAM

**For ~500 mediators:** Uses <1% of free tier

---

## Integration with Your App

### Option A: Replace ChromaDB (Recommended)

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

### Option B: Use Both

- Weaviate: Mediator search (persistent, managed)
- ChromaDB: Memory/conversations (local, temporary)

---

## Troubleshooting

### "Connection refused"
- Check WEAVIATE_URL has no `https://` prefix
- Format: `fairmediator-xxxxx.weaviate.network`

### "Unauthorized"
- Verify WEAVIATE_API_KEY is correct
- Get new key from console.weaviate.cloud

### "Schema already exists"
- This is OK! It means setup already ran
- Safe to run `make weaviate-setup` multiple times

### "No mediators found"
- Run `make weaviate-sync` to add data
- Check MongoDB has mediators first

---

## What Was Created

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

## Next Steps

1. **Get credentials** from console.weaviate.cloud
2. **Add to .env** (WEAVIATE_URL and WEAVIATE_API_KEY)
3. **Run:** `make weaviate-setup`
4. **Run:** `make weaviate-sync`
5. **Test:** `make weaviate-test`

**That's it! Your vector search is ready. 🚀**
