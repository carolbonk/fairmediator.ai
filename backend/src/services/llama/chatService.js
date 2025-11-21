/**
 * Chat Service - Orchestrates scraping for mediator discovery
 * Uses Crawl4AI and ScrapeGraphAI for real-time data enrichment
 */

const llamaClient = require('./llamaClient');
const affiliationDetector = require('./affiliationDetector');
const ideologyClassifier = require('./ideologyClassifier');
const Mediator = require('../../models/Mediator');

class ChatService {
  constructor() {
    this.caseTypes = [
      'employment', 'business', 'family', 'real_estate',
      'contract', 'ip', 'construction', 'healthcare'
    ];
  }

  /**
   * Process a chat query with scraping-enhanced responses
   */
  async processQuery(userMessage, conversationHistory = [], options = {}) {
    try {
      // 1. Analyze user message
      const userIntent = await this._analyzeUserIntent(userMessage);

      // 2. Extract case parties for conflict checking
      const parties = this._extractParties(userMessage);

      // 3. Find matching mediators from database
      const mediators = await this._findMediators(userIntent);

      // 4. Enrich mediators with scraped data if needed
      const enrichedMediators = await this._enrichMediators(mediators, parties, options);

      // 5. Check for conflicts
      const mediatorsWithConflicts = await this._checkConflicts(enrichedMediators, parties);

      // 6. Rank and prioritize mediators
      const rankedMediators = this._rankMediators(mediatorsWithConflicts, userIntent);

      // 7. Generate response
      const response = this._generateResponse(rankedMediators, userIntent, parties);

      return {
        message: response.message,
        mediators: rankedMediators.slice(0, 10),
        caseAnalysis: {
          type: userIntent.caseType,
          parties,
          jurisdiction: userIntent.jurisdiction,
          ideologyPreference: userIntent.ideology
        },
        followUpSuggestions: response.suggestions
      };
    } catch (error) {
      console.error('Chat service error:', error);
      return {
        message: 'I encountered an issue processing your request. Please try again.',
        mediators: [],
        error: error.message
      };
    }
  }

  /**
   * Analyze user intent from message
   */
  async _analyzeUserIntent(message) {
    const lowerMessage = message.toLowerCase();

    // Extract case type
    let caseType = 'other';
    for (const type of this.caseTypes) {
      if (lowerMessage.includes(type)) {
        caseType = type;
        break;
      }
    }

    // Extract jurisdiction
    const jurisdiction = this._extractJurisdiction(lowerMessage);

    // Analyze ideology preference
    const ideologyResult = await ideologyClassifier.classifyText(message);

    // Detect urgency
    const isUrgent = /urgent|asap|immediately|emergency|deadline/i.test(message);

    // Detect specialization needs
    const specializations = this._extractSpecializations(lowerMessage);

    return {
      caseType,
      jurisdiction,
      ideology: ideologyResult.leaning,
      ideologyScore: ideologyResult.ideologyScore,
      isUrgent,
      specializations,
      rawMessage: message
    };
  }

  /**
   * Extract jurisdiction from message
   */
  _extractJurisdiction(message) {
    // US States
    const states = {
      'california': 'CA', 'new york': 'NY', 'texas': 'TX', 'florida': 'FL',
      'illinois': 'IL', 'pennsylvania': 'PA', 'ohio': 'OH', 'georgia': 'GA',
      'north carolina': 'NC', 'michigan': 'MI', 'new jersey': 'NJ', 'virginia': 'VA',
      'washington': 'WA', 'arizona': 'AZ', 'massachusetts': 'MA', 'tennessee': 'TN',
      'indiana': 'IN', 'missouri': 'MO', 'maryland': 'MD', 'wisconsin': 'WI',
      'colorado': 'CO', 'minnesota': 'MN', 'south carolina': 'SC', 'alabama': 'AL',
      'louisiana': 'LA', 'kentucky': 'KY', 'oregon': 'OR', 'oklahoma': 'OK',
      'connecticut': 'CT', 'utah': 'UT', 'iowa': 'IA', 'nevada': 'NV',
      'arkansas': 'AR', 'mississippi': 'MS', 'kansas': 'KS', 'new mexico': 'NM',
      'nebraska': 'NE', 'west virginia': 'WV', 'idaho': 'ID', 'hawaii': 'HI',
      'new hampshire': 'NH', 'maine': 'ME', 'montana': 'MT', 'rhode island': 'RI',
      'delaware': 'DE', 'south dakota': 'SD', 'north dakota': 'ND', 'alaska': 'AK',
      'vermont': 'VT', 'wyoming': 'WY'
    };

    // Major cities
    const cities = [
      'los angeles', 'new york city', 'chicago', 'houston', 'phoenix',
      'philadelphia', 'san antonio', 'san diego', 'dallas', 'san jose',
      'austin', 'jacksonville', 'fort worth', 'columbus', 'charlotte',
      'san francisco', 'indianapolis', 'seattle', 'denver', 'boston',
      'miami', 'atlanta', 'detroit', 'portland', 'las vegas'
    ];

    const result = { state: null, city: null };

    // Check for state mentions
    for (const [stateName, stateCode] of Object.entries(states)) {
      if (message.includes(stateName)) {
        result.state = stateCode;
        break;
      }
    }

    // Check for city mentions
    for (const city of cities) {
      if (message.includes(city)) {
        result.city = city;
        break;
      }
    }

    return result;
  }

