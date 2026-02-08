# FairMediator TODO Analysis & Improvement Opportunities

**Generated:** February 7, 2026
**Based on:** CONTEXT.md + AI_FEATURES.md analysis

---

## 📋 Current TODO Items (From CONTEXT.md)

### 🎯 HIGH PRIORITY - Frontend Integration (Week 1)

**Conflict Detection UI:**
- [ ] Add "Check Conflicts" button to mediator cards
- [ ] Display risk badges (🟢 GREEN / 🟡 YELLOW / 🔴 RED)
- [ ] Show relationship paths in conflict popup
- [ ] CSV export for bulk conflict checking
- [ ] Industry breakdown pie chart
- [ ] Lobbying disclosure badge (🏛️ icon)
- [ ] "View Lobbying History" button/modal
- [ ] Quarterly trend charts
- [ ] Add lobbying conflict warnings to ConflictBadge component

**Settlement Prediction UI:**
- [ ] Add "Predict Settlement" button to case intake
- [ ] Display predicted range with confidence interval
- [ ] Show similar historical cases
- [ ] Batch prediction interface

**Mediator Profiles:**
- [ ] Display industry breakdown (pie chart)
- [ ] Show lobbying history timeline
- [ ] Quarterly contribution trend charts
- [ ] Conflict warnings on profile page

### 🔬 MEDIUM PRIORITY - Data Collection & Testing (Week 2)

**Data Collection:**
- [ ] Collect 500+ FCA settlements from DOJ (for ML training)
- [ ] Run FEC scraper for all mediators in database
- [ ] Scrape lobbying data for active mediators (Senate LDA)
- [ ] Test industry classification with 20+ sample employers

**Testing:**
- [ ] Test frontend pages (SafeguardsPage, MediatorsPage)
- [ ] Test Docker Compose setup (6 services)
- [ ] Integration testing (end-to-end workflows)
- [ ] Fix DOJ data scraper (collect real FCA settlements)
- [ ] Frontend integration (hybrid search, CSV export, fuzzy matching)

**Documentation:**
- [ ] Update API_KEYS_SETUP.md (note: Senate LDA requires no API key!)
- [ ] Add INDUSTRY_CATEGORIES.md (explain 14 categories)

### 🗺️ PHASE 3 - State-Level Data (Weeks 3-6)

