/**
 * Conflict Analysis API Routes
 *
 * REST API endpoints for graph-based conflict detection and analysis.
 *
 * @module graph_analyzer/api/conflict_routes
 */

const express = require('express');
const router = express.Router();
const graphService = require('../services/graph_service');
const relationshipDetector = require('../services/relationship_detector');
const { Entity, Relationship } = require('../models/graph_schema');
const { validateRiskInputs } = require('../models/risk_calculator');

// Scrapers
const FECScraper = require('../scrapers/fec_scraper');
const PACERScraper = require('../scrapers/pacer_scraper');
const LinkedInScraper = require('../scrapers/linkedin_scraper');
const SenateLDAScraper = require('../scrapers/senate_lda_scraper');

// Services
const DataAggregator = require('../services/data_aggregator');

const logger = require('../../config/logger');
const { authenticate } = require('../../middleware/auth');
const { requirePremium } = require('../../middleware/premiumFeatures');

// Initialize scrapers
const fecScraper = new FECScraper();
const pacerScraper = new PACERScraper();
const linkedinScraper = new LinkedInScraper();
const senateLDAScraper = new SenateLDAScraper();

/**
 * POST /api/graph/check-conflicts
 * Check for conflicts between mediator and opposing party
 *
 * Body: {
 *   mediatorId: string,
 *   opposingPartyId: string,
 *   options: { maxDepth: number, bypassCache: boolean }
 * }
 */
router.post('/check-conflicts', authenticate, async (req, res) => {
  try {
    const { mediatorId, opposingPartyId, options = {} } = req.body;

    // Validate inputs
    const validation = validateRiskInputs({ mediatorId, opposingPartyId });
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    // Perform conflict analysis
    const analysis = await graphService.analyzeConflict(mediatorId, opposingPartyId, options);

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    logger.error('[ConflictRoutes] Error checking conflicts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze conflicts',
      message: error.message
    });
  }
});

/**
 * POST /api/graph/scrape-mediator
 * Scrape data for a mediator from all sources
 *
 * Body: {
 *   mediatorId: string,
 *   mediatorName: string,
 *   sources: string[] (optional - defaults to all)
 * }
 */
router.post('/scrape-mediator', authenticate, requirePremium, async (req, res) => {
  try {
    const { mediatorId, mediatorName, sources = ['fec', 'recap', 'lobbying'] } = req.body;

    if (!mediatorId || !mediatorName) {
      return res.status(400).json({
        success: false,
        error: 'mediatorId and mediatorName are required'
      });
    }

    const results = {};
    const promises = [];

    // Run scrapers in parallel
    if (sources.includes('fec')) {
      promises.push(
        fecScraper.scrape({ mediatorId, mediatorName })
          .then(result => { results.fec = result; })
          .catch(err => { results.fec = { error: err.message }; })
      );
    }

    if (sources.includes('recap')) {
      promises.push(
        pacerScraper.scrape({ mediatorId, mediatorName })
          .then(result => { results.recap = result; })
          .catch(err => { results.recap = { error: err.message }; })
      );
    }

    if (sources.includes('lobbying')) {
      promises.push(
        senateLDAScraper.storeMediatorLobbyingData(mediatorId, mediatorName)
          .then(result => { results.lobbying = result; })
          .catch(err => { results.lobbying = { error: err.message }; })
      );
    }

    await Promise.all(promises);

    // Calculate total relationships created
    const totalStored = Object.values(results).reduce((sum, r) => {
      return sum + (r.stored || 0);
    }, 0);

    res.json({
      success: true,
      data: {
        mediatorId,
        mediatorName,
        results,
        totalRelationships: totalStored
      }
    });

  } catch (error) {
    logger.error('[ConflictRoutes] Error scraping mediator data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to scrape mediator data',
      message: error.message
    });
  }
});

