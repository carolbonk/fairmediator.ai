/**
 * Senate LDA Scraper - Federal Lobbying Disclosure Act Data
 *
 * Fetches lobbying disclosure data from the Senate's public LDA database.
 * Free, unlimited access to all federal lobbying registrations and activities.
 *
 * API Documentation: https://lda.senate.gov/api/v1/
 * Data Source: Senate Office of Public Records
 * Rate Limit: No official limit (be respectful - 60 req/min recommended)
 * Cost: FREE
 *
 * @module graph_analyzer/scrapers/senate_lda_scraper
 */

const axios = require('axios');
const BaseScraper = require('./base_scraper');
const logger = require('../../config/logger');
const { Entity, Relationship } = require('../models/graph_schema');

const SENATE_LDA_API_BASE = 'https://lda.senate.gov/api/v1';

class SenateLDAScraper extends BaseScraper {
  constructor() {
    super('Senate LDA Scraper', {
      rateLimit: 60, // 60 requests per minute
      timeout: 30000
    });
  }

  /**
   * Search for lobbyist by name
   * Uses filings endpoint with lobbyist_name parameter
   *
   * @param {String} lobbyistName - Full name or last name of lobbyist
   * @returns {Array} Array of lobbyist registration records
   */
  async searchLobbyist(lobbyistName) {
    await this.checkRateLimit();

    try {
      const response = await axios.get(`${SENATE_LDA_API_BASE}/filings/`, {
        params: {
          lobbyist_name: lobbyistName,
          page_size: 100 // Get up to 100 results
        },
        timeout: this.timeout
      });

      logger.info(`[SenateLDA] Found ${response.data.count || 0} total filings for lobbyist: ${lobbyistName}`);

      // Extract unique lobbyists from filings
      const lobbyists = new Map();

      (response.data.results || []).forEach(filing => {
        filing.lobbying_activities?.forEach(activity => {
          activity.lobbyists?.forEach(lobbyist => {
            const fullName = `${lobbyist.lobbyist.first_name} ${lobbyist.lobbyist.last_name}`;
            if (!lobbyists.has(lobbyist.lobbyist.id)) {
              lobbyists.set(lobbyist.lobbyist.id, {
                lobbyist_id: lobbyist.lobbyist.id,
                name: fullName,
                first_name: lobbyist.lobbyist.first_name,
                last_name: lobbyist.lobbyist.last_name,
                covered_position: lobbyist.covered_position
              });
            }
          });
        });
      });

      return Array.from(lobbyists.values());

    } catch (error) {
      logger.error(`[SenateLDA] Error searching lobbyist ${lobbyistName}:`, error.message);
      return []; // Return empty array on error
    }
  }

  /**
   * Get lobbying filings for a specific lobbyist by name
   * Note: LDA API doesn't support lobbyist_id filtering, use lobbyist_name instead
   *
   * @param {String} lobbyistName - Lobbyist's full name
   * @param {Object} options - Query options (year, quarter)
   * @returns {Array} Array of filing records
   */
  async getLobbyistFilings(lobbyistName, options = {}) {
    await this.checkRateLimit();

    const params = {
      lobbyist_name: lobbyistName,
      page_size: 100
    };

    if (options.year) params.filing_year = options.year;
    if (options.quarter) params.filing_period = options.quarter;

    try {
      const response = await axios.get(`${SENATE_LDA_API_BASE}/filings/`, {
        params,
        timeout: this.timeout
      });

      logger.info(`[SenateLDA] Found ${response.data.count || 0} filings for lobbyist: ${lobbyistName}`);

      return response.data.results || [];

    } catch (error) {
      logger.error(`[SenateLDA] Error fetching filings for lobbyist ${lobbyistName}:`, error.message);
      return [];
    }
  }

  /**
   * Search for client organization
   * Uses filings endpoint with client_name parameter
   *
   * @param {String} clientName - Name of client organization
   * @returns {Array} Array of client records
   */
  async searchClient(clientName) {
    await this.checkRateLimit();

    try {
      const response = await axios.get(`${SENATE_LDA_API_BASE}/filings/`, {
        params: {
          client_name: clientName,
          page_size: 100
        },
        timeout: this.timeout
      });

      logger.info(`[SenateLDA] Found ${response.data.count || 0} filings for client: ${clientName}`);

      // Extract unique clients from filings
      const clients = new Map();

      (response.data.results || []).forEach(filing => {
        if (filing.client) {
          if (!clients.has(filing.client.id)) {
            clients.set(filing.client.id, filing.client);
          }
        }
      });

      return Array.from(clients.values());

    } catch (error) {
      logger.error(`[SenateLDA] Error searching client ${clientName}:`, error.message);
      return [];
    }
  }

