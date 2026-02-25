/**
 * Manual Ideology Validation Dataset
 * 25 mediators cross-referenced with FEC donations, bar associations, and public records
 * Used to measure accuracy of algorithmic ideology classification
 *
 * Validation methodology:
 * - FEC donations (https://www.fec.gov): Primary source for political affiliation
 * - Federalist Society membership (public directories): Strong conservative signal
 * - American Constitution Society membership: Strong liberal signal
 * - Bar association leadership positions (review committee assignments)
 * - Published opinions in legal journals
 *
 * Confidence levels:
 * - HIGH: 3+ verified signals from different sources
 * - MEDIUM: 2 verified signals
 * - LOW: 1 signal or inference only
 *
 * Last Updated: February 22, 2026
 */

module.exports = {
  validatedMediators: [
    {
      name: 'Sample Mediator 1',
      manualIdeology: 'conservative',
      confidence: 'high',
      evidence: [
        {
          source: 'FEC',
          type: 'donation',
          details: 'Donated $2,500 to Republican National Committee (2024)',
          url: 'https://www.fec.gov/data/receipts/?contributor_name=...',
          weight: 0.8
        },
        {
          source: 'Federalist Society',
          type: 'membership',
          details: 'Member since 2015, listed in public directory',
          url: 'https://fedsoc.org/...',
          weight: 0.9
        },
        {
          source: 'Publication',
          type: 'article',
          details: 'Authored "Originalism in Alternative Dispute Resolution" (2023)',
          url: 'https://...',
          weight: 0.4
        }
      ],
      algorithmPrediction: null, // To be filled by algorithm
      algorithmCorrect: null // To be calculated
    },
    {
      name: 'Sample Mediator 2',
      manualIdeology: 'liberal',
      confidence: 'high',
      evidence: [
        {
          source: 'FEC',
          type: 'donation',
          details: 'Donated $1,000 to Democratic Senatorial Campaign Committee (2024)',
          url: 'https://www.fec.gov/...',
          weight: 0.8
        },
        {
          source: 'American Constitution Society',
          type: 'membership',
          details: 'Active member, attended 2024 conference',
          url: 'https://acslaw.org/...',
          weight: 0.7
        },
        {
          source: 'ACLU',
          type: 'affiliation',
          details: 'Former staff attorney (2010-2015)',
          url: null,
          weight: 0.6
        }
      ],
      algorithmPrediction: null,
      algorithmCorrect: null
    },
    {
      name: 'Sample Mediator 3',
      manualIdeology: 'neutral',
      confidence: 'medium',
      evidence: [
        {
          source: 'FEC',
          type: 'donation',
          details: 'No donations found in past 10 years',
          url: 'https://www.fec.gov/...',
          weight: 0
        },
        {
          source: 'Bar Association',
          type: 'service',
          details: 'Served on both plaintiff and defense panels',
          url: null,
          weight: 0.2
        }
      ],
      algorithmPrediction: null,
      algorithmCorrect: null
    }
    // TODO: Add 22 more validated mediators
    // Target: 10 conservative, 10 liberal, 5 neutral
    // Mix of confidence levels: 15 high, 7 medium, 3 low
  ],

  /**
   * Calculate validation metrics
   */
  calculateMetrics() {
    const total = this.validatedMediators.filter(m => m.algorithmPrediction !== null).length;
    const correct = this.validatedMediators.filter(m => m.algorithmCorrect === true).length;
    const incorrect = this.validatedMediators.filter(m => m.algorithmCorrect === false).length;

    const accuracy = total > 0 ? (correct / total * 100).toFixed(2) : 0;

    // Breakdown by ideology
    const liberalCorrect = this.validatedMediators.filter(m => m.manualIdeology === 'liberal' && m.algorithmCorrect === true).length;
    const liberalTotal = this.validatedMediators.filter(m => m.manualIdeology === 'liberal' && m.algorithmPrediction !== null).length;

    const conservativeCorrect = this.validatedMediators.filter(m => m.manualIdeology === 'conservative' && m.algorithmCorrect === true).length;
    const conservativeTotal = this.validatedMediators.filter(m => m.manualIdeology === 'conservative' && m.algorithmPrediction !== null).length;

    const neutralCorrect = this.validatedMediators.filter(m => m.manualIdeology === 'neutral' && m.algorithmCorrect === true).length;
    const neutralTotal = this.validatedMediators.filter(m => m.manualIdeology === 'neutral' && m.algorithmPrediction !== null).length;

    return {
      overall: {
        total,
        correct,
        incorrect,
        accuracy: `${accuracy}%`
      },
      byIdeology: {
        liberal: {
          accuracy: liberalTotal > 0 ? `${(liberalCorrect / liberalTotal * 100).toFixed(2)}%` : 'N/A',
          correct: liberalCorrect,
          total: liberalTotal
        },
        conservative: {
          accuracy: conservativeTotal > 0 ? `${(conservativeCorrect / conservativeTotal * 100).toFixed(2)}%` : 'N/A',
          correct: conservativeCorrect,
          total: conservativeTotal
        },
        neutral: {
          accuracy: neutralTotal > 0 ? `${(neutralCorrect / neutralTotal * 100).toFixed(2)}%` : 'N/A',
          correct: neutralCorrect,
          total: neutralTotal
        }
      }
    };
  },

  /**
   * Test algorithm against validated dataset
   */
  async testAlgorithm(ideologyClassifierFn) {
    for (const mediator of this.validatedMediators) {
      // Run algorithm
      const bioText = `${mediator.name} ${mediator.evidence.map(e => e.details).join(' ')}`;
      const result = await ideologyClassifierFn(bioText);

      // Store prediction
      mediator.algorithmPrediction = result.leaning || result.sentiment;

      // Check if correct
      mediator.algorithmCorrect = mediator.algorithmPrediction === mediator.manualIdeology;
    }

    return this.calculateMetrics();
  }
};
