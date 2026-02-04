# Development Plan - FairMediator

**Created:** February 3, 2026
**Last Updated:** February 3, 2026 (Evening)
**Status:** Active Development - Hybrid Search ✅ Complete, Active Learning ✅ Complete

---

## 📋 Overview

Five major development phases to scale FairMediator to production:

1. ✅ **Hybrid Vector/Keyword Search** - COMPLETE (0.7 vector + 0.3 keyword scoring)
2. ✅ **Active Learning Pipeline** - COMPLETE (F1 tracking, 9 API endpoints, daily cron)
3. ⏳ **50-State Scraping** - IN PROGRESS (target: 5k mediators by Feb 24)
4. ⏳ **Enhanced Affiliation Detection** - NEXT (LinkedIn/RECAP cross-referencing, red/yellow/green tags)
5. ⏳ **User Acquisition & Monetization** - NEXT ($49/mo premium, South Florida law firm outreach)

---

## 1. 🔍 Hybrid Vector/Keyword Search Enhancement

### Current State ✅
- **Vector search implemented** (`ragEngine.js`) - MongoDB Atlas $vectorSearch
- **Semantic matching** - Using sentence-transformers embeddings (384-dim)
- **Basic RAG pipeline** - Retrieval + LLM generation
- **Similarity threshold** - 0.5 minimum, topK=10
- **Fallback to traditional search** - When vector search fails

### Gaps (Updated Feb 3, 2026) ✅ MOSTLY RESOLVED
- ✅ Keyword-based boosting implemented (weighted text indexes)
- ✅ Hybrid ranking algorithm complete (0.7 vector + 0.3 keyword)
- ✅ BM25-style scoring via MongoDB text search
- ✅ Field-level boosting (bio:10, name:8, specializations:6, etc.)
- ✅ Query expansion with synonym mapping
- ⏳ Frontend integration pending
- ⏳ Fuzzy matching for typos (future enhancement)

### Implementation Plan 📝

#### Phase 1: Keyword Search Foundation ✅ COMPLETE (Feb 3, 2026)
**Files created/modified:**
- ✅ `backend/src/services/ai/keywordSearchService.js` - NEW file created
- ✅ `backend/src/models/Mediator.js` - Text indexes added (lines 366-382)

**What we built:**
1. ✅ MongoDB text indexes with 7 fields (exceeded plan):
   ```javascript
   // Actual implementation in Mediator.js
   mediatorSchema.index(
     {
       bio: 'text',              // NEW: Professional description
       name: 'text',
       specializations: 'text',
       lawFirm: 'text',
       'location.city': 'text',  // NEW: Separate city/state
       'location.state': 'text',
       tags: 'text'              // NEW: Tag support
     },
     {
       name: 'mediator_text_search',
       weights: {
         bio: 10,                // Highest - most descriptive
         name: 8,
         specializations: 6,
         lawFirm: 3,
         'location.city': 2,
         'location.state': 2,
         tags: 1
       }
     }
   );
   ```

2. ✅ Created `keywordSearchService.js` with 5 methods:
   - `search()` - BM25-style MongoDB text search with score normalization
   - `expandQuery()` - Synonym expansion (family law → divorce, custody, child support)
   - `searchWithExpansion()` - Auto-fallback to expanded query if no results
   - `buildFilters()` - Convert options to MongoDB query filters
   - `getSuggestions()` - Autocomplete for search queries

#### Phase 2: Hybrid Ranking Algorithm ✅ COMPLETE (Feb 3, 2026)
**Files created:**
- ✅ `backend/src/services/ai/hybridSearchService.js` - NEW file created
- ✅ `backend/src/routes/mediators.js` - Added hybrid search endpoints

**What we built:**
1. ✅ Hybrid ranking with configurable weights:
   ```javascript
   // Actual implementation in hybridSearchService.js
   class HybridSearchService {
     constructor() {
       this.vectorWeight = 0.7;   // Semantic understanding
       this.keywordWeight = 0.3;  // Exact/fuzzy matching
     }

     async search(query, options) {
       // 1. Parallel execution for speed
       const [vectorResults, keywordResults] = await Promise.all([
         embeddingService.searchSimilar(query, { topK: vectorTopK }),
         keywordSearchService.search(query, { topK: keywordTopK })
       ]);

       // 2. Merge and score with weighted formula
       const hybridScore = (this.vectorWeight * vectorScore) +
                          (this.keywordWeight * keywordScore);

       // 3. Return sorted by hybrid score
       return { results, metadata };
     }

     async searchWithIdeologyBoost(query, options) {
       // 20% boost for ideology preference matching
       if (matchesIdeology) {
         result.hybridScore = Math.min(result.hybridScore * 1.2, 1.0);
       }
     }

     setWeights(vectorWeight, keywordWeight) {
       // Configurable for A/B testing
     }
   }
   ```

