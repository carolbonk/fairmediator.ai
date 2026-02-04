/**
 * Query Expansion Service
 * Expands search queries with synonyms and related legal terms
 *
 * Purpose: Improve search recall by understanding legal terminology variations
 * Example: "divorce" → ["divorce", "marital dissolution", "family law", "custody"]
 *
 * Phase 2 Enhancement: Making Limitations Less Limiting
 */

const logger = require('../../config/logger');

class QueryExpansionService {
  constructor() {
    // Legal term synonyms and related concepts
    this.legalTerms = {
      // Family Law
      'divorce': ['divorce', 'marital dissolution', 'family law', 'custody', 'separation', 'domestic relations'],
      'custody': ['custody', 'child custody', 'parenting time', 'visitation', 'parental rights'],
      'alimony': ['alimony', 'spousal support', 'maintenance', 'spousal maintenance'],
      'child support': ['child support', 'support obligations', 'maintenance'],

      // Employment Law
      'employment': ['employment', 'workplace', 'labor', 'job', 'employee', 'employer'],
      'wrongful termination': ['wrongful termination', 'unfair dismissal', 'wrongful discharge', 'employment termination'],
      'discrimination': ['discrimination', 'harassment', 'hostile work environment', 'civil rights', 'equal employment'],
      'wage dispute': ['wage dispute', 'unpaid wages', 'overtime', 'compensation', 'salary dispute'],

      // Business & Commercial
      'business': ['business', 'commercial', 'corporate', 'company', 'enterprise'],
      'contract': ['contract', 'agreement', 'covenant', 'terms', 'deal'],
      'partnership': ['partnership', 'joint venture', 'business relationship', 'co-owners'],
      'breach': ['breach', 'violation', 'default', 'non-compliance'],

      // Real Estate
      'real estate': ['real estate', 'property', 'land', 'realty', 'housing'],
      'landlord': ['landlord', 'lessor', 'property owner', 'landlord-tenant'],
      'tenant': ['tenant', 'renter', 'lessee', 'occupant'],
      'lease': ['lease', 'rental agreement', 'tenancy agreement'],

      // Intellectual Property
      'ip': ['intellectual property', 'patent', 'trademark', 'copyright', 'trade secret'],
      'patent': ['patent', 'invention', 'patent infringement'],
      'trademark': ['trademark', 'brand', 'service mark', 'trade name'],
      'copyright': ['copyright', 'authorship', 'creative work', 'infringement'],

      // Construction
      'construction': ['construction', 'building', 'contractor', 'subcontractor', 'construction defect'],
      'defect': ['defect', 'deficiency', 'faulty work', 'construction issue'],

      // Insurance
      'insurance': ['insurance', 'claim', 'coverage', 'policy', 'insurer', 'carrier'],
      'claim': ['claim', 'insurance claim', 'damages claim', 'loss'],

      // Healthcare
      'medical': ['medical', 'healthcare', 'health', 'medical malpractice', 'patient'],
      'malpractice': ['malpractice', 'medical negligence', 'professional liability'],

      // General Legal Terms
      'lawsuit': ['lawsuit', 'litigation', 'legal action', 'case', 'suit'],
      'settlement': ['settlement', 'resolution', 'agreement', 'compromise'],
      'arbitration': ['arbitration', 'dispute resolution', 'alternative dispute resolution', 'ADR'],
      'mediation': ['mediation', 'dispute resolution', 'ADR', 'settlement conference'],
      'dispute': ['dispute', 'conflict', 'disagreement', 'controversy', 'matter']
    };

    // Practice area mappings
    this.practiceAreas = {
      'family': ['family law', 'divorce', 'custody', 'child support', 'domestic relations', 'matrimonial'],
      'employment': ['employment law', 'labor law', 'workplace disputes', 'wrongful termination', 'discrimination'],
      'business': ['business law', 'commercial law', 'corporate law', 'contract disputes'],
      'real estate': ['real estate law', 'property law', 'landlord-tenant', 'housing'],
      'intellectual property': ['IP law', 'patent law', 'trademark law', 'copyright law'],
      'construction': ['construction law', 'construction defects', 'contractor disputes'],
      'insurance': ['insurance law', 'claims disputes', 'coverage disputes'],
      'personal injury': ['personal injury', 'tort law', 'accident', 'negligence'],
      'healthcare': ['healthcare law', 'medical malpractice', 'patient disputes']
    };

    // Common abbreviations
    this.abbreviations = {
      'ip': 'intellectual property',
      'adr': 'alternative dispute resolution',
      'llc': 'limited liability company',
      'corp': 'corporation',
      'inc': 'incorporated',
      'aka': 'also known as',
      'dba': 'doing business as',
      'ceo': 'chief executive officer',
      'cfo': 'chief financial officer',
      'hr': 'human resources'
    };
  }

