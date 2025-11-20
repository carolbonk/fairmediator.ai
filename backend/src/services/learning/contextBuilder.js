/**
 * Context Builder - Smart Learning Without Model Training
 * Tracks user behavior and builds dynamic context for AI
 * FREE TIER - No model training, just smart data analysis
 */

const MediatorSelection = require('../../models/MediatorSelection');
const CaseOutcome = require('../../models/CaseOutcome');

class ContextBuilder {
  /**
   * Build intelligent context based on historical data
   */
  async buildContextForQuery(caseType, jurisdiction, ideology) {
    const insights = await this.gatherInsights(caseType, jurisdiction, ideology);

    if (!insights.hasData) {
      return this.getDefaultContext();
    }

    return `
LEARNING FROM PAST CASES:
- Analyzed ${insights.totalCases} similar cases
- Top performing mediators: ${insights.topMediators.join(', ')}
- Success rate with ${ideology} mediators: ${insights.ideologySuccessRate}%
- Average settlement time: ${insights.avgSettlementDays} days
- Most common hourly rate: $${insights.commonHourlyRate}
- User satisfaction average: ${insights.avgSatisfaction}/5

KEY INSIGHTS:
${insights.keyInsights.map(i => `- ${i}`).join('\n')}
`;
  }

  /**
   * Gather insights from historical selections and outcomes
   */
  async gatherInsights(caseType, jurisdiction, ideology) {
    try {
      // Get successful past cases
      const query = { outcome: { $in: ['settled', 'resolved'] } };

      if (caseType) {
        query.caseType = new RegExp(caseType, 'i');
      }

      if (jurisdiction?.state) {
        query['jurisdiction.state'] = jurisdiction.state;
      }

      const successfulCases = await CaseOutcome.find(query)
        .populate('mediatorId')
        .limit(100)
        .sort({ createdAt: -1 });

      if (successfulCases.length === 0) {
        return { hasData: false };
      }

      // Calculate mediator success rates
      const mediatorStats = this.calculateMediatorStats(successfulCases);

      // Get ideology performance
      const ideologyStats = this.calculateIdeologyStats(successfulCases, ideology);

      // Calculate timing and cost insights
      const timingInsights = this.calculateTimingInsights(successfulCases);

      return {
        hasData: true,
        totalCases: successfulCases.length,
        topMediators: mediatorStats.topPerformers.slice(0, 3),
        ideologySuccessRate: ideologyStats.successRate,
        avgSettlementDays: timingInsights.avgDays,
        commonHourlyRate: timingInsights.commonRate,
        avgSatisfaction: mediatorStats.avgSatisfaction,
        keyInsights: this.generateKeyInsights(mediatorStats, ideologyStats, timingInsights)
      };
    } catch (error) {
      console.error('Error gathering insights:', error);
      return { hasData: false };
    }
  }

  /**
   * Calculate mediator performance statistics
   */
  calculateMediatorStats(cases) {
    const mediatorMap = new Map();

    cases.forEach(c => {
      const key = c.mediatorId?._id?.toString();
      if (!key) return;

      if (!mediatorMap.has(key)) {
        mediatorMap.set(key, {
          name: c.mediatorId.name,
          cases: 0,
          totalSatisfaction: 0,
          settlements: 0
        });
      }

      const stats = mediatorMap.get(key);
      stats.cases++;
      stats.totalSatisfaction += c.userSatisfaction || 0;
      if (c.outcome === 'settled') stats.settlements++;
    });

    const topPerformers = Array.from(mediatorMap.values())
      .sort((a, b) => {
        const aScore = (a.totalSatisfaction / a.cases) * (a.settlements / a.cases);
        const bScore = (b.totalSatisfaction / b.cases) * (b.settlements / b.cases);
        return bScore - aScore;
      })
      .map(m => m.name);

    const avgSatisfaction = Array.from(mediatorMap.values())
      .reduce((sum, m) => sum + (m.totalSatisfaction / m.cases), 0) / mediatorMap.size;

    return {
      topPerformers,
      avgSatisfaction: avgSatisfaction.toFixed(1)
    };
  }

