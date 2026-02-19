/**
 * Chat Service - Enhanced with Real AI Integration
 * Now uses actual ideology classifier, affiliation detector, and smart learning
 */

const hfClient = require('./hfClient');
const Mediator = require('../../models/Mediator');
const logger = require('../../config/logger');
const documentParser = require('../documentParser');
const ideologyClassifier = require('./ideologyClassifier');
const affiliationDetector = require('./affiliationDetector');
const contextBuilder = require('../learning/contextBuilder');
const ragEngine = require('../ai/ragEngine');
const memorySystem = require('../ai/memorySystem');

class ChatService {
  /**
   * Process query with RAG (Retrieval-Augmented Generation)
   * Uses vector search for semantic matching + LLM for grounded responses
   * Now enhanced with memory system for personalized responses
   */
  async processQueryWithRAG(userMessage, conversationHistory = [], options = {}) {
    try {
      // Extract user and conversation IDs
      const userId = options.userId || 'anonymous';
      const conversationId = options.conversationId || `conv_${Date.now()}`;

      // Build memory context (user preferences, past interactions)
      let memoryContext = null;
      try {
        memoryContext = await memorySystem.buildMemoryContext(userId, conversationId, userMessage);
      } catch (error) {
        logger.warn('Memory system unavailable, continuing without memory', { error: error.message });
      }

      // Enhance options with memory context
      const enhancedOptions = {
        ...options,
        memoryContext,
        userId,
        conversationId
      };

      // Use RAG engine for semantic search + grounded generation
      const result = await ragEngine.processQuery(userMessage, conversationHistory, enhancedOptions);

      // Enhance with ideology and emotion analysis
      const ideologyAnalysis = await ideologyClassifier.classifyText(userMessage);
      const emotion = await this.analyzeEmotion(userMessage);
      const politicalBalance = this.buildPoliticalBalance(ideologyAnalysis);

      // Check for conflicts if parties mentioned
      const parties = await this.extractParties(userMessage, conversationHistory);
      let conflictFlags = [];
      if (parties.length > 0) {
        const conflictResults = await this.checkMediatorConflicts(result.mediators.slice(0, 5), parties);
        conflictFlags = conflictResults.filter(c => c.hasConflict);
      }

      // Store conversation in memory system for future personalization
      try {
        await memorySystem.storeConversation(userId, conversationId, {
          role: 'user',
          content: userMessage,
          timestamp: new Date().toISOString()
        });

        // Store assistant response
        await memorySystem.storeConversation(userId, conversationId, {
          role: 'assistant',
          content: result.response,
          timestamp: new Date().toISOString(),
          metadata: {
            mediatorsFound: result.mediators?.length || 0,
            ideologyDetected: ideologyAnalysis
          }
        });
      } catch (error) {
        logger.warn('Failed to store in memory system', { error: error.message });
        // Continue even if memory storage fails
      }

      return {
        ...result,
        caseAnalysis: {
          political: politicalBalance,
          emotion,
          ideologyDetected: ideologyAnalysis,
          conflictFlags,
          partiesDetected: parties,
          baseConflictRisk: this.calculateBaseConflictRisk(politicalBalance, emotion)
        },
        ragEnabled: true,
        memoryEnabled: memoryContext !== null
      };
    } catch (error) {
      logger.error('RAG query error, falling back to traditional', { error: error.message });
      // Fallback to traditional method if RAG fails
      return await this.processQuery(userMessage, conversationHistory);
    }
  }

