/**
 * Relationship Detector - Automated relationship discovery
 *
 * Analyzes scraped data to automatically detect and create
 * relationships between entities.
 *
 * @module graph_analyzer/services/relationship_detector
 */

const { Entity, Relationship, RISK_WEIGHTS } = require('../models/graph_schema');
const logger = require('../../config/logger');

class RelationshipDetector {
  /**
   * Detect co-authorship relationships from publication data
   *
   * @param {Array} publications - Array of publication records
   * @returns {Array} Detected relationships
   */
  async detectCoAuthorship(publications) {
    const relationships = [];

    for (const pub of publications) {
      if (!pub.authors || pub.authors.length < 2) continue;

      // Create relationship between all author pairs
      for (let i = 0; i < pub.authors.length; i++) {
        for (let j = i + 1; j < pub.authors.length; j++) {
          const author1Id = pub.authors[i].entityId;
          const author2Id = pub.authors[j].entityId;

          const relationship = await Relationship.findOneAndUpdate(
            {
              sourceId: author1Id,
              targetId: author2Id,
              relationshipType: 'CO_AUTHORED',
              'metadata.publicationTitle': pub.title
            },
            {
              sourceType: 'Mediator',
              sourceId: author1Id,
              targetType: 'Mediator',
              targetId: author2Id,
              relationshipType: 'CO_AUTHORED',
              weight: RISK_WEIGHTS.CO_AUTHORED,
              metadata: {
                publicationTitle: pub.title,
                publicationDate: pub.date,
                journalName: pub.journal,
                doi: pub.doi
              },
              confidence: 0.95,
              dataSource: 'SCRAPED',
              lastVerified: new Date(),
              isActive: true
            },
            { upsert: true, new: true }
          );

          relationships.push(relationship);
        }
      }
    }

    logger.info(`[RelationshipDetector] Detected ${relationships.length} co-authorship relationships`);
    return relationships;
  }

