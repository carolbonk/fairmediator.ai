/**
 * Ideology Classifier (DRY - Refactored)
 */

const hfClient = require('./hfClient');
const { config } = require('./utils');

class IdeologyClassifier {
  static KEYWORDS = {
    liberal: ['progressive', 'equality', 'social justice', 'regulation', 'welfare', 'rights', 'diversity'],
    conservative: ['traditional', 'free market', 'individual responsibility', 'limited government', 'liberty']
  };

  async classifyText(text) {
    const prompt = config.prompts.ideology(text);
    
    try {
      const result = await hfClient.extractStructured(prompt);
      return {
        leaning: result.ideology || 'neutral',
        confidence: result.score || 50,
        reasoning: result.reasoning || 'AI analysis',
        timestamp: new Date()
      };
    } catch {
      return this._keywordClassification(text);
    }
  }

  async analyzeMediatorIdeology(mediatorProfile) {
    const text = [
      mediatorProfile.name,
      mediatorProfile.expertise?.join(', '),
      mediatorProfile.affiliations?.join(', '),
      mediatorProfile.bio
    ].filter(Boolean).join(' ');

    if (!text.trim()) {
      return { leaning: 'neutral', confidence: 0, reasoning: 'Insufficient data', timestamp: new Date() };
    }

    return this.classifyText(text);
  }

  // Alias for compatibility with routes
  async classifyIdeology(mediator) {
    const result = await this.analyzeMediatorIdeology(mediator);
    return {
      score: result.leaning === 'liberal' ? -5 : result.leaning === 'conservative' ? 5 : 0,
      label: result.leaning.toUpperCase(),
      confidence: result.confidence / 100,
      factors: [result.reasoning],
      summary: result.reasoning
    };
  }

  // Alias for chat route compatibility - accepts mediatorId and returns full analysis
  async classifyMediator(mediatorId) {
    const Mediator = require('../../models/Mediator');
    const mediator = await Mediator.findById(mediatorId);

    if (!mediator) {
      throw new Error('Mediator not found');
    }

    const result = await this.analyzeMediatorIdeology(mediator);
    return {
      ideology: result.leaning,
      score: result.leaning === 'liberal' ? -5 : result.leaning === 'conservative' ? 5 : 0,
      confidence: result.confidence / 100,
      factors: [result.reasoning],
      summary: result.reasoning
    };
  }

  _keywordClassification(text) {
    const lower = text.toLowerCase();
    const libCount = IdeologyClassifier.KEYWORDS.liberal.filter(k => lower.includes(k)).length;
    const consCount = IdeologyClassifier.KEYWORDS.conservative.filter(k => lower.includes(k)).length;
    
    if (!libCount && !consCount) {
      return { leaning: 'neutral', confidence: 0, reasoning: 'No keywords found' };
    }

    const leaning = libCount > consCount ? 'liberal' : consCount > libCount ? 'conservative' : 'neutral';
    const score = leaning === 'liberal' ? 50 - libCount * 10 : leaning === 'conservative' ? 50 + consCount * 10 : 50;
    
    return {
      leaning,
      confidence: Math.abs(libCount - consCount) * 20,
      reasoning: `${libCount} liberal, ${consCount} conservative keywords`,
      timestamp: new Date()
    };
  }
}

module.exports = new IdeologyClassifier();
