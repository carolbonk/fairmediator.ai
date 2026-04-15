/**
 * Mediator Earnings Model
 * Tracks financial data, projections, and profitability metrics for mediators
 */

const mongoose = require('mongoose');

const mediatorEarningsSchema = new mongoose.Schema({
  mediatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mediator',
    required: true,
    unique: true
  },

  // Current Financial Metrics
  currentMetrics: {
    hourlyRate: {
      type: Number,
      required: true,
      min: 0,
      default: 350
    },
    averageSessionHours: {
      type: Number,
      default: 4
    },
    sessionsPerMonth: {
      type: Number,
      default: 0
    },
    monthlyRevenue: {
      type: Number,
      default: 0
    },
    yearToDateRevenue: {
      type: Number,
      default: 0
    },
    lastTwelveMonthsRevenue: {
      type: Number,
      default: 0
    },
    // Cost structure
    overhead: {
      office: { type: Number, default: 0 },
      admin: { type: Number, default: 0 },
      marketing: { type: Number, default: 0 },
      insurance: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    netProfit: {
      type: Number,
      default: 0
    },
    profitMargin: {
      type: Number,  // Percentage
      default: 0
    }
  },

  // Historical Performance
  historicalData: [{
    month: {
      type: Date,
      required: true
    },
    sessions: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    },
    expenses: {
      type: Number,
      default: 0
    },
    netProfit: {
      type: Number,
      default: 0
    },
    averageRate: {
      type: Number,
      default: 0
    },
    totalHours: {
      type: Number,
      default: 0
    },
    caseTypes: {
      employment: { type: Number, default: 0 },
      commercial: { type: Number, default: 0 },
      family: { type: Number, default: 0 },
      realEstate: { type: Number, default: 0 },
      personalInjury: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    }
  }],

  // Revenue Streams
  revenueStreams: {
    mediation: {
      enabled: { type: Boolean, default: true },
      monthlyRevenue: { type: Number, default: 0 },
      percentage: { type: Number, default: 100 }
    },
    onlineDisputeResolution: {
      enabled: { type: Boolean, default: false },
      monthlyRevenue: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
      platformFee: { type: Number, default: 15 } // Percentage fee for ODR platform
    },
    lawyerCollaboration: {
      enabled: { type: Boolean, default: false },
      monthlyRevenue: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
      referralFee: { type: Number, default: 10 } // Percentage referral fee
    },
    training: {
      enabled: { type: Boolean, default: false },
      monthlyRevenue: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    },
    consulting: {
      enabled: { type: Boolean, default: false },
      monthlyRevenue: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    }
  },

  // Projections (1-3 year)
  projections: {
    baseScenario: {
      year1: {
        revenue: { type: Number, default: 0 },
        expenses: { type: Number, default: 0 },
        netProfit: { type: Number, default: 0 },
        sessions: { type: Number, default: 0 },
        growthRate: { type: Number, default: 5 } // Percentage
      },
      year2: {
        revenue: { type: Number, default: 0 },
        expenses: { type: Number, default: 0 },
        netProfit: { type: Number, default: 0 },
        sessions: { type: Number, default: 0 },
        growthRate: { type: Number, default: 7 }
      },
      year3: {
        revenue: { type: Number, default: 0 },
        expenses: { type: Number, default: 0 },
        netProfit: { type: Number, default: 0 },
        sessions: { type: Number, default: 0 },
        growthRate: { type: Number, default: 10 }
      }
    },
    odrScenario: {
      enabled: { type: Boolean, default: false },
      additionalSessions: { type: Number, default: 20 }, // Percentage increase
      lowerRate: { type: Number, default: -15 }, // Percentage decrease in rate
      year1: {
        revenue: { type: Number, default: 0 },
        netProfit: { type: Number, default: 0 },
        sessions: { type: Number, default: 0 }
      },
      year2: {
        revenue: { type: Number, default: 0 },
        netProfit: { type: Number, default: 0 },
        sessions: { type: Number, default: 0 }
      },
      year3: {
        revenue: { type: Number, default: 0 },
        netProfit: { type: Number, default: 0 },
        sessions: { type: Number, default: 0 }
      }
    },
    collaborationScenario: {
      enabled: { type: Boolean, default: false },
      additionalSessions: { type: Number, default: 35 }, // Percentage increase
      referralBonus: { type: Number, default: 500 }, // Fixed amount per referral
      year1: {
        revenue: { type: Number, default: 0 },
        netProfit: { type: Number, default: 0 },
        sessions: { type: Number, default: 0 }
      },
      year2: {
        revenue: { type: Number, default: 0 },
        netProfit: { type: Number, default: 0 },
        sessions: { type: Number, default: 0 }
      },
      year3: {
        revenue: { type: Number, default: 0 },
        netProfit: { type: Number, default: 0 },
        sessions: { type: Number, default: 0 }
      }
    }
  },

  // Market Position Analytics
  marketPosition: {
    ratePercentile: {
      type: Number,  // Where mediator's rate falls in market (0-100)
      default: 50
    },
    volumePercentile: {
      type: Number,  // Where mediator's case volume falls
      default: 50
    },
    revenuePercentile: {
      type: Number,
      default: 50
    },
    competitorComparison: {
      averageMarketRate: { type: Number, default: 0 },
      averageMarketSessions: { type: Number, default: 0 },
      averageMarketRevenue: { type: Number, default: 0 }
    }
  },

  // Client Distribution
  clientAnalytics: {
    repeatClientRate: {
      type: Number,  // Percentage
      default: 0
    },
    topReferralSources: [{
      source: String,  // e.g., "Smith & Associates Law Firm"
      count: Number,
      revenue: Number
    }],
    clientTypes: {
      corporate: { percentage: Number, avgValue: Number },
      smallBusiness: { percentage: Number, avgValue: Number },
      individual: { percentage: Number, avgValue: Number },
      government: { percentage: Number, avgValue: Number }
    }
  },

  // Service Packages & Pricing
  servicePackages: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    basePrice: {
      type: Number,
      required: true
    },
    includedHours: {
      type: Number,
      default: 0
    },
    additionalHourRate: {
      type: Number,
      default: 0
    },
    features: [String],
    isActive: {
      type: Boolean,
      default: true
    },
    monthlySubscribers: {
      type: Number,
      default: 0
    }
  }],

  // Goals & Targets
  financialGoals: {
    monthlyRevenueTarget: {
      type: Number,
      default: 0
    },
    annualRevenueTarget: {
      type: Number,
      default: 0
    },
    sessionsPerMonthTarget: {
      type: Number,
      default: 0
    },
    targetProfitMargin: {
      type: Number,  // Percentage
      default: 60
    },
    targetDate: Date
  },

  // Calculation Settings
  calculationSettings: {
    includeODR: {
      type: Boolean,
      default: false
    },
    includeCollaboration: {
      type: Boolean,
      default: false
    },
    taxRate: {
      type: Number,  // Percentage
      default: 30
    },
    inflationRate: {
      type: Number,  // Percentage
      default: 3
    },
    marketGrowthRate: {
      type: Number,  // Percentage
      default: 5
    }
  },

  // Metadata
  lastCalculated: {
    type: Date,
    default: Date.now
  },
  isPublic: {
    type: Boolean,
    default: false  // Whether to show earnings data to attorneys (anonymized)
  }
}, {
  timestamps: true
});

