const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tier: {
      type: String,
      enum: ['free', 'premium', 'enterprise'],
      required: true,
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired', 'trial', 'past_due', 'paused'],
      required: true,
      default: 'active',
    },
    // Billing information
    billingCycle: {
      type: String,
      enum: ['monthly', 'annual'],
    },
    amount: {
      type: Number, // In cents (e.g., 1999 for $19.99)
    },
    currency: {
      type: String,
      default: 'USD',
    },
    // Stripe integration
    stripeCustomerId: {
      type: String,
    },
    stripeSubscriptionId: {
      type: String,
      unique: true,
      sparse: true, // Allow null values for free tier
    },
    stripePriceId: {
      type: String,
    },
    stripeProductId: {
      type: String,
    },
    // Subscription periods
    currentPeriodStart: {
      type: Date,
    },
    currentPeriodEnd: {
      type: Date,
    },
    cancelAt: {
      type: Date, // If user schedules cancellation
    },
    canceledAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    trialStart: {
      type: Date,
    },
    trialEnd: {
      type: Date,
    },
    // Billing history
    lastPaymentDate: {
      type: Date,
    },
    lastPaymentAmount: {
      type: Number,
    },
    lastPaymentStatus: {
      type: String,
      enum: ['succeeded', 'pending', 'failed'],
    },
    nextBillingDate: {
      type: Date,
    },
    // Cancellation details
    cancellationReason: {
      type: String,
      enum: [
        'too_expensive',
        'missing_features',
        'switching_provider',
        'no_longer_needed',
        'other',
      ],
    },
    cancellationFeedback: {
      type: String,
    },
    // Upgrade/downgrade history
    previousTier: {
      type: String,
      enum: ['free', 'premium', 'enterprise'],
    },
    tierChangeDate: {
      type: Date,
    },
    // Feature flags (for gradual rollout)
    featureFlags: {
      chatHistory: {
        type: Boolean,
        default: false,
      },
      advancedFilters: {
        type: Boolean,
        default: false,
      },
      exportData: {
        type: Boolean,
        default: false,
      },
      savedSearches: {
        type: Boolean,
        default: false,
      },
      emailAlerts: {
        type: Boolean,
        default: false,
      },
      apiAccess: {
        type: Boolean,
        default: false,
      },
    },
    // Usage limits (for custom plans)
    limits: {
      dailySearches: {
        type: Number,
        default: null, // null = unlimited
      },
      dailyProfileViews: {
        type: Number,
        default: null,
      },
      dailyAICalls: {
        type: Number,
        default: null,
      },
      savedSearches: {
        type: Number,
        default: null,
      },
      teamMembers: {
        type: Number,
        default: 1,
      },
    },
    // Metadata
    metadata: {
      source: {
        type: String, // e.g., 'web', 'mobile', 'api'
      },
      referralCode: {
        type: String,
      },
      promotionCode: {
        type: String,
      },
      couponId: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
subscriptionSchema.index({ user: 1 });
subscriptionSchema.index({ tier: 1, status: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });

// Virtual for checking if subscription is in trial
subscriptionSchema.virtual('isInTrial').get(function () {
  if (!this.trialStart || !this.trialEnd) return false;
  const now = new Date();
  return now >= this.trialStart && now <= this.trialEnd;
});

// Virtual for days remaining
subscriptionSchema.virtual('daysRemaining').get(function () {
  if (!this.currentPeriodEnd) return null;
  const now = new Date();
  const diff = this.currentPeriodEnd - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Virtual for checking if subscription will auto-renew
subscriptionSchema.virtual('willAutoRenew').get(function () {
  return this.status === 'active' && !this.cancelAt;
});

// Method to check if user has access to a feature
subscriptionSchema.methods.hasFeatureAccess = function (featureName) {
  // Premium and enterprise have access to all features by default
  if (this.tier === 'premium' || this.tier === 'enterprise') {
    return true;
  }

  // Check feature flags for custom access
  return this.featureFlags[featureName] || false;
};

// Method to upgrade subscription
subscriptionSchema.methods.upgrade = async function (newTier, stripeSubscriptionId) {
  this.previousTier = this.tier;
  this.tier = newTier;
  this.tierChangeDate = new Date();
  this.stripeSubscriptionId = stripeSubscriptionId;
  this.status = 'active';

  // Enable all features for premium
  if (newTier === 'premium' || newTier === 'enterprise') {
    this.featureFlags.chatHistory = true;
    this.featureFlags.advancedFilters = true;
    this.featureFlags.exportData = true;
    this.featureFlags.savedSearches = true;
    this.featureFlags.emailAlerts = true;
  }

  await this.save();
};

// Method to cancel subscription
subscriptionSchema.methods.cancel = async function (reason, feedback) {
  this.status = 'cancelled';
  this.canceledAt = new Date();
  this.cancellationReason = reason;
  this.cancellationFeedback = feedback;

  // Schedule downgrade at period end
  if (this.currentPeriodEnd && this.currentPeriodEnd > new Date()) {
    this.cancelAt = this.currentPeriodEnd;
  }

  await this.save();
};

// Method to reactivate cancelled subscription
subscriptionSchema.methods.reactivate = async function () {
  this.status = 'active';
  this.cancelAt = null;
  this.canceledAt = null;
  this.cancellationReason = null;
  await this.save();
};

// Static method to get active subscription for user
subscriptionSchema.statics.getActiveSubscription = async function (userId) {
  return await this.findOne({
    user: userId,
    status: { $in: ['active', 'trial'] },
  });
};

// Static method to check if subscription needs renewal
subscriptionSchema.statics.findExpiring = async function (daysThreshold = 7) {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + daysThreshold);

  return await this.find({
    status: 'active',
    currentPeriodEnd: {
      $lte: threshold,
      $gte: new Date(),
    },
  }).populate('user', 'email name');
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
