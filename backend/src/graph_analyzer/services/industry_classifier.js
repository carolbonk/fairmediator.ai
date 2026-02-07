/**
 * Industry Classifier - Categorize entities by industry/sector
 *
 * Classifies organizations and contributions by industry sector
 * for conflict detection, trend analysis, and data aggregation.
 *
 * Uses employer names, committee designations, and FEC industry codes.
 *
 * @module graph_analyzer/services/industry_classifier
 */

const logger = require('../../config/logger');

/**
 * Industry categories matching OpenSecrets classifications
 * Covers major political contribution sectors
 */
const INDUSTRY_CATEGORIES = {
  // Defense & Aerospace
  DEFENSE: {
    name: 'Defense & Aerospace',
    keywords: ['boeing', 'lockheed', 'northrop', 'raytheon', 'general dynamics', 'bae systems', 'l3harris', 'textron', 'huntington ingalls', 'leidos', 'saic', 'raytheon technologies'],
    sectors: ['Defense Electronics', 'Defense Aerospace', 'Misc Defense']
  },

  // Healthcare
  HEALTH: {
    name: 'Health',
    keywords: ['hospital', 'pharmaceutical', 'pfizer', 'johnson & johnson', 'merck', 'abbvie', 'eli lilly', 'bristol-myers', 'amgen', 'gilead', 'biogen', 'moderna', 'health insurance', 'unitedhealth', 'anthem', 'cigna', 'humana', 'aetna', 'blue cross', 'hca healthcare', 'kaiser'],
    sectors: ['Health Professionals', 'Hospitals & Nursing Homes', 'Pharmaceutical/Health Products', 'Health Services/HMOs']
  },

  // Finance, Insurance & Real Estate
  FIRE: {
    name: 'Finance, Insurance & Real Estate',
    keywords: ['bank', 'goldman sachs', 'jpmorgan', 'morgan stanley', 'citigroup', 'wells fargo', 'bank of america', 'charles schwab', 'blackrock', 'vanguard', 'fidelity', 'insurance', 'real estate', 'mortgage'],
    sectors: ['Commercial Banks', 'Securities & Investment', 'Insurance', 'Real Estate', 'Finance/Credit Companies']
  },

  // Energy & Natural Resources
  ENERGY: {
    name: 'Energy & Natural Resources',
    keywords: ['exxon', 'chevron', 'conocophillips', 'shell', 'bp', 'oil', 'gas', 'energy', 'coal', 'duke energy', 'southern company', 'nextera', 'dominion', 'american electric'],
    sectors: ['Oil & Gas', 'Mining', 'Electric Utilities', 'Misc Energy']
  },

  // Transportation
  TRANSPORT: {
    name: 'Transportation',
    keywords: ['airline', 'united airlines', 'delta', 'american airlines', 'southwest', 'fedex', 'ups', 'union pacific', 'norfolk southern', 'csx', 'kansas city southern', 'uber', 'lyft'],
    sectors: ['Air Transport', 'Automotive', 'Railroads', 'Sea Transport', 'Trucking']
  },

  // Communications & Electronics
  COMM_TECH: {
    name: 'Communications & Electronics',
    keywords: ['at&t', 'verizon', 't-mobile', 'comcast', 'charter communications', 'apple', 'microsoft', 'google', 'alphabet', 'meta', 'facebook', 'amazon', 'intel', 'qualcomm', 'cisco', 'oracle', 'ibm', 'telecommunications'],
    sectors: ['Telecom Services', 'Telephone Utilities', 'Electronics Mfg & Equip', 'Computer Software']
  },

  // Lawyers & Lobbyists
  LAWYERS_LOBBY: {
    name: 'Lawyers & Lobbyists',
    keywords: ['law firm', 'attorney', 'legal', 'lobbying', 'government relations', 'public affairs'],
    sectors: ['Lawyers/Law Firms', 'Lobbyists']
  },

  // Labor Unions
  LABOR: {
    name: 'Labor',
    keywords: ['union', 'afl-cio', 'seiu', 'teamsters', 'ufcw', 'afscme', 'nea', 'uaw', 'unite here', 'workers'],
    sectors: ['Public Sector Unions', 'Building Trade Unions', 'Industrial Unions', 'Transportation Unions']
  },

  // Ideology/Single-Issue
  IDEOLOGY: {
    name: 'Ideology/Single-Issue',
    keywords: ['pac', 'political action', 'club for growth', 'emily\'s list', 'nra', 'planned parenthood', 'sierra club', 'aclu', 'naacp'],
    sectors: ['Republican/Conservative', 'Democratic/Liberal', 'Pro-Israel', 'Gun Rights', 'Gun Control', 'Environmental', 'Human Rights', 'Women\'s Issues']
  },

  // Agriculture
  AGRIBUSINESS: {
    name: 'Agribusiness',
    keywords: ['farm', 'agriculture', 'crop', 'livestock', 'dairy', 'monsanto', 'bayer', 'cargill', 'archer daniels'],
    sectors: ['Crop Production & Basic Processing', 'Tobacco', 'Livestock', 'Agricultural Services/Products', 'Food Processing & Sales']
  },

  // Construction
  CONSTRUCTION: {
    name: 'Construction',
    keywords: ['construction', 'builder', 'contractor', 'bechtel', 'fluor', 'kbr', 'aecom', 'jacobs engineering'],
    sectors: ['General Contractors', 'Home Builders', 'Special Trade Contractors', 'Construction Services']
  },

  // Education
  EDUCATION: {
    name: 'Education',
    keywords: ['university', 'college', 'school', 'education', 'harvard', 'stanford', 'mit', 'yale', 'princeton'],
    sectors: ['Education']
  },

  // Misc Business
  BUSINESS: {
    name: 'Misc Business',
    keywords: ['retail', 'walmart', 'target', 'costco', 'amazon', 'restaurant', 'hospitality', 'hotel'],
    sectors: ['Business Services', 'Retail Sales', 'Lodging/Tourism', 'Food & Beverage']
  }
};

