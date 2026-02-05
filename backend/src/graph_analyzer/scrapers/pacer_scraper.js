/**
 * PACER/RECAP Scraper - Court Case History
 *
 * Fetches federal court case data via RECAP (Free Law Project's PACER alternative)
 * to identify shared case history and professional relationships.
 *
 * API Documentation: https://www.courtlistener.com/api/rest-info/
 * Rate Limit: 5,000 requests/day (free tier)
 * Cost: FREE with attribution
 *
 * NOTE: This scraper builds on the existing recapClient.js but stores data
 * in the graph database for relationship analysis.
 *
 * @module graph_analyzer/scrapers/pacer_scraper
 */

const axios = require('axios');
const BaseScraper = require('./base_scraper');
const logger = require('../../utils/logger');
const { Entity, Relationship } = require('../models/graph_schema');

const RECAP_API_BASE = 'https://www.courtlistener.com/api/rest/v3';
const RECAP_API_KEY = process.env.RECAP_API_KEY || ''; // Get free key at courtlistener.com

class PACERScraper extends BaseScraper {
  constructor() {
    super('PACER/RECAP Scraper', {
      rateLimit: 10, // 10 requests per minute (conservative)
      timeout: 30000
    });
  }

  /**
   * Search for cases by attorney name
   *
   * @param {String} attorneyName - Full name of attorney/mediator
   * @param {Object} options - Search options (court, dateRange, etc.)
   * @returns {Array} Array of case records
   */
  async searchCasesByAttorney(attorneyName, options = {}) {
    const params = {
      attorney: attorneyName,
      page_size: 100,
      order_by: '-date_filed'
    };

    // Add optional filters
    if (options.court) params.court = options.court;
    if (options.dateFiledAfter) params.date_filed__gte = options.dateFiledAfter;
    if (options.dateFiledBefore) params.date_filed__lte = options.dateFiledBefore;
    if (options.caseType) params.nature_of_suit = options.caseType;

    const headers = RECAP_API_KEY ? { Authorization: `Token ${RECAP_API_KEY}` } : {};

    return this.retryRequest(async () => {
      const response = await axios.get(`${RECAP_API_BASE}/dockets/`, {
        params,
        headers,
        timeout: this.timeout
      });

      if (!response.data || !response.data.results) {
        throw new Error('Invalid RECAP API response');
      }

      logger.info(`[RECAP] Found ${response.data.results.length} cases for ${attorneyName}`);
      return response.data.results;
    }, `cases for ${attorneyName}`);
  }

  /**
   * Get parties involved in a case
   *
   * @param {String} docketId - RECAP docket ID
   * @returns {Array} List of parties
   */
  async getCaseParties(docketId) {
    const headers = RECAP_API_KEY ? { Authorization: `Token ${RECAP_API_KEY}` } : {};

    return this.retryRequest(async () => {
      const response = await axios.get(`${RECAP_API_BASE}/parties/`, {
        params: {
          docket: docketId,
          page_size: 100
        },
        headers,
        timeout: this.timeout
      });

      if (!response.data || !response.data.results) {
        throw new Error('Invalid RECAP API response for parties');
      }

      return response.data.results;
    }, `parties for docket ${docketId}`);
  }

  /**
   * Find shared cases between two attorneys
   *
   * @param {String} attorney1 - First attorney's name
   * @param {String} attorney2 - Second attorney's name
   * @param {Object} options - Search options
   * @returns {Array} Shared case records
   */
  async findSharedCases(attorney1, attorney2, options = {}) {
    const [cases1, cases2] = await Promise.all([
      this.searchCasesByAttorney(attorney1, options),
      this.searchCasesByAttorney(attorney2, options)
    ]);

    // Find cases where both attorneys appear
    const sharedCases = cases1.filter(c1 =>
      cases2.some(c2 => c2.docket_number === c1.docket_number)
    );

    logger.info(`[RECAP] Found ${sharedCases.length} shared cases between ${attorney1} and ${attorney2}`);

    return sharedCases;
  }

