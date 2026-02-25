/**
 * MediatorApplication Model
 * Stores applications from mediators who want to be listed on FairMediator
 */

const mongoose = require('mongoose');

const mediatorApplicationSchema = new mongoose.Schema({
  // ── Human-readable reference ID (e.g. FM-A3K9PX7Q) ───────────────────────
  applicationId: { type: String, required: true, unique: true, trim: true },

  // ── Identity ─────────────────────────────────────────────────────────────
  firstName:  { type: String, required: true, trim: true },
  lastName:   { type: String, required: true, trim: true },
  email:      { type: String, required: true, trim: true, lowercase: true },

  // ── Application context ───────────────────────────────────────────────────
  applyingAs: { type: String, enum: ['individual', 'firm'], default: 'individual' },
  location:   { type: String, trim: true },           // "City, State" free text

  // ── Work authorisation ────────────────────────────────────────────────────
  authorized:           { type: String, enum: ['yes', 'no', ''] },
  preferredState:       { type: String, trim: true },
  preferredStateReason: { type: String, trim: true, maxlength: 1000 },

  // ── Professional details ──────────────────────────────────────────────────
  practiceAreas:  [{ type: String }],
  experience:     { type: Number, min: 0 },           // years
  disputeTypes:   { type: String, trim: true, maxlength: 1000 },
  certifications: { type: String, trim: true, maxlength: 1000 },
  languages:      [{ type: String }],
  comments:       { type: String, trim: true, maxlength: 2000 },

  // ── Legacy / optional fields kept for backward compat ────────────────────
  phone:        { type: String, trim: true },
  barNumber:    { type: String, trim: true },
  linkedinUrl:  { type: String, trim: true },

  // ── Review workflow ───────────────────────────────────────────────────────
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewNotes: { type: String },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

mediatorApplicationSchema.index({ applicationId: 1 }, { unique: true });
mediatorApplicationSchema.index({ email: 1 }, { unique: true });
mediatorApplicationSchema.index({ status: 1, submittedAt: -1 });

module.exports = mongoose.model('MediatorApplication', mediatorApplicationSchema);
