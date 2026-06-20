# Changelog

All notable product, routing, and architecture deltas land here so the
audit snapshot in `PROJECT_AUDIT.md` doesn't accumulate trailing
"Last updated" lines. Newest first. Versioning is calendar-based
(YYYY-MM-DD) until a stable release tagging scheme is adopted.

The format loosely follows [Keep a Changelog](https://keepachangelog.com/).

---

## [Unreleased]

### Added
- **Doc-drift swarm** (`scripts/doc-swarm/`) — a deterministic detector plus
  local-Ollama writer/verifier agents that keep the docs honest against the
  repo. `npm run docs:detect` (free, also a CI gate) and `npm run docs:swarm`.
- **Git hooks** (`scripts/git-hooks/`, via `core.hooksPath`) — pre-commit
  blocks secrets, AI watermarks (footers + zero-width unicode), doc drift, and
  vulnerable axios; commit-msg blocks emoji and AI attribution.
- **CI doc-drift gate** — a `docs-drift` job in `security-scan.yml` runs the
  detector on every push/PR to `main`.
- **Cron observability** — `cronMonitor.runJob` adds a heartbeat
  dead-man's-switch and failure-webhook alerting to all four scheduled jobs.
- **Missing canonical docs** — `CODE_OF_CONDUCT.md`, `DEPLOYMENT.md`,
  `TESTING.md` (previously linked but absent).
- **`context.md` at repo root** (2026-06-05) — the missing "why" doc.
  Personas, core value prop, and the reasons behind every load-bearing
  design decision (FCA data, ideology scoring transparency, the 2-card
  landing hierarchy, the attorney+party merge, the six-language i18n
  set, the deliberately small B2B API surface). Closes audit
  Suggestion #10.
- **Frontend vitest scaffold** — config, jsdom env, and a first
  `BackLink` test. The frontend test suite now exists (previously
  none); it is still tiny.
- **E2E scaffold (Playwright)** — config + smoke spec that visits `/`
  and asserts the 2-card landing renders. Runs against a local Vite
  dev server.
- **Mermaid diagrams** in `UX_FLOW.md` for the three critical flows
  (mediator apply, AI consultation, CRM entry).
- **Wireframe sketches** in `UX_FLOW.md` for the two unbuilt AI
  consultation pages.
- **Carousel-vs-grid test plan** in `UX_FLOW.md` for the Top 4 matches
  presentation.
- **Open Question #4 answered** (CRM-as-primary pressure-test) in
  `UX_FLOW.md`.

### Changed
- **PROJECT_AUDIT.md lists normalized.** Routing/Pages, Components, and
  API Routes now match the Status Update prose:
  - LandingPage and BackLink added; AttorneyPortalEntry + PartyPortalEntry
    replaced with ClientPortalEntry; ClientDashboard added (renders
    AttorneyDashboard/PartyDashboard views by accountType).
  - EarningsPage + InvoicesPage added under Mediator CRM pages.
  - `attorneys` and `parties` routes replaced with `clients`; count
    drops from 42 → 41.
- **PRODUCT_ARCHITECTURE.md synced** with the same shipped items.
  Earnings + Invoices no longer carry `[SUGGESTED - build]` markers;
  Before/After table updated; legend now includes `[SHIPPED YYYY-MM-DD]`;
  a pointer to `UX_FLOW.md` was added at the top.
- **Memory `project-fairmediator-overview` updated.** Marks the
  predictor fix and the test-skip restoration as shipped; keeps
  `[[project-ux-state-2026-05]]` as the source of truth for shipped
  UX state.

### Fixed
- **Docs reconciled with reality** — security score now consistently 90/100
  (README had drifted to 100/100); removed a dead WAF-guide link; marked the
  frontend test scaffold and the settlement-predictor retrain as shipped.
- **Settlement predictor input-mapping bug** (audit Suggestion #1).
  - Replaced `hash(jurisdiction) % 50` in
    `feature_engineering.create_prediction_input` with the new
    deterministic `encode_jurisdiction` helper (`hashlib.md5`-based).
    Python's built-in `hash()` is randomized per process
    (`PYTHONHASHSEED`), so the previous implementation never matched
    training-time encoding.
  - Aligned `clean_data.py` to call the same `encode_jurisdiction`
    instead of `pd.Categorical(...).codes`, so re-training will now
    use codes that match what the serving API emits.
  - Added `training/test_prediction_discrimination.py` —
    asserts encoder determinism and that the four canonical inputs
    from `proof_of_work.json` produce distinct engineered feature
    vectors. Fails if the bug regresses.
  - **Operational follow-up:** the committed model
    (`settlement_model_20260206_172536.joblib`) was trained on a CSV
    where subtype names (`off_label_marketing`, `procurement_fraud`)
    weren't yet mapped to fraud_type categories, so the model still
    needs to be retrained against a freshly-regenerated CSV before
    the fix is fully live in production.

---

## [2026-05-28] — Status update batch

### Added
- **LandingPage at `/`.** 2-card hierarchy; CRM primary (60%, left),
  Marketplace secondary (40%, right). Replaces the old AI-search-tool
  homepage.
- **EarningsPage at `/mediators-crm/earnings`.** Wraps the existing
  `EarningsCalculator` and restyles it in the monochrome palette.
- **InvoicesPage at `/mediators-crm/invoices`.** Status tabs
  (sent · draft · paid · overdue), create modal, per-invoice PDF
  download. The "Invoice frontend page missing" gap is closed.
- **Shared `<BackLink>` component.** Pinned below the header logo on
  every `/mediators-crm/*` and `/mediators-marketplace*` route.
  Replaces the per-page "← Go back" pattern.
- **`LegacyCrmRedirect` splat in `App.jsx`.** SPA-level 301-style
  redirect from `/app/mediator/(crm|inbox|marketplace)` to
  `/mediators-crm/(cases|inbox|marketplace)`. Old welcome-email and
  invoice-PDF links no longer 404.
- **Demo seeded account.** `demo@fairmediator.ai` /
  `Password123!` (mediator role). Attorney + party views reachable
  via the LoginForm's "Sign in as…" CTAs.

### Changed
- **CRM routing renamed.** `/app/mediator/(crm|inbox|marketplace)` →
  `/mediators-crm/(cases|inbox|marketplace)`. `/app/mediator` portal
  index itself still resolves.
- **Attorney + Party merged.** Backend `attorneys.js` + `parties.js`
  → single `clients.js` mounted at `/api/clients`, with per-endpoint
  `requirePermission` keeping attorney-only vs party-only segregated.
  Frontend `AttorneyPortalEntry` + `PartyPortalEntry` →
  `ClientPortalEntry`; new `ClientDashboard` dispatches to the
  existing `AttorneyDashboard` / `PartyDashboard` views by
  `accountType`. The `accountType` enum
  (`mediator | attorney | party`) is intentionally preserved.
- **Visual migration to monochrome neumorphic palette** (grays + white,
  no blue/gold, Apple-style whitespace).
  - Done: LandingPage, EarningsCalculator, InvoicesPage, MediatorDashboard.
  - Pending: Marketplace HomePage, ClientDashboard (attorney + party
    views). Old blue/gold still present — intentional, not a regression.

### Fixed
- **5 previously-skipped backend tests restored.** All of `dashboard`,
  `enhancedAffiliations`, `multiPerspectiveAI`, `recommendationScoring`,
  and `subscription` suites now pass. Root causes: JWT middleware was
  verifying with the wrong secret in `auth.js`; `UsageLog` enum was
  missing `upgrade_initiated` / `subscription_cancelled`;
  `analyticsService` queried `createdAt` instead of `timestamp` on
  `UsageLog` (the field never existed — stats were silently always
  empty); `roleAuth.js` called the non-existent
  `logger.security.unauthorized` and was crashing role-denied
  responses with 500. A new `clients.test.js` covers the merged
  attorney/party router. Result: 73 tests across 6 suites, 0 failing.

### Audit scale correction
- "42 routes" referred to route *files*, not endpoints. Public B2B
  surface at `/api/v1` is **3 endpoints** (`GET /mediators`,
  `GET /mediators/:id`, `POST /conflict-check`); `/api/keys` is **2
  endpoints** (create + revoke). Suggestion #5 (OpenAPI spec) is
  therefore smaller in scope than the original framing implied.

---

## [2026-05-27] — Initial audit snapshot

`PROJECT_AUDIT.md` first generated. See that file for the full
baseline of what was in place, what was missing, and the 10
suggestions. Earlier history lives in git.
