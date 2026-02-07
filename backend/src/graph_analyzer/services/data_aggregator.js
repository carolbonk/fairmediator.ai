/**
 * Data Aggregator - Historical Trend Analysis
 *
 * Aggregates and analyzes contribution/lobbying data over time
 * to build historical trends and pre-categorized datasets.
 *
 * Replaces need for OpenSecrets' pre-aggregated data.
 *
 * @module graph_analyzer/services/data_aggregator
 */

const logger = require('../../config/logger');
const { Relationship } = require('../models/graph_schema');
const { getIndustryDistribution } = require('./industry_classifier');

/**
 * Aggregate Schema for MongoDB
 * Stores pre-computed aggregations for fast queries
 */
const aggregationSchema = {
  aggregationType: String, // 'mediator_profile', 'industry_trends', 'party_trends'
  entityId: String, // Mediator ID, industry code, etc.
  timeframe: {
    start: Date,
    end: Date,
    period: String // 'quarterly', 'yearly', 'all-time'
  },
  metrics: {
    totalContributions: Number,
    totalAmount: Number,
    avgContribution: Number,
    uniqueRecipients: Number,
    topRecipients: Array,
    industryBreakdown: Object,
    partyBreakdown: Object,
    trends: Array
  },
  lastUpdated: Date,
  dataSource: String
};

class DataAggregator {
  /**
   * Build comprehensive profile for a mediator
   * Aggregates all FEC, lobbying, and court data
   *
   * @param {String} mediatorId - Mediator's entity ID
   * @param {Object} options - Time range options
   * @returns {Object} Aggregated mediator profile
   */
  static async buildMediatorProfile(mediatorId, options = {}) {
    const startDate = options.startDate || new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000); // 5 years ago
    const endDate = options.endDate || new Date();

