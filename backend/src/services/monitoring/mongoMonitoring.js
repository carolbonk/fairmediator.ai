/**
 * MongoDB Atlas Monitoring Service
 * Free alternative to Sentry using MongoDB's built-in capabilities
 *
 * Features:
 * - Database size tracking
 * - Connection monitoring
 * - Query performance
 * - Error logging to MongoDB collection
 */

const mongoose = require('mongoose');
const logger = require('../../config/logger');

class MongoMonitoring {
  constructor() {
    this.errorCollection = null;
    this.initialized = false;
  }

  /**
   * Initialize monitoring (create error collection if needed)
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Get or create errors collection
      const db = mongoose.connection.db;
      const collections = await db.listCollections({ name: 'errors' }).toArray();

      if (collections.length === 0) {
        await db.createCollection('errors', {
          capped: true,
          size: 5242880, // 5MB cap (free tier friendly)
          max: 1000 // Max 1000 error documents
        });
        logger.info('Created capped errors collection for monitoring');
      }

      this.errorCollection = db.collection('errors');
      this.initialized = true;

      // Capped collection handles automatic cleanup (5MB/1000 docs max)
      // No TTL index needed - capped collections auto-remove oldest documents

      logger.info('MongoDB monitoring initialized');
    } catch (error) {
      logger.error('Failed to initialize MongoDB monitoring:', error);
    }
  }

  /**
   * Log error to MongoDB
   */
  async logError(error, context = {}) {
    await this.initialize();

    if (!this.errorCollection) {
      logger.warn('Error collection not available, logging to winston only');
      return null;
    }

    try {
      const errorDoc = {
        timestamp: new Date(),
        message: error.message || String(error),
        stack: error.stack || null,
        name: error.name || 'Error',
        code: error.code || null,
        statusCode: error.statusCode || error.status || null,
        context: {
          ...context,
          environment: process.env.NODE_ENV || 'development',
          nodeVersion: process.version
        },
        // Extract useful info from request if available
        request: context.req ? {
          method: context.req.method,
          url: context.req.originalUrl || context.req.url,
          ip: context.req.ip,
          userAgent: context.req.get('user-agent')
        } : null,
        user: context.userId || context.user?.id || null
      };

      const result = await this.errorCollection.insertOne(errorDoc);
      return result.insertedId;
    } catch (err) {
      logger.error('Failed to log error to MongoDB:', err);
      return null;
    }
  }

  /**
   * Get database statistics
   */
  async getStats() {
    try {
      const db = mongoose.connection.db;
      const stats = await db.stats();

      return {
        collections: stats.collections,
        indexes: stats.indexes,
        dataSize: this.formatBytes(stats.dataSize),
        storageSize: this.formatBytes(stats.storageSize),
        indexSize: this.formatBytes(stats.indexSize),
        totalSize: this.formatBytes(stats.dataSize + stats.indexSize),
        avgObjSize: this.formatBytes(stats.avgObjSize),
        documents: stats.objects,
        // Free tier info
        freeTierLimit: this.formatBytes(512 * 1024 * 1024), // 512MB
        usedPercentage: ((stats.dataSize + stats.indexSize) / (512 * 1024 * 1024) * 100).toFixed(2),
        remaining: this.formatBytes((512 * 1024 * 1024) - (stats.dataSize + stats.indexSize))
      };
    } catch (error) {
      logger.error('Failed to get database stats:', error);
      throw error;
    }
  }

  /**
   * Get connection statistics
   */
  async getConnectionStats() {
    try {
      const db = mongoose.connection.db;
      const serverStatus = await db.admin().serverStatus();

      return {
        connections: {
          current: serverStatus.connections.current,
          available: serverStatus.connections.available,
          totalCreated: serverStatus.connections.totalCreated
        },
        network: {
          bytesIn: this.formatBytes(serverStatus.network.bytesIn),
          bytesOut: this.formatBytes(serverStatus.network.bytesOut),
          requests: serverStatus.network.numRequests
        },
        uptime: this.formatUptime(serverStatus.uptime)
      };
    } catch (error) {
      logger.error('Failed to get connection stats:', error);
      return null;
    }
  }

