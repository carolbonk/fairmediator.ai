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

/**
 * POST /api/mediators/:id/check-conflicts
 * Check for conflicts between mediator and case participants
 * Uses RECAP case history + affiliation data
 * Returns: 🟢 clear / 🟡 yellow / 🔴 red risk level
 */
router.post('/:id/check-conflicts', validate(schemas.objectId, 'params'), asyncHandler(async (req, res) => {
  const { opposingCounsel, currentParty, forceRefresh = false } = req.body;

  if (!opposingCounsel) {
    return sendValidationError(res, 'opposingCounsel is required');
  }

  const conflictAnalysisService = require('../services/ai/conflictAnalysisService');

  const analysis = await conflictAnalysisService.analyzeConflicts(
    req.params.id,
    { opposingCounsel, currentParty },
    { forceRefresh }
  );

  sendSuccess(res, analysis);
}));

/**
 * DELETE /api/mediators/:id/conflict-cache
 * Clear cached conflict data for a mediator (force refresh on next check)
 */
router.delete('/:id/conflict-cache', validate(schemas.objectId, 'params'), asyncHandler(async (req, res) => {
  const conflictAnalysisService = require('../services/ai/conflictAnalysisService');

  await conflictAnalysisService.clearConflictCache(req.params.id);

  sendSuccess(res, {
    message: 'Conflict cache cleared successfully'
  });
}));

/**
 * POST /api/mediators/:id/enrich-linkedin
 * Manual LinkedIn profile enrichment (user-initiated only)
 *
 * Purpose: User pastes LinkedIn URLs to enrich conflict detection with mutual connections data
 * Combined with RECAP: Case history (worked together?) + LinkedIn (how close?)
 *
 * Request body:
 * {
 *   "mediatorLinkedInUrl": "https://linkedin.com/in/john-mediator",
 *   "opposingCounselLinkedInUrl": "https://linkedin.com/in/opposing-counsel" (optional)
 * }
 */
router.post('/:id/enrich-linkedin', validate(schemas.objectId, 'params'), asyncHandler(async (req, res) => {
  const { mediatorLinkedInUrl, opposingCounselLinkedInUrl = null } = req.body;

  if (!mediatorLinkedInUrl) {
    return sendValidationError(res, 'mediatorLinkedInUrl is required');
  }

  // Validate URLs are actually LinkedIn profiles
  if (!mediatorLinkedInUrl.includes('linkedin.com/in/')) {
    return sendValidationError(res, 'mediatorLinkedInUrl must be a valid LinkedIn profile URL (linkedin.com/in/...)');
  }

  if (opposingCounselLinkedInUrl && !opposingCounselLinkedInUrl.includes('linkedin.com/in/')) {
    return sendValidationError(res, 'opposingCounselLinkedInUrl must be a valid LinkedIn profile URL');
  }

  const mediator = await Mediator.findById(req.params.id);
  if (!mediator) {
    return sendNotFound(res, 'Mediator');
  }

  const linkedinScraper = require('../services/external/linkedinScraper');

  // Scrape LinkedIn profile
  const scrapeResult = await linkedinScraper.scrapeProfile(
    mediatorLinkedInUrl,
    opposingCounselLinkedInUrl
  );

  if (!scrapeResult.success) {
    return sendError(res, scrapeResult.error, 400);
  }

  // Update mediator with LinkedIn data
  const linkedinSource = {
    url: mediatorLinkedInUrl,
    scrapedAt: new Date(),
    sourceType: 'linkedin'
  };

  if (!mediator.sources) {
    mediator.sources = [];
  }

  // Remove old LinkedIn source if exists
  mediator.sources = mediator.sources.filter(s => s.sourceType !== 'linkedin');
  mediator.sources.push(linkedinSource);

  // Store LinkedIn enrichment data (including mutual connections if available)
  if (!mediator.linkedinEnrichment) {
    mediator.linkedinEnrichment = {};
  }

  mediator.linkedinEnrichment = {
    profileData: scrapeResult.data,
    opposingCounsel: opposingCounselLinkedInUrl ? 'provided' : null,
    mutualConnectionsCount: scrapeResult.data.mutualConnections?.count || null,
    checkedAt: new Date(),
    scrapedBy: 'manual_user_input'
  };

  await mediator.save();

  // Clear conflict cache to trigger fresh analysis with LinkedIn data
  const conflictAnalysisService = require('../services/ai/conflictAnalysisService');
  await conflictAnalysisService.clearConflictCache(req.params.id);

  sendSuccess(res, {
    message: 'LinkedIn profile enrichment successful',
    data: scrapeResult.data,
    note: 'Conflict cache cleared - next conflict check will include LinkedIn data'
  });
}));

