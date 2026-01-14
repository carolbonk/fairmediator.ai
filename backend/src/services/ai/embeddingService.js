/**
 * Embedding Service
 * Generates vector embeddings for mediator profiles using HuggingFace
 * Stores embeddings in MongoDB Atlas for semantic vector search
 */

const hfClient = require('../huggingface/hfClient');
const Mediator = require('../../models/Mediator');
const logger = require('../../config/logger');

class EmbeddingService {
  constructor() {
    this.embeddingModel = 'sentence-transformers/all-MiniLM-L6-v2';
    this.vectorIndexName = 'mediator_vector_search';
    this.dimensions = 384; // all-MiniLM-L6-v2 produces 384-dimensional vectors
  }

  /**
   * Generate text representation of mediator for embedding
   */
  generateMediatorText(mediator) {
    const parts = [];

    // Name and basic info
    parts.push(`Name: ${mediator.name}`);

    // Location
    if (mediator.location) {
      const location = [
        mediator.location.city,
        mediator.location.state,
        mediator.location.country
      ].filter(Boolean).join(', ');
      if (location) parts.push(`Location: ${location}`);
    }

    // Professional experience
    if (mediator.yearsExperience) {
      parts.push(`Experience: ${mediator.yearsExperience} years`);
    }

    // Specializations and practice areas
    if (mediator.specializations?.length) {
      parts.push(`Specializations: ${mediator.specializations.join(', ')}`);
    }

    // Law firm and current employer
    if (mediator.lawFirm) {
      parts.push(`Law Firm: ${mediator.lawFirm}`);
    }
    if (mediator.currentEmployer) {
      parts.push(`Employer: ${mediator.currentEmployer}`);
    }

    // Certifications
    if (mediator.certifications?.length) {
      parts.push(`Certifications: ${mediator.certifications.join(', ')}`);
    }

    // Bar admissions
    if (mediator.barAdmissions?.length) {
      parts.push(`Bar Admissions: ${mediator.barAdmissions.join(', ')}`);
    }

    // Ideology (for transparency)
    if (mediator.ideologyScore !== undefined) {
      const ideologyLabel = Math.abs(mediator.ideologyScore) < 2 ? 'neutral' :
                           mediator.ideologyScore < 0 ? 'liberal-leaning' : 'conservative-leaning';
      parts.push(`Ideology: ${ideologyLabel} (score: ${mediator.ideologyScore})`);
    }

    return parts.join('. ');
  }

