/**
 * Tiny filesystem helpers for the doc-swarm. All paths are relative to the
 * directory the swarm is run from (the repo root).
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

function read(rel) {
  try {
    return fs.readFileSync(path.join(ROOT, rel), 'utf8');
  } catch {
    return null;
  }
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function write(rel, content) {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

module.exports = { ROOT, read, exists, write };
