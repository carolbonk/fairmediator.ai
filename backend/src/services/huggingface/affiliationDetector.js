/**
 * Affiliation Detector (DRY - Refactored)
 */

const hfClient = require('./hfClient');
const { config } = require('./utils');

class AffiliationDetector {
  async detectConflicts(mediatorInfo, caseParties) {
    const prompt = config.prompts.conflicts(mediatorInfo, caseParties);
    
    try {
      return await hfClient.extractStructured(prompt);
    } catch {
      return this._fallbackDetection(mediatorInfo, caseParties);
    }
  }

  _fallbackDetection(mediatorInfo, caseParties) {
    const conflicts = [];
    const affiliations = mediatorInfo.affiliations || [];
    
    caseParties.forEach(party => {
      affiliations.forEach(affiliation => {
        if (party.toLowerCase().includes(affiliation.toLowerCase()) ||
            affiliation.toLowerCase().includes(party.toLowerCase())) {
          conflicts.push({
            type: 'affiliation_match',
            description: `${affiliation} may relate to ${party}`,
            severity: 'medium'
          });
        }
      });
    });

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
      overallRisk: conflicts.length > 0 ? 'medium' : 'low',
      recommendation: conflicts.length ? 'Review conflicts before proceeding' : 'No obvious conflicts',
      timestamp: new Date()
    };
  }
}

module.exports = new AffiliationDetector();