    try {
      // Get all relationships for mediator in timeframe
      const relationships = await Relationship.find({
        sourceId: mediatorId,
        'metadata.date': { $gte: startDate, $lte: endDate }
      });

      // Separate by type
      const donations = relationships.filter(r => r.relationshipType === 'DONATED_TO');
      const lobbying = relationships.filter(r => r.relationshipType === 'LOBBIED_FOR');
      const cases = relationships.filter(r => r.relationshipType === 'SHARED_CASE');

      // Aggregate donations
      const donationStats = this._aggregateDonations(donations);

      // Aggregate lobbying
      const lobbyingStats = this._aggregateLobbying(lobbying);

      // Aggregate case history
      const caseStats = this._aggregateCases(cases);

      // Calculate time series trends
      const trends = this._calculateTrends(relationships, startDate, endDate);

      return {
        mediatorId,
        timeframe: { start: startDate, end: endDate },
        donations: donationStats,
        lobbying: lobbyingStats,
        cases: caseStats,
        trends,
        lastUpdated: new Date()
      };

    } catch (error) {
      logger.error(`[DataAggregator] Error building mediator profile:`, error.message);
      throw error;
    }
  }

  /**
   * Aggregate donation data
   * @private
   */
  static _aggregateDonations(donations) {
    if (donations.length === 0) {
      return {
        totalContributions: 0,
        totalAmount: 0,
        avgContribution: 0
      };
    }

    const totalAmount = donations.reduce((sum, d) => sum + (d.metadata.amount || 0), 0);

    // Party breakdown
    const partyBreakdown = {};
    donations.forEach(d => {
      const party = d.metadata.candidateParty || 'Unknown';
      if (!partyBreakdown[party]) {
        partyBreakdown[party] = { count: 0, amount: 0 };
      }
      partyBreakdown[party].count++;
      partyBreakdown[party].amount += (d.metadata.amount || 0);
    });

    // Industry breakdown
    const industryBreakdown = {};
    donations.forEach(d => {
      const industry = d.metadata.industry || 'OTHER';
      if (!industryBreakdown[industry]) {
        industryBreakdown[industry] = {
          category: d.metadata.industryCategory || 'Other',
          count: 0,
          amount: 0
        };
      }
      industryBreakdown[industry].count++;
      industryBreakdown[industry].amount += (d.metadata.amount || 0);
    });

    // Calculate percentages
    Object.keys(partyBreakdown).forEach(party => {
      partyBreakdown[party].percentage = (partyBreakdown[party].amount / totalAmount) * 100;
    });

    Object.keys(industryBreakdown).forEach(industry => {
      industryBreakdown[industry].percentage = (industryBreakdown[industry].amount / totalAmount) * 100;
    });

    return {
      totalContributions: donations.length,
      totalAmount,
      avgContribution: totalAmount / donations.length,
      partyBreakdown,
      industryBreakdown,
      topRecipients: this._getTopRecipients(donations, 10)
    };
  }

  /**
   * Aggregate lobbying data
   * @private
   */
  static _aggregateLobbying(lobbying) {
    if (lobbying.length === 0) {
      return {
        totalFilings: 0,
        totalClients: 0
      };
    }

    const clients = new Set(lobbying.map(l => l.metadata.registrantName).filter(Boolean));
    const issueAreas = new Set(lobbying.flatMap(l => l.metadata.issueAreas || []));

    const totalAmount = lobbying.reduce((sum, l) => sum + (l.metadata.amount || 0), 0);

    return {
      totalFilings: lobbying.length,
      totalClients: clients.size,
      totalAmount,
      clients: Array.from(clients).slice(0, 10),
      issueAreas: Array.from(issueAreas),
      byYear: this._groupByYear(lobbying)
    };
  }

  /**
   * Aggregate case history
   * @private
   */
  static _aggregateCases(cases) {
    if (cases.length === 0) {
      return {
        totalCases: 0
      };
    }

    return {
      totalCases: cases.length,
      courts: [...new Set(cases.map(c => c.metadata.court).filter(Boolean))],
      opponents: this._getTopOpponents(cases, 10),
      byYear: this._groupByYear(cases)
    };
  }

  /**
   * Calculate time series trends
   * @private
   */
  static _calculateTrends(relationships, startDate, endDate) {
    // Group by quarter
    const quarters = {};
    const msPerQuarter = 3 * 30 * 24 * 60 * 60 * 1000; // Approximate

    relationships.forEach(rel => {
      const date = new Date(rel.metadata.date || rel.lastVerified);
      if (!date || date < startDate || date > endDate) return;

      const quarterKey = this._getQuarterKey(date);

      if (!quarters[quarterKey]) {
        quarters[quarterKey] = {
          donations: { count: 0, amount: 0 },
          lobbying: { count: 0 },
          cases: { count: 0 }
        };
      }

      if (rel.relationshipType === 'DONATED_TO') {
        quarters[quarterKey].donations.count++;
        quarters[quarterKey].donations.amount += (rel.metadata.amount || 0);
      } else if (rel.relationshipType === 'LOBBIED_FOR') {
        quarters[quarterKey].lobbying.count++;
      } else if (rel.relationshipType === 'SHARED_CASE') {
        quarters[quarterKey].cases.count++;
      }
    });

    // Convert to array and sort
    const trendData = Object.keys(quarters)
      .sort()
      .map(quarter => ({
        quarter,
        ...quarters[quarter]
      }));

    return trendData;
  }

  /**
   * Get top recipients by contribution amount
   * @private
   */
  static _getTopRecipients(donations, limit = 10) {
    const recipients = {};

    donations.forEach(d => {
      const name = d.metadata.candidateName || 'Unknown';
      if (!recipients[name]) {
        recipients[name] = {
          count: 0,
          amount: 0,
          party: d.metadata.candidateParty
        };
      }
      recipients[name].count++;
      recipients[name].amount += (d.metadata.amount || 0);
    });

    return Object.entries(recipients)
      .sort((a, b) => b[1].amount - a[1].amount)
      .slice(0, limit)
      .map(([name, data]) => ({
        name,
        ...data
      }));
  }

  /**
   * Get top opponents by case count
   * @private
   */
  static _getTopOpponents(cases, limit = 10) {
    const opponents = {};

    cases.forEach(c => {
      const name = c.metadata.opposingCounsel || 'Unknown';
      if (!opponents[name]) {
        opponents[name] = { count: 0 };
      }
      opponents[name].count++;
    });

    return Object.entries(opponents)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit)
      .map(([name, data]) => ({
        name,
        caseCount: data.count
      }));
  }

  /**
   * Group relationships by year
   * @private
   */
  static _groupByYear(relationships) {
    const byYear = {};

    relationships.forEach(rel => {
      const date = new Date(rel.metadata.date || rel.lastVerified);
      if (!date) return;

      const year = date.getFullYear();
      if (!byYear[year]) {
        byYear[year] = 0;
      }
      byYear[year]++;
    });

    return byYear;
  }

  /**
   * Get quarter key (e.g., "2024-Q1")
   * @private
   */
  static _getQuarterKey(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const quarter = Math.ceil(month / 3);
    return `${year}-Q${quarter}`;
  }

  /**
   * Calculate industry trends over time
   * Shows how different industries donate/lobby over time
   *
   * @param {String} industry - Industry code
   * @param {Object} options - Time range options
   * @returns {Object} Industry trend data
   */
  static async getIndustryTrends(industry, options = {}) {
    const startDate = options.startDate || new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000);
    const endDate = options.endDate || new Date();

    try {
      // Get all relationships for this industry
      const relationships = await Relationship.find({
        'metadata.industry': industry,
        'metadata.date': { $gte: startDate, $lte: endDate }
      });

      const trends = this._calculateTrends(relationships, startDate, endDate);

      return {
        industry,
        timeframe: { start: startDate, end: endDate },
        totalActivity: relationships.length,
        trends,
        topActors: this._getTopActors(relationships, 10)
      };

    } catch (error) {
      logger.error(`[DataAggregator] Error getting industry trends:`, error.message);
      throw error;
    }
  }

  /**
   * Get top actors (donors/lobbyists) in an industry
   * @private
   */
  static _getTopActors(relationships, limit = 10) {
    const actors = {};

    relationships.forEach(rel => {
      const actorId = rel.sourceId;
      if (!actors[actorId]) {
        actors[actorId] = {
          count: 0,
          totalAmount: 0
        };
      }
      actors[actorId].count++;
      actors[actorId].totalAmount += (rel.metadata.amount || 0);
    });

    return Object.entries(actors)
      .sort((a, b) => b[1].totalAmount - a[1].totalAmount)
      .slice(0, limit)
      .map(([id, data]) => ({
        actorId: id,
        ...data
      }));
  }

  /**
   * Cache aggregation results for fast retrieval
   * Stores in MongoDB for quick access
   *
   * @param {String} type - Aggregation type
   * @param {String} entityId - Entity or industry ID
   * @param {Object} data - Aggregated data
   * @returns {Promise}
   */
  static async cacheAggregation(type, entityId, data) {
    // TODO: Implement MongoDB caching using a dedicated Aggregation collection
    // For now, just log
    logger.info(`[DataAggregator] Cached ${type} aggregation for ${entityId}`);
    return data;
  }
}

module.exports = DataAggregator;
