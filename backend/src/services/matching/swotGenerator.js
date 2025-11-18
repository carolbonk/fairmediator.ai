const Mediator = require('../../models/Mediator');

/**
 * SWOT Analysis Generator
 * Generates Strengths, Weaknesses, Opportunities, Threats for mediators
 */
class SwotGenerator {
  constructor() {
    this.rules = {
      strengths: [
        {
          condition: (m) => m.yearsExperience >= 15,
          text: 'Extensive experience with {{years}} years in mediation'
        },
        {
          condition: (m) => m.specializations?.length >= 5,
          text: 'Diverse expertise across {{count}} practice areas'
        },
        {
          condition: (m) => m.isVerified,
          text: 'Verified mediator with confirmed credentials'
        },
        {
          condition: (m) => Math.abs(m.ideologyScore || 0) <= 1,
          text: 'Neutral political stance ensures unbiased mediation'
        },
        {
          condition: (m) => m.cases?.length >= 50,
          text: 'Proven track record with {{count}} completed cases'
        },
        {
          condition: (m) => m.barAdmissions?.length >= 2,
          text: 'Multi-state bar admissions provide broad legal knowledge'
        }
      ],
      weaknesses: [
        {
          condition: (m) => m.yearsExperience < 3,
          text: 'Limited experience in mediation practice'
        },
        {
          condition: (m) => !m.isVerified,
          text: 'Unverified credentials - requires additional due diligence'
        },
        {
          condition: (m) => m.dataQuality?.completeness < 50,
          text: 'Incomplete profile information may indicate limited public presence'
        },
        {
          condition: (m) => m.specializations?.length === 0,
          text: 'No specified practice areas or specializations'
        },
        {
          condition: (m) => Math.abs(m.ideologyScore || 0) > 5,
          text: 'Strong ideological leanings may affect perceived neutrality'
        }
      ],
      opportunities: [
        {
          condition: (m) => m.location?.city && m.location?.state,
          text: 'Local mediator in {{city}}, {{state}} - convenient for in-person sessions'
        },
        {
          condition: (m) => m.affiliations?.some(a => a.isCurrent),
          text: 'Active professional affiliations provide ongoing training and resources'
        },
        {
          condition: (m) => m.yearsExperience >= 5 && m.yearsExperience < 15,
          text: 'Seasoned professional in growth phase - combines experience with fresh perspectives'
        },
        {
          condition: (m) => m.specializations?.includes('Technology') || m.specializations?.includes('Intellectual Property'),
          text: 'Specialized in emerging technology disputes - valuable in modern conflicts'
        }
      ],
      threats: [
        {
          condition: (m) => m.potentialConflicts?.length > 0,
          text: 'Potential conflicts of interest identified - requires thorough vetting'
        },
        {
          condition: (m) => m.affiliations?.some(a => a.type === 'law_firm' && a.isCurrent),
          text: 'Current law firm affiliation may raise concerns about impartiality'
        },
        {
          condition: (m) => !m.dataQuality?.lastVerified || 
                          (new Date() - new Date(m.dataQuality.lastVerified)) > 365 * 24 * 60 * 60 * 1000,
          text: 'Profile not recently verified - information may be outdated'
        },
        {
          condition: (m) => m.biasIndicators?.politicalAffiliations?.length > 0,
          text: 'Political affiliations documented - may influence perception of neutrality'
        }
      ]
    };
  }

  /**
   * Apply rule conditions and generate SWOT items
   */
  applyRules(mediator, ruleSet) {
    const items = [];

    for (const rule of ruleSet) {
      try {
        if (rule.condition(mediator)) {
          let text = rule.text;
          
          // Replace placeholders
          text = text.replace('{{years}}', mediator.yearsExperience);
          text = text.replace('{{count}}', mediator.specializations?.length || mediator.cases?.length || 0);
          text = text.replace('{{city}}', mediator.location?.city || '');
          text = text.replace('{{state}}', mediator.location?.state || '');
          
          items.push(text);
        }
      } catch (error) {
        console.error('Error applying SWOT rule:', error.message);
      }
    }

    return items;
  }

