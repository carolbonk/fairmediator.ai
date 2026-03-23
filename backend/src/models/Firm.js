/**
 * Firm Model
 * Represents law firms, organizations, and companies in the affiliation network
 * Supports ML infrastructure for entity resolution and relationship scoring
 */

const mongoose = require('mongoose');

const firmSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: true,
    index: true
  },
  normalizedName: {
    type: String,
    index: true
    // Normalized version for deduplication (lowercase, no punctuation)
  },
  aliases: [{
    type: String
  }], // Alternative names, abbreviations, DBA names

  // Classification
  type: {
    type: String,
    enum: ['law_firm', 'corporation', 'nonprofit', 'government', 'political', 'trade_association', 'other'],
    default: 'law_firm'
  },

  // Location
  headquarters: {
    city: String,
    state: String,
    country: { type: String, default: 'USA' }
  },
  offices: [{
    city: String,
    state: String,
    country: String,
    isPrimary: Boolean
  }],

  // Industry & Practice Areas
  industry: String, // e.g., "Legal Services", "Technology", "Healthcare"
  practiceAreas: [String], // e.g., "Civil Litigation", "Corporate", "IP"

  // Size & Scope
  size: {
    type: String,
    enum: ['solo', 'small', 'medium', 'large', 'biglaw', 'unknown'],
    default: 'unknown'
  },
  employeeCount: Number,
  foundedYear: Number,

  // Political Activity
  politicalLeaning: {
    type: Number,
    min: -10,
    max: 10,
    default: 0
  }, // Aggregate ideology score based on donations/statements

  totalDonations: {
    type: Number,
    default: 0
  }, // Total political donations tracked

  donationsByParty: {
    democrat: { type: Number, default: 0 },
    republican: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },

  // Notable Clients (for conflict detection)
  notableClients: [{
    name: String,
    industry: String,
    relationship: String, // e.g., "primary counsel", "litigation counsel"
    startDate: Date,
    endDate: Date,
    isCurrent: Boolean
  }],

  // Affiliation Network Stats
  networkStats: {
    totalMediators: { type: Number, default: 0 }, // How many mediators affiliated
    totalAffiliations: { type: Number, default: 0 }, // Total affiliation records
    averageInfluence: { type: Number, default: 0 }, // Average influence score
    conflictRiskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    } // Risk score for conflicts of interest
  },

  // External IDs
  externalIds: {
    fecId: String, // FEC organization ID
    linkedinUrl: String,
    website: String,
    crunchbaseUrl: String
  },

  // Data Quality
  dataQuality: {
    completeness: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    verified: {
      type: Boolean,
      default: false
    },
    lastVerified: Date,
    sources: [String] // e.g., ["FEC", "LinkedIn", "Manual Review"]
  },

  // ML Features
  embeddingVector: {
    type: [Number],
    select: false // Don't include in normal queries
  }, // 384-dim vector for semantic search

  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  notes: String,
  tags: [String]
}, {
  timestamps: true
});

// Indexes
firmSchema.index({ normalizedName: 1 });
firmSchema.index({ type: 1, isActive: 1 });
firmSchema.index({ 'headquarters.state': 1 });
firmSchema.index({ politicalLeaning: 1 });
firmSchema.index({ 'networkStats.conflictRiskScore': -1 });

// Pre-save hook to normalize name
firmSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.normalizedName = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  next();
});

// Calculate data quality score
firmSchema.methods.calculateDataQuality = function() {
  let score = 0;
  const weights = {
    name: 10,
    type: 10,
    headquarters: 15,
    industry: 10,
    size: 5,
    politicalLeaning: 15,
    notableClients: 15,
    externalIds: 20
  };

  if (this.name) score += weights.name;
  if (this.type && this.type !== 'other') score += weights.type;
  if (this.headquarters && this.headquarters.state) score += weights.headquarters;
  if (this.industry) score += weights.industry;
  if (this.size && this.size !== 'unknown') score += weights.size;
  if (this.politicalLeaning !== 0) score += weights.politicalLeaning;
  if (this.notableClients && this.notableClients.length > 0) score += weights.notableClients;

  const externalIdCount = Object.values(this.externalIds || {}).filter(v => v).length;
  score += (externalIdCount / 4) * weights.externalIds;

  this.dataQuality.completeness = Math.round(score);
  return this.dataQuality.completeness;
};

// Static method to find or create firm
firmSchema.statics.findOrCreate = async function(firmData) {
  const normalizedName = firmData.name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  let firm = await this.findOne({ normalizedName });

  if (!firm) {
    firm = new this(firmData);
    await firm.save();
  }

  return firm;
};

module.exports = mongoose.model('Firm', firmSchema);