2. ✅ API endpoints added to `mediators.js`:
   - `POST /api/mediators/search/hybrid` - Main search endpoint with ideology boost
   - `GET /api/mediators/search/config` - Get current weights for A/B testing

3. ⏳ A/B testing (TODO):
   - Track click-through rates
   - Measure user satisfaction
   - Log search result relevance

#### Phase 3: Advanced Features ⏳ IN PROGRESS
**Completed enhancements:**
1. ✅ **Query expansion** - Synonym mapping in keywordSearchService
2. ✅ **Faceted search** - Filter by location, experience, specialization
3. ✅ **Ideology boost** - 20% score boost for preference matching

**Remaining enhancements:**
1. ⏳ **Fuzzy matching** - Handle typos in mediator names (Levenshtein distance)
2. ⏳ **Boosting by freshness** - Prefer recently updated profiles
3. ⏳ **Personalized ranking** - Based on user's previous selections
4. ⏳ **Frontend integration** - Wire up hybrid search in React UI

**Files to modify:**
- ✅ `backend/src/routes/mediators.js` - `/search/hybrid` endpoint added
- ⏳ `frontend/src/services/api.js` - Add hybrid search API call
- ⏳ `frontend/src/components/MediatorSearch.jsx` - Use hybrid search

#### Success Metrics 📊
- ✅ Hybrid search API endpoint functional (`POST /api/mediators/search/hybrid`)
- ✅ Ideology boost implemented (20% score increase)
- ✅ Configurable weights for A/B testing (`setWeights()` method)
- ⏳ Hybrid search returns results for 95%+ queries (needs production testing)
- ⏳ Top-3 results contain at least 1 highly relevant mediator (needs user feedback)
- ⏳ Search latency < 500ms (p95) - needs load testing
- ⏳ F1 score improved by 10%+ over vector-only - needs evaluation

---

## 2. Active Learning Pipeline + F1 Tracking

### Current State ✅
- **Feedback collection** - `/api/feedback/conflict` endpoint
- **ConflictFeedback model** - Stores predictions vs. human labels
- **Retraining script** - `retrainConflictModel.js` (manual export)
- **Validation schema** - Joi validation for feedback

### Gaps (Updated Feb 3, 2026) ✅ MOSTLY RESOLVED
- ✅ F1 score calculation implemented
- ✅ Model versioning system complete
- ✅ Daily F1 tracking cron job (3 AM)
- ✅ API endpoints for model management (9 endpoints)
- ⏳ Automated retraining pipeline (export ready, training manual)
- ⏳ A/B testing infrastructure for model versions
- ⏳ Confidence threshold tuning
- ⏳ Feedback loop triggers (when to retrain?)

### Implementation Plan 📝

#### Phase 1: F1 Score Tracking ✅ COMPLETE (Feb 3, 2026)
**Files created:**
- ✅ `backend/src/services/ai/modelMetrics.js` - F1 calculation service
- ✅ `backend/src/models/ModelVersion.js` - Model versioning schema
- ✅ `backend/src/services/cronJobs/dailyModelEvaluation.js` - Daily cron job
- ✅ `backend/src/routes/models.js` - 9 API endpoints for model management

**What we built:**
1. ✅ ModelVersion schema with comprehensive metrics:
   ```javascript
   // Actual implementation in ModelVersion.js
   const modelVersionSchema = new mongoose.Schema({
     version: { type: String, required: true, unique: true },
     modelType: {
       type: String,
       enum: ['conflict_detection', 'ideology_classification', 'sentiment_analysis', 'mediator_matching']
     },
     metrics: {
       f1Score: { type: Number, min: 0, max: 1 },
       precision: { type: Number, min: 0, max: 1 },
       recall: { type: Number, min: 0, max: 1 },
       accuracy: { type: Number, min: 0, max: 1 },
       confusionMatrix: {
         truePositives: Number,
         falsePositives: Number,
         trueNegatives: Number,
         falseNegatives: Number
       },
       samples: Number
     },
     isActive: { type: Boolean, default: false },
     deployedAt: Date,
     previousVersion: { type: String, ref: 'ModelVersion' }
   });

   // Static methods
   modelVersionSchema.statics.getActiveModel = async function(modelType) { ... }
   modelVersionSchema.statics.compareVersions = async function(v1, v2) { ... }

   // Instance methods
   modelVersionSchema.methods.activate = async function() { ... }
   modelVersionSchema.methods.calculateImprovement = function(previousMetrics) { ... }
   ```

