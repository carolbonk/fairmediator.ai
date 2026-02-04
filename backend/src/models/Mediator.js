const mongoose = require('mongoose');

const mediatorSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: true,
    index: true
  },
  bio: {
    type: String,
    default: ''
    // Professional biography, practice description, expertise summary
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

  // Conflict Detection Data (Legacy)
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

  // RECAP-Based Conflict Detection (Case History)
  recapData: {
    lastSearched: Date,
    casesFound: {
      type: Number,
      default: 0
    },
    cases: [{
      docketNumber: String,
      caseName: String,
      court: String,
      dateFiled: Date,
      parties: [String],
      attorneys: [String],
      outcome: String,
      url: String
    }],
    knownCounselRelationships: [{
      counselName: String,
      firm: String,
      caseCount: Number,
      mostRecentCase: Date,
      riskLevel: {
        type: String,
        enum: ['clear', 'yellow', 'red'],
        default: 'clear'
      }
    }]
  },

  // Conflict Risk Cache (for quick lookup)
  // Updated by POST /api/mediators/:id/check-conflicts
  conflictRiskCache: {
    opposingCounsel: String, // Last checked counsel
    currentParty: String,    // Last checked party
    riskLevel: {
      type: String,
      enum: ['clear', 'yellow', 'red'],
      default: 'clear'
    },
    reasons: [{
      type: String,          // 'case_history', 'affiliation', 'party_overlap'
      description: String,   // Human-readable explanation
      confidence: Number,    // 0-1 confidence score
      source: String,        // 'recap', 'manual', 'linkedin'
      caseReference: String  // Docket number if applicable
    }],
    checkedAt: Date,
    expiresAt: Date          // Cache expires after 7 days
  },

  // Scraped Data Metadata
  sources: [{
    url: String,
    scrapedAt: Date,
    sourceType: String // linkedin, court_records, law_firm_website, etc.
  }],

  // LinkedIn Enrichment Data (Manual User Input)
  linkedinEnrichment: {
    profileData: {
      name: String,
      headline: String,
      location: String,
      connectionsCount: Number,
      about: String
    },
    opposingCounsel: String,        // Opposing counsel name this was checked against
    mutualConnectionsCount: Number,  // Number of mutual connections
    checkedAt: Date,                // When LinkedIn data was scraped
    scrapedBy: String               // 'manual_user_input' or 'automated'
  },

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
  },

  // Performance & Ratings
  rating: {
    type: Number,
    default: 5.0,
    min: 0,
    max: 5
  },
  totalMediations: {
    type: Number,
    default: 0,
    min: 0
  },

  // Vector Embedding for Semantic Search (MongoDB Atlas Vector Search)
  embedding: {
    type: [Number],
    default: undefined, // Only create when explicitly indexed
    select: false // Don't return in queries by default (large array)
  },
  embeddingModel: {
    type: String,
    default: 'sentence-transformers/all-MiniLM-L6-v2'
  },
  embeddingGeneratedAt: Date
}, {
  timestamps: true
});

// Indexes for performance (O(log n) query complexity)
// Text index with weights for hybrid search (BM25-style)
mediatorSchema.index(
  {
    bio: 'text',
    name: 'text',
    specializations: 'text',
    lawFirm: 'text',
    'location.city': 'text',
    'location.state': 'text',
    tags: 'text'
  },
  {
    name: 'mediator_text_search',
    weights: {
      bio: 10,              // Highest weight - professional description
      name: 8,              // Very high - exact name matches
      specializations: 6,   // High - practice areas
      lawFirm: 3,          // Medium - law firm name
      'location.city': 2,   // Low - location
      'location.state': 2,
      tags: 1              // Lowest - generic tags
    },
    default_language: 'english'
  }
);
mediatorSchema.index({ ideologyScore: 1 });
mediatorSchema.index({ 'location.state': 1, 'location.city': 1 });
mediatorSchema.index({ lawFirm: 1 });
mediatorSchema.index({ isActive: 1, isVerified: 1 });
mediatorSchema.index({ specializations: 1 }); // For practiceArea filtering
mediatorSchema.index({ yearsExperience: 1 }); // For minExperience filtering
mediatorSchema.index({ rating: -1, yearsExperience: -1 }); // Compound index for efficient sorting

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
        relationship: `Previous ${case_.role} in ${case_.caseName}`,
        riskLevel: 'medium',
        lastChecked: new Date()
      });
    }
  });

  return conflicts;
};

// Virtual field for backward compatibility (frontend uses "practiceAreas", backend uses "specializations")
mediatorSchema.virtual('practiceAreas').get(function() {
  return this.specializations;
});

// Ensure virtuals are included in JSON/Object output
mediatorSchema.set('toJSON', { virtuals: true });
mediatorSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Mediator', mediatorSchema);