/**
 * POST /api/graph/enrich-linkedin
 * Manual LinkedIn profile enrichment (user provides data)
 *
 * Body: {
 *   mediatorId: string,
 *   linkedinUrl: string,
 *   fullName: string,
 *   mutualConnections: number,
 *   ... other profile data
 * }
 */
router.post('/enrich-linkedin', authenticate, async (req, res) => {
  try {
    const result = await linkedinScraper.enrichProfile(req.body);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('[ConflictRoutes] Error enriching LinkedIn profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enrich LinkedIn profile',
      message: error.message
    });
  }
});

/**
 * GET /api/graph/entity/:id
 * Get entity details and relationships
 */
router.get('/entity/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const [entity, relationships, stats] = await Promise.all([
      Entity.findOne({ entityId: id }),
      graphService.getEntityRelationships(id),
      graphService.getNetworkStats(id)
    ]);

    if (!entity) {
      return res.status(404).json({
        success: false,
        error: 'Entity not found'
      });
    }

    res.json({
      success: true,
      data: {
        entity,
        relationships,
        stats
      }
    });

  } catch (error) {
    logger.error('[ConflictRoutes] Error fetching entity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch entity',
      message: error.message
    });
  }
});

/**
 * GET /api/graph/entities/:type
 * List entities by type
 *
 * Query params: limit, name (search)
 */
router.get('/entities/:type', authenticate, async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 100, name } = req.query;

    const filters = { limit: parseInt(limit) };
    if (name) {
      filters.name = new RegExp(name, 'i'); // Case-insensitive search
    }

    const entities = await graphService.findEntities(type, filters);

    res.json({
      success: true,
      data: {
        type,
        count: entities.length,
        entities
      }
    });

  } catch (error) {
    logger.error('[ConflictRoutes] Error listing entities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list entities',
      message: error.message
    });
  }
});

/**
 * GET /api/graph/paths
 * Find all paths between two entities
 *
 * Query params: sourceId, targetId, maxDepth
 */
router.get('/paths', authenticate, async (req, res) => {
  try {
    const { sourceId, targetId, maxDepth = 3 } = req.query;

    if (!sourceId || !targetId) {
      return res.status(400).json({
        success: false,
        error: 'sourceId and targetId are required'
      });
    }

    const paths = await graphService.findPaths(sourceId, targetId, {
      maxDepth: parseInt(maxDepth)
    });

    res.json({
      success: true,
      data: {
        sourceId,
        targetId,
        pathCount: paths.length,
        paths
      }
    });

  } catch (error) {
    logger.error('[ConflictRoutes] Error finding paths:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find paths',
      message: error.message
    });
  }
});

/**
 * POST /api/graph/detect-duplicates
 * Find potential duplicate entities
 *
 * Body: { entityType: string }
 */
router.post('/detect-duplicates', authenticate, requirePremium, async (req, res) => {
  try {
    const { entityType } = req.body;

    if (!entityType) {
      return res.status(400).json({
        success: false,
        error: 'entityType is required'
      });
    }

    const duplicates = await relationshipDetector.findDuplicateEntities(entityType);

    res.json({
      success: true,
      data: {
        entityType,
        duplicateCount: duplicates.length,
        duplicates
      }
    });

  } catch (error) {
    logger.error('[ConflictRoutes] Error detecting duplicates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect duplicates',
      message: error.message
    });
  }
});

/**
 * POST /api/graph/merge-entities
 * Merge duplicate entities
 *
 * Body: { keepId: string, mergeId: string }
 */
router.post('/merge-entities', authenticate, requirePremium, async (req, res) => {
  try {
    const { keepId, mergeId } = req.body;

    if (!keepId || !mergeId) {
      return res.status(400).json({
        success: false,
        error: 'keepId and mergeId are required'
      });
    }

    const result = await relationshipDetector.mergeDuplicateEntities(keepId, mergeId);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('[ConflictRoutes] Error merging entities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to merge entities',
      message: error.message
    });
  }
});

