/**
 * Sentry Configuration
 * Real-time error tracking and performance monitoring
 */

const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

/**
 * Initialize Sentry
 * @param {Express} app - Express app instance
 */
function initializeSentry(app) {
  if (!process.env.SENTRY_DSN) {
    console.warn('⚠️  Sentry DSN not configured. Error tracking disabled.');
    return null;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: `fairmediator-backend@${process.env.npm_package_version || '0.1.0'}`,

    // Integrations
    integrations: [
      // Enable HTTP integration
      new Sentry.Integrations.Http({ tracing: true }),

      // Enable Express integration
      new Sentry.Integrations.Express({ app }),

      // Enable performance profiling
      new ProfilingIntegration(),

      // Enable automatic breadcrumbs
      new Sentry.Integrations.Console(),
      new Sentry.Integrations.LinkedErrors()
    ],

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev

    // Profiling
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Filter sensitive data
    beforeSend(event, hint) {
      // Remove sensitive information
      if (event.request) {
        // Remove Authorization headers
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }

        // Remove sensitive query parameters
        if (event.request.query_string) {
          event.request.query_string = event.request.query_string
            .replace(/token=[^&]*/g, 'token=[REDACTED]')
            .replace(/password=[^&]*/g, 'password=[REDACTED]')
            .replace(/secret=[^&]*/g, 'secret=[REDACTED]');
        }

        // Remove passwords from request data
        if (event.request.data) {
          const data = typeof event.request.data === 'string'
            ? JSON.parse(event.request.data)
            : event.request.data;

          if (data.password) data.password = '[REDACTED]';
          if (data.token) data.token = '[REDACTED]';
          if (data.refreshToken) data.refreshToken = '[REDACTED]';

          event.request.data = JSON.stringify(data);
        }
      }

      // Filter errors based on environment
      if (process.env.NODE_ENV === 'development') {
        // In development, you might want to see all errors in console
        console.error('Sentry captured error:', hint.originalException || hint.syntheticException);
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Browser/client errors
      'Network Error',
      'NetworkError',

      // Common HTTP errors that aren't bugs
      'Request failed with status code 401',
      'Request failed with status code 403',
      'Request failed with status code 404',

      // CSRF errors (these are expected security blocks)
      'EBADCSRFTOKEN',

      // Rate limit errors (expected behavior)
      'Too many requests'
    ]
  });

  console.log('✅ Sentry initialized for error tracking');

  return Sentry;
}

/**
 * Sentry request handler middleware (must be first)
 */
const requestHandler = () => Sentry.Handlers.requestHandler();

/**
 * Sentry tracing middleware (must be after request handler)
 */
const tracingHandler = () => Sentry.Handlers.tracingHandler();

/**
 * Sentry error handler middleware (must be before other error handlers)
 */
const errorHandler = () => Sentry.Handlers.errorHandler({
  shouldHandleError(error) {
    // Only send server errors (5xx) to Sentry
    // Client errors (4xx) are usually not bugs
    if (error.status && error.status >= 400 && error.status < 500) {
      return false;
    }
    return true;
  }
});

/**
 * Capture exception manually
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
function captureException(error, context = {}) {
  Sentry.withScope((scope) => {
    // Add custom context
    if (context.user) {
      scope.setUser({
        id: context.user._id?.toString(),
        email: context.user.email,
        role: context.user.role
      });
    }

    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    Sentry.captureException(error);
  });
}

/**
 * Capture message manually
 * @param {string} message - Message to capture
 * @param {string} level - Severity level (fatal, error, warning, info, debug)
 * @param {Object} context - Additional context
 */
function captureMessage(message, level = 'info', context = {}) {
  Sentry.withScope((scope) => {
    if (context.user) {
      scope.setUser({
        id: context.user._id?.toString(),
        email: context.user.email
      });
    }

    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    Sentry.captureMessage(message, level);
  });
}

module.exports = {
  initializeSentry,
  requestHandler,
  tracingHandler,
  errorHandler,
  captureException,
  captureMessage,
  Sentry
};
