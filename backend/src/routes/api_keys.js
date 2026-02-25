/**
 * API Key Management Routes
 * Authenticated users create, list, and revoke their own API keys.
 *
 * POST   /api/keys        — generate a new key (raw shown once)
 * GET    /api/keys        — list user's keys (prefix + stats only)
 * DELETE /api/keys/:id    — revoke a key
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const ApiKey = require('../models/ApiKey');
const { authenticate } = require('../middleware/auth');
const { asyncHandler, sendSuccess, sendError, sendNotFound } = require('../utils/responseHandlers');
const logger = require('../config/logger');

const MAX_KEYS_PER_USER = 5;

/**
 * POST /api/keys
 * Generate a new API key for the authenticated user.
 * Returns the raw key ONCE — it is never retrievable again.
 */
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return sendError(res, 400, 'Key name is required');
  }

  // Enforce max keys per user
  const existing = await ApiKey.countDocuments({ userId: req.user._id, isActive: true });
  if (existing >= MAX_KEYS_PER_USER) {
    return sendError(res, 400, `Maximum of ${MAX_KEYS_PER_USER} active API keys allowed`);
  }

  // Generate key: fm_live_ + 32 random hex chars
  const rawKey = 'fm_live_' + crypto.randomBytes(16).toString('hex');
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const prefix = rawKey.slice(0, 15) + '...'; // safe display prefix

  const apiKey = await ApiKey.create({
    userId: req.user._id,
    name: name.trim(),
    keyHash,
    prefix,
    tier: req.user.subscriptionTier === 'premium' ? 'pro' : 'free'
  });

  logger.info('[ApiKeys] Key created', { userId: req.user._id, keyId: apiKey._id, tier: apiKey.tier });

  sendSuccess(res, {
    id: apiKey._id,
    name: apiKey.name,
    key: rawKey,  // Only time this is ever returned
    prefix: apiKey.prefix,
    tier: apiKey.tier,
    rateLimit: ApiKey.RATE_LIMITS[apiKey.tier],
    createdAt: apiKey.createdAt,
    warning: 'Save this key now — it will never be shown again.'
  }, 201, 'API key created');
}));

/**
 * GET /api/keys
 * List all API keys for the authenticated user.
 * Never returns the raw key or hash — prefix + stats only.
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const keys = await ApiKey.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .select('-keyHash')
    .lean();

  sendSuccess(res, {
    keys: keys.map(k => ({
      id: k._id,
      name: k.name,
      prefix: k.prefix,
      tier: k.tier,
      isActive: k.isActive,
      rateLimit: ApiKey.RATE_LIMITS[k.tier],
      totalRequests: k.totalRequests,
      lastUsedAt: k.lastUsedAt,
      expiresAt: k.expiresAt,
      createdAt: k.createdAt
    }))
  });
}));

/**
 * DELETE /api/keys/:id
 * Revoke (soft-delete) an API key. Only the owner can revoke their own keys.
 */
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const key = await ApiKey.findOne({ _id: req.params.id, userId: req.user._id });

  if (!key) return sendNotFound(res, 'API key');

  key.isActive = false;
  await key.save();

  logger.info('[ApiKeys] Key revoked', { userId: req.user._id, keyId: key._id });

  sendSuccess(res, { id: key._id }, 200, 'API key revoked');
}));

module.exports = router;
