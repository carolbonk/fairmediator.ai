/**
 * Mediator Routes
 * CRUD operations for mediator profiles
 * Now using FREE Hugging Face models!
 */

const express = require('express');
const router = express.Router();
const Mediator = require('../models/Mediator');
const ideologyClassifier = require('../services/huggingface/ideologyClassifier');
const hybridSearchService = require('../services/ai/hybridSearchService');
const { validate, schemas } = require('../middleware/validation');
const { sendSuccess, sendError, sendValidationError, sendUnauthorized, sendNotFound, asyncHandler } = require('../utils/responseHandlers');
const { cacheMediatorList, cacheMediatorProfile } = require('../middleware/caching');
const { invalidateMediatorCache } = require('../config/cache');

/**
 * GET /api/mediators
 * Get all mediators with optional filtering
 * Cached for 5 minutes to reduce database load (O(1) cache vs O(log n) MongoDB)
 */
router.get('/', cacheMediatorList, validate(schemas.mediatorSearch, 'query'), asyncHandler(async (req, res) => {
  const {
    practiceArea,
    location,
    ideology,
    minExperience,
    page = 1,
    limit = 20
  } = req.query;

  const query = {};

  if (practiceArea) {
    query.practiceAreas = { $in: [practiceArea] };
  }

  if (location) {
    // Escape special regex characters to prevent ReDoS attacks
    const escapedLocation = location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query['location.state'] = new RegExp(escapedLocation, 'i');
  }

  if (ideology) {
    const ideologyMap = {
      'liberal': { $lte: -1 },
      'conservative': { $gte: 1 },
      'neutral': { $gt: -1, $lt: 1 }
    };
    query.ideologyScore = ideologyMap[ideology.toLowerCase()];
  }

  if (minExperience) {
    query.yearsExperience = { $gte: parseInt(minExperience) };
  }

  const mediators = await Mediator.find(query)
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ rating: -1, yearsExperience: -1 });

  const total = await Mediator.countDocuments(query);

  sendSuccess(res, {
    mediators,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

/**
 * GET /api/mediators/:id
 * Get a single mediator by ID
 * Cached for 10 minutes
 */
router.get('/:id', cacheMediatorProfile, validate(schemas.objectId, 'params'), asyncHandler(async (req, res) => {
  const mediator = await Mediator.findById(req.params.id);

  if (!mediator) {
    return sendNotFound(res, 'Mediator');
  }

  sendSuccess(res, mediator);
}));

/**
 * POST /api/mediators/search/hybrid
 * Hybrid search: combines vector (semantic) + keyword (BM25) search
 * Formula: 0.7 * vectorScore + 0.3 * keywordScore
 */
router.post('/search/hybrid', asyncHandler(async (req, res) => {
  const {
    query,
    topK = 20,
    filters = {},
    ideologyPreference,
    ideologyBoostFactor
  } = req.body;

  if (!query) {
    return sendValidationError(res, 'Query is required');
  }

  // Perform hybrid search
  const searchOptions = {
    topK,
    filters,
    vectorTopK: topK * 2,  // Get more candidates for merging
    keywordTopK: topK * 2
  };

  let results;

  // Apply ideology boost if requested
  if (ideologyPreference && ideologyPreference !== 'neutral') {
    results = await hybridSearchService.searchWithIdeologyBoost(query, {
      ...searchOptions,
      ideologyPreference,
      ideologyBoostFactor: ideologyBoostFactor || 0.2
    });
  } else {
    results = await hybridSearchService.search(query, searchOptions);
  }

  sendSuccess(res, results);
}));

/**
 * GET /api/mediators/search/config
 * Get current hybrid search configuration
 */
router.get('/search/config', asyncHandler(async (req, res) => {
  const config = hybridSearchService.getConfig();
  sendSuccess(res, config);
}));

/**
 * POST /api/mediators
 * Create a new mediator profile
 */
router.post('/', validate(schemas.mediatorCreate, 'body'), asyncHandler(async (req, res) => {
  const mediator = new Mediator(req.body);
  mediator.calculateDataQuality();

  await mediator.save();

  // Invalidate mediator list cache
  invalidateMediatorCache();

  sendSuccess(res, mediator, 201);
}));

/**
 * PUT /api/mediators/:id
 * Update a mediator profile
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const mediator = await Mediator.findByIdAndUpdate(
    req.params.id,
    { ...req.body, lastUpdated: Date.now() },
    { new: true, runValidators: true }
  );

  if (!mediator) {
    return sendNotFound(res, 'Mediator');
  }

  mediator.calculateDataQuality();
  await mediator.save();

  // Invalidate cache for this mediator and all list queries
  invalidateMediatorCache(req.params.id);

  sendSuccess(res, mediator);
}));

/**
 * POST /api/mediators/:id/analyze-ideology
 * Trigger ideology classification for a mediator
 */
router.post('/:id/analyze-ideology', asyncHandler(async (req, res) => {
  const mediator = await Mediator.findById(req.params.id);

  if (!mediator) {
    return sendNotFound(res, 'Mediator');
  }

  const analysis = await ideologyClassifier.classifyIdeology(mediator);

  // Update mediator with analysis results
  mediator.ideologyScore = analysis.score;
  mediator.ideologyLabel = analysis.label;
  mediator.ideologyConfidence = analysis.confidence;
  mediator.ideologyAnalysis = {
    factors: analysis.factors,
    summary: analysis.summary,
    analyzedAt: new Date()
  };

  await mediator.save();

  sendSuccess(res, {
    mediator,
    analysis
  });
}));

module.exports = router;
