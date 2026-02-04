/**
 * Multi-Signal Bias Detection Service
 * Combines ALL bias indicators with weighted scoring
 *
 * Signals:
 * 1. Case outcomes (win/loss with specific counsel) - Weight: 0.8
 * 2. RECAP case history (worked together?) - Weight: 0.6
 * 3. LinkedIn mutual connections (social closeness) - Weight: 0.4
 * 4. Affiliations (current/past relationships) - Weight: 0.5
 * 5. Donation history (political alignment) - Weight: 0.3
 * 6. Public statements (ideology) - Weight: 0.2
 *
 * Phase 2 Enhancement: Making Limitations Less Limiting
 */

const logger = require('../../config/logger');

class MultiSignalBiasDetection {
  constructor() {
    // Signal weights (sum doesn't need to equal 1.0 - we normalize)
    this.weights = {
      case_outcomes: 0.8,        // Strongest signal - direct evidence
      case_history: 0.6,         // Strong signal - they worked together
      linkedin_connections: 0.4, // Moderate signal - social closeness
      affiliations: 0.5,         // Moderate signal - professional ties
      donations: 0.3,            // Weaker signal - political alignment
      public_statements: 0.2     // Weakest signal - rhetoric vs action
    };

    // Bias threshold levels
    this.thresholds = {
      low: 0.3,      // < 30% = Low bias risk
      moderate: 0.6, // 30-60% = Moderate bias risk
      high: 0.8      // > 60% = High bias risk
    };
  }

