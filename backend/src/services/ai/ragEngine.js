/**
 * RAG (Retrieval-Augmented Generation) Engine
 * Combines vector search with LLM generation for grounded, accurate responses
 */

const embeddingService = require('./embeddingService');
const hfClient = require('../huggingface/hfClient');
const Mediator = require('../../models/Mediator');
const logger = require('../../config/logger');
const { escapeRegex } = require('../../utils/sanitization');

class RAGEngine {
  constructor() {
    this.topK = 10; // Number of similar mediators to retrieve
    this.similarityThreshold = 0.5; // Minimum similarity score
  }

  /**
   * Process user query with RAG
   * 1. Generate query embedding
   * 2. Search for similar mediators using vector search
   * 3. Retrieve full mediator details from MongoDB
   * 4. Pass context to LLM for grounded response
   */
  async processQuery(userQuery, conversationHistory = [], options = {}) {
    const {
      topK = this.topK,
      filters = {},
      includeIdeology = true,
      includeConflicts = true
    } = options;

    try {
      // Step 1: Semantic search for relevant mediators
      logger.info(`Processing RAG query: "${userQuery.substring(0, 50)}..."`);

      const similarMediators = await embeddingService.searchSimilar(userQuery, {
        topK: topK * 2, // Get more than needed for filtering
        filter: this.buildMongoFilter(filters)
      });

      // Step 2: Filter by similarity threshold
      const relevantMediators = similarMediators.filter(
        m => m.similarity >= this.similarityThreshold
      );

      if (relevantMediators.length === 0) {
        logger.warn('No mediators found above similarity threshold, falling back to all mediators');
        return await this.fallbackQuery(userQuery, conversationHistory, topK);
      }

      // Step 3: Retrieve full mediator details from MongoDB
      const mediatorIds = relevantMediators.slice(0, topK).map(m => m.mediatorId);
      const fullMediators = await Mediator.find({ _id: { $in: mediatorIds } })
        .select('name email phone location lawFirm specializations yearsExperience ideologyScore certifications barAdmissions affiliations cases isVerified isActive');

      // Step 4: Build context for LLM
      const context = this.buildContext(fullMediators, relevantMediators, {
        includeIdeology,
        includeConflicts
      });

      // Step 5: Generate response with grounded context
      const response = await this.generateResponse(
        userQuery,
        context,
        conversationHistory,
        fullMediators
      );

      return {
        message: response.content,
        model: response.model,
        timestamp: new Date(),
        mediators: fullMediators,
        sources: this.buildSources(fullMediators, relevantMediators),
        metadata: {
          searchMethod: 'rag',
          similarityScores: relevantMediators.map(m => ({
            mediatorId: m.mediatorId,
            similarity: m.similarity,
            distance: m.distance
          })),
          vectorSearchResults: relevantMediators.length,
          threshold: this.similarityThreshold
        }
      };
    } catch (error) {
      logger.error('RAG engine error:', error);

      // Fallback to traditional search if RAG fails
      logger.warn('Falling back to traditional search');
      return await this.fallbackQuery(userQuery, conversationHistory, topK);
    }
  }

  /**
   * Build MongoDB filter from user filters
   */
  buildMongoFilter(filters) {
    const mongoFilter = {};

    if (filters.state) {
      mongoFilter['location.state'] = filters.state;
    }

    if (filters.city) {
      mongoFilter['location.city'] = filters.city;
    }

    if (filters.isVerified !== undefined) {
      mongoFilter.isVerified = filters.isVerified;
    }

    if (filters.isActive !== undefined) {
      mongoFilter.isActive = filters.isActive;
    }

    if (filters.minExperience) {
      mongoFilter.yearsExperience = { $gte: filters.minExperience };
    }

    return Object.keys(mongoFilter).length > 0 ? mongoFilter : {};
  }

