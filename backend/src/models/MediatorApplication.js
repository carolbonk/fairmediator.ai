/**
 * MediatorApplication Model
 * Stores applications from mediators who want to be listed on FairMediator
 */

const mongoose = require('mongoose');

const mediatorApplicationSchema = new mongoose.Schema({
  firstName:        { type: String, required: true, trim: true },
  lastName:         { type: String, required: true, trim: true },
  email:            { type: String, required: true, trim: true, lowercase: true },
  phone:            { type: String, trim: true },
  barNumber:        { type: String, trim: true },
  yearsExperience:  { type: Number, min: 0 },
  specializations:  [{ type: String }],
  linkedinUrl:      { type: String, trim: true },
  statement:        { type: String, maxlength: 2000 },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewNotes:  { type: String },
  submittedAt:  { type: Date, default: Date.now }
}, { timestamps: true });

mediatorApplicationSchema.index({ email: 1 }, { unique: true });
mediatorApplicationSchema.index({ status: 1, submittedAt: -1 });

module.exports = mongoose.model('MediatorApplication', mediatorApplicationSchema);
