/**
 * California Campaign Finance Scraper
 *
 * Fetches campaign finance data from California Secretary of State (Cal-Access)
 * API Documentation: http://cal-access.sos.ca.gov/Campaign/
 * Rate Limit: Be respectful (60 req/min recommended)
 * Cost: FREE
 *
 * @module graph_analyzer/scrapers/state_scrapers/california_scraper
 */

const axios = require('axios');
const BaseScraper = require('../base_scraper');
const logger = require('../../../config/logger');

const CAL_ACCESS_BASE = 'https://cal-access.sos.ca.gov/Campaign/api';

class CaliforniaScraper extends BaseScraper {
  constructor() {
    super('California Cal-Access Scraper', {
      rateLimit: 60,
      timeout: 30000
    });
  }

  /**
   * Search for contributions by contributor name
   *
   * @param {String} contributorName - Contributor's name
   * @param {Object} options - Search options
   * @returns {Array} Array of contribution records
   */
  async searchContributions(contributorName, options = {}) {
    await this.checkRateLimit();

    try {
      // Cal-Access uses a specific endpoint format
      // Note: You may need to adjust based on actual API documentation
      const response = await axios.get(`${CAL_ACCESS_BASE}/contributions`, {
        params: {
          contributor: contributorName,
          year: options.year || new Date().getFullYear()
        },
        timeout: this.timeout
      });

      logger.info(`[CaliforniaScraper] Found ${response.data.length || 0} contributions`);
      return response.data || [];

    } catch (error) {
      logger.error(`[CaliforniaScraper] Error searching contributions:`, error.message);
      return []; // Return empty array on error
    }
  }

  /**
   * Get filer information (candidates, committees)
   *
   * @param {String} filerId - Cal-Access filer ID
   * @returns {Object} Filer details
   */
  async getFilerInfo(filerId) {
    await this.checkRateLimit();

    try {
      const response = await axios.get(`${CAL_ACCESS_BASE}/filer/${filerId}`, {
        timeout: this.timeout
      });

      return response.data;

    } catch (error) {
      logger.error(`[CaliforniaScraper] Error getting filer info:`, error.message);
      throw error;
    }
  }
}

module.exports = CaliforniaScraper;