  /**
   * Extract case parties from message
   */
  _extractParties(message) {
    const parties = [];

    // Look for "vs", "versus", "against" patterns
    const vsMatch = message.match(/(\w+(?:\s+\w+)*)\s+(?:vs\.?|versus|against)\s+(\w+(?:\s+\w+)*)/i);
    if (vsMatch) {
      parties.push(vsMatch[1].trim(), vsMatch[2].trim());
    }

    // Look for company names (Inc, LLC, Corp, etc.)
    const companyPattern = /\b([A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*\s+(?:Inc\.?|LLC|Corp\.?|Company|Co\.?|Ltd\.?))\b/g;
    let match;
    while ((match = companyPattern.exec(message)) !== null) {
      if (!parties.includes(match[1])) {
        parties.push(match[1]);
      }
    }

    return parties;
  }

  /**
   * Extract specializations from message
   */
  _extractSpecializations(message) {
    const specializationKeywords = {
      'employment': ['employment', 'workplace', 'discrimination', 'wrongful termination', 'harassment'],
      'commercial': ['business', 'commercial', 'contract', 'partnership'],
      'family': ['family', 'divorce', 'custody', 'child support', 'alimony'],
      'real_estate': ['real estate', 'property', 'landlord', 'tenant', 'construction'],
      'ip': ['intellectual property', 'patent', 'trademark', 'copyright', 'trade secret'],
      'healthcare': ['healthcare', 'medical', 'malpractice', 'insurance']
    };

    const found = [];
    for (const [spec, keywords] of Object.entries(specializationKeywords)) {
      if (keywords.some(kw => message.includes(kw))) {
        found.push(spec);
      }
    }

    return found;
  }

  /**
   * Find mediators from database
   */
  async _findMediators(intent) {
    const query = { isActive: true };

    // Filter by jurisdiction
    if (intent.jurisdiction.state) {
      query['location.state'] = intent.jurisdiction.state;
    }

    // Filter by specialization
    if (intent.specializations.length > 0) {
      query.specializations = { $in: intent.specializations };
    }

    const mediators = await Mediator.find(query)
      .limit(50)
      .sort({ yearsExperience: -1 });

    return mediators;
  }

  /**
   * Enrich mediators with scraped data
   */
  async _enrichMediators(mediators, parties, options = {}) {
    if (!options.enableScraping) {
      return mediators.map(m => m.toObject ? m.toObject() : m);
    }

    const enriched = [];

    for (const mediator of mediators.slice(0, 10)) { // Limit scraping to top 10
      const mediatorObj = mediator.toObject ? mediator.toObject() : mediator;

      // Check if data is stale (older than 30 days)
      const lastVerified = mediator.dataQuality?.lastVerified;
      const isStale = !lastVerified || (Date.now() - lastVerified.getTime()) > 30 * 24 * 60 * 60 * 1000;

      if (isStale) {
        try {
          // Scrape for updated profile info
          const urls = llamaClient.buildSearchUrls(mediator.name, mediator.location?.state);
          const profileData = await llamaClient.scrapeMediatorProfile(urls.martindale, mediator.name);

          if (profileData.success && profileData.data) {
            mediatorObj.scrapedData = profileData.data;
            mediatorObj.dataFreshness = 'fresh';
          }
        } catch (error) {
          console.error(`Failed to enrich mediator ${mediator.name}:`, error.message);
        }
      }

      enriched.push(mediatorObj);
    }

    // Add remaining mediators without enrichment
    for (const mediator of mediators.slice(10)) {
      enriched.push(mediator.toObject ? mediator.toObject() : mediator);
    }

    return enriched;
  }

  /**
   * Check conflicts for all mediators
   */
  async _checkConflicts(mediators, parties) {
    if (parties.length === 0) {
      return mediators.map(m => ({ ...m, conflictStatus: { hasConflict: false } }));
    }

    const results = [];

    for (const mediator of mediators) {
      // Use quick check for performance
      const conflictStatus = await affiliationDetector.quickCheck(mediator._id, parties);
      results.push({
        ...mediator,
        conflictStatus
      });
    }

    return results;
  }

  /**
   * Rank mediators based on user intent and conflicts
   */
  _rankMediators(mediators, intent) {
    return mediators
      .map(mediator => {
        let score = 50; // Base score

        // Penalize conflicts
        if (mediator.conflictStatus?.hasConflict) {
          score -= mediator.conflictStatus.highRisk ? 40 : 20;
        }

        // Boost for matching specializations
        if (intent.specializations.length > 0 && mediator.specializations) {
          const matchCount = intent.specializations.filter(s =>
            mediator.specializations.includes(s)
          ).length;
          score += matchCount * 10;
        }

        // Boost for ideology neutrality (or preference match)
        if (mediator.ideologyScore !== undefined) {
          const ideologyDistance = Math.abs(mediator.ideologyScore - (intent.ideologyScore || 0));
          score -= ideologyDistance * 2; // Closer ideology = higher score
        }

        // Boost for experience
        if (mediator.yearsExperience) {
          score += Math.min(mediator.yearsExperience, 20);
        }

        // Boost for fresh data
        if (mediator.dataFreshness === 'fresh') {
          score += 5;
        }

        return {
          ...mediator,
          matchScore: Math.max(0, Math.min(100, score))
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Generate response message
   */
  _generateResponse(mediators, intent, parties) {
    const validMediators = mediators.filter(m => !m.conflictStatus?.highRisk);
    const conflictMediators = mediators.filter(m => m.conflictStatus?.hasConflict);

    let message = '';

    if (validMediators.length === 0) {
      message = `I couldn't find suitable mediators for your ${intent.caseType} case`;
      if (intent.jurisdiction.state) {
        message += ` in ${intent.jurisdiction.state}`;
      }
      message += '. Try broadening your search criteria.';
    } else {
      message = `I found ${validMediators.length} mediator${validMediators.length !== 1 ? 's' : ''} for your ${intent.caseType} case`;

      if (intent.jurisdiction.state) {
        message += ` in ${intent.jurisdiction.state}`;
      }

      message += '.';

      if (conflictMediators.length > 0) {
        message += ` Note: ${conflictMediators.length} mediator${conflictMediators.length !== 1 ? 's were' : ' was'} flagged for potential conflicts.`;
      }

      // Add top recommendation
      const top = validMediators[0];
      if (top) {
        message += `\n\nTop recommendation: **${top.name}**`;
        if (top.yearsExperience) {
          message += ` (${top.yearsExperience} years experience)`;
        }
        if (top.matchScore) {
          message += ` - Match score: ${top.matchScore}%`;
        }
      }
    }

    const suggestions = [
      'Would you like me to check for any specific conflicts of interest?',
      'Should I analyze the political leanings of these mediators?',
      'Do you need mediators with specific certifications?'
    ];

    if (intent.isUrgent) {
      suggestions.unshift('I noticed this is urgent. Would you like me to filter for mediators with immediate availability?');
    }

    return {
      message,
      suggestions: suggestions.slice(0, 3)
    };
  }

  /**
   * Search for specific mediator by name with scraping
   */
  async searchMediatorByName(name) {
    // First check database
    const dbMediator = await Mediator.findOne({
      name: { $regex: name, $options: 'i' }
    });

    if (dbMediator) {
      // Enrich with fresh data
      const urls = llamaClient.buildSearchUrls(name);
      const freshData = await llamaClient.scrapeBulk(
        [urls.martindale, urls.avvo, urls.linkedin].filter(Boolean),
        `Find detailed information about ${name}, a mediator/arbitrator`
      );

      return {
        found: true,
        mediator: dbMediator.toObject(),
        freshData: freshData.results
      };
    }

    // Not in database - scrape to find
    const urls = llamaClient.buildSearchUrls(name);
    const searchResults = await llamaClient.scrapeBulk(
      Object.values(urls).slice(0, 5),
      `Find mediator/arbitrator profile for ${name}`
    );

    return {
      found: false,
      searchResults: searchResults.results,
      message: `${name} not in our database. Here's what we found online.`
    };
  }

  /**
   * Health check for the service
   */
  async healthCheck() {
    const scraperHealth = await llamaClient.healthCheck();

    return {
      status: scraperHealth.status === 'healthy' ? 'healthy' : 'degraded',
      scraper: scraperHealth,
      database: 'connected' // Assumes mongoose is connected
    };
  }
}

const chatService = new ChatService();
module.exports = chatService;
