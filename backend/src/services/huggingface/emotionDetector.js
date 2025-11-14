/**
 * Emotion Detection Service
 * Uses HuggingFace emotion classification models (100% FREE)
 * DRY: Reuses hfClient and utils patterns
 */

const { callAPI, createPayload, config } = require('./utils');

class EmotionDetector {
  constructor() {
    // Free emotion detection models
    this.model = 'j-hartmann/emotion-english-distilroberta-base';
    // Alternative: 'bhadresh-savani/distilbert-base-uncased-emotion'
  }

  /**
   * Detect emotion from text
   * Returns emotion label and confidence scores
   */
  async detectEmotion(text) {
    try {
      if (!text || text.trim().length === 0) {
        return { emotion: 'neutral', confidence: 1.0, scores: [] };
      }

      // Call HuggingFace emotion classification API
      const payload = {
        inputs: text.substring(0, 512), // Limit text length
        options: {
          wait_for_model: true,
          use_cache: true
        }
      };

      const result = await callAPI(this.model, payload);

      // Parse results (array of emotion scores)
      if (Array.isArray(result) && result.length > 0) {
        const emotions = result[0];
        
        // Sort by score descending
        const sorted = emotions.sort((a, b) => b.score - a.score);
        
        return {
          emotion: sorted[0].label,
          confidence: sorted[0].score,
          scores: sorted.slice(0, 3).map(e => ({
            emotion: e.label,
            confidence: e.score
          }))
        };
      }

      // Fallback
      return { emotion: 'neutral', confidence: 0.5, scores: [] };
    } catch (error) {
      console.error('Emotion detection error:', error.message);
      // Return neutral on error (non-blocking)
      return { emotion: 'neutral', confidence: 0.0, scores: [], error: error.message };
    }
  }

  /**
   * Detect emotion and categorize as positive, negative, or neutral
   * Useful for UI indicators
   */
  async detectSentiment(text) {
    const result = await this.detectEmotion(text);
    
    const positiveEmotions = ['joy', 'love', 'surprise'];
    const negativeEmotions = ['anger', 'disgust', 'fear', 'sadness'];
    
    let sentiment = 'neutral';
    if (positiveEmotions.includes(result.emotion)) {
      sentiment = 'positive';
    } else if (negativeEmotions.includes(result.emotion)) {
      sentiment = 'negative';
    }
    
    return {
      ...result,
      sentiment,
      color: sentiment === 'positive' ? 'green' : sentiment === 'negative' ? 'red' : 'gray'
    };
  }

  /**
   * Batch emotion detection for multiple messages
   * DRY: Reuses single detectEmotion function
   */
  async detectBatch(messages) {
    return Promise.all(
      messages.map(msg => this.detectEmotion(msg))
    );
  }
}

module.exports = new EmotionDetector();
