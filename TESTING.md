# Testing

## Layers

| Layer | Tool | Location | Run |
|---|---|---|---|
| Backend integration + unit | Jest | `backend/tests/` | `npm test` |
| Frontend component | Vitest + Testing Library | `frontend/src/**/*.test.jsx` | `npm run test --prefix frontend` |
| End-to-end | Playwright | `frontend/e2e/` | `npm run test:e2e --prefix frontend` |
| Doc drift | Doc-swarm detector | `scripts/doc-swarm/` | `npm run docs:detect` |
| Dependency audit | npm audit | — | `npm run audit` |

## Backend

```bash
npm test                  # all backend suites
npm run test:coverage     # with coverage
```

Suites cover auth, dashboard, marketplace, mediators, rate limiting, the merged
`clients` router, AI systems, and prompt-injection safety.

## Frontend

```bash
cd frontend
npm run test              # vitest run
npm run test:watch        # watch mode
```

The vitest scaffold (`frontend/vitest.config.js`, jsdom env) is in place; the
suite is small and growing. Add component tests next to the components they
cover (`Component.test.jsx`).

## End-to-end

```bash
cd frontend
npm run test:e2e          # Playwright against a local Vite dev server
```

A smoke spec (`frontend/e2e/landing.spec.js`) asserts the 2-card landing page
renders. Expand to cover the three critical flows: registration → search,
mediator application, and conflict check.

## CI

GitHub Actions runs CodeQL and the doc-drift detector on every push/PR to
`main` (`.github/workflows/security-scan.yml`).

## Conventions

- Write a test with every new feature; keep existing suites green.
- Cover security scenarios (injection, auth bypass) for new endpoints.
- Prefer the shared utilities in `backend/src/utils/` and
  `frontend/src/utils/` over duplicating setup.
