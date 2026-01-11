/**
 * Affiliation Routes
 * Handles conflict of interest detection
 * Now using FREE Hugging Face models!
 */

const express = require('express');
const router = express.Router();
const affiliationDetector = require('../services/huggingface/affiliationDetector');
const Mediator = require('../models/Mediator');
const { sendSuccess, sendError, sendValidationError, sendNotFound, asyncHandler } = require('../utils/responseHandlers');

/**
 * POST /api/affiliations/check
 * Check affiliations for one or more mediators
 */
router.post('/check', asyncHandler(async (req, res) => {
  const { mediatorIds, parties } = req.body;

  if (!mediatorIds || !Array.isArray(mediatorIds) || mediatorIds.length === 0) {
    return sendValidationError(res, 'mediatorIds array is required');
  }

  if (!parties || !Array.isArray(parties) || parties.length === 0) {
    return sendValidationError(res, 'parties array is required');
  }

  // Fetch mediator profiles
  const mediators = await Mediator.find({ _id: { $in: mediatorIds } });

  if (mediators.length === 0) {
    return sendNotFound(res, 'Mediators');
  }

  // Perform affiliation detection
  const results = await affiliationDetector.batchDetect(mediators, parties);

  return sendSuccess(res, results);
}));

/**
 * POST /api/affiliations/quick-check
 * Quick affiliation check for UI flags (red/yellow/green)
 */
router.post('/quick-check', asyncHandler(async (req, res) => {
  const { mediatorIds, parties } = req.body;

  if (!mediatorIds || !Array.isArray(mediatorIds)) {
    return sendValidationError(res, 'mediatorIds array is required');
  }

  if (!parties || !Array.isArray(parties)) {
    return sendValidationError(res, 'parties array is required');
  }

  const mediators = await Mediator.find({ _id: { $in: mediatorIds } });

  const quickChecks = await Promise.all(
    mediators.map(mediator =>
      affiliationDetector.quickCheck(mediator, parties)
    )
  );

  return sendSuccess(res, quickChecks);
}));

/**
 * GET /api/affiliations/mediator/:id
 * Get stored affiliation data for a mediator
 */
router.get('/mediator/:id', asyncHandler(async (req, res) => {
  const mediator = await Mediator.findById(req.params.id)
    .select('name affiliations');

  if (!mediator) {
    return sendNotFound(res, 'Mediator');
  }

  return sendSuccess(res, {
    mediatorId: mediator._id,
    mediatorName: mediator.name,
    affiliations: mediator.affiliations || []
  });
}));

module.exports = router;