  /**
   * Traditional query processing (non-RAG)
   * Kept for backwards compatibility and fallback
   */
  async processQuery(userMessage, conversationHistory = []) {
    // Extract parties mentioned in the query
    const parties = await this.extractParties(userMessage, conversationHistory);

    // Get all mediators with full details
    const mediators = await Mediator.find()
      .select('name expertise ideology location ideologyScore hourlyRate practiceAreas yearsExperience rating totalMediations affiliations bio')
      .limit(50);

    // Analyze user message with REAL AI
    const ideologyAnalysis = await ideologyClassifier.classifyText(userMessage);

    // Analyze emotion from message
    const emotion = await this.analyzeEmotion(userMessage);

    // Build political balance from ideology analysis
    const politicalBalance = this.buildPoliticalBalance(ideologyAnalysis);

    // Calculate base conflict risk
    const baseConflictRisk = this.calculateBaseConflictRisk(politicalBalance, emotion);

    // Prioritize neutral mediators
    const sortedMediators = this.prioritizeMediators(mediators);

    // Check for conflicts if parties are mentioned
    let conflictResults = [];
    if (parties.length > 0) {
      conflictResults = await this.checkMediatorConflicts(sortedMediators.slice(0, 10), parties);
    }

    // Determine if we need to ask follow-up questions
    const needsFollowUp = this.needsFollowUpQuestions(userMessage, conversationHistory);

    // Extract case details for learning
    const caseType = this.extractCaseType(userMessage);
    const jurisdiction = this.extractJurisdiction(userMessage);

    // Get smart learning context from past cases
    const learnedContext = await contextBuilder.buildContextForQuery(
      caseType,
      jurisdiction,
      ideologyAnalysis.leaning
    );

    // Build context for AI with mediator stats
    const context = sortedMediators.slice(0, 10).map(m => {
      const conflictInfo = conflictResults.find(c => c.mediatorId === m._id.toString());
      return `${m.name}: ${m.practiceAreas?.join(', ') || 'General'} | Ideology: ${m.ideology?.leaning || 'neutral'} (score: ${m.ideologyScore || 0}) | Location: ${m.location?.city}, ${m.location?.state} | Experience: ${m.yearsExperience || 0}y | Rating: ${m.rating || 0}/5 (${m.totalMediations || 0} cases) | Hourly: $${m.hourlyRate || 0}${conflictInfo?.hasConflict ? ' | ⚠️ CONFLICT' : ''}`;
    }).join('\n');

    const systemPrompt = `You are FairMediator AI. Suggest mediators based on case details, prioritizing neutral options.

${learnedContext}

Available Mediators (sorted by compatibility):
${context}

${needsFollowUp ? 'IMPORTANT: Ask clarifying questions about case type, location preference, budget, or specific expertise needed.' : 'Provide detailed recommendations with reasoning based on the mediator stats shown.'}

${conflictResults.some(c => c.hasConflict) ? 'WARNING: Some mediators have potential conflicts of interest. Flag these clearly.' : ''}

Case Analysis:
- Political leaning detected: ${ideologyAnalysis.leaning} (confidence: ${ideologyAnalysis.confidence}%)
- Emotional tone: ${emotion}
- Conflict risk: ${baseConflictRisk}%`;

    const messages = [
      { role: 'system', content: systemPrompt },
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
        ideologyDetected: ideologyAnalysis,
        conflictFlags: conflictResults.filter(c => c.hasConflict),
        partiesDetected: parties
      },
      needsFollowUp,
      followUpSuggestions: needsFollowUp ? this.generateFollowUpQuestions(userMessage) : []
    };
  }

  /**
   * Extract party names from user message using AI
   */
  async extractParties(userMessage, history) {
    const fullText = `${history.map(h => h.content).join(' ')} ${userMessage}`;

    // Look for party indicators
    const partyPatterns = [
      /\bvs?\b\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
      /\bagainst\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      /\bopposing\s+party:?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      /\bparty:?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi
    ];

    const parties = new Set();
    partyPatterns.forEach(pattern => {
      const matches = fullText.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length > 2) {
          parties.add(match[1].trim());
        }
      }
    });

    return Array.from(parties);
  }

  /**
   * Check mediators for conflicts with parties using AI
   */
  async checkMediatorConflicts(mediators, parties) {
    const results = [];

    for (const mediator of mediators) {
      try {
        const conflictResult = await affiliationDetector.detectConflicts(
          {
            name: mediator.name,
            affiliations: mediator.affiliations || [],
            bio: mediator.bio || ''
          },
          parties
        );

        results.push({
          mediatorId: mediator._id.toString(),
          mediatorName: mediator.name,
          ...conflictResult
        });
      } catch (error) {
        logger.error(`Error checking conflicts for ${mediator.name}`, { error: error.message });
        results.push({
          mediatorId: mediator._id.toString(),
          mediatorName: mediator.name,
          hasConflict: false,
          conflicts: [],
          riskLevel: 'unknown'
        });
      }
    }

    return results;
  }

  /**
   * Determine if we need to ask follow-up questions
   */
  needsFollowUpQuestions(userMessage, history) {
    // Don't ask if conversation is already deep
    if (history.length > 4) return false;

    // Check if message is vague or lacks key details
    const hasLocation = /\b(in|near|around)\s+[A-Z][a-z]+/i.test(userMessage);
    const hasCaseType = /(employment|business|family|real estate|contract|IP|dispute|case)/i.test(userMessage);
    const hasBudget = /\$|budget|afford|cost|price/i.test(userMessage);

    // Message is too vague if it's missing 2+ key pieces
    const missingCount = [hasLocation, hasCaseType, hasBudget].filter(x => !x).length;

    return missingCount >= 2;
  }

  /**
   * Generate follow-up questions based on what's missing
   */
  generateFollowUpQuestions(userMessage) {
    const questions = [];

    if (!/\b(in|near|around)\s+[A-Z][a-z]+/i.test(userMessage)) {
      questions.push("What location or jurisdiction is your case in?");
    }

    if (!/(employment|business|family|real estate|contract|IP|dispute|case)/i.test(userMessage)) {
      questions.push("What type of case or dispute is this? (e.g., employment, business, family law)");
    }

    if (!/\$|budget|afford|cost|price/i.test(userMessage)) {
      questions.push("Do you have a budget or hourly rate preference?");
    }

    return questions;
  }

  /**
   * Build political balance from AI ideology analysis
   */
  buildPoliticalBalance(ideologyAnalysis) {
    const { leaning, confidence } = ideologyAnalysis;

    if (leaning === 'liberal') {
      const liberal = Math.min(30 + confidence / 2, 50);
      const conservative = Math.max(20 - confidence / 4, 10);
      return {
        liberal: Math.round(liberal),
        conservative: Math.round(conservative),
        neutral: Math.round(100 - liberal - conservative)
      };
    } else if (leaning === 'conservative') {
      const conservative = Math.min(30 + confidence / 2, 50);
      const liberal = Math.max(20 - confidence / 4, 10);
      return {
        liberal: Math.round(liberal),
        conservative: Math.round(conservative),
        neutral: Math.round(100 - liberal - conservative)
      };
    }

    // Neutral or uncertain
    return {
      liberal: 30,
      conservative: 25,
      neutral: 45
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
   * Process query with document analysis
   */
  async processQueryWithCaseAnalysis(userMessage, conversationHistory = []) {
    // Parse the message for case details using document parser
    const caseDetails = await documentParser.parseText(userMessage);

    // Get mediators filtered by case type and jurisdiction
    const mediators = await this.getMediatorsByCaseType(
      caseDetails.caseType,
      caseDetails.jurisdiction
    );

    // Use real AI for ideology analysis
    const ideologyAnalysis = await ideologyClassifier.classifyText(userMessage);

    // Analyze user emotion from message
    const emotion = await this.analyzeEmotion(userMessage);

    // Build political balance from AI analysis
    const politicalBalance = this.buildPoliticalBalance(ideologyAnalysis);

    // Calculate base conflict risk
    const baseConflictRisk = this.calculateBaseConflictRisk(politicalBalance, emotion);

    // Prioritize neutral mediators
    const sortedMediators = this.prioritizeMediators(mediators);

    const context = sortedMediators.slice(0, 10).map(m =>
      `${m.name}: ${m.practiceAreas?.join(', ') || 'General'} | ${m.ideology?.leaning || 'unknown'} | ${m.location?.city}, ${m.location?.state} | ${m.yearsExperience}y | ${m.rating}/5 | $${m.hourlyRate}/hr`
    ).join('\n');

    const messages = [
      {
        role: 'system',
        content: `You are FairMediator AI. The user has a ${caseDetails.caseType} case${caseDetails.jurisdiction ? ` in ${caseDetails.jurisdiction.city || ''} ${caseDetails.jurisdiction.state || ''}` : ''}. Suggest mediators who specialize in this area.

Available Mediators (sorted by compatibility and expertise):
${context}

Focus on recommending mediators with relevant experience in ${caseDetails.caseType} cases. Include their stats (rating, experience, hourly rate) in your recommendation.`
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
        keywords: caseDetails.keywords,
        ideologyDetected: ideologyAnalysis
      }
    };
  }

  /**
   * Get mediators by case type and jurisdiction
   */
  async getMediatorsByCaseType(caseType, jurisdiction) {
    try {
      const query = {};

      // Filter by case type in practice areas or expertise
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
        .select('name expertise ideology location ideologyScore hourlyRate practiceAreas yearsExperience rating totalMediations affiliations bio')
        .limit(50);

      // If no specific matches, fall back to all mediators in the jurisdiction
      if (mediators.length === 0 && jurisdiction) {
        const fallbackQuery = {};
        if (jurisdiction.state) {
          fallbackQuery['location.state'] = jurisdiction.state;
        }
        return await Mediator.find(fallbackQuery)
          .select('name expertise ideology location ideologyScore hourlyRate practiceAreas yearsExperience rating totalMediations affiliations bio')
          .limit(50);
      }

      return mediators;
    } catch (error) {
      logger.error('Error fetching mediators by case type', { error: error.message });
      // Fall back to all mediators if query fails
      return await Mediator.find()
        .select('name expertise ideology location ideologyScore hourlyRate practiceAreas yearsExperience rating totalMediations affiliations bio')
        .limit(50);
    }
  }

  /**
   * Extract case type from user message
   */
  extractCaseType(message) {
    const caseTypes = {
      employment: /employment|worker|employee|wrongful termination|discrimination|harassment/i,
      business: /business|commercial|contract dispute|partnership|llc|corporation/i,
      family: /family|divorce|custody|child support|alimony/i,
      real_estate: /real estate|property|landlord|tenant|lease/i,
      contract: /contract|breach|agreement/i,
      ip: /intellectual property|patent|trademark|copyright|IP dispute/i,
      construction: /construction|contractor|building|renovation/i,
      healthcare: /healthcare|medical|malpractice|hospital/i
    };

    for (const [type, pattern] of Object.entries(caseTypes)) {
      if (pattern.test(message)) {
        return type;
      }
    }

    return 'other';
  }

  /**
   * Extract jurisdiction from user message
   */
  extractJurisdiction(message) {
    // Simple state extraction (can be enhanced with NER later)
    const stateMatch = message.match(/\b(in|from|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),?\s+([A-Z]{2}|[A-Z][a-z]+)/i);

    if (stateMatch) {
      return {
        city: stateMatch[2],
        state: stateMatch[3]
      };
    }

    // Try to find just state
    const stateOnlyMatch = message.match(/\b(in|from|near)\s+([A-Z][a-z]+)/i);
    if (stateOnlyMatch) {
      return {
        state: stateOnlyMatch[2]
      };
    }

    return null;
  }
}

module.exports = new ChatService();