  /**
   * Generate full SWOT analysis for a mediator
   */
  async generateSwot(mediatorId, contextData = {}) {
    const mediator = await Mediator.findById(mediatorId);
    
    if (!mediator) {
      throw new Error('Mediator not found');
    }

    const swot = {
      mediatorId: mediator._id,
      mediatorName: mediator.name,
      strengths: this.applyRules(mediator, this.rules.strengths),
      weaknesses: this.applyRules(mediator, this.rules.weaknesses),
      opportunities: this.applyRules(mediator, this.rules.opportunities),
      threats: this.applyRules(mediator, this.rules.threats),
      generatedAt: new Date()
    };

    // Add context-specific items if provided
    if (contextData.parties?.length > 0) {
      const conflicts = await mediator.detectConflicts(contextData.parties);
      
      if (conflicts.length > 0) {
        swot.threats.push(`${conflicts.length} potential conflict(s) detected with case parties`);
      } else {
        swot.strengths.push('No conflicts of interest identified with case parties');
      }
    }

    // Calculate overall assessment
    swot.assessment = this.calculateAssessment(swot);

    return swot;
  }

  /**
   * Calculate overall assessment score
   */
  calculateAssessment(swot) {
    const strengthScore = swot.strengths.length * 10;
    const weaknessScore = swot.weaknesses.length * -8;
    const opportunityScore = swot.opportunities.length * 5;
    const threatScore = swot.threats.length * -12;

    const totalScore = strengthScore + weaknessScore + opportunityScore + threatScore;

    let rating, recommendation;

    if (totalScore >= 40) {
      rating = 'excellent';
      recommendation = 'Highly recommended - strong candidate with minimal concerns';
    } else if (totalScore >= 20) {
      rating = 'good';
      recommendation = 'Recommended - solid choice with some considerations';
    } else if (totalScore >= 0) {
      rating = 'fair';
      recommendation = 'Acceptable - proceed with additional due diligence';
    } else {
      rating = 'poor';
      recommendation = 'Not recommended - significant concerns identified';
    }

    return {
      score: totalScore,
      rating,
      recommendation,
      breakdown: {
        strengths: swot.strengths.length,
        weaknesses: swot.weaknesses.length,
        opportunities: swot.opportunities.length,
        threats: swot.threats.length
      }
    };
  }

  /**
   * Generate comparison SWOT for multiple mediators
   */
  async compareSwot(mediatorIds, contextData = {}) {
    const comparisons = [];

    for (const mediatorId of mediatorIds) {
      try {
        const swot = await this.generateSwot(mediatorId, contextData);
        comparisons.push(swot);
      } catch (error) {
        console.error(`Failed to generate SWOT for ${mediatorId}:`, error.message);
      }
    }

    // Sort by assessment score
    comparisons.sort((a, b) => b.assessment.score - a.assessment.score);

    return {
      comparisons,
      count: comparisons.length,
      timestamp: new Date()
    };
  }

  /**
   * Export SWOT as formatted markdown
   */
  exportAsMarkdown(swot) {
    let md = `# SWOT Analysis: ${swot.mediatorName}\n\n`;
    md += `**Generated:** ${swot.generatedAt.toLocaleString()}\n\n`;
    md += `**Overall Assessment:** ${swot.assessment.rating.toUpperCase()} (Score: ${swot.assessment.score})\n\n`;
    md += `**Recommendation:** ${swot.assessment.recommendation}\n\n`;
    md += `---\n\n`;

    md += `## 💪 Strengths\n\n`;
    if (swot.strengths.length > 0) {
      swot.strengths.forEach(s => md += `- ${s}\n`);
    } else {
      md += `- None identified\n`;
    }
    md += `\n`;

    md += `## ⚠️ Weaknesses\n\n`;
    if (swot.weaknesses.length > 0) {
      swot.weaknesses.forEach(w => md += `- ${w}\n`);
    } else {
      md += `- None identified\n`;
    }
    md += `\n`;

    md += `## 🌟 Opportunities\n\n`;
    if (swot.opportunities.length > 0) {
      swot.opportunities.forEach(o => md += `- ${o}\n`);
    } else {
      md += `- None identified\n`;
    }
    md += `\n`;

    md += `## 🚨 Threats\n\n`;
    if (swot.threats.length > 0) {
      swot.threats.forEach(t => md += `- ${t}\n`);
    } else {
      md += `- None identified\n`;
    }
    md += `\n`;

    return md;
  }

  /**
   * Export SWOT as JSON template
   */
  exportAsJson(swot) {
    return {
      template: 'swot_analysis_v1',
      mediator: {
        id: swot.mediatorId,
        name: swot.mediatorName
      },
      analysis: {
        strengths: swot.strengths,
        weaknesses: swot.weaknesses,
        opportunities: swot.opportunities,
        threats: swot.threats
      },
      assessment: swot.assessment,
      metadata: {
        generatedAt: swot.generatedAt,
        version: '1.0'
      }
    };
  }
}

module.exports = new SwotGenerator();
