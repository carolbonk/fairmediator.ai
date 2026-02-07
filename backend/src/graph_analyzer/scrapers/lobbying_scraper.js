/**
 * Lobbying Scraper - OpenSecrets API
 *
 * Fetches lobbying disclosure data from OpenSecrets API
 * to identify corporate relationships and political influence.
 *
 * API Documentation: https://www.opensecrets.org/api/?method=getLobbyists
 * Rate Limit: No official limit (recommended: 60 req/min)
 * Cost: FREE with API key
 *
 * @module graph_analyzer/scrapers/lobbying_scraper
 */

const axios = require('axios');
const BaseScraper = require('./base_scraper');
const logger = require('../../config/logger');
const { Entity, Relationship } = require('../models/graph_schema');

const OPENSECRETS_API_BASE = 'https://www.opensecrets.org/api';
const OPENSECRETS_API_KEY = process.env.OPENSECRETS_API_KEY || ''; // Get free key at opensecrets.org

class LobbyingScraper extends BaseScraper {
  constructor() {
    super('OpenSecrets Lobbying Scraper', {
      rateLimit: 60, // 60 requests per minute
      timeout: 30000
    });
  }

  /**
   * Search for lobbyists by name
   *
   * @param {String} name - Full name of lobbyist
   * @param {Number} year - Year to search (default: current year)
   * @returns {Array} Array of lobbying records
   */
  async searchLobbyists(name, year = new Date().getFullYear()) {
    if (!OPENSECRETS_API_KEY) {
      logger.warn('[OpenSecrets] No API key configured, skipping lobbying data');
      return [];
    }

    const params = {
      method: 'getLobbyists',
      name,
      year,
      apikey: OPENSECRETS_API_KEY,
      output: 'json'
    };

    return this.retryRequest(async () => {
      const response = await axios.get(OPENSECRETS_API_BASE, {
        params,
        timeout: this.timeout
      });

      if (!response.data || !response.data.response) {
        throw new Error('Invalid OpenSecrets API response');
      }

      const lobbyists = response.data.response.lobbyist || [];
      const results = Array.isArray(lobbyists) ? lobbyists : [lobbyists];

      logger.info(`[OpenSecrets] Found ${results.length} lobbying records for ${name}`);
      return results;
    }, `lobbyists for ${name}`);
  }

  /**
   * Get lobbying clients for a specific lobbyist
   *
   * @param {String} lobbyistId - OpenSecrets lobbyist ID
   * @param {Number} year - Year to search
   * @returns {Array} Array of client records
   */
  async getLobbyistClients(lobbyistId, year = new Date().getFullYear()) {
    if (!OPENSECRETS_API_KEY) {
      return [];
    }

    const params = {
      method: 'getLobbyistClients',
      id: lobbyistId,
      year,
      apikey: OPENSECRETS_API_KEY,
      output: 'json'
    };

    return this.retryRequest(async () => {
      const response = await axios.get(OPENSECRETS_API_BASE, {
        params,
        timeout: this.timeout
      });

      if (!response.data || !response.data.response) {
        throw new Error('Invalid OpenSecrets API response');
      }

      const clients = response.data.response.client || [];
      const results = Array.isArray(clients) ? clients : [clients];

      logger.info(`[OpenSecrets] Found ${results.length} clients for lobbyist ${lobbyistId}`);
      return results;
    }, `clients for lobbyist ${lobbyistId}`);
  }

  /**
   * Find common lobbying clients between two individuals
   *
   * @param {String} name1 - First individual's name
   * @param {String} name2 - Second individual's name
   * @param {Number} year - Year to search
   * @returns {Array} Common client records
   */
  async findCommonClients(name1, name2, year = new Date().getFullYear()) {
    const [lobbyists1, lobbyists2] = await Promise.all([
      this.searchLobbyists(name1, year),
      this.searchLobbyists(name2, year)
    ]);

    if (lobbyists1.length === 0 || lobbyists2.length === 0) {
      return [];
    }

    // Get clients for each lobbyist
    const [clients1, clients2] = await Promise.all([
      this.getLobbyistClients(lobbyists1[0]['@attributes'].uniq_id, year),
      this.getLobbyistClients(lobbyists2[0]['@attributes'].uniq_id, year)
    ]);

    // Find common clients by name
    const commonClients = clients1.filter(c1 =>
      clients2.some(c2 => {
        const name1 = this.normalizeEntityName(c1['@attributes'].client_name);
        const name2 = this.normalizeEntityName(c2['@attributes'].client_name);
        return name1 === name2;
      })
    );

    logger.info(`[OpenSecrets] Found ${commonClients.length} common lobbying clients`);
    return commonClients;
  }

