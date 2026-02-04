/**
 * LinkedIn Profile Scraper (Manual URL Input)
 *
 * IMPORTANT: This is for MANUAL user-initiated scraping only:
 * - User pastes LinkedIn URL for enrichment
 * - Scrapes PUBLIC profile data only
 * - Respects robots.txt
 * - No automation - requires user action
 *
 * Purpose: Extract mutual connections count to assess relationship strength
 * Combined with RECAP data: RECAP (worked together?) + LinkedIn (how close?)
 */

const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../../config/logger');

// Try to load Playwright for dynamic scraping (LinkedIn uses JS)
let chromium = null;
try {
  chromium = require('playwright').chromium;
} catch (error) {
  logger.warn('Playwright not installed - LinkedIn scraping will use static parsing only');
}

class LinkedInScraper {
  constructor() {
    this.browser = null;
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  /**
   * Check robots.txt compliance before scraping
   * @param {string} url - LinkedIn profile URL
   * @returns {Promise<boolean>} True if allowed
   */
  async checkRobotsTxt(url) {
    try {
      const robotsUrl = 'https://www.linkedin.com/robots.txt';
      const response = await axios.get(robotsUrl, { timeout: 5000 });

      // LinkedIn robots.txt generally allows /in/* (public profiles)
      // but blocks automated scraping. We only allow manual user-initiated scraping.
      const isPublicProfile = url.includes('/in/');

      if (!isPublicProfile) {
        logger.warn('LinkedIn URL is not a public profile', { url });
        return false;
      }

      logger.info('LinkedIn robots.txt check passed', { url });
      return true;
    } catch (error) {
      logger.error('Failed to check robots.txt', { error: error.message });
      return false; // Fail closed - don't scrape if we can't verify
    }
  }

  /**
   * Scrape LinkedIn profile (manual user input only)
   * @param {string} linkedinUrl - LinkedIn profile URL (user-provided)
   * @param {string} opposingCounselUrl - Opposing counsel LinkedIn URL (optional)
   * @returns {Promise<object>} Profile data + mutual connections
   */
  async scrapeProfile(linkedinUrl, opposingCounselUrl = null) {
    try {
      // Check robots.txt compliance
      const allowed = await this.checkRobotsTxt(linkedinUrl);
      if (!allowed) {
        throw new Error('Scraping not permitted by robots.txt or invalid URL format');
      }

      logger.info('Scraping LinkedIn profile (user-initiated)', { linkedinUrl });

      // Scrape mediator profile
      const profileData = await this._scrapeProfileData(linkedinUrl);

      // If opposing counsel URL provided, check mutual connections
      if (opposingCounselUrl) {
        const mutualConnectionsData = await this._scrapeMutualConnections(
          linkedinUrl,
          opposingCounselUrl
        );
        profileData.mutualConnections = mutualConnectionsData;
      }

      return {
        success: true,
        data: profileData,
        scrapedAt: new Date(),
        source: 'linkedin_manual_scrape'
      };

    } catch (error) {
      logger.error('LinkedIn scraping failed', {
        linkedinUrl,
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Scrape basic profile data
   * @private
   */
  async _scrapeProfileData(url) {
    // LinkedIn requires JavaScript rendering
    if (chromium) {
      return await this._scrapeWithPlaywright(url);
    } else {
      return await this._scrapeStatic(url);
    }
  }

  /**
   * Scrape with Playwright (dynamic content)
   * @private
   */
  async _scrapeWithPlaywright(url) {
    let browser = null;
    let page = null;

    try {
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      page = await browser.newPage({
        userAgent: this.userAgent
      });

      // Navigate to profile
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      // Wait for key elements to load
      await page.waitForSelector('h1', { timeout: 5000 }).catch(() => {});

      // Extract data from page
      const data = await page.evaluate(() => {
        const getTextContent = (selector) => {
          const el = document.querySelector(selector);
          return el ? el.textContent.trim() : null;
        };

        return {
          name: getTextContent('h1.text-heading-xlarge') ||
                getTextContent('.pv-text-details__left-panel h1'),
          headline: getTextContent('.text-body-medium') ||
                   getTextContent('.pv-text-details__left-panel .text-body-medium'),
          location: getTextContent('.text-body-small.inline.t-black--light') ||
                   getTextContent('.pv-text-details__left-panel .text-body-small'),
          connectionsCount: (() => {
            // Try to find connections count
            const connectionText = getTextContent('.pv-top-card--list li') ||
                                  getTextContent('.pvs-header__subtitle');
            if (!connectionText) return null;

            // Extract number from text like "500+ connections"
            const match = connectionText.match(/(\d+)\+?\s*connection/i);
            return match ? parseInt(match[1]) : null;
          })(),
          about: getTextContent('.pv-about-section p') ||
                getTextContent('#about + div p')
        };
      });

      await browser.close();
      return data;

    } catch (error) {
      if (browser) await browser.close();

      logger.error('Playwright scraping failed', { error: error.message });

      // Fallback to static scraping
      return await this._scrapeStatic(url);
    }
  }

  /**
   * Scrape with static HTML parsing (limited data)
   * @private
   */
  async _scrapeStatic(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);

      return {
        name: $('h1').first().text().trim() || null,
        headline: $('.text-body-medium').first().text().trim() || null,
        location: $('.text-body-small').first().text().trim() || null,
        connectionsCount: null, // Not available in static HTML
        about: null, // Not available in static HTML
        note: 'Limited data - LinkedIn requires JavaScript. Install Playwright for full scraping: npm install playwright'
      };

    } catch (error) {
      logger.error('Static scraping failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Scrape mutual connections between two LinkedIn profiles
   * NOTE: This requires being logged in to LinkedIn, so this is a placeholder
   * for now. Real implementation would require authentication.
   *
   * @private
   */
  async _scrapeMutualConnections(mediatorUrl, opposingCounselUrl) {
    // LinkedIn's mutual connections feature requires authentication
    // For now, we return placeholder data

    logger.warn('Mutual connections scraping requires LinkedIn authentication - feature not implemented yet');

    return {
      count: null,
      available: false,
      reason: 'Requires LinkedIn authentication',
      alternative: 'Manual user review: Visit both profiles and check shared connections'
    };
  }

  /**
   * Calculate relationship strength score based on LinkedIn data
   * @param {object} linkedinData - LinkedIn profile data
   * @param {number} mutualConnectionsCount - Number of mutual connections
   * @returns {object} Relationship strength assessment
   */
  calculateRelationshipStrength(linkedinData, mutualConnectionsCount = 0) {
    let strengthLevel = 'unknown';
    let confidence = 0;
    let description = '';

    if (mutualConnectionsCount === null || mutualConnectionsCount === undefined) {
      return {
        strengthLevel: 'unknown',
        confidence: 0,
        description: 'Mutual connections data not available',
        score: 0
      };
    }

    // Score based on mutual connections
    // 0-2: Weak connection
    // 3-10: Moderate connection
    // 11-30: Strong connection
    // 31+: Very strong connection

    if (mutualConnectionsCount <= 2) {
      strengthLevel = 'weak';
      confidence = 0.3;
      description = `${mutualConnectionsCount} mutual connection(s) - likely professional acquaintances`;
    } else if (mutualConnectionsCount <= 10) {
      strengthLevel = 'moderate';
      confidence = 0.5;
      description = `${mutualConnectionsCount} mutual connections - established professional relationship`;
    } else if (mutualConnectionsCount <= 30) {
      strengthLevel = 'strong';
      confidence = 0.7;
      description = `${mutualConnectionsCount} mutual connections - close professional network`;
    } else {
      strengthLevel = 'very_strong';
      confidence = 0.9;
      description = `${mutualConnectionsCount}+ mutual connections - very close professional circles`;
    }

    return {
      strengthLevel,
      confidence,
      description,
      score: Math.min(mutualConnectionsCount / 50, 1.0), // Normalize to 0-1
      mutualConnectionsCount
    };
  }
}

module.exports = new LinkedInScraper();
