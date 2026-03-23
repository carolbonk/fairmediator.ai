/**
 * Monitoring Dashboard Routes
 * Real-time free tier usage monitoring
 */

const express = require('express');
const router = express.Router();
const { monitor } = require('../utils/freeTierMonitor');
const mongoMonitoring = require('../services/monitoring/mongoMonitoring');
const { authenticate, requireRole } = require('../middleware/auth');
const { sendSuccess } = require('../utils/responseHandlers');
const cache = require('../config/cache');

/**
 * GET /api/monitoring/dashboard
 * Get complete monitoring dashboard data
 * Admin only
 */
router.get('/dashboard', authenticate, requireRole(['admin']), (req, res) => {
  const stats = monitor.getStats();
  const projections = monitor.getMonthlyProjection();
  const alerts = monitor.getAlerts(20);

  sendSuccess(res, {
    stats,
    projections,
    alerts,
    timestamp: new Date(),
    summary: {
      totalServices: Object.keys(stats).length,
      criticalServices: Object.values(stats).filter(s => s.status === 'CRITICAL' || s.status === 'EXHAUSTED').length,
      alertServices: Object.values(stats).filter(s => s.status === 'ALERT').length,
      warningServices: Object.values(stats).filter(s => s.status === 'WARNING').length,
      healthyServices: Object.values(stats).filter(s => s.status === 'OK').length
    }
  });
});

/**
 * GET /api/monitoring/stats
 * Get current usage stats
 * Public (for health checks)
 */
router.get('/stats', (req, res) => {
  const stats = monitor.getStats();

  sendSuccess(res, {
    stats,
    timestamp: new Date()
  });
});

/**
 * GET /api/monitoring/quota-status
 * Get current quota usage for all free tier services (formatted for N8N automation)
 * Public (for automation workflows)
 *
 * Response:
 * {
 *   "overall": { "status": "ok", "criticalCount": 0, "warningCount": 1 },
 *   "services": {
 *     "huggingface": {
 *       "name": "Hugging Face API",
 *       "used": 150,
 *       "limit": 333,
 *       "remaining": 183,
 *       "percent": 45,
 *       "status": "ok",
 *       "nextReset": "2026-02-27T00:00:00.000Z"
 *     },
 *     ...
 *   }
 * }
 */
router.get('/quota-status', (req, res) => {
  const logger = require('../config/logger');

  try {
    const stats = monitor.getStats();
    const status = {};

    const FREE_TIER_LIMITS = {
      huggingface: {
        monthly: parseInt(process.env.HUGGINGFACE_MONTHLY_LIMIT) || 10000,
        daily: parseInt(process.env.HUGGINGFACE_DAILY_LIMIT) || 333,
        name: 'Hugging Face API'
      },
      resend: {
        monthly: parseInt(process.env.RESEND_MONTHLY_LIMIT) || 3000,
        daily: parseInt(process.env.RESEND_DAILY_LIMIT) || 50,
        name: 'Resend Email'
      },
      scraping: {
        monthly: parseInt(process.env.SCRAPING_MONTHLY_LIMIT) || 15000,
        daily: parseInt(process.env.SCRAPING_DAILY_LIMIT) || 450,
        name: 'Web Scraping'
      },
      axiom: {
        monthly: parseInt(process.env.AXIOM_MONTHLY_LIMIT) || 170000,
        daily: parseInt(process.env.AXIOM_DAILY_LIMIT) || 5666,
        name: 'Axiom Logging'
      },
      mongodb: {
        monthly: parseInt(process.env.MONGODB_SIZE_LIMIT) || (512 * 1024 * 1024),
        daily: null,
        name: 'MongoDB Atlas'
      }
    };

    for (const [service, limits] of Object.entries(FREE_TIER_LIMITS)) {
      // Skip MongoDB (size-based, not request-based)
      if (!limits.daily) continue;

      const usage = monitor.getUsage(service) || { daily: 0, monthly: 0 };
      const remaining = monitor.getRemaining(service) || limits.daily;
      const percent = Math.round((usage.daily / limits.daily) * 100);

      status[service] = {
        name: limits.name,
        used: usage.daily,
        limit: limits.daily,
        remaining,
        percent,
        status: percent > 95 ? 'critical' : percent > 85 ? 'warning' : 'ok',
        nextReset: monitor.getNextReset ? monitor.getNextReset(service) : new Date().toISOString(),
        monthly: {
          used: usage.monthly,
          limit: limits.monthly
        }
      };
    }

    // Add overall system status
    const criticalServices = Object.values(status).filter(s => s.status === 'critical');
    const warningServices = Object.values(status).filter(s => s.status === 'warning');

    const response = {
      overall: {
        status: criticalServices.length > 0 ? 'critical' :
                warningServices.length > 0 ? 'warning' : 'ok',
        criticalCount: criticalServices.length,
        warningCount: warningServices.length,
        timestamp: new Date().toISOString()
      },
      services: status
    };

    // Log quota check for Axiom
    logger.info('Quota status checked', {
      overall: response.overall.status,
      criticalServices: criticalServices.map(s => s.name),
      warningServices: warningServices.map(s => s.name)
    });

    return res.json(response);
  } catch (error) {
    logger.error('Failed to get quota status', { error: error.message });
    return res.status(500).json({ error: 'Failed to retrieve quota status' });
  }
});

