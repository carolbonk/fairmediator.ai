/**
 * Chat Service (DRY - Refactored)
 */

const hfClient = require('./hfClient');
const Mediator = require('../../models/Mediator');
const documentParser = require('../documentParser'); // NEW: Document analysis integration

class ChatService {
  async processQuery(userMessage, conversationHistory = []) {
    // Get all mediators with full details
    const mediators = await Mediator.find().select('name expertise ideology location ideologyScore hourlyRate practiceAreas').limit(50);

    // Analyze user emotion from message
    const emotion = await this.analyzeEmotion(userMessage);

    // Analyze political balance from case description
    const politicalBalance = await this.analyzePoliticalBalance(userMessage, conversationHistory);

    // Calculate base conflict risk
    const baseConflictRisk = this.calculateBaseConflictRisk(politicalBalance, emotion);

    // Prioritize neutral mediators
    const sortedMediators = this.prioritizeMediators(mediators);

    const context = sortedMediators.slice(0, 10).map(m =>
      `${m.name}: ${m.expertise?.join(', ') || 'General'} | ${m.ideology?.leaning || 'unknown'} | ${m.location?.city}, ${m.location?.state}`
    ).join('\n');

    const messages = [
      {
        role: 'system',
        content: `You are FairMediator AI. Suggest mediators based on case details, prioritizing neutral options.

Available Mediators (sorted by compatibility):
${context}

Focus on identifying potential conflicts and recommending the most suitable mediator based on the case context.`
      },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    const response = await hfClient.chat(messages);

    return {
      message: response.content,
      model: response.model,
      timestamp: new Date(),
      mediators: sortedMediators.slice(0, 10),
      caseAnalysis: {
        political: politicalBalance,
        baseConflictRisk,
        emotion
      }
    };
  }

  async analyzeEmotion(text) {
    // Simple emotion detection based on keywords
    const frustrated = /frustrat|angry|upset|annoyed|mad/i.test(text);
    const urgent = /urgent|asap|immediately|quickly|emergency/i.test(text);
    const calm = /please|thank|appreciate|help|consider/i.test(text);

    if (frustrated) return 'frustrated';
    if (urgent) return 'urgent';
    if (calm) return 'calm';
    return 'neutral';
  }

  async analyzePoliticalBalance(userMessage, history) {
    // Analyze political keywords in the message
    const liberalKeywords = /union|worker|environment|equality|progressive|social justice/i;
    const conservativeKeywords = /business|corporation|tradition|fiscal|conservative|free market/i;

    const fullText = `${history.map(h => h.content).join(' ')} ${userMessage}`;

    const liberalScore = (fullText.match(liberalKeywords) || []).length;
    const conservativeScore = (fullText.match(conservativeKeywords) || []).length;
    const total = liberalScore + conservativeScore || 1;

    const liberal = Math.min(Math.round((liberalScore / total) * 100), 45);
    const conservative = Math.min(Math.round((conservativeScore / total) * 100), 45);
    const neutral = 100 - liberal - conservative;

    return {
      liberal: liberal || 30,
      conservative: conservative || 25,
      neutral: neutral || 45
    };
  }

  calculateBaseConflictRisk(politicalBalance, emotion) {
    let risk = 15; // Base risk

    // Increase risk if political balance is heavily skewed
    if (politicalBalance.liberal > 50 || politicalBalance.conservative > 50) {
      risk += 15;
    }

    // Increase risk based on emotion
    if (emotion === 'frustrated') risk += 10;
    if (emotion === 'urgent') risk += 5;

    return Math.min(risk, 100);
  }

  prioritizeMediators(mediators) {
    return mediators.sort((a, b) => {
      // Prioritize neutral mediators
      const aScore = Math.abs(a.ideologyScore || 0);
      const bScore = Math.abs(b.ideologyScore || 0);

      // Neutral mediators (closer to 0) come first
      return aScore - bScore;
    });
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

  /**
   * NEW FEATURE: Process query with document analysis
   * Extracts case type, jurisdiction, and opposing parties from text
   * Returns case-type-aware mediator suggestions
   *
   * @param {string} userMessage - User's message or document text
   * @param {Array} conversationHistory - Previous messages
   * @returns {Object} Enhanced response with case analysis
   */
  async processQueryWithCaseAnalysis(userMessage, conversationHistory = []) {
    // Parse the message for case details using document parser
    const caseDetails = await documentParser.parseText(userMessage);

    // Get mediators filtered by case type and jurisdiction
    const mediators = await this.getMediatorsByCaseType(
      caseDetails.caseType,
      caseDetails.jurisdiction
    );

    // Analyze user emotion from message
    const emotion = await this.analyzeEmotion(userMessage);

    // Analyze political balance from case description
    const politicalBalance = await this.analyzePoliticalBalance(userMessage, conversationHistory);

    // Calculate base conflict risk
    const baseConflictRisk = this.calculateBaseConflictRisk(politicalBalance, emotion);

    // Prioritize neutral mediators
    const sortedMediators = this.prioritizeMediators(mediators);

    const context = sortedMediators.slice(0, 10).map(m =>
      `${m.name}: ${m.expertise?.join(', ') || 'General'} | ${m.ideology?.leaning || 'unknown'} | ${m.location?.city}, ${m.location?.state}`
    ).join('\n');

    const messages = [
      {
        role: 'system',
        content: `You are FairMediator AI. The user has a ${caseDetails.caseType} case${caseDetails.jurisdiction ? ` in ${caseDetails.jurisdiction.city || ''} ${caseDetails.jurisdiction.state || ''}` : ''}. Suggest mediators who specialize in this area.

Available Mediators (sorted by compatibility and expertise):
${context}

Focus on recommending mediators with relevant experience in ${caseDetails.caseType} cases.`
      },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    const response = await hfClient.chat(messages);

    return {
      message: response.content,
      model: response.model,
      timestamp: new Date(),
      mediators: sortedMediators.slice(0, 10),
      caseAnalysis: {
        political: politicalBalance,
        baseConflictRisk,
        emotion,
        caseType: caseDetails.caseType,
        jurisdiction: caseDetails.jurisdiction,
        opposingParties: caseDetails.opposingParties,
        keywords: caseDetails.keywords
      }
    };
  }

  /**
   * NEW FEATURE: Get mediators by case type and jurisdiction
   * Queries MongoDB for mediators who handle specific case types in a location
   *
   * @param {string} caseType - Type of case (e.g., 'employment', 'business')
   * @param {Object} jurisdiction - Location info {city, state}
   * @returns {Array} Matching mediators
   */
  async getMediatorsByCaseType(caseType, jurisdiction) {
    try {
      const query = {};

      // Filter by case type in practice areas or expertise
      // NOTE: This assumes mediators have 'practiceAreas' or 'expertise' fields
      // INTEGRATION POINT: Adjust field names based on your Mediator model
      if (caseType && caseType !== 'general') {
        query.$or = [
          { practiceAreas: new RegExp(caseType, 'i') },
          { expertise: new RegExp(caseType, 'i') },
          { specializations: new RegExp(caseType, 'i') }
        ];
      }

      // Filter by jurisdiction if provided
      if (jurisdiction) {
        if (jurisdiction.state) {
          query['location.state'] = jurisdiction.state;
        }
        if (jurisdiction.city) {
          query['location.city'] = new RegExp(jurisdiction.city, 'i');
        }
      }

      // Query MongoDB
      const mediators = await Mediator.find(query)
        .select('name expertise ideology location ideologyScore hourlyRate practiceAreas yearsExperience rating')
        .limit(50);

      // If no specific matches, fall back to all mediators in the jurisdiction
      if (mediators.length === 0 && jurisdiction) {
        const fallbackQuery = {};
        if (jurisdiction.state) {
          fallbackQuery['location.state'] = jurisdiction.state;
        }
        return await Mediator.find(fallbackQuery)
          .select('name expertise ideology location ideologyScore hourlyRate practiceAreas yearsExperience rating')
          .limit(50);
      }

      return mediators;
    } catch (error) {
      console.error('Error fetching mediators by case type:', error);
      // Fall back to all mediators if query fails
      return await Mediator.find()
        .select('name expertise ideology location ideologyScore hourlyRate practiceAreas yearsExperience rating')
        .limit(50);
    }
  }
}

module.exports = new ChatService();
