/**
 * AI eval configuration.
 *
 * Each feature is scored against a committed golden dataset using predictions
 * from a committed snapshot. A feature with no snapshot is SKIPPED (not failed)
 * so the gate is useful before every model is wired up — same graceful posture
 * as the doc-swarm.
 *
 *   type: 'property'        invariant checks (bounds, discrimination)
 *   type: 'classification'  macro-F1 / accuracy vs a threshold
 */
module.exports = {
  features: {
    // Settlement predictor — we don't have public ground-truth labels, so we
    // gate on properties that must hold: plausible bounds and that very
    // different cases produce meaningfully different predictions (the exact
    // regression the 2026-06-05 retrain fixed).
    settlement: {
      type: 'property',
      dataset: 'datasets/settlement.json',
      snapshot: 'snapshots/settlement.json',
    },

    // Ideology classifier — labeled synthetic cases. Awaiting first live
    // snapshot (see README); skipped until then.
    ideology: {
      type: 'classification',
      dataset: 'datasets/ideology.json',
      snapshot: 'snapshots/ideology.json',
      metric: 'macroF1',
      threshold: 0.70,
    },

    // Conflict / affiliation badge — labeled synthetic cases. Awaiting first
    // live snapshot; skipped until then.
    conflict: {
      type: 'classification',
      dataset: 'datasets/conflict.json',
      snapshot: 'snapshots/conflict.json',
      metric: 'macroF1',
      threshold: 0.75,
    },
  },
};