  /**
   * Generate embedding for text using HuggingFace
   */
  async generateEmbedding(text) {
    try {
      // Use HuggingFace feature extraction endpoint
      const response = await hfClient.featureExtraction(text, this.embeddingModel);

      // Response is already an array of numbers (embedding vector)
      return response;
    } catch (error) {
      logger.error('Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Index a mediator profile in MongoDB Atlas
   */
  async indexMediator(mediator) {
    try {
      // Generate text representation
      const text = this.generateMediatorText(mediator);

      // Generate embedding
      const embedding = await this.generateEmbedding(text);

      // Update mediator document with embedding
      await Mediator.findByIdAndUpdate(
        mediator._id,
        {
          embedding: embedding,
          embeddingModel: this.embeddingModel,
          embeddingGeneratedAt: new Date()
        },
        { runValidators: false } // Skip validation for performance
      );

      logger.info(`Indexed mediator: ${mediator.name} (${mediator._id})`);
      return { mediatorId: mediator._id, embedding, text };
    } catch (error) {
      logger.error(`Error indexing mediator ${mediator._id}:`, error);
      throw error;
    }
  }

  /**
   * Batch index multiple mediators
   */
  async indexMediators(mediators) {
    let indexed = 0;
    let failed = 0;

    for (const mediator of mediators) {
      try {
        await this.indexMediator(mediator);
        indexed++;
      } catch (error) {
        failed++;
        logger.error(`Failed to index mediator ${mediator._id}:`, error.message);
      }
    }

    logger.info(`Batch indexing complete: ${indexed} indexed, ${failed} failed`);
    return { indexed, failed };
  }

  /**
   * Search for similar mediators using MongoDB Atlas Vector Search
   * NOTE: Requires vector search index to be created in MongoDB Atlas
   */
  async searchSimilar(query, options = {}) {
    try {
      const {
        topK = 10,
        filter = {},
        includeMetadata = true
      } = options;

      // Generate embedding for query
      const queryEmbedding = await this.generateEmbedding(query);

      // Build vector search aggregation pipeline
      const pipeline = [
        {
          $vectorSearch: {
            index: this.vectorIndexName,
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: topK * 10, // Search more candidates for better results
            limit: topK
          }
        },
        {
          $addFields: {
            similarity: { $meta: 'vectorSearchScore' }
          }
        }
      ];

      // Add filters if provided
      if (Object.keys(filter).length > 0) {
        pipeline.push({ $match: filter });
      }

      // Project fields
      if (includeMetadata) {
        pipeline.push({
          $project: {
            _id: 1,
            name: 1,
            location: 1,
            yearsExperience: 1,
            ideologyScore: 1,
            specializations: 1,
            isVerified: 1,
            isActive: 1,
            similarity: 1
          }
        });
      } else {
        pipeline.push({
          $project: {
            _id: 1,
            similarity: 1
          }
        });
      }

      // Execute search
      const results = await Mediator.aggregate(pipeline);

      // Format results
      const formattedResults = results.map(result => ({
        mediatorId: result._id.toString(),
        similarity: result.similarity,
        metadata: includeMetadata ? {
          name: result.name,
          location_city: result.location?.city || '',
          location_state: result.location?.state || '',
          years_experience: result.yearsExperience || 0,
          ideology_score: result.ideologyScore || 0,
          specializations: result.specializations?.join(', ') || '',
          is_verified: result.isVerified || false,
          is_active: result.isActive || true
        } : null
      }));

      logger.info(`Found ${formattedResults.length} similar mediators for query: "${query.substring(0, 50)}..."`);
      return formattedResults;
    } catch (error) {
      logger.error('Error searching for similar mediators:', error);

      // If vector search fails (index not created), return empty results gracefully
      if (error.message?.includes('$vectorSearch') || error.message?.includes('index')) {
        logger.warn('Vector search index not found. Create it in MongoDB Atlas first.');
        return [];
      }

      throw error;
    }
  }

  /**
   * Update mediator embedding
   */
  async updateMediator(mediator) {
    try {
      return await this.indexMediator(mediator);
    } catch (error) {
      logger.error(`Error updating mediator ${mediator._id}:`, error);
      throw error;
    }
  }

  /**
   * Delete mediator embedding
   */
  async deleteMediator(mediatorId) {
    try {
      await Mediator.findByIdAndUpdate(
        mediatorId,
        {
          $unset: {
            embedding: '',
            embeddingModel: '',
            embeddingGeneratedAt: ''
          }
        }
      );

      logger.info(`Deleted embedding for mediator: ${mediatorId}`);
      return { deleted: true, mediatorId };
    } catch (error) {
      logger.error(`Error deleting mediator embedding ${mediatorId}:`, error);
      throw error;
    }
  }

  /**
   * Get embedding statistics
   */
  async getStats() {
    try {
      const total = await Mediator.countDocuments();
      const indexed = await Mediator.countDocuments({ embedding: { $exists: true, $ne: [] } });

      return {
        initialized: true,
        total,
        indexed,
        notIndexed: total - indexed,
        indexName: this.vectorIndexName,
        model: this.embeddingModel,
        dimensions: this.dimensions
      };
    } catch (error) {
      logger.error('Error getting embedding stats:', error);
      return { initialized: false, error: error.message };
    }
  }

  /**
   * Clear all embeddings (use with caution!)
   */
  async clearAll() {
    try {
      const result = await Mediator.updateMany(
        { embedding: { $exists: true } },
        {
          $unset: {
            embedding: '',
            embeddingModel: '',
            embeddingGeneratedAt: ''
          }
        }
      );

      logger.info(`Cleared embeddings from ${result.modifiedCount} mediators`);
      return { cleared: result.modifiedCount };
    } catch (error) {
      logger.error('Error clearing embeddings:', error);
      throw error;
    }
  }

  /**
   * Get instructions for creating vector search index in MongoDB Atlas
   */
  getIndexInstructions() {
    return {
      message: 'Vector search index must be created in MongoDB Atlas UI or using mongosh',
      index: {
        name: this.vectorIndexName,
        type: 'vectorSearch',
        definition: {
          fields: [
            {
              type: 'vector',
              path: 'embedding',
              numDimensions: this.dimensions,
              similarity: 'cosine'
            }
          ]
        }
      },
      instructions: [
        '1. Go to MongoDB Atlas UI: https://cloud.mongodb.com',
        '2. Navigate to your cluster > Browse Collections > fairmediator > mediators',
        '3. Click on "Search" tab > "Create Search Index"',
        '4. Choose "JSON Editor" and paste the definition above',
        '5. Name the index: ' + this.vectorIndexName,
        '6. Click "Create Search Index"'
      ]
    };
  }
}

module.exports = new EmbeddingService();
