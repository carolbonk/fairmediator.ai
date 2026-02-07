/**
 * Graph Service - Core graph analysis and pathfinding
 *
 * Provides graph traversal, pathfinding, and relationship analysis
 * using MongoDB-stored graph data.
 *
 * @module graph_analyzer/services/graph_service
 */

const { Entity, Relationship, ConflictPath } = require('../models/graph_schema');
const { calculateRiskScore } = require('../models/risk_calculator');
const logger = require('../../config/logger');

class GraphService {
  /**
   * Find all paths between two entities
   * Uses breadth-first search with max depth limit
   *
   * @param {String} sourceId - Starting entity ID
   * @param {String} targetId - Target entity ID
   * @param {Object} options - Search options (maxDepth, relationshipTypes)
   * @returns {Array} Array of paths from source to target
   */
  async findPaths(sourceId, targetId, options = {}) {
    const maxDepth = options.maxDepth || 3; // Default: search up to 3 degrees of separation
    const allowedTypes = options.relationshipTypes || null; // Filter by relationship types

    // Check cache first
    const cached = await ConflictPath.findOne({
      mediatorId: sourceId,
      opposingEntityId: targetId,
      ttl: { $gt: new Date() }
    });

    if (cached && !options.bypassCache) {
      logger.info(`[GraphService] Cache hit for ${sourceId} -> ${targetId}`);
      return cached.paths;
    }

    logger.info(`[GraphService] Finding paths: ${sourceId} -> ${targetId} (max depth: ${maxDepth})`);

    const paths = [];
    const queue = [{
      currentId: sourceId,
      visited: new Set([sourceId]),
      path: {
        nodes: [sourceId],
        relationships: [],
        totalWeight: 0
      },
      depth: 0
    }];

    while (queue.length > 0) {
      const { currentId, visited, path, depth } = queue.shift();

      // Stop if max depth reached
      if (depth >= maxDepth) continue;

      // Find all outgoing relationships from current node
      let relationships = await Relationship.find({
        sourceId: currentId,
        isActive: true
      });

      // Filter by relationship types if specified
      if (allowedTypes) {
        relationships = relationships.filter(r => allowedTypes.includes(r.relationshipType));
      }

      for (const rel of relationships) {
        const nextId = rel.targetId;

        // Found target!
        if (nextId === targetId) {
          const completePath = {
            nodes: [...path.nodes, nextId],
            relationships: [
              ...path.relationships,
              {
                from: currentId,
                to: nextId,
                type: rel.relationshipType,
                weight: rel.weight,
                metadata: rel.metadata,
                confidence: rel.confidence
              }
            ],
            totalWeight: path.totalWeight + rel.weight
          };

          paths.push(completePath);
          continue;
        }

        // Avoid cycles
        if (visited.has(nextId)) continue;

        // Add to queue for further exploration
        const newVisited = new Set(visited);
        newVisited.add(nextId);

        queue.push({
          currentId: nextId,
          visited: newVisited,
          path: {
            nodes: [...path.nodes, nextId],
            relationships: [
              ...path.relationships,
              {
                from: currentId,
                to: nextId,
                type: rel.relationshipType,
                weight: rel.weight,
                metadata: rel.metadata,
                confidence: rel.confidence
              }
            ],
            totalWeight: path.totalWeight + rel.weight
          },
          depth: depth + 1
        });
      }
    }

    logger.info(`[GraphService] Found ${paths.length} paths between ${sourceId} and ${targetId}`);

    return paths;
  }

  /**
   * Analyze conflict between mediator and opposing party
   *
   * @param {String} mediatorId - Mediator's entity ID
   * @param {String} opposingEntityId - Opposing party's entity ID
   * @param {Object} options - Analysis options
   * @returns {Object} Conflict analysis with risk score and paths
   */
  async analyzeConflict(mediatorId, opposingEntityId, options = {}) {
    try {
      logger.info(`[GraphService] Analyzing conflict: ${mediatorId} vs ${opposingEntityId}`);

      // Find all paths between mediator and opposing party
      const paths = await this.findPaths(mediatorId, opposingEntityId, options);

      // Calculate risk score
      const riskAssessment = calculateRiskScore(paths);

      // Enrich with entity details
      const [mediatorEntity, opposingEntity] = await Promise.all([
        Entity.findOne({ entityId: mediatorId }),
        Entity.findOne({ entityId: opposingEntityId })
      ]);

      const result = {
        mediator: {
          id: mediatorId,
          name: mediatorEntity?.name || 'Unknown',
          type: mediatorEntity?.entityType
        },
        opposingParty: {
          id: opposingEntityId,
          name: opposingEntity?.name || 'Unknown',
          type: opposingEntity?.entityType
        },
        ...riskAssessment,
        analyzedAt: new Date()
      };

      // Cache the result
      await ConflictPath.findOneAndUpdate(
        {
          mediatorId,
          opposingEntityId
        },
        {
          mediatorId,
          opposingEntityId,
          opposingEntityType: opposingEntity?.entityType || 'Unknown',
          riskScore: riskAssessment.riskScore,
          riskLevel: riskAssessment.riskLevel,
          paths,
          recommendation: riskAssessment.recommendation,
          computedAt: new Date(),
          ttl: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        },
        { upsert: true, new: true }
      );

      return result;

    } catch (error) {
      logger.error('[GraphService] Error analyzing conflict:', error);
      throw error;
    }
  }

