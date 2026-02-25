// Try to load Playwright (optional dependency for dynamic scraping)
let chromium = null;
try {
  chromium = require('playwright').chromium;
} catch (error) {
  // Playwright not installed - only static scraping will be available
}

const cheerio = require('cheerio');
const axios = require('axios');
const Mediator = require('../../models/Mediator');
const logger = require('../../config/logger');
const dataOrganizer = require('../ai/dataOrganizer');

class MediatorScraper {
  constructor() {
    this.browser = null;
    this.playwrightAvailable = chromium !== null;
  }

  async init() {
    if (!this.playwrightAvailable) {
      logger.warn('Playwright not installed - dynamic scraping disabled. Install with: npm install playwright');
      return;
    }

    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true });
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrapeStatic(url) {
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    return cheerio.load(response.data);
  }

  async scrapeDynamic(url) {
    if (!this.playwrightAvailable) {
      logger.warn(`Dynamic scraping requested for ${url} but Playwright not available. Falling back to static scraping.`);
      return this.scrapeStatic(url);
    }

    await this.init();

    if (!this.browser) {
      logger.warn('Browser failed to initialize. Falling back to static scraping.');
      return this.scrapeStatic(url);
    }

    const page = await this.browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    const content = await page.content();
    await page.close();
    return cheerio.load(content);
  }

  extractMediatorData($, url, sourceType) {
    const data = {
      sources: [{ url, scrapedAt: new Date(), sourceType }]
    };
    
    data.name = $('h1').first().text().trim() || $('.profile-name').text().trim();
    data.email = $('a[href^="mailto:"]').attr('href')?.replace('mailto:', '');
    data.phone = $('a[href^="tel:"]').text().trim();
    
    const location = $('.location').text().trim() || $('.address').text().trim();
    if (location) {
      const parts = location.split(',').map(p => p.trim());
      data.location = {
        city: parts[0] || '',
        state: parts[1] || '',
        country: parts[2] || 'USA'
      };
    }
    
    data.lawFirm = $('.law-firm').text().trim() || $('.employer').text().trim();
    
    const specs = [];
    $('.specialization, .practice-area').each((i, el) => {
      const spec = $(el).text().trim();
      if (spec) specs.push(spec);
    });
    if (specs.length > 0) data.specializations = specs;
    
    const exp = $('.years-experience').text().match(/\d+/);
    if (exp) data.yearsExperience = parseInt(exp[0]);
    
    return data;
  }

  /**
   * Extract bio text from page for AI processing
   * @private
   */
  _extractBioText($) {
    // Common bio selectors
    const bioSelectors = [
      '.bio', '.biography', '.about', '.profile-bio',
      '.description', '.overview', '.summary',
      '[itemprop="description"]', 'article.bio'
    ];

    for (const selector of bioSelectors) {
      const bioText = $(selector).text().trim();
      if (bioText && bioText.length > 100) {
        return bioText;
      }
    }

    // Fallback: get all paragraph text
    const paragraphs = [];
    $('p').each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 50) paragraphs.push(text);
    });

    return paragraphs.join('\n\n');
  }

  async scrapeMediatorProfile(url, sourceType = 'generic', useDynamic = false, useAI = true) {
    logger.info(`Scraping: ${url}`);

    const $ = useDynamic ? await this.scrapeDynamic(url) : await this.scrapeStatic(url);

    // Traditional CSS-selector extraction
    const cssData = this.extractMediatorData($, url, sourceType);

    // AI-powered extraction from bio text (if enabled and bio text found)
    let aiData = {};
    let signals = [];
    if (useAI) {
      const bioText = this._extractBioText($);
      if (bioText && bioText.length > 100) {
        try {
          logger.info('Using AI data organizer for bio extraction', { bioLength: bioText.length });
          aiData = await dataOrganizer.extractMediatorProfile(bioText);

          // Extract signals (employment, memberships, publications)
          signals = await dataOrganizer.extractSignals(bioText, null); // mediatorId added after save
        } catch (error) {
          logger.warn('AI extraction failed, using CSS data only', { error: error.message });
        }
      }
    }

    // Merge CSS and AI data (AI takes precedence for richer data)
    const mergedData = {
      ...cssData,
      // Override with AI data if available and more complete
      ...(aiData.credentials?.length > 0 && { certifications: aiData.credentials }),
      ...(aiData.yearsExperience && { yearsExperience: aiData.yearsExperience }),
      ...(aiData.practiceAreas?.length > 0 && { specializations: aiData.practiceAreas }),
      ...(aiData.education?.length > 0 && { barAdmissions: aiData.barAdmissions || [] }),
      ...(aiData.lawFirm && { lawFirm: aiData.lawFirm }),
      ...(aiData.previousEmployers?.length > 0 && { previousEmployers: aiData.previousEmployers }),
      // Store AI-extracted memberships in biasIndicators for now
      ...(aiData.memberships?.length > 0 && {
        biasIndicators: {
          politicalAffiliations: aiData.memberships
        }
      })
    };

    if (!mergedData.name) throw new Error('No mediator name found');

    const mediator = await Mediator.findOneAndUpdate(
      { name: mergedData.name },
      { $set: mergedData, $addToSet: { sources: mergedData.sources[0] } },
      { upsert: true, new: true }
    );

    // TODO: Save signals to Signal collection when that model is created
    // For now, log them for review
    if (signals.length > 0) {
      logger.info(`Extracted ${signals.length} signals for ${mediator.name}`, {
        signals: signals.map(s => ({ type: s.type, value: s.value }))
      });
    }

    mediator.calculateDataQuality();
    await mediator.save();

    logger.info(`Scraped: ${mediator.name}`, {
      completeness: mediator.dataQuality.completeness,
      aiEnhanced: Object.keys(aiData).length > 0,
      signalsFound: signals.length
    });

    return mediator;
  }

  async scrapeMediatorList(url, sourceType = 'directory', useDynamic = false) {
    const $ = useDynamic ? await this.scrapeDynamic(url) : await this.scrapeStatic(url);
    
    const profileUrls = [];
    $('a.mediator-link, a.profile-link, .mediator-card a').each((i, el) => {
      let href = $(el).attr('href');
      if (href && !href.startsWith('http')) {
        const base = new URL(url);
        href = new URL(href, base.origin).href;
      }
      if (href) profileUrls.push(href);
    });
    
    return profileUrls;
  }
}

module.exports = new MediatorScraper();
