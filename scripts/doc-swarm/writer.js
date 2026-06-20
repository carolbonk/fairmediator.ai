/**
 * Doc-swarm — Writer agent.
 *
 * Given one doc and its drift findings, asks the local model to produce a
 * corrected version. Writes the result to scripts/doc-swarm/proposed/<doc>
 * (never overwrites the original — proposals are reviewed/diffed before apply).
 */
const { read, write } = require('./lib');

const SYSTEM = `You are a technical-docs maintainer. You receive a Markdown
document plus a list of factual drift findings (claims the doc makes that no
longer match reality). Rewrite ONLY what the findings require. Preserve the
document's structure, headings, tone, and everything not named in the findings.
Do not invent facts or add new sections. Output the full corrected Markdown and
nothing else — no preamble, no commentary, no surrounding code fences.`;

async function rewrite(ollama, doc, findings) {
  const body = read(doc);
  if (body == null) return null;

  const findingList = findings
    .map((f, i) => `${i + 1}. [${f.type}] ${f.message}  →  ${f.fix}`)
    .join('\n');

  const user = `DOCUMENT: ${doc}\n\nDRIFT FINDINGS TO FIX:\n${findingList}\n\n---\n${body}`;

  const out = await ollama.chat(SYSTEM, user);
  const cleaned = out
    .replace(/^```(?:markdown)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();

  const dest = `scripts/doc-swarm/proposed/${doc}`;
  write(dest, cleaned + '\n');
  return dest;
}

module.exports = { rewrite };
