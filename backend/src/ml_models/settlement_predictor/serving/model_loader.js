/**
 * Model Loader - Node.js wrapper for Python ML model
 *
 * Provides Node.js API for calling Python-based settlement predictor.
 * Uses child_process to invoke Python FastAPI service.
 *
 * @module ml_models/settlement_predictor/serving/model_loader
 */

const axios = require('axios');
const { spawn } = require('child_process');
const logger = require('../../../utils/logger');

const PREDICTOR_API_URL = process.env.PREDICTOR_API_URL || 'http://localhost:8001';

class SettlementPredictorClient {
  constructor() {
    this.apiUrl = PREDICTOR_API_URL;
    this.pythonProcess = null;
    this.isReady = false;
  }

  /**
   * Start Python FastAPI server
   * Only needed if running Python service locally
   */
  async startPythonService() {
    if (this.pythonProcess) {
      logger.info('[SettlementPredictor] Python service already running');
      return;
    }

    logger.info('[SettlementPredictor] Starting Python prediction service...');

    const scriptPath = __dirname + '/predict_api.py';

    this.pythonProcess = spawn('python3', [scriptPath]);

    this.pythonProcess.stdout.on('data', (data) => {
      logger.info(`[SettlementPredictor] ${data.toString().trim()}`);

      if (data.toString().includes('Uvicorn running')) {
        this.isReady = true;
      }
    });

    this.pythonProcess.stderr.on('data', (data) => {
      logger.error(`[SettlementPredictor] ${data.toString().trim()}`);
    });

    this.pythonProcess.on('close', (code) => {
      logger.info(`[SettlementPredictor] Python service exited with code ${code}`);
      this.isReady = false;
      this.pythonProcess = null;
    });

    // Wait for service to be ready
    await this.waitForReady();
  }

  /**
   * Wait for Python service to be ready
   */
  async waitForReady(timeout = 30000) {
    const startTime = Date.now();

    while (!this.isReady && (Date.now() - startTime) < timeout) {
      try {
        const response = await axios.get(`${this.apiUrl}/`, { timeout: 1000 });
        if (response.data.model_loaded) {
          this.isReady = true;
          logger.info('[SettlementPredictor] Service ready');
          return;
        }
      } catch {
        // Service not ready yet
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!this.isReady) {
      throw new Error('Python service failed to start within timeout');
    }
  }

  /**
   * Check if service is healthy
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${this.apiUrl}/`, { timeout: 5000 });
      return response.data;
    } catch (error) {
      logger.error('[SettlementPredictor] Health check failed:', error.message);
      return {
        status: 'unhealthy',
        model_loaded: false,
        error: error.message
      };
    }
  }

  /**
   * Predict settlement range
   *
   * @param {Object} params - Prediction parameters
   * @returns {Promise<Object>} Prediction result
   */
  async predict(params) {
    const {
      fraudType,
      damagesClaimed,
      industry,
      jurisdiction,
      whistleblowerPresent = false,
      settlementYear = 2024
    } = params;

    // Validate inputs
    if (!fraudType || !damagesClaimed || !industry || !jurisdiction) {
      throw new Error('Missing required parameters: fraudType, damagesClaimed, industry, jurisdiction');
    }

    if (damagesClaimed <= 0) {
      throw new Error('damagesClaimed must be greater than 0');
    }

    const requestBody = {
      fraud_type: fraudType,
      damages_claimed: damagesClaimed,
      industry,
      jurisdiction,
      whistleblower_present: whistleblowerPresent,
      settlement_year: settlementYear
    };

    try {
      const response = await axios.post(`${this.apiUrl}/predict`, requestBody, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      logger.info(`[SettlementPredictor] Prediction: $${damagesClaimed.toLocaleString()} → $${response.data.predicted_mid.toLocaleString()}`);

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      logger.error('[SettlementPredictor] Prediction failed:', error.message);

      if (error.response) {
        return {
          success: false,
          error: error.response.data.detail || 'Prediction failed',
          status: error.response.status
        };
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Batch predict multiple cases
   *
   * @param {Array} cases - Array of prediction parameters
   * @returns {Promise<Object>} Batch prediction results
   */
  async batchPredict(cases) {
    if (!Array.isArray(cases) || cases.length === 0) {
      throw new Error('cases must be a non-empty array');
    }

    if (cases.length > 100) {
      throw new Error('Batch size limited to 100 predictions');
    }

    const requestBodies = cases.map(params => ({
      fraud_type: params.fraudType,
      damages_claimed: params.damagesClaimed,
      industry: params.industry,
      jurisdiction: params.jurisdiction,
      whistleblower_present: params.whistleblowerPresent || false,
      settlement_year: params.settlementYear || 2024
    }));

    try {
      const response = await axios.post(`${this.apiUrl}/batch-predict`, requestBodies, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      logger.error('[SettlementPredictor] Batch prediction failed:', error.message);

      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }

  /**
   * Get model information
   *
   * @returns {Promise<Object>} Model metadata
   */
  async getModelInfo() {
    try {
      const response = await axios.get(`${this.apiUrl}/model/info`, { timeout: 5000 });

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      logger.error('[SettlementPredictor] Failed to get model info:', error.message);

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Stop Python service
   */
  async stopPythonService() {
    if (this.pythonProcess) {
      logger.info('[SettlementPredictor] Stopping Python service...');
      this.pythonProcess.kill();
      this.pythonProcess = null;
      this.isReady = false;
    }
  }
}

// Singleton instance
const predictorClient = new SettlementPredictorClient();

module.exports = predictorClient;
