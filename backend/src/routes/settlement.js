/**
 * Settlement Prediction Routes
 *
 * Express routes for FCA settlement prediction API
 *
 * @module routes/settlement
 */

const express = require('express');
const router = express.Router();
const predictorClient = require('../ml_models/settlement_predictor/serving/model_loader');
const logger = require('../config/logger');
const { authenticate } = require('../middleware/auth');
const { requirePremium } = require('../middleware/premiumFeatures');

/**
 * GET /api/settlement/health
 * Check settlement predictor service health
 */
router.get('/health', async (req, res) => {
  try {
    const health = await predictorClient.healthCheck();

    res.json({
      success: true,
      data: health
    });

  } catch (error) {
    logger.error('[SettlementRoutes] Health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error.message
    });
  }
});

/**
 * POST /api/settlement/predict
 * Predict settlement range for an FCA case
 *
 * Body: {
 *   fraudType: string,
 *   damagesClaimed: number,
 *   industry: string,
 *   jurisdiction: string,
 *   whistleblowerPresent?: boolean,
 *   settlementYear?: number
 * }
 */
router.post('/predict', authenticate, requirePremium, async (req, res) => {
  try {
    const {
      fraudType,
      damagesClaimed,
      industry,
      jurisdiction,
      whistleblowerPresent,
      settlementYear
    } = req.body;

    // Validate required fields
    if (!fraudType || !damagesClaimed || !industry || !jurisdiction) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['fraudType', 'damagesClaimed', 'industry', 'jurisdiction']
      });
    }

    // Validate damages amount
    if (typeof damagesClaimed !== 'number' || damagesClaimed <= 0) {
      return res.status(400).json({
        success: false,
        error: 'damagesClaimed must be a positive number'
      });
    }

    // Make prediction
    const result = await predictorClient.predict({
      fraudType,
      damagesClaimed,
      industry,
      jurisdiction,
      whistleblowerPresent,
      settlementYear
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Prediction failed',
        message: result.error
      });
    }

    // Log usage for analytics
    logger.info(`[Settlement] Prediction for user ${req.user.userId}: ${fraudType} fraud, $${damagesClaimed.toLocaleString()}`);

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    logger.error('[SettlementRoutes] Prediction error:', error);
    res.status(500).json({
      success: false,
      error: 'Prediction failed',
      message: error.message
    });
  }
});

/**
 * POST /api/settlement/batch-predict
 * Batch predict multiple settlement scenarios
 *
 * Body: {
 *   cases: Array<{
 *     fraudType, damagesClaimed, industry, jurisdiction, whistleblowerPresent?, settlementYear?
 *   }>
 * }
 */
router.post('/batch-predict', authenticate, requirePremium, async (req, res) => {
  try {
    const { cases } = req.body;

    if (!Array.isArray(cases) || cases.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'cases must be a non-empty array'
      });
    }

    if (cases.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Batch size limited to 100 predictions'
      });
    }

    // Make batch prediction
    const result = await predictorClient.batchPredict(cases);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Batch prediction failed',
        message: result.error
      });
    }

    logger.info(`[Settlement] Batch prediction for user ${req.user.userId}: ${cases.length} cases`);

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    logger.error('[SettlementRoutes] Batch prediction error:', error);
    res.status(500).json({
      success: false,
      error: 'Batch prediction failed',
      message: error.message
    });
  }
});

/**
 * GET /api/settlement/model-info
 * Get ML model information and statistics
 */
router.get('/model-info', authenticate, async (req, res) => {
  try {
    const result = await predictorClient.getModelInfo();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve model info',
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    logger.error('[SettlementRoutes] Model info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve model info',
      message: error.message
    });
  }
});

/**
 * GET /api/settlement/examples
 * Get example settlement predictions for reference
 */
router.get('/examples', authenticate, async (req, res) => {
  const examples = [
    {
      scenario: 'Healthcare fraud - Large pharmaceutical company',
      input: {
        fraudType: 'healthcare',
        damagesClaimed: 50000000,
        industry: 'pharmaceutical',
        jurisdiction: 'District of Massachusetts',
        whistleblowerPresent: true,
        settlementYear: 2024
      },
      description: 'Typical large pharma FCA case with whistleblower'
    },
    {
      scenario: 'Defense contractor procurement fraud',
      input: {
        fraudType: 'defense',
        damagesClaimed: 25000000,
        industry: 'defense_contractor',
        jurisdiction: 'Eastern District of Virginia',
        whistleblowerPresent: false,
        settlementYear: 2024
      },
      description: 'Medium-sized defense contractor overbilling'
    },
    {
      scenario: 'COVID-19 relief fraud - PPP loan abuse',
      input: {
        fraudType: 'covid',
        damagesClaimed: 5000000,
        industry: 'financial',
        jurisdiction: 'Southern District of New York',
        whistleblowerPresent: false,
        settlementYear: 2024
      },
      description: 'Pandemic relief fraud case'
    }
  ];

  res.json({
    success: true,
    data: {
      examples,
      note: 'Use POST /api/settlement/predict with these inputs to get predictions'
    }
  });
});

module.exports = router;
