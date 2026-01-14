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

  async scrapeMediatorProfile(url, sourceType = 'generic', useDynamic = false) {
    console.log(`Scraping: ${url}`);
    
    const $ = useDynamic ? await this.scrapeDynamic(url) : await this.scrapeStatic(url);
    const data = this.extractMediatorData($, url, sourceType);
    
    if (!data.name) throw new Error('No mediator name found');
    
    const mediator = await Mediator.findOneAndUpdate(
      { name: data.name },
      { $set: data, $addToSet: { sources: data.sources[0] } },
      { upsert: true, new: true }
    );
    
    mediator.calculateDataQuality();
    await mediator.save();
    
    console.log(`✅ Scraped: ${mediator.name} (${mediator.dataQuality.completeness}% complete)`);
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