  /**
   * Get all filings for a specific client
   *
   * @param {String} clientId - LDA client ID
   * @param {Object} options - Query options
   * @returns {Array} Array of filing records
   */
  async getClientFilings(clientId, options = {}) {
    await this.checkRateLimit();

    const params = {
      client_id: clientId
    };

    if (options.year) params.filing_year = options.year;
    if (options.quarter) params.filing_period = options.quarter;

    try {
      const response = await axios.get(`${SENATE_LDA_API_BASE}/filings/`, {
        params,
        timeout: this.timeout
      });

      logger.info(`[SenateLDA] Found ${response.data.count || 0} filings for client ID: ${clientId}`);

      return response.data.results || [];

    } catch (error) {
      logger.error(`[SenateLDA] Error fetching filings for client ${clientId}:`, error.message);
      throw error;
    }
  }

  /**
   * Store lobbying relationships in graph database
   * Detects when a mediator has lobbying history with parties involved in mediation
   *
   * @param {String} mediatorId - Mediator's entity ID
   * @param {String} mediatorName - Mediator's full name
   * @param {Object} options - Search options
   * @returns {Object} Summary of stored relationships
   */
  async storeMediatorLobbyingData(mediatorId, mediatorName, options = {}) {
    try {
      // Search for lobbyist by name
      const lobbyists = await this.searchLobbyist(mediatorName);

      if (lobbyists.length === 0) {
        logger.info(`[SenateLDA] No lobbying records found for ${mediatorName}`);
        return { stored: 0, filings: [] };
      }

      // Create entity for mediator
      await Entity.findOneAndUpdate(
        { entityId: mediatorId },
        {
          entityId: mediatorId,
          entityType: 'Mediator',
          name: mediatorName,
          metadata: {
            source: 'senate_lda',
            isLobbyist: true,
            ldaLobbyistIds: lobbyists.map(l => l.lobbyist_id),
            scrapedAt: new Date()
          }
        },
        { upsert: true, new: true }
      );

      let totalFilings = 0;
      const clientRelationships = [];

      // Get filings for each lobbyist record (handle name variations)
      for (const lobbyist of lobbyists) {
        const filings = await this.getLobbyistFilings(
          lobbyist.lobbyist_id,
          {
            year: options.year || new Date().getFullYear(),
            quarter: options.quarter
          }
        );

        totalFilings += filings.length;

        // Create relationships for each client
        for (const filing of filings) {
          if (!filing.client) continue;

          // Create entity for client
          const clientEntity = await Entity.findOneAndUpdate(
            { entityId: `client_${filing.client.id}` },
            {
              entityId: `client_${filing.client.id}`,
              entityType: 'Organization',
              name: filing.client.name,
              metadata: {
                source: 'senate_lda',
                ldaClientId: filing.client.id,
                scrapedAt: new Date()
              }
            },
            { upsert: true, new: true }
          );

          // Create lobbying relationship
          const relationship = await Relationship.findOneAndUpdate(
            {
              sourceId: mediatorId,
              targetId: clientEntity.entityId,
              relationshipType: 'LOBBIED_FOR',
              'metadata.filingId': filing.filing_uuid
            },
            {
              sourceType: 'Mediator',
              sourceId: mediatorId,
              targetType: 'Organization',
              targetId: clientEntity.entityId,
              relationshipType: 'LOBBIED_FOR',
              weight: 40, // Medium-high weight for lobbying relationships
              metadata: {
                filingId: filing.filing_uuid,
                filingYear: filing.filing_year,
                filingPeriod: filing.filing_period,
                registrantName: filing.registrant?.name,
                issueAreas: filing.lobbying_activities?.map(a => a.general_issue_code) || [],
                amount: filing.income || filing.expenses,
                specificIssues: filing.lobbying_activities?.map(a => a.specific_issues).join('; '),
                govEntities: filing.lobbying_activities?.flatMap(a => a.government_entities || []),
                source: 'senate_lda',
                confidence: 1.0,
                scrapedAt: new Date()
              }
            },
            { upsert: true, new: true }
          );

          clientRelationships.push(relationship);
        }
      }

      logger.info(`[SenateLDA] Stored ${clientRelationships.length} lobbying relationships for ${mediatorName} from ${totalFilings} filings`);

      return {
        stored: clientRelationships.length,
        totalFilings,
        clients: [...new Set(clientRelationships.map(r => r.metadata.registrantName))],
        issueAreas: [...new Set(clientRelationships.flatMap(r => r.metadata.issueAreas))]
      };

    } catch (error) {
      logger.error(`[SenateLDA] Error storing lobbying data for ${mediatorName}:`, error.message);
      throw error;
    }
  }

