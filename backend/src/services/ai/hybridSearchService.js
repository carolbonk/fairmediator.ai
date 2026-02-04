/**
 * Hybrid Search Service
 * Combines vector search (semantic) with keyword search (BM25)
 * Formula: hybrid_score = α * vector_score + β * keyword_score
 * Default weights: α=0.7 (vector), β=0.3 (keyword)
 */

const embeddingService = require('./embeddingService');
const keywordSearchService = require('./keywordSearchService');
const queryExpansion = require('./queryExpansion');
const Mediator = require('../../models/Mediator');
const logger = require('../../config/logger');

class HybridSearchService {
  constructor() {
    // Weights for hybrid scoring (configurable via environment)
    this.vectorWeight = parseFloat(process.env.HYBRID_VECTOR_WEIGHT) || 0.7;
    this.keywordWeight = parseFloat(process.env.HYBRID_KEYWORD_WEIGHT) || 0.3;

    // Validate weights sum to 1.0
    const sum = this.vectorWeight + this.keywordWeight;
    if (Math.abs(sum - 1.0) > 0.01) {
      logger.warn(`Hybrid weights don't sum to 1.0: ${sum}. Normalizing...`);
      this.vectorWeight = this.vectorWeight / sum;
      this.keywordWeight = this.keywordWeight / sum;
    }
  }

  /**
   * Hybrid search: combines vector and keyword search
   * PHASE 2 ENHANCEMENT: Now includes query expansion with legal synonyms
   * @param {String} query - Search query
   * @param {Object} options - Search options
   * @returns {Object} - Search results with hybrid scores
   */
  async search(query, options = {}) {
    const {
      topK = 20,
      filters = {},
      vectorTopK = 30,   // Get more from vector search (will be merged)
      keywordTopK = 30,  // Get more from keyword search (will be merged)
      minVectorScore = 0.5,
      minKeywordScore = 1.0,
      useQueryExpansion = true // NEW: Enable query expansion
    } = options;

    try {
      logger.info(`Hybrid search: "${query.substring(0, 50)}..."`);
      const startTime = Date.now();

      // NEW: Expand query with legal synonyms
      let searchQuery = query;
      let queryExpanded = null;

      if (useQueryExpansion) {
        queryExpanded = queryExpansion.expandQuery(query, {
          maxExpansions: 5,
          includeSynonyms: true,
          includeAbbreviations: true,
          practiceAreaExpansion: true
        });

        // Use expanded terms for keyword search (better recall)
        searchQuery = queryExpansion.toSearchQuery(queryExpanded, 'OR');

        logger.info(`Query expanded: ${queryExpanded.expansionCount} additional terms`, {
          original: query,
          expanded: queryExpanded.expanded.slice(0, 5) // Log first 5
        });
      }

      // Run vector and keyword search in parallel
      const [vectorResults, keywordResults] = await Promise.all([
        // Vector search (semantic similarity) - use ORIGINAL query for embeddings
        embeddingService.searchSimilar(query, {
          topK: vectorTopK,
          filter: this.buildMongoFilter(filters)
        }).catch(err => {
          logger.warn('Vector search failed, falling back to keyword only:', err.message);
          return [];
        }),

        // Keyword search (BM25-style) - use EXPANDED query for better recall
        keywordSearchService.search(searchQuery, {
          topK: keywordTopK,
          filters,
          minScore: minKeywordScore
        }).catch(err => {
          logger.warn('Keyword search failed, falling back to vector only:', err.message);
          return [];
        })
      ]);

      logger.info(`Vector: ${vectorResults.length} results, Keyword: ${keywordResults.length} results`);

      // Merge and score results
      const mergedResults = this.mergeAndScore(vectorResults, keywordResults, {
        minVectorScore,
        minKeywordScore
      });

      // Sort by hybrid score (descending)
      mergedResults.sort((a, b) => b.hybridScore - a.hybridScore);

      // Return top K
      const finalResults = mergedResults.slice(0, topK);

      const elapsedTime = Date.now() - startTime;
      logger.info(`Hybrid search complete: ${finalResults.length} results in ${elapsedTime}ms`);

      return {
        results: finalResults,
        metadata: {
          query,
          totalResults: finalResults.length,
          vectorResults: vectorResults.length,
          keywordResults: keywordResults.length,
          mergedResults: mergedResults.length,
          weights: {
            vector: this.vectorWeight,
            keyword: this.keywordWeight
          },
          // NEW: Query expansion metadata
          queryExpansion: queryExpanded ? {
            original: queryExpanded.original,
            expandedTerms: queryExpanded.expanded,
            expansionCount: queryExpanded.expansionCount,
            relatedTerms: queryExpanded.relatedTerms
          } : null,
          elapsedMs: elapsedTime
        }
      };
    } catch (error) {
      logger.error('Hybrid search error:', error);
      throw error;
    }
  }

