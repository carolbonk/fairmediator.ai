/**
 * RECAP Client Service
 * Federal court records API for conflict detection
 *
 * RECAP = Public Access to Court Electronic Records (reverse of PACER)
 * FREE API provided by Free Law Project: https://www.courtlistener.com/
 *
 * Purpose: Search federal court cases to find:
 * - Cases where mediator appeared
 * - Opposing counsel in those cases
 * - Party names and outcomes
 * - Detect conflicts when opposing counsel matches current case
 */

const axios = require('axios');
const logger = require('../../config/logger');

class RECAPClient {
  constructor() {
    // Court Listener API (RECAP database)
    this.baseURL = 'https://www.courtlistener.com/api/rest/v3';
    this.apiKey = process.env.COURTLISTENER_API_KEY; // Optional, increases rate limits
  }

  /**
   * Search for cases where mediator appeared
   * @param {string} mediatorName - Full name of mediator
   * @param {object} options - Search options
   * @returns {Promise<object>} Cases involving mediator
   */
  async searchMediatorCases(mediatorName, options = {}) {
    try {
      const {
        limit = 20,
        jurisdiction = 'federal',
        startDate = null
      } = options;

      const params = {
        q: `"${mediatorName}" AND (mediator OR arbitrator OR "neutral evaluator")`,
        type: 'o', // Opinions
        order_by: 'dateFiled desc',
        stat_Precedential: 'Published,Unpublished',
        ...( startDate && { filed_after: startDate })
      };

      const response = await this._makeRequest('/search/', params);

      const cases = response.results.map(c => this._parseCase(c));

      return {
        cases,
        total: response.count,
        mediatorName,
        searchDate: new Date()
      };
    } catch (error) {
      logger.error('RECAP case search failed', {
        mediatorName,
        error: error.message
      });
      return this._mockCaseData(mediatorName);
    }
  }

