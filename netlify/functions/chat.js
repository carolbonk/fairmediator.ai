/**
 * Netlify Serverless Function - Chat Endpoint
 * Proxies HuggingFace API calls securely (API key stays server-side)
 */

const axios = require('axios');

const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co';
const DEFAULT_MODEL = 'meta-llama/Meta-Llama-3-8B-Instruct';

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { message, history = [] } = JSON.parse(event.body);

    // Validate input
    if (!message || typeof message !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Message is required' })
      };
    }

    // Build messages array for HuggingFace
    const messages = [
      {
        role: 'system',
        content: 'You are FairMediator AI, helping users find the right mediator for their case. Be helpful, concise, and professional.'
      },
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message }
    ];

    // Call HuggingFace API
    const response = await axios.post(
      `${HUGGINGFACE_API_URL}/models/${DEFAULT_MODEL}/v1/chat/completions`,
      {
        messages,
        parameters: {
          max_new_tokens: 512,
          temperature: 0.7,
          top_p: 0.9
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const aiMessage = response.data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Configure this properly for production
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        message: aiMessage,
        model: DEFAULT_MODEL,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Chat function error:', error.response?.data || error.message);

    return {
      statusCode: error.response?.status || 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to process chat message',
        details: error.message
      })
    };
  }
};
