# Doc-swarm — free multi-agent doc-drift fixer

Keeps the repo-root docs (`README`, `PROJECT_AUDIT`, `UX_FLOW`, `context`,
`CHANGELOG`, `CONTRIBUTING`, `SECURITY`, `PRODUCT_ARCHITECTURE`) honest by
checking what they *claim* against what's actually in the repo, then proposing
fixes.

```
detector  →  fan out one writer agent per drifted doc  →  verifier  →  proposals
(free, Node)        (local Ollama, parallel)            (re-check)   (you review)
```

## The two commands

```bash
npm run docs:detect    # deterministic, $0, no AI — runs anywhere (CI, pre-commit)
npm run docs:swarm     # detector + Ollama writers + verifier → proposed rewrites
```

`docs:detect` exits non-zero when it finds drift, so it can gate CI.

## What the detector catches (deterministically, no AI)

| Check | Example it caught here |
|---|---|
| **dead-link** | docs reference `DEPLOYMENT.md`, `CODE_OF_CONDUCT.md`, … that don't exist |
| **contradiction** | security score is `100/100` in README but `90/100` everywhere else |
| **stale-gap** | docs say "frontend tests not configured" but `frontend/vitest.config.js` exists |
| **stale-blocker** | docs say work is "blocked by the settlement predictor bug" but `proof_of_work.json` shows it's fixed |
| **empty-doc** | `automation/README.md` / `frontend/README.md` are placeholders |

Add new rules in `config.js` — each one becomes a permanent free check.

## The engine (writer/verifier) — local Ollama, $0

The swarm uses a local model, so there's no API key and no metering. One-time
setup (paste into the prompt with the `!` prefix so output lands here):

```
! brew install ollama
! ollama serve &
! ollama pull qwen2.5-coder
```

Override the model/host with env vars: `OLLAMA_MODEL`, `OLLAMA_HOST`.

If Ollama isn't running, `docs:swarm` still prints the free detector report and
tells you how to enable the agents — it never fails silently.

## Reviewing proposals

Writers never touch your docs. They write to `scripts/doc-swarm/proposed/<doc>`.

```bash
git diff --no-index README.md scripts/doc-swarm/proposed/README.md
cp scripts/doc-swarm/proposed/README.md README.md   # apply one
```

The `proposed/` directory is disposable — safe to delete or gitignore.

## Files

| File | Role |
|---|---|
| `config.js` | the invariants the detector enforces |
| `detect.js` | deterministic detector (the free core) |
| `ollama.js` | local-model client |
| `writer.js` | writer agent — rewrites one doc from its findings |
| `orchestrate.js` | detector → writer fan-out → verifier |
| `lib.js` | fs helpers |

## Wiring it into CI / pre-commit (optional next step)

- **CI gate:** add `npm run docs:detect` as a step in
  `.github/workflows/security-scan.yml` — fails the build on drift, $0.
- **Pre-commit:** call `npm run docs:detect` from a git hook to block drift
  before it's committed.
- **Weekly coworker:** a scheduled GitHub Action can run `docs:swarm` and open
  a PR with the proposals.