2. ✅ F1 calculation service implemented:
   ```javascript
   // Actual implementation in modelMetrics.js
   class ModelMetrics {
     calculateF1(predictions, groundTruth) {
       // Confusion matrix calculation
       const confusionMatrix = { TP: 0, FP: 0, TN: 0, FN: 0 };

       predictions.forEach((pred, i) => {
         const truth = groundTruth[i];
         if (pred && truth) confusionMatrix.TP++;
         else if (pred && !truth) confusionMatrix.FP++;
         else if (!pred && !truth) confusionMatrix.TN++;
         else confusionMatrix.FN++;
       });

       const precision = TP / (TP + FP);
       const recall = TP / (TP + FN);
       const f1 = 2 * (precision * recall) / (precision + recall);

       return { f1, precision, recall, accuracy, confusionMatrix };
     }

     async evaluateConflictModel(modelVersion, options) {
       // 1. Fetch human feedback (ground truth)
       // 2. Get model predictions
       // 3. Calculate F1, precision, recall
       // 4. Return evaluation results
     }

     async saveModelVersion(version, metrics, modelInfo) { ... }
     async getPerformanceTrends(modelType, days = 30) { ... }
     meetsQualityThreshold(metrics, threshold = 0.75) { ... }
   }
   ```

3. ✅ Daily F1 tracking cron job (runs at 3 AM):
   ```javascript
   // Actual implementation in dailyModelEvaluation.js
   const schedule = require('node-schedule');

   const job = schedule.scheduleJob('0 3 * * *', async () => {
     // Evaluate active model using last 7 days of feedback
     const evaluation = await modelMetrics.evaluateConflictModel(activeModel, {
       startDate: sevenDaysAgo,
       minSamples: 10
     });

     // Update model metrics
     await modelMetrics.saveModelVersion(activeModel.version, evaluation.metrics);

     // Alert if F1 < 0.75 threshold
     if (evaluation.metrics.f1Score < 0.75) {
       logger.warn('Model performance degraded', { f1Score: evaluation.metrics.f1Score });
     }
   });
   ```

4. ✅ 9 API endpoints created in `routes/models.js`:
   - `GET /api/models/versions` - List all model versions
   - `GET /api/models/versions/:version` - Get specific version details
   - `GET /api/models/active/:modelType` - Get currently active model
   - `POST /api/models/evaluate` - Evaluate model performance
   - `POST /api/models/versions` - Create new model version
   - `POST /api/models/versions/:version/activate` - Deploy model to production
   - `GET /api/models/performance/:modelType` - Get performance trends
   - `GET /api/models/status/:modelType` - Health check (current F1 score)
   - `GET /api/models/compare` - Compare two model versions
   - `DELETE /api/models/versions/:version` - Delete model version

#### Phase 2: Automated Retraining Pipeline ⏳ PENDING (Week 2-3)
**Files to modify:**
- `backend/src/scripts/retrainConflictModel.js` - Add automation
- `backend/src/services/ai/modelRetrainer.js` - New service

**Tasks:**
1. Define retraining triggers:
   ```javascript
   const RETRAIN_TRIGGERS = {
     // Trigger 1: F1 score drops below threshold
     f1Threshold: 0.75,

     // Trigger 2: Sufficient new feedback
     minNewExamples: 200,

     // Trigger 3: Time-based (every 2 weeks)
     maxDaysSinceRetrain: 14,

     // Trigger 4: High disagreement rate
     disagreementThreshold: 0.3  // 30% of predictions corrected
   };
   ```

2. Create automated retraining workflow:
   ```javascript
   // backend/src/services/ai/modelRetrainer.js
   class ModelRetrainer {
     async checkRetrainTriggers() {
       // Check all triggers
       // Return: { shouldRetrain: true/false, reasons: [] }
     }

     async automatedRetrain() {
       // 1. Export training data
       // 2. Fine-tune model (HuggingFace or local)
       // 3. Evaluate on validation set
       // 4. If F1 improves → deploy new version
       // 5. If F1 degrades → rollback and alert
     }
   }
   ```

3. Add model versioning API:
   ```javascript
   // GET /api/feedback/models - List all model versions
   // GET /api/feedback/models/:version/metrics - Get F1, precision, recall
   // POST /api/feedback/models/:version/activate - Deploy new model
   // POST /api/feedback/models/:version/rollback - Rollback to previous
   ```

