const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Don't include password in queries by default
    },
    name: {
      type: String,
      trim: true,
    },
    // Subscription information
    subscriptionTier: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free',
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'cancelled', 'expired', 'trial'],
      default: 'active',
    },
    subscriptionStartDate: {
      type: Date,
    },
    subscriptionEndDate: {
      type: Date,
    },
    stripeCustomerId: {
      type: String,
    },
    stripeSubscriptionId: {
      type: String,
    },
    // Usage tracking (reset daily)
    usageStats: {
      searchesToday: {
        type: Number,
        default: 0,
      },
      profileViewsToday: {
        type: Number,
        default: 0,
      },
      aiCallsToday: {
        type: Number,
        default: 0,
      },
      lastResetDate: {
        type: Date,
        default: Date.now,
      },
    },
    // User preferences
    preferences: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      savedSearchAlerts: {
        type: Boolean,
        default: false,
      },
    },
    // Authentication
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    lastLoginAt: {
      type: Date,
    },
    loginCount: {
      type: Number,
      default: 0,
    },
    // Analytics tracking IDs
    posthogDistinctId: {
      type: String,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ subscriptionTier: 1 });
userSchema.index({ subscriptionStatus: 1 });
userSchema.index({ 'usageStats.lastResetDate': 1 });

// Virtual for checking if usage should be reset
userSchema.virtual('shouldResetUsage').get(function () {
  const now = new Date();
  const lastReset = this.usageStats.lastResetDate;

  // Check if it's a new day (UTC)
  return (
    now.getUTCDate() !== lastReset.getUTCDate() ||
    now.getUTCMonth() !== lastReset.getUTCMonth() ||
    now.getUTCFullYear() !== lastReset.getUTCFullYear()
  );
});

// Virtual for checking if subscription is active
userSchema.virtual('isSubscriptionActive').get(function () {
  if (this.subscriptionTier === 'free') return true;
  if (this.subscriptionStatus !== 'active') return false;
  if (this.subscriptionEndDate && this.subscriptionEndDate < new Date()) return false;
  return true;
});

// Method to check if user has reached daily limit
userSchema.methods.hasReachedSearchLimit = function () {
  if (this.subscriptionTier === 'premium') return false; // No limit for premium
  return this.usageStats.searchesToday >= 5; // Free tier limit
};

userSchema.methods.hasReachedProfileViewLimit = function () {
  if (this.subscriptionTier === 'premium') return false;
  return this.usageStats.profileViewsToday >= 10;
};

userSchema.methods.hasReachedAICallLimit = function () {
  if (this.subscriptionTier === 'premium') return false;
  return this.usageStats.aiCallsToday >= 20;
};

// Method to increment usage
userSchema.methods.incrementSearch = async function () {
  // Reset if needed
  if (this.shouldResetUsage) {
    this.usageStats.searchesToday = 0;
    this.usageStats.profileViewsToday = 0;
    this.usageStats.aiCallsToday = 0;
    this.usageStats.lastResetDate = new Date();
  }

  this.usageStats.searchesToday += 1;
  await this.save();
};

userSchema.methods.incrementProfileView = async function () {
  if (this.shouldResetUsage) {
    this.usageStats.searchesToday = 0;
    this.usageStats.profileViewsToday = 0;
    this.usageStats.aiCallsToday = 0;
    this.usageStats.lastResetDate = new Date();
  }

  this.usageStats.profileViewsToday += 1;
  await this.save();
};

userSchema.methods.incrementAICall = async function () {
  if (this.shouldResetUsage) {
    this.usageStats.searchesToday = 0;
    this.usageStats.profileViewsToday = 0;
    this.usageStats.aiCallsToday = 0;
    this.usageStats.lastResetDate = new Date();
  }

  this.usageStats.aiCallsToday += 1;
  await this.save();
};

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('passwordHash')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to generate password reset token
userSchema.methods.createPasswordResetToken = function () {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 3600000; // 1 hour

  return resetToken;
};

// Method to sanitize user object (remove sensitive fields)
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.emailVerificationToken;
  return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