  /**
   * Calculate unified bias score from all available signals
   * @param {object} signals - All bias signals
   * @returns {object} Unified bias assessment
   */
  calculateBiasScore(signals) {
    const {
      caseOutcomes = null,        // From recapClient.analyzeCaseOutcomes()
      caseHistory = null,         // From RECAP conflicts
      linkedinData = null,        // From LinkedIn mutual connections
      affiliations = [],          // From mediator.affiliations
      donations = [],             // From mediator.biasIndicators.donationHistory
      publicStatements = []       // From mediator.biasIndicators.publicStatements
    } = signals;

    const activeSignals = [];
    let totalWeightedScore = 0;
    let totalWeight = 0;

    // Signal 1: Case Outcomes (Strongest)
    if (caseOutcomes && caseOutcomes.totalCases > 0) {
      const outcomeScore = this._scoreOutcomes(caseOutcomes);
      activeSignals.push({
        type: 'case_outcomes',
        score: outcomeScore,
        weight: this.weights.case_outcomes,
        contribution: outcomeScore * this.weights.case_outcomes,
        confidence: caseOutcomes.statistically_significant ? 0.9 : 0.6,
        details: `${caseOutcomes.wins}W-${caseOutcomes.losses}L (${caseOutcomes.winRate}% win rate)`
      });
      totalWeightedScore += outcomeScore * this.weights.case_outcomes;
      totalWeight += this.weights.case_outcomes;
    }

    // Signal 2: Case History (Strong)
    if (caseHistory && caseHistory.hasConflict) {
      const historyScore = this._scoreCaseHistory(caseHistory);
      activeSignals.push({
        type: 'case_history',
        score: historyScore,
        weight: this.weights.case_history,
        contribution: historyScore * this.weights.case_history,
        confidence: caseHistory.conflicts.some(c => c.confidence >= 0.9) ? 0.9 : 0.7,
        details: `${caseHistory.conflicts.length} case(s) with opposing counsel`
      });
      totalWeightedScore += historyScore * this.weights.case_history;
      totalWeight += this.weights.case_history;
    }

    // Signal 3: LinkedIn Connections (Moderate)
    if (linkedinData && linkedinData.mutualConnectionsCount > 0) {
      const linkedinScore = this._scoreLinkedIn(linkedinData);
      activeSignals.push({
        type: 'linkedin_connections',
        score: linkedinScore,
        weight: this.weights.linkedin_connections,
        contribution: linkedinScore * this.weights.linkedin_connections,
        confidence: linkedinData.relationshipStrength?.confidence || 0.5,
        details: `${linkedinData.mutualConnectionsCount} mutual connection(s)`
      });
      totalWeightedScore += linkedinScore * this.weights.linkedin_connections;
      totalWeight += this.weights.linkedin_connections;
    }

    // Signal 4: Affiliations (Moderate)
    if (affiliations.length > 0) {
      const affiliationScore = this._scoreAffiliations(affiliations);
      activeSignals.push({
        type: 'affiliations',
        score: affiliationScore,
        weight: this.weights.affiliations,
        contribution: affiliationScore * this.weights.affiliations,
        confidence: affiliations.some(a => a.isCurrent) ? 0.8 : 0.5,
        details: `${affiliations.length} affiliation(s) detected`
      });
      totalWeightedScore += affiliationScore * this.weights.affiliations;
      totalWeight += this.weights.affiliations;
    }

    // Signal 5: Donations (Weaker)
    if (donations.length > 0) {
      const donationScore = this._scoreDonations(donations);
      activeSignals.push({
        type: 'donations',
        score: donationScore,
        weight: this.weights.donations,
        contribution: donationScore * this.weights.donations,
        confidence: 0.5,
        details: `${donations.length} donation(s) - political alignment indicator`
      });
      totalWeightedScore += donationScore * this.weights.donations;
      totalWeight += this.weights.donations;
    }

    // Signal 6: Public Statements (Weakest)
    if (publicStatements.length > 0) {
      const statementScore = this._scoreStatements(publicStatements);
      activeSignals.push({
        type: 'public_statements',
        score: statementScore,
        weight: this.weights.public_statements,
        contribution: statementScore * this.weights.public_statements,
        confidence: 0.4,
        details: `${publicStatements.length} public statement(s) analyzed`
      });
      totalWeightedScore += statementScore * this.weights.public_statements;
      totalWeight += this.weights.public_statements;
    }

    // Calculate normalized bias score (0-1 scale)
    const biasScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

    // Determine bias level
    let biasLevel = 'low';
    let recommendation = '';

    if (biasScore >= this.thresholds.high) {
      biasLevel = 'high';
      recommendation = 'HIGH BIAS RISK: Multiple strong signals indicate favoritism toward opposing counsel. Select different mediator.';
    } else if (biasScore >= this.thresholds.moderate) {
      biasLevel = 'moderate';
      recommendation = 'MODERATE BIAS RISK: Several indicators suggest possible favoritism. Disclose relationship and proceed with caution.';
    } else if (biasScore >= this.thresholds.low) {
      biasLevel = 'low';
      recommendation = 'LOW BIAS RISK: Minor connections detected. Disclosure recommended for transparency.';
    } else {
      biasLevel = 'minimal';
      recommendation = 'MINIMAL BIAS RISK: Limited connections found. Mediator appears appropriate for this case.';
    }

    return {
      biasScore: Math.round(biasScore * 100) / 100,
      biasLevel,
      recommendation,
      activeSignals,
      signalCount: activeSignals.length,
      totalWeight,
      breakdown: this._createBreakdown(activeSignals, biasScore)
    };
  }

  /**
   * Score case outcomes (win/loss rate)
   * @private
   */
  _scoreOutcomes(outcomes) {
    // Win rate of 75%+ = 1.0 (maximum bias)
    // Win rate of 50% = 0.5 (neutral)
    // Win rate of 25% or less = 0.0 (no bias, actually favorable)

    if (!outcomes.totalCases || (outcomes.wins + outcomes.losses === 0)) {
      return 0;
    }

    const winRate = outcomes.winRate / 100; // Convert to 0-1 scale

    // Map win rate to bias score
    // 0-50%: score = winRate (0.0 to 0.5)
    // 50-100%: score = winRate (0.5 to 1.0)
    return winRate;
  }

