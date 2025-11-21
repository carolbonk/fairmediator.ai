/**
 * Ideology Classifier - Scrape-based political bias detection
 * Uses Crawl4AI and ScrapeGraphAI for comprehensive ideology analysis
 */

const llamaClient = require('./llamaClient');
const Mediator = require('../../models/Mediator');

class IdeologyClassifier {
  constructor() {
    this.leanings = {
      LIBERAL: 'liberal',
      CONSERVATIVE: 'conservative',
      NEUTRAL: 'neutral'
    };

    // Keyword patterns for fallback classification
    this.liberalKeywords = [
      'progressive', 'equality', 'social justice', 'diversity', 'inclusion',
      'environmental', 'climate', 'reform', 'civil rights', 'labor rights',
      'aclu', 'planned parenthood', 'democratic', 'democrat'
    ];

    this.conservativeKeywords = [
      'traditional', 'liberty', 'free market', 'constitutional', 'federalist',
      'heritage foundation', 'chambers of commerce', 'republican', 'gop',
      'family values', 'religious freedom', 'deregulation', 'fiscal conservative'
    ];
  }

  /**
   * Classify ideology for a mediator using web scraping
   */
  async classifyMediator(mediatorId) {
    try {
      const mediator = await Mediator.findById(mediatorId);
      if (!mediator) {
        throw new Error('Mediator not found');
      }

      // Start with database indicators
      let result = this._classifyFromDatabase(mediator);

      // Enhance with web scraping if confidence is low
      if (result.confidence < 60) {
        const scrapedResult = await this._scrapeIdeologyIndicators(mediator);
        result = this._mergeResults(result, scrapedResult);
      }

      // Update mediator record with new ideology score
      if (result.confidence > 50) {
        await this._updateMediatorIdeology(mediatorId, result);
      }

      return result;
    } catch (error) {
      console.error('Ideology classification error:', error);
      return {
        leaning: this.leanings.NEUTRAL,
        confidence: 0,
        ideologyScore: 0,
        reasoning: 'Classification failed: ' + error.message,
        indicators: []
      };
    }
  }

  /**
   * Classify text content for ideology (user messages, documents)
   */
  async classifyText(text) {
    if (!text || text.trim().length === 0) {
      return {
        leaning: this.leanings.NEUTRAL,
        confidence: 0,
        reasoning: 'No text provided'
      };
    }

    const lowerText = text.toLowerCase();

    // Count keyword matches
    let liberalScore = 0;
    let conservativeScore = 0;

    for (const keyword of this.liberalKeywords) {
      if (lowerText.includes(keyword)) {
        liberalScore++;
      }
    }

    for (const keyword of this.conservativeKeywords) {
      if (lowerText.includes(keyword)) {
        conservativeScore++;
      }
    }

    const total = liberalScore + conservativeScore;

    if (total === 0) {
      return {
        leaning: this.leanings.NEUTRAL,
        confidence: 50,
        ideologyScore: 0,
        reasoning: 'No ideological indicators detected in text'
      };
    }

    // Calculate score from -10 (liberal) to +10 (conservative)
    const ideologyScore = ((conservativeScore - liberalScore) / total) * 10;

    let leaning;
    if (ideologyScore < -3) {
      leaning = this.leanings.LIBERAL;
    } else if (ideologyScore > 3) {
      leaning = this.leanings.CONSERVATIVE;
    } else {
      leaning = this.leanings.NEUTRAL;
    }

    return {
      leaning,
      confidence: Math.min(total * 15, 100),
      ideologyScore: Math.round(ideologyScore * 100) / 100,
      reasoning: `Found ${liberalScore} liberal and ${conservativeScore} conservative indicators`,
      liberalMatches: liberalScore,
      conservativeMatches: conservativeScore
    };
  }

  /**
   * Classify from database bias indicators
   */
  _classifyFromDatabase(mediator) {
    const indicators = [];
    let liberalScore = 0;
    let conservativeScore = 0;

    // Check existing ideology score
    if (mediator.ideologyScore !== undefined && mediator.ideologyScore !== null) {
      return {
        leaning: this._scoreToLeaning(mediator.ideologyScore),
        confidence: 70,
        ideologyScore: mediator.ideologyScore,
        reasoning: 'Using existing database ideology score',
        indicators: [],
        source: 'database'
      };
    }

    // Analyze bias indicators
    if (mediator.biasIndicators) {
      // Political donations
      if (mediator.biasIndicators.donationHistory) {
        for (const donation of mediator.biasIndicators.donationHistory) {
          const party = donation.party?.toLowerCase();
          if (party === 'democrat' || party === 'democratic') {
            liberalScore += 2;
            indicators.push({
              type: 'donation',
              value: `${donation.recipient} (${donation.year})`,
              leaning: this.leanings.LIBERAL
            });
          } else if (party === 'republican' || party === 'gop') {
            conservativeScore += 2;
            indicators.push({
              type: 'donation',
              value: `${donation.recipient} (${donation.year})`,
              leaning: this.leanings.CONSERVATIVE
            });
          }
        }
      }

      // Political affiliations
      if (mediator.biasIndicators.politicalAffiliations) {
        for (const affiliation of mediator.biasIndicators.politicalAffiliations) {
          const affLower = affiliation.toLowerCase();
          if (this.liberalKeywords.some(k => affLower.includes(k))) {
            liberalScore++;
            indicators.push({
              type: 'affiliation',
              value: affiliation,
              leaning: this.leanings.LIBERAL
            });
          } else if (this.conservativeKeywords.some(k => affLower.includes(k))) {
            conservativeScore++;
            indicators.push({
              type: 'affiliation',
              value: affiliation,
              leaning: this.leanings.CONSERVATIVE
            });
          }
        }
      }

      // Public statements
      if (mediator.biasIndicators.publicStatements) {
        for (const statement of mediator.biasIndicators.publicStatements) {
          if (statement.sentiment === 'liberal') {
            liberalScore++;
            indicators.push({
              type: 'statement',
              value: statement.statement?.substring(0, 100),
              leaning: this.leanings.LIBERAL
            });
          } else if (statement.sentiment === 'conservative') {
            conservativeScore++;
            indicators.push({
              type: 'statement',
              value: statement.statement?.substring(0, 100),
              leaning: this.leanings.CONSERVATIVE
            });
          }
        }
      }
    }

    const total = liberalScore + conservativeScore;

    if (total === 0) {
      return {
        leaning: this.leanings.NEUTRAL,
        confidence: 20,
        ideologyScore: 0,
        reasoning: 'No bias indicators in database',
        indicators,
        source: 'database'
      };
    }

    const ideologyScore = ((conservativeScore - liberalScore) / total) * 10;

    return {
      leaning: this._scoreToLeaning(ideologyScore),
      confidence: Math.min(total * 20, 80),
      ideologyScore: Math.round(ideologyScore * 100) / 100,
      reasoning: `Database analysis: ${liberalScore} liberal, ${conservativeScore} conservative indicators`,
      indicators,
      source: 'database'
    };
  }

