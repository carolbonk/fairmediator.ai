# FairMediator — Frontend

React 18 + Vite + Tailwind CSS. The marketplace + CRM single-page app.

## Develop

```bash
npm install
npm run dev        # Vite dev server
```

## Build

```bash
npm run build      # outputs to dist/
npm run preview    # serve the production build locally
```

## Test

```bash
npm run test       # vitest run
npm run test:e2e   # Playwright (frontend/e2e/)
```

## Layout

```
src/
  components/   reusable UI (auth/, common/, dashboard/, subscription/, ...)
  pages/        route-level pages (LandingPage, dashboards, CRM, marketplace)
  contexts/     AuthContext, WorkspaceContext
  services/     API clients
  utils/        apiFactory and shared helpers
  App.jsx       routing
```

Deployed to Netlify (`../netlify.toml`). See `../DEPLOYMENT.md` for the full
deploy flow and `../TESTING.md` for the testing strategy.
