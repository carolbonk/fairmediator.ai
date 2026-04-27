/**
 * Conversation Model
 * A messaging thread scoped to a single Case. Multiple conversations can
 * coexist on a case (e.g. mediator-only, mediator+plaintiff, full group).
 */

const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['mediator', 'attorney', 'party'],
    required: true
  }
}, { _id: false });

const conversationSchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true,
    index: true
  },
  title: {
    type: String,
    trim: true,
    maxlength: 120
  },
  participants: {
    type: [participantSchema],
    validate: v => Array.isArray(v) && v.length >= 1
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastMessagePreview: {
    type: String,
    maxlength: 240
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

conversationSchema.index({ caseId: 1, lastMessageAt: -1 });
conversationSchema.index({ 'participants.userId': 1, lastMessageAt: -1 });

/**
 * Find all conversations on a case that include the given user.
 * Used by both the per-case workspace (caseId scoped) and the inbox
 * (omit caseId to query across all cases).
 */
conversationSchema.statics.findForUserInCase = function (userId, caseId) {
  const query = { 'participants.userId': userId };
  if (caseId) query.caseId = caseId;
  return this.find(query).sort({ lastMessageAt: -1 }).lean();
};

module.exports = mongoose.model('Conversation', conversationSchema);
