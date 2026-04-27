import { Sentry } from './sentry';
import logger from './logger';

const isDev =
  import.meta.env.VITE_ENV === 'development' ||
  import.meta.env.MODE === 'development';

const emit = (name, payload) => {
  if (isDev) {
    logger.info(`[analytics] ${name}`, payload);
    return;
  }
  Sentry.captureMessage(name, {
    level: 'info',
    tags: { event: name, kind: 'product' },
    extra: payload,
  });
};

export const trackEvent = (name, payload = {}) => {
  emit(name, { ...payload, ts: Date.now() });
};

export const trackRoadmapClick = ({ feature, source, action, user }) => {
  // TODO(human): build the analytics payload that gets passed to emit().
  //
  // Goal: rank roadmap features by real demand so we know what to build next.
  // The popup will call this every time someone clicks a "feature on roadmap"
  // surface (Stripe Connect button, Party portal entry, Attorney portal entry,
  // the Mediator CRM "Stripe Connect" card, etc).
  //
  // Inputs already wired for you:
  //   feature  — stable key, e.g. 'stripe-connect', 'party-portal'
  //   source   — where the click came from, e.g. 'mediator-crm', 'login'
  //   action   — 'open' | 'notify_me' | 'dismiss'
  //   user     — the AuthContext user object (may be null on logged-out clicks)
  //
  // Build a single object `payload` with whatever fields will let us:
  //   1) group by feature to count demand
  //   2) segment by who's asking (so we know which persona wants what)
  //   3) filter out our own dev/test traffic
  // Then call: emit('roadmap_click', payload);
  //
  // Keep it 2–8 lines. Don't log PII (no email, no name).
};
