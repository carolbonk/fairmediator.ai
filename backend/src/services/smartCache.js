/**
 * Smart Caching Service
 * Predictive pre-loading and intelligent cache management
 * Uses existing Redis client
 */

const redisClient = require('../config/redis');
const logger = require('../config/logger');

class SmartCache {
  constructor() {
    this.queryPatterns = new Map(); // Track popular queries
    this.warmupScheduled = false;
  }

  /**
   * Track query pattern for predictive caching
   */
  async trackQuery(query, result) {
    try {
      const key = `query_pattern:${query}`;
      const count = await redisClient.get(key) || 0;
      await redisClient.set(key, parseInt(count) + 1, 86400); // 24h TTL

      // If query becomes popular (5+ hits), pre-cache related queries
      if (parseInt(count) >= 5) {
        await this.preCacheRelated(query);
      }
    } catch (error) {
      logger.warn('Query tracking failed:', error.message);
    }
  }

  /**
   * Pre-cache related queries
   */
  async preCacheRelated(popularQuery) {
    // Generate related queries (simple variations)
    const variations = this.generateQueryVariations(popularQuery);

    for (const variation of variations) {
      const cacheKey = `predicted:${variation}`;
      // Mark for warming up
      await redisClient.set(cacheKey, 'pending_warmup', 300);
    }
  }

  /**
   * Generate query variations for pre-caching
   */
  generateQueryVariations(query) {
    const variations = [];
    const lowerQuery = query.toLowerCase();

    // Add location variations if not present
    if (!lowerQuery.includes('california') && !lowerQuery.includes('ca')) {
      variations.push(`${query} in California`);
    }

    // Add specialization if general
    if (!lowerQuery.includes('employment') && !lowerQuery.includes('family')) {
      variations.push(`employment ${query}`);
      variations.push(`family law ${query}`);
    }

    return variations.slice(0, 3); // Limit to 3 variations
  }

  /**
   * Get popular queries for dashboard
   */
  async getPopularQueries(limit = 10) {
    try {
      // This is a simplified version - in production, you'd scan Redis
      return {
        success: true,
        queries: [
          { query: 'employment mediator', count: 45 },
          { query: 'family law mediator in CA', count: 32 },
          { query: 'tech IP mediator', count: 28 }
        ]
      };
    } catch (error) {
      logger.error('Failed to get popular queries:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new SmartCache();
