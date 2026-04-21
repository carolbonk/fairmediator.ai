/**
 * Mediator Earnings Routes
 * Handles earnings data, calculations, and projections for mediators
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const MediatorEarnings = require('../models/MediatorEarnings');
const Mediator = require('../models/Mediator');
const Case = require('../models/Case');
const { authenticateWithRole, requirePermission, auditDataAccess } = require('../middleware/roleAuth');
const { asyncHandler } = require('../utils/responseHandlers');
const logger = require('../config/logger');

const earningsProgressRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * GET /api/mediators/:mediatorId/earnings
 * Get earnings data for a mediator
 * Access: Mediator (own data) or Admin
 */
router.get('/:mediatorId/earnings',
  authenticateWithRole(['mediator', 'admin']),
  requirePermission('mediator.earnings.read'),
  auditDataAccess('earnings'),
  asyncHandler(async (req, res) => {
    const { mediatorId } = req.params;

    // Check if mediator can only access their own data
    if (req.auth.role === 'mediator') {
      const mediator = await Mediator.findOne({ userId: req.user._id });
      if (!mediator || mediator._id.toString() !== mediatorId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only access your own earnings data'
        });
      }
    }

    // Find or create earnings record
    let earnings = await MediatorEarnings.findOne({ mediatorId });

    if (!earnings) {
      // Create new earnings record with default values
      earnings = await MediatorEarnings.create({
        mediatorId,
        currentMetrics: {
          hourlyRate: 350,
          averageSessionHours: 4,
          sessionsPerMonth: 0,
          monthlyRevenue: 0
        }
      });

      // Try to populate with actual case data
      const cases = await Case.find({
        'mediator.mediatorId': mediatorId,
        status: { $in: ['settled', 'closed'] }
      });

      if (cases.length > 0) {
        // Calculate actual metrics from case history
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const recentCases = cases.filter(c =>
          c.closedAt && c.closedAt >= lastMonth
        );

        earnings.currentMetrics.sessionsPerMonth = recentCases.length;
        earnings.currentMetrics.monthlyRevenue = recentCases.reduce((sum, c) => {
          return sum + (c.mediatorFee || 0);
        }, 0);

        await earnings.save();
      }
    }

    // Calculate fresh profitability
    earnings.calculateProfitability();

    // Generate projections
    earnings.generateProjections();

    // Calculate market position
    await earnings.calculateMarketPosition();

    res.json({
      success: true,
      data: earnings
    });
  })
);

/**
 * POST /api/mediators/:mediatorId/earnings/calculate
 * Save calculation inputs and generate projections
 * Access: Mediator (own data only)
 */
router.post('/:mediatorId/earnings/calculate',
  authenticateWithRole('mediator'),
  requirePermission('mediator.earnings.write'),
  asyncHandler(async (req, res) => {
    const { mediatorId } = req.params;
    const {
      hourlyRate,
      averageSessionHours,
      sessionsPerMonth,
      overhead,
      enableODR,
      enableCollaboration,
      taxRate,
      inflationRate,
      growthRate
    } = req.body;

    // Verify mediator owns this profile
    const mediator = await Mediator.findOne({ userId: req.user._id });
    if (!mediator || mediator._id.toString() !== mediatorId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only update your own earnings data'
      });
    }

    // Find or create earnings record
    let earnings = await MediatorEarnings.findOne({ mediatorId });

    if (!earnings) {
      earnings = new MediatorEarnings({ mediatorId });
    }

    // Update current metrics
    earnings.currentMetrics.hourlyRate = hourlyRate || earnings.currentMetrics.hourlyRate;
    earnings.currentMetrics.averageSessionHours = averageSessionHours || earnings.currentMetrics.averageSessionHours;
    earnings.currentMetrics.sessionsPerMonth = sessionsPerMonth || earnings.currentMetrics.sessionsPerMonth;
    earnings.currentMetrics.overhead = overhead || earnings.currentMetrics.overhead;

    // Calculate monthly revenue
    earnings.currentMetrics.monthlyRevenue =
      earnings.currentMetrics.hourlyRate *
      earnings.currentMetrics.averageSessionHours *
      earnings.currentMetrics.sessionsPerMonth;

    // Update calculation settings
    earnings.calculationSettings = {
      includeODR: enableODR || false,
      includeCollaboration: enableCollaboration || false,
      taxRate: taxRate || 30,
      inflationRate: inflationRate || 3,
      marketGrowthRate: growthRate || 5
    };

    // Enable scenarios based on input
    earnings.projections.odrScenario.enabled = enableODR || false;
    earnings.projections.collaborationScenario.enabled = enableCollaboration || false;

    // Calculate profitability and projections
    earnings.calculateProfitability();
    earnings.generateProjections();

    // Save updated earnings
    await earnings.save();

    logger.info('Earnings calculation updated', {
      mediatorId,
      userId: req.user._id,
      monthlyRevenue: earnings.currentMetrics.monthlyRevenue
    });

    res.json({
      success: true,
      message: 'Earnings calculations saved successfully',
      data: {
        currentMetrics: earnings.currentMetrics,
        projections: earnings.projections
      }
    });
  })
);