#### Phase 3: Human-in-the-Loop Enhancements ⏳ PENDING (Week 3-4)
**Features:**
1. **Uncertainty sampling** - Prioritize low-confidence predictions for human review
2. **Active learning UI** - Dashboard showing:
   - Current F1 score (chart over time)
   - Samples needing review (sorted by uncertainty)
   - Model version history
   - Retraining status/progress
3. **Feedback quality scoring** - Weight feedback from expert users higher
4. **Adversarial examples** - Generate hard cases to improve robustness

**Files to create:**
- `frontend/src/pages/ActiveLearningDashboard.jsx`
- `backend/src/routes/feedback.js` - Add GET /feedback/pending-review

#### Success Metrics 📊
- ✅ F1 score tracked daily (3 AM cron job) and logged to MongoDB
- ✅ Model versioning system with activate/compare capability
- ✅ 9 API endpoints for model management
- ✅ Performance trends tracking (30-day history)
- ⏳ Automated retraining every 2 weeks or when F1 < 0.75 (triggers defined, automation pending)
- ⏳ Rollback capability (schema ready, deployment logic pending)
- ⏳ Human feedback loop reduces false positives by 20% (needs production data)
- ⏳ Uncertainty sampling increases feedback quality by 30% (Phase 3)

---

## 3. 🗺️ 50-State Scraping Implementation

### Current State ✅
- **2 states configured** - Connecticut (CT), Massachusetts (MA)
- **Scraping service** - `mediatorScraper.js` with Playwright/Puppeteer support
- **Affiliation detection** - `affiliationDetector.js` for bias/conflict detection
- **Rate limiting** - 450 pages/day (15k/month free tier)
- **Scraping config** - robots.txt respect, retry logic, selectors

### Gaps 🔴
- ❌ 48 states missing (need sources for all)
- ❌ No automated scheduling (manual scraping only)
- ❌ No data validation/quality checks
- ❌ No duplicate detection across sources
- ❌ No monitoring/alerting for scraping failures

### Implementation Plan 📝

#### Phase 1: Research Data Sources (Week 1-2)
**Goal:** Find mediator registries for all 50 states

**Data Sources by Priority:**
1. **State court websites** - Official mediator rosters (highest quality)
2. **State bar associations** - Lawyer directories with mediation certification
3. **Professional associations** - JAMS, AAA, FINRA arbitrator lists
4. **State ADR agencies** - Alternative Dispute Resolution offices
5. **Public records** - Business licenses, certifications

**Task:** Create `scrapingTargets.js` entries for all 50 states:
```javascript
// backend/src/config/scrapingTargets.js
const SCRAPING_TARGETS = {
  'AL': { name: 'Alabama', sources: [...] },
  'AK': { name: 'Alaska', sources: [...] },
  // ... all 50 states
  'WY': { name: 'Wyoming', sources: [...] }
};
```

**Research template per state:**
1. Google: "[State] court mediation roster"
2. Check state judiciary website
3. Check state bar association
4. Verify robots.txt allows scraping
5. Test selectors manually

#### Phase 2: Build Scraping Pipeline (Week 2-4)
**Files to modify:**
- `backend/src/services/scraping/mediatorScraper.js` - Add state-specific parsers
- `backend/src/services/scraping/dataValidator.js` - New validation service
- `backend/src/services/scheduling/cronScheduler.js` - Add scraping schedules

**Tasks:**
1. **Data validation service:**
   ```javascript
   // backend/src/services/scraping/dataValidator.js
   class DataValidator {
     validateMediatorData(data) {
       // Required fields: name, location, specializations
       // Optional fields: email, phone, barNumber
       // Return: { valid: true/false, errors: [] }
     }

     detectDuplicates(newMediator, existingMediators) {
       // Fuzzy name matching (Levenshtein distance)
       // Location + name combo
       // Bar number exact match
       // Return: duplicate ID or null
     }

     enrichData(mediator) {
       // Geocode location → lat/lng
       // Normalize phone numbers
       // Validate email format
     }
   }
   ```

2. **Automated scheduling:**
   ```javascript
   // In cronScheduler.js
   // Daily: High-priority states (CA, NY, TX, FL)
   scheduleCronJob('scrape-high-priority-states', '0 2 * * *', async () => {
     const states = ['CA', 'NY', 'TX', 'FL'];
     for (const state of states) {
       await scrapingService.scrapeState(state);
     }
   });

   // Weekly: All other states (rotating 10 states per day)
   scheduleCronJob('scrape-rotating-states', '0 3 * * *', async () => {
     const dayOfWeek = new Date().getDay();
     const statesToScrape = getStatesForDay(dayOfWeek); // 10 states
     for (const state of statesToScrape) {
       await scrapingService.scrapeState(state);
     }
   });
   ```

