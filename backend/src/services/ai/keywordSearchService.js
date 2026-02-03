/**
 * Keyword Search Service
 * BM25-style text search using MongoDB's full-text search
 * Part of hybrid search: combines with vector search for better results
 */

const Mediator = require('../../models/Mediator');
const logger = require('../../config/logger');

class KeywordSearchService {
  /**
   * Search mediators using MongoDB text search (BM25-like)
   * @param {String} query - Search query
   * @param {Object} options - Search options
   * @returns {Array} - Mediators with text scores
   */
  async search(query, options = {}) {
    const {
      topK = 20,
      filters = {},
      minScore = 1.0  // MongoDB text score threshold
    } = options;

    try {
      logger.info(`Keyword search: "${query.substring(0, 50)}..."`);

      // Build MongoDB query
      const searchQuery = {
        $text: { $search: query },
        isActive: true,
        ...this.buildFilters(filters)
      };

      // Execute text search with scoring
      const results = await Mediator.find(
        searchQuery,
        {
          score: { $meta: 'textScore' }  // Get BM25-like score
        }
      )
        .sort({ score: { $meta: 'textScore' } })  // Sort by relevance
        .limit(topK)
        .lean();

      // Filter by minimum score and normalize
      const mediators = results
        .filter(m => m.score >= minScore)
        .map(m => ({
          mediator: m,
          textScore: m.score,
          // Normalize score to 0-1 range (MongoDB text scores are typically 0.5-5.0)
          normalizedScore: Math.min(m.score / 5.0, 1.0)
        }));

      logger.info(`Keyword search found ${mediators.length} results`);

      return mediators;
    } catch (error) {
      logger.error('Keyword search error:', error);
      throw error;
    }
  }

  /**
   * Expand query with synonyms for better recall
   * @param {String} query - Original query
   * @returns {String} - Expanded query
   */
  expandQuery(query) {
    // Synonym mapping for common mediation terms
    const synonyms = {
      // Practice areas
      'family': 'divorce custody marriage',
      'divorce': 'family separation custody',
      'employment': 'workplace labor hr discrimination',
      'business': 'commercial corporate contract',
      'real estate': 'property land housing',
      'contract': 'agreement business commercial',

      // Ideology terms
      'liberal': 'progressive democrat left-wing',
      'conservative': 'republican right-wing traditional',
      'neutral': 'independent unbiased balanced',

      // Experience terms
      'experienced': 'senior veteran seasoned',
      'certified': 'accredited licensed qualified'
    };

    let expandedQuery = query;

    // Add synonyms if query contains key terms
    Object.entries(synonyms).forEach(([term, syns]) => {
      if (query.toLowerCase().includes(term)) {
        expandedQuery += ` ${syns}`;
      }
    });

    return expandedQuery;
  }

  /**
   * Search with query expansion
   * @param {String} query - Search query
   * @param {Object} options - Search options
   * @returns {Array} - Mediators with scores
   */
  async searchWithExpansion(query, options = {}) {
    // Try exact query first
    const exactResults = await this.search(query, options);

    // If few results, try expanded query
    if (exactResults.length < 5) {
      const expandedQuery = this.expandQuery(query);
      logger.info(`Expanding query to: "${expandedQuery}"`);

      const expandedResults = await this.search(expandedQuery, {
        ...options,
        minScore: 0.5  // Lower threshold for expanded queries
      });

      // Merge results, preferring exact matches
      const mergedResults = [...exactResults];
      const existingIds = new Set(exactResults.map(r => r.mediator._id.toString()));

      expandedResults.forEach(result => {
        if (!existingIds.has(result.mediator._id.toString())) {
          mergedResults.push({
            ...result,
            normalizedScore: result.normalizedScore * 0.8  // Reduce score for expanded matches
          });
        }
      });

      return mergedResults.slice(0, options.topK || 20);
    }

    return exactResults;
  }

  /**
   * Build MongoDB filters from search options
   * @param {Object} filters - Filter options
   * @returns {Object} - MongoDB query filters
   */
  buildFilters(filters) {
    const mongoFilters = {};

    // Location filters
    if (filters.state) {
      mongoFilters['location.state'] = filters.state;
    }
    if (filters.city) {
      mongoFilters['location.city'] = new RegExp(filters.city, 'i');
    }

    // Practice area filter
    if (filters.practiceArea) {
      mongoFilters.specializations = {
        $in: Array.isArray(filters.practiceArea)
          ? filters.practiceArea
          : [filters.practiceArea]
      };
    }

    // Experience filter
    if (filters.minExperience) {
      mongoFilters.yearsExperience = { $gte: parseInt(filters.minExperience) };
    }

    // Ideology filter (range)
    if (filters.minIdeology !== undefined || filters.maxIdeology !== undefined) {
      mongoFilters.ideologyScore = {};
      if (filters.minIdeology !== undefined) {
        mongoFilters.ideologyScore.$gte = parseFloat(filters.minIdeology);
      }
      if (filters.maxIdeology !== undefined) {
        mongoFilters.ideologyScore.$lte = parseFloat(filters.maxIdeology);
      }
    }

    // Verified only
    if (filters.verifiedOnly === true) {
      mongoFilters.isVerified = true;
    }

    return mongoFilters;
  }

  /**
   * Get keyword suggestions based on partial query
   * @param {String} partialQuery - Partial search query
   * @param {Number} limit - Max suggestions
   * @returns {Array} - Suggested keywords
   */
  async getSuggestions(partialQuery, limit = 5) {
    try {
      // Find mediators matching partial query
      const regex = new RegExp(partialQuery, 'i');

      const suggestions = await Mediator.aggregate([
        {
          $match: {
            $or: [
              { name: regex },
              { specializations: regex },
              { 'location.city': regex }
            ],
            isActive: true
          }
        },
        {
          $project: {
            suggestions: {
              $concatArrays: [
                [{ type: 'name', value: '$name' }],
                {
                  $map: {
                    input: '$specializations',
                    as: 'spec',
                    in: { type: 'specialization', value: '$$spec' }
                  }
                },
                [{ type: 'location', value: { $concat: ['$location.city', ', ', '$location.state'] } }]
              ]
            }
          }
        },
        { $unwind: '$suggestions' },
        {
          $match: {
            'suggestions.value': regex
          }
        },
        {
          $group: {
            _id: '$suggestions.value',
            type: { $first: '$suggestions.type' },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: limit }
      ]);

      return suggestions.map(s => ({
        text: s._id,
        type: s.type,
        count: s.count
      }));
    } catch (error) {
      logger.error('Error getting suggestions:', error);
      return [];
    }
  }
}

// Singleton instance
const keywordSearchService = new KeywordSearchService();

module.exports = keywordSearchService;
