/**
 * Scoring metrics for the AI eval harness. No dependencies.
 */

/**
 * Classification metrics over [{expected, predicted}] pairs.
 * Returns accuracy and macro-averaged F1 (mean of per-class F1).
 */
function classification(pairs, classes) {
  const cls = classes || [...new Set(pairs.flatMap((p) => [p.expected, p.predicted]))];
  const tp = {}, fp = {}, fn = {};
  for (const c of cls) { tp[c] = 0; fp[c] = 0; fn[c] = 0; }

  let correct = 0;
  for (const { expected, predicted } of pairs) {
    if (expected === predicted) {
      correct++;
      if (tp[expected] != null) tp[expected]++;
    } else {
      if (fp[predicted] != null) fp[predicted]++;
      if (fn[expected] != null) fn[expected]++;
    }
  }

  const f1s = cls.map((c) => {
    const precision = tp[c] / (tp[c] + fp[c] || 1);
    const recall = tp[c] / (tp[c] + fn[c] || 1);
    return precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  });

  return {
    n: pairs.length,
    accuracy: pairs.length ? correct / pairs.length : 0,
    macroF1: f1s.length ? f1s.reduce((a, b) => a + b, 0) / f1s.length : 0,
  };
}

module.exports = { classification };
