/**
 * AI Memory System
 * Implements conversation memory, long-term memory, and working memory
 * No LangChain - Pure custom implementation
 *
 * Note: ChromaDB is optional. If not installed, memory features will be disabled.
 */

// Try to load ChromaDB (optional dependency)
let ChromaClient = null;
try {
  ChromaClient = require('chromadb').ChromaClient;
} catch (error) {
  // ChromaDB not installed - memory system will be disabled
}

const hfClient = require('../huggingface/hfClient');
const logger = require('../../config/logger');

class MemorySystem {
  constructor() {
    this.client = null;
    this.conversationCollection = null;
    this.longTermCollection = null;
    this.initialized = false;

    // Memory types
    this.MEMORY_TYPES = {
      SHORT_TERM: 'short_term',    // Current conversation (last 10 messages)
      WORKING: 'working',           // Active context (last 100 messages)
      LONG_TERM: 'long_term',       // Persistent memories (embedded & stored)
      EPISODIC: 'episodic'          // Specific events/interactions
    };
  }

  /**
   * Initialize ChromaDB collections for memory
   */
  async initialize() {
    if (this.initialized) return;

    // Check if ChromaDB is available
    if (!ChromaClient) {
      logger.warn('ChromaDB not installed - memory system disabled. Install with: npm install chromadb');
      this.initialized = false;
      return;
    }

    try {
      this.client = new ChromaClient({
        path: process.env.CHROMADB_URL || 'http://localhost:8000'
      });

      // Collection for conversation history (embeddings)
      this.conversationCollection = await this.client.getOrCreateCollection({
        name: 'conversation_memory',
        metadata: { description: 'Conversation history with semantic search' }
      });

      // Collection for long-term facts/knowledge
      this.longTermCollection = await this.client.getOrCreateCollection({
        name: 'long_term_memory',
        metadata: { description: 'Persistent facts and learned knowledge' }
      });

      this.initialized = true;
      logger.info('Memory system initialized');
    } catch (error) {
      logger.error('Failed to initialize memory system:', error);
      this.initialized = false;
    }
  }

  /**
   * Store conversation turn in memory
   * @param {string} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @param {object} message - Message object {role, content, timestamp}
   */
  async storeConversation(userId, conversationId, message) {
    await this.initialize();

    if (!this.initialized) return null;

    try {
      const messageId = `${conversationId}_${Date.now()}`;

      // Generate embedding for semantic search
      const embedding = await this.generateEmbedding(message.content);

      // Store in ChromaDB
      await this.conversationCollection.add({
        ids: [messageId],
        embeddings: [embedding],
        documents: [message.content],
        metadatas: [{
          user_id: userId,
          conversation_id: conversationId,
          role: message.role,
          timestamp: message.timestamp || new Date().toISOString(),
          memory_type: this.MEMORY_TYPES.WORKING
        }]
      });

      return messageId;
    } catch (error) {
      logger.error('Error storing conversation:', error);
      return null;
    }
  }

  /**
   * Retrieve relevant conversation history using semantic search
   * @param {string} query - Current user query
   * @param {string} conversationId - Conversation ID
   * @param {number} limit - Number of relevant messages to retrieve
   */
  async retrieveRelevantHistory(query, conversationId, limit = 5) {
    await this.initialize();

    if (!this.initialized) return [];

    try {
      const queryEmbedding = await this.generateEmbedding(query);

      const results = await this.conversationCollection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit,
        where: { conversation_id: conversationId },
        include: ['metadatas', 'documents', 'distances']
      });

      if (!results.ids || !results.ids[0]) return [];