3. **Monitoring and alerting:**
   ```javascript
   // backend/src/models/ScrapingLog.js
   const schema = new mongoose.Schema({
     state: String,
     source: String,
     startTime: Date,
     endTime: Date,
     status: String,  // 'success', 'partial', 'failed'
     mediatorsScraped: Number,
     mediatorsAdded: Number,
     mediatorsUpdated: Number,
     errors: [String],
     rateLimitHit: Boolean
   });

   // Alert if:
   // - Scraping fails 3 times in a row
   // - Rate limit hit (pause scraping)
   // - Zero mediators found (source changed?)
   ```

#### Phase 3: Scale to 50 States (Week 4-6)
**Tasks:**
1. Complete `scrapingTargets.js` for all 50 states
2. Test scraping for each state (dry run)
3. Implement state-specific parsers (some sites need custom logic)
4. Add embeddings generation for new mediators
5. Monitor database size (512MB limit)

**Expected Growth:**
- **Current:** 20 mediators
- **After 50-state scraping:** 5,000-10,000 mediators (estimate)
- **Database size:** ~200-300MB (well within 512MB limit)

#### Success Metrics 📊
- [ ] All 50 states configured in scrapingTargets.js
- [ ] Automated daily scraping for high-priority states
- [ ] 5,000+ mediators in database (250x growth!)
- [ ] 95%+ data quality (valid phone, email, location)
- [ ] Zero rate limit violations (stay within 450 pages/day)
- [ ] Duplicate detection prevents 90%+ duplicates

---

## 🚀 Original Timeline (Pre-Feb 3 Planning)

### Original Priority Ranking
1. ✅ **Active Learning Pipeline** - COMPLETE (Highest Impact)
2. ✅ **Hybrid Search** - COMPLETE (Medium Impact)
3. ⏳ **50-State Scraping** - IN PROGRESS (Long-term Impact)

### Original Planned Order (ADJUSTED)
```
✅ Week 1-2:   Active Learning - F1 Tracking (COMPLETE Feb 3)
⏳ Week 2-3:   Active Learning - Automated Retraining (PENDING)
✅ Week 3-4:   Hybrid Search - Keyword Foundation (COMPLETE Feb 3)
✅ Week 4-5:   Hybrid Search - Hybrid Ranking (COMPLETE Feb 3)
⏳ Week 5-6:   50-State Scraping - Research Sources (NEXT)
⏳ Week 6-8:   50-State Scraping - Build Pipeline
⏳ Week 8-10:  50-State Scraping - Scale to 50 States
⏳ Week 10-12: Testing, Refinement, Monitoring
```

**Note:** Phases 1-2 completed ahead of schedule (Feb 3, 2026). See "Updated Timeline" below for revised plan.

---

## 💰 Free Tier Considerations

### Resource Usage
| Task | HuggingFace API | MongoDB Storage | Scraping |
|------|-----------------|-----------------|----------|
| **Active Learning** | +50 requests/day (model inference) | +10MB (feedback + versions) | 0 |
| **Hybrid Search** | +20 requests/day (embeddings) | +5MB (indexes) | 0 |
| **50-State Scraping** | +100 requests/day (embeddings) | +250MB (5k mediators) | 450 pages/day |
| **TOTAL** | 170/333 daily limit (51%) | 265/512MB (52%) | 450/450 (100%) |

**Risk Level:** 🟡 MEDIUM
- HuggingFace usage at 51% (safe buffer)
- MongoDB at 52% (safe, but monitor)
- ⚠️ **Scraping at 100%** - Need to optimize or add delay

### Mitigation Strategies
1. **Cache embeddings** - Don't regenerate for unchanged mediators
2. **Batch processing** - Generate embeddings in bulk (1 API call)
3. **Scraping rotation** - 10 states/day instead of all 50
4. **Rate limit monitoring** - Alert at 80% usage

---

## 4. 🚨 Enhanced Affiliation Detection (Phase 4) ✅ COMPLETE

### Current State ✅ (Completed Feb 3, 2026)
- ✅ **RECAP integration** - Federal court case history lookup
- ✅ **Conflict analysis service** - Analyzes mediator-counsel relationships
- ✅ **Red/Yellow/Green tagging** - Visual risk indicators
- ✅ **Conflict risk caching** - 7-day cache for performance
- ✅ **API endpoint** - POST /api/mediators/:id/check-conflicts
- ✅ **Basic affiliation detector** - `affiliationDetector.js` with keyword matching
- ✅ **HuggingFace NLP** - Zero-shot classification for conflict detection
- ✅ **ConflictFeedback model** - Stores human feedback on conflict predictions

