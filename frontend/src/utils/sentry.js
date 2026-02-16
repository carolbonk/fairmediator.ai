/**
 * Sentry Error Tracking Configuration
 *
 * Setup Instructions:
 * 1. Sign up at https://sentry.io (free tier: 5K errors/month)
 * 2. Create new project → Select "React"
 * 3. Copy DSN and add to .env file:
 *    VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
 * 4. Sentry will automatically capture:
 *    - Unhandled exceptions
 *    - Promise rejections
 *    - ErrorBoundary crashes
 */

import * as Sentry from '@sentry/react';
import logger from './logger';

// Initialize Sentry only if DSN is configured
export const initSentry = () => {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.VITE_ENV || 'development';

  // Only initialize if DSN is provided and not in development
  if (sentryDsn && environment !== 'development') {
    Sentry.init({
      dsn: sentryDsn,
      environment,

      // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
      // We recommend adjusting this value in production (0.1 = 10%)
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0,

      // Capture Replay for Sessions
      replaysSessionSampleRate: 0.1, // Sample 10% of sessions
      replaysOnErrorSampleRate: 1.0, // Sample 100% of sessions with errors

      // Filter out certain errors
      beforeSend(event, hint) {
        // Don't send errors in development
        if (environment === 'development') {
          console.error('Sentry Error (not sent in dev):', hint.originalException || hint.syntheticException);
          return null;
        }

        // Filter out known non-critical errors
        const error = hint.originalException;
        if (error && typeof error === 'object') {
          const message = error.message || '';

          // Ignore network errors during development
          if (message.includes('Failed to fetch') && environment !== 'production') {
            return null;
          }

          // Ignore extension-related errors
          if (message.includes('chrome-extension://') || message.includes('moz-extension://')) {
            return null;
          }
        }

        return event;
      },

      // Add custom tags for better filtering
      initialScope: {
        tags: {
          'app.version': '1.0.0', // Update this with your version
          'app.component': 'frontend'
        }
      }
    });

    logger.info(`Sentry initialized for ${environment}`);
  } else if (environment === 'development') {
    logger.info('Sentry disabled in development mode');
  } else {
    logger.warn('Sentry DSN not configured. Errors will not be tracked.');
  }
};

// Export Sentry for manual error logging
export { Sentry };

// Helper function to manually log errors
export const logError = (error, context = {}) => {
  Sentry.captureException(error, {
    extra: context
  });
};

// Helper function to log messages/warnings
export const logMessage = (message, level = 'info', context = {}) => {
  Sentry.captureMessage(message, {
    level,
    extra: context
  });
};
