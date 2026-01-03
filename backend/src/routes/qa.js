/**
 * Quality Assurance Routes
 * Automated mediator data validation
 */

const express = require('express');
const router = express.Router();
const qaService = require('../services/ai/qaService');
const logger = require('../config/logger');

/**
 * POST /api/qa/validate/:id
 * Validate a specific mediator profile
 */
router.post('/validate/:id', async (req, res) => {
  try {
    const result = await qaService.validateMediatorProfile(req.params.id);
    return res.json(result);
  } catch (error) {
    logger.error('QA validation failed:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/qa/validate-all
 * Batch validate all mediators
 */
router.post('/validate-all', async (req, res) => {
  try {
    const { limit = 100, skipPassed = false } = req.body;
    const result = await qaService.validateAllMediators({ limit, skipPassed });
    return res.json(result);
  } catch (error) {
    logger.error('Batch QA failed:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
