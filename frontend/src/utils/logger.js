/**
 * Logger Utility
 * Provides environment-aware logging that only outputs in development mode
 *
 * Usage:
 * - logger.info('message', data) - General information
 * - logger.warn('message', data) - Warnings
 * - logger.error('message', data) - Errors (always logged)
 * - logger.debug('message', data) - Debug info
 */

const isDevelopment = import.meta.env.VITE_ENV === 'development' || import.meta.env.DEV;

const logger = {
  /**
   * Log informational messages (development only)
   */
  info: (...args) => {
    if (isDevelopment) {
      console.log('[INFO]', ...args);
    }
  },

  /**
   * Log warnings (development only)
   */
  warn: (...args) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  },

  /**
   * Log errors (always logged, even in production)
   */
  error: (...args) => {
    console.error('[ERROR]', ...args);
  },

  /**
   * Log debug information (development only)
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Log grouped information (development only)
   */
  group: (label) => {
    if (isDevelopment) {
      console.group(label);
    }
  },

  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd();
    }
  }
};

export default logger;
