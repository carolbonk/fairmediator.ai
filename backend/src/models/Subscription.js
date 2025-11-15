/**
 * Subscription Model
 * Stripe subscription tracking
 */

const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  stripeCustomerId: {
    type: String,
    required: true
  },
  stripeSubscriptionId: {
    type: String,
    required: true
  },
  stripePriceId: String,
  status: {
    type: String,
    enum: ['active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid'],
    default: 'active'
  },
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  canceledAt: Date,
  endedAt: Date,
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Index for quick lookups
subscriptionSchema.index({ user: 1 });
subscriptionSchema.index({ stripeCustomerId: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });

// Check if subscription is active
subscriptionSchema.methods.isActive = function() {
  return this.status === 'active' &&
         (!this.currentPeriodEnd || this.currentPeriodEnd > new Date());
};

// Get days remaining
subscriptionSchema.virtual('daysRemaining').get(function() {
  if (!this.currentPeriodEnd) return 0;
  const diff = this.currentPeriodEnd - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
