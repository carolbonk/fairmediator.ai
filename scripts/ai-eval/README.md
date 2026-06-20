# AI eval harness

A golden-set regression gate for FairMediator's AI features — the safety net the
project was missing. Same philosophy as the doc-swarm: a deterministic,
zero-dependency core that runs free in CI, with graceful skips for anything not
yet wired up.

```bash
npm run ai:eval          # report; non-zero exit on regression (CI gate)
npm run ai:eval -- --json
```

## What it checks

| Feature | Type | What it asserts |
|---|---|---|
| **settlement** | property | predictions stay in plausible bounds, and very different cases produce meaningfully different outputs (the exact regression the 2026-06-05 retrain fixed) |
| **ideology** | classification | macro-F1 ≥ 0.70 on labeled cases (awaiting first snapshot) |
| **conflict** | classification | macro-F1 ≥ 0.75 on labeled cases (awaiting first snapshot) |

A feature with **no snapshot** is skipped, not failed — so the gate is useful
today (settlement) and grows as the others get snapshots.

## How it works

- `datasets/*.json` — committed golden inputs + expected labels/invariants.
- `snapshots/*.json` — committed model predictions, keyed by case `id`.
- `run.js` scores each snapshot against its dataset and exits non-zero if any
  scored (non-skipped) feature falls below threshold.

The `settlement` snapshot is seeded from `proof_of_work.json` so the gate is
live now (discrimination ratio 3.22× ≥ 1.5).

## Refreshing snapshots from the live models (local)

Snapshots are committed so CI needs no model/keys. Regenerate them locally when
a model or prompt changes, then review the diff before committing:

1. Run the relevant service against the dataset inputs:
   - **ideology** → `ideologyClassifier` (HuggingFace) per `datasets/ideology.json` case
   - **conflict** → `affiliationDetector` / conflict analysis per `datasets/conflict.json` case
   - **settlement** → the Python serving API per `datasets/settlement.json` case
2. Write results to `snapshots/<feature>.json` as `{ "predictions": { "<id>": <label|number> } }`.
3. `npm run ai:eval` and commit the snapshot if the diff is intended.

A regression then shows up as a failing snapshot diff in review — the AI
equivalent of a unit-test failure.

## Extending

- Add a feature in `config.js` (`type`, `dataset`, `snapshot`, and for
  classification a `metric` + `threshold`).
- Drop a golden dataset and a snapshot. That's it.
- Tighten thresholds as the models improve — thresholds are the contract.
