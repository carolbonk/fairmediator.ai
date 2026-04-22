/**
 * Party Routes
 * API endpoints for party users (people in disputes)
 *
 * Parties are litigants/disputants with constrained portal access.
 * They can view their case, upload documents, and participate in ODR sessions.
 */

const express = require('express');
const router = express.Router();
const { authenticateWithRole, requirePermission } = require('../middleware/roleAuth');
const { asyncErrorHandler } = require('../middleware/errorMonitoring');
const Mediator = require('../models/Mediator');
const Case = require('../models/Case');

// All routes require party or admin role
router.use(authenticateWithRole(['party', 'admin']));

/**
 * GET /api/parties/my-case
 * Get current user's case information
 * Parties typically have one active case at a time
 */
router.get('/my-case', requirePermission('party.case.read'), asyncErrorHandler(async (req, res) => {
  // Find the most recent case where user is a party
  const userCase = await Case.findOne({
    'parties.userId': req.user._id,
    status: { $nin: ['settled', 'cancelled', 'failed'] } // Only active cases
  })
    .populate('mediator.mediatorId', 'name rating specializations location')
    .populate('createdBy', 'name email')
    .sort({ updatedAt: -1 });

  if (!userCase) {
    return res.json({
      success: true,
      data: null,
      message: 'No active case found'
    });
  }

  res.json({
    success: true,
    data: userCase
  });
}));

/**
 * GET /api/parties/recommended-mediators
 * Get recommended mediators for the party
 */
router.get('/recommended-mediators', requirePermission('party.mediator.view'), asyncErrorHandler(async (req, res) => {
  // Return top-rated mediators as recommendations
  const mediators = await Mediator.find({
    isActive: true
  })
    .sort({ rating: -1, totalCases: -1 })
    .limit(6)
    .select('name specializations rating yearsExperience location totalCases isVerified');

  res.json({
    success: true,
    data: mediators
  });
}));

module.exports = router;
