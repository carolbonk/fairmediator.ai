/**
 * Sentry Configuration
 * Error tracking and performance monitoring
 * FREE tier: 5k errors/month, 10k transactions/month
 */

const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

/**
 * Initialize Sentry
 * Should be called as early as possible in the application
 */
const initSentry = (app) => {
  // Only initialize if DSN is configured
  if (!process.env.SENTRY_DSN) {
    console.log('⚠️  Sentry DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Environment
    environment: process.env.NODE_ENV || 'development',

    // Release tracking
    release: process.env.RELEASE_VERSION || 'fairmediator@0.1.0',

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Profiling (helps identify performance bottlenecks)
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    integrations: [
      // Enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),

      // Enable Express.js middleware tracing
      new Sentry.Integrations.Express({ app }),

      // Enable profiling
      new ProfilingIntegration(),
    ],

    // Before sending events
    beforeSend(event, hint) {
      // Filter out non-error events in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Sentry event:', event);
      }

      // Don't send certain errors
      const error = hint.originalException;

      // Filter out rate limit errors (expected)
      if (error?.name === 'RateLimitError') {
        return null;
      }

      // Filter out 404 errors (too noisy)
      if (error?.statusCode === 404) {
        return null;
      }

      return event;
    },

    // Configure what data to send
    ignoreErrors: [
      // Browser errors we can't control
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',

      // Network errors
      'NetworkError',
      'Network request failed',

      // Common validation errors (handled gracefully)
      'ValidationError',
    ],
  });

  console.log('✅ Sentry initialized for error tracking');
};

/**
 * Request handler middleware
 * Must be the first middleware on the app
 */
const requestHandler = () => {
  return Sentry.Handlers.requestHandler({
    // Include user IP
    ip: true,

    // Include request data
    request: ['method', 'url', 'headers', 'query_string'],

    // Include transaction name
    transaction: 'methodPath',
  });
};

/**
 * Tracing handler middleware
 * Creates transactions for performance monitoring
 */
const tracingHandler = () => {
  return Sentry.Handlers.tracingHandler();
};

/**
 * Error handler middleware
 * Must be before any other error middleware but after all controllers
 */
const errorHandler = () => {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capture all errors with status code >= 500
      if (error.statusCode >= 500) {
        return true;
      }

      // Capture non-operational errors
      if (error.isOperational === false) {
        return true;
      }

      return false;
    },
  });
};

/**
 * Manually capture exceptions
 */
const captureException = (error, context = {}) => {
  if (!process.env.SENTRY_DSN) return;

  Sentry.withScope((scope) => {
    // Add context
    Object.keys(context).forEach(key => {
      scope.setContext(key, context[key]);
    });

    Sentry.captureException(error);
  });
};

/**
 * Manually capture messages
 */
const captureMessage = (message, level = 'info', context = {}) => {
  if (!process.env.SENTRY_DSN) return;

  Sentry.withScope((scope) => {
    // Set level
    scope.setLevel(level);

    // Add context
    Object.keys(context).forEach(key => {
      scope.setContext(key, context[key]);
    });

    Sentry.captureMessage(message);
  });
};

/**
 * Create a transaction for performance monitoring
 */
const startTransaction = (name, op) => {
  if (!process.env.SENTRY_DSN) return null;

  return Sentry.startTransaction({
    name,
    op,
  });
};

/**
 * Add breadcrumb for debugging
 */
const addBreadcrumb = (breadcrumb) => {
  if (!process.env.SENTRY_DSN) return;

  Sentry.addBreadcrumb(breadcrumb);
};

/**
 * Set user context
 */
const setUser = (user) => {
  if (!process.env.SENTRY_DSN) return;

  Sentry.setUser({
    id: user._id?.toString(),
    email: user.email,
    username: user.name,
    tier: user.subscriptionTier,
  });
};

/**
 * Clear user context
 */
const clearUser = () => {
  if (!process.env.SENTRY_DSN) return;
  Sentry.setUser(null);
};

/**
 * Flush events before shutdown
 */
const close = async (timeout = 2000) => {
  if (!process.env.SENTRY_DSN) return;

  try {
    await Sentry.close(timeout);
    console.log('Sentry flushed and closed');
  } catch (error) {
    console.error('Error closing Sentry:', error);
  }
};

module.exports = {
  initSentry,
  requestHandler,
  tracingHandler,
  errorHandler,
  captureException,
  captureMessage,
  startTransaction,
  addBreadcrumb,
  setUser,
  clearUser,
  close,
};
