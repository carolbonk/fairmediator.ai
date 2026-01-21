/**
 * Caching Middleware
 * Express middleware for automatic route caching
 * Reduces database load by caching frequent queries (O(1) cache lookup vs O(log n) MongoDB query)
 */

const cache = require('../config/cache');
const logger = require('../config/logger');

/**
 * Cache middleware factory
 * Creates middleware that caches GET request responses
 *
 * @param {Object} cacheInstance - NodeCache instance to use (mediatorCache, userCache, staticDataCache)
 * @param {String} keyPrefix - Prefix for cache keys (e.g., 'mediators:list')
 * @param {Number} ttl - Optional TTL override in seconds
 * @returns {Function} Express middleware
 */
const cacheMiddleware = (cacheInstance, keyPrefix, ttl = null) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key from route params and query
    const keyParams = {
      ...req.params,
      ...req.query,
      // Include userId for user-specific caching
      ...(req.user && { userId: req.user.userId })
    };
    const cacheKey = cache.generateKey(keyPrefix, keyParams);

    // Try to get cached response
    const cachedResponse = cache.get(cacheInstance, cacheKey);

    if (cachedResponse !== undefined) {
      // Cache hit - return cached response
      logger.debug(`Cache HIT for ${keyPrefix}: ${cacheKey}`);
      return res.json(cachedResponse);
    }

    // Cache miss - continue to route handler
    logger.debug(`Cache MISS for ${keyPrefix}: ${cacheKey}`);

    // Store original res.json to intercept response
    const originalJson = res.json.bind(res);

    // Override res.json to cache the response
    res.json = (body) => {
      // Only cache successful responses (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheInstance, cacheKey, body, ttl);
        logger.debug(`Cached response for ${keyPrefix}: ${cacheKey}`);
      }

      // Send response
      return originalJson(body);
    };

    next();
  };
};

/**
 * Mediator list caching middleware
 * Caches mediator search results for 5 minutes
 */
const cacheMediatorList = cacheMiddleware(cache.mediatorCache, 'mediators:list');

/**
 * Individual mediator caching middleware
 * Caches single mediator profile for 10 minutes
 */
const cacheMediatorProfile = cacheMiddleware(cache.mediatorCache, 'mediator', 600);

/**
 * User profile caching middleware
 * Caches user data for 5 minutes
 */
const cacheUserProfile = cacheMiddleware(cache.userCache, 'user');

/**
 * Static data caching middleware
 * Caches static/reference data for 1 hour
 */
const cacheStaticData = cacheMiddleware(cache.staticDataCache, 'static', 3600);

module.exports = {
  cacheMiddleware,
  cacheMediatorList,
  cacheMediatorProfile,
  cacheUserProfile,
  cacheStaticData
};
