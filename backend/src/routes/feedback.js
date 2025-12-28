/**
 * Feedback API Routes
 * Endpoints for Active Learning - collecting human feedback on conflict detection
 */

const express = require('express');
const router = express.Router();
const ConflictFeedback = require('../models/ConflictFeedback');
const Mediator = require('../models/Mediator');
const { sendSuccess, sendError } = require('../utils/responseHandlers');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const Joi = require('joi');
const logger = require('../utils/logger');

/**
 * Submit conflict feedback
 * POST /api/feedback/conflict
 * Body: { mediatorId, parties, prediction, feedback, caseType, queryText }
 */
router.post('/conflict',
  authenticateToken,
  validateRequest({
    body: Joi.object({
      mediatorId: Joi.string().required(),
      parties: Joi.array().items(Joi.string()).min(1).required(),
      caseType: Joi.string().valid('employment', 'business', 'family', 'real_estate', 'contract', 'ip', 'construction', 'healthcare', 'other'),
      prediction: Joi.object({
        hasConflict: Joi.boolean().required(),
        riskLevel: Joi.string().valid('low', 'medium', 'high', 'unknown'),
        confidence: Joi.number().min(0).max(1),
        detectedConflicts: Joi.array().items(Joi.object({
          entity: Joi.string(),
          relationship: Joi.string(),
          source: Joi.string(),
          confidence: Joi.number().min(0).max(1)
        })),
        modelVersion: Joi.string()
      }).required(),
      feedback: Joi.object({
        hasConflict: Joi.boolean().required(),
        actualRiskLevel: Joi.string().valid('low', 'medium', 'high', 'none').required(),
        actualConflicts: Joi.array().items(Joi.object({
          entity: Joi.string(),
          relationship: Joi.string(),
          severity: Joi.string().valid('minor', 'moderate', 'severe'),
          notes: Joi.string()
        })),
        notes: Joi.string(),
        confidence: Joi.number().min(0).max(1)
      }).required(),
      queryText: Joi.string(),
      caseId: Joi.string()
    })
  }),
  async (req, res) => {
    try {
      const {
        mediatorId,
        parties,
        caseType,
        prediction,
        feedback,
        queryText,
        caseId
      } = req.body;

      // Verify mediator exists
      const mediator = await Mediator.findById(mediatorId);
      if (!mediator) {
        return sendError(res, 404, 'Mediator not found');
      }

      // Create feedback record
      const conflictFeedback = new ConflictFeedback({
        mediatorId,
        parties,
        caseType: caseType || 'other',
        caseId,
        prediction: {
          ...prediction,
          timestamp: new Date()
        },
        feedback,
        reviewedBy: {
          userId: req.user.id,
          role: req.user.role || 'user'
        },
        status: 'reviewed', // User-submitted feedback is pre-reviewed
        queryText,
        source: 'api'
      });

      await conflictFeedback.save();

      logger.info(`Conflict feedback submitted for mediator ${mediatorId} by user ${req.user.id}`);

      return sendSuccess(res, {
        feedbackId: conflictFeedback._id,
        isCorrectPrediction: conflictFeedback.isCorrectPrediction,
        predictionError: conflictFeedback.predictionError,
        isHighValue: conflictFeedback.isHighValue
      }, 201, 'Feedback submitted successfully');

    } catch (error) {
      logger.error('Error submitting conflict feedback:', error);
      return sendError(res, 500, 'Failed to submit feedback', { error: error.message });
    }
  }
);

/**
 * Get feedback for a specific mediator
 * GET /api/feedback/mediator/:mediatorId
 */
router.get('/mediator/:mediatorId',
  authenticateToken,
  async (req, res) => {
    try {
      const { mediatorId } = req.params;
      const { status, limit = 50, offset = 0 } = req.query;

      const query = { mediatorId };
      if (status) {
        query.status = status;
      }

      const feedback = await ConflictFeedback.find(query)
        .sort({ createdAt: -1 })
        .skip(parseInt(offset))
        .limit(parseInt(limit))
        .populate('reviewedBy.userId', 'name email');

      const total = await ConflictFeedback.countDocuments(query);

      return sendSuccess(res, {
        feedback,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

    } catch (error) {
      logger.error('Error fetching mediator feedback:', error);
      return sendError(res, 500, 'Failed to fetch feedback', { error: error.message });
    }
  }
);

/**
 * Get model performance metrics
 * GET /api/feedback/metrics
 * Admin only
 */
router.get('/metrics',
  authenticateToken,
  async (req, res) => {
    try {
      // Check admin permission
      if (req.user.role !== 'admin') {
        return sendError(res, 403, 'Admin access required');
      }

      const { caseType, startDate, endDate } = req.query;

      const filters = {};
      if (caseType) filters.caseType = caseType;
      if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) filters.createdAt.$gte = new Date(startDate);
        if (endDate) filters.createdAt.$lte = new Date(endDate);
      }

      const metrics = await ConflictFeedback.getPerformanceMetrics(filters);

      // Additional breakdown by case type
      const caseTypes = ['employment', 'business', 'family', 'real_estate', 'contract', 'ip', 'construction', 'healthcare', 'other'];
      const breakdown = {};

      for (const type of caseTypes) {
        breakdown[type] = await ConflictFeedback.getPerformanceMetrics({ caseType: type });
      }

      return sendSuccess(res, {
        overall: metrics,
        byCaseType: breakdown,
        filters
      });

    } catch (error) {
      logger.error('Error fetching performance metrics:', error);
      return sendError(res, 500, 'Failed to fetch metrics', { error: error.message });
    }
  }
);

