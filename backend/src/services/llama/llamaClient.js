/**
 * Llama Client - Bridge to Python Scraping Service
 * Uses Crawl4AI and ScrapeGraphAI for LLM-powered web scraping
 */

const axios = require('axios');

class LlamaClient {
  constructor() {
    this.baseUrl = process.env.SCRAPER_SERVICE_URL || 'http://localhost:8001';
    this.timeout = parseInt(process.env.SCRAPER_TIMEOUT) || 60000;
    this.retries = parseInt(process.env.SCRAPER_RETRIES) || 3;
  }

  /**
   * Make a request to the Python scraping service
   */
  async _request(endpoint, data, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    let lastError;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const response = await axios.post(url, data, {
          timeout: options.timeout || this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        return response.data;
      } catch (error) {
        lastError = error;

        if (error.response) {
          const status = error.response.status;
          if (status === 429) {
            await this._sleep(2000 * attempt);
            continue;
          }
          throw new Error(`Scraper error (${status}): ${error.response.data?.detail || error.message}`);
        }

        if (attempt < this.retries) {
          await this._sleep(1000 * attempt);
          continue;
        }
      }
    }

    throw new Error(`Scraper service unavailable after ${this.retries} attempts: ${lastError?.message}`);
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check for the scraping service
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  /**
   * Generic scraping with custom query
   */
  async scrape(url, query, extractSchema = null) {
    return this._request('/scrape/generic', {
      url,
      query,
      extract_schema: extractSchema
    });
  }

  /**
   * Scrape mediator profile from legal databases
   */
  async scrapeMediatorProfile(url, mediatorName = null) {
    return this._request('/scrape/mediator-profile', {
      url,
      mediator_name: mediatorName
    });
  }

  /**
   * Scrape and detect affiliations for conflict checking
   */
  async scrapeAffiliations(urls, mediatorName, checkFor = []) {
    return this._request('/scrape/affiliations', {
      urls: Array.isArray(urls) ? urls : [urls],
      mediator_name: mediatorName,
      check_for: checkFor
    }, { timeout: 120000 });
  }

  /**
   * Scrape ideology indicators for bias detection
   */
  async scrapeIdeology(urls, mediatorName) {
    return this._request('/scrape/ideology', {
      urls: Array.isArray(urls) ? urls : [urls],
      mediator_name: mediatorName
    }, { timeout: 120000 });
  }

  /**
   * Bulk scrape multiple URLs
   */
  async scrapeBulk(urls, query) {
    return this._request('/scrape/bulk', {
      urls,
      query
    }, { timeout: 180000 });
  }

  /**
   * Scrape LinkedIn profile
   */
  async scrapeLinkedIn(url, mediatorName = null) {
    return this._request('/scrape/linkedin', {
      url,
      mediator_name: mediatorName
    });
  }

  /**
   * Scrape legal databases
   */
  async scrapeLegalDatabase(url, mediatorName = null) {
    return this._request('/scrape/legal-database', {
      url,
      mediator_name: mediatorName
    });
  }

  /**
   * Build search URLs for common legal databases
   */
  buildSearchUrls(mediatorName, state = null) {
    const encodedName = encodeURIComponent(mediatorName);
    const urls = {
      martindale: `https://www.martindale.com/search/attorneys/?term=${encodedName}`,
      avvo: `https://www.avvo.com/search/lawyer_search?q=${encodedName}`,
      justia: `https://www.justia.com/lawyers/search?q=${encodedName}`,
      mediate: `https://www.mediate.com/mediator-search/?name=${encodedName}`,
      adr: `https://www.adr.org/find-neutral?name=${encodedName}`,
      ...(state && {
        barAssociation: `https://www.${state.toLowerCase()}bar.org/find-a-lawyer/?name=${encodedName}`
      }),
      fec: `https://www.fec.gov/data/receipts/individual-contributions/?contributor_name=${encodedName}`,
      linkedin: `https://www.linkedin.com/search/results/people/?keywords=${encodedName}`
    };

    return urls;
  }
}

const llamaClient = new LlamaClient();
module.exports = llamaClient;
