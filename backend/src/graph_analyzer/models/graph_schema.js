/**
 * Graph Database Schema for Conflict Detection
 *
 * This module defines the schema for relationship graphs used in conflict analysis.
 * Supports both Neo4j and NetworkX (pure JavaScript) implementations.
 *
 * @module graph_analyzer/models/graph_schema
 */

const mongoose = require('mongoose');

/**
 * Node Types:
 * - Mediator: Person serving as mediator
 * - LawFirm: Law firm entity
 * - Agency: Government agency
 * - Contractor: Private contractor
 * - Publication: Co-authored work
 * - Conference: Event attendance
 */

/**
 * Edge Types (Relationships):
 * - WORKED_AT: Employment relationship (weight: 10)
 * - CO_AUTHORED: Shared publication (weight: 7)
 * - SHARED_CASE: Collaborated on same case (weight: 8)
 * - DONATED_TO: Campaign finance donation (weight: 6)
 * - ATTENDED_TOGETHER: Shared conference/event (weight: 5)
 * - OPPOSING_COUNSEL: Adversarial relationship (weight: -5)
 */

/**
 * Relationship Schema - Stores graph edges in MongoDB
 * This allows us to use MongoDB while maintaining graph-like relationships
 */
const RelationshipSchema = new mongoose.Schema({
  sourceType: {
    type: String,
    enum: ['Mediator', 'LawFirm', 'Agency', 'Contractor', 'Publication', 'Conference'],
    required: true,
    index: true
  },
  sourceId: {
    type: String,
    required: true,
    index: true
  },
  targetType: {
    type: String,
    enum: ['Mediator', 'LawFirm', 'Agency', 'Contractor', 'Publication', 'Conference'],
    required: true,
    index: true
  },
  targetId: {
    type: String,
    required: true,
    index: true
  },
  relationshipType: {
    type: String,
    enum: ['WORKED_AT', 'CO_AUTHORED', 'SHARED_CASE', 'DONATED_TO', 'ATTENDED_TOGETHER', 'OPPOSING_COUNSEL'],
    required: true,
    index: true
  },
  weight: {
    type: Number,
    required: true,
    default: 0
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    // Examples:
    // - For WORKED_AT: { startDate, endDate, role }
    // - For CO_AUTHORED: { publicationTitle, publicationDate, journalName }
    // - For SHARED_CASE: { caseNumber, court, year, outcome }
    // - For DONATED_TO: { candidate, amount, date, fecId }
    // - For ATTENDED_TOGETHER: { eventName, date, location }
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 1.0,
    // Confidence score for the relationship (1.0 = verified, <1.0 = inferred)
  },
  dataSource: {
    type: String,
    enum: ['FEC', 'RECAP', 'LINKEDIN', 'OPENSECRETS', 'MANUAL', 'SCRAPED'],
    required: true
  },
  lastVerified: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true,
    // Set to false for historical relationships that are no longer active
  }
}, {
  timestamps: true
});

// Compound index for efficient relationship lookups
RelationshipSchema.index({ sourceId: 1, targetId: 1, relationshipType: 1 });
RelationshipSchema.index({ sourceType: 1, targetType: 1 });

/**
 * Entity Schema - Stores graph nodes
 * Each entity can be a mediator, law firm, agency, etc.
 */
const EntitySchema = new mongoose.Schema({
  entityType: {
    type: String,
    enum: ['Mediator', 'LawFirm', 'Agency', 'Contractor', 'Publication', 'Conference'],
    required: true,
    index: true
  },
  entityId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    index: 'text'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    // Entity-specific data:
    // - Mediator: { barNumber, state, yearsExperience }
    // - LawFirm: { address, founded, size }
    // - Agency: { jurisdiction, agencyType }
    // - Contractor: { industry, ein }
  },
  aliases: [{
    type: String,
    // Alternative names for entity matching
  }],
  dataSource: {
    type: String,
    enum: ['FEC', 'RECAP', 'LINKEDIN', 'OPENSECRETS', 'MANUAL', 'SCRAPED'],
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Text index for entity search
EntitySchema.index({ name: 'text', aliases: 'text' });

/**
 * ConflictPath Schema - Stores computed conflict paths for caching
 */
const ConflictPathSchema = new mongoose.Schema({
  mediatorId: {
    type: String,
    required: true,
    index: true
  },
  opposingEntityId: {
    type: String,
    required: true,
    index: true
  },
  opposingEntityType: {
    type: String,
    enum: ['LawFirm', 'Agency', 'Contractor'],
    required: true
  },
  riskScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  riskLevel: {
    type: String,
    enum: ['GREEN', 'YELLOW', 'RED'],
    required: true
  },
  paths: [{
    nodes: [String], // Array of entityIds in the path
    totalWeight: Number,
    relationships: [{
      from: String,
      to: String,
      type: String,
      weight: Number,
      metadata: mongoose.Schema.Types.Mixed
    }]
  }],
  recommendation: {
    type: String
  },
  computedAt: {
    type: Date,
    default: Date.now
  },
  ttl: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    index: true
  }
}, {
  timestamps: true
});

// Compound index for conflict path lookups
ConflictPathSchema.index({ mediatorId: 1, opposingEntityId: 1 });

// TTL index to auto-delete expired paths
ConflictPathSchema.index({ ttl: 1 }, { expireAfterSeconds: 0 });

/**
 * Risk Scoring Weights
 * Used by risk calculator to compute conflict scores
 */
const RISK_WEIGHTS = {
  WORKED_AT: 10,           // Direct employment = strongest indicator
  SHARED_CASE: 8,          // Collaborated on same case
  CO_AUTHORED: 7,          // Co-authored publication
  DONATED_TO: 6,           // Campaign finance donation to same candidate
  ATTENDED_TOGETHER: 5,    // Shared conference panel
  OPPOSING_COUNSEL: -5     // Adversarial relationship (reduces risk)
};

/**
 * Risk Thresholds
 * Define when to flag relationships as conflicts
 */
const RISK_THRESHOLDS = {
  GREEN: 8,    // < 8 points = Clear
  YELLOW: 15,  // 8-15 points = Caution
  RED: 15      // > 15 points = High Risk
};

module.exports = {
  Relationship: mongoose.model('GraphRelationship', RelationshipSchema),
  Entity: mongoose.model('GraphEntity', EntitySchema),
  ConflictPath: mongoose.model('ConflictPath', ConflictPathSchema),
  RISK_WEIGHTS,
  RISK_THRESHOLDS
};
