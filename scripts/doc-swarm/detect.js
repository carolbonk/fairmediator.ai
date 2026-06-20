#!/usr/bin/env node
/**
 * Doc-swarm — Detector (deterministic, zero-AI, $0).
 *
 * The always-runnable core of the swarm. Checks every owned .md against the
 * filesystem and against the other docs, and emits drift findings. No model,
 * no network — runs in CI and pre-commit for free.
 *
 * Each finding carries a `probe` the verifier uses to confirm a proposed
 * rewrite actually resolved it.
 *
 *   node scripts/doc-swarm/detect.js          human-readable report
 *   node scripts/doc-swarm/detect.js --json   machine-readable findings
 *
 * Exit code 1 if any drift is found (so it can gate CI).
 */
const config = require('./config');
const { read, exists } = require('./lib');

function detect() {
  const findings = [];
  const docs = {};
  for (const f of config.docFiles) {
    const c = read(f);
    if (c != null) docs[f] = c;
  }

  // 1. Dead links — a doc has a Markdown link [text](file.md) to a file that
  //    doesn't exist. Bare prose mentions (e.g. an audit doc listing a file as
  //    "missing") are intentionally NOT flagged — that's the audit doing its job.
  for (const ref of config.referencedDocs) {
    if (exists(ref)) continue;
    const linkRe = new RegExp('\\]\\(\\.?/?' + ref.replace(/[.]/g, '\\.') + '\\)');
    for (const [doc, body] of Object.entries(docs)) {
      if (linkRe.test(body)) {
        findings.push({
          doc, type: 'dead-link', severity: 'high',
          message: `has a Markdown link to ${ref}, which does not exist`,
          fix: `create ${ref} or remove the broken link`,
          probe: { kind: 'absent-regex', source: '\\]\\(\\.?/?' + ref.replace(/[.]/g, '\\.') + '\\)', flags: '' },
        });
      }
    }
  }

  // 2. Cross-doc numeric contradictions.
  for (const chk of config.numericChecks) {
    const seen = {}; // value -> [docs]
    for (const [doc, body] of Object.entries(docs)) {
      const re = new RegExp(chk.pattern.source, chk.pattern.flags);
      let m;
      while ((m = re.exec(body)) !== null) {
        (seen[m[1]] = seen[m[1]] || []).push(doc);
      }
    }
    const values = Object.keys(seen);
    if (values.length > 1) {
      const detail = values
        .map((v) => `${v} (${[...new Set(seen[v])].join(', ')})`)
        .join(' vs ');
      const docsHit = [...new Set(values.flatMap((v) => seen[v]))].join(', ');
      findings.push({
        doc: docsHit, type: 'contradiction', severity: 'high',
        message: `${chk.label} disagrees across docs: ${detail}`,
        fix: 'reconcile every doc to the authoritative value',
        probe: { kind: 'manual' }, // cross-doc; verified by re-running detect
      });
    }
  }

  // 3. Stale gaps — doc says X is missing, but the artifact for X exists.
  for (const g of config.staleGaps) {
    if (!exists(g.resolvedIfExists)) continue; // genuinely still missing
    const re = new RegExp(g.stalePattern.source, g.stalePattern.flags);
    for (const [doc, body] of Object.entries(docs)) {
      if (re.test(body)) {
        findings.push({
          doc, type: 'stale-gap', severity: 'medium',
          message: `claims "${g.name}" is missing/unbuilt, but ${g.resolvedIfExists} exists`,
          fix: `update the doc to mark "${g.name}" as shipped`,
          probe: { kind: 'absent-regex', source: g.stalePattern.source, flags: g.stalePattern.flags },
        });
      }
    }
  }

  // 4. Stale blockers — doc says work is blocked, but evidence shows resolved.
  for (const b of config.staleBlockers) {
    const ev = read(b.resolvedEvidence.file);
    if (!ev || !ev.includes(b.resolvedEvidence.contains)) continue;
    const re = new RegExp(b.blockedPattern.source, b.blockedPattern.flags);
    for (const [doc, body] of Object.entries(docs)) {
      if (re.test(body)) {
        findings.push({
          doc, type: 'stale-blocker', severity: 'high',
          message: `says "${b.name}" still blocks work, but ${b.resolvedEvidence.file} shows it is resolved`,
          fix: 'remove the blocker / reclassify the work as unblocked',
          probe: { kind: 'absent-regex', source: b.blockedPattern.source, flags: b.blockedPattern.flags },
        });
      }
    }
  }

  // 5. Empty / placeholder docs.
  for (const f of config.nonEmptyDocs || []) {
    const c = read(f);
    const realLines = (c || '').split('\n').filter((l) => l.trim()).length;
    if (c == null || realLines <= 1) {
      findings.push({
        doc: f, type: 'empty-doc', severity: 'low',
        message: 'is effectively empty (placeholder or single line)',
        fix: 'write real content or remove the file',
        probe: { kind: 'nonempty' },
      });
    }
  }

  return findings;
}

function report(findings) {
  if (!findings.length) {
    console.log('✓ doc-swarm detector: no drift found.');
    return;
  }
  console.log(`✗ doc-swarm detector: ${findings.length} drift finding(s)\n`);
  for (const f of findings) {
    console.log(`  [${f.severity}] ${f.type} — ${f.doc}`);
    console.log(`      ${f.message}`);
    console.log(`      → ${f.fix}\n`);
  }
}

if (require.main === module) {
  const findings = detect();
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(findings, null, 2));
  } else {
    report(findings);
  }
  process.exitCode = findings.length ? 1 : 0;
}

module.exports = { detect, report };
