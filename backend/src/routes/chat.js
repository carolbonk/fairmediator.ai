/**
 * Chat Routes
 * Handles natural language chat interactions for mediator search with authentication
 * Now using FREE Hugging Face models!
 *
 * DRY: Reuses auth middleware and usage tracking patterns
 */

const express = require('express');
const router = express.Router();
const chatService = require('../services/huggingface/chatService');
const UsageLog = require('../models/UsageLog');
const { authenticate, checkUsageLimit } = require('../middleware/auth');

/**
 * POST /api/chat
 * Process a user chat message and return mediator recommendations
 * DRY: Reuses authentication and usage tracking middleware
 *
 * Free tier: 20 AI calls/day
 * Premium: Unlimited
 */
router.post('/', authenticate, checkUsageLimit('aiCall'), async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Message is required and must be a string'
      });
    }

    // Process chat with AI
    const result = await chatService.processQuery(message, history);

    // Increment AI call counter
    await req.user.incrementAICall();

    // Log usage for analytics
    await UsageLog.create({
      user: req.user._id,
      eventType: 'ai_call',
      metadata: {
        messageLength: message.length,
        historyLength: history.length,
        model: result.model,
        responseLength: result.message?.length || 0
      }
    });

    res.json({
      success: true,
      ...result,
      usage: {
        aiCallsToday: req.user.usageStats.aiCallsToday,
        aiCallLimit: req.user.subscriptionTier === 'premium' ? 'unlimited' : 20
      }
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