  /**
   * Get all relationships for an entity
   *
   * @param {String} entityId - Entity ID
   * @param {Object} options - Filter options
   * @returns {Array} Array of relationships
   */
  async getEntityRelationships(entityId, options = {}) {
    const query = {
      $or: [
        { sourceId: entityId },
        { targetId: entityId }
      ],
      isActive: true
    };

    if (options.relationshipType) {
      query.relationshipType = options.relationshipType;
    }

    const relationships = await Relationship.find(query)
      .sort({ weight: -1 }) // Sort by weight (strongest first)
      .limit(options.limit || 100);

    // Enrich with entity details
    const enriched = await Promise.all(
      relationships.map(async (rel) => {
        const [source, target] = await Promise.all([
          Entity.findOne({ entityId: rel.sourceId }),
          Entity.findOne({ entityId: rel.targetId })
        ]);

        return {
          ...rel.toObject(),
          source: {
            id: rel.sourceId,
            name: source?.name || 'Unknown',
            type: source?.entityType
          },
          target: {
            id: rel.targetId,
            name: target?.name || 'Unknown',
            type: target?.entityType
          }
        };
      })
    );

    return enriched;
  }

  /**
   * Find entities by type
   *
   * @param {String} entityType - Entity type (Mediator, LawFirm, etc.)
   * @param {Object} filters - Additional filters
   * @returns {Array} Array of entities
   */
  async findEntities(entityType, filters = {}) {
    const query = { entityType, ...filters };

    const entities = await Entity.find(query)
      .sort({ name: 1 })
      .limit(filters.limit || 100);

    return entities;
  }