  /**
   * Build rich context for LLM with mediator details
   */
  buildContext(mediators, similarityResults, options) {
    const contextParts = [];

    mediators.forEach((mediator, index) => {
      const similarity = similarityResults.find(s => s.mediatorId === mediator._id.toString());
      const similarityScore = similarity ? (similarity.similarity * 100).toFixed(1) : 'N/A';

      const parts = [
        `${index + 1}. ${mediator.name}`,
        `   Match Score: ${similarityScore}%`,
        `   Location: ${mediator.location?.city || 'N/A'}, ${mediator.location?.state || 'N/A'}`,
        `   Experience: ${mediator.yearsExperience || 0} years`,
        `   Specializations: ${mediator.specializations?.join(', ') || 'General'}`,
      ];

      if (mediator.lawFirm) {
        parts.push(`   Law Firm: ${mediator.lawFirm}`);
      }

      if (mediator.certifications?.length) {
        parts.push(`   Certifications: ${mediator.certifications.join(', ')}`);
      }

      if (mediator.barAdmissions?.length) {
        parts.push(`   Bar Admissions: ${mediator.barAdmissions.join(', ')}`);
      }

      if (options.includeIdeology && mediator.ideologyScore !== undefined) {
        const ideologyLabel = Math.abs(mediator.ideologyScore) < 2 ? 'Neutral' :
                             mediator.ideologyScore < 0 ? 'Liberal-leaning' : 'Conservative-leaning';
        parts.push(`   Ideology: ${ideologyLabel} (score: ${mediator.ideologyScore})`);
      }

      if (options.includeConflicts && mediator.affiliations?.length) {
        parts.push(`   Affiliations: ${mediator.affiliations.length} organizations/firms`);
      }

      parts.push(`   Verified: ${mediator.isVerified ? 'Yes' : 'No'}`);
      parts.push(''); // Empty line for readability

      contextParts.push(parts.join('\n'));
    });

    return contextParts.join('\n');
  }

