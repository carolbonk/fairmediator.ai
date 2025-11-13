/**
 * Chat Service (DRY - Refactored)
 */

const hfClient = require('./hfClient');
const Mediator = require('../../models/Mediator');

class ChatService {
  async processQuery(userMessage, conversationHistory = []) {
    const mediators = await Mediator.find().select('name expertise ideology location').limit(20);
    
    const context = mediators.map(m => 
      `${m.name}: ${m.expertise.join(', ')} | ${m.ideology?.leaning || 'unknown'} | ${m.location || 'N/A'}`
    ).join('\n');

    const messages = [
      {
        role: 'system',
        content: `You are FairMediator AI. Available Mediators:\n${context}\n\nHelp users find mediators, identify conflicts, and provide unbiased advice.`
      },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    const response = await hfClient.chat(messages);
    return { message: response.content, model: response.model, timestamp: new Date() };
  }

  async searchMediators(query) {
    const mediators = await Mediator.find();
    const prompt = `Extract search criteria from: "${query}"\nJSON: {"expertise": [], "location": "", "ideology": "", "keywords": []}`;
    
    try {
      const criteria = await hfClient.extractStructured(prompt);
      let results = mediators;

      if (criteria.expertise?.length) {
        results = results.filter(m => 
          m.expertise.some(e => criteria.expertise.some(term => e.toLowerCase().includes(term.toLowerCase())))
        );
      }

      if (criteria.location) {
        results = results.filter(m => m.location?.toLowerCase().includes(criteria.location.toLowerCase()));
      }

      if (criteria.ideology && criteria.ideology !== 'any') {
        results = results.filter(m => m.ideology?.leaning === criteria.ideology);
      }

      return { results: results.slice(0, 10), criteria, total: results.length };
    } catch {
      return {
        results: await Mediator.find({
          $or: [
            { name: new RegExp(query, 'i') },
            { expertise: new RegExp(query, 'i') },
            { location: new RegExp(query, 'i') }
          ]
        }).limit(10),
        criteria: { query },
        total: 0
      };
    }
  }
}

module.exports = new ChatService();
