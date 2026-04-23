/**
 * B2B Public API v1
 * Authenticated via X-API-Key header (not cookies).
 * CSRF-exempt — API keys are bearer tokens, not session cookies.
 *
 * GET  /api/v1/mediators           — search/list mediators
 * GET  /api/v1/mediators/:id       — get mediator detail
 * POST /api/v1/conflict-check      — check parties for conflicts
 */

const express = require('express');
const router = express.Router();
const Mediator = require('../models/Mediator');
const { apiKeyAuth } = require('../middleware/apiKeyAuth');
const { escapeRegex } = require('../utils/sanitization');
const { asyncHandler, sendSuccess, sendError } = require('../utils/responseHandlers');
const logger = require('../config/logger');

// All v1 routes require a valid API key
router.use(apiKeyAuth);

/**
 * GET /api/v1/mediators
 * Search and list mediators.
 *
 * Query params:
 *   q          — keyword search (name, firm, specialization)
 *   state      — filter by US state code (e.g. CA, NY)
 *   city       — filter by city (partial match)
 *   minScore   — minimum ideology score (0-10)
 *   maxScore   — maximum ideology score (0-10)
 *   verified   — "true" to return only verified mediators
 *   page       — page number (default 1)
 *   limit      — results per page (max 50, default 20)
 */
router.get('/mediators', asyncHandler(async (req, res) => {
  const {
    q,
    state,
    city,
    minScore,
    maxScore,
    verified,
    page = 1,
    limit = 20
  } = req.query;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  const filter = { isActive: true };

  // Keyword search
  if (typeof q === 'string' && q) {
    const safe = escapeRegex(q.slice(0, 100));
    const re = new RegExp(safe, 'i');
    filter.$or = [
      { name: re },
      { lawFirm: re },
      { specializations: re },
      { bio: re }
    ];
  }

  if (state) filter['location.state'] = state.toUpperCase().slice(0, 2);
  if (typeof city === 'string' && city) {
    filter['location.city'] = new RegExp(escapeRegex(city.slice(0, 50)), 'i');
  }
  if (verified === 'true') filter.isVerified = true;
  if (minScore !== undefined) filter.ideologyScore = { ...filter.ideologyScore, $gte: parseFloat(minScore) };
  if (maxScore !== undefined) filter.ideologyScore = { ...filter.ideologyScore, $lte: parseFloat(maxScore) };

  const [mediators, total] = await Promise.all([
    Mediator.find(filter)
      .select('name email lawFirm location specializations yearsExperience ideologyScore certifications isVerified bio')
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Mediator.countDocuments(filter)
  ]);

  logger.info('[PublicAPI] mediators search', {
    userId: req.user._id,
    keyId: req.apiKey._id,
    q, state, city, total
  });

  sendSuccess(res, {
    mediators,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
}));

/**
 * GET /api/v1/mediators/:id
 * Get a single mediator by ID.
 * Returns full profile (excluding internal fields).
 */
router.get('/mediators/:id', asyncHandler(async (req, res) => {
  const mediator = await Mediator.findOne({ _id: req.params.id, isActive: true })
    .select('-__v -embeddingVector')
    .lean();

  if (!mediator) return sendError(res, 404, 'Mediator not found');

  logger.info('[PublicAPI] mediator detail', {
    userId: req.user._id,
    keyId: req.apiKey._id,
    mediatorId: req.params.id
  });

  sendSuccess(res, { mediator });
}));

/**
 * POST /api/v1/conflict-check
 * Check a list of party names against mediator affiliations.
 *
 * Body: {
 *   mediatorId: string,
 *   parties: string[]   — names to check (max 20)
 * }
 *
 * Returns conflict flags with severity (HIGH / MEDIUM / LOW / NONE).
 */
router.post('/conflict-check', asyncHandler(async (req, res) => {
  const { mediatorId, parties } = req.body;

  if (!mediatorId) return sendError(res, 400, 'mediatorId is required');
  if (!Array.isArray(parties) || parties.length === 0) {
    return sendError(res, 400, 'parties must be a non-empty array of strings');
  }
  if (parties.length > 20) return sendError(res, 400, 'Maximum 20 parties per request');

  const mediator = await Mediator.findOne({ _id: mediatorId, isActive: true })
    .select('name lawFirm politicalAffiliations donorHistory publicStatements conflictFlags')
    .lean();

  if (!mediator) return sendError(res, 404, 'Mediator not found');

  // Simple rule-based conflict detection (no scraping on API calls)
  const affiliationText = [
    mediator.lawFirm,
    ...(mediator.politicalAffiliations || []),
    ...(mediator.publicStatements || []).map(s => s.text || s)
  ].join(' ').toLowerCase();

  const results = parties.map(party => {
    const partyLower = (party || '').toLowerCase().trim();
    if (!partyLower) return { party, severity: 'NONE', matches: [] };

    const matches = [];

    // Direct name mention in affiliations
    if (affiliationText.includes(partyLower)) {
      matches.push({ type: 'affiliation_mention', field: 'affiliations' });
    }

    // Donor history match
    const donorMatch = (mediator.donorHistory || []).find(
      d => (d.recipient || '').toLowerCase().includes(partyLower) ||
           (d.organization || '').toLowerCase().includes(partyLower)
    );
    if (donorMatch) matches.push({ type: 'donor_match', field: 'donorHistory', detail: donorMatch.recipient });

    // Conflict flags
    const flagMatch = (mediator.conflictFlags || []).find(
      f => (f.description || '').toLowerCase().includes(partyLower)
    );
    if (flagMatch) matches.push({ type: 'conflict_flag', field: 'conflictFlags', detail: flagMatch.description });

    const severity = matches.length === 0 ? 'NONE'
      : matches.some(m => m.type === 'conflict_flag') ? 'HIGH'
      : matches.some(m => m.type === 'donor_match') ? 'MEDIUM'
      : 'LOW';

    return { party, severity, matches };
  });

  const summary = {
    total: results.length,
    HIGH: results.filter(r => r.severity === 'HIGH').length,
    MEDIUM: results.filter(r => r.severity === 'MEDIUM').length,
    LOW: results.filter(r => r.severity === 'LOW').length,
    NONE: results.filter(r => r.severity === 'NONE').length
  };

  logger.info('[PublicAPI] conflict-check', {
    userId: req.user._id,
    keyId: req.apiKey._id,
    mediatorId,
    partiesCount: parties.length,
    flagged: summary.HIGH + summary.MEDIUM
  });

  sendSuccess(res, {
    mediator: { id: mediator._id, name: mediator.name },
    results,
    summary
  });
}));

module.exports = router;