  /**
   * Generate LLM response with grounded context
   */
  async generateResponse(userQuery, context, conversationHistory, mediators) {
    const systemPrompt = `You are FairMediator AI, an intelligent mediator recommendation system.

Your task is to recommend mediators based on the user's query using ONLY the information provided below. Do not make up or hallucinate information about mediators.

AVAILABLE MEDIATORS (sorted by relevance using semantic search):
${context}

INSTRUCTIONS:
- Recommend mediators based on their match score and relevance to the user's needs
- Cite specific details from the context above (location, experience, specializations)
- If the user asks about conflicts of interest, mention that specialized conflict checking is available
- If multiple mediators are highly relevant, present top 3-5 options with pros/cons
- Be transparent about match scores - higher scores indicate better semantic similarity to user needs
- If no mediators are highly relevant (all scores < 70%), acknowledge this and suggest refining the search

GROUNDING RULES:
- NEVER invent mediator names, credentials, or details not in the context
- ALWAYS cite the match score when recommending a mediator
- If asked about something not in the context, say "I don't have that information"`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-4), // Keep last 4 messages for context
      { role: 'user', content: userQuery }
    ];

    const response = await hfClient.chat(messages, {
      temperature: 0.3, // Lower temperature for more grounded responses
      maxTokens: 1024
    });

    return response;
  }

  /**
   * Build source citations for transparency
   */
  buildSources(mediators, similarityResults) {
    return mediators.map(mediator => {
      const similarity = similarityResults.find(s => s.mediatorId === mediator._id.toString());

      return {
        mediatorId: mediator._id,
        name: mediator.name,
        matchScore: similarity ? (similarity.similarity * 100).toFixed(1) : 'N/A',
        location: `${mediator.location?.city || ''}, ${mediator.location?.state || ''}`.trim(),
        specializations: mediator.specializations || [],
        yearsExperience: mediator.yearsExperience || 0,
        verified: mediator.isVerified
      };
    });
  }

  /**
   * Fallback to traditional search when RAG fails or no vector data available
   */
  async fallbackQuery(userQuery, conversationHistory, topK) {
    logger.info('Using fallback (non-RAG) search');

    // Simple keyword search
    const mediators = await Mediator.find({
      $or: [
        { name: new RegExp(escapeRegex(userQuery), 'i') },
        { specializations: new RegExp(escapeRegex(userQuery), 'i') },
        { lawFirm: new RegExp(escapeRegex(userQuery), 'i') },
        { 'location.city': new RegExp(escapeRegex(userQuery), 'i') },
        { 'location.state': new RegExp(escapeRegex(userQuery), 'i') }
      ],
      isActive: true
    })
    .limit(topK)
    .select('name email phone location lawFirm specializations yearsExperience ideologyScore certifications barAdmissions isVerified');

    const context = mediators.map((m, i) => {
      return `${i + 1}. ${m.name}
   Location: ${m.location?.city || 'N/A'}, ${m.location?.state || 'N/A'}
   Experience: ${m.yearsExperience || 0} years
   Specializations: ${m.specializations?.join(', ') || 'General'}
   Verified: ${m.isVerified ? 'Yes' : 'No'}
`;
    }).join('\n');

    const systemPrompt = `You are FairMediator AI. Recommend mediators based on the user's query.

AVAILABLE MEDIATORS:
${context}

Note: These results are from keyword search. For better semantic matching, ensure the vector database is initialized.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-4),
      { role: 'user', content: userQuery }
    ];

    const response = await hfClient.chat(messages, { temperature: 0.3, maxTokens: 1024 });

    return {
      message: response.content,
      model: response.model,
      timestamp: new Date(),
      mediators: mediators,
      sources: mediators.map(m => ({
        mediatorId: m._id,
        name: m.name,
        matchScore: 'N/A',
        location: `${m.location?.city || ''}, ${m.location?.state || ''}`.trim(),
        specializations: m.specializations || [],
        yearsExperience: m.yearsExperience || 0,
        verified: m.isVerified
      })),
      metadata: {
        searchMethod: 'fallback_keyword',
        vectorSearchResults: 0,
        fallbackReason: 'Vector search unavailable or returned no results'
      }
    };
  }

  /**
   * Hybrid search: Combine vector search with traditional filters
   */
  async hybridSearch(userQuery, filters = {}) {
    try {
      // Get semantic matches
      const vectorResults = await embeddingService.searchSimilar(userQuery, {
        topK: 20,
        filter: this.buildMongoFilter(filters)
      });

      // Get keyword matches
      const keywordQuery = {
        $or: [
          { name: new RegExp(escapeRegex(userQuery), 'i') },
          { specializations: new RegExp(escapeRegex(userQuery), 'i') },
          { lawFirm: new RegExp(escapeRegex(userQuery), 'i') }
        ],
        isActive: true
      };

      // Apply additional filters
      if (filters.state) keywordQuery['location.state'] = filters.state;
      if (filters.city) keywordQuery['location.city'] = new RegExp(escapeRegex(filters.city), 'i');
      if (filters.minExperience) keywordQuery.yearsExperience = { $gte: filters.minExperience };

      const keywordResults = await Mediator.find(keywordQuery).limit(10);

      // Merge results (prioritize vector search)
      const vectorIds = new Set(vectorResults.map(v => v.mediatorId));
      const keywordIds = keywordResults.map(k => k._id.toString()).filter(id => !vectorIds.has(id));

      const allIds = [
        ...vectorResults.slice(0, 7).map(v => v.mediatorId),
        ...keywordIds.slice(0, 3)
      ];

      const mediators = await Mediator.find({ _id: { $in: allIds } })
        .select('name email phone location lawFirm specializations yearsExperience ideologyScore certifications barAdmissions isVerified');

      return {
        mediators,
        vectorMatches: vectorResults.length,
        keywordMatches: keywordResults.length,
        hybridCount: allIds.length
      };
    } catch (error) {
      logger.error('Hybrid search error:', error);
      throw error;
    }
  }
}

module.exports = new RAGEngine();