/**
 * Classify an entity by industry based on name and employer
 *
 * @param {String} entityName - Entity or employer name
 * @param {String} description - Optional description or job title
 * @returns {Object} Industry classification
 */
function classifyByIndustry(entityName, description = '') {
  if (!entityName) {
    return {
      industry: 'UNKNOWN',
      category: 'Unknown',
      confidence: 0.0,
      matchType: null
    };
  }

  const searchText = `${entityName} ${description}`.toLowerCase();

  // Check each industry category
  for (const [industryCode, industryData] of Object.entries(INDUSTRY_CATEGORIES)) {
    for (const keyword of industryData.keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return {
          industry: industryCode,
          category: industryData.name,
          confidence: 0.9,
          matchType: 'keyword',
          matchedKeyword: keyword
        };
      }
    }
  }

  // No match found
  return {
    industry: 'OTHER',
    category: 'Other',
    confidence: 0.1,
    matchType: null
  };
}

/**
 * Classify FEC contribution by industry
 * Uses employer information from FEC data
 *
 * @param {Object} contribution - FEC contribution record
 * @returns {Object} Industry classification
 */
function classifyFECContribution(contribution) {
  const employer = contribution.contributor_employer || contribution.contributor_organization_name || '';
  const occupation = contribution.contributor_occupation || '';

  return classifyByIndustry(employer, occupation);
}

/**
 * Classify lobbying client by industry
 *
 * @param {String} clientName - Client organization name
 * @param {Array} issueAreas - LDA general issue codes
 * @returns {Object} Industry classification
 */
