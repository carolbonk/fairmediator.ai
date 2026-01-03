/**
 * Cache Wrapper Utility
 * Wraps async functions with Redis caching to reduce duplicate AI calls
 */

const redisClient = require('../config/redis');
const logger = require('../config/logger');

/**
 * Wrap an async function with caching
 *
 * @param {Function} fn - Async function to cache
 * @param {Object} options - Cache options
 * @param {string} options.prefix - Cache key prefix
 * @param {number} options.ttl - Time-to-live in seconds (default: 300 = 5 min)
 * @param {Function} options.keyGenerator - Custom key generator
 * @returns {Function} Wrapped function with caching
 *
 * @example
 * const cachedClassify = withCache(
 *   ideologyClassifier.classifyText,
 *   { prefix: 'ideology', ttl: 600 }
 * );
 *
 * const result = await cachedClassify('some text');
 */
function withCache(fn, options = {}) {
  const {
    prefix = 'cache',
    ttl = 300,
    keyGenerator = null
  } = options;

  return async function(...args) {
    // Generate cache key
    const cacheKey = keyGenerator
      ? keyGenerator(...args)
      : redisClient.generateKey(prefix, ...args);

    // Try to get from cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.debug(`Cache HIT: ${cacheKey}`);
      return cached;
    }

    logger.debug(`Cache MISS: ${cacheKey}`);

    // Execute function
    const result = await fn.apply(this, args);

    // Cache result
    await redisClient.set(cacheKey, result, ttl);

    return result;
  };
}

/**
 * Cache middleware for Express routes
 *
 * @param {number} ttl - Time-to-live in seconds
 * @returns {Function} Express middleware
 *
 * @example
 * router.get('/mediators', cacheMiddleware(60), async (req, res) => {
 *   // This response will be cached for 60 seconds
 * });
 */
function cacheMiddleware(ttl = 60) {
  return async (req, res, next) => {
    // Generate cache key from request
    const cacheKey = redisClient.generateKey(
      'route',
      req.method,
      req.originalUrl,
      req.body
    );

    // Check cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.debug(`Route cache HIT: ${req.method} ${req.originalUrl}`);
      return res.json(cached);
    }

    // Intercept res.json to cache response
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      // Cache successful responses only
      if (res.statusCode >= 200 && res.statusCode < 300) {
        redisClient.set(cacheKey, data, ttl);
        logger.debug(`Route cached: ${req.method} ${req.originalUrl}`);
      }
      return originalJson(data);
    };

    next();
  };
}

/**
 * Batch cache operations
 * Useful for caching multiple related items at once
 *
 * @param {string} prefix - Cache key prefix
 * @param {Array} items - Items to cache
 * @param {Function} keyExtractor - Function to extract key from item
 * @param {number} ttl - Time-to-live in seconds
 *
 * @example
 * await batchCache('mediator', mediators, m => m._id, 300);
 */
async function batchCache(prefix, items, keyExtractor, ttl = 300) {
  const promises = items.map(item => {
    const key = `${prefix}:${keyExtractor(item)}`;
    return redisClient.set(key, item, ttl);
  });

  await Promise.all(promises);
  logger.debug(`Batch cached ${items.length} items with prefix ${prefix}`);
}

/**
 * Get or compute cached value
 * Convenience function for common pattern
 *
 * @param {string} key - Cache key
 * @param {Function} computeFn - Async function to compute value if not cached
 * @param {number} ttl - Time-to-live in seconds
 * @returns {Promise<any>} Cached or computed value
 *
 * @example
 * const mediators = await getOrCompute(
 *   'mediators:all',
 *   () => Mediator.find(),
 *   120
 * );
 */
async function getOrCompute(key, computeFn, ttl = 300) {
  // Try cache first
  const cached = await redisClient.get(key);
  if (cached) {
    logger.debug(`Cache HIT: ${key}`);
    return cached;
  }

  logger.debug(`Cache MISS: ${key}`);

  // Compute value
  const value = await computeFn();

  // Cache it
  await redisClient.set(key, value, ttl);

  return value;
}

/**
 * Invalidate cache by pattern
 * Useful when data changes and related caches need clearing
 *
 * @param {string} pattern - Redis key pattern (supports *)
 *
 * @example
 * // Clear all ideology classification caches
 * await invalidateCache('ideology:*');
 */
async function invalidateCache(pattern) {
  const count = await redisClient.clearPattern(pattern);
  logger.info(`Invalidated ${count} cache entries matching ${pattern}`);
  return count;
}

module.exports = {
  withCache,
  cacheMiddleware,
  batchCache,
  getOrCompute,
  invalidateCache
};
