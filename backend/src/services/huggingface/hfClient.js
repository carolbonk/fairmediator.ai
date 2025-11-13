/**
 * Hugging Face Client (DRY - Refactored)
 * Single, clean client using shared utilities
 */

const { callAPI, formatMessages, extractText, createPayload, validateApiKey, config } = require('./utils');

class HuggingFaceClient {
  constructor() {
    validateApiKey();
    this.model = config.models.primary;
  }

  async chat(messages, options = {}) {
    const prompt = formatMessages(messages);
    const payload = createPayload(prompt, options);
    const result = await callAPI(this.model, payload);
    const content = extractText(result).trim();

    return {
      content,
      role: 'assistant',
      model: this.model,
      usage: {
        prompt_tokens: Math.floor(prompt.length / 4),
        completion_tokens: Math.floor(content.length / 4),
        total_tokens: Math.floor((prompt.length + content.length) / 4)
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
