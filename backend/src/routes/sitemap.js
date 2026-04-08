/**
 * Sitemap Routes
 * Dynamic sitemap generation for SEO
 *
 * Generates XML sitemap with:
 * - Static pages (homepage, mediators, ethics, etc.)
 * - Dynamic mediator profiles
 * - Proper priority, changefreq, lastmod tags
 * - 24-hour cache to reduce database load
 */

const express = require('express');
const router = express.Router();
const Mediator = require('../models/Mediator');
const { asyncHandler } = require('../utils/responseHandlers');
const logger = require('../config/logger');

// Cache sitemap for 24 hours
let sitemapCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Base URL from environment or default
const SITE_URL = process.env.SITE_URL || 'https://fairmediator.ai';

/**
 * Static pages configuration
 * Priority: 1.0 (highest) = homepage, 0.8 = category pages, 0.7 = info pages
 */
const STATIC_PAGES = [
  {
    url: '/',
    changefreq: 'weekly',
    priority: 1.0,
  },
  {
    url: '/mediators',
    changefreq: 'daily',
    priority: 0.8,
  },
  {
    url: '/ethics',
    changefreq: 'monthly',
    priority: 0.7,
  },
  {
    url: '/safeguards',
    changefreq: 'monthly',
    priority: 0.7,
  },
  {
    url: '/contact',
    changefreq: 'monthly',
    priority: 0.7,
  },
  {
    url: '/feedback',
    changefreq: 'monthly',
    priority: 0.5,
  },
  {
    url: '/mediators/apply',
    changefreq: 'monthly',
    priority: 0.8,
  },
];

/**
 * Generate XML sitemap entry
 */
function generateUrlEntry(url, lastmod, changefreq, priority) {
  const lastmodDate = lastmod ? new Date(lastmod).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  return `  <url>
    <loc>${SITE_URL}${url}</loc>
    <lastmod>${lastmodDate}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`;
}

/**
 * Generate complete sitemap XML
 */
async function generateSitemap() {
  try {
    const urls = [];

    // Add static pages
    for (const page of STATIC_PAGES) {
      urls.push(generateUrlEntry(page.url, null, page.changefreq, page.priority));
    }

    // Add dynamic mediator profiles
    // Only include verified, active mediators with public profiles
    const mediators = await Mediator.find({
      isVerified: true,
      isActive: true,
    })
      .select('_id name updatedAt')
      .lean()
      .exec();

    logger.info(`Sitemap: Found ${mediators.length} mediators to include`);

    for (const mediator of mediators) {
      // Generate URL-friendly slug from name (lowercase, replace spaces with hyphens)
      const slug = mediator.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')  // Remove special characters
        .trim()
        .replace(/\s+/g, '-');         // Replace spaces with hyphens

      const url = `/mediators/${slug}`;
      const lastmod = mediator.updatedAt || new Date();

      urls.push(generateUrlEntry(url, lastmod, 'monthly', 0.6));
    }

    // Build complete XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    return sitemap;
  } catch (error) {
    logger.error('Error generating sitemap:', error);
    throw error;
  }
}

/**
 * GET /sitemap.xml
 * Serve dynamically generated sitemap
 * Cached for 24 hours to reduce database queries
 */
router.get('/sitemap.xml', asyncHandler(async (req, res) => {
  const now = Date.now();

  // Check if cache is valid
  if (sitemapCache && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
    logger.debug('Serving sitemap from cache');
    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=86400'); // Cache in browser for 24 hours
    return res.send(sitemapCache);
  }

  // Generate fresh sitemap
  logger.info('Generating fresh sitemap');
  const sitemap = await generateSitemap();

  // Update cache
  sitemapCache = sitemap;
  cacheTimestamp = now;

  // Send response
  res.header('Content-Type', 'application/xml');
  res.header('Cache-Control', 'public, max-age=86400'); // Cache in browser for 24 hours
  res.send(sitemap);
}));

/**
 * POST /api/sitemap/invalidate
 * Invalidate sitemap cache (admin only)
 * Used when mediators are added/updated/deleted
 */
router.post('/api/sitemap/invalidate', asyncHandler(async (req, res) => {
  sitemapCache = null;
  cacheTimestamp = null;
  logger.info('Sitemap cache invalidated');

  res.json({
    success: true,
    message: 'Sitemap cache invalidated. Next request will generate fresh sitemap.',
  });
}));

module.exports = router;