### Gaps (Updated Feb 3, 2026) 🟡 MOSTLY RESOLVED
- ✅ RECAP integration for case history lookup (COMPLETE)
- ✅ Visual "Red/Yellow/Green" tagging system (COMPLETE)
- ✅ Cross-referencing with case history databases (COMPLETE)
- ✅ Confidence scores for conflict warnings (COMPLETE)
- ❌ LinkedIn integration - **REJECTED** (see CONTEXT.md for rationale)
- ⏳ Frontend UI integration for visual tags (PENDING)
- ⏳ Case outcome analysis (Win/Loss ratio for opposing counsel)

**IMPORTANT DECISION:** We are NOT implementing LinkedIn integration. See CONTEXT.md "Key Decisions & Why" section for full rationale. TL;DR: RECAP (free, legally relevant) > LinkedIn (expensive, socially irrelevant).

### Implementation ✅ COMPLETE

#### Phase 4.1: RECAP Integration ✅ COMPLETE (Feb 3, 2026)
**Goal:** Cross-reference mediator case history against opposing counsel

**Files created:**
- ✅ `backend/src/services/external/recapClient.js` - RECAP case lookup (FREE API)
- ✅ `backend/src/services/ai/conflictAnalysisService.js` - Conflict analysis engine
- ✅ `backend/src/models/Mediator.js` - Added conflict risk fields

**What we built:**
1. ✅ **RECAP integration (FREE - Court Listener API):**
   ```javascript
   // backend/src/services/external/recapClient.js
   class RECAPClient {
     async searchMediatorCases(mediatorName, options) {
       // Search federal court records via Court Listener API
       // Extract: docket number, parties, attorneys, outcomes
       // Return: { cases: [...], total: N }
     }

     async checkCaseHistoryConflict(mediatorCases, opposingCounsel, currentParty) {
       // Check if opposing counsel appeared in mediator's past cases
       // Analyze case outcomes (win/loss for opposing counsel)
       // Return: { hasConflict, conflicts: [...], riskLevel }
     }

     async getCaseDetails(docketNumber, court) {
       // Get detailed case information from RECAP
     }

     async searchAttorneyCases(attorneyName) {
       // Search opposing counsel's case history
     }
   }
   ```

2. ✅ **Conflict analysis service:**
   ```javascript
   // backend/src/services/ai/conflictAnalysisService.js
   class ConflictAnalysisService {
     async analyzeConflicts(mediatorId, caseInfo, options) {
       // caseInfo: { opposingCounsel, currentParty, userPosition }
       // 1. Get mediator's RECAP case history (cached 30 days)
       // 2. Check for conflicts with opposing counsel
       // 3. Analyze existing affiliation data
       // 4. Calculate overall risk (clear/yellow/red)
       // 5. Cache results (7 days)
       // Return: { riskLevel, reasons, recommendation }
     }

     async clearConflictCache(mediatorId) {
       // Force refresh on next check
     }
   }
   ```

3. ✅ **Visual tagging system (Mediator model):**
   ```javascript
   // Added to Mediator.js model
   recapData: {
     lastSearched: Date,
     casesFound: Number,
     cases: [{
       docketNumber, caseName, court, dateFiled, parties, attorneys, outcome, url
     }],
     knownCounselRelationships: [{
       counselName, firm, caseCount, mostRecentCase,
       riskLevel: { enum: ['clear', 'yellow', 'red'] }
     }]
   },

   conflictRiskCache: {
     opposingCounsel: String,
     currentParty: String,
     riskLevel: { enum: ['clear', 'yellow', 'red'] },
     reasons: [{ type, description, confidence, source, caseReference }],
     checkedAt: Date,
     expiresAt: Date // 7-day cache
   }
   ```

#### Phase 4.2: API Endpoints ✅ COMPLETE (Feb 3, 2026)
**Files modified:**
- ✅ `backend/src/routes/mediators.js` - Added conflict check endpoints

**API Endpoints created:**
1. ✅ **POST /api/mediators/:id/check-conflicts** - Check conflicts for specific case
   - Request body:
   ```json
   {
     "opposingCounsel": "Smith & Associates",
     "currentParty": "ABC Corp",
     "userPosition": "plaintiff",
     "forceRefresh": false
   }
   ```
   - Response:
   ```json
   {
     "success": true,
     "mediatorId": "...",
     "mediatorName": "John Doe",
     "riskLevel": "yellow",
     "reasons": [
       {
         "type": "case_history",
         "description": "Appeared in case 1:20-cv-12345 with opposing counsel",
         "confidence": 0.85,
         "source": "recap",
         "caseReference": "1:20-cv-12345",
         "dateFiled": "2020-06-15",
         "url": "https://www.courtlistener.com/docket/..."
       }
     ],
     "recommendation": "Possible indirect connection detected. Review details and disclose to parties before proceeding.",
     "conflictCount": 1,
     "metadata": {
       "searchedCases": 15,
       "lastUpdated": "2026-02-03T...",
       "cacheExpiresAt": "2026-02-10T..."
     }
   }
   ```

