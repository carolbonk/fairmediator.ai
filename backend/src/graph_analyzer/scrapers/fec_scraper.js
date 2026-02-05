/**
 * FEC Scraper - Federal Election Commission Data
 *
 * Fetches campaign finance data from the FEC API (api.open.fec.gov)
 * to identify political donations and affiliations.
 *
 * API Documentation: https://api.open.fec.gov/developers/
 * Rate Limit: No official limit (recommended: 60 req/min)
 * Cost: FREE (no API key required, but recommended for higher limits)
 *
 * @module graph_analyzer/scrapers/fec_scraper
 */

const axios = require('axios');
const BaseScraper = require('./base_scraper');
const logger = require('../../utils/logger');
const { Entity, Relationship } = require('../models/graph_schema');

const FEC_API_BASE = 'https://api.open.fec.gov/v1';
const FEC_API_KEY = process.env.FEC_API_KEY || 'DEMO_KEY'; // Get free key at api.data.gov

class FECScraper extends BaseScraper {
  constructor() {
    super('FEC Scraper', {
      rateLimit: 60, // 60 requests per minute
      timeout: 30000
    });
  }

  /**
   * Search for individual donations by name
   *
   * @param {String} name - Full name of individual
   * @param {Object} options - Search options (state, occupation, employer)
   * @returns {Array} Array of donation records
   */
  async searchIndividualDonations(name, options = {}) {
    const params = {
      api_key: FEC_API_KEY,
      contributor_name: name,
      per_page: 100,
      sort: '-contribution_receipt_date'
    };

    // Add optional filters
    if (options.state) params.contributor_state = options.state;
    if (options.occupation) params.contributor_occupation = options.occupation;
    if (options.employer) params.contributor_employer = options.employer;
    if (options.minAmount) params.min_amount = options.minAmount;
    if (options.minDate) params.min_date = options.minDate;
    if (options.maxDate) params.max_date = options.maxDate;

    return this.retryRequest(async () => {
      const response = await axios.get(`${FEC_API_BASE}/schedules/schedule_a/`, {
        params,
        timeout: this.timeout
      });

      if (!response.data || !response.data.results) {
        throw new Error('Invalid FEC API response');
      }

      logger.info(`[FEC] Found ${response.data.results.length} donations for ${name}`);
      return response.data.results;
    }, `individual donations for ${name}`);
  }

  /**
   * Get candidate information
   *
   * @param {String} candidateId - FEC candidate ID
   * @returns {Object} Candidate details
   */
  async getCandidateInfo(candidateId) {
    return this.retryRequest(async () => {
      const response = await axios.get(`${FEC_API_BASE}/candidate/${candidateId}/`, {
        params: { api_key: FEC_API_KEY },
        timeout: this.timeout
      });

      if (!response.data || !response.data.results || response.data.results.length === 0) {
        throw new Error(`Candidate ${candidateId} not found`);
      }

      return response.data.results[0];
    }, `candidate info for ${candidateId}`);
  }

  /**
   * Find common donation recipients between two individuals
   *
   * @param {String} name1 - First individual's name
   * @param {String} name2 - Second individual's name
   * @param {Object} options - Search options
   * @returns {Array} Common donation recipients
   */
  async findCommonDonations(name1, name2, options = {}) {
    const [donations1, donations2] = await Promise.all([
      this.searchIndividualDonations(name1, options),
      this.searchIndividualDonations(name2, options)
    ]);

    // Extract unique candidate/committee IDs
    const recipients1 = new Set(donations1.map(d => d.committee_id));
    const recipients2 = new Set(donations2.map(d => d.committee_id));

    // Find intersection
    const commonRecipients = [...recipients1].filter(id => recipients2.has(id));

    logger.info(`[FEC] Found ${commonRecipients.length} common donation recipients between ${name1} and ${name2}`);

    return commonRecipients.map(committeeId => {
      const d1 = donations1.find(d => d.committee_id === committeeId);
      const d2 = donations2.find(d => d.committee_id === committeeId);

      return {
        committeeId,
        committeeName: d1.committee_name,
        donation1: {
          name: name1,
          amount: d1.contribution_receipt_amount,
          date: d1.contribution_receipt_date
        },
        donation2: {
          name: name2,
          amount: d2.contribution_receipt_amount,
          date: d2.contribution_receipt_date
        }
      };
    });
  }

  /**
   * Store FEC donation data in graph database
   *
   * @param {String} mediatorId - Mediator's entity ID
   * @param {String} mediatorName - Mediator's full name
   * @param {Object} options - Search options
   * @returns {Object} Summary of stored relationships
   */
  async storeMediator DonationData(mediatorId, mediatorName, options = {}) {
    try {
      // Fetch donations
      const donations = await this.searchIndividualDonations(mediatorName, options);

      if (donations.length === 0) {
        logger.info(`[FEC] No donations found for ${mediatorName}`);
        return { stored: 0, donations: [] };
      }

      // Create entity for mediator if doesn't exist
      await Entity.findOneAndUpdate(
        { entityId: mediatorId },
        {
          entityType: 'Mediator',
          entityId: mediatorId,
          name: mediatorName,
          dataSource: 'FEC',
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );

      const storedRelationships = [];

      // Store each donation as a relationship
      for (const donation of donations) {
        const committeeId = `fec_committee_${donation.committee_id}`;

        // Create entity for committee/candidate
        await Entity.findOneAndUpdate(
          { entityId: committeeId },
          {
            entityType: 'Campaign',
            entityId: committeeId,
            name: donation.committee_name,
            metadata: {
              fecId: donation.committee_id,
              candidateName: donation.candidate_name,
              candidateId: donation.candidate_id,
              candidateOffice: donation.candidate_office,
              candidateParty: donation.candidate_party
            },
            dataSource: 'FEC',
            lastUpdated: new Date()
          },
          { upsert: true, new: true }
        );

        // Create DONATED_TO relationship
        const relationship = await Relationship.findOneAndUpdate(
          {
            sourceId: mediatorId,
            targetId: committeeId,
            relationshipType: 'DONATED_TO'
          },
          {
            sourceType: 'Mediator',
            sourceId: mediatorId,
            targetType: 'Campaign',
            targetId: committeeId,
            relationshipType: 'DONATED_TO',
            weight: 6, // Donation weight
            metadata: {
              amount: donation.contribution_receipt_amount,
              date: donation.contribution_receipt_date,
              candidateName: donation.candidate_name,
              candidateParty: donation.candidate_party,
              fecId: donation.committee_id
            },
            confidence: 1.0, // FEC data is verified
            dataSource: 'FEC',
            lastVerified: new Date(),
            isActive: true
          },
          { upsert: true, new: true }
        );

        storedRelationships.push(relationship);
      }

      logger.info(`[FEC] Stored ${storedRelationships.length} donation relationships for ${mediatorName}`);

      return {
        stored: storedRelationships.length,
        donations: donations.slice(0, 10), // Return top 10 for display
        totalAmount: donations.reduce((sum, d) => sum + (d.contribution_receipt_amount || 0), 0)
      };

    } catch (error) {
      logger.error(`[FEC] Error storing donation data for ${mediatorName}:`, error);
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
    return this.storeMediatorDonationData(params.mediatorId, params.mediatorName, params.options || {});
  }
}

module.exports = FECScraper;
