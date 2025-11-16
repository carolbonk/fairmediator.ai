const cheerio = require('cheerio');
const Mediator = require('../../models/Mediator');

/**
 * Affiliation & Bias Detection Engine
 * Uses NLP-like techniques (regex, entity extraction) to detect conflicts and affiliations
 */
class AffiliationDetector {
  constructor() {
    // Common law firm patterns
    this.lawFirmPatterns = [
      /(\w+(?:\s+&?\s+\w+)*)\s+(?:LLP|LLC|PC|P\.C\.|PLLC|Esq\.|Law\s+Firm|Attorneys?|Legal)/gi,
      /(?:Law\s+Offices?\s+of)\s+(\w+(?:\s+\w+)*)/gi
    ];
    
    // Political keywords for ideology detection
    this.liberalKeywords = [
      'progressive', 'democrat', 'aclu', 'planned parenthood', 'sierra club',
      'environmental', 'civil rights', 'labor union', 'equality'
    ];
    
    this.conservativeKeywords = [
      'republican', 'federalist society', 'heritage foundation', 'nra',
      'chamber of commerce', 'religious liberty', 'traditional values'
    ];
  }

  /**
   * Extract law firms and organizations from text
   */
  extractEntities(text) {
    const entities = {
      lawFirms: new Set(),
      organizations: new Set(),
      companies: new Set()
    };

    // Extract law firms
    this.lawFirmPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        entities.lawFirms.add(match[1] || match[0]);
      }
    });

    // Extract companies (basic pattern)
    const companyPattern = /(\w+(?:\s+\w+)*)\s+(?:Inc\.|Corp\.|Corporation|Company|Co\.|Industries)/gi;
    const companies = text.matchAll(companyPattern);
    for (const company of companies) {
      entities.companies.add(company[1] || company[0]);
    }

    return {
      lawFirms: Array.from(entities.lawFirms),
      organizations: Array.from(entities.organizations),
      companies: Array.from(entities.companies)
    };
  }

  /**
   * Detect political ideology from text
   */
  detectIdeology(text) {
    const textLower = text.toLowerCase();
    let score = 0; // -10 = liberal, 0 = neutral, +10 = conservative

    // Count liberal keywords
    this.liberalKeywords.forEach(keyword => {
      const matches = (textLower.match(new RegExp(keyword, 'g')) || []).length;
      score -= matches * 2;
    });

    // Count conservative keywords
    this.conservativeKeywords.forEach(keyword => {
      const matches = (textLower.match(new RegExp(keyword, 'g')) || []).length;
      score += matches * 2;
    });

    // Clamp between -10 and 10
    score = Math.max(-10, Math.min(10, score));

    return {
      score,
      sentiment: score < -2 ? 'liberal' : score > 2 ? 'conservative' : 'neutral',
      confidence: Math.abs(score) > 5 ? 'high' : Math.abs(score) > 2 ? 'medium' : 'low'
    };
  }

  /**
   * Check for conflicts between mediator and parties
   */
  async checkConflicts(mediatorId, parties) {
    const mediator = await Mediator.findById(mediatorId);
    if (!mediator) throw new Error('Mediator not found');

    const conflicts = await mediator.detectConflicts(parties);

    return {
      mediatorId,
      mediatorName: mediator.name,
      parties,
      conflicts,
      riskLevel: this.assessOverallRisk(conflicts),
      timestamp: new Date()
    };
  }

  /**
   * Assess overall conflict risk
   */
  assessOverallRisk(conflicts) {
    if (conflicts.length === 0) return 'none';
    
    const hasHigh = conflicts.some(c => c.riskLevel === 'high');
    const hasMedium = conflicts.some(c => c.riskLevel === 'medium');
    
    if (hasHigh) return 'high';
    if (hasMedium && conflicts.length > 2) return 'high';
    if (hasMedium) return 'medium';
    return 'low';
  }

  /**
   * Build affiliation network graph
   */
  async buildAffiliationGraph(mediatorId) {
    const mediator = await Mediator.findById(mediatorId)
      .populate('affiliations')
      .exec();

    if (!mediator) throw new Error('Mediator not found');

    // Build adjacency list representation
    const graph = {
      nodes: [
        { id: mediator._id, label: mediator.name, type: 'mediator' }
      ],
      edges: []
    };

    // Add affiliation nodes and edges
    mediator.affiliations.forEach((affiliation, idx) => {
      const nodeId = `aff_${idx}`;
      
      graph.nodes.push({
        id: nodeId,
        label: affiliation.name,
        type: affiliation.type
      });

      graph.edges.push({
        from: mediator._id,
        to: nodeId,
        relationship: affiliation.role,
        isCurrent: affiliation.isCurrent,
        risk: affiliation.isCurrent ? 'high' : 'medium'
      });
    });

    // Add case nodes
    mediator.cases.forEach((case_, idx) => {
      const caseId = `case_${idx}`;
      
      graph.nodes.push({
        id: caseId,
        label: case_.caseName,
        type: 'case'
      });

      graph.edges.push({
        from: mediator._id,
        to: caseId,
        relationship: case_.role
      });

      // Add party nodes
      case_.parties.forEach((party, pidx) => {
        const partyId = `party_${idx}_${pidx}`;
        
        graph.nodes.push({
          id: partyId,
          label: party,
          type: 'party'
        });

        graph.edges.push({
          from: caseId,
          to: partyId,
          relationship: 'involved'
        });
      });
    });

    return graph;
  }

  /**
   * Analyze mediator profile and enrich with NLP insights
   */
  async analyzeMediatorProfile(mediatorId) {
    const mediator = await Mediator.findById(mediatorId);
    if (!mediator) throw new Error('Mediator not found');

    // Combine all text sources
    const allText = [
      mediator.name,
      mediator.lawFirm,
      ...(mediator.specializations || []),
      ...(mediator.previousEmployers || []),
      ...(mediator.tags || [])
    ].filter(Boolean).join(' ');

    // Extract entities
    const entities = this.extractEntities(allText);

    // Detect ideology if we have public statements
    let ideology = { score: 0, sentiment: 'neutral', confidence: 'low' };
    if (mediator.biasIndicators?.publicStatements?.length > 0) {
      const statementsText = mediator.biasIndicators.publicStatements
        .map(s => s.statement)
        .join(' ');
      ideology = this.detectIdeology(statementsText);
    }

    // Update mediator with enriched data
    mediator.ideologyScore = ideology.score;
    
    // Add detected affiliations
    entities.lawFirms.forEach(firm => {
      if (!mediator.affiliations.some(a => a.name === firm)) {
        mediator.affiliations.push({
          type: 'law_firm',
          name: firm,
          role: 'detected_affiliation',
          isCurrent: false
        });
      }
    });

    await mediator.save();

    return {
      mediatorId,
      mediatorName: mediator.name,
      ideology,
      detectedEntities: entities,
      affiliationsCount: mediator.affiliations.length,
      casesCount: mediator.cases.length
    };
  }
}

module.exports = new AffiliationDetector();
