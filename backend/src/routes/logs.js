/**
 * Logs Routes
 * Endpoints for retrieving and analyzing application logs
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const logger = require('../config/logger');

/**
 * GET /api/logs/recent
 * Get recent logs (errors, warnings, scraping stats)
 * Public (secured by API token in N8N)
 *
 * Query params:
 * - level: all | error | warn | info | debug (default: all)
 * - hours: number of hours to look back (default: 24)
 * - type: filter by message type (scraping, quota, error, etc.)
 * - limit: max number of logs to return (default: 100)
 */
router.get('/recent', async (req, res) => {
  const {
    level = 'all',
    hours = 24,
    type,
    limit = 100
  } = req.query;

  try {
    // Get today's log file
    const today = new Date().toISOString().split('T')[0];
    const logFile = path.join(__dirname, `../../logs/combined-${today}.log`);

    // Check if log file exists
    try {
      await fs.access(logFile);
    } catch (error) {
      return res.json({
        total: 0,
        logs: [],
        stats: {
          scraping: 0,
          errors: 0,
          quotaAlerts: 0
        },
        message: 'No logs found for today'
      });
    }

    const logContent = await fs.readFile(logFile, 'utf-8');
    const logs = logContent
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return null;
        }
      })
      .filter(log => log !== null)
      .filter(log => {
        // Filter by time
        const logTime = new Date(log.timestamp);
        const cutoff = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000);
        if (logTime < cutoff) return false;

        // Filter by level
        if (level !== 'all' && log.level !== level) return false;

        // Filter by type (keyword in message)
        if (type && !log.message.toLowerCase().includes(type.toLowerCase())) return false;

        return true;
      })
      .slice(0, parseInt(limit));

    // Extract stats from logs
    const scrapingLogs = logs.filter(l =>
      l.message.toLowerCase().includes('scrap') ||
      l.message.toLowerCase().includes('mediator')
    );

    const errorLogs = logs.filter(l => l.level === 'error');

    const quotaLogs = logs.filter(l =>
      l.message.toLowerCase().includes('quota') ||
      l.message.toLowerCase().includes('limit')
    );

    const warningLogs = logs.filter(l => l.level === 'warn');

    logger.info('Logs retrieved', {
      total: logs.length,
      level,
      hours,
      type
    });

    return res.json({
      total: logs.length,
      filters: {
        level,
        hours: parseInt(hours),
        type: type || 'all'
      },
      stats: {
        scraping: scrapingLogs.length,
        errors: errorLogs.length,
        warnings: warningLogs.length,
        quotaAlerts: quotaLogs.length
      },
      recentErrors: errorLogs.slice(0, 10).map(log => ({
        timestamp: log.timestamp,
        message: log.message,
        level: log.level,
        metadata: log.metadata || {}
      })),
      recentScraping: scrapingLogs.slice(0, 10).map(log => ({
        timestamp: log.timestamp,
        message: log.message,
        level: log.level
      })),
      recentQuota: quotaLogs.slice(0, 10).map(log => ({
        timestamp: log.timestamp,
        message: log.message,
        level: log.level
      })),
      allLogs: logs.length <= 50 ? logs : undefined // Only return all logs if less than 50
    });
  } catch (error) {
    logger.error('Failed to fetch logs', { error: error.message });
    return res.status(500).json({
      error: error.message,
      message: 'Failed to retrieve logs'
    });
  }
});

/**
 * GET /api/logs/summary
 * Get aggregated log statistics
 * Public
 */
router.get('/summary', async (req, res) => {
  const { days = 7 } = req.query;

  try {
    const today = new Date();
    const summaries = [];

    for (let i = 0; i < parseInt(days); i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const logFile = path.join(__dirname, `../../logs/combined-${dateStr}.log`);

      try {
        await fs.access(logFile);
        const content = await fs.readFile(logFile, 'utf-8');
        const logs = content.split('\n').filter(l => l.trim()).map(l => {
          try {
            return JSON.parse(l);
          } catch (e) {
            return null;
          }
        }).filter(l => l !== null);

        summaries.push({
          date: dateStr,
          total: logs.length,
          errors: logs.filter(l => l.level === 'error').length,
          warnings: logs.filter(l => l.level === 'warn').length,
          info: logs.filter(l => l.level === 'info').length
        });
      } catch (error) {
        summaries.push({
          date: dateStr,
          total: 0,
          errors: 0,
          warnings: 0,
          info: 0,
          note: 'No logs for this day'
        });
      }
    }

    return res.json({
      period: `Last ${days} days`,
      summaries,
      totals: {
        errors: summaries.reduce((sum, s) => sum + s.errors, 0),
        warnings: summaries.reduce((sum, s) => sum + s.warnings, 0),
        total: summaries.reduce((sum, s) => sum + s.total, 0)
      }
    });
  } catch (error) {
    logger.error('Failed to get log summary', { error: error.message });
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
