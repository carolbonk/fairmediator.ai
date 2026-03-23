/**
 * Automation Routes
 * Endpoints for N8N workflow triggers and orchestration
 */

const express = require('express');
const router = express.Router();
const { monitor } = require('../utils/freeTierMonitor');
const logger = require('../config/logger');
const Mediator = require('../models/Mediator');

/**
 * POST /api/automation/trigger
 * Trigger specific automation workflows
 * Public (secured by API token in N8N)
 *
 * Request body:
 * {
 *   "workflow": "scrape-and-blog" | "quota-check-alert" | "weekly-report",
 *   "data": { ... }
 * }
 */
router.post('/trigger', async (req, res) => {
  const { workflow, data } = req.body;

  if (!workflow) {
    return res.status(400).json({ error: 'Workflow name is required' });
  }

  const workflows = {
    /**
     * Scrape FEC data and generate blog outline
     */
    'scrape-and-blog': async (data) => {
      logger.info('Running scrape-and-blog workflow', { data });

      // Placeholder: In production, this would trigger actual scrapers
      // For now, we'll return mock data that N8N can process
      const mockScrapedCount = 5;

      // Get recent mediators as findings
      const recentMediators = await Mediator.find()
        .sort({ createdAt: -1 })
        .limit(mockScrapedCount)
        .select('name ideologyScore biasIndicators.donationHistory');

      // Analyze donations
      const totalDonations = recentMediators.reduce((sum, m) => {
        return sum + (m.biasIndicators?.donationHistory?.length || 0);
      }, 0);

      const topDonee = recentMediators[0]?.biasIndicators?.donationHistory?.[0]?.recipient || 'Unknown';

      const blogOutline = {
        title: `What ${mockScrapedCount} Mediator Donations Tell Us About Bias`,
        findings: [
          `${totalDonations} total political donations found`,
          `Top recipient: ${topDonee}`,
          `Ideology scores range: ${Math.min(...recentMediators.map(m => m.ideologyScore))} to ${Math.max(...recentMediators.map(m => m.ideologyScore))}`
        ],
        researchNeeded: [
          `Legal implications of mediator donations to ${topDonee}`,
          'State bar association rules on political activity',
          'Impact on mediator selection in high-stakes cases'
        ],
        perplexityQuery: `Legal implications of mediator donations to ${topDonee} and potential conflicts of interest`
      };

      return {
        scraped: mockScrapedCount,
        blogOutline,
        timestamp: new Date().toISOString()
      };
    },

    /**
     * Check quota usage and generate alerts
     */
    'quota-check-alert': async (data) => {
      logger.info('Running quota-check-alert workflow');

      const stats = monitor.getStats();
      const alerts = [];

      for (const [service, stat] of Object.entries(stats)) {
        const percent = stat.usage.daily / stat.limits.daily * 100;

        if (percent > 85) {
          alerts.push({
            service: stat.name,
            used: stat.usage.daily,
            limit: stat.limits.daily,
            percent: Math.round(percent),
            severity: percent > 95 ? 'critical' : 'warning',
            message: `${stat.name} at ${Math.round(percent)}% of daily quota`,
            nextReset: stat.nextReset
          });
        }
      }

      return {
        alerts,
        criticalCount: alerts.filter(a => a.severity === 'critical').length,
        warningCount: alerts.filter(a => a.severity === 'warning').length,
        timestamp: new Date().toISOString()
      };
    },

    /**
     * Generate weekly scraping summary report
     */
    'weekly-report': async (data) => {
      logger.info('Running weekly-report workflow');

      const days = data?.days || 7;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);

      // Get scraping stats
      const newMediators = await Mediator.countDocuments({
        createdAt: { $gte: cutoff }
      });

      // Get top findings
      const topDonors = await Mediator.aggregate([
        {
          $match: { createdAt: { $gte: cutoff } }
        },
        {
          $unwind: '$biasIndicators.donationHistory'
        },
        {
          $group: {
            _id: '$biasIndicators.donationHistory.recipient',
            totalAmount: { $sum: '$biasIndicators.donationHistory.amount' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { totalAmount: -1 }
        },
        {
          $limit: 5
        }
      ]);

      const topAffiliations = await Mediator.aggregate([
        {
          $match: { createdAt: { $gte: cutoff } }
        },
        {
          $unwind: '$affiliations'
        },
        {
          $group: {
            _id: '$affiliations.name',
            count: { $sum: 1 },
            type: { $first: '$affiliations.type' }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 5
        }
      ]);

      return {
        period: `Last ${days} days`,
        summary: {
          newMediators,
          newDonations: topDonors.reduce((sum, d) => sum + d.count, 0),
          newAffiliations: topAffiliations.reduce((sum, a) => sum + a.count, 0)
        },
        topFindings: {
          donors: topDonors.map(d => ({
            recipient: d._id,
            amount: d.totalAmount,
            donations: d.count
          })),
          affiliations: topAffiliations.map(a => ({
            name: a._id,
            count: a.count,
            type: a.type
          }))
        },
        researchOpportunities: [
          topDonors[0] ? `Research ${topDonors[0]._id} and their influence in mediation` : 'No recent donations',
          topAffiliations[0] ? `Analyze ${topAffiliations[0]._id} network effects` : 'No recent affiliations',
          'State-by-state analysis of mediator political activity'
        ],
        timestamp: new Date().toISOString()
      };
    }
  };

  if (!workflows[workflow]) {
    return res.status(400).json({
      error: 'Unknown workflow',
      availableWorkflows: Object.keys(workflows)
    });
  }

  try {
    const result = await workflows[workflow](data || {});

    logger.info('Automation workflow completed', {
      workflow,
      success: true,
      dataSize: JSON.stringify(result).length
    });

    return res.json({
      success: true,
      workflow,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Workflow execution failed', {
      workflow,
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      error: error.message,
      workflow
    });
  }
});

/**
 * GET /api/automation/workflows
 * List available automation workflows
 * Public
 */
router.get('/workflows', (req, res) => {
  res.json({
    workflows: [
      {
        name: 'scrape-and-blog',
        description: 'Scrape FEC data and generate blog post outline',
        parameters: {}
      },
      {
        name: 'quota-check-alert',
        description: 'Check quota usage and generate alerts for services above 85%',
        parameters: {}
      },
      {
        name: 'weekly-report',
        description: 'Generate weekly scraping summary with top findings',
        parameters: {
          days: 'Number of days to analyze (default: 7)'
        }
      }
    ]
  });
});

module.exports = router;
