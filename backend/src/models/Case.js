/**
 * Case Model
 * Represents a dispute/mediation case in the system
 */

const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  // Case identification
  caseNumber: {
    type: String,
    unique: true,
    required: true,
    index: true
  },

  // Case title/summary
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },

  // Case description
  description: {
    type: String,
    trim: true,
    maxlength: 5000
  },

  // Type of dispute
  disputeType: {
    type: String,
    required: true,
    enum: [
      'employment',
      'commercial',
      'family',
      'real_estate',
      'contract',
      'intellectual_property',
      'consumer',
      'environmental',
      'construction',
      'insurance',
      'healthcare',
      'other'
    ],
    index: true
  },

  // Case status
  status: {
    type: String,
    required: true,
    enum: [
      'draft',           // Case being created
      'submitted',       // Case submitted, seeking mediator
      'mediator_selected', // Mediator chosen
      'in_mediation',    // Active mediation
      'settled',         // Case resolved
      'failed',          // Mediation failed
      'cancelled',       // Case cancelled
      'on_hold'          // Temporarily paused
    ],
    default: 'draft',
    index: true
  },

  // Parties involved
  parties: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['plaintiff', 'defendant', 'party'],
      required: true
    },
    name: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    }
  }],

  // Attorneys involved (optional)
  attorneys: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    representing: {
      type: String,
      enum: ['plaintiff', 'defendant', 'both'],
      required: true
    },
    name: {
      type: String,
      trim: true
    },
    firm: {
      type: String,
      trim: true
    },
    barNumber: {
      type: String,
      trim: true
    }
  }],

  // Assigned mediator
  mediator: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    mediatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mediator'
    },
    assignedAt: Date,
    acceptedAt: Date
  },

  // Settlement amount (if applicable)
  settlement: {
    amount: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    agreedAt: Date
  },

  // Important dates
  dates: {
    filed: Date,
    mediationScheduled: Date,
    mediationCompleted: Date,
    settlementReached: Date,
    closedAt: Date
  },

  // Case value/amount in dispute
  amountInDispute: {
    type: Number,
    min: 0
  },

  // Documents attached to case
  documents: [{
    name: String,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['contract', 'evidence', 'correspondence', 'settlement', 'other']
    }
  }],

  // Case notes/timeline
  notes: [{
    content: {
      type: String,
      required: true,
      maxlength: 2000
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    visibility: {
      type: String,
      enum: ['all', 'mediator_only', 'attorneys_only', 'private'],
      default: 'all'
    }
  }],

  // AI-generated insights
  aiInsights: {
    conflictLevel: {
      type: Number,
      min: 0,
      max: 100
    },
    settlementProbability: {
      type: Number,
      min: 0,
      max: 100
    },
    recommendedMediators: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mediator'
    }],
    riskFactors: [String],
    lastAnalyzedAt: Date
  },

  // Privacy settings
  confidential: {
    type: Boolean,
    default: true
  },

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
caseSchema.index({ status: 1, createdAt: -1 });
caseSchema.index({ 'parties.userId': 1 });
caseSchema.index({ 'attorneys.userId': 1 });
caseSchema.index({ 'mediator.userId': 1 });
caseSchema.index({ disputeType: 1, status: 1 });

// Generate case number before validation runs (caseNumber is `required: true`,
// so a `pre('save')` hook would fire too late — validate runs first and rejects).
caseSchema.pre('validate', async function () {
  if (this.isNew && !this.caseNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Case').countDocuments();
    this.caseNumber = `CASE-${year}-${String(count + 1).padStart(6, '0')}`;
  }
});

module.exports = mongoose.model('Case', caseSchema);
