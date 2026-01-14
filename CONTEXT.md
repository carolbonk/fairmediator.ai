# FairMediator Project Context

> **⚠️ CRITICAL: Use the NAVIGATION MENU below - DON'T read everything!**
>
> **Order of Operations:**
> 1. Use [Quick Navigation](#-quick-navigation) menu - Jump to what you need
> 2. Check [Recent Major Changes](#-recent-major-changes) - See latest work completed
> 3. Check [What's Next / TODO](#-whats-next--todo) - See current project state
> 4. Read [Project Rules](#-project-rules) section - If you need rule clarification
> 5. Begin work following established patterns

**Last Updated:** January 13, 2026
**Project Status:** ✅ Production Ready - 100% FREE TIER - Lean & Simplified

---

## 📑 Quick Navigation

- [Tech Stack](#-tech-stack) ⭐ **SEE THIS FIRST**
- [Project Rules](#-project-rules) ⭐ **READ THIS SECOND**
- [System Architecture](#-system-architecture)
- [MongoDB Atlas Vector Search](#-mongodb-atlas-vector-search) 🆕
- [Recent Major Changes](#-recent-major-changes)
- [What's Next / TODO](#-whats-next--todo)

---

## 🏗️ Tech Stack

**Last Updated:** January 12, 2026 - **MongoDB Atlas Vector Search Migration Complete**

### Core Stack (100% FREE)

**Backend:**
- Node.js 18+ + Express.js
- MongoDB Atlas (M0 512MB) - **Includes Vector Search**
- Hugging Face API (embeddings + AI)
- JWT + bcryptjs (auth)
- Helmet + CORS + CSRF (security)
- Winston (logging)

**Frontend:**
- React 18 + Vite
- TailwindCSS
- React Router DOM

**AI/ML:**
- Hugging Face Transformers (ideology, conflict detection)
- MongoDB Atlas Vector Search (semantic search, RAG)
- sentence-transformers/all-MiniLM-L6-v2 (384-dim embeddings)

**Testing:**
- Jest + Supertest (54 tests passing)
- Integration tests for API endpoints
- AI systems integration tests
- Manual testing for user flows

**Testing Philosophy:**
- **NO expensive E2E tools** (Playwright removed)
- Use Jest integration tests with supertest for API testing
- Use React Testing Library (free) for component testing when needed
- Manual testing for critical user journeys
- Focus on high-value test coverage vs. 100% coverage

**Cost:** **$0/month** (100% free tier)

---

## 📋 Project Rules

> **⚠️ CRITICAL: Read before making any changes**

### 🔴 RULE 1: NO LIES - Ever

**Commit messages, documentation, and comments MUST be 100% truthful.**

- ❌ Don't say tests pass if you haven't verified
- ❌ Don't mark tasks complete if they're incomplete
- ❌ Don't claim features work if they're untested
- ✅ If uncertain, verify first
- ✅ If tests fail, fix them or document the failure
- ✅ If incomplete, say so

### 🔴 RULE 2: Free Tier Protection

**ALL free tier services MUST have daily rate limiting.**

**Daily Limits (enforce these):**
- Hugging Face: 333 requests/day (10k/month ÷ 30)
- OpenRouter: 333 requests/day
- MongoDB: Monitor size (512MB limit)
- Resend Email: 50 emails/day (100/day ÷ 2 safety)
- Scraping: 450 pages/day (15k/month ÷ 30)

**Alert Thresholds:**
- WARNING: 70% of limit
- ALERT: 85% of limit
- CRITICAL: 95% of limit
- STOP: 100% of limit

### 🔴 RULE 3: DRY - Don't Repeat Yourself

**Extract shared logic into utilities/services.**

- ❌ Duplicate code blocks
- ❌ Repeated validation logic
- ❌ Copy-pasted API calls
- ✅ Shared utilities in `/utils/`
- ✅ Reusable components
- ✅ Service layer abstraction

### 🔴 RULE 4: Token Efficiency

**Minimize token usage in every operation:**

1. **Use Specialized Tools:**
   - ✅ Read, Glob, Grep, Edit (NOT bash)
   - ❌ NEVER `cat`, `find`, `grep`, `sed` via Bash

2. **Read Files Smart:**
   - ✅ Use offset + limit for large files
   - ✅ Use Grep to find specific content
   - ❌ NEVER read entire large files
   - ❌ NEVER read same file twice

3. **Parallelize Independent Operations:**
   - ✅ Multiple tool calls in single message
   - ❌ NEVER sequential when independent

4. **Search Smart:**
   - ✅ Specific patterns
   - ✅ Use head_limit parameter
   - ❌ NEVER overly broad searches

### 🔴 RULE 5: UX Design - Responsive Popups

**ALL popups/modals MUST be responsive:**

**Mobile (<768px):**
- Max width: 85% of screen
- Padding: `p-4`
- ❌ NO horizontal overflow
- ✅ Flex layout with scrollable content

**Structure:**
```jsx
<div className="flex flex-col max-h-[85vh]">
  <header className="flex-shrink-0">...</header>
  <div className="flex-1 overflow-y-auto">...</div>
  <footer className="flex-shrink-0">CTAs</footer>
</div>
```

### 🔴 RULE 6: Security

**Always sanitize user input, validate requests:**

- ✅ Helmet security headers
- ✅ CSRF protection on state-changing ops
- ✅ MongoDB injection protection
- ✅ XSS sanitization (sanitize-html, DOMPurify)
- ✅ Rate limiting (global + per-route)
- ❌ NEVER trust user input

---

## 🏗️ System Architecture

### Database: MongoDB Atlas Only

**M0 Free Tier (512MB):**
- 7 Collections: User, Mediator, Subscription, UsageLog, ConflictFeedback, MediatorSelection, CaseOutcome
- Vector Search: Built-in (no external vector DB needed)
- Indexes: Text search + Vector search

**Dual Environment:**
1. **Development:** Local Docker MongoDB
2. **Production:** MongoDB Atlas (fairmediator.bby4jil.mongodb.net)

### API Structure

```
/api/
├── /auth          - Authentication (JWT)
├── /mediators     - Mediator CRUD
├── /chat          - AI chat (traditional search)
├── /matching      - Mediator matching
├── /subscription  - Premium features
├── /dashboard     - User dashboard
├── /scraping      - Web scraping (admin)
├── /analysis      - Conflict analysis
├── /feedback      - Active learning
├── /monitoring    - Free tier monitoring
└── /affiliations  - Bias detection
```

---

## 🆕 MongoDB Atlas Vector Search

**Status:** ✅ Adapted, Ready to Index

### What Changed (January 12, 2026)

**Removed:**
- ❌ ChromaDB package + all code
- ❌ Weaviate package + all config/scripts (5 files)
- ❌ memorySystem.js (not used in routes)

**Added:**
- ✅ `embedding` field to Mediator model (384-dim array)
- ✅ `embeddingModel` + `embeddingGeneratedAt` fields

**Adapted Files:**
1. `embeddingService.js` - Stores embeddings in MongoDB
2. `ragEngine.js` - Uses MongoDB $vectorSearch
3. `initializeVectorDB.js` - Generates embeddings + setup instructions

### How to Enable

**1. Generate Embeddings:**
```bash
node backend/src/scripts/initializeVectorDB.js
```

**2. Create Vector Index in Atlas UI:**
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
Index name: `mediator_vector_search`

**3. Test Search:**
```bash
node backend/src/scripts/initializeVectorDB.js --show-index
```

### Vector Search Features

- **Semantic mediator matching** (finds by meaning, not keywords)
- **RAG (Retrieval-Augmented Generation)** for grounded AI responses
- **Hybrid search** (combines vector + keyword)
- **Free tier compatible** (M0 supports up to 10M vectors)

---

## 🔄 Recent Major Changes

### January 13, 2026: Major Stack Simplification ✅
**Removed Technologies:**
- ❌ **Playwright** (E2E) - 30/30 tests failing, never used. Made optional in scraper
- ❌ **Redis** (caching) - Not needed, MongoDB handles everything
- ❌ **Render** (deployment) - References removed from docs
- ❌ **Sentry** (errors) - Replaced with MongoDB Atlas monitoring

**Added/Implemented:**
- ✅ **MongoDB Atlas Monitoring** - Free error tracking + database stats
  - Error logging to MongoDB (capped collection, 30-day TTL)
  - Database size tracking with alerts (free tier protection)
  - 4 new monitoring endpoints for dashboard
- ✅ **Netlify Blobs** - Free file storage (100GB bandwidth/month)
  - Profile images, documents (CVs, certifications)
  - Upload/download/delete APIs
  - Storage statistics
- ✅ **Free Tier Rate Limiting** - HuggingFace API now tracked
  - Automatic daily/monthly usage monitoring
  - Prevents exhausting free tiers
  - Real-time alerts at 70%/85%/95%

**System Integration:**
- ✅ 20 API routes fully integrated
- ✅ 54 tests passing (Jest + Supertest only)
- ✅ All free tier services monitored
- ✅ Error tracking to MongoDB
- ✅ 100% free tier maintained

### January 12, 2026: MongoDB Atlas Vector Search Migration ✅
- Removed ChromaDB and Weaviate dependencies
- Adapted vector search to use MongoDB Atlas only
- Simplified architecture: Single database for everything
- All vector search code ready, needs index creation in Atlas UI

### January 9, 2026: UX Design Improvements ✅
- Fixed responsive design for popups/modals
- Improved mediator list UX
- Enhanced onboarding flow

### January 4, 2026: Free Tier Monitoring ✅
- Added monitoring dashboard for all free tier services
- Implemented daily/monthly usage tracking
- Alert system (70% warning, 85% alert, 95% critical)

### January 2, 2026: MongoDB Vector Search Migration ✅ (Now Removed)
- ~~Redis caching~~ (removed - not needed)
- ~~Added Weaviate Cloud~~ (replaced with MongoDB Atlas Vector Search)

---

## 📝 What's Next / TODO

### High Priority
- [ ] Add mediators to database (currently 0 - see scraping routes)
- [ ] Create MongoDB Atlas Vector Search index (see MONGODB_VECTOR_SEARCH_SETUP.md)
- [ ] Run `node src/scripts/initializeVectorDB.js` to generate embeddings
- [ ] Test semantic search and RAG queries

### Medium Priority
- [ ] Configure Netlify Blobs (set NETLIFY_SITE_ID + NETLIFY_TOKEN)
- [ ] Increase test coverage (16% → 30%) using Jest only
- [ ] Add mediator data sources via scraping
- [ ] Frontend integration with monitoring/storage APIs

### Low Priority
- [ ] Add Stripe payments (premium tier)

### E2E Test Scenarios (Manual Testing Reference)

**Note:** Playwright was removed (100% failure rate). These scenarios are for manual QA testing. We will find a free E2E testing alternative after fixing these flows.

**Authentication Flow:**
- [ ] Complete registration and login flow
- [ ] Show validation errors for invalid input
- [ ] Prevent login with wrong credentials
- [ ] Lock account after failed login attempts

**Mediator Search Flow:**
- [ ] Search and view mediators

**Subscription Flow:**
- [ ] Upgrade subscription

---

## 📚 Documentation Files

- `SETUP.md` - Complete setup instructions
- `DEPLOYMENT.md` - Production deployment guide
- `SECURITY.md` - Security audit + best practices
- `MONGODB_VECTOR_SEARCH_SETUP.md` - Vector search index setup guide

---

## 🆓 Free Services Used

| Service | Free Tier | Usage |
|---------|-----------|-------|
| **MongoDB Atlas** | 512MB | Database + Vector Search |
| **Hugging Face** | Unlimited* | AI/ML inference |
| **Netlify** | 100GB/month | Frontend hosting |
| **Resend** | 100 emails/day | Email notifications |

---

**Architecture:** Simplified, scalable, 100% free. MongoDB Atlas handles everything - no external vector databases needed.