2. ✅ **DELETE /api/mediators/:id/conflict-cache** - Clear cache, force refresh

#### Phase 4.3: Frontend UI Integration ⏳ PENDING (Week 12-13)
**Files to modify:**
- ⏳ `frontend/src/components/MediatorCard.jsx` - Add color-coded tags
- ⏳ `frontend/src/components/MediatorProfile.jsx` - Show conflict details
- ⏳ `frontend/src/components/ConflictCheckForm.jsx` - UI for checking conflicts

**Visual Design:**
- 🟢 **Green badge:** "Clear" - No detected conflicts
- 🟡 **Yellow badge:** "Review" - Possible indirect connection, disclose to parties
- 🔴 **Red badge:** "Conflict" - Likely affiliated with opposing counsel, avoid

#### Success Metrics 📊
- ✅ RECAP integration checks case history overlap
- ✅ API endpoint returns conflict analysis with risk level
- ✅ Red/yellow/green risk levels calculated correctly
- ✅ Conflict detection uses real federal court data (RECAP)
- ✅ Results cached for 7 days (performance optimization)
- ⏳ Visual tags (red/yellow/green) display on mediator cards (frontend pending)
- ⏳ 95%+ accuracy on conflict detection (needs production validation)
- ⏳ < 1 second API response time for conflict checks (needs load testing)

---

## 5. 💼 User Acquisition & Monetization (Phase 5)

### Current State ✅ (Updated Feb 3, 2026)
- ✅ **Subscription model** - MongoDB schema for tracking subscriptions
- ✅ **Stripe integration** - Full payment processing (checkout, webhooks, cancel)
- ✅ **Premium middleware** - Feature gating based on subscription tier
- ✅ **Subscription routes** - API endpoints for upgrade/downgrade
- ✅ **Usage limits** - Free tier: 10 searches/month, premium: unlimited
- ✅ **Free tier functional** - Basic mediator search available
- ⏳ **Premium tier ready** - Infrastructure complete, needs activation
- ❌ **No user outreach** - Organic growth only

### Gaps (Updated Feb 3, 2026) 🟡 INFRASTRUCTURE COMPLETE
- ✅ Premium tier infrastructure implemented
- ✅ Payment integration (Stripe) complete
- ⏳ Law firm outreach strategy (NEXT PHASE)
- ⏳ Marketing materials (landing page, pitch deck)
- ⏳ User analytics/tracking
- ⏳ Premium feature activation (RECAP conflict detection requires premium)

### Implementation Plan 📝

#### Phase 5.1: Premium Tier ($49/mo) ✅ COMPLETE (Already existed)
**Goal:** Monetize once mediator database reaches 500-1,000 mediators

**Premium Features ($49/month):**
1. ✅ **Unlimited searches** (vs 10/month free) - middleware ready
2. ✅ **Conflict detection API** (RECAP case history) - API ready, needs premium gate
3. ⏳ **Advanced filters** (ideology, win rate) - implementation pending
4. ⏳ **Export to CSV** (mediator lists) - implementation pending
5. ⏳ **Priority support** (email/chat) - implementation pending

**Files already exist:**
- ✅ `backend/src/models/Subscription.js` - Subscription tracking
- ✅ `backend/src/services/stripe/stripeService.js` - Stripe integration (373 lines)
- ✅ `backend/src/middleware/premiumFeatures.js` - Premium gate + usage limits
- ✅ `backend/src/routes/subscription.js` - Subscription API routes

**What's already built:**
1. ✅ **Stripe integration (COMPLETE):**
   - createCheckoutSession() - Stripe hosted checkout
   - handleWebhook() - Automatic subscription updates
   - cancelSubscription() - Cancellation + refunds
   - getSubscription() - Get user's subscription status
   - updatePaymentMethod() - Update card details

2. ✅ **Subscription model (COMPLETE):**
   - User-subscription relationship
   - Stripe customer ID + subscription ID
   - Status tracking (active, canceled, past_due, trialing)
   - Period dates + auto-renewal
   - isActive() method for quick checks

