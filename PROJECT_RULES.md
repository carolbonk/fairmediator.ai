# FairMediator Project Rules

> **⚠️ CRITICAL: Read before making any changes to the project**

**Last Updated:** January 2, 2026

---

## 📑 Table of Contents

1. [Token Optimization Rules](#-token-optimization-rules) ⭐ **NEW**
2. [No Duplication Rule](#-rule-1-no-duplication)
3. [Documentation Structure](#-current-documentation-structure-approved)
4. [Setup Files](#-setup-documentation) ⭐ **NEW**
5. [Code Organization](#-code-organization-rules)
6. [Naming Conventions](#-naming-conventions)
7. [Update Rules](#-update-contextmd-rule)

---

## 🎯 Token Optimization Rules

> **CRITICAL: All AI/LLM features MUST stay within FREE TIER limits**

### Rule: Free Tier Protection

**ALWAYS implement these safeguards when using AI services:**

1. **Caching is MANDATORY for repeated operations**
   - ✅ Use Redis caching for ideology classification, RAG searches, embeddings
   - ✅ Set TTL appropriately (5-10 minutes for searches, longer for static data)
   - ❌ NEVER call the same AI endpoint twice with the same input

2. **Daily Limits MUST be enforced**
   - ✅ Implement rate limiting: 9,000 Redis commands/day (90% of free tier)
   - ✅ Auto-disable cache when limit approached
   - ✅ Log when approaching limits
   - ❌ NEVER exceed free tier without explicit user approval

3. **Optimize AI Calls**
   - ✅ Batch operations when possible
   - ✅ Cache embeddings and classifications
   - ✅ Make cron jobs optional (default: disabled in development)
   - ❌ NEVER make sequential AI calls when one call can do the job
   - ❌ NEVER enable auto-scraping without user consent

4. **Dead Code MUST be removed**
   - ✅ Remove unused AI systems (agentSystem, chainSystem if not connected)
   - ✅ Comment out or delete unused endpoints
   - ❌ NEVER keep "nice to have" features that consume tokens without being used

### What Consumes Tokens

**High Impact (optimize first):**
- chatService: 2-5 AI calls per user request
- cronScheduler: 150+ calls per week (auto-scraping)
- RAG engine: 1-2 calls per search

**Medium Impact:**
- Ideology classification: 1 call per unique message
- Conflict detection: 1 call per mediator check

**Zero Impact (safe to use):**
- swotGenerator: Rule-based, no AI
- Simple text parsing: Regex/keyword matching

### Configuration Requirements

**Every AI service file MUST:**
1. Check if service is enabled via env var
2. Have graceful fallback if disabled
3. Log token usage for monitoring
4. Respect daily limits

**Example:**
```javascript
class AIService {
  constructor() {
    this.enabled = process.env.SERVICE_ENABLED === 'true';
    this.dailyLimit = parseInt(process.env.DAILY_LIMIT || '9000');
    this.callCount = 0;
  }

  async call() {
    if (!this.enabled) return defaultValue;
    if (this.callCount >= this.dailyLimit) {
      logger.warn('Daily limit reached');
      return cachedValue;
    }
    // Make AI call...
  }
}
```

### Before Adding New AI Features

**Checklist:**
- [ ] Is this feature absolutely necessary?
- [ ] Can it use caching to reduce calls?
- [ ] Does it have a daily limit?
- [ ] Can it be disabled via environment variable?
- [ ] Have you documented token impact in CONTEXT.md?
- [ ] Does it stay within free tier limits?

### See Also
- `TOKEN_OPTIMIZATION_SUMMARY.md` - Complete analysis
- `REDIS_SETUP.md` - Caching implementation
- `SETUP.md` - All setup guides consolidated

---

## 🚨 Rule #1: NO DUPLICATION

### Documentation Files
- **ONE file per topic** - No multiple files covering the same subject
- Before creating a new `.md` file, check if existing file covers the topic
- Before deleting any file, verify ALL content is preserved in the consolidated file

### Code Files
- **DRY Principle** - Don't Repeat Yourself
- Extract shared logic into utilities/services
- No copy-paste code between components

---

## 📁 Current Documentation Structure (APPROVED)

### Core Documentation
```
README.md                  - Main project overview & quick start
CONTEXT.md                 - Project state, progress, next steps (ALWAYS update)
CONTRIBUTING.md            - How to contribute
SECURITY.md                - Security policies & practices
TESTING.md                 - Testing guidelines
PROJECT_RULES.md           - This file (project rules)
```

### Deployment Documentation
```
SETUP.md → Production Deployment  - MASTER deployment guide (both options)
├── Option 1: Netlify Functions   - Serverless (recommended)
└── Option 2: Render + Netlify    - Traditional backend

DEPLOYMENT.md             - Quick reference → redirects to SETUP.md Option 2
NETLIFY.md                - Quick reference → redirects to SETUP.md Option 1
```

**When deploying:**
- **Always use SETUP.md** as primary reference
- DEPLOYMENT.md and NETLIFY.md are quick reference files only

### Setup Documentation
```
SETUP.md                   - Master setup guide (ALL setup instructions)
├── Redis Setup            - Caching for token optimization
├── Weaviate Setup         - Vector database for semantic search
├── Environment Setup      - .env configuration
└── Development Setup      - Local development environment
```

### Optimization Documentation
```
TOKEN_OPTIMIZATION_SUMMARY.md  - Token usage analysis & optimization strategies
REDIS_SETUP.md                 - Detailed Redis caching guide (linked from SETUP.md)
WEAVIATE_SETUP.md              - Detailed Weaviate guide (linked from SETUP.md)
```

**⚠️ Do NOT create separate setup files - use SETUP.md as the master guide**

---

## ✅ Before Creating New Documentation

1. **Check existing files** - Can this be added to an existing .md file?
2. **Ask yourself**: "Does this duplicate ANY existing documentation?"
3. **If yes**: Update existing file, don't create new one
4. **If no**: Create new file with clear, unique purpose

---

## ✅ Before Deleting Any File

1. **Read the entire file** - Understand all content
2. **Check dependencies** - Is it referenced elsewhere?
3. **Verify consolidation** - Is ALL content preserved in consolidated file?
4. **Compare line-by-line** - Don't rely on assumptions
5. **Get approval** - Ask before deleting

---

## 📋 File Creation Checklist

Before adding a new file to the project root:

- [ ] Checked if existing file can be updated instead
- [ ] Verified no duplication with existing content
- [ ] File has a clear, unique purpose
- [ ] File name is descriptive and follows convention
- [ ] Added to this rules document (if it's documentation)

---

## 📋 File Deletion Checklist

Before deleting ANY file:

- [ ] Read the entire file to understand content
- [ ] Verified ALL content is preserved elsewhere
- [ ] Checked for references in other files
- [ ] Tested that nothing breaks without this file
- [ ] Got user approval for deletion

---

## 🔧 Code Organization Rules

### Component Structure
```
frontend/src/
├── components/          - Reusable UI components
├── pages/              - Page-level components
├── services/           - API calls, business logic
├── utils/              - Helper functions
└── contexts/           - React contexts
```

### Backend Structure
```
backend/src/
├── routes/             - API endpoints
├── models/             - Database models
├── services/           - Business logic
│   ├── huggingface/    - HF API integration
│   ├── ai/             - AI services (RAG, embeddings)
│   └── learning/       - Active learning system
├── middleware/         - Express middleware
└── utils/              - Helper functions
```

---

## 🎯 Naming Conventions

### Documentation Files
- Use UPPERCASE for root-level docs: `README.md`, `DEPLOYMENT.md`
- Use descriptive names: `NETLIFY.md` not `SETUP.md`
- One topic per file: `SECURITY.md` not `SECURITY_AND_TESTING.md`

### Code Files
- Components: PascalCase - `FeedbackForm.jsx`
- Services: camelCase - `chatService.js`
- Utils: camelCase - `apiFactory.js`
- Constants: UPPER_SNAKE_CASE - `API_CONSTANTS.js`

---

## 🔄 Update CONTEXT.md Rule

**CRITICAL: After completing ANY significant work:**

1. **ALWAYS check PROJECT_RULES.md FIRST** before starting work
2. Open `CONTEXT.md`
3. Update "Last Updated" date
4. Add entry under "Recent Changes"
5. Update relevant status sections
6. This is NOT optional - ALWAYS do this

**Before Every Task:**
- Read PROJECT_RULES.md to understand current rules
- Check token optimization rules if working with AI features
- Follow established patterns and conventions

---

## 🚫 What NOT to Do

### Documentation
- ❌ Don't create `GUIDE.md` when `README.md` exists
- ❌ Don't create `SETUP.md` when setup is in `README.md`
- ❌ Don't create multiple deployment guides for the same stack
- ❌ Don't create temporary instruction files (delete after use)

### Code
- ❌ Don't copy-paste functions between files
- ❌ Don't duplicate API calls in multiple components
- ❌ Don't create multiple services doing the same thing
- ❌ Don't bypass established patterns

---

## ✅ What TO Do

### Documentation
- ✅ Update existing files when adding related content
- ✅ Keep files focused on ONE topic
- ✅ Add clear headers explaining file purpose
- ✅ Cross-reference related documentation

### Code
- ✅ Extract shared logic into services/utils
- ✅ Use existing patterns and conventions
- ✅ Import from single source of truth
- ✅ Follow DRY principle religiously

---

## 📊 Current Project Stats

**Root Documentation Files:** 7
- README.md
- CONTEXT.md
- CONTRIBUTING.md
- SECURITY.md
- TESTING.md
- DEPLOYMENT.md
- NETLIFY.md
- PROJECT_RULES.md (this file)

**Netlify Functions:** 2
- chat.js
- check-affiliations.js

**Frontend Pages:** 6+
**Backend Services:** 20+

---

## 🎯 Consolidation Completed

**Date:** December 30, 2024

**Actions Taken:**
- ✅ Consolidated 4 Netlify docs into 1 (NETLIFY.md)
- ✅ Deleted duplicates: NETLIFY_SETUP.md, QUICK_START_NETLIFY.md, NETLIFY_INTEGRATION_SUMMARY.md, SETUP_COMPLETE.md
- ✅ Kept DEPLOYMENT.md separate (different architecture)
- ✅ Created this rules document

---

## 🔮 Future Rules

As the project grows, follow these principles:

1. **Question every new file** - Is it necessary?
2. **Consolidate aggressively** - Merge similar content
3. **Delete obsolete files** - Remove after consolidation
4. **Document decisions** - Update this file
5. **Review periodically** - Check for new duplication monthly

---

**Remember: LESS IS MORE. Quality over quantity. DRY over WET.**
