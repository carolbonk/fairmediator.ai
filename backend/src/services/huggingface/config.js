/**
 * Shared Hugging Face Configuration
 * DRY - Single source of truth for all HF settings
 */

module.exports = {
  // API Configuration
  baseURL: 'https://api-inference.huggingface.co/models',
  
  // Free Models (all 100% free)
  models: {
    primary: process.env.HF_MODEL_CHAT || 'meta-llama/Meta-Llama-3-8B-Instruct',
    alternatives: [
      'microsoft/DialoGPT-large',
      'facebook/blenderbot-400M-distill',
      'TinyLlama/TinyLlama-1.1B-Chat-v1.0'
    ]
  },
  
  // Default parameters
  defaults: {
    temperature: 0.7,
    maxTokens: 512,
    topP: 0.95,
    repetitionPenalty: 1.1
  },
  
  // Retry configuration
  retry: {
    maxRetries: 3,
    retryDelay: 2000,
    timeout: 30000
  },
  
  // System prompts (DRY)
  prompts: {
    system: 'You are a helpful AI assistant for FairMediator, a platform that helps users select mediators for legal disputes. You provide accurate, unbiased information about mediators and help identify potential conflicts of interest.',
    
    dataExtraction: 'You are a data extraction assistant. Always respond with valid JSON only, no additional text.',
    
    ideology: (text) => `Analyze the political ideology of this text. Classify as liberal, conservative, or neutral.

Provide JSON: {"ideology": "liberal|conservative|neutral", "score": 0-100, "reasoning": "brief explanation"}

Text: ${text}`,
    
    conflicts: (mediator, parties) => `Analyze for conflicts of interest:

Mediator: ${mediator.name}
Affiliations: ${mediator.affiliations?.join(', ') || 'None'}

Parties: ${parties.join(', ')}

Respond with JSON: {"hasConflict": boolean, "conflicts": [], "riskLevel": "low|medium|high", "recommendation": "text"}`
  },
  
  // Error messages
  errors: {
    noApiKey: 'HUGGINGFACE_API_KEY is required. Get FREE at: https://huggingface.co/settings/tokens',
    rateLimited: 'Rate limit exceeded. Please wait a moment and try again.',
    modelLoading: 'Model loading... Retrying...',
    requestFailed: (msg) => `Hugging Face API request failed: ${msg}`
  }
};
