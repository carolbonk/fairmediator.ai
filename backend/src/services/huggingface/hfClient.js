/**
 * Hugging Face Client
 */

const { callAPI, validateApiKey, config } = require('./utils');

class HuggingFaceClient {
  constructor() {
    validateApiKey();
    this.model = config.models.primary;
  }

  async chat(messages, options = {}) {
    const payload = {
      messages: messages,
      parameters: {
        max_new_tokens: options.maxTokens || config.defaults.maxTokens,
        temperature: options.temperature ?? config.defaults.temperature,
        top_p: config.defaults.topP
      }
    };

    const result = await callAPI(this.model, payload);

    // Extract content from OpenAI-compatible response format
    const content = result.choices?.[0]?.message?.content || '';

    return {
      content: content.trim(),
      role: 'assistant',
      model: this.model,
      usage: result.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };
  }

  async extractStructured(prompt, text = '') {
    const messages = [
      { role: 'system', content: config.prompts.dataExtraction },
      { role: 'user', content: text ? `${prompt}\n\nText: ${text}` : prompt }
    ];
    
    const response = await this.chat(messages, { temperature: 0.3, maxTokens: 1024 });
    const { parseJSON } = require('./utils');
    return parseJSON(response.content) || {};
  }

  async healthCheck() {
    try {
      await this.chat([{ role: 'user', content: 'Hello' }], { maxTokens: 10 });
      return { status: 'ok', message: 'Hugging Face API working', model: this.model };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  /**
   * Feature extraction for embeddings
   * @param {string} text - Text to generate embeddings for
   * @param {string} model - Model to use (default: sentence-transformers/all-MiniLM-L6-v2)
   */
  async featureExtraction(text, model = 'sentence-transformers/all-MiniLM-L6-v2') {
    const axios = require('axios');

    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${model}`,
        { inputs: text },
        {
          headers: {
            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      // Response is an embedding vector (array of numbers)
      return response.data;
    } catch (error) {
      console.error('Feature extraction error:', error.response?.data || error.message);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }
}

module.exports = new HuggingFaceClient();
