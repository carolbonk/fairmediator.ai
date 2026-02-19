const MediatorSelection = require('../../models/MediatorSelection');
const CaseOutcome = require('../../models/CaseOutcome');
const logger = require('../../config/logger');
const { escapeRegex } = require('../../utils/sanitization');

class ContextBuilder {
  async buildContextForQuery(caseType, jurisdiction, ideology) {
    const insights = await this.gatherInsights(caseType, jurisdiction, ideology);

    if (!insights.hasData) {
      return this.getDefaultContext();
    }

    return `
PAST CASE DATA:
- ${insights.totalCases} similar cases analyzed
- Top mediators: ${insights.topMediators.join(', ')}
- ${ideology} success rate: ${insights.ideologySuccessRate}%
- Avg settlement: ${insights.avgSettlementDays} days
- Common rate: $${insights.commonHourlyRate}/hr
- Satisfaction: ${insights.avgSatisfaction}/5

INSIGHTS:
${insights.keyInsights.map(i => `- ${i}`).join('\n')}
`;
  }

  async gatherInsights(caseType, jurisdiction, ideology) {
    try {
      const query = { outcome: { $in: ['settled', 'resolved'] } };

      if (caseType) query.caseType = new RegExp(escapeRegex(caseType), 'i');
      if (jurisdiction?.state) query['jurisdiction.state'] = jurisdiction.state;

      const cases = await CaseOutcome.find(query)
        .populate('mediatorId')
        .limit(100)
        .sort({ createdAt: -1 });

      if (!cases.length) return { hasData: false };

      const mediatorStats = this.calcMediatorStats(cases);
      const ideologyStats = this.calcIdeologyStats(cases, ideology);
      const timingStats = this.calcTimingStats(cases);

      return {
        hasData: true,
        totalCases: cases.length,
        topMediators: mediatorStats.topPerformers.slice(0, 3),
        ideologySuccessRate: ideologyStats.successRate,
        avgSettlementDays: timingStats.avgDays,
        commonHourlyRate: timingStats.commonRate,
        avgSatisfaction: mediatorStats.avgSatisfaction,
        keyInsights: this.getKeyInsights(mediatorStats, ideologyStats, timingStats)
      };
    } catch (err) {
      logger.error('gatherInsights error', { error: err.message });
      return { hasData: false };
    }
  }

  calcMediatorStats(cases) {
    const stats = new Map();

    cases.forEach(c => {
      const id = c.mediatorId?._id?.toString();
      if (!id) return;

      if (!stats.has(id)) {
        stats.set(id, { name: c.mediatorId.name, cases: 0, satisfaction: 0, settled: 0 });
      }

      const s = stats.get(id);
      s.cases++;
      s.satisfaction += c.userSatisfaction || 0;
      if (c.outcome === 'settled') s.settled++;
    });

    const performers = Array.from(stats.values())
      .sort((a, b) => {
        const scoreA = (a.satisfaction / a.cases) * (a.settled / a.cases);
        const scoreB = (b.satisfaction / b.cases) * (b.settled / b.cases);
        return scoreB - scoreA;
      })
      .map(m => m.name);

    const avgSat = Array.from(stats.values())
      .reduce((sum, m) => sum + (m.satisfaction / m.cases), 0) / stats.size;

    return { topPerformers: performers, avgSatisfaction: avgSat.toFixed(1) };
  }

  calcIdeologyStats(cases, ideology) {
    const filtered = cases.filter(c => c.mediatorId?.ideology?.leaning === ideology);
    if (!filtered.length) return { successRate: 50 };

    const success = filtered.filter(c => ['settled', 'resolved'].includes(c.outcome)).length;
    return { successRate: Math.round((success / filtered.length) * 100) };
  }

  calcTimingStats(cases) {
    const days = cases.filter(c => c.settlementDays).map(c => c.settlementDays);
    const rates = cases.filter(c => c.mediatorId?.hourlyRate).map(c => c.mediatorId.hourlyRate);

    const avgDays = days.length ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : 30;

    const freq = {};
    rates.forEach(r => freq[r] = (freq[r] || 0) + 1);
    const commonRate = rates.length
      ? parseInt(Object.keys(freq).reduce((a, b) => freq[a] > freq[b] ? a : b))
      : 250;

    return { avgDays, commonRate };
  }

  getKeyInsights(mediatorStats, ideologyStats, timingStats) {
    const insights = [];

    if (ideologyStats.successRate > 70) {
      insights.push(`${ideologyStats.successRate}% success rate with this ideology`);
    } else if (ideologyStats.successRate < 40) {
      insights.push('Consider moderated mediators for better outcomes');
    }

    if (timingStats.avgDays < 20) {
      insights.push(`Fast resolution: ~${timingStats.avgDays} days avg`);
    }

    if (mediatorStats.avgSatisfaction > 4.0) {
      insights.push('High satisfaction with recommended mediators');
    }

    return insights.length ? insights : ['Moderated mediators recommended'];
  }

  getDefaultContext() {
    return `
NO HISTORICAL DATA YET:
- Prioritizing moderated mediators
- Using experience and ratings
- Checking for conflicts
`;
  }

  async getMediatorHistory(mediatorId) {
    try {
      const outcomes = await CaseOutcome.find({ mediatorId })
        .sort({ createdAt: -1 })
        .limit(50);

      if (!outcomes.length) return null;

      const settled = outcomes.filter(o => o.outcome === 'settled').length;
      const avgSat = outcomes
        .filter(o => o.userSatisfaction)
        .reduce((sum, o) => sum + o.userSatisfaction, 0) / outcomes.length || 0;

      return {
        totalCases: outcomes.length,
        settlementRate: Math.round((settled / outcomes.length) * 100),
        avgSatisfaction: avgSat.toFixed(1),
        recentSuccess: outcomes.slice(0, 10).filter(o => o.outcome === 'settled').length >= 7
      };
    } catch (err) {
      logger.error('getMediatorHistory error', { error: err.message });
      return null;
    }
  }

  async trackSelection(data) {
    const selection = new MediatorSelection(data);
    await selection.save();
    return selection;
  }

  async recordOutcome(data) {
    const outcome = new CaseOutcome(data);
    await outcome.save();
    return outcome;
  }
}

module.exports = new ContextBuilder();
