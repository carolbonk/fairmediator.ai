/**
 * Model Management API Routes
 * Endpoints for AI model versioning, metrics tracking, and active learning
 */

const express = require('express');
const router = express.Router();
const ModelVersion = require('../models/ModelVersion');
const modelMetrics = require('../services/ai/modelMetrics');
const { sendSuccess, sendError, asyncHandler } = require('../utils/responseHandlers');
const { authenticate, requireRole } = require('../middleware/auth');

/**
 * GET /api/models/versions
 * List all model versions
 * Admin only
 */
router.get('/versions', authenticate, requireRole(['admin']), asyncHandler(async (req, res) => {
  const { modelType, isActive, limit = 50 } = req.query;

  const query = {};
  if (modelType) query.modelType = modelType;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const versions = await ModelVersion.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .lean();

  sendSuccess(res, {
    versions,
    total: versions.length
  });
}));

/**
 * GET /api/models/versions/:version
 * Get specific model version details
 * Admin only
 */
router.get('/versions/:version', authenticate, requireRole(['admin']), asyncHandler(async (req, res) => {
  const { version } = req.params;

  const modelVersion = await ModelVersion.findOne({ version });

  if (!modelVersion) {
    return sendError(res, 404, `Model version ${version} not found`);
  }

  sendSuccess(res, modelVersion);
}));

/**
 * GET /api/models/active/:modelType
 * Get currently active model version
 * Admin only
 */
router.get('/active/:modelType', authenticate, requireRole(['admin']), asyncHandler(async (req, res) => {
  const { modelType } = req.params;

  const activeModel = await ModelVersion.getActiveModel(modelType);

  if (!activeModel) {
    return sendError(res, 404, `No active ${modelType} model found`);
  }

  sendSuccess(res, activeModel);
}));

/**
 * POST /api/models/evaluate
 * Evaluate model performance
 * Admin only
 */
router.post('/evaluate', authenticate, requireRole(['admin']), asyncHandler(async (req, res) => {
  const {
    modelVersion = 'current',
    startDate,
    endDate,
    minFeedbackConfidence = 0.7,
    testSetSize
  } = req.body;

  const evaluation = await modelMetrics.evaluateConflictModel(modelVersion, {
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : new Date(),
    minFeedbackConfidence,
    testSetSize
  });

  if (!evaluation.success) {
    return sendError(res, 400, evaluation.reason, {
      samplesFound: evaluation.samplesFound
    });
  }

  sendSuccess(res, evaluation);
}));

/**
 * POST /api/models/versions
 * Create new model version
 * Admin only
 */
router.post('/versions', authenticate, requireRole(['admin']), asyncHandler(async (req, res) => {
  const {
    version,
    modelType = 'conflict_detection',
    metrics,
    hyperparameters,
    modelArchitecture,
    trainingData,
    previousVersion
  } = req.body;

  if (!version) {
    return sendError(res, 400, 'Model version is required');
  }

  if (!metrics || !metrics.f1Score) {
    return sendError(res, 400, 'Metrics with f1Score are required');
  }

  const modelVersion = await modelMetrics.saveModelVersion(version, metrics, {
    modelType,
    hyperparameters,
    modelArchitecture,
    trainingData,
    previousVersion
  });

  sendSuccess(res, modelVersion, 201, 'Model version created successfully');
}));

/**
 * POST /api/models/versions/:version/activate
 * Activate a specific model version (deploy to production)
 * Admin only
 */
router.post('/versions/:version/activate', authenticate, requireRole(['admin']), asyncHandler(async (req, res) => {
  const { version } = req.params;

  const modelVersion = await ModelVersion.findOne({ version });

  if (!modelVersion) {
    return sendError(res, 404, `Model version ${version} not found`);
  }

  // Activate (deactivates all other versions of same type)
  await modelVersion.activate();

  sendSuccess(res, modelVersion, 200, `Model version ${version} activated successfully`);
}));

/**
 * GET /api/models/performance/:modelType
 * Get performance trends over time
 * Admin only
 */
router.get('/performance/:modelType', authenticate, requireRole(['admin']), asyncHandler(async (req, res) => {
  const { modelType } = req.params;
  const { days = 30 } = req.query;

  const trends = await modelMetrics.getPerformanceTrends(modelType, parseInt(days));

  sendSuccess(res, {
    modelType,
    days: parseInt(days),
    trends
  });
}));

/**
 * GET /api/models/status/:modelType
 * Get current model health status
 * Admin only
 */
router.get('/status/:modelType', authenticate, requireRole(['admin']), asyncHandler(async (req, res) => {
  const { modelType } = req.params;

  const status = await modelMetrics.getModelStatus(modelType);

  sendSuccess(res, status);
}));

/**
 * GET /api/models/compare
 * Compare two model versions
 * Admin only
 */
router.get('/compare', authenticate, requireRole(['admin']), asyncHandler(async (req, res) => {
  const { version1, version2 } = req.query;

  if (!version1 || !version2) {
    return sendError(res, 400, 'Both version1 and version2 query parameters are required');
  }

  const comparison = await ModelVersion.compareVersions(version1, version2);

  sendSuccess(res, comparison);
}));

/**
 * DELETE /api/models/versions/:version
 * Delete a model version (if not active)
 * Admin only
 */
router.delete('/versions/:version', authenticate, requireRole(['admin']), asyncHandler(async (req, res) => {
  const { version } = req.params;

  const modelVersion = await ModelVersion.findOne({ version });

  if (!modelVersion) {
    return sendError(res, 404, `Model version ${version} not found`);
  }

  if (modelVersion.isActive) {
    return sendError(res, 400, 'Cannot delete active model version. Deactivate it first.');
  }

  await modelVersion.deleteOne();

  sendSuccess(res, { version }, 200, `Model version ${version} deleted successfully`);
}));

module.exports = router;