/**
 * GET /api/mediators/:mediatorId/earnings/history
 * Get historical earnings data
 * Access: Mediator (own data) or Admin
 */
router.get('/:mediatorId/earnings/history',
  authenticateWithRole(['mediator', 'admin']),
  requirePermission('mediator.analytics.read'),
  asyncHandler(async (req, res) => {
    const { mediatorId } = req.params;
    const { months = 12 } = req.query;

    // Check authorization
    if (req.auth.role === 'mediator') {
      const mediator = await Mediator.findOne({ userId: req.user._id });
      if (!mediator || mediator._id.toString() !== mediatorId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }
    }

    const earnings = await MediatorEarnings.findOne({ mediatorId })
      .select('historicalData');

    if (!earnings) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Get last N months of data
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const historicalData = earnings.historicalData
      .filter(d => d.month >= startDate)
      .sort((a, b) => a.month - b.month);

    res.json({
      success: true,
      data: historicalData
    });
  })
);

/**
 * POST /api/mediators/:mediatorId/earnings/service-package
 * Create or update service package
 * Access: Mediator (own data only)
 */
router.post('/:mediatorId/earnings/service-package',
  authenticateWithRole('mediator'),
  requirePermission('mediator.services.write'),
  asyncHandler(async (req, res) => {
    const { mediatorId } = req.params;
    const { name, description, basePrice, includedHours, features } = req.body;

    // Verify ownership
    const mediator = await Mediator.findOne({ userId: req.user._id });
    if (!mediator || mediator._id.toString() !== mediatorId) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    const earnings = await MediatorEarnings.findOne({ mediatorId });

    if (!earnings) {
      return res.status(404).json({
        error: 'Earnings profile not found'
      });
    }

    // Add or update service package
    const existingPackage = earnings.servicePackages.find(p => p.name === name);

    if (existingPackage) {
      existingPackage.description = description;
      existingPackage.basePrice = basePrice;
      existingPackage.includedHours = includedHours;
      existingPackage.features = features;
    } else {
      earnings.servicePackages.push({
        name,
        description,
        basePrice,
        includedHours,
        features,
        isActive: true
      });
    }

    await earnings.save();

    res.json({
      success: true,
      message: 'Service package saved successfully',
      data: earnings.servicePackages
    });
  })
);

/**
 * GET /api/mediators/earnings/market-insights
 * Get aggregated market insights
 * Access: Mediator or Attorney (limited data)
 */
router.get('/earnings/market-insights',
  authenticateWithRole(['mediator', 'attorney', 'admin']),
  asyncHandler(async (req, res) => {
    const insights = await MediatorEarnings.getMarketInsights();

    // Limit data for attorneys
    if (req.auth.role === 'attorney') {
      delete insights.avgMonthlyRevenue;
      delete insights.avgProfitMargin;
    }

    res.json({
      success: true,
      data: insights
    });
  })
);