// Indexes for performance
mediatorEarningsSchema.index({ mediatorId: 1 });
mediatorEarningsSchema.index({ 'currentMetrics.monthlyRevenue': -1 });
mediatorEarningsSchema.index({ 'marketPosition.revenuePercentile': -1 });
mediatorEarningsSchema.index({ lastCalculated: -1 });

// Methods

/**
 * Calculate current profitability
 */
mediatorEarningsSchema.methods.calculateProfitability = function() {
  const totalRevenue = this.currentMetrics.monthlyRevenue;
  const totalExpenses = Object.values(this.currentMetrics.overhead).reduce((sum, val) => sum + val, 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  this.currentMetrics.netProfit = netProfit;
  this.currentMetrics.profitMargin = profitMargin;

  return {
    revenue: totalRevenue,
    expenses: totalExpenses,
    netProfit,
    profitMargin
  };
};

/**
 * Generate projections for different scenarios
 */
mediatorEarningsSchema.methods.generateProjections = function() {
  const currentMonthlyRevenue = this.currentMetrics.monthlyRevenue;
  const currentMonthlyExpenses = Object.values(this.currentMetrics.overhead).reduce((sum, val) => sum + val, 0);
  const currentSessions = this.currentMetrics.sessionsPerMonth;

  // Base scenario projections
  for (let year = 1; year <= 3; year++) {
    const growthRate = this.projections.baseScenario[`year${year}`].growthRate / 100;
    const inflationRate = this.calculationSettings.inflationRate / 100;

    const yearKey = `year${year}`;
    const yearProjection = this.projections.baseScenario[yearKey];

    yearProjection.revenue = currentMonthlyRevenue * 12 * Math.pow(1 + growthRate, year);
    yearProjection.expenses = currentMonthlyExpenses * 12 * Math.pow(1 + inflationRate, year);
    yearProjection.netProfit = yearProjection.revenue - yearProjection.expenses;
    yearProjection.sessions = currentSessions * 12 * Math.pow(1 + growthRate, year);
  }

  // ODR scenario projections
  if (this.projections.odrScenario.enabled) {
    const sessionIncrease = 1 + (this.projections.odrScenario.additionalSessions / 100);
    const rateAdjustment = 1 + (this.projections.odrScenario.lowerRate / 100);

    for (let year = 1; year <= 3; year++) {
      const yearKey = `year${year}`;
      const baseProjection = this.projections.baseScenario[yearKey];
      const odrProjection = this.projections.odrScenario[yearKey];

      odrProjection.sessions = baseProjection.sessions * sessionIncrease;
      odrProjection.revenue = odrProjection.sessions *
                              (this.currentMetrics.hourlyRate * rateAdjustment) *
                              this.currentMetrics.averageSessionHours / 12;

      // Account for platform fees
      const platformFees = odrProjection.revenue * (this.revenueStreams.onlineDisputeResolution.platformFee / 100);
      odrProjection.netProfit = odrProjection.revenue - baseProjection.expenses - platformFees;
    }
  }

  // Collaboration scenario projections
  if (this.projections.collaborationScenario.enabled) {
    const sessionIncrease = 1 + (this.projections.collaborationScenario.additionalSessions / 100);
    const referralBonus = this.projections.collaborationScenario.referralBonus;

    for (let year = 1; year <= 3; year++) {
      const yearKey = `year${year}`;
      const baseProjection = this.projections.baseScenario[yearKey];
      const collabProjection = this.projections.collaborationScenario[yearKey];

      collabProjection.sessions = baseProjection.sessions * sessionIncrease;
      collabProjection.revenue = collabProjection.sessions *
                                  this.currentMetrics.hourlyRate *
                                  this.currentMetrics.averageSessionHours / 12;

      // Add referral bonuses
      const estimatedReferrals = collabProjection.sessions * 0.2; // Assume 20% come from referrals
      const referralRevenue = estimatedReferrals * referralBonus;
      collabProjection.revenue += referralRevenue;

      // Account for referral fees paid out
      const referralFees = collabProjection.revenue * (this.revenueStreams.lawyerCollaboration.referralFee / 100);
      collabProjection.netProfit = collabProjection.revenue - baseProjection.expenses - referralFees;
    }
  }

  this.lastCalculated = new Date();
  return this.projections;
};

/**
 * Calculate market position
 */
mediatorEarningsSchema.methods.calculateMarketPosition = async function() {
  const MediatorEarnings = this.constructor;

  // Get all mediator earnings for comparison
  const allEarnings = await MediatorEarnings.find({
    'currentMetrics.monthlyRevenue': { $gt: 0 }
  }).select('currentMetrics.hourlyRate currentMetrics.monthlyRevenue currentMetrics.sessionsPerMonth');

  if (allEarnings.length === 0) {
    return this.marketPosition;
  }

  // Sort by different metrics
  const rates = allEarnings.map(e => e.currentMetrics.hourlyRate).sort((a, b) => a - b);
  const revenues = allEarnings.map(e => e.currentMetrics.monthlyRevenue).sort((a, b) => a - b);
  const sessions = allEarnings.map(e => e.currentMetrics.sessionsPerMonth).sort((a, b) => a - b);

  // Calculate percentiles
  const getPercentile = (arr, value) => {
    const index = arr.findIndex(v => v >= value);
    return index === -1 ? 100 : (index / arr.length) * 100;
  };

  this.marketPosition.ratePercentile = getPercentile(rates, this.currentMetrics.hourlyRate);
  this.marketPosition.revenuePercentile = getPercentile(revenues, this.currentMetrics.monthlyRevenue);
  this.marketPosition.volumePercentile = getPercentile(sessions, this.currentMetrics.sessionsPerMonth);

  // Calculate market averages
  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  this.marketPosition.competitorComparison.averageMarketRate = avg(rates);
  this.marketPosition.competitorComparison.averageMarketRevenue = avg(revenues);
  this.marketPosition.competitorComparison.averageMarketSessions = avg(sessions);

  return this.marketPosition;
};

// Static Methods

/**
 * Get top earners
 */
mediatorEarningsSchema.statics.getTopEarners = function(limit = 10) {
  return this.find({ isPublic: true })
    .sort({ 'currentMetrics.monthlyRevenue': -1 })
    .limit(limit)
    .populate('mediatorId', 'name location specializations')
    .select('mediatorId currentMetrics.monthlyRevenue marketPosition');
};

/**
 * Get market insights
 */
mediatorEarningsSchema.statics.getMarketInsights = async function() {
  const aggregation = await this.aggregate([
    {
      $match: { 'currentMetrics.monthlyRevenue': { $gt: 0 } }
    },
    {
      $group: {
        _id: null,
        avgHourlyRate: { $avg: '$currentMetrics.hourlyRate' },
        avgMonthlyRevenue: { $avg: '$currentMetrics.monthlyRevenue' },
        avgSessions: { $avg: '$currentMetrics.sessionsPerMonth' },
        avgProfitMargin: { $avg: '$currentMetrics.profitMargin' },
        totalMediators: { $sum: 1 },
        odrAdoption: {
          $sum: { $cond: ['$revenueStreams.onlineDisputeResolution.enabled', 1, 0] }
        },
        collaborationAdoption: {
          $sum: { $cond: ['$revenueStreams.lawyerCollaboration.enabled', 1, 0] }
        }
      }
    }
  ]);

  return aggregation[0] || {
    avgHourlyRate: 0,
    avgMonthlyRevenue: 0,
    avgSessions: 0,
    avgProfitMargin: 0,
    totalMediators: 0,
    odrAdoption: 0,
    collaborationAdoption: 0
  };
};

const MediatorEarnings = mongoose.model('MediatorEarnings', mediatorEarningsSchema);
module.exports = MediatorEarnings;