/**
 * Get pending feedback reviews
 * GET /api/feedback/pending
 * Admin/Legal Expert only
 */
router.get('/pending',
  authenticateToken,
  async (req, res) => {
    try {
      // Check permission
      if (!['admin', 'legal_expert'].includes(req.user.role)) {
        return sendError(res, 403, 'Admin or legal expert access required');
      }

      const { limit = 50 } = req.query;

      const pending = await ConflictFeedback.getPendingReviews(parseInt(limit));

      return sendSuccess(res, {
        pending,
        count: pending.length
      });

    } catch (error) {
      logger.error('Error fetching pending reviews:', error);
      return sendError(res, 500, 'Failed to fetch pending reviews', { error: error.message });
    }
  }
);

/**
 * Get high-value training data
 * GET /api/feedback/training-data
 * Admin only - for model retraining
 */
router.get('/training-data',
  authenticateToken,
  async (req, res) => {
    try {
      // Check admin permission
      if (req.user.role !== 'admin') {
        return sendError(res, 403, 'Admin access required');
      }

      const { limit = 1000, unused = true } = req.query;

      let query = {
        status: 'reviewed',
        isHighValue: true
      };

      if (unused === 'true' || unused === true) {
        query.usedForRetraining = false;
      }

      const trainingData = await ConflictFeedback.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .populate('mediatorId', 'name location specializations yearsExperience ideologyScore affiliations cases');

      return sendSuccess(res, {
        trainingData,
        count: trainingData.length
      });

    } catch (error) {
      logger.error('Error fetching training data:', error);
      return sendError(res, 500, 'Failed to fetch training data', { error: error.message });
    }
  }
);

/**
 * Update feedback status
 * PUT /api/feedback/:feedbackId/status
 * Admin only
 */
router.put('/:feedbackId/status',
  authenticateToken,
  validateRequest({
    body: Joi.object({
      status: Joi.string().valid('pending', 'reviewed', 'validated', 'disputed', 'archived').required(),
      notes: Joi.string()
    })
  }),
  async (req, res) => {
    try {
      // Check admin permission
      if (req.user.role !== 'admin') {
        return sendError(res, 403, 'Admin access required');
      }

      const { feedbackId } = req.params;
      const { status, notes } = req.body;

      const feedback = await ConflictFeedback.findByIdAndUpdate(
        feedbackId,
        {
          status,
          ...(notes && { 'feedback.notes': notes })
        },
        { new: true }
      );

      if (!feedback) {
        return sendError(res, 404, 'Feedback not found');
      }

      logger.info(`Feedback ${feedbackId} status updated to ${status} by admin ${req.user.id}`);

      return sendSuccess(res, feedback, 200, 'Status updated successfully');

    } catch (error) {
      logger.error('Error updating feedback status:', error);
      return sendError(res, 500, 'Failed to update status', { error: error.message });
    }
  }
);

/**
 * Bulk mark feedback as used for retraining
 * POST /api/feedback/mark-retrained
 * Admin only - called after model retraining
 */
router.post('/mark-retrained',
  authenticateToken,
  validateRequest({
    body: Joi.object({
      feedbackIds: Joi.array().items(Joi.string()).min(1).required()
    })
  }),
  async (req, res) => {
    try {
      // Check admin permission
      if (req.user.role !== 'admin') {
        return sendError(res, 403, 'Admin access required');
      }

      const { feedbackIds } = req.body;

      const result = await ConflictFeedback.markAsRetrained(feedbackIds);

      logger.info(`Marked ${feedbackIds.length} feedback records as retrained by admin ${req.user.id}`);

      return sendSuccess(res, {
        updated: result.modifiedCount,
        total: feedbackIds.length
      }, 200, 'Feedback marked as retrained');

    } catch (error) {
      logger.error('Error marking feedback as retrained:', error);
      return sendError(res, 500, 'Failed to mark feedback', { error: error.message });
    }
  }
);

module.exports = router;