/**
 * GET /api/monitoring/alerts
 * Get recent alerts
 * Admin only
 */
router.get('/alerts', authenticate, requireRole(['admin']), (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const alerts = monitor.getAlerts(limit);

  sendSuccess(res, {
    alerts,
    total: alerts.length
  });
});

/**
 * GET /api/monitoring/projections
 * Get monthly usage projections
 * Admin only
 */
router.get('/projections', authenticate, requireRole(['admin']), (req, res) => {
  const projections = monitor.getMonthlyProjection();

  sendSuccess(res, {
    projections,
    timestamp: new Date()
  });
});

/**
 * GET /api/monitoring/cache
 * Get cache performance statistics
 * Admin only
 */
router.get('/cache', authenticate, requireRole(['admin']), (req, res) => {
  const cacheStats = cache.getStats();

  sendSuccess(res, {
    cache: cacheStats,
    timestamp: new Date(),
    performance: {
      hitRate: cacheStats.hitRate,
      totalRequests: cacheStats.hits + cacheStats.misses,
      efficiency: cacheStats.hits > 0 ? 'Caching is working' : 'Cache warming up'
    }
  });
});

/**
 * GET /api/monitoring/service/:serviceName
 * Get specific service details
 * Admin only
 */
router.get('/service/:serviceName', authenticate, requireRole(['admin']), (req, res) => {
  const { serviceName } = req.params;
  const stats = monitor.getStats();

  if (!stats[serviceName]) {
    return res.status(404).json({
      error: 'Service not found',
      availableServices: Object.keys(stats)
    });
  }

  const projections = monitor.getMonthlyProjection();

  sendSuccess(res, {
    service: serviceName,
    currentStats: stats[serviceName],
    projection: projections[serviceName],
    remaining: monitor.getRemaining(serviceName),
    status: monitor.getStatus(serviceName, new Date().toISOString().split('T')[0])
  });
});

/**
 * GET /api/monitoring/health
 * Health check with free tier status
 * Public
 */
router.get('/health', (req, res) => {
  const stats = monitor.getStats();
  const exhausted = Object.values(stats).filter(s => s.status === 'EXHAUSTED');
  const critical = Object.values(stats).filter(s => s.status === 'CRITICAL');

  const status = exhausted.length > 0 ? 'DEGRADED' :
                 critical.length > 0 ? 'WARNING' : 'HEALTHY';

  res.json({
    status,
    timestamp: new Date(),
    services: {
      exhausted: exhausted.map(s => s.name),
      critical: critical.map(s => s.name),
      total: Object.keys(stats).length
    }
  });
});

/**
 * GET /api/monitoring/mongodb
 * MongoDB Atlas monitoring dashboard
 * Admin only - Replaces Sentry
 */
router.get('/mongodb', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const dashboard = await mongoMonitoring.getDashboard();
    sendSuccess(res, dashboard);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get MongoDB monitoring data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/monitoring/mongodb/errors
 * Get recent errors from MongoDB
 * Admin only
 */
router.get('/mongodb/errors', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const errors = await mongoMonitoring.getRecentErrors(limit);
    const errorStats = await mongoMonitoring.getErrorStats(24);

    sendSuccess(res, {
      errors,
      stats: errorStats,
      total: errors.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get error data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/monitoring/mongodb/stats
 * Get database statistics
 * Admin only
 */
router.get('/mongodb/stats', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const stats = await mongoMonitoring.getStats();
    sendSuccess(res, stats);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get database stats',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/monitoring/mongodb/collections
 * Get collection statistics
 * Admin only
 */
router.get('/mongodb/collections', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const collections = await mongoMonitoring.getCollectionStats();
    sendSuccess(res, { collections });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get collection stats',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/monitoring/oracle-cloud
 * Get Oracle Cloud Always Free resource usage
 * Admin only - Critical for preventing free tier overages
 */
router.get('/oracle-cloud', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const oracleMonitor = require('../services/monitoring/oracleCloudMonitor');
    const dashboard = await oracleMonitor.getResourceDashboard();

    sendSuccess(res, dashboard);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get Oracle Cloud metrics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/monitoring/oracle-cloud/safe-to-deploy
 * Check if safe to deploy without exceeding Oracle Cloud limits
 * Public (for CI/CD pipelines)
 */
router.get('/oracle-cloud/safe-to-deploy', async (req, res) => {
  try {
    const oracleMonitor = require('../services/monitoring/oracleCloudMonitor');
    const result = await oracleMonitor.isSafeToDeploy();

    if (!result.safe) {
      return res.status(429).json({
        safe: false,
        error: 'Deployment blocked - Oracle Cloud resources at capacity',
        reason: result.reason,
        alerts: result.alerts,
        recommendation: 'Wait for resource usage to decrease or upgrade to paid tier'
      });
    }

    return res.json(result);
  } catch (error) {
    logger.error('Failed to check deployment safety', { error: error.message });
    return res.status(500).json({
      safe: false,
      error: 'Failed to check Oracle Cloud limits',
      recommendation: 'Deploy with caution or check manually'
    });
  }
});

module.exports = router;
