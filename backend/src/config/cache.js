/**
 * In-Memory Caching Configuration
 * Uses NodeCache for O(1) cache lookups to reduce MongoDB queries
 *
 * Cache Strategy:
 * - Mediator list queries: 5 minutes TTL (frequently accessed, changes infrequently)
 * - Individual mediators: 10 minutes TTL (profile data doesn't change often)
 * - State mediation data: 1 hour TTL (static data)
 * - User profile data: 5 minutes TTL (accessed on every request)
 */

const NodeCache = require('node-cache');
const logger = require('./logger');

// Initialize cache instances with different TTL settings
const mediatorCache = new NodeCache({
  stdTTL: 300, // 5 minutes
  checkperiod: 60, // Check for expired keys every 60 seconds
  useClones: false, // Don't clone objects (better performance, but be careful with mutations)
  deleteOnExpire: true,
  maxKeys: 1000 // Limit cache size
});

const userCache = new NodeCache({
  stdTTL: 300, // 5 minutes
  checkperiod: 60,
  useClones: false,
  deleteOnExpire: true,
  maxKeys: 500
});

const staticDataCache = new NodeCache({
  stdTTL: 3600, // 1 hour for static data
  checkperiod: 120,
  useClones: false,
  deleteOnExpire: true,
  maxKeys: 100
});

// Cache statistics tracking
const stats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0
};

// Helper function to generate cache keys
const generateKey = (prefix, params) => {
  if (typeof params === 'object') {
    return `${prefix}:${JSON.stringify(params)}`;
  }
  return `${prefix}:${params}`;
};

// Wrapper functions with statistics tracking
const get = (cache, key) => {
  const value = cache.get(key);
  if (value !== undefined) {
    stats.hits++;
    logger.debug(`Cache HIT: ${key}`);
  } else {
    stats.misses++;
    logger.debug(`Cache MISS: ${key}`);
  }
  return value;
};

const set = (cache, key, value, ttl) => {
  const success = cache.set(key, value, ttl);
  if (success) {
    stats.sets++;
    logger.debug(`Cache SET: ${key}`);
  }
  return success;
};

const del = (cache, key) => {
  const count = cache.del(key);
  if (count > 0) {
    stats.deletes++;
    logger.debug(`Cache DEL: ${key}`);
  }
  return count;
};

// Cache invalidation helpers
const invalidateMediatorCache = (mediatorId) => {
  if (mediatorId) {
    // Invalidate specific mediator
    del(mediatorCache, `mediator:${mediatorId}`);
  }
  // Invalidate all list queries (they might include this mediator)
  mediatorCache.keys().forEach(key => {
    if (key.startsWith('mediators:list:')) {
      del(mediatorCache, key);
    }
  });
};

const invalidateUserCache = (userId) => {
  del(userCache, `user:${userId}`);
};

// Get cache statistics
const getStats = () => {
  const total = stats.hits + stats.misses;
  const hitRate = total > 0 ? ((stats.hits / total) * 100).toFixed(2) : 0;

  return {
    ...stats,
    hitRate: `${hitRate}%`,
    mediatorCacheSize: mediatorCache.keys().length,
    userCacheSize: userCache.keys().length,
    staticDataCacheSize: staticDataCache.keys().length
  };
};

// Reset statistics (useful for testing)
const resetStats = () => {
  stats.hits = 0;
  stats.misses = 0;
  stats.sets = 0;
  stats.deletes = 0;
};

// Flush all caches (useful for testing)
const flushAll = () => {
  mediatorCache.flushAll();
  userCache.flushAll();
  staticDataCache.flushAll();
  logger.info('All caches flushed');
};

module.exports = {
  // Cache instances
  mediatorCache,
  userCache,
  staticDataCache,

  // Helper functions
  generateKey,
  get,
  set,
  del,

  // Invalidation
  invalidateMediatorCache,
  invalidateUserCache,

  // Statistics
  getStats,
  resetStats,
  flushAll
};