  /**
   * Score case history (number and recency of cases)
   * @private
   */
  _scoreCaseHistory(history) {
    const caseCount = history.conflicts.length;

    // Count recent cases (< 3 years)
    const recentCases = history.conflicts.filter(c => {
      if (!c.dateFiled) return false;
      const yearsAgo = (Date.now() - new Date(c.dateFiled)) / (1000 * 60 * 60 * 24 * 365);
      return yearsAgo < 3;
    }).length;

    // Score based on count and recency
    // 1 case = 0.3, 2 cases = 0.5, 3+ cases = 0.7
    // +0.2 if any recent cases
    let score = Math.min(0.3 + (caseCount - 1) * 0.2, 0.7);
    if (recentCases > 0) {
      score = Math.min(score + 0.2, 1.0);
    }

    return score;
  }

  /**
   * Score LinkedIn connections (relationship strength)
   * @private
   */
  _scoreLinkedIn(data) {
    const count = data.mutualConnectionsCount;

    // 0-2: weak (0.2)
    // 3-10: moderate (0.4)
    // 11-30: strong (0.7)
    // 31+: very strong (1.0)

    if (count <= 2) return 0.2;
    if (count <= 10) return 0.4;
    if (count <= 30) return 0.7;
    return 1.0;
  }

  /**
   * Score affiliations (current vs past, type)
   * @private
   */
  _scoreAffiliations(affiliations) {
    let score = 0;

    // Current affiliations = higher score
    const currentCount = affiliations.filter(a => a.isCurrent).length;
    const pastCount = affiliations.length - currentCount;

    score = (currentCount * 0.4) + (pastCount * 0.2);

    return Math.min(score, 1.0);
  }

  /**
   * Score donation history (political alignment)
   * @private
   */
  _scoreDonations(donations) {
    // Donations indicate political alignment, not direct favoritism
    // Score based on amount and frequency

    const totalAmount = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const recentDonations = donations.filter(d => {
      const yearsAgo = (new Date().getFullYear()) - (d.year || 0);
      return yearsAgo < 5;
    });

    // $0-1000: 0.2, $1001-5000: 0.4, $5001+: 0.6
    let score = totalAmount >= 5000 ? 0.6 : totalAmount >= 1000 ? 0.4 : 0.2;

    // +0.2 if recent donations
    if (recentDonations.length > 0) {
      score = Math.min(score + 0.2, 1.0);
    }

    return score;
  }

  /**
   * Score public statements (sentiment analysis)
   * @private
   */
  _scoreStatements(statements) {
    // Count statements with strong sentiment
    const strongSentiment = statements.filter(s =>
      s.sentiment && (s.sentiment.includes('liberal') || s.sentiment.includes('conservative'))
    ).length;

    // More statements with clear ideology = higher score
    return Math.min(strongSentiment * 0.2, 0.8);
  }

  /**
   * Create visual breakdown of signal contributions
   * @private
   */
  _createBreakdown(signals, totalScore) {
    return signals.map(signal => ({
      signal: signal.type,
      individualScore: signal.score,
      weight: signal.weight,
      contribution: signal.contribution,
      percentageOfTotal: totalScore > 0 ? Math.round((signal.contribution / totalScore) * 100) : 0,
      confidence: signal.confidence,
      details: signal.details
    })).sort((a, b) => b.contribution - a.contribution); // Sort by contribution
  }

  /**
   * Get signal weights configuration
   * @returns {object} Current weight settings
   */
  getWeights() {
    return { ...this.weights };
  }

  /**
   * Update signal weight (for testing/tuning)
   * @param {string} signal - Signal type
   * @param {number} weight - New weight value
   */
  updateWeight(signal, weight) {
    if (this.weights.hasOwnProperty(signal)) {
      this.weights[signal] = weight;
      logger.info(`Updated weight for ${signal}:`, weight);
    }
  }
}

module.exports = new MultiSignalBiasDetection();
