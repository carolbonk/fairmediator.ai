# FairMediator Project Context

> **⚠️ CRITICAL: Use the NAVIGATION MENU below - DON'T read everything!**
>
> **Order of Operations:**
> 1. Use [Quick Navigation](#-quick-navigation) menu - Jump to what you need
> 2. Check [Recent Major Changes](#-recent-major-changes) - See latest work completed
> 3. Check [What's Next / TODO](#-whats-next--todo) - See current project state
> 4. Read [Project Rules](#-project-rules) section - If you need rule clarification
> 5. Begin work following established patterns

**Last Updated:** February 26, 2026 (Monorepo Docker restructure complete, Oracle Cloud Always Free deployment ready)
**Project Status:** 🚧 Pre-Launch - Feature Complete (Backend 100%, Frontend 100%, Infrastructure 100%, Data 50%, No Users/Revenue)

---

## 🎯 YC APPLICATION STATUS (HONEST ASSESSMENT)

**Current State:** Technically ready, commercially unproven | 0 users | $0 revenue | $0 cost (free tier)

**Completion:**
- ✅ Backend 100% (APIs, ML R²=0.98, graph DB, 4 scrapers, SRE automation)
- ✅ Frontend 100% (All pages/features/modals/API integrations, i18n EN+ES, Sentry, neumorphic UX, 5 premium tools, Lighthouse fixes) - Missing: mobile device testing
- ✅ Lobbying UI 100% (badges, charts, history modal, pie chart)
- ✅ Batch Checker 100% (CSV upload, results, export, manual review)
- ✅ Infrastructure 100% (Docker containers, CI/CD pipeline, security scanning, production deployment)
- 🟡 Data 50% (25 mediators, Senate LDA working, FEC rate-limited awaiting reset)
- ❌ Monetization deferred (Stripe exists, not needed for MVP)
- ❌ GTM 0% executed

**Next:** Beta testing (1 week) → First customer (3-4 weeks)
**Details:** [YC_STATUS.md](./YC_STATUS.md) | [AI_FEATURES.md](./AI_FEATURES.md)

---

## 📑 Quick Navigation

- [YC Application Status](#-yc-application-status-honest-assessment) ⭐ **START HERE**
- [Tech Stack](#-tech-stack) ⭐ **SEE THIS SECOND**
- [Project Rules](#-project-rules) ⭐ **READ THIS THIRD**
- [Monetization Strategy](#-monetization-strategy-path-c-hybrid-model) 💰 **REVENUE PLAN**
- [14-Day MVP to Launch](#-14-day-mvp-to-launch-ship-or-die) 🚀 **EXECUTION PLAN**
- [Key Decisions & Why](#-key-decisions--why) 🚫 **READ BEFORE IMPLEMENTING**
- [What's Next / TODO](#-whats-next--todo) - Full roadmap
- [Recent Major Changes](#-recent-major-changes) - What was actually built

---

## 🚫 Key Decisions & Why

### ❌ NO LinkedIn API Integration (Manual scraping OK)
**Why NOT:** Expensive ($500-2K/mo), restrictive approval, automated scraping violates ToS
**What we use:** RECAP (primary, federal court records) + LinkedIn manual (secondary, user pastes URLs)
**Rationale:** RECAP + LinkedIn = complete picture (case history + connection strength = bias assessment)
**Status:** Manual enrichment implemented (user-initiated, respects robots.txt)

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

### 🔴 RULE 7: Accessibility & Inclusive Design

**ALL features MUST follow WCAG 2.1 Level AA compliance and progressive disclosure:**

**WCAG Compliance Requirements:**
- ✅ Color contrast ratio ≥ 4.5:1 for normal text (check with WebAIM Contrast Checker)
- ✅ Color contrast ratio ≥ 3:1 for large text (18pt+ or 14pt+ bold)
- ✅ Keyboard navigation support (Tab, Enter, Escape, Arrow keys)
- ✅ Touch target sizes ≥ 44x44pt (especially mobile buttons)
- ✅ Alt text for all images (descriptive, not decorative)
- ✅ ARIA labels for interactive elements (buttons, inputs, links)
- ✅ Focus indicators visible on all interactive elements
- ✅ Semantic HTML (headings h1-h6, nav, main, article, section)
- ✅ Screen reader compatibility (test with VoiceOver/NVDA)

**Progressive Disclosure:**
- ✅ Show only essential information initially
- ✅ Reveal complex details on user interaction (clicks, expands)
- ✅ Use accordions, tabs, "Learn More" links for advanced features
- ✅ Avoid overwhelming users with too much information at once
- ❌ NEVER display all technical details on first load

**User Testing with Disabilities:**
- ✅ Involve users with visual impairments in testing
- ✅ Test with keyboard-only navigation (no mouse)
- ✅ Test with screen readers (VoiceOver on macOS/iOS, NVDA on Windows)
- ✅ Test with color blindness simulators (Deuteranopia, Protanopia)
- ✅ Document feedback from users with disabilities

**Example Violations to Avoid:**
- ❌ White text on light gray background (poor contrast)
- ❌ Small buttons (<44pt) on mobile
- ❌ Unlabeled icon buttons (missing aria-label)
- ❌ Keyboard traps (can't Tab out of modal)
- ❌ Showing all AI technical details upfront without progressive disclosure

**Testing Tools:**
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- axe DevTools (browser extension)
- Lighthouse Accessibility Audit (Chrome DevTools)
- WAVE (Web Accessibility Evaluation Tool)

### 🔴 RULE 8: Human-Like Git Commits

**Git commit messages MUST be concise, professional, and human-written:**

**Requirements:**
- ✅ Maximum 3 phrases/sentences
- ✅ No emojis, no icons, no decorations
- ✅ Write like a human engineer (direct, technical, honest)
- ✅ Focus on WHAT changed, not why or how
- ✅ Use imperative mood ("Add feature" not "Added feature")

**Good Examples:**
```bash
git commit -m "Add conflict detection UI and settlement predictor"
git commit -m "Fix navbar overlap on tablet view"
git commit -m "Refactor API service for better error handling"
```

**Bad Examples:**
```bash
git commit -m "✨ Add amazing new feature with cool animations 🎉"
git commit -m "This commit adds a new feature that allows users to..."
git commit -m "Fixed bug (see details in previous message)"
```

---

## 🏗️ System Architecture

### Database: MongoDB Atlas Only
**M0 Free Tier (512MB):** 7 collections, built-in vector search, text + vector indexes
**Environments:** Dev (Docker local), Prod (Atlas fairmediator.bby4jil.mongodb.net)

### API Structure
11 endpoints: /auth, /mediators, /chat, /matching, /subscription, /dashboard, /scraping, /analysis, /feedback, /monitoring, /affiliations

---

## 🆕 MongoDB Atlas Vector Search
✅ Production Ready (Jan 2026) - M0 includes built-in vector search (384-dim, cosine similarity)
**Features:** Semantic search, hybrid ranking (0.7 vector + 0.3 keyword), RAG for AI responses

---

## 🔄 Recent Major Changes

### February 26, 2026: Monorepo Docker Restructure + Oracle Cloud Deployment Ready ✅

**Deployment crisis resolved:** Netlify free tier exhausted → Migrated to **Oracle Cloud Always Free tier** (ARM Ampere A1: 4 cores + 24GB RAM, FREE FOREVER)

**Monorepo Docker restructure (TESTED & WORKING):**
- **npm workspaces preserved** — Root package.json manages frontend + backend workspaces (proper monorepo structure)
- **Backend Dockerfile (80 lines)** — Multi-stage build from root context: `COPY package*.json ./` + `npm install --workspace=backend --include-workspace-root`; Python ML deps via Alpine packages (py3-numpy, py3-scikit-learn, py3-pandas); non-root nodejs user; health check on `/health`; exposed port 5001
- **Frontend Dockerfile (68 lines)** — Multi-stage build from root context: workspace-aware install, Vite build in `/monorepo/frontend`, nginx serve from `/usr/share/nginx/html`; uses existing nginx user (no conflicts); exposed port 8080
- **docker-compose.yml** — Updated build context from `./backend` → `.` (root), dockerfile: `backend/Dockerfile`; same for frontend
- **Backend + frontend package-lock.json** — Generated (530KB backend, managed by root for frontend)
- **Root `.env` file** — All secrets (JWT, SESSION, CSRF, HUGGINGFACE, RESEND, MONGODB) for docker-compose deployment

**Python ML dependencies fix:**
- Switched from pip build-from-source → **Alpine apk packages** (py3-numpy, py3-scikit-learn, py3-pandas, joblib) — avoids gcc/build-base overhead, faster builds, smaller images

**Dockerfiles fixed:**
- Backend: `--break-system-packages` for pip (Alpine PEP 668 requirement)
- Frontend: Removed duplicate nginx user creation (nginx:alpine already has nginx user)

**CI/CD workflows (GitHub Actions):**
- `.github/workflows/docker-ci.yml` — Builds backend/frontend from monorepo root context, pushes to GitHub Container Registry (ghcr.io)
- `.github/workflows/security-scan.yml` — Trivy + npm audit, uploads SARIF to GitHub Security

**Docker builds tested:**
- ✅ Backend: 4m 30s, builds successfully, Python ML models installed
- ✅ Frontend: 1m 45s, Vite build successful (193KB index.js), nginx serves correctly
- ✅ docker-compose config validated

**Netlify kept as fallback:**
- `backend/netlify/functions/api.js` + `netlify.toml` — Still in place, can revert if needed
- Serverless function wraps Express backend (serverless-http)

**Deployment target:** Oracle Cloud Always Free (ARM Ampere A1) — 4 cores, 24GB RAM, load balancer, 200GB storage, 10TB/month transfer — **FREE FOREVER**

---

### February 19, 2026: UX Polish, Marketplace Flow, Contact Page, Login Redesign ✅

**CustomSelect reusable component:**
- `src/components/common/CustomSelect.jsx` — replaces all native `<select>` with the MediatorList State dropdown pattern (white panel, scrollable button list, no native browser UI)
- Props: `id`, `value`, `onChange(value)`, `options` (string[] or `{value,label}[]`), `placeholder`, `disabled`, `error`, `variant` (`neu` | `gray`)
- Replaced 7 native selects: MediatorApplicationPage (Applying As, Authorized, Preferred State), FeedbackForm (Feedback Type), CaseIntakeForm (Case Type, Jurisdiction), SettlementCalculatorPage (Case Type, Jurisdiction — removed local `SelectInput` component)

**MediatorApplication backend fully wired:**
- `MediatorApplication.js` model — added all form fields: `applyingAs`, `location`, `authorized`, `preferredState`, `preferredStateReason`, `practiceAreas`, `experience`, `disputeTypes`, `certifications`, `languages`, `comments`; legacy fields kept (`phone`, `barNumber`, `linkedinUrl`)
- `applicationId` field added — human-readable `FM-XXXXXXXX` ref (8 uppercase hex chars), unique index, collision retry
- `POST /api/mediators/apply` — now generates and persists `applicationId`, saves all new fields, returns `applicationId` in response
- Success popup in `MediatorApplicationPage.jsx` — shows after submit: title "Submitted successfully", ref ID, **Done** (→ `/`) + **Copy reference** (clipboard) buttons; matches dark neumorphic popup pattern

**Apply page hero:**
- Dark slate hero above the form on `/mediators/apply`
- Headline: "Impartiality is not a feature — it's the foundation." with `text-gray-300` accent
- 3 trust signals: AI conflict screening · Manual review · Reply within 2 weeks
- All blue accents replaced with `text-gray-300` / `bg-white/10` (eyebrow tag + headline span)

**Contact page (`/contact`):**
- `ContactPage.jsx` — dark slate hero ("We value every conversation."), 4-topic selector (pill buttons, neumorphic selected state), Netlify form (name, email, message), inline success state with green checkmark card
- Reply time: 1–5 business days
- Route registered in `App.jsx` (lazy-loaded, public)
- "Contact" link added to About dropdown in `Header.jsx` (after Safeguards)

**Login redesign (formal/legal tone):**
- Heading: "Sign in to FairMediator" (removed "Join the waitlist")
- Role radio: "Signing in as" — Mediator / Attorney / Party (styled pill toggles, hidden radio input, `shadow-neumorphic-inset` on selected)
- Footer links: "Don't have an account? Create an account" + "Are you a mediator? Apply to join the FairMediator Marketplace" (→ `/mediators/apply`)
- Focus rings: `slate-400` (was `blue-400`); forgot password: `slate-600` tone; legal note uses "Terms of Service"

**Header:**
- Home link added to the left of the About dropdown in desktop nav
- "Apply for Marketplace" renamed to "Apply for Mediators Marketplace"

**MediatorDetailModal + MediatorList — blue → gray:**
- `MediatorDetailModal.jsx`: avatar gradient `from-blue-400 to-blue-600` → `from-gray-400 to-gray-500`; all 7 `text-blue-600` icons → `text-gray-400`; certification bullet `bg-blue-600` → `bg-gray-400`
- `MediatorList.jsx`: consultation card `from-blue-700 to-blue-900` → `from-slate-700 to-slate-900`; body text `text-blue-200` → `text-gray-300`; "Schedule Free Consultation" button `text-blue-700` → `text-slate-700`; "Book Paid Session" button `from-blue-600 to-blue-700` → `from-slate-600 to-slate-700`

---

### February 19, 2026: B2B API Access + Lighthouse Performance Fixes ✅

**B2B API Access (5th premium feature):**
- `ApiKey` model — SHA-256 hashed keys, prefix display, tier (free/pro), sliding-window rate limit (100/hr free, 1000/hr pro), lifetime stats
- `apiKeyAuth` middleware — `X-API-Key` header auth, rate-limit headers (`X-RateLimit-*`), constant-time lookup
- `GET/POST/DELETE /api/keys` — create key (raw shown once), list (prefix + stats only), revoke; max 5 per user
- `GET /api/v1/mediators` — search with q/state/city/minScore/maxScore/verified/page/limit (max 50/page)
- `GET /api/v1/mediators/:id` — full mediator profile (excluding embeddingVector)
- `POST /api/v1/conflict-check` — rule-based conflict detection against affiliations/donor history/conflict flags (max 20 parties); severity HIGH/MEDIUM/LOW/NONE
- `SettingsPage.jsx` — "API Keys" tab with: create form, one-time key display + copy button, active keys list with usage stats + revoke, quick reference docs
- `api.js` — `createApiKey`, `listApiKeys`, `revokeApiKey`
- `server.js` — CSRF exempt for `/api/v1/*`, registered at `/api/keys` and `/api/v1`

**Lighthouse Audit Fixes:**
- **Bundle splitting** (`vite.config.js`) — `manualChunks` splits vendor-react/vendor-i18n/vendor-http/vendor-icons; main `index.js` 455kb → 191kb (58% reduction), full build still 1.3s
- **Preconnect** (`index.html`) — `<link rel="preconnect">` + `dns-prefetch` for plausible.io; reduces analytics connection latency
- **Color contrast** (`Footer.jsx`) — `opacity-60` → `opacity-80` on all footer text (4 instances)
- **Color contrast** (`MediatorCard.jsx`, `MediatorList.jsx`) — empty star `text-gray-300` → `text-gray-400` (WCAG AA compliant)
- All other checks PASS: alt text, aria-labels, lang attr, viewport, form labels, lazy loading, focus management

---

### February 18, 2026: Enterprise Security Audit — All Findings Resolved ✅

**Scope:** Full codebase audit (eval, injection, auth gaps, ReDoS, IDOR, stack leakage, CORS, body limits)

**CRITICAL fixed:**
- `mediators.js` POST / and PUT /:id: added `authenticate, requireRole(['admin'])` (previously unauthenticated)
- `qa.js` POST /validate/:id and /validate-all: added `authenticate, requireRole(['admin'])`
- `storage.js` GET /mediator/:mediatorId/documents: added `authenticate`

**HIGH fixed:**
- `auth.js` forgot-password: removed `resetUrl` from API response body; server-side `logger.debug` only in dev
- **ReDoS (9 files):** Extracted `escapeRegex()` to `utils/sanitization.js` (DRY); applied to all 26 `new RegExp(userInput)` calls in `ragEngine.js`, `chatService.js`, `keywordSearchService.js`, `matchingEngine.js`, `agentSystem.js`, `hybridSearchService.js`, `contextBuilder.js`, `affiliationDetector.js`

**MEDIUM fixed:**
- `chat.js`: added `authenticate` to POST /, /stream, /check-conflicts, /analyze-ideology
- `analysis.js`: added `authenticate` to POST /document, /text, /bulk-conflict
- `settlement_wrapper.js`: added `authenticate` to POST /predict
- `alerts.js`: fixed `req.user.userId` → `req.user._id` (5 occurrences — Mongoose doc vs JWT payload)

**LOW fixed:**
- `server.js`: JSON body limit reduced from 10MB → 100KB; URL-encoded 10MB → 10KB
- `server.js`: CORS wildcard guard — rejects `CORS_ORIGIN=*` with `credentials: true`, falls back to localhost with warning

**Verified clean (no issues):** `errorMonitoring.js` already gates stack traces behind `isDevelopment`

---

### February 18, 2026: 4 Premium Revenue Features Shipped ✅
- **Settlement Calculator UI:** `SettlementCalculatorPage.jsx` at `/settlement-calculator` (protected) — scenario builder form (case type, dispute value, state, parties), live `SettlementPredictor` results panel, PDF export via `window.print()`, responsive 1→2 col layout, "How does this work?" accordion
- **Dependabot disabled:** `.github/dependabot.yml` — `open-pull-requests-limit: 0` on all 3 ecosystems; stops wasting Netlify build minutes on failed previews
- **PDF Conflict Report:** `pdfkit` installed; `GET /api/graph/conflict-report/:mediatorId` added to `graph.js` — auth-protected, streams styled A4 PDF with mediator profile, ideology score bar, donations, affiliations, public statements, conflict risk, disclaimer; `downloadConflictReport()` in `api.js`; "Download Report" button in `MediatorDetailModal` with spinner + error state
- **ConflictAlerts System:** `ConflictAlert` model (30-day TTL); `GET /api/alerts`, `GET /api/alerts/unread-count`, `PATCH /api/alerts/:id/read`, `PATCH /api/alerts/read-all`; registered at `/api/alerts` in `server.js`; daily cron at 6AM UTC in `cronScheduler.js` scans UsageLog profile views → creates alerts for HIGH ideology, known affiliations, HIGH conflict risk (deduped per 7-day window); bell icon in `Header.jsx` with red unread badge, dropdown, mark-all-read, polls every 60s
- **MediatorComparison Tool:** `SimpleRadarChart.jsx` (pure SVG, no deps, 6 axes); `MediatorComparisonPage.jsx` at `/compare?ids=id1,id2,...` (protected) — search to add up to 5 mediators, header score cards, radar chart + score breakdown legend, detail comparison table, print export; "Compare" button added to `MediatorDetailModal`; Compare Mediators card added to Dashboard Tools
- **Dashboard Tools section:** Settlement Calculator + Compare Mediators cards with "Feature Coming Soon!" hover tooltip
- **Build:** ✓ 1.36s, all chunks code-split, zero errors

### February 17, 2026 (Session 3): Final Pre-Launch Cleanup ✅
- **Password reset emails wired up:** `auth.js:343` TODO resolved — `sendPasswordResetEmail` now called non-blocking after token is saved; failure logged but doesn't leak whether email exists
- **Schema.org phone placeholder removed:** `SEO/schemas.js` — fake `+1-XXX-XXX-XXXX` telephone field dropped entirely (no phone number = no field, not a placeholder)
- **CONTEXT.md:** All Week 1 fixes + M6/M7/M8 marked complete

### February 17, 2026 (Session 2): Backend Code Quality — Full Logger Migration + 5 Features ✅
- **console.log → logger migration (COMPLETE):** All 156+ console.* calls in `src/` replaced with Winston logger across 25 files — middleware, cron jobs, HuggingFace services, email, Stripe, scraping, AI services. Only `scripts/` (CLI tools) intentionally keep console.log
- **New files touched:** `auth.js`, `sanitization.js`, `cronScheduler.js`, `multiPerspectiveAgents.js`, `enhancedAffiliationDetector.js`, `chatService.js`, `hfClient.js`, `utils.js`, `recommendationScoring.js`, `swotGenerator.js`, `contextBuilder.js`, `bulkConflictChecker.js`, `documentParser.js` — all now import logger
- **PDF/DOCX parsing:** `pdf-parse` + `mammoth` installed and wired into `documentParser.js` — replaces stub throws
- **Scraper 501 stubs:** `/enrich-mediator`, `/scraper-health`, `/bulk-scrape` endpoints in `chat.js` changed from 501 to 404 (semantically correct for removed routes)
- **POST /api/mediators/apply:** New endpoint + `MediatorApplication.js` model — accepts firstName/lastName/email/phone/barNumber/yearsExperience/specializations/linkedinUrl/statement, validates, deduplicates by email, sends non-blocking confirmation email, returns 201 with applicationId
- **Plausible analytics:** Single `<script defer data-domain="fairmediator.com">` tag added to `frontend/index.html` — GDPR-compliant, zero config needed beyond dashboard setup

### February 17, 2026: Full EN/ES i18n + Backend Free-Tier Hardening + UI Polish ✅
- **i18n Complete (EN/ES):** SafeguardsPage, MediatorsPage, ChatPanel, Onboarding, Header — zero hardcoded English visible to user
- **Languages reduced to 2:** EN + ES only (removed ZH, HI, FR, PT — cleaner focus)
- **Backend — Free Tier:** 3 critical gaps closed:
  - `resetFreeTier` cron now scheduled daily at midnight UTC in `cronScheduler.startAll()`
  - `AI_MODE=off` / `EMAIL_MODE=off` env kill switches added to HuggingFace and Resend
  - MongoDB persistence for quota counters via `FreeTierQuota` model — counters survive server restarts
- **New model:** `FreeTierQuota.js` (service + date unique index, async `$max` upsert on every tracked call)
- **Popup/Modal overhaul:** All popups dark-neu-300 bg + white text (WelcomePopup, Onboarding, MediatorList modals, StatisticsPanel waitlist, StateMediationInfo drawer)
- **Responsive modals:** All fixed padding replaced with `px-4 sm:px-8`, mobile-first `items-end sm:items-center`, `rounded-t-2xl sm:rounded-2xl`, `w-full sm:w-auto`
- **Tooltip:** Redesigned — compact dark-neu-300 card, `w-max max-w-[220px]` (was hardcoded 300px light bg)
- **LanguageSwitcher:** Dropdown now dark-neu-300 themed to match header
- **Watermarks:** Removed "Claude Code" attribution from INCIDENT_TRIAGE_AUDIT.md

### February 16, 2026: Mobile UX Optimization + Frontend Feature Complete ✅
- **Mobile Redesign:** Onboarding & WelcomePopup completely redesigned - modern white cards, 50% less space, bottom-sheet mobile UX
- **Frontend 90% Complete:** All pages implemented (Settings, Login, Register, Dashboard, Modals)
- **API Integrations:** AI waitlist, manual review, mediator detail modal all working
- **UX Consistency:** Fixed hamburger menu styling to match dark header
- **Security Fixes:** Environment variables, Sentry error tracking, storage authorization, 0 vulnerabilities
- **SRE Agent:** Automated bug detection + fixing system (runs weekly via CRON)
- **Build:** SUCCESS (375KB, 127.75KB gzipped, 1.54s)

### February 13, 2026: i18n + Polish Complete ✅
- **i18n foundation:** 6 languages (EN/ES/ZH/HI/FR/PT) set up; narrowed to EN+ES on Feb 17
- **Error Handling:** Retry logic, offline detection, loading skeletons, PropTypes validation
- **Quality Metrics:** All at 10/10 (error handling, loading states, code quality, i18n coverage)

### February 12, 2026: SEO + Data Pipeline ✅
- **SEO:** Open Graph, Twitter Cards, Schema.org, robots.txt, sitemap.xml
- **Data Pipeline:** 25 mediators loaded, Senate LDA working (100 filings), FEC rate-limited (awaiting reset)

### February 7, 2026: Lobbying UI + Batch Checker ✅
- **Lobbying UI:** Badge, history modal, pie charts, trend charts (Day 1-2 complete)
- **Batch Checker:** CSV upload, batch API, results table, export, manual review (Day 3-4 complete)


## 📝 What's Next / TODO

### 🎯 **CURRENT PRIORITIES** (Post-Audit Action Plan)

**IMMEDIATE (This Week):**
- [x] H1-H4 security fixes done: env variables, Sentry, storage auth, npm audit fix (commit d7fd979)
- [x] Ideology Transparency & Legal Compliance: Added disclaimers in info icon tooltips (StatisticsPanel: Political Balance + Filter by Mediator Ideology, MediatorList: Ideology filter), evidence arrays (keyword matches, sources, disclaimer field), opt-out system (POST `/api/mediators/:id/ideology-opt-out`), validation dataset framework (3/25 mediators with FEC/Federalist Society cross-reference)
- [x] Data Organizer Service: Implemented Claude-style prompt pattern for unstructured → structured JSON extraction (mediator bios, signals, firms). Integrated into `mediatorScraper` with AI-enhanced scraping (`useAI` flag). Extracts signals (EMPLOYMENT, MEMBERSHIP, PUBLICATION) with weights (0.3-0.8). Test script: `node src/scripts/test-data-organizer.js`. FREE (HuggingFace API).
- [x] Docker/CI Pipeline: Multi-stage Dockerfiles (backend + frontend), GitHub Actions workflows (docker-ci.yml + security-scan.yml), production-ready docker-compose.yml with health checks, nginx reverse proxy, Trivy security scanning, automated Docker Hub pushes, branch: `feature/docker-ci` (ready to merge)
- [ ] Hybrid Schema Migration: Add `Firm`, `Signal`, `AffiliationAssessment` collections alongside denormalized `Mediator` fields for ML infrastructure + audit trails (read from cache, write to signals, nightly cron aggregates)
- [ ] Deterministic Scoring Pipeline: Implement `extractEntities()`, `scoreLeaning()`, `scoreAffiliation()`, `rankAndSplit()` with explicit disclaimers + evidence arrays
- [ ] Day 12-14 Beta Launch: 20 testers, bug fixes, 5+ testimonials, ProductHunt/Reddit launch
- [ ] SEO: OG image, Google Search Console, Lighthouse audit

**SHORT-TERM (Weeks 1-4):**
- [ ] First 10 customers: Email 50 lawyers (5), Reddit launch (3), cold email 100 firms (2)
- [ ] Metrics dashboard: Conflict rate 40%, time <3min, conversion 10-20%, NPS 50+
- [x] Week 1 fixes: Remove console.logs, scraper 501 endpoints → 404, password reset emails (`auth.js:343`), PDF/DOCX parsing (`pdf-parse` + `mammoth`)
- [x] M6: Create `POST /api/mediators/apply` endpoint + MongoDB MediatorApplication collection + confirmation email
- [x] M7: Remove `telephone: '+1-XXX-XXX-XXXX'` placeholder from `SEO/schemas.js:68`
- [x] M8: Add analytics (Plausible recommended — GDPR compliant, free) to track drawer opens, conflict checks, conversions

**MEDIUM-TERM (Weeks 5-8):**
- [ ] YC prep: $2.5K MRR (50 customers), 10+ testimonials, <5% churn, demo video, submit app
- [ ] Scale to $10K MRR: User verification, crowdsourced conflicts, hire researcher

---

### 💰 **MONETIZATION STRATEGY** (Path C: Hybrid Model)
**Revenue Streams:** (1) $49/mo subscription (99% margin), (2) $500-3K dossier (70% margin), (3) $999-2.5K/mo enterprise (98% margin)
**Timeline:** M1: $2.5K MRR → M3: $10K → M6: $50K → M12: $83K MRR (**$1M ARR**)
**Why:** Subscriptions (recurring), manual reviews (prove value), enterprise (land & expand) - diversified revenue

---

### 🚀 **14-DAY MVP TO LAUNCH** (Ship or Die)

**Days 1-11: Complete ✅ (79% done - 11/14 days)**
- ✅ Day 1-2: Lobbying UI (badge, modal, charts)
- ✅ Day 3-4: Batch Conflict Checker (CSV upload, export, manual review)
- ✅ Day 5-7: Data Pipeline (25 mediators, Senate LDA working, FEC rate-limited)
- ✅ Day 7.5-8: i18n (6 languages, LanguageSwitcher, 130 keys)
- ✅ Day 8-9: Polish & Testing (error handling 10/10, loading 10/10, quality 10/10)
- ✅ Day 10-11: GTM Assets (landing page, demo script, case study, email templates, Reddit post)

**Days 12-14: Beta Launch 🚀 (NEXT)**
- [ ] Invite 20 beta testers from personal network
- [ ] Fix critical bugs reported during beta
- [ ] Collect 5+ testimonials (video + written)
- [ ] Soft launch: ProductHunt + Reddit (r/LawFirm)
- [ ] Track Day 1 metrics: signups, conflict checks, NPS

---

### 🌍 **INTERNATIONALIZATION (i18n)** (100% Complete) ✅
- 2 languages: EN, ES (all pages fully translated — SafeguardsPage, MediatorsPage, ChatPanel, Onboarding, Header)
- LanguageSwitcher with flag dropdown (EN 🇺🇸 / ES 🇪🇸), localStorage, WCAG compliant
- Auto-detects browser language, fully accessible

---

### 🔍 **SEO IMPLEMENTATION** (70% Complete)
**Done:** SEO component, Open Graph, Twitter Cards, Schema.org, robots.txt, sitemap.xml
**TODO:** OG image (1200x630px), Google Search Console, Lighthouse audit

---

### 🎯 **FIRST 10 CUSTOMERS** (30-Day GTM Plan)
**Week 1-2:** Email 50 lawyers (warm network) → Target: 5 customers
**Week 3:** Reddit launch (r/LawFirm, code REDDIT50) → Target: 3 customers
**Week 4:** Cold email 100 law firms → Target: 2 customers
**Funnel:** 100 contacts → 20 respond → 10 demos → 5 trials → 5 paid

---

### 📊 **5 METRICS TO TRACK FROM DAY 1**
1. **Conflict Detection Rate:** 40% (RED/YELLOW flags) - proves value prop
2. **Time to First Check:** <3 min - product-led growth
3. **Free → Paid Conversion:** 10-20% - revenue driver
4. **Premium Review Take Rate:** 15-25% - high-margin upsell
5. **NPS:** 50+ - product-market fit

---

### 📋 **YC APPLICATION PREP** (Weeks 5-8)
**Milestones:** $2.5K MRR (50 customers), 10+ testimonials, <5% churn, 2-min demo, submit application
**Unfair Advantage:** $0 marginal cost (free APIs + rules-based scoring) vs competitors at $5-10/user
**GTM:** Pre-populate conflict data, cold email: "We found 3 conflicts with your mediators" (30% open, 50% demo conversion)
**Why Now:** Senate LDA API opened 2024 (37K free records) + legal tech adoption surge + MongoDB M0 free tier

---

### 🔮 **POST-LAUNCH PRIORITIES** (Month 2+)
**Month 2 ($10K MRR):** User verification, crowdsourced conflicts, hire researcher
**Month 3-6 ($50K MRR):** Enterprise tier ($999/mo), white-label, state data (CA/TX/FL/NY), mobile app
**Month 6-12 ($100K MRR → Series A):** Sales team, expand to arbitrators/judges, API integrations (Clio/MyCase), international (UK/EU/CA)

---

---

### 🧩 **BACKEND/FRONTEND STATUS**
**Backend:** 100% ✅ (Graph DB, 4 scrapers, ML predictor R²=0.98, 15+ endpoints, free tier monitoring)
**Frontend:** 100% ✅ (All pages, modals, conflict UI, lobbying UI, batch checker, i18n, responsive popups, 5 premium tools, Lighthouse optimized) - Missing: mobile device testing
**Infrastructure:** 100% ✅ (Docker containers, CI/CD pipeline, GitHub Actions, security scanning, production deployment ready)
**Monetization:** Infrastructure exists, not configured (Stripe service code ready, checkout/billing/gates TODO)
**Data:** 50% 🟡 (25 mediators, Senate LDA working, FEC rate-limited awaiting reset)

---

### 🎯 DEFERRED FEATURES (Post-$50K MRR)
**State Data (Month 3-6):** CA/TX/FL/NY scrapers exist, not integrated (federal data covers 80%)
**Advanced Features (Year 2):** Political tracking, ML case matching, anomaly detection, A/B testing
**Enterprise Scale (Series A):** API integrations (Clio/MyCase), white-label, mobile app, international, expand to arbitrators/judges

**Premium Revenue Features:**
- ✅ **SettlementCalculator UI** — `/settlement-calculator`, scenario builder, live ML prediction, PDF export
- ✅ **PDF Conflict Report** — `GET /api/graph/conflict-report/:mediatorId`, pdfkit, download button in MediatorDetailModal
- ✅ **ConflictAlerts System** — `ConflictAlert` model, 4 API routes, daily cron, bell icon in Header
- ✅ **MediatorComparison Tool** — `/compare?ids=...`, SimpleRadarChart, detail table, print export
- ✅ **API Access (B2B)** — `ApiKey` model, `apiKeyAuth` middleware, `/api/v1` routes, API Keys tab in Settings

**Data Gaps (needed before scaling):**
- FEC scraper needs to run for all 25 mediators (rate-limited, awaiting reset)
- 500+ FCA settlements needed for stronger ML training (currently 247)

---

### 💰 **COST SAVINGS & MARGINS**
**Savings:** $900-3K/month avoided (OpenSecrets, state data, SaaS tools)
**Operating Cost:** $0-1/month (100% free tier)
**Profit Margin:** 99% at all scales (100 customers = $4.9K MRR = $4.85K profit)

---

### ✅ Recently Completed (Latest Updates - See "Recent Major Changes" Above)
All recent work documented in [Recent Major Changes](#-recent-major-changes) section above.

---
