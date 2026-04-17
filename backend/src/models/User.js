/**
 * User Model
 * Authentication and subscription management
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Validate required JWT secrets are set
if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET || !process.env.JWT_ROLE_SECRET) {
  throw new Error('JWT_SECRET, JWT_REFRESH_SECRET, and JWT_ROLE_SECRET environment variables are required');
}

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  // Account security
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  accountLockedUntil: {
    type: Date,
    default: null
  },
  lastFailedLoginAt: Date,
  lastSuccessfulLoginAt: Date,
  // Account Type Classification (mediator, attorney, or party)
  accountType: {
    type: String,
    enum: ['mediator', 'attorney', 'party'],
    required: true
  },
  // Role-Based Access Control (permissions)
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  },
  permissions: [{
    type: String,
    enum: [
      'read:mediators',
      'write:mediators',
      'delete:mediators',
      'manage:users',
      'manage:subscriptions',
      'access:admin',
      'scrape:data'
    ]
  }],
  subscriptionTier: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free'
  },
  stripeCustomerId: String,
  // Usage stats (reset daily at UTC midnight)
  usageStats: {
    searchesToday: {
      type: Number,
      default: 0
    },
    profileViewsToday: {
      type: Number,
      default: 0
    },
    aiCallsToday: {
      type: Number,
      default: 0
    },
    lastReset: {
      type: Date,
      default: () => new Date()
    }
  },
  refreshTokens: [{
    token: String,
    expiresAt: Date,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for performance (O(log n) query complexity)
userSchema.index({ emailVerificationToken: 1 }, { sparse: true }); // Sparse index for email verification lookups
userSchema.index({ passwordResetToken: 1 }, { sparse: true }); // Sparse index for password reset lookups
userSchema.index({ subscriptionTier: 1 }); // For free tier filtering
userSchema.index({ accountLockedUntil: 1 }, { sparse: true }); // For checking locked accounts
userSchema.index({ accountType: 1 }); // For filtering by user type (mediator/attorney/party)
userSchema.index({ accountType: 1, subscriptionTier: 1 }); // Compound index for common queries

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Role permissions mapping
const ROLE_PERMISSIONS = {
  mediator: [
    'mediator.profile.read',
    'mediator.profile.write',
    'mediator.earnings.read',
    'mediator.analytics.read',
    'mediator.services.write',
    'mediator.cases.read',
    'common.messaging'
  ],
  attorney: [
    'attorney.cases.write',
    'attorney.mediators.search',
    'attorney.mediators.bookmark',
    'attorney.reports.generate',
    'attorney.analytics.read',
    'attorney.firm.read',
    'common.messaging'
  ],
  party: [
    'party.case.read',
    'party.documents.write',
    'party.odr.join',
    'party.mediator.view'
  ],
  admin: ['*'] // All permissions
};

// Generate session fingerprint for token binding
const generateSessionFingerprint = (userId, role) => {
  const timestamp = Date.now();
  const data = `${userId}:${role}:${timestamp}:${process.env.JWT_ROLE_SECRET}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
};

// Generate role-specific access token (2 hours)
userSchema.methods.generateAccessToken = function() {
  const role = this.accountType || this.role || 'guest';

  // Create role-specific claims
  const claims = {
    userId: this._id,
    email: this.email,
    role,
    permissions: ROLE_PERMISSIONS[role] || [],
    tier: this.subscriptionTier || 'free',
    // Add role-specific namespace to prevent cross-role token usage
    namespace: `fairmediator:${role}`,
    // Add session fingerprint for additional security
    fingerprint: generateSessionFingerprint(this._id, role)
  };

  // Sign with combined secret for role isolation
  const roleSecret = `${process.env.JWT_SECRET}:${process.env.JWT_ROLE_SECRET}:${role}`;

  return jwt.sign(claims, roleSecret, {
    expiresIn: '2h', // Longer than original 15m for better UX
    issuer: 'fairmediator',
    audience: `fairmediator-${role}`,
    subject: this._id.toString()
  });
};

// Generate refresh token (30 days)
userSchema.methods.generateRefreshToken = function() {
  const token = jwt.sign(
    { userId: this._id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );

  // Store refresh token
  this.refreshTokens.push({
    token,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });

  // Clean up expired tokens
  this.refreshTokens = this.refreshTokens.filter(rt => rt.expiresAt > new Date());

  return token;
};

// Reset daily usage stats
userSchema.methods.resetDailyUsage = function() {
  const now = new Date();
  const lastReset = this.usageStats.lastReset;

  // Check if we need to reset (new UTC day)
  if (lastReset.getUTCDate() !== now.getUTCDate() ||
      lastReset.getUTCMonth() !== now.getUTCMonth() ||
      lastReset.getUTCFullYear() !== now.getUTCFullYear()) {
    this.usageStats.searchesToday = 0;
    this.usageStats.profileViewsToday = 0;
    this.usageStats.aiCallsToday = 0;
    this.usageStats.lastReset = now;
  }
};

// Check if user can perform action
userSchema.methods.canPerformAction = function(actionType) {
  if (this.subscriptionTier === 'premium') return true;

  this.resetDailyUsage();

  const limits = {
    search: 5,
    profileView: 10,
    aiCall: 20
  };

  const current = {
    search: this.usageStats.searchesToday,
    profileView: this.usageStats.profileViewsToday,
    aiCall: this.usageStats.aiCallsToday
  };

  return current[actionType] < limits[actionType];
};

// Increment usage counter
userSchema.methods.incrementUsage = async function(actionType) {
  this.resetDailyUsage();

  const field = actionType + 'sToday';
  this.usageStats[field]++;

  await this.save();
};

// Check if account is locked
userSchema.methods.isAccountLocked = function() {
  if (!this.accountLockedUntil) return false;

  // Check if lock period has expired
  if (this.accountLockedUntil > new Date()) {
    return true;
  }

  // Lock expired, reset counters
  this.failedLoginAttempts = 0;
  this.accountLockedUntil = null;
  return false;
};

// Increment failed login attempts and lock if necessary
userSchema.methods.incrementFailedAttempts = async function() {
  this.failedLoginAttempts += 1;
  this.lastFailedLoginAt = new Date();

  // Lock account after 5 failed attempts
  const MAX_ATTEMPTS = 5;
  const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  if (this.failedLoginAttempts >= MAX_ATTEMPTS) {
    this.accountLockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
  }

  await this.save();
};

// Reset failed login attempts on successful login
userSchema.methods.resetFailedAttempts = async function() {
  this.failedLoginAttempts = 0;
  this.accountLockedUntil = null;
  this.lastSuccessfulLoginAt = new Date();
  await this.save();
};

// Alias methods for compatibility
userSchema.methods.incrementSearch = async function() {
  return this.incrementUsage('search');
};

userSchema.methods.incrementProfileView = async function() {
  return this.incrementUsage('profileView');
};

userSchema.methods.incrementAiCall = async function() {
  return this.incrementUsage('aiCall');
};

// Check premium status
userSchema.virtual('isPremium').get(function() {
  return this.subscriptionTier === 'premium';
});

module.exports = mongoose.model('User', userSchema);
