/**
 * 50-State Scraping Targets
 * Mediator data sources for all US states
 *
 * CRITICAL: This is the PRIMARY DATA SOURCE for the entire platform
 */

const SCRAPING_TARGETS = {
  // NORTHEAST REGION
  'CT': {
    name: 'Connecticut',
    sources: [
      {
        type: 'bar_association',
        url: 'https://www.ctbar.org/public/find-a-lawyer',
        frequency: 'daily',
        priority: 'high'
      },
      {
        type: 'court_list',
        url: 'https://jud.ct.gov/external/super/mediation/mediators.htm',
        frequency: 'weekly',
        priority: 'high'
      }
    ]
  },

  'MA': {
    name: 'Massachusetts',
    sources: [
      {
        type: 'bar_association',
        url: 'https://www.massbar.org/public/find-a-lawyer',
        frequency: 'daily',
        priority: 'high'
      },
      {
        type: 'mediation_center',
        url: 'https://www.mass.gov/guides/alternative-dispute-resolution-adr',
        frequency: 'weekly',
        priority: 'medium'
      }
    ]
  },

  // Add more states...
  // (Template for remaining states)
};

// Scraping configuration
const SCRAPING_CONFIG = {
  // Global settings
  userAgent: 'FairMediator/1.0 (+https://fairmediator.ai/bot)',
  requestDelay: 1000, // 1 second between requests (respect servers)
  timeout: 10000, // 10 second timeout
  retries: 3, // Retry failed requests 3 times

  // Rate limiting (per domain)
  maxRequestsPerMinute: 30,
  maxRequestsPerHour: 500,

  // Respect robots.txt
  respectRobotsTxt: true,

  // Schedule
  schedules: {
    daily: '0 2 * * *',      // 2 AM daily
    weekly: '0 3 * * 0',     // 3 AM Sunday
    monthly: '0 4 1 * *'     // 4 AM 1st of month
  },

  // Data extraction patterns
  selectors: {
    name: ['.lawyer-name', '.mediator-name', 'h2.name', '.profile-name'],
    barNumber: ['.bar-number', '.license', '[data-bar]'],
    email: ['a[href^="mailto:"]', '.email', '[data-email]'],
    phone: ['.phone', '.tel', '[data-phone]', 'a[href^="tel:"]'],
    specialization: ['.practice-areas', '.specialization', '.expertise'],
    location: ['.location', '.address', '.city-state']
  }
};

/**
 * Get scraping targets by frequency
 */
function getTargetsByFrequency(frequency) {
  const targets = [];

  Object.keys(SCRAPING_TARGETS).forEach(state => {
    SCRAPING_TARGETS[state].sources.forEach(source => {
      if (source.frequency === frequency) {
        targets.push({
          state,
          stateName: SCRAPING_TARGETS[state].name,
          ...source
        });
      }
    });
  });

  return targets.sort((a, b) => {
    // Sort by priority: high > medium > low
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

/**
 * Get all states with their sources
 */
function getAllStates() {
  return Object.keys(SCRAPING_TARGETS).map(code => ({
    code,
    name: SCRAPING_TARGETS[code].name,
    sourcesCount: SCRAPING_TARGETS[code].sources.length
  }));
}

/**
 * Get state sources
 */
function getStateSources(stateCode) {
  return SCRAPING_TARGETS[stateCode] || null;
}

/**
 * Validate state code
 */
function isValidState(stateCode) {
  return !!SCRAPING_TARGETS[stateCode];
}

module.exports = {
  SCRAPING_TARGETS,
  SCRAPING_CONFIG,
  getTargetsByFrequency,
  getAllStates,
  getStateSources,
  isValidState
};