  /**
   * Expand a search query with synonyms and related terms
   * @param {string} query - Original search query
   * @param {object} options - Expansion options
   * @returns {object} Expanded query with original and related terms
   */
  expandQuery(query, options = {}) {
    const {
      maxExpansions = 5,      // Maximum number of related terms per keyword
      includeSynonyms = true, // Include synonyms
      includeAbbreviations = true, // Expand abbreviations
      practiceAreaExpansion = true // Expand practice areas
    } = options;

    const queryLower = query.toLowerCase();
    const expandedTerms = new Set([query]); // Always include original
    const relatedTerms = [];

    // Expand abbreviations
    if (includeAbbreviations) {
      Object.entries(this.abbreviations).forEach(([abbr, full]) => {
        if (queryLower.includes(abbr)) {
          expandedTerms.add(full);
          relatedTerms.push({ term: full, type: 'abbreviation', original: abbr });
        }
      });
    }

    // Find and expand legal terms
    if (includeSynonyms) {
      Object.entries(this.legalTerms).forEach(([key, synonyms]) => {
        if (queryLower.includes(key)) {
          const termsToAdd = synonyms.slice(0, maxExpansions);
          termsToAdd.forEach(term => {
            expandedTerms.add(term);
            if (term !== query) {
              relatedTerms.push({ term, type: 'synonym', original: key });
            }
          });
        }
      });
    }

    // Expand practice areas
    if (practiceAreaExpansion) {
      Object.entries(this.practiceAreas).forEach(([area, terms]) => {
        if (queryLower.includes(area)) {
          const termsToAdd = terms.slice(0, maxExpansions);
          termsToAdd.forEach(term => {
            expandedTerms.add(term);
            if (term !== query) {
              relatedTerms.push({ term, type: 'practice_area', original: area });
            }
          });
        }
      });
    }

    return {
      original: query,
      expanded: Array.from(expandedTerms),
      relatedTerms,
      expansionCount: expandedTerms.size - 1 // Exclude original
    };
  }

  /**
   * Expand multiple queries (for multi-keyword searches)
   * @param {array} queries - Array of search terms
   * @returns {object} Combined expansion results
   */
  expandMultipleQueries(queries) {
    const allExpanded = new Set();
    const allRelated = [];

    queries.forEach(query => {
      const expansion = this.expandQuery(query);
      expansion.expanded.forEach(term => allExpanded.add(term));
      allRelated.push(...expansion.relatedTerms);
    });

    return {
      original: queries,
      expanded: Array.from(allExpanded),
      relatedTerms: allRelated,
      totalExpansions: allExpanded.size - queries.length
    };
  }

  /**
   * Create search query string from expanded terms
   * @param {object} expansion - Result from expandQuery()
   * @param {string} operator - Boolean operator ('OR', 'AND')
   * @returns {string} MongoDB text search query
   */
  toSearchQuery(expansion, operator = 'OR') {
    if (operator === 'OR') {
      return expansion.expanded.join(' OR ');
    } else {
      return expansion.expanded.join(' ');
    }
  }

  /**
   * Get practice area suggestions based on query
   * @param {string} query - Search query
   * @returns {array} Suggested practice areas
   */
  suggestPracticeAreas(query) {
    const queryLower = query.toLowerCase();
    const suggestions = [];

    Object.entries(this.practiceAreas).forEach(([area, terms]) => {
      const matches = terms.filter(term => queryLower.includes(term.toLowerCase()));
      if (matches.length > 0) {
        suggestions.push({
          area,
          matchedTerms: matches,
          confidence: matches.length / terms.length
        });
      }
    });

    // Sort by confidence
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Add custom legal terms (for domain-specific expansion)
   * @param {string} key - Base term
   * @param {array} synonyms - Related terms
   */
  addCustomTerms(key, synonyms) {
    this.legalTerms[key.toLowerCase()] = synonyms;
    logger.info('Added custom legal terms', { key, count: synonyms.length });
  }

  /**
   * Get all available legal terms
   * @returns {object} All legal term mappings
   */
  getAllTerms() {
    return {
      legalTerms: this.legalTerms,
      practiceAreas: this.practiceAreas,
      abbreviations: this.abbreviations
    };
  }
}

module.exports = new QueryExpansionService();
