/**
 * Mediator Model
 * MongoDB schema for mediator profiles
 */

const mongoose = require('mongoose');

const mediatorSchema = new mongoose.Schema({
  // Basic Information
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
  photo: String,
  
  // Professional Details
  currentFirm: String,
  pastFirms: [String],
  practiceAreas: [{
    type: String,
    index: true
  }],
  yearsExperience: {
    type: Number,
    index: true
  },
  barMemberships: [String],
  
  // Location
  location: {
    city: String,
    state: String,
    country: { type: String, default: 'USA' }
  },
  
  // Education
  education: [{
    institution: String,
    degree: String,
    year: Number
  }],
  
  // Professional Background
  recentCases: [String],
  publications: [String],
  organizations: [String],
  appointments: [String],
  awards: [String],
  
  // AI-Generated Insights
  ideologyScore: {
    type: Number,
    min: -2,
    max: 2,
    default: 0,
    index: true
  },
  ideologyLabel: {
    type: String,
    enum: ['STRONG_LIBERAL', 'LEAN_LIBERAL', 'NEUTRAL', 'LEAN_CONSERVATIVE', 'STRONG_CONSERVATIVE'],
    default: 'NEUTRAL'
  },
  ideologyConfidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  ideologyAnalysis: {
    factors: [mongoose.Schema.Types.Mixed],
    summary: String,
    analyzedAt: Date
  },
  
  // Affiliation Tracking
  knownAffiliations: [{
    entity: String,
    type: String, // 'firm', 'organization', 'case'
    riskLevel: String, // 'HIGH', 'MEDIUM', 'LOW'
    details: String,
    detectedAt: Date
  }],
  
  // Ratings & Reviews
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  
  // Premium Features
  isPremium: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  profileCompleteness: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  dataSource: String, // Where the data came from (scraped, manual, etc.)
  
}, {
  timestamps: true
});

// Indexes for performance
mediatorSchema.index({ name: 'text', practiceAreas: 'text' });
mediatorSchema.index({ 'location.state': 1, practiceAreas: 1 });
mediatorSchema.index({ ideologyScore: 1, rating: -1 });

// Virtual for full location
mediatorSchema.virtual('fullLocation').get(function() {
  return `${this.location.city}, ${this.location.state}`;
});

// Method to calculate profile completeness
mediatorSchema.methods.calculateCompleteness = function() {
  let score = 0;
  if (this.name) score += 10;
  if (this.email) score += 10;
  if (this.currentFirm) score += 10;
  if (this.practiceAreas && this.practiceAreas.length > 0) score += 15;
  if (this.yearsExperience) score += 10;
  if (this.education && this.education.length > 0) score += 15;
  if (this.barMemberships && this.barMemberships.length > 0) score += 10;
  if (this.location.city && this.location.state) score += 10;
  if (this.photo) score += 10;
  
  this.profileCompleteness = score;
  return score;
};

module.exports = mongoose.model('Mediator', mediatorSchema);