  /**
   * Scrape web sources for ideology indicators
   */
  async _scrapeIdeologyIndicators(mediator) {
    try {
      const urls = llamaClient.buildSearchUrls(mediator.name, mediator.location?.state);

      // Prioritize FEC (donations) and LinkedIn
      const urlsToScrape = [
        urls.fec,
        urls.linkedin,
        urls.martindale
      ].filter(Boolean);

      const result = await llamaClient.scrapeIdeology(urlsToScrape, mediator.name);

      if (result.success) {
        return {
          leaning: result.leaning,
          confidence: result.confidence,
          ideologyScore: result.ideology_score,
          reasoning: `Web scraping found ideology indicators`,
          indicators: result.indicators,
          source: 'web_scrape'
        };
      }

      return {
        leaning: this.leanings.NEUTRAL,
        confidence: 0,
        ideologyScore: 0,
        reasoning: 'Web scraping returned no results',
        indicators: [],
        source: 'web_scrape'
      };
    } catch (error) {
      console.error('Ideology scraping failed:', error.message);
      return {
        leaning: this.leanings.NEUTRAL,
        confidence: 0,
        ideologyScore: 0,
        reasoning: 'Web scraping failed: ' + error.message,
        indicators: [],
        source: 'web_scrape'
      };
    }
  }

  /**
   * Merge database and scraped results
   */
  _mergeResults(dbResult, scrapedResult) {
    // Weight: 60% scraped (more current), 40% database
    const weightedScore = (scrapedResult.ideologyScore * 0.6) + (dbResult.ideologyScore * 0.4);
    const mergedConfidence = Math.min(
      (scrapedResult.confidence * 0.6) + (dbResult.confidence * 0.4),
      100
    );

    return {
      leaning: this._scoreToLeaning(weightedScore),
      confidence: Math.round(mergedConfidence),
      ideologyScore: Math.round(weightedScore * 100) / 100,
      reasoning: `Combined analysis from database and web scraping`,
      indicators: [...dbResult.indicators, ...(scrapedResult.indicators || [])],
      source: 'merged'
    };
  }

  /**
   * Convert ideology score to leaning label
   */
  _scoreToLeaning(score) {
    if (score < -3) return this.leanings.LIBERAL;
    if (score > 3) return this.leanings.CONSERVATIVE;
    return this.leanings.NEUTRAL;
  }

  /**
   * Update mediator record with ideology classification
   */
  async _updateMediatorIdeology(mediatorId, result) {
    try {
      await Mediator.findByIdAndUpdate(mediatorId, {
        $set: {
          ideologyScore: result.ideologyScore,
          'dataQuality.lastVerified': new Date()
        }
      });
    } catch (error) {
      console.error('Failed to update mediator ideology:', error);
    }
  }

  /**
   * Batch classify multiple mediators
   */
  async classifyBatch(mediatorIds) {
    const results = await Promise.all(
      mediatorIds.map(id => this.classifyMediator(id))
    );

    return results.map((result, index) => ({
      mediatorId: mediatorIds[index],
      ...result
    }));
  }

  /**
   * Get ideology balance for a list of mediators
   */
  async analyzeBalance(mediatorIds) {
    const results = await this.classifyBatch(mediatorIds);

    const liberal = results.filter(r => r.leaning === this.leanings.LIBERAL).length;
    const conservative = results.filter(r => r.leaning === this.leanings.CONSERVATIVE).length;
    const neutral = results.filter(r => r.leaning === this.leanings.NEUTRAL).length;
    const total = results.length;

    return {
      liberal: { count: liberal, percentage: Math.round((liberal / total) * 100) },
      conservative: { count: conservative, percentage: Math.round((conservative / total) * 100) },
      neutral: { count: neutral, percentage: Math.round((neutral / total) * 100) },
      averageScore: results.reduce((sum, r) => sum + r.ideologyScore, 0) / total,
      isBalanced: Math.abs(liberal - conservative) <= 1
    };
  }
}

const ideologyClassifier = new IdeologyClassifier();
module.exports = ideologyClassifier;