3. ✅ **Premium middleware (COMPLETE):**
   - requirePremium() - Gate premium-only features
   - checkUsageLimit() - Track free tier usage (10 searches/month)
   - hasPremiumSubscription() - Check subscription status
   - getUserSubscriptionInfo() - Get tier + limits + usage

4. ✅ **Subscription routes (COMPLETE):**
   - GET /api/subscription - Get current subscription
   - POST /api/subscription/checkout - Create checkout session
   - POST /api/subscription/webhook - Stripe webhook handler
   - POST /api/subscription/cancel - Cancel subscription
   - POST /api/subscription/resume - Resume canceled subscription

#### Phase 5.2: Law Firm Outreach (Week 14-16)
**Goal:** Acquire 10-20 paying law firms in South Florida

**Target Markets:**
1. **Miami** - Major metro, high litigation volume
2. **Aventura** - Corporate litigation hub
3. **Fort Lauderdale** - Maritime/injury law
4. **Pompano Beach** - Family law focus
5. **Boca Raton** - Real estate disputes
6. **West Palm Beach** - Federal court proximity
7. **Tampa** - Insurance/healthcare litigation

**Outreach Strategy:**
1. **LinkedIn outreach** - Target managing partners, litigation directors
2. **Cold email campaign** - Personalized pitch (see templates below)
3. **Free trial offer** - 30-day premium access (hook)
4. **Webinar/demo** - "How AI Eliminates Mediator Bias" presentation
5. **Referral program** - $100 credit for each referred firm

**Email Template:**
```
Subject: Eliminate Mediator Bias with AI (30-Day Free Trial)

Hi [Name],

Are your clients concerned about mediator conflicts of interest?

FairMediator uses AI to:
- Flag hidden affiliations between mediators & opposing counsel
- Analyze ideological leanings (liberal/conservative spectrum)
- Search 5,000+ mediators across Florida in seconds

We're offering [Firm Name] a 30-day premium trial ($49/mo value).

Interested in a 15-minute demo?

Best,
Carol
FairMediator.ai
```

**Success Metrics:**
- [ ] 100 law firms contacted (South Florida focus)
- [ ] 20% email open rate
- [ ] 10-20 firms sign up for free trial
- [ ] 30% trial → paid conversion rate ($1,500-$3,000 MRR)

#### Phase 5.3: Marketing & Analytics (Week 16+)
**Tasks:**
1. **Landing page optimization** - A/B test headlines, CTAs
2. **Google Analytics** - Track user behavior, conversion funnels
3. **Testimonials** - Get quotes from early users
4. **SEO optimization** - Rank for "mediator search Florida"
5. **Content marketing** - Blog posts on mediation bias, conflict detection

---

## 📋 Updated Execution Order

### Revised Priority Ranking
1. ✅ **Hybrid Search** - COMPLETE
2. ✅ **Active Learning (Phase 1)** - COMPLETE
3. ⏳ **50-State Scraping** - IN PROGRESS (target: 5k mediators by Feb 24)
4. ⏳ **Enhanced Affiliation Detection** - NEXT (LinkedIn/RECAP integration)
5. ⏳ **User Acquisition** - NEXT (law firm outreach, $49/mo premium)

### Updated Timeline
```
✅ Week 1-2:   Hybrid Search + Active Learning (COMPLETE - Feb 3)
⏳ Week 3-8:   50-State Scraping (5k mediators) - Target: Feb 24
⏳ Week 9-13:  Enhanced Affiliation Detection (LinkedIn/RECAP)
⏳ Week 14-16: User Acquisition (South Florida law firms)
⏳ Week 16+:   Marketing, SEO, Content
```

**Total Time:** 16+ weeks (4 months)

---

## 📋 Next Steps

1. ✅ **Phase 1-2 Complete** - Hybrid Search + Active Learning done
2. ⏳ **Deploy to production** - Verify Netlify fix works
3. ⏳ **Start 50-State Scraping** - Focus on FL/CA/NY first (high-volume states)
4. ⏳ **Build to 5k mediators** - Target: Feb 24, 2026
5. ⏳ **Implement premium tier** - Stripe + subscription model
6. ⏳ **Launch law firm outreach** - South Florida focus

---

## 📚 Additional Resources

- [MongoDB Atlas Vector Search Docs](https://www.mongodb.com/docs/atlas/atlas-vector-search/)
- [Active Learning Best Practices](https://modal.com/docs/examples/active-learning)
- [BM25 Algorithm Explained](https://en.wikipedia.org/wiki/Okapi_BM25)
- [Web Scraping Ethics Guide](https://www.scraperapi.com/blog/web-scraping-ethics/)

---

**Questions? Concerns? Let's discuss before starting implementation!**