  /**
   * Check if mediator has lobbied for a specific organization
   *
   * @param {String} mediatorName - Mediator's name
   * @param {String} organizationName - Organization/client name
   * @returns {Object} Conflict analysis
   */
  async checkLobbyingConflict(mediatorName, organizationName) {
    try {
      // Search for lobbyist
      const lobbyists = await this.searchLobbyist(mediatorName);

      if (lobbyists.length === 0) {
        return {
          hasConflict: false,
          message: 'No lobbying records found'
        };
      }

      // Search for client
      const clients = await this.searchClient(organizationName);

      if (clients.length === 0) {
        return {
          hasConflict: false,
          message: 'Organization has not been lobbied'
        };
      }

      // Check for overlapping filings
      for (const lobbyist of lobbyists) {
        const filings = await this.getLobbyistFilings(lobbyist.lobbyist_id);

        const conflict = filings.some(filing =>
          clients.some(client =>
            filing.client?.id === client.id ||
            filing.client?.name?.toLowerCase() === client.name?.toLowerCase()
          )
        );

        if (conflict) {
          const matchingFilings = filings.filter(filing =>
            clients.some(client => filing.client?.id === client.id)
          );

          return {
            hasConflict: true,
            message: `Mediator has lobbied for ${organizationName}`,
            filingCount: matchingFilings.length,
            mostRecent: matchingFilings[0]?.filing_year,
            issueAreas: [...new Set(matchingFilings.flatMap(f =>
              f.lobbying_activities?.map(a => a.general_issue_code) || []
            ))]
          };
        }
      }

      return {
        hasConflict: false,
        message: 'No lobbying relationship found between parties'
      };

    } catch (error) {
      logger.error(`[SenateLDA] Error checking lobbying conflict:`, error.message);
      throw error;
    }
  }

  /**
   * Get lobbying activity summary for a mediator
   * Useful for displaying mediator's lobbying background
   *
   * @param {String} mediatorName - Mediator's name
   * @param {Number} years - Number of years to look back (default: 5)
   * @returns {Object} Lobbying activity summary
   */
  async getMediatorLobbySummary(mediatorName, years = 5) {
    try {
      const lobbyists = await this.searchLobbyist(mediatorName);

      if (lobbyists.length === 0) {
        return {
          hasLobbyingHistory: false,
          totalClients: 0,
          totalFilings: 0
        };
      }

      const currentYear = new Date().getFullYear();
      const startYear = currentYear - years;

      const allFilings = [];
      for (const lobbyist of lobbyists) {
        for (let year = startYear; year <= currentYear; year++) {
          const filings = await this.getLobbyistFilings(lobbyist.lobbyist_id, { year });
          allFilings.push(...filings);
        }
      }

      const clients = [...new Set(allFilings.map(f => f.client?.name).filter(Boolean))];
      const issueAreas = [...new Set(allFilings.flatMap(f =>
        f.lobbying_activities?.map(a => a.general_issue_code) || []
      ))];

      return {
        hasLobbyingHistory: true,
        totalClients: clients.length,
        totalFilings: allFilings.length,
        clients: clients.slice(0, 10), // Top 10 clients
        issueAreas,
        yearRange: { start: startYear, end: currentYear },
        mostRecentActivity: allFilings[0]?.filing_year
      };

    } catch (error) {
      logger.error(`[SenateLDA] Error getting lobbying summary:`, error.message);
      throw error;
    }
  }
}

module.exports = SenateLDAScraper;