/**
 * POST /api/mediators/:id/conflict-feedback
 * Submit user feedback on conflict analysis accuracy (Active Learning - Phase 1)
 *
 * Purpose: Collect human feedback to improve conflict detection models
 *
 * Request body:
 * {
 *   "conflictAnalysis": { ... }, // The analysis that was shown to user
 *   "userFeedback": {
 *     "wasAccurate": true/false,
 *     "actualRiskLevel": "low/medium/high/none",
 *     "comments": "Optional user comments",
 *     "selectedMediator": true/false // Did user select this mediator despite warning?
 *   },
 *   "caseContext": {
 *     "opposingCounsel": "...",
 *     "currentParty": "...",
 *     "caseType": "..."
 *   }
 * }
 */
router.post('/:id/conflict-feedback', validate(schemas.objectId, 'params'), asyncHandler(async (req, res) => {
  const ConflictFeedback = require('../models/ConflictFeedback');
  const { conflictAnalysis, userFeedback, caseContext } = req.body;

  if (!conflictAnalysis || !userFeedback) {
    return sendValidationError(res, 'conflictAnalysis and userFeedback are required');
  }

  const mediator = await Mediator.findById(req.params.id);
  if (!mediator) {
    return sendNotFound(res, 'Mediator');
  }

  // Map risk level from our system (clear/yellow/red) to feedback schema (low/medium/high/none)
  const riskLevelMapping = {
    'clear': 'low',
    'yellow': 'medium',
    'red': 'high'
  };

  // Create feedback record for active learning
  const feedback = new ConflictFeedback({
    mediatorId: req.params.id,
    parties: caseContext?.opposingCounsel ? [caseContext.opposingCounsel] : [],
    caseType: caseContext?.caseType || 'other',

    // AI prediction (what we showed the user)
    prediction: {
      hasConflict: conflictAnalysis.riskLevel !== 'clear',
      riskLevel: riskLevelMapping[conflictAnalysis.riskLevel] || 'unknown',
      confidence: conflictAnalysis.overallConfidence || 0,
      detectedConflicts: conflictAnalysis.reasons?.map(r => ({
        entity: caseContext?.opposingCounsel || 'unknown',
        relationship: r.type,
        source: r.source,
        confidence: r.confidence
      })) || [],
      modelVersion: 'v1.0-recap-linkedin',
      timestamp: new Date()
    },

    // Human feedback (ground truth)
    feedback: {
      hasConflict: !userFeedback.wasAccurate ? !conflictAnalysis.riskLevel === 'clear' : conflictAnalysis.riskLevel !== 'clear',
      actualRiskLevel: userFeedback.actualRiskLevel,
      notes: userFeedback.comments,
      confidence: userFeedback.wasAccurate ? 1.0 : 0.7 // High confidence if user agrees
    },

    // Metadata
    reviewedBy: {
      userId: req.user?._id,
      role: 'user'
    },

    queryText: `Conflict check for ${caseContext?.opposingCounsel || 'unknown party'}`,
    source: 'api',
    status: 'reviewed', // User feedback is immediately "reviewed"
    tags: [
      userFeedback.selectedMediator ? 'selected_despite_warning' : 'not_selected',
      conflictAnalysis.dataCompleteness?.overall || 'unknown_completeness'
    ]
  });

  await feedback.save();

  logger.info('Conflict feedback received', {
    mediatorId: req.params.id,
    wasAccurate: userFeedback.wasAccurate,
    selectedMediator: userFeedback.selectedMediator,
    feedbackId: feedback._id
  });

  sendSuccess(res, {
    message: 'Thank you for your feedback! This helps improve our conflict detection.',
    feedbackId: feedback._id,
    contributedToLearning: feedback.isHighValue
  });
}));

/**
 * GET /api/mediators/:id/conflict-feedback
 * Get feedback history for a specific mediator (admin only)
 */
