/**
 * Bulk Conflict Checker Service
 * Checks multiple party names against mediator affiliations in bulk
 * Accepts CSV or TXT file uploads (max 1MB)
 * FREE/OPEN-SOURCE - No paid APIs
 */

const Mediator = require('../models/Mediator');
const logger = require('../config/logger');

class BulkConflictChecker {
  /**
   * Parse CSV content into party names
   * Simple CSV parser - handles basic comma-separated values
   *
   * @param {string} csvContent - Raw CSV text
   * @returns {Array<string>} Party names
   */
  parseCSV(csvContent) {
    const lines = csvContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const parties = new Set();

    lines.forEach(line => {
      // Split by comma and clean up
      const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));

      values.forEach(value => {
        if (value && value.length > 2 && value.length < 200) {
          parties.add(value);
        }
      });
    });

    return Array.from(parties);
  }

  /**
   * Parse plain text content into party names
   * Extracts names from newline or comma-separated text
   *
   * @param {string} textContent - Raw text
   * @returns {Array<string>} Party names
   */
  parseText(textContent) {
    // Try newline-separated first
    let lines = textContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // If very few lines, try comma-separated
    if (lines.length < 3) {
      return this.parseCSV(textContent);
    }

    const parties = [];
    lines.forEach(line => {
      // Remove common prefixes
      const cleaned = line
        .replace(/^\d+[\.\)]\s*/, '') // Remove numbering
        .replace(/^[-*]\s*/, '')      // Remove bullets
        .trim();

      if (cleaned && cleaned.length > 2 && cleaned.length < 200) {
        parties.push(cleaned);
      }
    });

    return parties;
  }

  /**
   * Check parties against mediator affiliations
   * Returns all matches with conflict severity
   *
   * @param {Array<string>} parties - List of party names to check
   * @returns {Array<Object>} Conflict results
   */
  async checkConflicts(parties) {
    try {
      if (!parties || parties.length === 0) {
        return {
          conflicts: [],
          totalParties: 0,
          totalConflicts: 0,
          checkedAt: new Date()
        };
      }

      // Limit to 1000 parties for performance
      const limitedParties = parties.slice(0, 1000);

      // Build regex patterns for fuzzy matching
      const patterns = limitedParties.map(party => ({
        party,
        pattern: new RegExp(this.escapeRegex(party), 'i')
      }));

      // Query all mediators with affiliations
      // INTEGRATION POINT: Adjust based on your Mediator model's affiliation structure
      const mediators = await Mediator.find({
        $or: [
          { affiliations: { $exists: true, $ne: [] } },
          { pastAffiliations: { $exists: true, $ne: [] } },
          { currentFirm: { $exists: true, $ne: null } }
        ]
      }).select('name affiliations pastAffiliations currentFirm location practiceAreas');

      // Check each party against each mediator
      const conflicts = [];

      patterns.forEach(({ party, pattern }) => {
        mediators.forEach(mediator => {
          const matches = this.findMatches(pattern, mediator);

          if (matches.length > 0) {
            conflicts.push({
              party,
              mediator: {
                id: mediator._id,
                name: mediator.name,
                location: mediator.location
              },
              matches,
              severity: this.calculateSeverity(matches),
              recommendation: this.getRecommendation(matches)
            });
          }
        });
      });

      return {
        conflicts,
        totalParties: limitedParties.length,
        totalConflicts: conflicts.length,
        checkedAt: new Date(),
        summary: this.generateSummary(conflicts)
      };
    } catch (error) {
      logger.error('Bulk conflict check error', { error: error.message });
      throw new Error('Failed to check conflicts');
    }
  }

  /**
   * Find matches between a pattern and mediator affiliations
   *
   * @param {RegExp} pattern - Search pattern
   * @param {Object} mediator - Mediator document
   * @returns {Array<Object>} Matching affiliations
   */
  findMatches(pattern, mediator) {
    const matches = [];

    // Check current firm
    if (mediator.currentFirm && pattern.test(mediator.currentFirm)) {
      matches.push({
        type: 'current_firm',
        value: mediator.currentFirm,
        severity: 'high'
      });
    }

    // Check affiliations array
    if (mediator.affiliations) {
      mediator.affiliations.forEach(affiliation => {
        const affiliationText = typeof affiliation === 'string'
          ? affiliation
          : affiliation.name || affiliation.organization;

        if (affiliationText && pattern.test(affiliationText)) {
          matches.push({
            type: 'affiliation',
            value: affiliationText,
            severity: 'high'
          });
        }
      });
    }

    // Check past affiliations (lower severity)
    if (mediator.pastAffiliations) {
      mediator.pastAffiliations.forEach(affiliation => {
        const affiliationText = typeof affiliation === 'string'
          ? affiliation
          : affiliation.name || affiliation.organization;

        if (affiliationText && pattern.test(affiliationText)) {
          matches.push({
            type: 'past_affiliation',
            value: affiliationText,
            severity: 'medium'
          });
        }
      });
    }

    return matches;
  }

  /**
   * Calculate overall conflict severity
   *
   * @param {Array<Object>} matches - Conflict matches
   * @returns {string} Severity level
   */
  calculateSeverity(matches) {
    if (matches.some(m => m.severity === 'high')) {
      return 'high';
    }
    if (matches.some(m => m.severity === 'medium')) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Get recommendation based on conflicts
   *
   * @param {Array<Object>} matches - Conflict matches
   * @returns {string} Recommendation text
   */
  getRecommendation(matches) {
    const hasCurrentFirm = matches.some(m => m.type === 'current_firm');
    const hasAffiliation = matches.some(m => m.type === 'affiliation');

    if (hasCurrentFirm || hasAffiliation) {
      return 'AVOID - Current conflict of interest detected';
    }
    return 'REVIEW - Past affiliation found, further review recommended';
  }

  /**
   * Generate summary statistics
   *
   * @param {Array<Object>} conflicts - All conflicts found
   * @returns {Object} Summary statistics
   */
  generateSummary(conflicts) {
    const summary = {
      highSeverity: 0,
      mediumSeverity: 0,
      lowSeverity: 0,
      uniqueMediators: new Set(),
      uniqueParties: new Set()
    };

    conflicts.forEach(conflict => {
      if (conflict.severity === 'high') summary.highSeverity++;
      if (conflict.severity === 'medium') summary.mediumSeverity++;
      if (conflict.severity === 'low') summary.lowSeverity++;

      summary.uniqueMediators.add(conflict.mediator.id.toString());
      summary.uniqueParties.add(conflict.party);
    });

    return {
      highSeverity: summary.highSeverity,
      mediumSeverity: summary.mediumSeverity,
      lowSeverity: summary.lowSeverity,
      uniqueMediators: summary.uniqueMediators.size,
      uniqueParties: summary.uniqueParties.size
    };
  }

  /**
   * Escape special regex characters
   *
   * @param {string} string - String to escape
   * @returns {string} Escaped string
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Validate file size and type
   *
   * @param {number} fileSize - Size in bytes
   * @param {string} mimetype - File MIME type
   * @throws {Error} If validation fails
   */
  validateFile(fileSize, mimetype) {
    const MAX_SIZE = 1024 * 1024; // 1MB

    if (fileSize > MAX_SIZE) {
      throw new Error('File too large. Maximum size is 1MB');
    }

    const allowedTypes = [
      'text/plain',
      'text/csv',
      'application/csv',
      'text/comma-separated-values'
    ];

    if (!allowedTypes.includes(mimetype)) {
      throw new Error('Invalid file type. Please upload .csv or .txt files only');
    }
  }
}

module.exports = new BulkConflictChecker();