/**
 * GET /api/mediators/earnings/top-performers
 * Get top performing mediators (anonymized for non-admins)
 * Access: Mediator, Attorney, Admin
 */
router.get('/earnings/top-performers',
  authenticateWithRole(['mediator', 'attorney', 'admin']),
  asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    const topEarners = await MediatorEarnings.getTopEarners(parseInt(limit));

    // Anonymize data for non-admins
    let responseData = topEarners;
    if (req.auth.role !== 'admin') {
      responseData = topEarners.map((earner, index) => ({
        rank: index + 1,
        percentile: earner.marketPosition.revenuePercentile,
        location: earner.mediatorId?.location || 'Unknown',
        specializations: earner.mediatorId?.specializations || []
        // Revenue numbers hidden for non-admins
      }));
    }

    res.json({
      success: true,
      data: responseData
    });
  })
);

/**
 * POST /api/mediators/:mediatorId/earnings/goals
 * Set financial goals
 * Access: Mediator (own data only)
 */
router.post('/:mediatorId/earnings/goals',
  authenticateWithRole('mediator'),
  requirePermission('mediator.earnings.write'),
  asyncHandler(async (req, res) => {
    const { mediatorId } = req.params;
    const {
      monthlyRevenueTarget,
      annualRevenueTarget,
      sessionsPerMonthTarget,
      targetProfitMargin,
      targetDate
    } = req.body;

    // Verify ownership
    const mediator = await Mediator.findOne({ userId: req.user._id });
    if (!mediator || mediator._id.toString() !== mediatorId) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    const earnings = await MediatorEarnings.findOneAndUpdate(
      { mediatorId },
      {
        financialGoals: {
          monthlyRevenueTarget,
          annualRevenueTarget,
          sessionsPerMonthTarget,
          targetProfitMargin,
          targetDate
        }
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'Financial goals updated successfully',
      data: earnings.financialGoals
    });
  })
);

/**
 * GET /api/mediators/:mediatorId/earnings/progress
 * Get progress towards financial goals
 * Access: Mediator (own data) or Admin
 */
router.get('/:mediatorId/earnings/progress',
  earningsProgressRateLimiter,
  authenticateWithRole(['mediator', 'admin']),
  requirePermission('mediator.analytics.read'),
  asyncHandler(async (req, res) => {
    const { mediatorId } = req.params;

    // Check authorization
    if (req.auth.role === 'mediator') {
      const mediator = await Mediator.findOne({ userId: req.user._id });
      if (!mediator || mediator._id.toString() !== mediatorId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }
    }

    const earnings = await MediatorEarnings.findOne({ mediatorId });

    if (!earnings || !earnings.financialGoals.monthlyRevenueTarget) {
      return res.json({
        success: true,
        data: {
          hasGoals: false
        }
      });
    }

    const progress = {
      hasGoals: true,
      monthlyRevenue: {
        current: earnings.currentMetrics.monthlyRevenue,
        target: earnings.financialGoals.monthlyRevenueTarget,
        percentage: (earnings.currentMetrics.monthlyRevenue /
                    earnings.financialGoals.monthlyRevenueTarget * 100).toFixed(1)
      },
      sessions: {
        current: earnings.currentMetrics.sessionsPerMonth,
        target: earnings.financialGoals.sessionsPerMonthTarget,
        percentage: (earnings.currentMetrics.sessionsPerMonth /
                    earnings.financialGoals.sessionsPerMonthTarget * 100).toFixed(1)
      },
      profitMargin: {
        current: earnings.currentMetrics.profitMargin,
        target: earnings.financialGoals.targetProfitMargin,
        percentage: (earnings.currentMetrics.profitMargin /
                    earnings.financialGoals.targetProfitMargin * 100).toFixed(1)
      },
      targetDate: earnings.financialGoals.targetDate,
      daysRemaining: earnings.financialGoals.targetDate ?
        Math.ceil((new Date(earnings.financialGoals.targetDate) - new Date()) / (1000 * 60 * 60 * 24)) : null
    };

    res.json({
      success: true,
      data: progress
    });
  })
);

module.exports = router;