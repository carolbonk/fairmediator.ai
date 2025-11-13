/**
 * Shared Hugging Face Utilities (DRY)
 * Common functions used across all HF services
 */

const axios = require('axios');
const config = require('./config');

/**
 * Call Hugging Face API with retry logic (DRY)
 */
async function callAPI(model, payload, retryCount = 0) {
  try {
    const response = await axios.post(
      `${config.baseURL}/${model}`,
      payload,
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
    
    throw new Error(config.errors.requestFailed(error.message));
  }
}

/**
 * Format messages for HF models (DRY)
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
 * Extract text from API response (DRY)
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