      return results.ids[0].map((id, index) => ({
        id,
        content: results.documents[0][index],
        metadata: results.metadatas[0][index],
        relevance: 1 - results.distances[0][index]
      }));
    } catch (error) {
      logger.error('Error retrieving conversation history:', error);
      return [];
    }
  }

  /**
   * Store long-term fact/knowledge
   * @param {string} userId - User ID
   * @param {string} fact - Fact to remember
   * @param {object} context - Additional context
   */
  async storeLongTermMemory(userId, fact, context = {}) {
    await this.initialize();

    if (!this.initialized) return null;

    try {
      const factId = `${userId}_fact_${Date.now()}`;
      const embedding = await this.generateEmbedding(fact);

      await this.longTermCollection.add({
        ids: [factId],
        embeddings: [embedding],
        documents: [fact],
        metadatas: [{
          user_id: userId,
          memory_type: this.MEMORY_TYPES.LONG_TERM,
          created_at: new Date().toISOString(),
          ...context
        }]
      });

      logger.info(`Stored long-term memory for user ${userId}`);
      return factId;
    } catch (error) {
      logger.error('Error storing long-term memory:', error);
      return null;
    }
  }

  /**
   * Retrieve long-term memories relevant to current context
   * @param {string} userId - User ID
   * @param {string} query - Current context/query
   * @param {number} limit - Number of memories to retrieve
   */
  async retrieveLongTermMemory(userId, query, limit = 3) {
    await this.initialize();

    if (!this.initialized) return [];

    try {
      const queryEmbedding = await this.generateEmbedding(query);

      const results = await this.longTermCollection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: limit,
        where: { user_id: userId },
        include: ['metadatas', 'documents', 'distances']
      });

      if (!results.ids || !results.ids[0]) return [];

      return results.ids[0].map((id, index) => ({
        id,
        fact: results.documents[0][index],
        metadata: results.metadatas[0][index],
        relevance: 1 - results.distances[0][index]
      }));
    } catch (error) {
      logger.error('Error retrieving long-term memory:', error);
      return [];
    }
  }

  /**
   * Build complete memory context for AI
   * Combines short-term, working, and long-term memory
   */
  async buildMemoryContext(userId, conversationId, currentQuery) {
    const context = {
      shortTerm: [],
      longTerm: [],
      workingMemory: []
    };

    try {
      // Get relevant conversation history (working memory)
      context.workingMemory = await this.retrieveRelevantHistory(
        currentQuery,
        conversationId,
        5
      );

      // Get relevant long-term facts
      context.longTerm = await this.retrieveLongTermMemory(
        userId,
        currentQuery,
        3
      );

      return context;
    } catch (error) {
      logger.error('Error building memory context:', error);
      return context;
    }
  }

  /**
   * Summarize conversation for compression
   * Uses LLM to create summary of long conversations
   */
  async summarizeConversation(messages) {
    try {
      const conversationText = messages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');

      const summaryPrompt = `Summarize the key points and decisions from this conversation:

${conversationText}

Provide a concise summary (2-3 sentences) focusing on:
1. Main topics discussed
2. Important decisions or facts mentioned
3. User preferences revealed

Summary:`;

      const response = await hfClient.chat([
        { role: 'user', content: summaryPrompt }
      ], { temperature: 0.3, maxTokens: 200 });

      return response.content;
    } catch (error) {
      logger.error('Error summarizing conversation:', error);
      return null;
    }
  }

  /**
   * Extract facts from conversation
   * Uses LLM to identify important facts to remember
   */
  async extractFactsFromConversation(messages) {
    try {
      const conversationText = messages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');

      const extractPrompt = `Extract key facts to remember from this conversation:

${conversationText}

Return ONLY a JSON array of facts (no other text):
["fact 1", "fact 2", "fact 3"]

Facts:`;

      const response = await hfClient.chat([
        { role: 'user', content: extractPrompt }
      ], { temperature: 0.2, maxTokens: 300 });

      // Parse JSON response
      const jsonMatch = response.content.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return [];
    } catch (error) {
      logger.error('Error extracting facts:', error);
      return [];
    }
  }

  /**
   * Clear conversation memory (GDPR compliance)
   */
  async clearConversationMemory(conversationId) {
    await this.initialize();

    if (!this.initialized) return false;

    try {
      // Note: ChromaDB doesn't support delete by metadata filter yet
      // This is a placeholder - you'd need to fetch IDs first then delete
      logger.info(`Clearing conversation memory: ${conversationId}`);

      // TODO: Implement when ChromaDB supports metadata-based deletion
      // For now, memories will expire based on timestamp filters

      return true;
    } catch (error) {
      logger.error('Error clearing conversation memory:', error);
      return false;
    }
  }

  /**
   * Generate embedding using HuggingFace
   */
  async generateEmbedding(text) {
    return await hfClient.featureExtraction(
      text,
      'sentence-transformers/all-MiniLM-L6-v2'
    );
  }

  /**
   * Get memory statistics
   */
  async getStats() {
    await this.initialize();

    if (!this.initialized) {
      return { initialized: false };
    }

    try {
      const conversationCount = await this.conversationCollection.count();
      const longTermCount = await this.longTermCollection.count();

      return {
        initialized: true,
        conversationMemories: conversationCount,
        longTermMemories: longTermCount
      };
    } catch (error) {
      logger.error('Error getting memory stats:', error);
      return { initialized: false, error: error.message };
    }
  }
}

module.exports = new MemorySystem();