**California (Priority #1):**
- [ ] Research Cal-Access API endpoints (verify current API structure)
- [ ] Test Cal-Access contribution search with sample names
- [ ] Implement full California contribution parsing
- [ ] Add CA data to graph database (state field)
- [ ] Test with 10 sample California contributors

**Texas:**
- [ ] Download Texas Ethics Commission bulk CSV files
- [ ] Parse CSV format (identify column mappings)
- [ ] Implement Texas CSV parser (convert to graph format)
- [ ] Test with 10 sample Texas contributors

**Florida:**
- [ ] Research Florida Division of Elections data format
- [ ] Implement FL data parsing
- [ ] Test with sample data

**New York:**
- [ ] Research NY Board of Elections API/downloads
- [ ] Implement NY data parsing
- [ ] Test with sample data

**Cross-State Features:**
- [ ] Add state comparison dashboard endpoint (/api/graph/state-comparison)
- [ ] Create state filter UI (dropdown: Federal, CA, TX, FL, NY)
- [ ] Display state-level contributions in mediator profiles
- [ ] Build 50-state roadmap (prioritize by mediation volume)

### 🔮 PHASE 4 - Advanced AI Features (Months 2-3)

**Planned - From Original Roadmap:**
- [ ] Political affiliation tracking (FEC API + weekly scraper, scoring algorithm)
- [ ] Advanced case-type matching (ML-based similarity, Redis caching)
- [ ] Anomaly detection (DBSCAN clustering, pattern analysis)
- [ ] Automated model retraining pipeline (cron-based, performance tracking)
- [ ] A/B testing framework (feature flags, user cohorts)
- [ ] Human-in-the-loop model corrections (feedback UI)
- [ ] Multi-language support (i18n framework + translations)
- [ ] PDF report generation (conflict analysis export)
- [ ] Expand to remaining 46 states (automated scraping)

### ⏸️ SKIPPED/DEFERRED Tasks

- [ ] Automated retraining triggers (F1 < 0.75, 200+ examples)
- [ ] Uncertainty sampling for human review
- [ ] A/B test hybrid vs vector-only search

---

## 💡 What Can Be Created/Improved NOW

Based on existing backend infrastructure (100% complete), here are immediate opportunities:

### 🎨 **1. ConflictDashboard Component** (Frontend)

**What:** Comprehensive conflict analysis dashboard for mediators

**Why Now:**
- Backend API ✅ Complete (`/api/graph/check-conflicts`)
- Data ✅ Available (FEC, RECAP, LinkedIn, Senate LDA)
- Use Case: High-value feature for premium users

**Features:**
```javascript
// ConflictDashboard.jsx
<ConflictDashboard mediatorId="med_123">
  <RiskScoreCard score={18} level="RED" />
  <RelationshipGraph paths={conflictPaths} />
  <LobbyingHistory filings={lobbyingData} />
  <IndustryBreakdown categories={industries} />
  <QuarterlyTrends data={trends} />
  <ConflictReport exportPDF={true} />
</ConflictDashboard>
```

**Effort:** 1-2 days
**Impact:** HIGH - Core differentiator for FairMediator

---

### 📊 **2. SettlementCalculator Component** (Frontend + Enhancement)

**What:** Interactive settlement prediction tool with scenario comparison

**Why Now:**
- ML model ✅ Trained (R²=0.98)
- Backend API ✅ Complete (`/api/settlement/predict`)
- Data ✅ Available (247+ FCA settlements)

**Features:**
```javascript
// SettlementCalculator.jsx
<SettlementCalculator>
  <ScenarioBuilder fraudType industry whistleblower />
  <PredictionRange low={3.25M} mid={7.5M} high={12M} confidence={0.82} />
  <SimilarCases comparables={historicalCases} />
  <BatchPredictor scenarios={[...]} />
  <ExportReport format="PDF" />
</SettlementCalculator>
```

**Backend Enhancement:** Add `/api/settlement/similar-cases` endpoint
```javascript
// Find 5 most similar historical settlements
GET /api/settlement/similar-cases?fraudType=healthcare&damagesClaimed=10M
```

**Effort:** 2-3 days (1 day frontend, 1 day backend enhancement)
**Impact:** HIGH - Revenue driver (premium feature)

---

### 🏛️ **3. LobbyingProfileCard Component** (Frontend)

**What:** Rich lobbying history visualization for mediator profiles

**Why Now:**
- Backend ✅ Complete (`/api/graph/mediator-profile/:id`)
- Data ✅ Available (37,471+ Senate LDA records)
- Industry categorization ✅ Complete (14 categories)

**Features:**
```javascript
// LobbyingProfileCard.jsx
<LobbyingProfileCard mediatorId="med_123">
  <LobbyingSummary totalFilings={8} clients={3} />
  <IndustryPieChart categories={["Healthcare", "Defense"]} />
  <TimelineView filings={lobbyingHistory} />
  <ConflictWarnings level="HIGH" organizations={["ACME Corp"]} />
  <IssueAreasCloud tags={["Healthcare", "Defense", "Finance"]} />
</LobbyingProfileCard>
```

**Effort:** 1 day
**Impact:** MEDIUM-HIGH - Transparency & trust building

---

### 📈 **4. IndustryTrendsPage** (New Page)

**What:** Industry-level analysis showing trends across mediators

**Why Now:**
- Backend ✅ Complete (`/api/graph/industry-trends/:industry`)
- Data aggregation ✅ Available (quarterly breakdown)
- Visualization opportunity: Interactive charts

**Features:**
```javascript
// /trends/healthcare
<IndustryTrendsPage industry="Healthcare">
  <QuarterlyChart donations lobbyingActivity />
  <TopActors mediators={[...]} firms={[...]} />
  <ConflictHotspots organizations={[...]} />
  <IndustryFilter dropdown={14 categories} />
  <ExportCSV data={trendsData} />
</IndustryTrendsPage>
```

**Effort:** 1-2 days
**Impact:** MEDIUM - Analytics & insights for researchers/journalists

---

### 🔍 **5. BatchConflictChecker** (Enhancement)

**What:** Bulk conflict checking for case managers

**Why Now:**
- Backend ✅ Supports batch operations
- Use Case: Law firms evaluating 10+ mediators at once
- Revenue: Premium feature ($$$)

**Features:**
```javascript
// BatchConflictChecker.jsx
<BatchConflictChecker>
  <FileUpload format="CSV" columns={["mediatorId", "opposingPartyId"]} />
  <BulkAnalysis parallel={true} maxConcurrent={10} />
  <ResultsTable sortable filterable exportable />
  <RiskDistribution chart={pieChart} />
  <ConflictMatrix heatmap={true} />
</BatchConflictChecker>
```

**Backend Enhancement:** Add `/api/graph/batch-check-conflicts` endpoint
```javascript
POST /api/graph/batch-check-conflicts
Body: [{ mediatorId, opposingPartyId }, ...]
Response: [{ riskScore, riskLevel, paths }, ...]
```

**Effort:** 2 days (1 day backend, 1 day frontend)
**Impact:** VERY HIGH - B2B revenue opportunity

---

### 📄 **6. ConflictReportGenerator** (Backend + Frontend)

**What:** PDF report generation for conflict analysis

**Why Now:**
- Data ✅ Available (all conflict data accessible)
- Use Case: Legal compliance & documentation
- Revenue: Premium feature

**Features:**
- Professional PDF with FairMediator branding
- Executive summary (risk level, score, recommendation)
- Detailed relationship paths with evidence
- Lobbying disclosure section
- Industry breakdown charts
- Exportable to PDF/DOCX

**Tech Stack:**
- Backend: `pdfkit` or `puppeteer` (Node.js)
- Frontend: Download button + preview modal

**New Endpoint:**
```javascript
GET /api/graph/conflict-report/:mediatorId/:opposingPartyId?format=pdf
Response: Binary PDF stream
```

**Effort:** 2-3 days
**Impact:** MEDIUM-HIGH - Professional feature for law firms

---

### 🤖 **7. Automated Daily Conflict Monitoring** (Backend Enhancement)

**What:** Cron job that checks for new conflicts daily

**Why Now:**
- Data sources ✅ Updated regularly (FEC, Senate LDA)
- Backend ✅ Has all conflict detection logic
- Use Case: Alert users to emerging conflicts

**Features:**
```javascript
// backend/src/jobs/daily_conflict_check.js
- Run daily at 2 AM
- Check all active mediators against recent data
- Detect new conflicts (score increased by 5+ points)
- Send email/SMS alerts to affected users
- Log changes to ConflictHistory collection
```

**New Endpoints:**
```javascript
GET /api/graph/conflict-alerts - Get conflict changes in last 7 days
GET /api/graph/conflict-history/:mediatorId - Full history timeline
```

**Effort:** 2 days
**Impact:** HIGH - Proactive monitoring (premium feature)

---

### 📊 **8. MediatorComparison Tool** (New Feature)

**What:** Side-by-side comparison of 2-5 mediators

**Why Now:**
- All mediator data ✅ Available via APIs
- Use Case: Help users choose between candidates
- Visualization: Comparison table + charts

**Features:**
```javascript
// /compare?ids=med_1,med_2,med_3
<MediatorComparisonPage>
  <ComparisonTable metrics={[
    "Risk Score",
    "Lobbying Clients",
    "Total Donations",
    "Case History",
    "Industry Focus"
  ]} />
  <RadarChart dimensions={5} />
  <ConflictMatrix mediators={3} />
  <RecommendationEngine bestMatch={med_2} />
</MediatorComparisonPage>
```

**Effort:** 2 days
**Impact:** MEDIUM-HIGH - Decision-making tool

---

### 🔔 **9. ConflictAlerts System** (Backend + Frontend)

**What:** Real-time alerts when new conflicts are detected

**Why Now:**
- Backend ✅ Has conflict detection
- Use Case: Keep users informed of changes
- Tech: WebSockets or polling

**Features:**
```javascript
// AlertBell component (header)
<AlertBell>
  <AlertsList unread={3}>
    <Alert type="NEW_CONFLICT" mediatorId="med_123" severity="RED" />
    <Alert type="LOBBYING_FILING" organization="ACME" date="2024-Q3" />
    <Alert type="DONATION_DETECTED" amount={50000} recipient="PAC" />
  </AlertsList>
</AlertBell>
```

**Backend:**
```javascript
// New schema: Alert
{
  userId, mediatorId, alertType, severity, message, isRead, createdAt
}

GET /api/alerts - Get user alerts
POST /api/alerts/mark-read/:id
POST /api/alerts/subscribe - Subscribe to mediator updates
```

**Effort:** 2-3 days
**Impact:** MEDIUM-HIGH - User engagement

---

### 📝 **10. Industry Classification Wizard** (Backend Enhancement)

**What:** Improve industry categorization with manual override

**Why Now:**
- Backend ✅ Has basic classification (14 categories)
- Problem: Some employers don't classify correctly
- Solution: Human-in-the-loop corrections

**Features:**
```javascript
// Admin interface
<IndustryClassificationWizard>
  <UnclassifiedEmployers list={["Foo Corp", "Bar LLC"]} />
  <ManualClassification employer="Foo Corp" category="Healthcare" />
  <BulkImport file="employer_mappings.csv" />
  <MachineLearning suggestedCategory confidence={0.85} />
</IndustryClassificationWizard>
```

**Backend:**
```javascript
// New schema: EmployerMapping
{ employer, industry, source: "manual|ml", confidence, verifiedBy, verifiedAt }

POST /api/graph/classify-employer
GET /api/graph/unclassified-employers
POST /api/graph/verify-classification/:id
```

**Effort:** 1-2 days
**Impact:** MEDIUM - Data quality improvement

---

### 🌐 **11. State-Level Data Integration UI** (Phase 3 Kickoff)

**What:** Interface for selecting state-level data sources

**Why Now:**
- State scrapers ✅ Skeleton code exists (CA, NY, TX, FL)
- Next priority: California implementation
- Use Case: Expand beyond federal data

**Features:**
```javascript
// /admin/state-data
<StateDataManager>
  <StateSelector states={["CA", "NY", "TX", "FL"]} />
  <DataSourceConfig>
    <CalAccessConfig apiKey status="pending" />
    <TexasEthicsConfig csvUrl status="ready" />
  </DataSourceConfig>
  <ImportProgress state="CA" progress={35%} />
  <DataPreview records={sample(10)} />
</StateDataManager>
```

**Effort:** 2-3 days (UI only, backend exists)
**Impact:** MEDIUM - Foundation for state expansion

---

### 🎓 **12. OnboardingTour for New Features** (Frontend)

**What:** Interactive guide showing AI features

**Why Now:**
- Features ✅ Complex (graph analysis, ML predictions)
- Problem: Users may not discover features
- Solution: Guided tour on first login

**Features:**
```javascript
// OnboardingTour.jsx using react-joyride
<OnboardingTour steps={[
  { target: ".conflict-badge", content: "Check for conflicts here" },
  { target: ".settlement-predictor", content: "Predict settlement ranges" },
  { target: ".lobbying-icon", content: "View lobbying history" },
  { target: ".industry-filter", content: "Filter by industry" }
]} />
```

**Effort:** 1 day
**Impact:** MEDIUM - User adoption

---

## 🚀 Quick Wins (Can Be Done in 1 Day)

1. **LobbyingBadge** - Add 🏛️ icon to mediator cards when lobbying data exists
2. **IndustryFilter** - Dropdown with 14 categories on search page
3. **RiskScoreCard** - Visual card showing 🟢/🟡/🔴 with score
4. **QuarterlyTrendChart** - Line chart for donations/lobbying over time
5. **ConflictPathsModal** - Expandable tree view of relationship paths

---

## 💰 Revenue-Generating Opportunities

### Premium Features to Build:
1. **Batch Conflict Checker** - $$$$ (Law firms will pay for this)
2. **Automated Monitoring Alerts** - $$$ (Subscription add-on)
3. **PDF Report Generation** - $$ (Per-report fee)
4. **Industry Trends Analytics** - $$ (Researchers/journalists)
5. **API Access** (Not in UI) - $$$$ (B2B integration)

### Pricing Ideas:
- Basic: Free (5 conflict checks/month)
- Premium: $49/month (Unlimited checks, no alerts)
- Professional: $199/month (Batch checking, alerts, PDF reports)
- Enterprise: $999/month (API access, white-label, custom integrations)

---

## 📊 Priority Matrix

```
           HIGH IMPACT
               ↑
    Q2         |         Q1
 (Later)       |      (DO NOW)
               |
 - State Data  | - ConflictDashboard
 - Multi-lang  | - BatchConflictChecker
 - A/B Testing | - SettlementCalculator
               | - LobbyingProfileCard
               | - ConflictReports (PDF)
───────────────┼───────────────────────→
               |                    EFFORT
               |
 - Onboarding  | - Daily Monitoring
 - Alerts UI   | - Industry Wizard
 - Quick Wins  | - MediatorComparison
               |
    Q3         |         Q4
 (Nice to have)|     (Plan ahead)
               ↓
           LOW IMPACT
```

---

## 🎯 Recommended Next Steps (Week 1)

### Day 1-2: High-Impact Frontend
1. **ConflictDashboard** - Integrate conflict checking into mediator profiles
2. **LobbyingProfileCard** - Show lobbying history with charts

### Day 3-4: Revenue Features
3. **BatchConflictChecker** - Build bulk analysis tool (backend + frontend)
4. **ConflictReportGenerator** - PDF export functionality

### Day 5: Polish & Testing
5. **SettlementCalculator** - Interactive prediction tool
6. **Quick Wins** - Add lobbying badge, industry filter, risk cards
7. **Integration Testing** - End-to-end workflows

---

## 📝 Summary

**Total TODO Items:** 50+
**High Priority:** 15 (Frontend integration)
**Medium Priority:** 10 (Data collection, testing)
**Phase 3:** 15 (State-level data)
**Phase 4:** 10+ (Advanced AI features)

**What Can Be Created NOW:** 12 major features (all backend-ready)
**Quick Wins:** 5 features (1 day each)
**Revenue Opportunities:** 5 premium features identified

**Recommendation:** Focus on ConflictDashboard, BatchConflictChecker, and LobbyingProfileCard first. These leverage existing backend infrastructure and provide immediate user value.

---

**Generated:** February 7, 2026
**Next Review:** After Week 1 frontend integration