  /**
   * Calculate ideology-specific performance
   */
  calculateIdeologyStats(cases, targetIdeology) {
    const ideologyCases = cases.filter(c =>
      c.mediatorId?.ideology?.leaning === targetIdeology
    );

    if (ideologyCases.length === 0) {
      return { successRate: 50 }; // Default
    }

    const successful = ideologyCases.filter(c =>
      c.outcome === 'settled' || c.outcome === 'resolved'
    ).length;

    return {
      successRate: Math.round((successful / ideologyCases.length) * 100)
    };
  }

  /**
   * Calculate timing and cost insights
   */
  calculateTimingInsights(cases) {
    const timings = cases
      .filter(c => c.settlementDays)
      .map(c => c.settlementDays);

    const rates = cases
      .filter(c => c.mediatorId?.hourlyRate)
      .map(c => c.mediatorId.hourlyRate);

    const avgDays = timings.length > 0
      ? Math.round(timings.reduce((a, b) => a + b, 0) / timings.length)
      : 30;

    // Find most common rate (mode)
    const rateFreq = {};
    rates.forEach(r => {
      rateFreq[r] = (rateFreq[r] || 0) + 1;
    });
    const commonRate = rates.length > 0
      ? Object.keys(rateFreq).reduce((a, b) => rateFreq[a] > rateFreq[b] ? a : b)
      : 250;

    return { avgDays, commonRate: parseInt(commonRate) };
  }

  /**
   * Generate actionable insights
   */
  generateKeyInsights(mediatorStats, ideologyStats, timingInsights) {
    const insights = [];

    if (ideologyStats.successRate > 70) {
      insights.push(`High ${ideologyStats.successRate}% success rate with this ideology`);
    } else if (ideologyStats.successRate < 40) {
      insights.push(`Consider moderated mediators - higher success rates observed`);
    }

    if (timingInsights.avgDays < 20) {
      insights.push(`Quick resolution: cases settle in ${timingInsights.avgDays} days on average`);
    }

    if (mediatorStats.avgSatisfaction > 4.0) {
      insights.push(`High client satisfaction with recommended mediators`);
    }

    if (insights.length === 0) {
      insights.push('Neutral mediators recommended for balanced outcomes');
    }

    return insights;
  }

  /**
   * Default context when no historical data available
   */
  getDefaultContext() {
    return `
GENERAL GUIDANCE (No historical data yet - building your learning database):
- Prioritizing moderated mediators for balanced outcomes
- Considering experience, specialization, and ratings
- Evaluating potential conflicts of interest
- As you use FairMediator, AI recommendations will improve based on successful outcomes
`;
  }

  /**
   * Get mediator-specific historical performance
   */
  async getMediatorHistory(mediatorId) {
    try {
      const outcomes = await CaseOutcome.find({ mediatorId })
        .sort({ createdAt: -1 })
        .limit(50);

      if (outcomes.length === 0) {
        return null;
      }

      const settled = outcomes.filter(o => o.outcome === 'settled').length;
      const avgSatisfaction = outcomes
        .filter(o => o.userSatisfaction)
        .reduce((sum, o) => sum + o.userSatisfaction, 0) / outcomes.length || 0;

      return {
        totalCases: outcomes.length,
        settlementRate: Math.round((settled / outcomes.length) * 100),
        avgSatisfaction: avgSatisfaction.toFixed(1),
        recentSuccess: outcomes.slice(0, 10).filter(o => o.outcome === 'settled').length >= 7
      };
    } catch (error) {
      console.error('Error getting mediator history:', error);
      return null;
    }
  }

  /**
   * Track mediator selection (called from frontend)
   */
  async trackSelection(selectionData) {
    try {
      const selection = new MediatorSelection(selectionData);
      await selection.save();
      console.log(`Tracked selection: ${selectionData.action} for mediator ${selectionData.mediatorId}`);
      return selection;
    } catch (error) {
      console.error('Error tracking selection:', error);
      throw error;
    }
  }

  /**
   * Record case outcome (called after case completes)
   */
  async recordOutcome(outcomeData) {
    try {
      const outcome = new CaseOutcome(outcomeData);
      await outcome.save();
      console.log(`Recorded outcome: ${outcomeData.outcome} for case with mediator ${outcomeData.mediatorId}`);
      return outcome;
    } catch (error) {
      console.error('Error recording outcome:', error);
      throw error;
    }
  }
}

module.exports = new ContextBuilder();