  /**
   * Detect conference attendance relationships
   *
   * @param {Array} attendees - Array of attendee records
   * @param {Object} eventData - Event/conference metadata
   * @returns {Array} Detected relationships
   */
  async detectConferenceAttendance(attendees, eventData) {
    const relationships = [];
    const eventId = `event_${eventData.name.replace(/\s+/g, '_')}_${eventData.year}`;

    // Create entity for conference/event
    await Entity.findOneAndUpdate(
      { entityId: eventId },
      {
        entityType: 'Conference',
        entityId: eventId,
        name: eventData.name,
        metadata: {
          date: eventData.date,
          location: eventData.location,
          year: eventData.year,
          organizer: eventData.organizer
        },
        dataSource: 'SCRAPED',
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );

    // Create relationships between all attendees and the event
    for (const attendee of attendees) {
      const relationship = await Relationship.findOneAndUpdate(
        {
          sourceId: attendee.entityId,
          targetId: eventId,
          relationshipType: 'ATTENDED_TOGETHER'
        },
        {
          sourceType: 'Mediator',
          sourceId: attendee.entityId,
          targetType: 'Conference',
          targetId: eventId,
          relationshipType: 'ATTENDED_TOGETHER',
          weight: RISK_WEIGHTS.ATTENDED_TOGETHER,
          metadata: {
            eventName: eventData.name,
            date: eventData.date,
            location: eventData.location,
            role: attendee.role // speaker, panelist, attendee
          },
          confidence: 0.9,
          dataSource: 'SCRAPED',
          lastVerified: new Date(),
          isActive: true
        },
        { upsert: true, new: true }
      );

      relationships.push(relationship);
    }

    logger.info(`[RelationshipDetector] Detected ${relationships.length} conference attendance relationships`);
    return relationships;
  }

  /**
   * Detect shared employment relationships
   * Finds people who worked at the same company during overlapping periods
   *
   * @param {String} companyId - Company entity ID
   * @returns {Array} Detected relationships
   */
  async detectSharedEmployment(companyId) {
    // Find all WORKED_AT relationships for this company
    const employments = await Relationship.find({
      targetId: companyId,
      relationshipType: 'WORKED_AT',
      isActive: true
    }).populate('sourceId');

    const relationships = [];

    // Check for overlapping employment periods
    for (let i = 0; i < employments.length; i++) {
      for (let j = i + 1; j < employments.length; j++) {
        const emp1 = employments[i];
        const emp2 = employments[j];

        const overlap = this.checkDateOverlap(
          emp1.metadata.startDate,
          emp1.metadata.endDate,
          emp2.metadata.startDate,
          emp2.metadata.endDate
        );

        if (overlap) {
          // Create SHARED_EMPLOYER relationship
          const relationship = await Relationship.findOneAndUpdate(
            {
              sourceId: emp1.sourceId,
              targetId: emp2.sourceId,
              relationshipType: 'SHARED_EMPLOYER'
            },
            {
              sourceType: 'Mediator',
              sourceId: emp1.sourceId,
              targetType: 'Mediator',
              targetId: emp2.sourceId,
              relationshipType: 'SHARED_EMPLOYER',
              weight: 6, // Shared employer = moderate weight
              metadata: {
                company: companyId,
                overlapMonths: overlap.months,
                overlapStartDate: overlap.start,
                overlapEndDate: overlap.end
              },
              confidence: 0.85,
              dataSource: 'INFERRED',
              lastVerified: new Date(),
              isActive: true
            },
            { upsert: true, new: true }
          );

          relationships.push(relationship);
        }
      }
    }

    logger.info(`[RelationshipDetector] Detected ${relationships.length} shared employment relationships`);
    return relationships;
  }

  /**
   * Check if two date ranges overlap
   *
   * @param {Date} start1 - First range start
   * @param {Date} end1 - First range end
   * @param {Date} start2 - Second range start
   * @param {Date} end2 - Second range end
   * @returns {Object|null} Overlap details or null
   */
  checkDateOverlap(start1, end1, start2, end2) {
    const s1 = new Date(start1);
    const e1 = end1 ? new Date(end1) : new Date(); // If no end date, assume current
    const s2 = new Date(start2);
    const e2 = end2 ? new Date(end2) : new Date();

    // Check for overlap
    const overlapStart = s1 > s2 ? s1 : s2;
    const overlapEnd = e1 < e2 ? e1 : e2;

    if (overlapStart <= overlapEnd) {
      const months = Math.floor((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24 * 30));
      return {
        start: overlapStart,
        end: overlapEnd,
        months
      };
    }

    return null;
  }

  /**
   * Find potential duplicate entities
   * Uses fuzzy name matching to identify entities that might be the same
   *
   * @param {String} entityType - Type of entities to check
   * @returns {Array} Potential duplicates
   */
  async findDuplicateEntities(entityType) {
    const entities = await Entity.find({ entityType });
    const duplicates = [];

    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const similarity = this.calculateNameSimilarity(
          entities[i].name,
          entities[j].name
        );

        if (similarity > 0.85) { // 85% similar
          duplicates.push({
            entity1: entities[i],
            entity2: entities[j],
            similarity,
            recommendation: similarity > 0.95 ? 'MERGE' : 'REVIEW'
          });
        }
      }
    }

    logger.info(`[RelationshipDetector] Found ${duplicates.length} potential duplicate entities`);
    return duplicates;
  }

  /**
   * Calculate Levenshtein distance-based similarity
   *
   * @param {String} str1 - First string
   * @param {String} str2 - Second string
   * @returns {Number} Similarity score (0-1)
   */
  calculateNameSimilarity(str1, str2) {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1.0;

    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);

    return 1 - (distance / maxLength);
  }

  /**
   * Levenshtein distance algorithm
   *
   * @param {String} str1 - First string
   * @param {String} str2 - Second string
   * @returns {Number} Edit distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Merge duplicate entities
   *
   * @param {String} keepId - Entity ID to keep
   * @param {String} mergeId - Entity ID to merge and delete
   * @returns {Object} Merge result
   */
  async mergeDuplicateEntities(keepId, mergeId) {
    logger.info(`[RelationshipDetector] Merging ${mergeId} into ${keepId}`);

    // Update all relationships pointing to mergeId
    await Relationship.updateMany(
      { sourceId: mergeId },
      { $set: { sourceId: keepId } }
    );

    await Relationship.updateMany(
      { targetId: mergeId },
      { $set: { targetId: keepId } }
    );

    // Delete the duplicate entity
    await Entity.deleteOne({ entityId: mergeId });

    logger.info(`[RelationshipDetector] Successfully merged ${mergeId} into ${keepId}`);

    return {
      success: true,
      keptEntity: keepId,
      mergedEntity: mergeId
    };
  }
}

module.exports = new RelationshipDetector();
