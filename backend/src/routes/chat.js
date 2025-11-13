/**
 * Chat Routes
 * Handles natural language chat interactions for mediator search
 * Now using FREE Hugging Face models!
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

module.exports = router;
