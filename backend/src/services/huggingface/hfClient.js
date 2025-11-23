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
}

module.exports = new HuggingFaceClient();
