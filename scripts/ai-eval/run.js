#!/usr/bin/env node
/**
 * AI eval harness — a golden-set regression gate for the AI features.
 *
 * Mirrors the doc-swarm: deterministic core, zero dependencies, free, and
 * CI-gateable. Each feature is scored against a committed golden dataset using
 * predictions from a committed snapshot. Features with no snapshot are SKIPPED
 * (not failed) so the gate is useful before every model is wired up.
 *
 *   node scripts/ai-eval/run.js          human report; non-zero exit on regression
 *   node scripts/ai-eval/run.js --json   machine-readable results
 *
 * Refresh snapshots from the live services locally — see README.
 */
const path = require('path');
const config = require('./config');
const { readJson } = require('./lib');
const { classification } = require('./metrics');

const DIR = __dirname;

function scoreProperty(dataset, snapshot) {
  const preds = snapshot.predictions || {};
  const issues = [];

  for (const [id, v] of Object.entries(preds)) {
    if (typeof v !== 'number' || Number.isNaN(v)) {
      issues.push(`${id}: prediction is not a number`);
    } else if (v < dataset.bounds.min || v > dataset.bounds.max) {
      issues.push(`${id}: ${v} out of bounds [${dataset.bounds.min}, ${dataset.bounds.max}]`);
    }
  }

  for (const d of dataset.discrimination || []) {
    const a = preds[d.a];
    const b = preds[d.b];
    if (a == null || b == null) {
      issues.push(`discrimination ${d.a}/${d.b}: missing prediction`);
      continue;
    }
    const ratio = Math.max(a, b) / Math.min(a, b);
    if (ratio < d.minRatio) {
      issues.push(`discrimination ${d.a}/${d.b}: ratio ${ratio.toFixed(2)} < ${d.minRatio}`);
    }
  }

  return {
    pass: issues.length === 0,
    summary: issues.length
      ? issues.join('; ')
      : `${Object.keys(preds).length} predictions in bounds; discrimination holds`,
  };
}

function scoreClassification(dataset, snapshot, feature) {
  const preds = snapshot.predictions || {};
  const pairs = [];
  for (const c of dataset.cases) {
    if (preds[c.id] != null) pairs.push({ expected: c.expected, predicted: preds[c.id] });
  }
  const m = classification(pairs, dataset.classes);
  const value = m[feature.metric];
  return {
    pass: value >= feature.threshold,
    summary: `${feature.metric}=${value.toFixed(3)} (threshold ${feature.threshold}), n=${pairs.length}`,
  };
}

function main() {
  const results = [];
  let failed = 0;
  let skipped = 0;

  for (const [name, f] of Object.entries(config.features)) {
    const dataset = readJson(path.join(DIR, f.dataset));
    if (!dataset) {
      results.push({ name, status: 'fail', summary: `missing dataset ${f.dataset}` });
      failed++;
      continue;
    }
    const snapshot = readJson(path.join(DIR, f.snapshot));
    if (!snapshot) {
      results.push({ name, status: 'skip', summary: 'no snapshot yet — run live to generate (see README)' });
      skipped++;
      continue;
    }
    const r = f.type === 'property'
      ? scoreProperty(dataset, snapshot)
      : scoreClassification(dataset, snapshot, f);
    results.push({ name, status: r.pass ? 'pass' : 'fail', summary: r.summary });
    if (!r.pass) failed++;
  }

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log('AI eval:');
    for (const r of results) {
      const mark = r.status === 'pass' ? '✓' : r.status === 'fail' ? '✗' : '·';
      console.log(`  ${mark} ${r.name} [${r.status}] — ${r.summary}`);
    }
    const passed = results.length - failed - skipped;
    console.log(`\n${passed} passed, ${failed} failed, ${skipped} skipped.`);
  }

  process.exitCode = failed ? 1 : 0;
}

if (require.main === module) main();

module.exports = { scoreProperty, scoreClassification };
