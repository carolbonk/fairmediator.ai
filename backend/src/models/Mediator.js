const mongoose = require('mongoose');

const mediatorSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: true,
    index: true
  },
  email: {
    type: String,
    sparse: true
  },
  phone: String,
  website: String,

  // Location
  location: {
    city: String,
    state: String,
    country: String,
    address: String
  },

  // Professional Info
  lawFirm: String,
  currentEmployer: String,
  previousEmployers: [String],
  specializations: [String],
  yearsExperience: Number,
  barAdmissions: [String],
  certifications: [String],

  // Ideology & Bias Scoring
  ideologyScore: {
    type: Number,
    default: 0,
    min: -10,
    max: 10
  }, // -10 = very liberal, 0 = neutral, +10 = very conservative

  biasIndicators: {
    politicalAffiliations: [String],
    donationHistory: [{
      recipient: String,
      amount: Number,
      year: Number,
      party: String
    }],
    publicStatements: [{
      statement: String,
      source: String,
      date: Date,
      sentiment: String // liberal/conservative/neutral
    }]
  },

  // Affiliation Network
  affiliations: [{
    type: {
      type: String,
      enum: ['law_firm', 'organization', 'case', 'client', 'company']
    },
    name: String,
    role: String,
    startDate: Date,
    endDate: Date,
    isCurrent: Boolean
  }],

  // Case History
  cases: [{
    caseNumber: String,
    caseName: String,
    parties: [String],
    role: String, // mediator, arbitrator, attorney
    outcome: String,
    date: Date,
    court: String
  }],

  // Conflict Detection Data
  potentialConflicts: [{
    entity: String,
    entityType: String,
    relationship: String,
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    lastChecked: Date
  }],

  // Scraped Data Metadata
  sources: [{
    url: String,
    scrapedAt: Date,
    sourceType: String // linkedin, court_records, law_firm_website, etc.
  }],

  // Profile Completeness
  dataQuality: {
    completeness: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    lastVerified: Date,
    needsReview: {
      type: Boolean,
      default: false
    }
  },

  // Search & Discovery
  tags: [String],
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for performance
mediatorSchema.index({ name: 'text', specializations: 'text', tags: 'text' });
mediatorSchema.index({ ideologyScore: 1 });
mediatorSchema.index({ 'location.state': 1, 'location.city': 1 });
mediatorSchema.index({ lawFirm: 1 });
mediatorSchema.index({ isActive: 1, isVerified: 1 });

// Methods
mediatorSchema.methods.calculateDataQuality = function() {
  let score = 0;
  const fields = [
    'name', 'email', 'phone', 'location.city', 'location.state',
    'lawFirm', 'specializations', 'yearsExperience'
  ];

  fields.forEach(field => {
    const value = field.split('.').reduce((obj, key) => obj?.[key], this);
    if (value && (Array.isArray(value) ? value.length > 0 : true)) {
      score += 100 / fields.length;
    }
  });

  this.dataQuality.completeness = Math.round(score);
  return this.dataQuality.completeness;
};

mediatorSchema.methods.detectConflicts = async function(parties) {
  const conflicts = [];

  // Check affiliations against parties
  this.affiliations.forEach(affiliation => {
    if (parties.includes(affiliation.name)) {
      conflicts.push({
        entity: affiliation.name,
        entityType: affiliation.type,
        relationship: affiliation.role,
        riskLevel: affiliation.isCurrent ? 'high' : 'medium',
        lastChecked: new Date()
      });
    }
  });

  // Check previous cases
  this.cases.forEach(case_ => {
    const matchingParties = case_.parties.filter(p => parties.includes(p));
    if (matchingParties.length > 0) {
      conflicts.push({
        entity: matchingParties.join(', '),
        entityType: 'case',
        relationship: \`Previous \${case_.role} in \${case_.caseName}\`,
        riskLevel: 'medium',
        lastChecked: new Date()
      });
    }
  });

  return conflicts;
};

module.exports = mongoose.model('Mediator', mediatorSchema);
