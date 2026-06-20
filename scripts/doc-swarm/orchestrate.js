#!/usr/bin/env node
/**
 * Doc-swarm — Orchestrator (free Path 4, local Ollama engine).
 *
 *   detector  →  fan out one writer agent per drifted doc  →  verifier
 *
 * The detector is deterministic ($0, always runs). If Ollama is unreachable
 * the run stops after detection with install instructions — you still get the
 * free drift report. Writers run in parallel (the "swarm"); the verifier
 * re-checks each proposal against the finding that triggered it.
 *
 *   node scripts/doc-swarm/orchestrate.js
 */
const { detect } = require('./detect');
const { read } = require('./lib');
const writer = require('./writer');
const ollama = require('./ollama');

function verifyProposal(doc, findings) {
  const text = read(`scripts/doc-swarm/proposed/${doc}`);
  if (text == null) return { ok: false, note: 'no proposal produced' };

  const results = findings.map((f) => {
    const p = f.probe || { kind: 'manual' };
    if (p.kind === 'absent-literal') return !text.includes(p.value);
    if (p.kind === 'absent-regex') return !new RegExp(p.source, p.flags).test(text);
    if (p.kind === 'nonempty') return text.trim().length > 200;
    return null; // manual / cross-doc — not auto-verifiable
  });

  const checked = results.filter((r) => r !== null);
  const passed = checked.filter(Boolean).length;
  return {
    ok: checked.length > 0 && passed === checked.length,
    note: checked.length
      ? `${passed}/${checked.length} findings verified resolved`
      : 'manual review (cross-doc)',
  };
}

async function main() {
  const findings = detect();
  if (!findings.length) {
    console.log('✓ No drift — nothing for the swarm to do.');
    return;
  }

  // Group findings by the doc(s) they touch.
  const byDoc = {};
  for (const f of findings) {
    for (const d of String(f.doc).split(',').map((s) => s.trim())) {
      if (d) (byDoc[d] = byDoc[d] || []).push(f);
    }
  }
  const docs = Object.keys(byDoc);
  console.log(`Detector found ${findings.length} finding(s) across ${docs.length} doc(s):`);
  console.log(`  ${docs.join(', ')}\n`);

  if (!(await ollama.up())) {
    console.log(`Ollama not reachable at ${ollama.HOST} — stopping after detection.`);
    console.log('The drift report above is the free, deterministic result.\n');
    console.log('To enable the writer/verifier agents, run in your shell:');
    console.log('  ! brew install ollama');
    console.log('  ! ollama serve &');
    console.log(`  ! ollama pull ${ollama.MODEL}`);
    console.log('\nthen re-run:  npm run docs:swarm');
    process.exitCode = 1;
    return;
  }

  console.log(`Fanning out ${docs.length} writer agent(s) on ${ollama.MODEL}...\n`);
  const proposals = await Promise.allSettled(
    docs.map((d) => writer.rewrite(ollama, d, byDoc[d]))
  );

  let clean = 0;
  proposals.forEach((r, i) => {
    const doc = docs[i];
    if (r.status !== 'fulfilled' || !r.value) {
      console.log(`  ✗ ${doc} — writer failed: ${r.reason ? r.reason.message : 'no output'}`);
      return;
    }
    const v = verifyProposal(doc, byDoc[doc]);
    if (v.ok) clean++;
    console.log(`  ${v.ok ? '✓' : '⚠'} ${doc} → ${r.value}  (${v.note})`);
  });

  console.log(`\n${clean}/${docs.length} proposals passed verification.`);
  console.log('Review before applying:');
  console.log('  git diff --no-index <doc> scripts/doc-swarm/proposed/<doc>');
  console.log('Apply one:  cp scripts/doc-swarm/proposed/<doc> <doc>');
  process.exitCode = clean === docs.length ? 0 : 1;
}

if (require.main === module) main();
