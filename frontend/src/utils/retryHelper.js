/**
 * Retry Helper Utility
 * Provides retry logic for failed API calls with exponential backoff
 */

/**
 * Retry a promise-based function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.retries - Maximum number of retries (default: 3)
 * @param {number} options.delay - Initial delay in ms (default: 1000)
 * @param {number} options.backoff - Backoff multiplier (default: 2)
 * @param {Function} options.shouldRetry - Custom function to determine if should retry
 * @returns {Promise} - Result of the function or throws last error
 */
export const retryWithBackoff = async (fn, options = {}) => {
  const {
    retries = 3,
    delay = 1000,
    backoff = 2,
    shouldRetry = () => true
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error;

      // Don't retry if we've exhausted attempts
      if (attempt === retries) {
        break;
      }

      // Check if we should retry this error
      if (!shouldRetry(error)) {
        throw error;
      }

      // Wait before retrying with exponential backoff
      const waitTime = delay * Math.pow(backoff, attempt);
      console.log(`Retry attempt ${attempt + 1}/${retries} after ${waitTime}ms`);
      await sleep(waitTime);
    }
  }

  throw lastError;
};

/**
 * Sleep utility
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Default retry condition - retry on network errors and 5xx server errors
 * @param {Error} error - The error to check
 * @returns {boolean} - Whether to retry
 */
export const defaultShouldRetry = (error) => {
  // Retry network errors
  if (error.message === 'Failed to fetch' || error.name === 'NetworkError') {
    return true;
  }

  // Retry 5xx server errors
  if (error.message?.includes('500') || error.message?.includes('502') || error.message?.includes('503')) {
    return true;
  }

  // Retry timeout errors
  if (error.message?.includes('timeout')) {
    return true;
  }

  // Don't retry client errors (4xx) or rate limiting (429)
  if (error.message?.includes('4') || error.message?.includes('rate limit')) {
    return false;
  }

  return false;
};

/**
 * Retry wrapper for API calls
 * @param {Function} apiCall - API function to wrap
 * @param {Object} retryOptions - Retry configuration
 * @returns {Function} - Wrapped API function
 */
export const withRetry = (apiCall, retryOptions = {}) => {
  return async (...args) => {
    return retryWithBackoff(
      () => apiCall(...args),
      {
        ...retryOptions,
        shouldRetry: retryOptions.shouldRetry || defaultShouldRetry
      }
    );
  };
};

export default {
  retryWithBackoff,
  defaultShouldRetry,
  withRetry
};
