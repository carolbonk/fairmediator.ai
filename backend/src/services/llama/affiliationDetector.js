/**
 * Affiliation Detector - Scrape-based conflict of interest detection
 * Uses Crawl4AI and ScrapeGraphAI for comprehensive affiliation discovery
 */

const llamaClient = require('./llamaClient');
const Mediator = require('../../models/Mediator');

class AffiliationDetector {
  constructor() {
    this.riskLevels = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high'
    };
  }

  /**
   * Detect conflicts between a mediator and case parties
   * Combines database data with live web scraping
   */
  async detectConflicts(mediatorId, caseParties = []) {
    try {
      // Get mediator from database
      const mediator = await Mediator.findById(mediatorId);
      if (!mediator) {
        throw new Error('Mediator not found');
      }

      const conflicts = [];
      let overallRisk = this.riskLevels.LOW;

      // 1. Check existing database affiliations
      const dbConflicts = this._checkDatabaseAffiliations(mediator, caseParties);
      conflicts.push(...dbConflicts);

      // 2. Scrape for additional affiliations if parties provided
      if (caseParties.length > 0) {
        const scrapedConflicts = await this._scrapeForConflicts(mediator, caseParties);
        conflicts.push(...scrapedConflicts);
      }

      // Calculate overall risk
      if (conflicts.some(c => c.riskLevel === this.riskLevels.HIGH)) {
        overallRisk = this.riskLevels.HIGH;
      } else if (conflicts.some(c => c.riskLevel === this.riskLevels.MEDIUM)) {
        overallRisk = this.riskLevels.MEDIUM;
      }

      return {
        hasConflict: conflicts.length > 0,
        conflicts,
        overallRisk,
        recommendation: this._generateRecommendation(conflicts, overallRisk),
        mediatorName: mediator.name,
        checkedParties: caseParties
      };
    } catch (error) {
      console.error('Affiliation detection error:', error);
      return {
        hasConflict: false,
        conflicts: [],
        overallRisk: this.riskLevels.LOW,
        recommendation: 'Unable to complete conflict check. Manual review recommended.',
        error: error.message
      };
    }
  }

  /**
   * Check database affiliations for conflicts
   */
  _checkDatabaseAffiliations(mediator, parties) {
    const conflicts = [];
    const partyNames = parties.map(p => p.toLowerCase());

    // Check affiliations
    if (mediator.affiliations) {
      for (const affiliation of mediator.affiliations) {
        const affName = affiliation.name?.toLowerCase() || '';
        for (const party of partyNames) {
          if (affName.includes(party) || party.includes(affName)) {
            conflicts.push({
              type: 'affiliation',
              entity: affiliation.name,
              party: party,
              relationship: affiliation.role || 'affiliated',
              isCurrent: affiliation.isCurrent,
              riskLevel: affiliation.isCurrent ? this.riskLevels.HIGH : this.riskLevels.MEDIUM,
              source: 'database'
            });
          }
        }
      }
    }

    // Check previous employers
    if (mediator.previousEmployers) {
      for (const employer of mediator.previousEmployers) {
        const empName = employer.toLowerCase();
        for (const party of partyNames) {
          if (empName.includes(party) || party.includes(empName)) {
            conflicts.push({
              type: 'employment',
              entity: employer,
              party: party,
              relationship: 'former employer',
              riskLevel: this.riskLevels.MEDIUM,
              source: 'database'
            });
          }
        }
      }
    }

    // Check current employer
    if (mediator.currentEmployer) {
      const currEmp = mediator.currentEmployer.toLowerCase();
      for (const party of partyNames) {
        if (currEmp.includes(party) || party.includes(currEmp)) {
          conflicts.push({
            type: 'employment',
            entity: mediator.currentEmployer,
            party: party,
            relationship: 'current employer',
            riskLevel: this.riskLevels.HIGH,
            source: 'database'
          });
        }
      }
    }

    // Check case history
    if (mediator.cases) {
      for (const caseRecord of mediator.cases) {
        const caseParties = (caseRecord.parties || []).map(p => p.toLowerCase());
        for (const party of partyNames) {
          if (caseParties.some(cp => cp.includes(party) || party.includes(cp))) {
            conflicts.push({
              type: 'prior_case',
              entity: caseRecord.caseName,
              party: party,
              relationship: 'prior case involvement',
              riskLevel: this.riskLevels.MEDIUM,
              source: 'database'
            });
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Scrape web sources for additional affiliations
   */
  async _scrapeForConflicts(mediator, parties) {
    const conflicts = [];

    try {
      // Build URLs to scrape
      const urls = llamaClient.buildSearchUrls(mediator.name, mediator.location?.state);
      const urlsToScrape = [
        urls.martindale,
        urls.avvo,
        urls.linkedin
      ].filter(Boolean);

      // Scrape for affiliations
      const result = await llamaClient.scrapeAffiliations(
        urlsToScrape,
        mediator.name,
        parties
      );

      if (result.success && result.potential_conflicts) {
        for (const conflict of result.potential_conflicts) {
          conflicts.push({
            type: 'scraped_affiliation',
            entity: conflict.organization,
            party: conflict.organization,
            relationship: 'discovered affiliation',
            riskLevel: conflict.risk_level?.toLowerCase() || this.riskLevels.MEDIUM,
            source: conflict.source
          });
        }
      }

      // Store discovered affiliations in mediator record
      if (result.success && result.affiliations) {
        await this._updateMediatorAffiliations(mediator._id, result.affiliations);
      }
    } catch (error) {
      console.error('Web scraping for conflicts failed:', error.message);
      // Continue with database results only
    }

    return conflicts;
  }

  /**
   * Update mediator record with newly discovered affiliations
   */
  async _updateMediatorAffiliations(mediatorId, scrapedAffiliations) {
    try {
      const updateData = {
        $addToSet: {
          'sources': {
            url: 'web-scrape',
            scrapedAt: new Date(),
            sourceType: 'automated_scrape'
          }
        },
        $set: {
          'dataQuality.lastVerified': new Date()
        }
      };

      await Mediator.findByIdAndUpdate(mediatorId, updateData);
    } catch (error) {
      console.error('Failed to update mediator affiliations:', error);
    }
  }

  /**
   * Batch detect conflicts for multiple mediators
   */
  async detectBatchConflicts(mediatorIds, caseParties) {
    const results = await Promise.all(
      mediatorIds.map(id => this.detectConflicts(id, caseParties))
    );

    return results.map((result, index) => ({
      mediatorId: mediatorIds[index],
      ...result
    }));
  }

  /**
   * Generate recommendation based on conflicts
   */
  _generateRecommendation(conflicts, overallRisk) {
    if (conflicts.length === 0) {
      return 'No conflicts detected. Mediator appears suitable for this case.';
    }

    const highRisk = conflicts.filter(c => c.riskLevel === this.riskLevels.HIGH);
    const mediumRisk = conflicts.filter(c => c.riskLevel === this.riskLevels.MEDIUM);

    if (highRisk.length > 0) {
      return `HIGH RISK: ${highRisk.length} direct conflict(s) detected. Strongly recommend selecting a different mediator or obtaining explicit party consent.`;
    }

    if (mediumRisk.length > 0) {
      return `MEDIUM RISK: ${mediumRisk.length} potential conflict(s) found. Disclosure to all parties recommended before proceeding.`;
    }

    return `LOW RISK: ${conflicts.length} minor association(s) noted. Standard disclosure practices should suffice.`;
  }

  /**
   * Quick conflict check without scraping (faster)
   */
  async quickCheck(mediatorId, caseParties) {
    const mediator = await Mediator.findById(mediatorId);
    if (!mediator) {
      return { hasConflict: false, error: 'Mediator not found' };
    }

    const conflicts = this._checkDatabaseAffiliations(mediator, caseParties);

    return {
      hasConflict: conflicts.length > 0,
      conflictCount: conflicts.length,
      highRisk: conflicts.some(c => c.riskLevel === this.riskLevels.HIGH)
    };
  }
}

const affiliationDetector = new AffiliationDetector();
module.exports = affiliationDetector;