  /**
   * Get network statistics for an entity
   * Shows how connected an entity is
   *
   * @param {String} entityId - Entity ID
   * @returns {Object} Network statistics
   */
  async getNetworkStats(entityId) {
    const relationships = await Relationship.find({
      $or: [
        { sourceId: entityId },
        { targetId: entityId }
      ],
      isActive: true
    });

    const outgoing = relationships.filter(r => r.sourceId === entityId);
    const incoming = relationships.filter(r => r.targetId === entityId);

    // Count by relationship type
    const typeStats = {};
    for (const rel of relationships) {
      typeStats[rel.type] = (typeStats[rel.relationshipType] || 0) + 1;
    }

    // Calculate average relationship weight
    const avgWeight = relationships.length > 0
      ? relationships.reduce((sum, r) => sum + r.weight, 0) / relationships.length
      : 0;

    // Find most connected entity
    const connectionCounts = {};
    for (const rel of relationships) {
      const otherId = rel.sourceId === entityId ? rel.targetId : rel.sourceId;
      connectionCounts[otherId] = (connectionCounts[otherId] || 0) + 1;
    }

    const mostConnected = Object.entries(connectionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(async ([id, count]) => {
        const entity = await Entity.findOne({ entityId: id });
        return {
          id,
          name: entity?.name || 'Unknown',
          connections: count
        };
      });

    return {
      totalRelationships: relationships.length,
      outgoingRelationships: outgoing.length,
      incomingRelationships: incoming.length,
      relationshipsByType: typeStats,
      averageWeight: Math.round(avgWeight * 100) / 100,
      mostConnectedEntities: await Promise.all(mostConnected)
    };
  }

  /**
   * Clear expired conflict path cache
   * Should be run periodically (e.g., daily cron job)
   */
  async clearExpiredCache() {
    const result = await ConflictPath.deleteMany({
      ttl: { $lt: new Date() }
    });

    logger.info(`[GraphService] Cleared ${result.deletedCount} expired conflict paths from cache`);
    return result.deletedCount;
  }

  /**
   * Rebuild graph indexes for performance
   * Should be run periodically or after bulk imports
   */
  async rebuildIndexes() {
    logger.info('[GraphService] Rebuilding graph indexes...');

    await Promise.all([
      Entity.collection.reIndex(),
      Relationship.collection.reIndex(),
      ConflictPath.collection.reIndex()
    ]);

    logger.info('[GraphService] Graph indexes rebuilt successfully');
  }

  /**
   * Check for lobbying conflicts
   * Detects if mediator has lobbied for organizations involved in dispute
   *
   * @param {String} mediatorId - Mediator's entity ID
   * @param {String} opposingEntityId - Opposing party's entity ID or organization ID
   * @param {Object} options - Additional options
   * @returns {Object} Lobbying conflict analysis
   */
  async checkLobbyingConflicts(mediatorId, opposingEntityId, options = {}) {
    try {
      logger.info(`[GraphService] Checking lobbying conflicts: ${mediatorId} vs ${opposingEntityId}`);

      // Find all LOBBIED_FOR relationships from mediator
      const lobbyingRelationships = await Relationship.find({
        sourceId: mediatorId,
        relationshipType: 'LOBBIED_FOR',
        isActive: true
      });

      // Check for direct lobbying relationship with opposing party
      const directConflict = lobbyingRelationships.find(
        rel => rel.targetId === opposingEntityId
      );

      // Get entities that mediator lobbied for
      const lobbyingClients = await Promise.all(
        lobbyingRelationships.map(async (rel) => {
          const entity = await Entity.findOne({ entityId: rel.targetId });
          return {
            entityId: rel.targetId,
            entityName: entity?.name || 'Unknown',
            entityType: entity?.entityType,
            filings: rel.metadata.filingId ? 1 : 0,
            totalAmount: rel.metadata.amount || 0,
            issueAreas: rel.metadata.issueAreas || [],
            mostRecentFiling: rel.metadata.filingYear,
            filingPeriod: rel.metadata.filingPeriod,
            lastVerified: rel.lastVerified
          };
        })
      );

      // Check for indirect conflicts (mediator lobbied for related entities)
      const relatedEntities = await this.findPaths(opposingEntityId, mediatorId, {
        maxDepth: 2,
        relationshipTypes: ['WORKED_AT', 'SHARED_CASE', 'LOBBIED_FOR']
      });

      const indirectLobbyingConflicts = [];
      for (const path of relatedEntities) {
        const hasLobbyingLink = path.relationships.some(
          rel => rel.type === 'LOBBIED_FOR' && rel.from === mediatorId
        );
        if (hasLobbyingLink) {
          indirectLobbyingConflicts.push({
            path: path.nodes,
            relationships: path.relationships,
            totalWeight: path.totalWeight
          });
        }
      }

      // Calculate lobbying conflict score
      let conflictScore = 0;
      if (directConflict) {
        conflictScore = 50; // Direct lobbying = HIGH risk
      } else if (indirectLobbyingConflicts.length > 0) {
        conflictScore = 25 + (indirectLobbyingConflicts.length * 5); // Indirect = MEDIUM risk
      }

      const hasConflict = conflictScore > 0;
      const conflictLevel = conflictScore >= 50 ? 'HIGH' :
                           conflictScore >= 25 ? 'MEDIUM' : 'LOW';

      return {
        hasLobbyingConflict: hasConflict,
        conflictLevel,
        conflictScore,
        directConflict: directConflict ? {
          organization: directConflict.metadata.registrantName || 'Unknown',
          filingYear: directConflict.metadata.filingYear,
          filingPeriod: directConflict.metadata.filingPeriod,
          issueAreas: directConflict.metadata.issueAreas || [],
          amount: directConflict.metadata.amount,
          filingId: directConflict.metadata.filingId
        } : null,
        indirectConflicts: indirectLobbyingConflicts,
        totalLobbyingClients: lobbyingClients.length,
        lobbyingClients: lobbyingClients.slice(0, 10), // Top 10 clients
        recommendation: hasConflict ?
          'DISCLOSURE REQUIRED: Mediator has lobbied for organization(s) involved in dispute' :
          'No lobbying conflicts detected',
        analyzedAt: new Date()
      };

    } catch (error) {
      logger.error('[GraphService] Error checking lobbying conflicts:', error);
      throw error;
    }
  }
}

module.exports = new GraphService();
