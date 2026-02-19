/**
 * Multi-Perspective AI Mediator Agents
 * Three AI agents with different ideological perspectives for balanced mediation
 * DRY: Reuses hfClient and config
 * 
 * This is a unique feature providing liberal, neutral, and conservative AI perspectives
 */

const hfClient = require('./hfClient');
const logger = require('../../config/logger');

class MultiPerspectiveAgents {
  constructor() {
    // System prompts for each perspective
    this.perspectives = {
      liberal: {
        name: 'Progressive Mediator AI',
        systemPrompt: `You are a progressive, liberal-leaning mediator AI. You prioritize:
- Social justice and equity
- Worker rights and protections
- Environmental concerns
- Individual freedoms and civil liberties
- Progressive dispute resolution approaches

Provide balanced, fair mediation while maintaining these values.`,
        icon: '🔵'
      },

      neutral: {
        name: 'Balanced Mediator AI',
        systemPrompt: `You are a strictly neutral, centrist mediator AI. You prioritize:
- Objective facts and evidence
- Balanced consideration of all perspectives
- Pragmatic, practical solutions
- Legal precedent and established norms
- Fair compromise between parties

Provide completely unbiased mediation focused on facts and fairness.`,
        icon: '⚪'
      },

      conservative: {
        name: 'Traditional Mediator AI',
        systemPrompt: `You are a conservative, traditional mediator AI. You prioritize:
- Established legal frameworks
- Property rights and contracts
- Personal responsibility
- Traditional dispute resolution methods
- Respect for institutional authority

Provide balanced, fair mediation while maintaining these values.`,
        icon: '🔴'
      }
    };
  }

  /**
   * Get responses from all three perspectives
   * DRY: Single method that calls all agents
   */
  async getAllPerspectives(userMessage, conversationHistory = []) {
    try {
      // Call all three agents in parallel
      const [liberal, neutral, conservative] = await Promise.all([
        this.getResponse('liberal', userMessage, conversationHistory),
        this.getResponse('neutral', userMessage, conversationHistory),
        this.getResponse('conservative', userMessage, conversationHistory)
      ]);

      return {
        liberal,
        neutral,
        conservative,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Multi-perspective error', { error: error.message });
      throw new Error('Failed to get multi-perspective responses');
    }
  }

  /**
   * Get response from specific perspective
   * DRY: Reusable for individual agent queries
   */
  async getResponse(perspective, userMessage, conversationHistory = []) {
    try {
      const agent = this.perspectives[perspective];

      if (!agent) {
        throw new Error('Invalid perspective: ' + perspective);
      }

      const messages = [
        { role: 'system', content: agent.systemPrompt },
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ];

      const response = await hfClient.chat(messages, {
        temperature: perspective === 'neutral' ? 0.5 : 0.7,
        maxTokens: 512
      });

      return {
        perspective,
        name: agent.name,
        icon: agent.icon,
        message: response.content,
        model: response.model
      };
    } catch (error) {
      logger.error(`Single perspective error: ${perspective}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Analyze consensus and differences
   * DRY: Identifies agreement and divergence across perspectives
   */
  async analyzeConsensus(responses) {
    // Extract key themes from each response
    const themes = {
      liberal: this.extractThemes(responses.liberal.message),
      neutral: this.extractThemes(responses.neutral.message),
      conservative: this.extractThemes(responses.conservative.message)
    };

    // Find common ground
    const commonThemes = themes.liberal.filter(theme =>
      themes.neutral.includes(theme) && themes.conservative.includes(theme)
    );

    // Find unique perspectives
    const uniqueToLiberal = themes.liberal.filter(theme =>
      !themes.neutral.includes(theme) && !themes.conservative.includes(theme)
    );

    const uniqueToConservative = themes.conservative.filter(theme =>
      !themes.neutral.includes(theme) && !themes.liberal.includes(theme)
    );

    return {
      consensus: commonThemes,
      divergence: {
        liberal: uniqueToLiberal,
        conservative: uniqueToConservative
      },
      recommendation: commonThemes.length > 0
        ? 'Strong consensus across perspectives - recommended approach'
        : 'Significant divergence - consider multiple viewpoints carefully'
    };
  }

  /**
   * Extract key themes from text
   * DRY: Simple keyword extraction
   */
  extractThemes(text) {
    // Simple keyword-based theme extraction
    const keywords = [
      'contract', 'agreement', 'rights', 'responsibility',
      'equity', 'fairness', 'justice', 'precedent',
      'compromise', 'solution', 'resolution', 'mediation'
    ];

    return keywords.filter(keyword =>
      text.toLowerCase().includes(keyword)
    );
  }

  /**
   * Get recommended mediator based on case type
   * DRY: Matches case characteristics to mediator ideology
   */
  async recommendMediatorPerspective(caseDescription) {
    try {
      const prompt = 'Analyze this case and recommend whether a liberal, conservative, or neutral mediator would be most appropriate. Respond with JSON: {"recommendation": "liberal|neutral|conservative", "reasoning": "brief explanation"}\n\nCase: ' + caseDescription;

      const result = await hfClient.extractStructured(prompt);

      return {
        recommendation: result.recommendation || 'neutral',
        reasoning: result.reasoning || 'Neutral mediator recommended for balanced approach',
        alternativePerspectives: this.getAlternatives(result.recommendation || 'neutral')
      };
    } catch (error) {
      logger.error('Recommendation error', { error: error.message });
      return {
        recommendation: 'neutral',
        reasoning: 'Default neutral recommendation',
        alternativePerspectives: ['liberal', 'conservative']
      };
    }
  }

  /**
   * Get alternative perspectives
   * DRY: Helper for recommendations
   */
  getAlternatives(primary) {
    const all = ['liberal', 'neutral', 'conservative'];
    return all.filter(p => p !== primary);
  }
}

module.exports = new MultiPerspectiveAgents();