  /**
   * Determine relationship type from case data
   * Analyzes whether attorneys were on same side or opposing
   *
   * @param {Object} caseData - Case record with parties
   * @param {String} attorney1 - First attorney name
   * @param {String} attorney2 - Second attorney name
   * @returns {String} Relationship type: 'SHARED_CASE' or 'OPPOSING_COUNSEL'
   */
  async determineRelationshipType(caseData, attorney1, attorney2) {
    try {
      const parties = await this.getCaseParties(caseData.id);

      // Find which side each attorney represented
      const attorney1Parties = parties.filter(p =>
        p.attorneys && p.attorneys.some(a =>
          this.normalizeEntityName(a.name).includes(this.normalizeEntityName(attorney1))
        )
      );

      const attorney2Parties = parties.filter(p =>
        p.attorneys && p.attorneys.some(a =>
          this.normalizeEntityName(a.name).includes(this.normalizeEntityName(attorney2))
        )
      );

      if (attorney1Parties.length === 0 || attorney2Parties.length === 0) {
        return 'SHARED_CASE'; // Can't determine, default to shared
      }

      // Check if they represented opposite sides (plaintiff vs defendant)
      const attorney1Plaintiff = attorney1Parties.some(p => p.party_type === 'Plaintiff');
      const attorney2Plaintiff = attorney2Parties.some(p => p.party_type === 'Plaintiff');

      if (attorney1Plaintiff !== attorney2Plaintiff) {
        return 'OPPOSING_COUNSEL';
      }

      return 'SHARED_CASE';

    } catch (error) {
      logger.warn(`[RECAP] Could not determine relationship type: ${error.message}`);
      return 'SHARED_CASE'; // Default to shared if we can't determine
    }
  }

  /**
   * Store RECAP case data in graph database
   *
   * @param {String} mediatorId - Mediator's entity ID
   * @param {String} mediatorName - Mediator's full name
   * @param {String} opposingCounsel - Opposing attorney name (optional)
   * @param {Object} options - Search options
   * @returns {Object} Summary of stored relationships
   */
  async storeCaseHistory(mediatorId, mediatorName, opposingCounsel = null, options = {}) {
    try {
      // Create entity for mediator
      await Entity.findOneAndUpdate(
        { entityId: mediatorId },
        {
          entityType: 'Mediator',
          entityId: mediatorId,
          name: mediatorName,
          dataSource: 'RECAP',
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );

      let casesToStore;

      if (opposingCounsel) {
        // Find shared cases with specific opposing counsel
        casesToStore = await this.findSharedCases(mediatorName, opposingCounsel, options);
      } else {
        // Get all cases for mediator
        casesToStore = await this.searchCasesByAttorney(mediatorName, options);
      }

      if (casesToStore.length === 0) {
        logger.info(`[RECAP] No cases found for ${mediatorName}`);
        return { stored: 0, cases: [] };
      }

      const storedRelationships = [];

      // Store each case and extract law firms/parties
      for (const caseData of casesToStore) {
        // Extract law firms from case
        const parties = await this.getCaseParties(caseData.id);

        for (const party of parties) {
          if (!party.attorneys || party.attorneys.length === 0) continue;

          for (const attorney of party.attorneys) {
            // Create entity for law firm
            const lawFirmId = `law_firm_${this.normalizeEntityName(attorney.firm || 'unknown')}`;

            await Entity.findOneAndUpdate(
              { entityId: lawFirmId },
              {
                entityType: 'LawFirm',
                entityId: lawFirmId,
                name: attorney.firm || 'Unknown Firm',
                metadata: {
                  address: attorney.address,
                  phone: attorney.phone
                },
                dataSource: 'RECAP',
                lastUpdated: new Date()
              },
              { upsert: true, new: true }
            );

            // Determine relationship type
            const relType = opposingCounsel
              ? await this.determineRelationshipType(caseData, mediatorName, opposingCounsel)
              : 'SHARED_CASE';

            const weight = relType === 'OPPOSING_COUNSEL' ? -5 : 8;

            // Create relationship
            const relationship = await Relationship.findOneAndUpdate(
              {
                sourceId: mediatorId,
                targetId: lawFirmId,
                relationshipType: relType,
                'metadata.caseNumber': caseData.docket_number
              },
              {
                sourceType: 'Mediator',
                sourceId: mediatorId,
                targetType: 'LawFirm',
                targetId: lawFirmId,
                relationshipType: relType,
                weight,
                metadata: {
                  caseNumber: caseData.docket_number,
                  court: caseData.court,
                  dateFiled: caseData.date_filed,
                  caseTitle: caseData.case_name,
                  natureOfSuit: caseData.nature_of_suit,
                  opposingParty: party.name,
                  opposingPartyType: party.party_type
                },
                confidence: 1.0, // RECAP data is verified
                dataSource: 'RECAP',
                lastVerified: new Date(),
                isActive: true
              },
              { upsert: true, new: true }
            );

            storedRelationships.push(relationship);
          }
        }
      }

      logger.info(`[RECAP] Stored ${storedRelationships.length} case relationships for ${mediatorName}`);

      return {
        stored: storedRelationships.length,
        cases: casesToStore.slice(0, 10), // Return top 10 for display
        totalCases: casesToStore.length
      };

    } catch (error) {
      logger.error(`[RECAP] Error storing case history for ${mediatorName}:`, error);
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
    return this.storeCaseHistory(
      params.mediatorId,
      params.mediatorName,
      params.opposingCounsel || null,
      params.options || {}
    );
  }
}

module.exports = PACERScraper;
