/**
 * Redis Client Configuration
 * Supports both local development and production (Upstash/Redis Cloud)
 */

const redis = require('redis');
const logger = require('./logger');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isEnabled = process.env.REDIS_ENABLED === 'true';

    // Free tier protection (Upstash free tier: 10k commands/day)
    this.dailyCommandLimit = parseInt(process.env.REDIS_DAILY_LIMIT || '9000'); // 90% of 10k
    this.commandCount = 0;
    this.lastReset = new Date().toDateString();
  }

  /**
   * Connect to Redis
   * Supports both local and remote Redis
   */
  async connect() {
    if (!this.isEnabled) {
      logger.info('Redis caching disabled (set REDIS_ENABLED=true to enable)');
      return;
    }

    try {
      const redisConfig = this.getRedisConfig();

      this.client = redis.createClient(redisConfig);

      // Error handling
      this.client.on('error', (err) => {
        logger.error('Redis error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis connected successfully');
        this.isConnected = true;
      });

      this.client.on('reconnecting', () => {
        logger.warn('Redis reconnecting...');
      });

      // Connect
      await this.client.connect();

      logger.info(`Redis cache enabled: ${redisConfig.url ? 'Remote' : 'Local'}`);
    } catch (error) {
      logger.error('Failed to connect to Redis:', error.message);
      logger.warn('Continuing without Redis cache');
      this.isEnabled = false;
    }
  }

  /**
   * Get Redis configuration based on environment
   */
  getRedisConfig() {
    // Production: Use Upstash or Redis Cloud URL
    if (process.env.REDIS_URL) {
      return {
        url: process.env.REDIS_URL
      };
    }

    // Development: Use local Redis
    return {
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      },
      password: process.env.REDIS_PASSWORD || undefined
    };
  }

  /**
   * Check if we're within free tier limits
   */
  checkDailyLimit() {
    const today = new Date().toDateString();

    // Reset counter at midnight
    if (today !== this.lastReset) {
      this.commandCount = 0;
      this.lastReset = today;
      logger.info(`Redis daily counter reset. Limit: ${this.dailyCommandLimit} commands`);
    }

    // Check if we've hit the limit
    if (this.commandCount >= this.dailyCommandLimit) {
      logger.warn(`Redis daily limit reached (${this.commandCount}/${this.dailyCommandLimit}). Disabling cache until midnight.`);
      return false;
    }

    return true;
  }

  /**
   * Get cached value
   */
  async get(key) {
    if (!this.isEnabled || !this.isConnected) {
      return null;
    }

    // Check daily limit (FREE TIER PROTECTION)
    if (!this.checkDailyLimit()) {
      return null; // Skip cache if limit reached
    }

    try {
      this.commandCount++; // Increment counter
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Redis get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached value with TTL (time-to-live)
   */
  async set(key, value, ttlSeconds = 300) {
    if (!this.isEnabled || !this.isConnected) {
      return false;
    }

    // Check daily limit (FREE TIER PROTECTION)
    if (!this.checkDailyLimit()) {
      return false; // Skip cache if limit reached
    }

    try {
      this.commandCount++; // Increment counter
      await this.client.setEx(
        key,
        ttlSeconds,
        JSON.stringify(value)
      );
      return true;
    } catch (error) {
      logger.error(`Redis set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete cached value
   */
  async del(key) {
    if (!this.isEnabled || !this.isConnected) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`Redis del error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all cached values matching pattern
   */
  async clearPattern(pattern) {
    if (!this.isEnabled || !this.isConnected) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;

      await this.client.del(keys);
      return keys.length;
    } catch (error) {
      logger.error(`Redis clearPattern error for ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    if (!this.isEnabled || !this.isConnected) {
      return {
        enabled: false,
        connected: false
      };
    }

    try {
      const info = await this.client.info('stats');
      const keys = await this.client.dbSize();

      return {
        enabled: true,
        connected: this.isConnected,
        totalKeys: keys,
        dailyLimit: this.dailyCommandLimit,
        commandsUsedToday: this.commandCount,
        percentUsed: ((this.commandCount / this.dailyCommandLimit) * 100).toFixed(1),
        remainingCommands: this.dailyCommandLimit - this.commandCount,
        resetsAt: 'Midnight UTC',
        info: this.parseRedisInfo(info)
      };
    } catch (error) {
      logger.error('Redis stats error:', error);
      return {
        enabled: true,
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Parse Redis INFO output
   */
  parseRedisInfo(info) {
    const lines = info.split('\r\n');
    const stats = {};

    lines.forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          stats[key] = value;
        }
      }
    });

    return stats;
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis disconnected');
    }
  }

  /**
   * Generate cache key from parameters
   */
  generateKey(prefix, ...params) {
    const hash = require('crypto')
      .createHash('md5')
      .update(JSON.stringify(params))
      .digest('hex');

    return `${prefix}:${hash}`;
  }
}

// Create singleton instance
const redisClient = new RedisClient();

module.exports = redisClient;
