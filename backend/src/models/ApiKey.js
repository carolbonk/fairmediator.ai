/**
 * ApiKey Model
 * Stores hashed API keys for B2B access.
 * The raw key is shown ONCE at creation and never stored.
 */

const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 64
  },
  // SHA-256 hash of the raw key — never store raw
  keyHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // First 12 chars of raw key for display (safe, not enough to reconstruct)
  prefix: {
    type: String,
    required: true
  },
  tier: {
    type: String,
    enum: ['free', 'pro'],
    default: 'free'
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  expiresAt: {
    type: Date,
    default: null // null = no expiry
  },
  // Sliding-window rate limit counter (resets hourly)
  requestsThisWindow: {
    type: Number,
    default: 0
  },
  windowStart: {
    type: Date,
    default: Date.now
  },
  // Lifetime stats
  totalRequests: {
    type: Number,
    default: 0
  },
  lastUsedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Max requests per hour by tier
apiKeySchema.statics.RATE_LIMITS = {
  free: 100,
  pro: 1000
};

/**
 * Check and increment rate limit for this key.
 * Resets window if > 1 hour has passed.
 * Returns { allowed: boolean, remaining: number, resetAt: Date }
 */
apiKeySchema.methods.checkRateLimit = async function () {
  const now = new Date();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const max = apiKeySchema.statics.RATE_LIMITS[this.tier] || 100;

  // Reset window if expired
  if (!this.windowStart || now - this.windowStart >= windowMs) {
    this.requestsThisWindow = 0;
    this.windowStart = now;
  }

  const resetAt = new Date(this.windowStart.getTime() + windowMs);

  if (this.requestsThisWindow >= max) {
    return { allowed: false, remaining: 0, resetAt, limit: max };
  }

  this.requestsThisWindow += 1;
  this.totalRequests += 1;
  this.lastUsedAt = now;
  await this.save();

  return {
    allowed: true,
    remaining: max - this.requestsThisWindow,
    resetAt,
    limit: max
  };
};

module.exports = mongoose.model('ApiKey', apiKeySchema);
