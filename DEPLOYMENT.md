# Deployment

FairMediator deploys as two services plus a database. Configuration lives in
`netlify.toml` (frontend), `render.yaml` (backend), and `docker-compose.yml`
(local / self-hosted).

## Topology

| Component | Platform | Config |
|---|---|---|
| Frontend (React + Vite) | Netlify static + CDN | `netlify.toml` |
| Backend (Node + Express) | Render.com Docker web service | `render.yaml` |
| Database | MongoDB Atlas (cloud) | `MONGODB_URI` env var |
| ML settlement predictor | Render worker (Dockerized Python) | `render.yaml` (currently commented out) |

## Frontend — Netlify

```bash
cd frontend
npm install
npm run build      # outputs to frontend/dist
```

Netlify builds from `netlify.toml` on push to `main`. Per-PR preview deploys
are automatic. Set the API base URL via the `VITE_API_URL` environment
variable in the Netlify dashboard.

## Backend — Render

Render builds the Docker image from `render.yaml` (Blueprint) on push to
`main`. Required environment variables (see `backend/.env.example` for the full
list):

- `MONGODB_URI` — MongoDB Atlas connection string
- `JWT_SECRET`, `SESSION_SECRET` — auth secrets
- `HF_API_KEY` — HuggingFace inference key
- `STRIPE_SECRET_KEY`, `RESEND_API_KEY` — optional integrations

## ML settlement predictor

The Python serving API (`backend/src/ml_models/settlement_predictor/`) ships as
a Dockerfile. The Render worker entry in `render.yaml` is currently commented
out — uncomment it to serve predictions in production, or the JS wrapper falls
back to mock data. See the predictor README for retraining.

## Local / self-hosted (Docker)

```bash
cp backend/.env.example backend/.env   # fill in secrets
docker compose up --build
```

Brings up MongoDB, backend, and frontend on the ports defined in
`docker-compose.yml`.

## Notes

- No staging environment yet — deploys go straight to production. A second
  Render service against a staging Atlas cluster is the planned fix
  (`PROJECT_AUDIT.md`, Suggestion #8).
- Pre-deploy checks: `npm run audit`, `npm test`, and `npm run docs:detect`.