/**
 * GET /api/graph/stats
 * Get overall graph statistics
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const [entityCount, relationshipCount, conflictPathCount] = await Promise.all([
      Entity.countDocuments(),
      Relationship.countDocuments({ isActive: true }),
      require('../models/graph_schema').ConflictPath.countDocuments()
    ]);

    // Count by entity type
    const entityTypes = await Entity.aggregate([
      { $group: { _id: '$entityType', count: { $sum: 1 } } }
    ]);

    // Count by relationship type
    const relationshipTypes = await Relationship.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$relationshipType', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalEntities: entityCount,
        totalRelationships: relationshipCount,
        cachedConflictPaths: conflictPathCount,
        entityTypeBreakdown: entityTypes.reduce((acc, { _id, count }) => {
          acc[_id] = count;
          return acc;
        }, {}),
        relationshipTypeBreakdown: relationshipTypes.reduce((acc, { _id, count }) => {
          acc[_id] = count;
          return acc;
        }, {})
      }
    });

  } catch (error) {
    logger.error('[ConflictRoutes] Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch graph statistics',
      message: error.message
    });
  }
});

/**
 * GET /api/graph/mediator-profile/:mediatorId
 * Get comprehensive mediator profile with aggregated data
 *
 * Query params: startDate, endDate (optional)
 */
router.get('/mediator-profile/:mediatorId', authenticate, async (req, res) => {
  try {
    const { mediatorId } = req.params;
    const { startDate, endDate } = req.query;

    const options = {};
    if (startDate) options.startDate = new Date(startDate);
    if (endDate) options.endDate = new Date(endDate);

    const profile = await DataAggregator.buildMediatorProfile(mediatorId, options);

    res.json({
      success: true,
      data: profile
    });

  } catch (error) {
    logger.error('[ConflictRoutes] Error fetching mediator profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mediator profile',
      message: error.message
    });
  }
});

/**
 * GET /api/graph/industry-trends/:industry
 * Get historical trends for a specific industry
 *
 * Query params: startDate, endDate (optional)
 */
router.get('/industry-trends/:industry', authenticate, async (req, res) => {
  try {
    const { industry } = req.params;
    const { startDate, endDate } = req.query;

    const options = {};
    if (startDate) options.startDate = new Date(startDate);
    if (endDate) options.endDate = new Date(endDate);

    const trends = await DataAggregator.getIndustryTrends(industry, options);

    res.json({
      success: true,
      data: trends
    });

  } catch (error) {
    logger.error('[ConflictRoutes] Error fetching industry trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch industry trends',
      message: error.message
    });
  }
});

/**
 * POST /api/graph/check-lobbying-conflicts
 * Check specifically for lobbying conflicts
 *
 * Body: {
 *   mediatorId: string,
 *   opposingEntityId: string
 * }
 */
router.post('/check-lobbying-conflicts', authenticate, async (req, res) => {
  try {
    const { mediatorId, opposingEntityId } = req.body;

    if (!mediatorId || !opposingEntityId) {
      return res.status(400).json({
        success: false,
        error: 'mediatorId and opposingEntityId are required'
      });
    }

    const lobbyingAnalysis = await graphService.checkLobbyingConflicts(mediatorId, opposingEntityId);

    res.json({
      success: true,
      data: lobbyingAnalysis
    });

  } catch (error) {
    logger.error('[ConflictRoutes] Error checking lobbying conflicts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check lobbying conflicts',
      message: error.message
    });
  }
});

/**
 * DELETE /api/graph/cache/clear
 * Clear expired conflict path cache
 */
router.delete('/cache/clear', authenticate, requirePremium, async (req, res) => {
  try {
    const deletedCount = await graphService.clearExpiredCache();

    res.json({
      success: true,
      data: {
        deletedCount,
        message: `Cleared ${deletedCount} expired conflict paths`
      }
    });

  } catch (error) {
    logger.error('[ConflictRoutes] Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

module.exports = router;
