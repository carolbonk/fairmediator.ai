/**
 * Thin local-Ollama client for the writer/verifier agents.
 *
 * Free engine: runs entirely on your machine, no API key, no metering.
 * Configurable via env:
 *   OLLAMA_HOST   default http://localhost:11434
 *   OLLAMA_MODEL  default qwen2.5-coder
 */
const HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-coder';

async function up() {
  try {
    const r = await fetch(`${HOST}/api/tags`, { signal: AbortSignal.timeout(1500) });
    return r.ok;
  } catch {
    return false;
  }
}

async function chat(system, user) {
  const r = await fetch(`${HOST}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      stream: false,
      options: { temperature: 0.2 },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!r.ok) throw new Error(`ollama HTTP ${r.status}`);
  const j = await r.json();
  return (j.message && j.message.content) || '';
}

module.exports = { up, chat, HOST, MODEL };
