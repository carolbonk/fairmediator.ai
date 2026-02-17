/**
 * FreeTierQuota Model
 * Persists daily API usage counts to survive server restarts.
 * Each document = one service's usage for one day.
 */

const mongoose = require('mongoose');

const freeTierQuotaSchema = new mongoose.Schema({
  service: {
    type: String,
    required: true
  },
  date: {
    type: String, // 'YYYY-MM-DD'
    required: true
  },
  count: {
    type: Number,
    default: 0,
    min: 0
  },
  limit: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

// Unique per service per day
freeTierQuotaSchema.index({ service: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('FreeTierQuota', freeTierQuotaSchema);
