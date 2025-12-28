/**
 * Embedding Service
 * Generates vector embeddings for mediator profiles using HuggingFace
 * Stores embeddings in ChromaDB for semantic search
 */

const { ChromaClient } = require('chromadb');
const hfClient = require('../huggingface/hfClient');
const logger = require('../../config/logger');

class EmbeddingService {
  constructor() {
    this.client = null;
    this.collection = null;
    this.collectionName = 'mediator_profiles';
    this.embeddingModel = 'sentence-transformers/all-MiniLM-L6-v2';
    this.initialized = false;
  }

  /**
   * Initialize ChromaDB client and collection
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize ChromaDB client
      this.client = new ChromaClient({
        path: process.env.CHROMADB_URL || 'http://localhost:8000'
      });

      // Create or get collection
      try {
        this.collection = await this.client.getOrCreateCollection({
          name: this.collectionName,
          metadata: {
            description: 'Mediator profile embeddings for semantic search',
            model: this.embeddingModel
          }
        });
        logger.info(`ChromaDB collection "${this.collectionName}" ready`);
      } catch (error) {
        logger.error('Error creating/getting collection:', error);
        throw error;
      }

      this.initialized = true;
    } catch (error) {
      logger.error('Failed to initialize ChromaDB:', error);
      // Don't throw - allow system to run without vector search
      this.initialized = false;
    }
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
   * Index a mediator profile in ChromaDB
   */
  async indexMediator(mediator) {
    await this.initialize();

    if (!this.initialized || !this.collection) {
      logger.warn('ChromaDB not initialized, skipping indexing');
      return null;
    }

    try {
      // Generate text representation
      const text = this.generateMediatorText(mediator);

      // Generate embedding
      const embedding = await this.generateEmbedding(text);

      // Prepare metadata
      const metadata = {
        mediator_id: mediator._id.toString(),
        name: mediator.name,
        location_city: mediator.location?.city || '',
        location_state: mediator.location?.state || '',
        years_experience: mediator.yearsExperience || 0,
        ideology_score: mediator.ideologyScore || 0,
        specializations: mediator.specializations?.join(', ') || '',
        is_verified: mediator.isVerified || false,
        is_active: mediator.isActive || true
      };

      // Add to collection
      await this.collection.add({
        ids: [mediator._id.toString()],
        embeddings: [embedding],
        documents: [text],
        metadatas: [metadata]
      });

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
    await this.initialize();

    if (!this.initialized || !this.collection) {
      logger.warn('ChromaDB not initialized, skipping batch indexing');
      return { indexed: 0, failed: 0 };
    }

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
   * Search for similar mediators using semantic search
   */
  async searchSimilar(query, options = {}) {
    await this.initialize();

    if (!this.initialized || !this.collection) {
      logger.warn('ChromaDB not initialized, returning empty results');
      return [];
    }

    try {
      const {
        topK = 10,
        filter = null,
        includeMetadata = true
      } = options;

      // Generate embedding for query
      const queryEmbedding = await this.generateEmbedding(query);

      // Search in ChromaDB
      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: topK,
        where: filter,
        include: includeMetadata ? ['metadatas', 'documents', 'distances'] : ['distances']
      });

      // Format results
      const formattedResults = [];
      if (results.ids && results.ids[0]) {
        for (let i = 0; i < results.ids[0].length; i++) {
          formattedResults.push({
            mediatorId: results.ids[0][i],
            distance: results.distances[0][i],
            similarity: 1 - results.distances[0][i], // Convert distance to similarity
            metadata: includeMetadata ? results.metadatas[0][i] : null,
            document: includeMetadata ? results.documents[0][i] : null
          });
        }
      }

      logger.info(`Found ${formattedResults.length} similar mediators for query: "${query.substring(0, 50)}..."`);
      return formattedResults;
    } catch (error) {
      logger.error('Error searching for similar mediators:', error);
      throw error;
    }
  }

  /**
   * Update mediator embedding
   */
  async updateMediator(mediator) {
    await this.initialize();

    if (!this.initialized || !this.collection) {
      logger.warn('ChromaDB not initialized, skipping update');
      return null;
    }

    try {
      // Delete old embedding
      await this.deleteMediator(mediator._id.toString());

      // Add new embedding
      return await this.indexMediator(mediator);
    } catch (error) {
      logger.error(`Error updating mediator ${mediator._id}:`, error);
      throw error;
    }
  }

  /**
   * Delete mediator from index
   */
  async deleteMediator(mediatorId) {
    await this.initialize();

    if (!this.initialized || !this.collection) {
      logger.warn('ChromaDB not initialized, skipping delete');
      return null;
    }

    try {
      await this.collection.delete({
        ids: [mediatorId.toString()]
      });

      logger.info(`Deleted mediator from index: ${mediatorId}`);
      return { deleted: true, mediatorId };
    } catch (error) {
      logger.error(`Error deleting mediator ${mediatorId}:`, error);
      throw error;
    }
  }

  /**
   * Get collection statistics
   */
  async getStats() {
    await this.initialize();

    if (!this.initialized || !this.collection) {
      return { initialized: false, count: 0 };
    }

    try {
      const count = await this.collection.count();
      return {
        initialized: true,
        collectionName: this.collectionName,
        count,
        model: this.embeddingModel
      };
    } catch (error) {
      logger.error('Error getting collection stats:', error);
      return { initialized: false, error: error.message };
    }
  }

  /**
   * Clear entire collection (use with caution!)
   */
  async clearAll() {
    await this.initialize();

    if (!this.initialized || !this.collection) {
      logger.warn('ChromaDB not initialized, nothing to clear');
      return { cleared: 0 };
    }

    try {
      await this.client.deleteCollection({ name: this.collectionName });
      this.collection = await this.client.createCollection({
        name: this.collectionName,
        metadata: {
          description: 'Mediator profile embeddings for semantic search',
          model: this.embeddingModel
        }
      });

      logger.info('Cleared all embeddings from collection');
      return { cleared: true };
    } catch (error) {
      logger.error('Error clearing collection:', error);
      throw error;
    }
  }
}

module.exports = new EmbeddingService();