function classifyLobbyingClient(clientName, issueAreas = []) {
  const classification = classifyByIndustry(clientName);

  // Enhance with issue area mapping if low confidence
  if (classification.confidence < 0.5 && issueAreas.length > 0) {
    const issueToIndustry = {
      'DEF': 'DEFENSE',
      'HCR': 'HEALTH',
      'ENV': 'ENERGY',
      'TRA': 'TRANSPORT',
      'COM': 'COMM_TECH',
      'FIN': 'FIRE',
      'AGR': 'AGRIBUSINESS',
      'LBR': 'LABOR',
      'EDU': 'EDUCATION'
    };

    const primaryIssue = issueAreas[0];
    if (issueToIndustry[primaryIssue]) {
      const industryCode = issueToIndustry[primaryIssue];
      const industryData = INDUSTRY_CATEGORIES[industryCode];

      return {
        industry: industryCode,
        category: industryData.name,
        confidence: 0.7,
        matchType: 'issue_area',
        issueArea: primaryIssue
      };
    }
  }

  return classification;
}

/**
 * Get industry distribution from a set of contributions
 * Used for aggregation and trend analysis
 *
 * @param {Array} contributions - Array of contribution records
 * @returns {Object} Industry distribution statistics
 */
function getIndustryDistribution(contributions) {
  const distribution = {};
  let totalAmount = 0;

  for (const contribution of contributions) {
    const classification = classifyFECContribution(contribution);
    const amount = parseFloat(contribution.contribution_receipt_amount || contribution.contribution_amount || 0);

    if (!distribution[classification.industry]) {
      distribution[classification.industry] = {
        category: classification.category,
        count: 0,
        totalAmount: 0,
        avgAmount: 0
      };
    }

    distribution[classification.industry].count++;
    distribution[classification.industry].totalAmount += amount;
    totalAmount += amount;
  }

  // Calculate percentages and averages
  for (const industry in distribution) {
    const data = distribution[industry];
    data.avgAmount = data.count > 0 ? data.totalAmount / data.count : 0;
    data.percentOfTotal = totalAmount > 0 ? (data.totalAmount / totalAmount) * 100 : 0;
  }

  return {
    distribution,
    totalContributions: contributions.length,
    totalAmount,
    topIndustries: Object.entries(distribution)
      .sort((a, b) => b[1].totalAmount - a[1].totalAmount)
      .slice(0, 5)
      .map(([industry, data]) => ({
        industry,
        category: data.category,
        amount: data.totalAmount,
        percentage: data.percentOfTotal
      }))
  };
}

/**
 * Detect potential conflicts based on industry patterns
 * Flags when mediator has financial ties to industries involved in dispute
 *
 * @param {Object} mediatorProfile - Mediator's contribution/lobbying profile
 * @param {Array} partyNames - Names of parties in the dispute
 * @returns {Object} Conflict analysis
 */
function detectIndustryConflicts(mediatorProfile, partyNames) {
  const conflicts = [];

  // Classify each party
  const partyIndustries = partyNames.map(name => classifyByIndustry(name));

  // Check mediator's industry affiliations
  for (const partyIndustry of partyIndustries) {
    if (partyIndustry.industry === 'UNKNOWN' || partyIndustry.industry === 'OTHER') {
      continue;
    }

    // Check if mediator has contributions/lobbying in same industry
    const mediatorIndustryData = mediatorProfile.distribution?.[partyIndustry.industry];

    if (mediatorIndustryData && mediatorIndustryData.totalAmount > 1000) {
      conflicts.push({
        party: partyNames[partyIndustries.indexOf(partyIndustry)],
        industry: partyIndustry.category,
        mediatorTies: {
          contributionCount: mediatorIndustryData.count,
          totalAmount: mediatorIndustryData.totalAmount,
          percentOfTotal: mediatorIndustryData.percentOfTotal
        },
        riskLevel: mediatorIndustryData.percentOfTotal > 25 ? 'HIGH' : 'MEDIUM'
      });
    }
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflictCount: conflicts.length,
    conflicts,
    recommendation: conflicts.length === 0
      ? 'No industry-based conflicts detected'
      : `${conflicts.length} potential industry conflict(s) detected`
  };
}

module.exports = {
  INDUSTRY_CATEGORIES,
  classifyByIndustry,
  classifyFECContribution,
  classifyLobbyingClient,
  getIndustryDistribution,
  detectIndustryConflicts
};
