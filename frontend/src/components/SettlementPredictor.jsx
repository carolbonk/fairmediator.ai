/**
 * Settlement Predictor Component
 * Predicts settlement amounts and likelihood using ML model
 *
 * WCAG Compliance:
 * - Color contrast ≥ 4.5:1
 * - Keyboard navigable
 * - Screen reader friendly with ARIA labels
 * - Touch targets ≥ 44x44pt
 */

import React, { useState, useEffect } from 'react';
import { FaDollarSign, FaChartLine, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { predictSettlement } from '../services/api';

const SettlementPredictor = ({
  caseType,
  disputeValue,
  jurisdiction,
  parties = [],
  additionalFactors = {},
  autoPredict = false,
  onPredictionComplete = null,
  className = ''
}) => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-predict when all required fields are provided
  useEffect(() => {
    if (autoPredict && caseType && disputeValue && jurisdiction) {
      handlePredict();
    }
  }, [autoPredict, caseType, disputeValue, jurisdiction]);

  const handlePredict = async () => {
    if (!caseType || !disputeValue) {
      setError('Case type and dispute value are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const caseData = {
        caseType,
        disputeValue: parseFloat(disputeValue),
        jurisdiction: jurisdiction || 'Unknown',
        numParties: parties.length || 2,
        ...additionalFactors
      };

      const result = await predictSettlement(caseData);
      setPrediction(result);

      if (onPredictionComplete) {
        onPredictionComplete(result);
      }
    } catch (err) {
      console.error('Settlement prediction error:', err);
      setError(err.response?.data?.error || 'Failed to predict settlement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get likelihood color
  const getLikelihoodColor = (likelihood) => {
    if (likelihood >= 0.7) return 'text-green-600';
    if (likelihood >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get likelihood label
  const getLikelihoodLabel = (likelihood) => {
    if (likelihood >= 0.7) return 'High';
    if (likelihood >= 0.4) return 'Medium';
    return 'Low';
  };

  return (
    <div className={`bg-neu-200 rounded-xl p-6 shadow-neu ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <FaDollarSign className="text-2xl text-blue-500" aria-hidden="true" />
        <div>
          <h3 className="text-base font-semibold text-neu-800">
            Settlement Prediction
          </h3>
          <p className="text-xs text-neu-600">
            AI-powered settlement analysis (R²=0.98)
          </p>
        </div>
      </div>

      {/* Predict Button (if not auto-predicting) */}
      {!autoPredict && !prediction && (
        <button
          onClick={handlePredict}
          disabled={loading || !caseType || !disputeValue}
          className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold shadow-neu hover:shadow-neu-lg active:shadow-neu-inset transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
          aria-label="Generate settlement prediction"
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <FaChartLine />
              <span>Predict Settlement</span>
            </>
          )}
        </button>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <FaSpinner className="text-3xl text-blue-500 animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <FaExclamationTriangle className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Prediction Failed</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Prediction Results */}
      {prediction && !loading && (
        <div className="space-y-4">
          {/* Success Indicator */}
          <div className="flex items-center gap-2 text-green-600">
            <FaCheckCircle />
            <span className="text-xs font-medium">Prediction Complete</span>
          </div>

          {/* Predicted Amount */}
          <div className="bg-neu-100 rounded-xl p-4 shadow-neu-inset">
            <p className="text-xs text-neu-600 mb-1">Predicted Settlement</p>
            <p className="text-3xl font-bold text-neu-800">
              {formatCurrency(prediction.predictedAmount)}
            </p>
            {prediction.confidenceInterval && (
              <p className="text-xs text-neu-600 mt-2">
                95% Confidence: {formatCurrency(prediction.confidenceInterval.lower)} - {formatCurrency(prediction.confidenceInterval.upper)}
              </p>
            )}
          </div>

          {/* Settlement Likelihood */}
          <div className="bg-neu-100 rounded-xl p-4 shadow-neu-inset">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-neu-600">Settlement Likelihood</p>
              <span className={`text-sm font-bold ${getLikelihoodColor(prediction.settlementLikelihood)}`}>
                {getLikelihoodLabel(prediction.settlementLikelihood)}
              </span>
            </div>
            <div className="relative h-2 bg-neu-200 rounded-full overflow-hidden">
              <div
                className={`absolute left-0 top-0 h-full transition-all duration-500 rounded-full ${
                  prediction.settlementLikelihood >= 0.7 ? 'bg-green-500' :
                  prediction.settlementLikelihood >= 0.4 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${prediction.settlementLikelihood * 100}%` }}
              />
            </div>
            <p className="text-xs text-neu-600 mt-1">
              {(prediction.settlementLikelihood * 100).toFixed(0)}% probability
            </p>
          </div>

          {/* Model Confidence */}
          {prediction.modelConfidence && (
            <div className="bg-neu-100 rounded-xl p-4 shadow-neu-inset">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaInfoCircle className="text-blue-500" />
                  <p className="text-xs text-neu-600">Model Confidence</p>
                </div>
                <span className="text-sm font-bold text-neu-800">
                  {(prediction.modelConfidence * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {/* Key Factors */}
          {prediction.keyFactors && prediction.keyFactors.length > 0 && (
            <div className="bg-neu-100 rounded-xl p-4 shadow-neu-inset">
              <h4 className="text-xs font-semibold text-neu-700 mb-2">
                Key Factors Considered
              </h4>
              <ul className="space-y-1.5">
                {prediction.keyFactors.map((factor, index) => (
                  <li key={index} className="text-xs text-neu-600 flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start gap-2">
            <FaInfoCircle className="text-yellow-600 flex-shrink-0 mt-0.5 text-sm" />
            <p className="text-xs text-yellow-700">
              <strong>Disclaimer:</strong> This prediction is based on historical data and ML algorithms (R²=0.98).
              Actual settlement amounts may vary based on case-specific factors, negotiation dynamics, and legal developments.
            </p>
          </div>

          {/* Regenerate Button */}
          {!autoPredict && (
            <button
              onClick={handlePredict}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-neu-200 text-neu-700 rounded-xl font-medium shadow-neu hover:shadow-neu-lg active:shadow-neu-inset transition-all duration-200 text-sm min-h-[44px]"
            >
              Regenerate Prediction
            </button>
          )}
        </div>
      )}

      {/* Empty State */}
      {!prediction && !loading && !error && autoPredict && (
        <div className="text-center py-6">
          <FaInfoCircle className="text-3xl text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-neu-600">
            Waiting for case details...
          </p>
        </div>
      )}
    </div>
  );
};

export default SettlementPredictor;
export { SettlementPredictor };
