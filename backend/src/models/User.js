/**
 * User Model
 * Authentication and subscription management
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Validate required JWT secrets are set
if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET environment variables are required');
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
  // Role-Based Access Control
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate access token (15 minutes)
userSchema.methods.generateAccessToken = function() {
  return jwt.sign(
    {
      userId: this._id,
      email: this.email,
      subscriptionTier: this.subscriptionTier
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
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
