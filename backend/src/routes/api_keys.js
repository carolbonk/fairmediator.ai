/**
 * API Key Management Routes
 * Authenticated users create and revoke their own API keys.
 *
 * POST   /api/keys        — generate a new key (raw shown once)
 * DELETE /api/keys/:id    — revoke a key
 *
 * The list endpoint was intentionally removed to keep the surface minimal:
 * the raw key is only ever shown once at creation, and revocation is the
 * security-critical operation worth keeping. Key metadata (prefix, usage)
 * can be surfaced later via the monitoring/dashboard API if needed.
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
