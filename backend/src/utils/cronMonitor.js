/**
 * Cron observability wrapper.
 *
 * Adds three things the bare cron jobs lacked:
 *   1. A dead-man's-switch — heartbeat pings to an external monitor
 *      (healthchecks.io-style: /start on begin, base on success, /fail on
 *      error). The monitor alerts if it DOESN'T hear from a job on schedule,
 *      which is the only way to catch "the dyno slept and the job never ran."
 *   2. Failure alerting — a fire-and-forget POST to a Slack/Discord-compatible
 *      webhook when a job throws.
 *   3. Structured start/complete/FAILED logs with duration.
 *
 * Everything is env-gated: with no URLs configured, pings/alerts are no-ops,
 * so dev and test are unaffected.
 */
const logger = require('../config/logger');

const hasFetch = typeof fetch === 'function';

async function ping(url, suffix = '') {
  if (!url || !hasFetch) return;
  try {
    await fetch(url + suffix, { method: 'GET', signal: AbortSignal.timeout(5000) });
  } catch (e) {
    logger.warn('[cron] heartbeat ping failed', { suffix, error: e.message });
  }
}

async function alert(webhook, text) {
  if (!webhook || !hasFetch) return;
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }), // Slack & Discord both accept { text }
      signal: AbortSignal.timeout(5000),
    });
  } catch (e) {
    logger.warn('[cron] alert webhook failed', { error: e.message });
  }
}

/**
 * Run a cron job body with observability.
 * @param {string} name        job name (for logs/alerts)
 * @param {Function} fn         async job body
 * @param {object} [options]
 * @param {string} [options.pingUrl]       heartbeat base URL for this job
 * @param {string} [options.alertWebhook]  failure webhook (defaults to env)
 */
async function runJob(name, fn, options = {}) {
  const pingUrl = options.pingUrl;
  const alertWebhook = options.alertWebhook || process.env.CRON_ALERT_WEBHOOK_URL;
  const startedAt = Date.now();

  logger.info(`[cron:${name}] started`);
  await ping(pingUrl, '/start');

  try {
    const result = await fn();
    const durationMs = Date.now() - startedAt;
    logger.info(`[cron:${name}] completed`, { durationMs });
    await ping(pingUrl); // success
    return result;
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    logger.error(`[cron:${name}] FAILED`, { durationMs, error: error.message, stack: error.stack });
    await ping(pingUrl, '/fail');
    await alert(alertWebhook, `FairMediator cron "${name}" failed after ${durationMs}ms: ${error.message}`);
    throw error;
  }
}

module.exports = { runJob };
