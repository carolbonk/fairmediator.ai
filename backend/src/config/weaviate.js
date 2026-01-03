/**
 * Weaviate Cloud Configuration
 * FREE TIER: Weaviate Cloud Sandbox (14 days, then upgrades to free persistent)
 */

const weaviate = require('weaviate-ts-client');
const logger = require('./logger');

class WeaviateClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isEnabled = process.env.WEAVIATE_ENABLED === 'true';
  }

  /**
   * Connect to Weaviate Cloud
   */
  async connect() {
    if (!this.isEnabled) {
      logger.info('Weaviate disabled (set WEAVIATE_ENABLED=true to enable)');
      return;
    }

    if (!process.env.WEAVIATE_URL) {
      logger.warn('WEAVIATE_URL not set. Weaviate features disabled.');
      this.isEnabled = false;
      return;
    }

    try {
      // Create Weaviate client
      this.client = weaviate.client({
        scheme: process.env.WEAVIATE_SCHEME || 'https',
        host: process.env.WEAVIATE_URL,
        apiKey: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY || ''),
      });

      // Test connection
      const ready = await this.client.misc.readyChecker().do();

      if (ready) {
        this.isConnected = true;
        logger.info(`Weaviate connected: ${process.env.WEAVIATE_URL}`);

        // Log schema info
        await this.logSchemaInfo();
      }
    } catch (error) {
      logger.error('Failed to connect to Weaviate:', error.message);
      logger.warn('Continuing without Weaviate vector search');
      this.isEnabled = false;
    }
  }

  /**
   * Initialize schema for FairMediator
   */
  async initializeSchema() {
    if (!this.isConnected) {
      throw new Error('Weaviate not connected');
    }

    try {
      // Check if Mediator class exists
      const schema = await this.client.schema.getter().do();
      const mediatorClassExists = schema.classes?.some(c => c.class === 'Mediator');

      if (mediatorClassExists) {
        logger.info('Weaviate schema already initialized');
        return;
      }

      // Create Mediator class
      const mediatorClass = {
        class: 'Mediator',
        description: 'Mediator profiles with vector embeddings for semantic search',
        vectorizer: 'text2vec-huggingface', // Free vectorizer
        moduleConfig: {
          'text2vec-huggingface': {
            model: 'sentence-transformers/all-MiniLM-L6-v2', // Free model
            options: {
              waitForModel: true
            }
          }
        },
        properties: [
          {
            name: 'mediatorId',
            dataType: ['text'],
            description: 'MongoDB ObjectId reference'
          },
          {
            name: 'name',
            dataType: ['text'],
            description: 'Mediator name'
          },
          {
            name: 'bio',
            dataType: ['text'],
            description: 'Professional bio (vectorized for search)'
          },
          {
            name: 'specializations',
            dataType: ['text[]'],
            description: 'Areas of expertise'
          },
          {
            name: 'location_city',
            dataType: ['text'],
            description: 'City'
          },
          {
            name: 'location_state',
            dataType: ['text'],
            description: 'State'
          },
          {
            name: 'yearsExperience',
            dataType: ['int'],
            description: 'Years of mediation experience'
          },
          {
            name: 'ideologyScore',
            dataType: ['number'],
            description: 'Political ideology score (-10 to +10)'
          },
          {
            name: 'isVerified',
            dataType: ['boolean'],
            description: 'Verification status'
          },
          {
            name: 'isActive',
            dataType: ['boolean'],
            description: 'Active status'
          }
        ]
      };

      await this.client.schema.classCreator().withClass(mediatorClass).do();
      logger.info('✅ Weaviate schema initialized');
    } catch (error) {
      logger.error('Failed to initialize Weaviate schema:', error);
      throw error;
    }
  }

  /**
   * Add or update mediator in vector database
   */
  async upsertMediator(mediator) {
    if (!this.isConnected) {
      logger.warn('Weaviate not connected, skipping upsert');
      return null;
    }

    try {
      const properties = {
        mediatorId: mediator._id.toString(),
        name: mediator.name || '',
        bio: mediator.bio || '',
        specializations: mediator.specializations || [],
        location_city: mediator.location?.city || '',
        location_state: mediator.location?.state || '',
        yearsExperience: mediator.yearsExperience || 0,
        ideologyScore: mediator.ideologyScore || 0,
        isVerified: mediator.isVerified || false,
        isActive: mediator.isActive !== undefined ? mediator.isActive : true
      };

      const result = await this.client.data
        .creator()
        .withClassName('Mediator')
        .withProperties(properties)
        .do();

      logger.debug(`Mediator ${mediator.name} added to Weaviate: ${result}`);
      return result;
    } catch (error) {
      logger.error(`Failed to upsert mediator ${mediator.name}:`, error.message);
      return null;
    }
  }

  /**
   * Semantic search for mediators
   */
  async searchMediators(query, options = {}) {
    if (!this.isConnected) {
      logger.warn('Weaviate not connected, skipping search');
      return [];
    }

    const {
      limit = 10,
      filters = {}
    } = options;

    try {
      let queryBuilder = this.client.graphql
        .get()
        .withClassName('Mediator')
        .withFields('mediatorId name bio specializations location_city location_state yearsExperience ideologyScore isVerified')
        .withNearText({ concepts: [query] })
        .withLimit(limit);

      // Add filters
      if (filters.state) {
        queryBuilder = queryBuilder.withWhere({
          path: ['location_state'],
          operator: 'Equal',
          valueText: filters.state
        });
      }

      if (filters.isVerified !== undefined) {
        queryBuilder = queryBuilder.withWhere({
          path: ['isVerified'],
          operator: 'Equal',
          valueBoolean: filters.isVerified
        });
      }

      const result = await queryBuilder.do();

      const mediators = result?.data?.Get?.Mediator || [];

      logger.info(`Weaviate search for "${query}" returned ${mediators.length} results`);

      return mediators;
    } catch (error) {
      logger.error('Weaviate search error:', error.message);
      return [];
    }
  }

  /**
   * Get statistics about vector database
   */
  async getStats() {
    if (!this.isConnected) {
      return {
        enabled: false,
        connected: false
      };
    }

    try {
      const schema = await this.client.schema.getter().do();
      const meta = await this.client.misc.metaGetter().do();

      return {
        enabled: true,
        connected: this.isConnected,
        url: process.env.WEAVIATE_URL,
        classes: schema.classes?.length || 0,
        version: meta.version,
        modules: meta.modules
      };
    } catch (error) {
      logger.error('Failed to get Weaviate stats:', error);
      return {
        enabled: true,
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Log schema information
   */
  async logSchemaInfo() {
    try {
      const schema = await this.client.schema.getter().do();
      const classes = schema.classes?.map(c => c.class).join(', ') || 'None';
      logger.info(`Weaviate classes: ${classes}`);
    } catch (error) {
      logger.debug('Could not fetch schema info:', error.message);
    }
  }

  /**
   * Delete mediator from vector database
   */
  async deleteMediator(mediatorId) {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.data
        .deleter()
        .withClassName('Mediator')
        .withWhere({
          path: ['mediatorId'],
          operator: 'Equal',
          valueText: mediatorId
        })
        .do();

      logger.debug(`Mediator ${mediatorId} deleted from Weaviate`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete mediator ${mediatorId}:`, error.message);
      return false;
    }
  }

  /**
   * Clear all mediators
   */
  async clearAll() {
    if (!this.isConnected) {
      return 0;
    }

    try {
      const result = await this.client.batch
        .objectsBatchDeleter()
        .withClassName('Mediator')
        .withWhere({
          path: ['isActive'],
          operator: 'NotEqual',
          valueBoolean: null // Match all
        })
        .do();

      const deleted = result?.results?.successful || 0;
      logger.info(`Cleared ${deleted} mediators from Weaviate`);
      return deleted;
    } catch (error) {
      logger.error('Failed to clear Weaviate:', error);
      return 0;
    }
  }
}

// Create singleton
const weaviateClient = new WeaviateClient();

module.exports = weaviateClient;
