/**
 * Chat Routes
 * Handles chat interactions for mediator search
 */

const express = require('express');
const router = express.Router();
const chatService = require('../services/huggingface/chatService');

/**
 * POST /api/chat
 * Process a user chat message and return mediator recommendations
 */
router.post('/', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        error: 'Message is required and must be a string' 
      });
    }
    
    const result = await chatService.processQuery(message, history);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Chat route error:', error);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      message: error.message 
    });
  }
});

/**
 * POST /api/chat/stream
 * Stream chat responses for real-time UI
 */
router.post('/stream', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        error: 'Message is required' 
      });
    }
    
    // Set headers for SSE (Server-Sent Events)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    await chatService.streamResponse(message, history, (chunk) => {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    });
    
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Stream error:', error);
    res.status(500).json({ error: 'Streaming failed' });
  }
});

/**
 * POST /api/chat/enrich-mediator
 * Scrape and enrich mediator data from web sources
 */
router.post('/enrich-mediator', async (req, res) => {
  try {
    const { mediatorName, urls } = req.body;

    if (!mediatorName) {
      return res.status(400).json({
        error: 'mediatorName is required'
      });
    }

    // Build search URLs if not provided
    const searchUrls = urls || llamaClient.buildSearchUrls(mediatorName);

    // Scrape profile from primary sources
    const profilePromises = [
      llamaClient.scrapeMediatorProfile(searchUrls.martindale, mediatorName).catch(() => null),
      llamaClient.scrapeMediatorProfile(searchUrls.avvo, mediatorName).catch(() => null)
    ];

    const profiles = await Promise.all(profilePromises);
    const validProfiles = profiles.filter(p => p && p.success);

    res.json({
      success: true,
      mediatorName,
      enrichedData: validProfiles.map(p => p.data),
      sourcesScraped: Object.keys(searchUrls).length,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Enrich mediator error:', error);
    res.status(500).json({
      error: 'Failed to enrich mediator data',
      message: error.message
    });
  }
});

/**
 * POST /api/chat/check-conflicts
 * Deep conflict check using web scraping
 */
router.post('/check-conflicts', async (req, res) => {
  try {
    const { mediatorId, parties } = req.body;

    if (!mediatorId || !parties || parties.length === 0) {
      return res.status(400).json({
        error: 'mediatorId and parties array are required'
      });
    }

    // Use llama affiliation detector with scraping
    const result = await affiliationDetector.detectConflicts(mediatorId, parties);

    res.json({
      success: true,
      ...result,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Check conflicts error:', error);
    res.status(500).json({
      error: 'Failed to check conflicts',
      message: error.message
    });
  }
});

/**
 * POST /api/chat/analyze-ideology
 * Analyze mediator ideology using web scraping
 */
router.post('/analyze-ideology', async (req, res) => {
  try {
    const { mediatorId } = req.body;

    if (!mediatorId) {
      return res.status(400).json({
        error: 'mediatorId is required'
      });
    }

    // Use llama ideology classifier with scraping
    const result = await ideologyClassifier.classifyMediator(mediatorId);

    res.json({
      success: true,
      ...result,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Analyze ideology error:', error);
    res.status(500).json({
      error: 'Failed to analyze ideology',
      message: error.message
    });
  }
});

/**
 * GET /api/chat/scraper-health
 * Check health of the Python scraper service
 */
router.get('/scraper-health', async (_req, res) => {
  try {
    const health = await llamaClient.healthCheck();
    res.json({
      success: true,
      ...health,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

/**
 * POST /api/chat/bulk-scrape
 * Scrape multiple URLs for mediator information
 */
router.post('/bulk-scrape', async (req, res) => {
  try {
    const { urls, query } = req.body;

    if (!urls || urls.length === 0 || !query) {
      return res.status(400).json({
        error: 'urls array and query are required'
      });
    }

    const result = await llamaClient.scrapeBulk(urls, query);

    res.json({
      success: true,
      ...result,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Bulk scrape error:', error);
    res.status(500).json({
      error: 'Failed to bulk scrape',
      message: error.message
    });
  }
});

module.exports = router;