  /**
   * Get recent errors from MongoDB
   */
  async getRecentErrors(limit = 50, filter = {}) {
    await this.initialize();

    if (!this.errorCollection) {
      return [];
    }

    try {
      const errors = await this.errorCollection
        .find(filter)
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

      return errors;
    } catch (error) {
      logger.error('Failed to get recent errors:', error);
      return [];
    }
  }

  /**
   * Get error statistics
   */
  async getErrorStats(hours = 24) {
    await this.initialize();

    if (!this.errorCollection) {
      return null;
    }

    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);

      const stats = await this.errorCollection.aggregate([
        { $match: { timestamp: { $gte: since } } },
        {
          $group: {
            _id: '$name',
            count: { $sum: 1 },
            lastOccurrence: { $max: '$timestamp' },
            samples: { $push: { message: '$message', timestamp: '$timestamp' } }
          }
        },
        { $sort: { count: -1 } },
        {
          $project: {
            _id: 0,
            errorType: '$_id',
            count: 1,
            lastOccurrence: 1,
            samples: { $slice: ['$samples', 3] } // Get 3 sample errors
          }
        }
      ]).toArray();

      const total = await this.errorCollection.countDocuments({
        timestamp: { $gte: since }
      });

      return {
        totalErrors: total,
        timeRange: `${hours} hours`,
        byType: stats
      };
    } catch (error) {
      logger.error('Failed to get error stats:', error);
      return null;
    }
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats() {
    try {
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();

      const collectionStats = await Promise.all(
        collections.map(async (col) => {
          try {
            const stats = await db.collection(col.name).stats();
            return {
              name: col.name,
              documents: stats.count,
              size: this.formatBytes(stats.size),
              avgDocSize: this.formatBytes(stats.avgObjSize),
              indexes: stats.nindexes,
              indexSize: this.formatBytes(stats.totalIndexSize)
            };
          } catch (error) {
            return {
              name: col.name,
              error: 'Unable to get stats'
            };
          }
        })
      );

      return collectionStats.sort((a, b) =>
        (b.documents || 0) - (a.documents || 0)
      );
    } catch (error) {
      logger.error('Failed to get collection stats:', error);
      return [];
    }
  }

  /**
   * Format bytes to human-readable format
   */
  formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format uptime to human-readable format
   */
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.join(' ') || '< 1m';
  }

  /**
   * Get comprehensive monitoring dashboard data
   */
  async getDashboard() {
    const [dbStats, connStats, errorStats, collStats] = await Promise.all([
      this.getStats(),
      this.getConnectionStats(),
      this.getErrorStats(24),
      this.getCollectionStats()
    ]);

    return {
      timestamp: new Date(),
      database: dbStats,
      connections: connStats,
      errors: errorStats,
      collections: collStats,
      alerts: this.generateAlerts(dbStats, errorStats)
    };
  }

  /**
   * Generate alerts based on metrics
   */
  generateAlerts(dbStats, errorStats) {
    const alerts = [];

    // Database size alert
    const usedPercent = parseFloat(dbStats.usedPercentage);
    if (usedPercent > 90) {
      alerts.push({
        level: 'critical',
        message: `Database at ${usedPercent}% capacity (${dbStats.totalSize} / ${dbStats.freeTierLimit})`,
        action: 'Clean up old data or upgrade to paid tier'
      });
    } else if (usedPercent > 75) {
      alerts.push({
        level: 'warning',
        message: `Database at ${usedPercent}% capacity`,
        action: 'Monitor database growth'
      });
    }

    // Error rate alert
    if (errorStats && errorStats.totalErrors > 100) {
      alerts.push({
        level: 'warning',
        message: `${errorStats.totalErrors} errors in the last ${errorStats.timeRange}`,
        action: 'Review error logs and fix issues'
      });
    }

    return alerts;
  }
}

// Create singleton instance
const mongoMonitoring = new MongoMonitoring();

module.exports = mongoMonitoring;
