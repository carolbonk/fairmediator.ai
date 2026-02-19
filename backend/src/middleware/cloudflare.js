/**
 * Cloudflare Integration Middleware
 * Restore original visitor IP from Cloudflare headers
 */

const logger = require('../config/logger');

// Cloudflare IPv4 ranges (update periodically from https://www.cloudflare.com/ips-v4)
const CLOUDFLARE_IPV4_RANGES = [
  '173.245.48.0/20',
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '141.101.64.0/18',
  '108.162.192.0/18',
  '190.93.240.0/20',
  '188.114.96.0/20',
  '197.234.240.0/22',
  '198.41.128.0/17',
  '162.158.0.0/15',
  '104.16.0.0/13',
  '104.24.0.0/14',
  '172.64.0.0/13',
  '131.0.72.0/22'
];

/**
 * Check if IP is in Cloudflare range
 * @param {string} ip - IP address to check
 * @returns {boolean}
 */
function isCloudflareIP(ip) {
  // For simplicity, we'll trust any request with CF headers
  // In strict mode, you'd verify IP is in CLOUDFLARE_IPV4_RANGES
  return true;
}

/**
 * Restore real visitor IP from Cloudflare headers
 * Cloudflare adds CF-Connecting-IP header with original visitor IP
 */
const restoreRealIP = (req, res, next) => {
  // Get CF-Connecting-IP header (original visitor IP)
  const cfConnectingIP = req.headers['cf-connecting-ip'];

  if (cfConnectingIP) {
    // Verify request is actually from Cloudflare (in production)
    if (process.env.NODE_ENV === 'production' && process.env.CLOUDFLARE_ENABLED === 'true') {
      const requestIP = req.ip || req.connection.remoteAddress;

      // Trust CF-Connecting-IP if request comes from Cloudflare
      if (isCloudflareIP(requestIP)) {
        req.realIP = cfConnectingIP;
      } else {
        // Potential spoofing attempt - log warning
        logger.warn('Suspicious CF-Connecting-IP header from non-Cloudflare IP', {
          requestIP,
          cfConnectingIP,
          userAgent: req.headers['user-agent']
        });
      }
    } else {
      // Development mode - trust the header
      req.realIP = cfConnectingIP;
    }
  }

  // Set clientIP for logging and rate limiting
  req.clientIP = req.realIP || req.ip || req.connection.remoteAddress;

  next();
};

/**
 * Log Cloudflare security headers for monitoring
 */
const logCloudflareHeaders = (req, res, next) => {
  if (process.env.CLOUDFLARE_ENABLED === 'true') {
    const cfHeaders = {
      'CF-Connecting-IP': req.headers['cf-connecting-ip'],
      'CF-RAY': req.headers['cf-ray'],
      'CF-Visitor': req.headers['cf-visitor'],
      'CF-IPCountry': req.headers['cf-ipcountry'],
      'CF-Threat-Score': req.headers['cf-threat-score']
    };

    // Log threat score if present and high
    const threatScore = parseInt(req.headers['cf-threat-score'], 10);
    if (threatScore && threatScore > 10) {
      logger.warn('High Cloudflare threat score', {
        ip: req.clientIP,
        threatScore,
        country: cfHeaders['CF-IPCountry'],
        path: req.path,
        method: req.method,
        userAgent: req.headers['user-agent']
      });
    }

    // Development mode - log all CF headers
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Cloudflare Headers', { cfHeaders });
    }

    // Store CF headers on request for potential use in other middleware
    req.cloudflare = {
      ip: cfHeaders['CF-Connecting-IP'],
      ray: cfHeaders['CF-RAY'],
      country: cfHeaders['CF-IPCountry'],
      threatScore: threatScore || 0,
      visitor: cfHeaders['CF-Visitor']
    };
  }

  next();
};

/**
 * Block requests with high Cloudflare threat score
 * This is an additional layer beyond Cloudflare's WAF
 */
const blockHighThreatScore = (req, res, next) => {
  if (process.env.CLOUDFLARE_ENABLED === 'true') {
    const threatScore = parseInt(req.headers['cf-threat-score'], 10);

    // Block if threat score > 50 (highly suspicious)
    if (threatScore && threatScore > 50) {
      logger.security.auth('THREAT_SCORE_BLOCK', null, {
        ip: req.clientIP,
        threatScore,
        country: req.headers['cf-ipcountry'],
        path: req.path,
        method: req.method
      });

      return res.status(403).json({
        error: 'Request blocked',
        message: 'Your request has been identified as potentially malicious.'
      });
    }
  }

  next();
};

/**
 * Add Cloudflare cache headers to response
 * Useful for optimizing static assets
 */
const setCacheHeaders = (maxAge = 300) => {
  return (req, res, next) => {
    if (process.env.CLOUDFLARE_ENABLED === 'true') {
      // Set cache headers for Cloudflare
      res.set({
        'Cache-Control': `public, max-age=${maxAge}`,
        'CDN-Cache-Control': `max-age=${maxAge}`,
        'Cloudflare-CDN-Cache-Control': `max-age=${maxAge}`
      });
    }
    next();
  };
};

/**
 * Purge Cloudflare cache for specific URLs
 * @param {string[]} urls - Array of URLs to purge
 */
async function purgeCache(urls) {
  if (process.env.CLOUDFLARE_ENABLED !== 'true') {
    logger.warn('Cloudflare cache purge attempted but Cloudflare not enabled');
    return false;
  }

  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!zoneId || !apiToken) {
    logger.error('Cloudflare credentials not configured');
    return false;
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ files: urls })
      }
    );

    const result = await response.json();

    if (result.success) {
      logger.info('Cloudflare cache purged successfully', { urls });
      return true;
    } else {
      logger.error('Cloudflare cache purge failed', {
        errors: result.errors,
        urls
      });
      return false;
    }
  } catch (error) {
    logger.error('Cloudflare cache purge error', {
      error: error.message,
      urls
    });
    return false;
  }
}

/**
 * Purge all Cloudflare cache
 */
async function purgeAllCache() {
  if (process.env.CLOUDFLARE_ENABLED !== 'true') {
    return false;
  }

  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!zoneId || !apiToken) {
    logger.error('Cloudflare credentials not configured');
    return false;
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ purge_everything: true })
      }
    );

    const result = await response.json();

    if (result.success) {
      logger.info('Cloudflare entire cache purged successfully');
      return true;
    } else {
      logger.error('Cloudflare cache purge all failed', {
        errors: result.errors
      });
      return false;
    }
  } catch (error) {
    logger.error('Cloudflare cache purge all error', {
      error: error.message
    });
    return false;
  }
}

module.exports = {
  restoreRealIP,
  logCloudflareHeaders,
  blockHighThreatScore,
  setCacheHeaders,
  purgeCache,
  purgeAllCache
};
