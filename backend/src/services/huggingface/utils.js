/**
 * Shared Hugging Face Utilities
 */

const axios = require('axios');
const config = require('./config');
const { monitor } = require('../../utils/freeTierMonitor');

/**
 * Call Hugging Face API with retry logic
 */
async function callAPI(model, payload, retryCount = 0) {
  try {
    // Track HuggingFace API usage for free tier monitoring
    const allowed = monitor.track('huggingface');
    if (!allowed) {
      throw new Error('HuggingFace API daily limit reached. Try again tomorrow.');
    }

    // Use OpenAI-compatible chat completions API with new router
    const response = await axios.post(
      `${config.routerURL}/chat/completions`,
      {
        model: model,
        messages: payload.messages,
        max_tokens: payload.parameters?.max_new_tokens || config.defaults.maxTokens,
        temperature: payload.parameters?.temperature ?? config.defaults.temperature,
        top_p: payload.parameters?.top_p || config.defaults.topP,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: config.retry.timeout
      }
    );
    return response.data;
  } catch (error) {
    // Handle model loading (503)
    if (error.response?.status === 503 && retryCount < config.retry.maxRetries) {
      console.log(`${config.errors.modelLoading} (${retryCount + 1}/${config.retry.maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, config.retry.retryDelay));
      return callAPI(model, payload, retryCount + 1);
    }

    // Handle rate limiting (429)
    if (error.response?.status === 429) {
      throw new Error(config.errors.rateLimited);
    }

    // Log the actual error for debugging
    console.error('HF API Error:', error.response?.data || error.message);
    throw new Error(config.errors.requestFailed(error.response?.data?.error || error.message));
  }
}

/**
 * Format messages for HF models
 */
function formatMessages(messages) {
  if (!messages.length || messages[0].role !== 'system') {
    messages.unshift({ role: 'system', content: config.prompts.system });
  }
  
  return messages.map(msg => {
    const roleMap = { system: 'System', user: 'User', assistant: 'Assistant' };
    return `${roleMap[msg.role] || msg.role}: ${msg.content}`;
  }).join('\n\n') + '\n\nAssistant: ';
}

/**
 * Extract text from API response
 */
function extractText(result) {
  if (Array.isArray(result) && result.length > 0) {
    return result[0]?.generated_text || result[0]?.text || '';
  }
  if (result.generated_text) return result.generated_text;
  if (typeof result === 'string') return result;
  return '';
}

/**
 * Parse JSON from response (DRY)
 */
function parseJSON(text) {
  // Extract JSON from markdown code blocks
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
  if (jsonMatch) text = jsonMatch[1];
  
  try {
    return JSON.parse(text.trim());
  } catch {
    return null;
  }
}

/**
 * Create standard payload (DRY)
 */
function createPayload(input, options = {}) {
  return {
    inputs: input,
    parameters: {
      max_new_tokens: options.maxTokens || config.defaults.maxTokens,
      temperature: options.temperature ?? config.defaults.temperature,
      top_p: config.defaults.topP,
      repetition_penalty: config.defaults.repetitionPenalty,
      return_full_text: false
    },
    options: {
      wait_for_model: true,
      use_cache: false
    }
  };
}

/**
 * Validate API key (DRY)
 */
function validateApiKey() {
  if (!process.env.HUGGINGFACE_API_KEY) {
    throw new Error(config.errors.noApiKey);
  }
}

module.exports = {
  callAPI,
  formatMessages,
  extractText,
  parseJSON,
  createPayload,
  validateApiKey,
  config
};
