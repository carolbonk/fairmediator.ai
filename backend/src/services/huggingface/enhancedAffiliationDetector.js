/**
 * Enhanced Affiliation Detector
 * Uses NLP to detect conflicts of interest with fuzzy matching
 * DRY: Reuses hfClient for advanced text analysis
 */

const hfClient = require('./hfClient');
const Mediator = require('../../models/Mediator');

class EnhancedAffiliationDetector {
  /**
   * Detect potential conflicts using NLP
   * DRY: Combines rule-based and AI-based detection
   */
  async detectConflicts(mediatorId, parties) {
    try {
      const mediator = await Mediator.findById(mediatorId);

      if (!mediator) {
        throw new Error('Mediator not found');
      }

      // Combine all mediator-related text
      const mediatorContext = this.buildMediatorContext(mediator);

      // Check each party
      const conflicts = [];

      for (const party of parties) {
        // Rule-based exact matching
        const exactMatch = this.checkExactMatch(mediator, party.name);

        // AI-based semantic matching
        const semanticMatch = await this.checkSemanticMatch(
          mediatorContext,
          party.name,
          party.description || ''
        );

        if (exactMatch || semanticMatch.hasConflict) {
          conflicts.push({
            party: party.name,
            mediatorName: mediator.name,
            conflictType: exactMatch ? 'exact' : 'semantic',
            riskLevel: this.calculateRiskLevel(exactMatch, semanticMatch),
            details: exactMatch || semanticMatch.details,
            confidence: semanticMatch.confidence || 1.0
          });
        }
      }

      return {
        mediatorId,
        mediatorName: mediator.name,
        conflicts,
        hasConflicts: conflicts.length > 0,
        overallRisk: this.calculateOverallRisk(conflicts)
      };
    } catch (error) {
      console.error('Conflict detection error:', error);
      throw error;
    }
  }

  /**
   * Build mediator context for analysis
   * DRY: Aggregates all relevant mediator information
   */
  buildMediatorContext(mediator) {
    const parts = [
      'Mediator: ' + mediator.name,
      'Current Firm: ' + (mediator.currentFirm || 'None'),
      'Past Firms: ' + (mediator.pastFirms?.join(', ') || 'None'),
      'Organizations: ' + (mediator.organizations?.join(', ') || 'None'),
      'Recent Cases: ' + (mediator.recentCases?.join(', ') || 'None')
    ];

    if (mediator.knownAffiliations && mediator.knownAffiliations.length > 0) {
      const affiliations = mediator.knownAffiliations.map(a => a.entity).join(', ');
      parts.push('Known Affiliations: ' + affiliations);
    }

    return parts.join('\n');
  }

  /**
   * Check for exact string matches
   * DRY: Fast rule-based checking
   */
  checkExactMatch(mediator, partyName) {
    const partyLower = partyName.toLowerCase();

    // Check current firm
    if (mediator.currentFirm && mediator.currentFirm.toLowerCase().includes(partyLower)) {
      return 'Current affiliation with ' + mediator.currentFirm;
    }

    // Check past firms
    if (mediator.pastFirms) {
      for (const firm of mediator.pastFirms) {
        if (firm.toLowerCase().includes(partyLower) || partyLower.includes(firm.toLowerCase())) {
          return 'Past affiliation with ' + firm;
        }
      }
    }

    // Check organizations
    if (mediator.organizations) {
      for (const org of mediator.organizations) {
        if (org.toLowerCase().includes(partyLower) || partyLower.includes(org.toLowerCase())) {
          return 'Organizational affiliation with ' + org;
        }
      }
    }

    // Check known affiliations
    if (mediator.knownAffiliations) {
      for (const affiliation of mediator.knownAffiliations) {
        const entityLower = affiliation.entity.toLowerCase();
        if (entityLower.includes(partyLower) || partyLower.includes(entityLower)) {
          return affiliation.details || 'Known affiliation with ' + affiliation.entity;
        }
      }
    }

    return null;
  }

  /**
   * Check for semantic conflicts using AI
   * DRY: Uses NLP for fuzzy matching
   */
  async checkSemanticMatch(mediatorContext, partyName, partyDescription) {
    try {
      const prompt = 'Analyze potential conflicts of interest:\n\n' + mediatorContext + '\n\nParty: ' + partyName + (partyDescription ? '\nDescription: ' + partyDescription : '') + '\n\nRespond with JSON: {"hasConflict": boolean, "confidence": 0-1, "details": "explanation"}';

      const result = await hfClient.extractStructured(prompt);

      return {
        hasConflict: result.hasConflict || false,
        confidence: result.confidence || 0,
        details: result.details || 'No semantic conflict detected'
      };
    } catch (error) {
      console.error('Semantic match error:', error);
      return {
        hasConflict: false,
        confidence: 0,
        details: 'Analysis failed'
      };
    }
  }

  /**
   * Calculate risk level
   * DRY: Consistent risk assessment
   */
  calculateRiskLevel(exactMatch, semanticMatch) {
    if (exactMatch) {
      return 'HIGH';
    }

    if (semanticMatch.confidence > 0.8) {
      return 'HIGH';
    }

    if (semanticMatch.confidence > 0.5) {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  /**
   * Calculate overall risk
   * DRY: Aggregates individual conflict risks
   */
  calculateOverallRisk(conflicts) {
    if (conflicts.length === 0) {
      return 'NONE';
    }

    const highRisk = conflicts.some(c => c.riskLevel === 'HIGH');
    const mediumRisk = conflicts.some(c => c.riskLevel === 'MEDIUM');

    if (highRisk) {
      return 'HIGH';
    }

    if (mediumRisk) {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  /**
   * Batch conflict detection
   * DRY: Process multiple mediators efficiently
   */
  async detectBatchConflicts(mediatorIds, parties) {
    const results = await Promise.all(
      mediatorIds.map(id => this.detectConflicts(id, parties))
    );

    return {
      results,
      summary: {
        total: results.length,
        withConflicts: results.filter(r => r.hasConflicts).length,
        highRisk: results.filter(r => r.overallRisk === 'HIGH').length,
        safe: results.filter(r => r.overallRisk === 'NONE').length
      }
    };
  }
}

module.exports = new EnhancedAffiliationDetector();
