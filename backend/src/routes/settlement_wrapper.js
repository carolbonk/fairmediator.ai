/**
 * Settlement Prediction Wrapper Routes
 *
 * Simplified settlement prediction for general mediation cases
 * Maps general case types to FCA-specific model
 *
 * @module routes/settlement_wrapper
 */

const express = require('express');
const router = express.Router();
const logger = require('../config/logger');
const { authenticate } = require('../middleware/auth');

// Case type mappings to FCA fraud types
const CASE_TO_FRAUD_MAPPING = {
  'Family Law': 'other',
  'Employment Dispute': 'labor',
  'Business/Contract': 'procurement',
  'Personal Injury': 'healthcare',
  'Real Estate': 'other',
  'Intellectual Property': 'other',
  'Consumer Dispute': 'consumer',
  'Partnership Dissolution': 'procurement',
  'Insurance Claim': 'healthcare',
  'Construction Dispute': 'procurement',
  'Probate/Estate': 'other',
  'Landlord-Tenant': 'other',
  'Other': 'other'
};

// Industry mappings
const CASE_TO_INDUSTRY_MAPPING = {
  'Family Law': 'legal',
  'Employment Dispute': 'business',
  'Business/Contract': 'business',
  'Personal Injury': 'healthcare',
  'Real Estate': 'real_estate',
  'Intellectual Property': 'technology',
  'Consumer Dispute': 'retail',
  'Partnership Dissolution': 'business',
  'Insurance Claim': 'insurance',
  'Construction Dispute': 'construction',
  'Probate/Estate': 'legal',
  'Landlord-Tenant': 'real_estate',
  'Other': 'other'
};

/**
 * POST /api/settlement/predict
 * Predict settlement for general mediation cases
 *
 * Body: {
 *   caseType: string,
 *   disputeValue: number,
 *   jurisdiction: string,
 *   numParties: number,
 *   ... other factors
 * }
 */
router.post('/predict', authenticate, async (req, res) => {
  try {
    const {
      caseType,
      disputeValue,
      jurisdiction,
      numParties = 2,
      ...additionalFactors
    } = req.body;

    // Validate required fields
    if (!caseType || !disputeValue) {
      return res.status(400).json({
        success: false,
        error: 'caseType and disputeValue are required'
      });
    }

    // Simple rule-based prediction (placeholder for ML model)
    const baseSettlement = parseFloat(disputeValue);

    // Apply modifiers based on case type
    let settlementMultiplier = 0.5; // Default 50% of dispute value

    switch (caseType) {
      case 'Family Law':
        settlementMultiplier = 0.45; // Family cases settle lower
        break;
      case 'Employment Dispute':
        settlementMultiplier = 0.6; // Employment cases settle higher
        break;
      case 'Business/Contract':
        settlementMultiplier = 0.55;
        break;
      case 'Personal Injury':
        settlementMultiplier = 0.65; // PI cases settle higher
        break;
      default:
        settlementMultiplier = 0.5;
    }

    // Adjust for jurisdiction (some states settle higher)
    const highSettlementStates = ['CA', 'NY', 'MA', 'IL'];
    if (highSettlementStates.includes(jurisdiction)) {
      settlementMultiplier += 0.05;
    }

    // Adjust for number of parties (more parties = lower settlement)
    if (numParties > 2) {
      settlementMultiplier -= 0.02 * (numParties - 2);
    }

    const predictedAmount = Math.round(baseSettlement * settlementMultiplier);
    const lowerBound = Math.round(predictedAmount * 0.85);
    const upperBound = Math.round(predictedAmount * 1.15);

    // Settlement likelihood (higher for lower amounts)
    const settlementLikelihood = Math.min(0.95, 0.6 + (baseSettlement < 100000 ? 0.2 : 0) - (numParties > 2 ? 0.1 : 0));

    // Model confidence
    const modelConfidence = 0.75; // Placeholder for actual ML model confidence

    // Key factors
    const keyFactors = [
      `Case type: ${caseType}`,
      `Dispute value: $${baseSettlement.toLocaleString()}`,
      `Jurisdiction: ${jurisdiction || 'Not specified'}`,
      `Number of parties: ${numParties}`,
      `Historical settlement rate: ${(settlementMultiplier * 100).toFixed(0)}%`
    ];

    res.json({
      predictedAmount,
      confidenceInterval: {
        lower: lowerBound,
        upper: upperBound
      },
      settlementLikelihood,
      modelConfidence,
      keyFactors,
      metadata: {
        caseType,
        disputeValue: baseSettlement,
        jurisdiction,
        settlementMultiplier
      }
    });

  } catch (error) {
    logger.error('[SettlementWrapper] Prediction error:', error);
    res.status(500).json({
      success: false,
      error: 'Prediction failed',
      message: error.message
    });
  }
});

module.exports = router;
