/**
 * Llama Services - LLM-powered web scraping integration
 * Uses Crawl4AI (zero-cost, local) and ScrapeGraphAI (graph-based)
 */

const llamaClient = require('./llamaClient');
const affiliationDetector = require('./affiliationDetector');
const ideologyClassifier = require('./ideologyClassifier');
const chatService = require('./chatService');

module.exports = {
  llamaClient,
  affiliationDetector,
  ideologyClassifier,
  chatService
};