router.get('/:id/conflict-feedback', validate(schemas.objectId, 'params'), asyncHandler(async (req, res) => {
  const ConflictFeedback = require('../models/ConflictFeedback');

  const feedbackHistory = await ConflictFeedback.find({
    mediatorId: req.params.id,
    status: 'reviewed'
  })
  .sort({ createdAt: -1 })
  .limit(50)
  .select('prediction feedback createdAt isCorrectPrediction predictionError');

  const stats = {
    totalFeedback: feedbackHistory.length,
    correctPredictions: feedbackHistory.filter(f => f.isCorrectPrediction).length,
    falsePositives: feedbackHistory.filter(f => f.predictionError === 'false_positive').length,
    falseNegatives: feedbackHistory.filter(f => f.predictionError === 'false_negative').length
  };

  sendSuccess(res, {
    feedbackHistory,
    stats
  });
}));

/**
 * GET /api/conflict-feedback/stats
 * Get overall conflict feedback statistics (admin only)
 * Shows how well our conflict detection is performing
 */
router.get('/conflict-feedback/stats', asyncHandler(async (req, res) => {
  const ConflictFeedback = require('../models/ConflictFeedback');

  const metrics = await ConflictFeedback.getPerformanceMetrics();
  const pendingReviews = await ConflictFeedback.getPendingReviews(10);

  sendSuccess(res, {
    performance: metrics,
    pendingReviews: pendingReviews.length,
    message: `F1 Score: ${metrics.f1Score}% - ${metrics.f1Score >= 75 ? 'Model performing well ✅' : 'Model needs improvement ⚠️'}`
  });
}));

/**
 * POST /api/mediators/:id/track-selection
 * Track user decision/selection (Active Learning - Phase 1)
 *
 * Purpose: Build collaborative filtering dataset - "Users like you also selected..."
 *
 * Request body:
 * {
 *   "action": "viewed/clicked/contacted/scheduled_call/hired",
 *   "caseContext": {
 *     "caseType": "employment/business/family/...",
 *     "jurisdiction": { "state": "FL", "city": "Miami" },
 *     "parties": ["PartyA", "PartyB"],
 *     "userQuery": "mediator for tech startup dispute"
 *   },
 *   "selectionReason": {
 *     "ideology": true,
 *     "experience": true,
 *     "location": false,
 *     "practiceArea": true
 *   },
 *   "conflictWarning": {
 *     "shown": true,
 *     "riskLevel": "yellow/red",
 *     "selectedAnyway": true // Did user proceed despite warning?
 *   }
 * }
 */
router.post('/:id/track-selection', validate(schemas.objectId, 'params'), asyncHandler(async (req, res) => {
  const MediatorSelection = require('../models/MediatorSelection');
  const { action, caseContext, selectionReason, conflictWarning } = req.body;

  if (!action) {
    return sendValidationError(res, 'action is required (viewed/clicked/contacted/scheduled_call/hired)');
  }

  const mediator = await Mediator.findById(req.params.id);
  if (!mediator) {
    return sendNotFound(res, 'Mediator');
  }

  // Track the selection for collaborative filtering
  const selection = new MediatorSelection({
    userId: req.user?._id,
    mediatorId: req.params.id,
    caseType: caseContext?.caseType || 'other',
    jurisdiction: caseContext?.jurisdiction,
    partiesInvolved: caseContext?.parties || [],
    action,
    selectionReason,
    userQuery: caseContext?.userQuery,
    aiRecommendation: conflictWarning?.shown ? `Conflict warning (${conflictWarning.riskLevel}) - ${conflictWarning.selectedAnyway ? 'proceeded anyway' : 'not selected'}` : 'No conflict detected'
  });

  await selection.save();

  // Update mediator's total mediations count if hired
  if (action === 'hired') {
    mediator.totalMediations = (mediator.totalMediations || 0) + 1;
    await mediator.save();
  }

  logger.info('User selection tracked', {
    mediatorId: req.params.id,
    action,
    userId: req.user?._id,
    conflictWarning: conflictWarning?.shown || false
  });

  sendSuccess(res, {
    message: 'Selection tracked successfully',
    selectionId: selection._id,
    contributesToRecommendations: true
  });
}));

module.exports = router;