  /**
   * Store lobbying data in graph database
   *
   * @param {String} mediatorId - Mediator's entity ID
   * @param {String} mediatorName - Mediator's full name
   * @param {Object} options - Search options (year, etc.)
   * @returns {Object} Summary of stored relationships
   */
  async storeLobbyingData(mediatorId, mediatorName, options = {}) {
    try {
      const year = options.year || new Date().getFullYear();
      const lobbyists = await this.searchLobbyists(mediatorName, year);

      if (lobbyists.length === 0) {
        logger.info(`[OpenSecrets] No lobbying records found for ${mediatorName}`);
        return { stored: 0, clients: [] };
      }

      // Create entity for mediator
      await Entity.findOneAndUpdate(
        { entityId: mediatorId },
        {
          entityType: 'Mediator',
          entityId: mediatorId,
          name: mediatorName,
          dataSource: 'OPENSECRETS',
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );

      const storedRelationships = [];

      // Get clients for primary lobbyist record
      const primaryLobbyist = lobbyists[0];
      const lobbyistId = primaryLobbyist['@attributes'].uniq_id;
      const clients = await this.getLobbyistClients(lobbyistId, year);

      // Store each client as a contractor entity
      for (const client of clients) {
        const clientAttrs = client['@attributes'];
        const contractorId = `contractor_${this.normalizeEntityName(clientAttrs.client_name)}`;

        // Create entity for contractor/client
        await Entity.findOneAndUpdate(
          { entityId: contractorId },
          {
            entityType: 'Contractor',
            entityId: contractorId,
            name: clientAttrs.client_name,
            metadata: {
              lobbyingFirm: clientAttrs.firm_name,
              totalSpending: clientAttrs.total,
              year: clientAttrs.year,
              registrantName: clientAttrs.registrant_name
            },
            dataSource: 'OPENSECRETS',
            lastUpdated: new Date()
          },
          { upsert: true, new: true }
        );

        // Create LOBBIED_FOR relationship
        const relationship = await Relationship.findOneAndUpdate(
          {
            sourceId: mediatorId,
            targetId: contractorId,
            relationshipType: 'LOBBIED_FOR'
          },
          {
            sourceType: 'Mediator',
            sourceId: mediatorId,
            targetType: 'Contractor',
            targetId: contractorId,
            relationshipType: 'LOBBIED_FOR',
            weight: 7, // Lobbying relationship = moderate-high weight
            metadata: {
              year: clientAttrs.year,
              firm: clientAttrs.firm_name,
              totalSpending: clientAttrs.total,
              registrant: clientAttrs.registrant_name
            },
            confidence: 1.0, // OpenSecrets data is verified
            dataSource: 'OPENSECRETS',
            lastVerified: new Date(),
            isActive: true
          },
          { upsert: true, new: true }
        );

        storedRelationships.push(relationship);
      }

      logger.info(`[OpenSecrets] Stored ${storedRelationships.length} lobbying relationships for ${mediatorName}`);

      return {
        stored: storedRelationships.length,
        clients: clients.slice(0, 10), // Return top 10 for display
        totalClients: clients.length
      };

    } catch (error) {
      logger.error(`[OpenSecrets] Error storing lobbying data for ${mediatorName}:`, error);
      throw error;
    }
  }

  /**
   * Main scrape method - implements BaseScraper interface
   *
   * @param {Object} params - Scraping parameters
   * @returns {Object} Scraping results
   */
  async scrape(params) {
    this.validateFields(params, ['mediatorId', 'mediatorName'], 'scrape params');
    return this.storeLobbyingData(params.mediatorId, params.mediatorName, params.options || {});
  }
}

module.exports = LobbyingScraper;
