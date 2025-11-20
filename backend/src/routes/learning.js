/**
 * Learning Routes
 * Track user behavior for smart AI improvement
 */

const express = require('express');
const router = express.Router();
const contextBuilder = require('../services/learning/contextBuilder');

/**
 * POST /api/learning/track-selection
 * Track when user views, clicks, or contacts a mediator
 */
router.post('/track-selection', async (req, res) => {
  try {
    const {
      mediatorId,
      action, // 'viewed', 'clicked', 'contacted', 'scheduled_call', 'hired'
      caseType,
      jurisdiction,
      ideologyDetected,
      emotionDetected,
      partiesInvolved,
      selectionReason,
      userQuery,
      aiRecommendation
    } = req.body;

    if (!mediatorId || !action) {
      return res.status(400).json({
        error: 'mediatorId and action are required'
      });
    }

    const selection = await contextBuilder.trackSelection({
      userId: req.user?.id, // Optional - works for anonymous users too
      mediatorId,
      action,
      caseType,
      jurisdiction,
      ideologyDetected,
      emotionDetected,
      partiesInvolved,
      selectionReason,
      userQuery,
      aiRecommendation
    });

    res.json({
      success: true,
      message: 'Selection tracked successfully',
      selectionId: selection._id
    });
  } catch (error) {
    console.error('Track selection error:', error);
    res.status(500).json({
      error: 'Failed to track selection',
      message: error.message
    });
  }
});

/**
 * POST /api/learning/record-outcome
 * Record final outcome of a case (settlement, satisfaction, etc.)
 */
router.post('/record-outcome', async (req, res) => {
  try {
    const {
      mediatorId,
      caseType,
      jurisdiction,
      outcome,
      settlementReached,
      settlementDays,
      totalCost,
      userSatisfaction,
      wouldRecommend,
      feedback,
      hiredDate,
      completedDate
    } = req.body;

    if (!mediatorId || !caseType || !outcome) {
      return res.status(400).json({
        error: 'mediatorId, caseType, and outcome are required'
      });
    }

    const caseOutcome = await contextBuilder.recordOutcome({
      userId: req.user?.id,
      mediatorId,
      caseType,
      jurisdiction,
      outcome,
      settlementReached,
      settlementDays,
      totalCost,
      userSatisfaction,
      wouldRecommend,
      feedback,
      hiredDate: hiredDate ? new Date(hiredDate) : undefined,
      completedDate: completedDate ? new Date(completedDate) : undefined
    });

    res.json({
      success: true,
      message: 'Outcome recorded successfully',
      outcomeId: caseOutcome._id
    });
  } catch (error) {
    console.error('Record outcome error:', error);
    res.status(500).json({
      error: 'Failed to record outcome',
      message: error.message
    });
  }
});

/**
 * GET /api/learning/mediator-history/:mediatorId
 * Get historical performance data for a specific mediator
 */
router.get('/mediator-history/:mediatorId', async (req, res) => {
  try {
    const { mediatorId } = req.params;

    const history = await contextBuilder.getMediatorHistory(mediatorId);

    if (!history) {
      return res.json({
        success: true,
        message: 'No historical data available for this mediator yet',
        history: null
      });
    }

    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Get mediator history error:', error);
    res.status(500).json({
      error: 'Failed to get mediator history',
      message: error.message
    });
  }
});

module.exports = router;
