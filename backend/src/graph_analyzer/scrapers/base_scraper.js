/**
 * Base Scraper - Abstract class for all data scrapers
 *
 * Provides common functionality for rate limiting, error handling,
 * and data validation across all scraper implementations.
 *
 * @module graph_analyzer/scrapers/base_scraper
 */

const logger = require('../../config/logger');
const { trackAPICall } = require('../../utils/freeTierMonitor');

/**
 * Base Scraper Class
 * All scrapers should extend this class
 */
class BaseScraper {
  constructor(name, options = {}) {
    this.name = name;
    this.rateLimit = options.rateLimit || 60; // Requests per minute
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000; // ms
    this.timeout = options.timeout || 30000; // 30 seconds
    this.requestCount = 0;
    this.lastRequestTime = Date.now();
    this.errors = [];
  }

  /**
   * Rate limiting check
   * Ensures we don't exceed API limits
   */
  async checkRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = (60 * 1000) / this.rateLimit;

    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      logger.debug(`[${this.name}] Rate limit: waiting ${waitTime}ms`);
      await this.sleep(waitTime);
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * Sleep utility for rate limiting
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry logic for failed requests
   */
  async retryRequest(requestFn, context = '') {
    let lastError;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        await this.checkRateLimit();
        const result = await requestFn();
        return result;
      } catch (error) {
        lastError = error;
        logger.warn(`[${this.name}] Attempt ${attempt}/${this.retryAttempts} failed: ${error.message}`);

        if (attempt < this.retryAttempts) {
          const backoffDelay = this.retryDelay * Math.pow(2, attempt - 1);
          logger.debug(`[${this.name}] Retrying in ${backoffDelay}ms...`);
          await this.sleep(backoffDelay);
        }
      }
    }

    const errorMsg = `[${this.name}] All retry attempts failed${context ? ` for ${context}` : ''}`;
    logger.error(errorMsg, { error: lastError });
    this.errors.push({ context, error: lastError.message, timestamp: new Date() });
    throw new Error(errorMsg);
  }

  /**
   * Validate required fields in response data
   */
  validateFields(data, requiredFields, context = 'response') {
    const missing = [];

    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null) {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Missing required fields in ${context}: ${missing.join(', ')}`);
    }

    return true;
  }

  /**
   * Normalize entity names for matching
   * Handles common variations: LLC, Inc, Corp, etc.
   */
  normalizeEntityName(name) {
    if (!name) return '';

    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/,?\s*(llc|inc|corp|ltd|p\.?c\.?|l\.?l\.?p\.?)$/i, '')
      .replace(/[^\w\s]/g, '');
  }

  /**
   * Extract domain from email or URL
   */
  extractDomain(input) {
    if (!input) return null;

    // Handle email
    if (input.includes('@')) {
      return input.split('@')[1].toLowerCase();
    }

    // Handle URL
    try {
      const url = new URL(input.startsWith('http') ? input : `https://${input}`);
      return url.hostname.replace(/^www\./, '').toLowerCase();
    } catch {
      return null;
    }
  }

  /**
   * Get scraper statistics
   */
  getStats() {
    return {
      name: this.name,
      requestCount: this.requestCount,
      errorCount: this.errors.length,
      lastRequestTime: this.lastRequestTime,
      uptime: Date.now() - this.lastRequestTime
    };
  }

  /**
   * Clear error log
   */
  clearErrors() {
    this.errors = [];
  }

  /**
   * Abstract method - must be implemented by subclasses
   */
  async scrape(params) {
    throw new Error('scrape() must be implemented by subclass');
  }
}

module.exports = BaseScraper;