  /**
   * Check if current party/counsel appeared in mediator's past cases
   * @param {array} mediatorCases - Cases from searchMediatorCases()
   * @param {string} opposingCounsel - Opposing counsel name or firm
   * @param {string} currentParty - Current party name (optional)
   * @returns {object} Conflict analysis
   */
  async checkCaseHistoryConflict(mediatorCases, opposingCounsel, currentParty = null) {
    const conflicts = [];
    const opposingCounselLower = opposingCounsel.toLowerCase();
    const currentPartyLower = currentParty?.toLowerCase();

    mediatorCases.forEach(caseData => {
      // Check if opposing counsel appeared in this case
      const counselMatch = caseData.attorneys.some(attorney =>
        attorney.toLowerCase().includes(opposingCounselLower)
      );

      // Check if current party appeared in this case
      const partyMatch = currentPartyLower && caseData.parties.some(party =>
        party.toLowerCase().includes(currentPartyLower)
      );

      if (counselMatch || partyMatch) {
        conflicts.push({
          caseNumber: caseData.docketNumber,
          court: caseData.court,
          dateFiled: caseData.dateFiled,
          matchType: counselMatch && partyMatch ? 'both' : (counselMatch ? 'counsel' : 'party'),
          attorneys: caseData.attorneys,
          parties: caseData.parties,
          outcome: caseData.outcome,
          url: caseData.url,
          confidence: counselMatch && partyMatch ? 0.95 : (counselMatch ? 0.85 : 0.7)
        });
      }
    });

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
      riskLevel: this._calculateRiskLevel(conflicts),
      recommendation: this._generateRecommendation(conflicts, opposingCounsel),
      searchedCases: mediatorCases.length
    };
  }

  /**
   * Get detailed case information
   * @param {string} docketNumber - Case docket number
   * @param {string} court - Court identifier
   * @returns {Promise<object>} Detailed case info
   */
  async getCaseDetails(docketNumber, court) {
    try {
      const params = {
        docket_number: docketNumber,
        court: court
      };

      const response = await this._makeRequest('/dockets/', params);

      if (response.count === 0) {
        throw new Error('Case not found');
      }

      return this._parseCase(response.results[0]);
    } catch (error) {
      logger.error('RECAP case details lookup failed', {
        docketNumber,
        court,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Search for attorney/firm to get their case history
   * @param {string} attorneyName - Attorney or firm name
   * @returns {Promise<object>} Attorney's case history
   */
  async searchAttorneyCases(attorneyName) {
    try {
      const params = {
        q: `attorney:"${attorneyName}"`,
        type: 'o',
        order_by: 'dateFiled desc'
      };

      const response = await this._makeRequest('/search/', params);

      return {
        cases: response.results.map(c => this._parseCase(c)),
        total: response.count,
        attorneyName
      };
    } catch (error) {
      logger.error('RECAP attorney search failed', {
        attorneyName,
        error: error.message
      });
      return { cases: [], total: 0, attorneyName };
    }
  }

  /**
   * Make API request to Court Listener
   * @private
   */
  async _makeRequest(endpoint, params = {}) {
    const headers = {};
    if (this.apiKey) {
      headers['Authorization'] = `Token ${this.apiKey}`;
    }

    const response = await axios.get(`${this.baseURL}${endpoint}`, {
      params,
      headers,
      timeout: 10000
    });

    return response.data;
  }

  /**
   * Parse case data from Court Listener response
   * @private
   */
  _parseCase(rawCase) {
    return {
      docketNumber: rawCase.docket_number || rawCase.docketNumber,
      caseName: rawCase.case_name || rawCase.caseName,
      court: rawCase.court || rawCase.court_id,
      dateFiled: rawCase.date_filed || rawCase.dateFiled,
      dateTerminated: rawCase.date_terminated,
      parties: this._extractParties(rawCase),
      attorneys: this._extractAttorneys(rawCase),
      judges: this._extractJudges(rawCase),
      outcome: rawCase.disposition || null,
      url: rawCase.absolute_url || `https://www.courtlistener.com${rawCase.resource_uri}`,
      summary: rawCase.snippet || null
    };
  }

  /**
   * Extract party names from case
   * @private
   */
  _extractParties(rawCase) {
    // Case name format: "Party A v. Party B"
    const caseName = rawCase.case_name || rawCase.caseName || '';
    const parts = caseName.split(/\sv\.?\s/i);

    if (parts.length >= 2) {
      return parts.map(p => p.trim());
    }

    return [caseName];
  }

  /**
   * Extract attorney names from case
   * @private
   */
  _extractAttorneys(rawCase) {
    // Court Listener provides attorney info in various fields
    const attorneys = [];

    if (rawCase.attorneys) {
      attorneys.push(...rawCase.attorneys);
    }

    if (rawCase.attorney_organizations) {
      attorneys.push(...rawCase.attorney_organizations);
    }

    return attorneys;
  }

  /**
   * Extract judge names from case
   * @private
   */
  _extractJudges(rawCase) {
    const judges = [];

    if (rawCase.assigned_to_str) {
      judges.push(rawCase.assigned_to_str);
    }

    if (rawCase.referred_to_str) {
      judges.push(rawCase.referred_to_str);
    }

    return judges;
  }

  /**
   * Calculate conflict risk level
   * @private
   */
  _calculateRiskLevel(conflicts) {
    if (conflicts.length === 0) return 'clear';

    // High confidence match = red
    const highConfidence = conflicts.some(c => c.confidence >= 0.9);
    if (highConfidence) return 'red';

    // Multiple matches or both counsel + party = red
    if (conflicts.length > 2 || conflicts.some(c => c.matchType === 'both')) {
      return 'red';
    }

    // Single counsel match = yellow
    if (conflicts.some(c => c.matchType === 'counsel')) {
      return 'yellow';
    }

    // Party-only match = yellow
    return 'yellow';
  }

  /**
   * Generate recommendation based on conflicts
   * @private
   */
  _generateRecommendation(conflicts, opposingCounsel) {
    if (conflicts.length === 0) {
      return `No prior case history found with ${opposingCounsel}. Mediator appears clear.`;
    }

    const recent = conflicts.filter(c => {
      const caseDate = new Date(c.dateFiled);
      const yearsAgo = (Date.now() - caseDate) / (1000 * 60 * 60 * 24 * 365);
      return yearsAgo < 3;
    });

    if (recent.length > 0) {
      return `CONFLICT: ${recent.length} case(s) found with ${opposingCounsel} in last 3 years. Consider alternative mediator.`;
    }

    return `${conflicts.length} prior case(s) found with ${opposingCounsel}. Disclose relationship before proceeding.`;
  }

  /**
   * Analyze case outcomes to calculate win/loss rate for opposing counsel
   * NEW: Phase 2 Enhancement - Case Outcome Analysis
   *
   * @param {array} conflicts - Conflicts from checkCaseHistoryConflict()
   * @param {string} opposingCounsel - Opposing counsel name
   * @param {string} userPosition - User's position: 'plaintiff', 'defendant', 'petitioner', 'respondent'
   * @returns {object} Win/loss analysis with bias risk assessment
   */
  analyzeCaseOutcomes(conflicts, opposingCounsel, userPosition = null) {
    if (conflicts.length === 0) {
      return {
        totalCases: 0,
        wins: 0,
        losses: 0,
        settlements: 0,
        unknown: 0,
        winRate: 0,
        lossRate: 0,
        biasRisk: 'none',
        recommendation: 'No case history to analyze.'
      };
    }

    let wins = 0;
    let losses = 0;
    let settlements = 0;
    let unknown = 0;
    const caseOutcomes = [];

    conflicts.forEach(conflict => {
      const outcome = this._categorizeOutcome(conflict.outcome, conflict.caseName, opposingCounsel, userPosition);

      caseOutcomes.push({
        caseNumber: conflict.caseNumber,
        outcome: conflict.outcome,
        categorized: outcome.category,
        favoredParty: outcome.favoredParty,
        dateFiled: conflict.dateFiled
      });

      switch (outcome.category) {
        case 'win':
          wins++;
          break;
        case 'loss':
          losses++;
          break;
        case 'settlement':
          settlements++;
          break;
        default:
          unknown++;
      }
    });

    const totalDecisiveCases = wins + losses;
    const winRate = totalDecisiveCases > 0 ? (wins / totalDecisiveCases) * 100 : 0;
    const lossRate = totalDecisiveCases > 0 ? (losses / totalDecisiveCases) * 100 : 0;

    // Calculate bias risk
    let biasRisk = 'low';
    let recommendation = '';

    if (totalDecisiveCases >= 3) {
      if (winRate >= 75) {
        biasRisk = 'high';
        recommendation = `⚠️ HIGH BIAS RISK: Opposing counsel won ${Math.round(winRate)}% of cases (${wins}/${totalDecisiveCases}) with this mediator. Consider alternative mediator.`;
      } else if (winRate >= 60) {
        biasRisk = 'moderate';
        recommendation = `⚠️ MODERATE BIAS RISK: Opposing counsel won ${Math.round(winRate)}% of cases (${wins}/${totalDecisiveCases}). Disclose relationship and proceed with caution.`;
      } else if (lossRate >= 75) {
        biasRisk = 'low';
        recommendation = `✅ LOW BIAS RISK: Opposing counsel lost ${Math.round(lossRate)}% of cases (${losses}/${totalDecisiveCases}). No pattern of favoritism detected.`;
      } else {
        biasRisk = 'low';
        recommendation = `Opposing counsel has mixed outcomes (${wins}W-${losses}L-${settlements}S). No clear pattern detected.`;
      }
    } else if (totalDecisiveCases > 0) {
      recommendation = `Limited data: Only ${totalDecisiveCases} decisive case(s). Results may not be statistically significant.`;
    } else {
      recommendation = `All ${settlements} case(s) settled. No win/loss pattern available.`;
    }

    return {
      totalCases: conflicts.length,
      wins,
      losses,
      settlements,
      unknown,
      winRate: Math.round(winRate * 10) / 10,
      lossRate: Math.round(lossRate * 10) / 10,
      biasRisk,
      recommendation,
      caseOutcomes,
      statistically_significant: totalDecisiveCases >= 3
    };
  }

  /**
   * Categorize case outcome (win/loss from opposing counsel's perspective)
   * @private
   */
  _categorizeOutcome(outcome, caseName, opposingCounsel, userPosition) {
    if (!outcome) {
      return { category: 'unknown', favoredParty: null };
    }

    const outcomeLower = outcome.toLowerCase();

    // Settlement outcomes
    if (outcomeLower.includes('settl') || outcomeLower.includes('consent') || outcomeLower.includes('agreed')) {
      return { category: 'settlement', favoredParty: 'both' };
    }

    // Dismissal outcomes
    if (outcomeLower.includes('dismiss')) {
      // Dismissed with prejudice = defendant wins (plaintiff can't refile)
      // Dismissed without prejudice = inconclusive
      // Voluntary dismissal = plaintiff withdrew (often means settlement or weak case)
      if (outcomeLower.includes('with prejudice')) {
        return this._determineWinner('defendant', caseName, opposingCounsel, userPosition);
      } else if (outcomeLower.includes('voluntary')) {
        return { category: 'settlement', favoredParty: 'inconclusive' };
      }
      return { category: 'unknown', favoredParty: 'inconclusive' };
    }

    // Summary judgment outcomes
    if (outcomeLower.includes('summary judgment') || outcomeLower.includes('judgment')) {
      if (outcomeLower.includes('plaintiff')) {
        return this._determineWinner('plaintiff', caseName, opposingCounsel, userPosition);
      } else if (outcomeLower.includes('defendant')) {
        return this._determineWinner('defendant', caseName, opposingCounsel, userPosition);
      }
      // Try to parse from case name if outcome doesn't specify
      return this._parseOutcomeFromCaseName(caseName, opposingCounsel, userPosition);
    }

    // Verdict outcomes
    if (outcomeLower.includes('verdict') || outcomeLower.includes('jury')) {
      if (outcomeLower.includes('plaintiff')) {
        return this._determineWinner('plaintiff', caseName, opposingCounsel, userPosition);
      } else if (outcomeLower.includes('defendant')) {
        return this._determineWinner('defendant', caseName, opposingCounsel, userPosition);
      }
    }

    // Default: unknown
    return { category: 'unknown', favoredParty: null };
  }

  /**
   * Determine if outcome is win or loss for opposing counsel
   * @private
   */
  _determineWinner(winningParty, caseName, opposingCounsel, userPosition) {
    // If we know the user's position, we can determine if opposing counsel won/lost
    if (userPosition) {
      // User is plaintiff, opposing counsel represents defendant
      if (userPosition === 'plaintiff' || userPosition === 'petitioner') {
        if (winningParty === 'defendant') {
          return { category: 'win', favoredParty: 'defendant (opposing counsel)' };
        } else {
          return { category: 'loss', favoredParty: 'plaintiff (user)' };
        }
      }
      // User is defendant, opposing counsel represents plaintiff
      else if (userPosition === 'defendant' || userPosition === 'respondent') {
        if (winningParty === 'plaintiff') {
          return { category: 'win', favoredParty: 'plaintiff (opposing counsel)' };
        } else {
          return { category: 'loss', favoredParty: 'defendant (user)' };
        }
      }
    }

    // Without user position, we can't determine win/loss, only track winning party
    return {
      category: 'unknown',
      favoredParty: winningParty,
      note: 'User position not provided - cannot determine if opposing counsel won/lost'
    };
  }

  /**
   * Try to parse outcome from case name (e.g., "Smith v. Jones")
   * @private
   */
  _parseOutcomeFromCaseName(caseName, opposingCounsel, userPosition) {
    // Case names don't indicate outcomes - this is a fallback
    return { category: 'unknown', favoredParty: null };
  }

  /**
   * Mock case data for testing/development
   * @private
   */
  _mockCaseData(mediatorName) {
    return {
      cases: [
        {
          docketNumber: '1:20-cv-12345',
          caseName: 'ABC Corp v. XYZ LLC',
          court: 'flsd',
          dateFiled: '2020-06-15',
          parties: ['ABC Corp', 'XYZ LLC'],
          attorneys: ['Smith & Associates', 'Doe Legal Group'],
          judges: ['Hon. Jane Smith'],
          outcome: 'Settled',
          url: 'https://www.courtlistener.com/docket/12345/',
          summary: `Mediator ${mediatorName} facilitated settlement`
        }
      ],
      total: 1,
      mediatorName,
      searchDate: new Date(),
      isMockData: true
    };
  }
}

module.exports = new RECAPClient();