  /**
   * Merge vector and keyword results with hybrid scoring
   * @param {Array} vectorResults - Results from vector search
   * @param {Array} keywordResults - Results from keyword search
   * @param {Object} options - Scoring options
   * @returns {Array} - Merged results with hybrid scores
   */
  mergeAndScore(vectorResults, keywordResults, options = {}) {
    const {
      minVectorScore = 0.5,
      minKeywordScore = 1.0
    } = options;

    // Create maps for quick lookup
    const vectorMap = new Map(
      vectorResults
        .filter(r => r.similarity >= minVectorScore)
        .map(r => [r.mediatorId.toString(), r])
    );

    const keywordMap = new Map(
      keywordResults
        .filter(r => r.textScore >= minKeywordScore)
        .map(r => [r.mediator._id.toString(), r])
    );

    // Get all unique mediator IDs
    const allIds = new Set([...vectorMap.keys(), ...keywordMap.keys()]);

    // Calculate hybrid scores
    const hybridResults = [];

    allIds.forEach(id => {
      const vectorResult = vectorMap.get(id);
      const keywordResult = keywordMap.get(id);

      // Normalized scores (0-1 range)
      const vectorScore = vectorResult ? vectorResult.similarity : 0;
      const keywordScore = keywordResult ? keywordResult.normalizedScore : 0;

      // Hybrid score: weighted combination
      const hybridScore = (this.vectorWeight * vectorScore) + (this.keywordWeight * keywordScore);

      // Only include if we have at least one result
      if (vectorResult || keywordResult) {
        hybridResults.push({
          mediatorId: id,
          mediator: vectorResult?.mediator || keywordResult?.mediator,
          hybridScore,
          vectorScore,
          keywordScore,
          vectorRank: vectorResult ? vectorResults.indexOf(vectorResult) + 1 : null,
          keywordRank: keywordResult ? keywordResults.indexOf(keywordResult) + 1 : null,
          foundIn: {
            vector: !!vectorResult,
            keyword: !!keywordResult
          }
        });
      }
    });

    return hybridResults;
  }

  /**
   * Search with ideology boost
   * Boosts scores for mediators matching preferred ideology
   * @param {String} query - Search query
   * @param {Object} options - Search options with ideologyPreference
   * @returns {Object} - Search results with ideology boost applied
   */
  async searchWithIdeologyBoost(query, options = {}) {
    const {
      ideologyPreference = 'neutral',  // 'liberal', 'conservative', 'neutral'
      ideologyBoostFactor = 0.2,       // 20% boost for ideology matches
      ...searchOptions
    } = options;

    // Perform hybrid search
    const searchResults = await this.search(query, searchOptions);

    // Apply ideology boost
    if (ideologyPreference !== 'neutral') {
      searchResults.results.forEach(result => {
        const mediatorIdeology = result.mediator.ideologyScore;

        // Determine if mediator matches preference
        const matchesIdeology =
          (ideologyPreference === 'liberal' && mediatorIdeology < -2) ||
          (ideologyPreference === 'conservative' && mediatorIdeology > 2) ||
          (ideologyPreference === 'neutral' && Math.abs(mediatorIdeology) <= 2);

        if (matchesIdeology) {
          // Boost hybrid score
          result.originalScore = result.hybridScore;
          result.hybridScore = Math.min(result.hybridScore * (1 + ideologyBoostFactor), 1.0);
          result.ideologyBoostApplied = true;
        }
      });

      // Re-sort after boosting
      searchResults.results.sort((a, b) => b.hybridScore - a.hybridScore);

      searchResults.metadata.ideologyBoost = {
        preference: ideologyPreference,
        boostFactor: ideologyBoostFactor,
        boostedResults: searchResults.results.filter(r => r.ideologyBoostApplied).length
      };
    }

    return searchResults;
  }

  /**
   * Build MongoDB filter from search options
   * @param {Object} filters - Filter options
   * @returns {Object} - MongoDB query filter
   */
  buildMongoFilter(filters) {
    const mongoFilter = {};

    if (filters.state) {
      mongoFilter['location.state'] = filters.state;
    }

    if (filters.city) {
      mongoFilter['location.city'] = new RegExp(filters.city, 'i');
    }

    if (filters.practiceArea) {
      mongoFilter.specializations = {
        $in: Array.isArray(filters.practiceArea)
          ? filters.practiceArea
          : [filters.practiceArea]
      };
    }

    if (filters.minExperience) {
      mongoFilter.yearsExperience = { $gte: parseInt(filters.minExperience) };
    }

    if (filters.minIdeology !== undefined || filters.maxIdeology !== undefined) {
      mongoFilter.ideologyScore = {};
      if (filters.minIdeology !== undefined) {
        mongoFilter.ideologyScore.$gte = parseFloat(filters.minIdeology);
      }
      if (filters.maxIdeology !== undefined) {
        mongoFilter.ideologyScore.$lte = parseFloat(filters.maxIdeology);
      }
    }

    if (filters.verifiedOnly === true) {
      mongoFilter.isVerified = true;
    }

    return mongoFilter;
  }

  /**
   * Update hybrid weights (for A/B testing)
   * @param {Number} vectorWeight - Weight for vector search (0-1)
   * @param {Number} keywordWeight - Weight for keyword search (0-1)
   */
  setWeights(vectorWeight, keywordWeight) {
    if (Math.abs((vectorWeight + keywordWeight) - 1.0) > 0.01) {
      throw new Error('Weights must sum to 1.0');
    }

    this.vectorWeight = vectorWeight;
    this.keywordWeight = keywordWeight;

    logger.info(`Hybrid weights updated: vector=${vectorWeight}, keyword=${keywordWeight}`);
  }

  /**
   * Get current configuration
   * @returns {Object} - Current weights and settings
   */
  getConfig() {
    return {
      vectorWeight: this.vectorWeight,
      keywordWeight: this.keywordWeight,
      description: 'Hybrid search combining vector (semantic) and keyword (BM25) search'
    };
  }
}

// Singleton instance
const hybridSearchService = new HybridSearchService();

module.exports = hybridSearchService;
