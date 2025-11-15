/**
 * Analytics Service
 * Aggregates usage data for dashboards and insights
 * DRY: Reusable queries for all analytics needs
 */

const UsageLog = require('../../models/UsageLog');
const User = require('../../models/User');
const Mediator = require('../../models/Mediator');

class AnalyticsService {
  /**
   * Get user dashboard stats
   * DRY: Single source for all user analytics
   */
  async getUserStats(userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await UsageLog.find({
      user: userId,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: -1 });

    // Aggregate by event type
    const byType = {};
    logs.forEach(log => {
      if (!byType[log.eventType]) {
        byType[log.eventType] = 0;
      }
      byType[log.eventType]++;
    });

    // Get daily breakdown
    const dailyActivity = this.aggregateByDay(logs, days);

    // Get most searched practice areas
    const searchLogs = logs.filter(l => l.eventType === 'search');
    const practiceAreas = {};
    searchLogs.forEach(log => {
      const area = log.metadata?.filters?.practiceArea;
      if (area) {
        practiceAreas[area] = (practiceAreas[area] || 0) + 1;
      }
    });

    return {
      totalActions: logs.length,
      byType,
      dailyActivity,
      topPracticeAreas: Object.entries(practiceAreas)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([area, count]) => ({ area, count })),
      period: {
        start: startDate,
        end: new Date(),
        days
      }
    };
  }

  /**
   * Get platform-wide analytics (admin only)
   * DRY: Reusable for admin dashboards
   */
  async getPlatformStats(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalUsers, premiumUsers, recentLogs, totalMediators] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ subscriptionTier: 'premium' }),
      UsageLog.find({ createdAt: { $gte: startDate } }),
      Mediator.countDocuments()
    ]);

    // Conversion rate
    const conversionRate = totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0;

    // Event breakdown
    const eventCounts = {};
    recentLogs.forEach(log => {
      eventCounts[log.eventType] = (eventCounts[log.eventType] || 0) + 1;
    });

    // Daily activity
    const dailyActivity = this.aggregateByDay(recentLogs, days);

    return {
      users: {
        total: totalUsers,
        premium: premiumUsers,
        free: totalUsers - premiumUsers,
        conversionRate: conversionRate.toFixed(2) + '%'
      },
      mediators: {
        total: totalMediators
      },
      activity: {
        total: recentLogs.length,
        byType: eventCounts,
        dailyActivity
      },
      period: {
        start: startDate,
        end: new Date(),
        days
      }
    };
  }

  /**
   * Get conversion funnel stats
   * DRY: Track user journey from registration to upgrade
   */
  async getConversionFunnel(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      registrations,
      searches,
      profileViews,
      upgrades
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: startDate } }),
      UsageLog.countDocuments({ 
        eventType: 'search',
        createdAt: { $gte: startDate }
      }),
      UsageLog.countDocuments({
        eventType: 'profile_view',
        createdAt: { $gte: startDate }
      }),
      UsageLog.countDocuments({
        eventType: 'upgrade_initiated',
        createdAt: { $gte: startDate }
      })
    ]);

    return {
      registrations,
      searches,
      profileViews,
      upgrades,
      conversionRate: registrations > 0 ? ((upgrades / registrations) * 100).toFixed(2) + '%' : '0%'
    };
  }

  /**
   * Aggregate logs by day
   * DRY: Reusable for any time-series data
   */
  aggregateByDay(logs, days) {
    const dailyData = {};

    // Initialize all days
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      dailyData[key] = 0;
    }

    // Count logs per day
    logs.forEach(log => {
      const key = log.createdAt.toISOString().split('T')[0];
      if (dailyData.hasOwnProperty(key)) {
        dailyData[key]++;
      }
    });

    // Convert to array and sort
    return Object.entries(dailyData)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  /**
   * Get popular mediators by views
   * DRY: Reusable for recommendations
   */
  async getPopularMediators(limit = 10) {
    const profileViews = await UsageLog.aggregate([
      { $match: { eventType: 'profile_view' } },
      { $group: {
        _id: '$metadata.mediatorId',
        views: { $sum: 1 },
        name: { $first: '$metadata.mediatorName' }
      }},
      { $sort: { views: -1 } },
      { $limit: limit }
    ]);

    return profileViews.map(item => ({
      mediatorId: item._id,
      name: item.name,
      views: item.views
    }));
  }

  /**
   * Get search trends
   * DRY: Identify popular search terms
   */
  async getSearchTrends(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const searches = await UsageLog.find({
      eventType: 'search',
      createdAt: { $gte: startDate }
    });

    const trends = {
      practiceAreas: {},
      locations: {},
      ideologies: {}
    };

    searches.forEach(search => {
      const filters = search.metadata?.filters || {};

      if (filters.practiceArea) {
        trends.practiceAreas[filters.practiceArea] = 
          (trends.practiceAreas[filters.practiceArea] || 0) + 1;
      }

      if (filters.location) {
        trends.locations[filters.location] = 
          (trends.locations[filters.location] || 0) + 1;
      }

      if (filters.ideology) {
        trends.ideologies[filters.ideology] = 
          (trends.ideologies[filters.ideology] || 0) + 1;
      }
    });

    return {
      topPracticeAreas: this.topN(trends.practiceAreas, 5),
      topLocations: this.topN(trends.locations, 5),
      ideologyDistribution: trends.ideologies
    };
  }

  /**
   * Helper: Get top N from object
   * DRY: Reusable sorting helper
   */
  topN(obj, n) {
    return Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([key, count]) => ({ label: key, count }));
  }
}

module.exports = new AnalyticsService();
