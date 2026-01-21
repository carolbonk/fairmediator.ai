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

module.exports = router;
