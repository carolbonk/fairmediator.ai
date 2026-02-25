/**
 * API Key Authentication Middleware
 * Validates X-API-Key header, enforces per-key rate limits.
 * Used exclusively on /api/v1/* (B2B public API).
 */

const crypto = require('crypto');
const ApiKey = require('../models/ApiKey');
const User = require('../models/User');
const logger = require('../config/logger');

/**
 * Authenticate request via API key.
 * Attaches req.apiKey and req.user on success.
 */
const apiKeyAuth = async (req, res, next) => {
  const rawKey = req.headers['x-api-key'];

  if (!rawKey) {
    return res.status(401).json({
      success: false,
      error: 'Missing API key. Include X-API-Key header.'
    });
  }

  // Constant-time hash lookup (prevents timing attacks)
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  let apiKey;
  try {
    apiKey = await ApiKey.findOne({ keyHash, isActive: true });
  } catch (err) {
    logger.error('[ApiKeyAuth] DB lookup failed', { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }

  if (!apiKey) {
    logger.security.suspicious('INVALID_API_KEY', null, { ip: req.ip, prefix: rawKey.slice(0, 12) });
    return res.status(401).json({ success: false, error: 'Invalid or revoked API key' });
  }

  // Check expiry
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return res.status(401).json({ success: false, error: 'API key has expired' });
  }

  // Check rate limit
  const rateResult = await apiKey.checkRateLimit();
  res.set({
    'X-RateLimit-Limit': rateResult.limit,
    'X-RateLimit-Remaining': rateResult.remaining,
    'X-RateLimit-Reset': Math.floor(rateResult.resetAt.getTime() / 1000)
  });

  if (!rateResult.allowed) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      resetAt: rateResult.resetAt
    });
  }

  // Load user
  let user;
  try {
    user = await User.findById(apiKey.userId);
  } catch (err) {
    logger.error('[ApiKeyAuth] User lookup failed', { error: err.message });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }

  if (!user) {
    return res.status(401).json({ success: false, error: 'API key owner not found' });
  }

  req.apiKey = apiKey;
  req.user = user;
  next();
};

module.exports = { apiKeyAuth };
