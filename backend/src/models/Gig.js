/**
 * Gig Model
 * A piece of mediation work posted to the marketplace. Once accepted by
 * a mediator, a gig is "promoted" into a Case and the gig becomes a
 * historical pointer (Gig.promotedToCaseId).
 */

const mongoose = require('mongoose');

const GIG_STATUSES = ['open', 'claimed', 'accepted', 'expired', 'cancelled'];

const ALLOWED_TRANSITIONS = {
  open: ['claimed', 'expired', 'cancelled'],
  claimed: ['accepted', 'open', 'cancelled'],
  accepted: [],
  expired: [],
  cancelled: []
};

const gigSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  summary: { type: String, trim: true, maxlength: 2000 },

  disputeType: {
    type: String,
    enum: [
      'employment','commercial','family','real_estate','contract',
      'intellectual_property','consumer','environmental','construction',
      'insurance','healthcare','other'
    ],
    required: true,
    index: true
  },

  parties: [{
    name: { type: String, trim: true },
    role: { type: String, enum: ['plaintiff', 'defendant', 'party'] }
  }],

  amountInDispute: { type: Number, min: 0 },

  budget: {
    min: { type: Number, min: 0 },
    max: { type: Number, min: 0 },
    currency: { type: String, default: 'USD' }
  },

  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  status: {
    type: String,
    enum: GIG_STATUSES,
    default: 'open',
    index: true
  },

  distributionMode: {
    type: String,
    enum: ['open_feed', 'auto_match'],
    default: 'open_feed',
    required: true,
    index: true
  },

  recommendedMediatorIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  }],

  claimedBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    claimedAt: Date
  },

  acceptedBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    acceptedAt: Date
  },

  promotedToCaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    index: true
  },

  expiresAt: Date
}, { timestamps: true });

gigSchema.index({ status: 1, distributionMode: 1, createdAt: -1 });

/**
 * Check whether the gig may transition to the target status.
 * Returns boolean — not throwing — so callers can branch cleanly.
 */
gigSchema.methods.canTransitionTo = function (target) {
  if (!GIG_STATUSES.includes(target)) return false;
  const allowed = ALLOWED_TRANSITIONS[this.status] || [];
  return allowed.includes(target);
};

gigSchema.statics.STATUSES = GIG_STATUSES;
gigSchema.statics.TRANSITIONS = ALLOWED_TRANSITIONS;

module.exports = mongoose.model('Gig', gigSchema);
