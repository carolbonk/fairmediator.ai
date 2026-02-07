/**
 * Case Intake Form Component
 * Structured form for collecting case details with settlement prediction
 *
 * WCAG Compliance:
 * - Color contrast ≥ 4.5:1
 * - Keyboard navigable
 * - Form labels and error messages
 * - Touch targets ≥ 44x44pt
 */

import React, { useState } from 'react';
import { FaPlus, FaTimes, FaSearch, FaFileAlt } from 'react-icons/fa';
import SettlementPredictor from './SettlementPredictor';

const CASE_TYPES = [
  'Family Law',
  'Employment Dispute',
  'Business/Contract',
  'Personal Injury',
  'Real Estate',
  'Intellectual Property',
  'Consumer Dispute',
  'Partnership Dissolution',
  'Insurance Claim',
  'Construction Dispute',
  'Probate/Estate',
  'Landlord-Tenant',
  'Other'
];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const CaseIntakeForm = ({ onSubmit, onSearchMediators, className = '' }) => {
  const [formData, setFormData] = useState({
    caseType: '',
    disputeValue: '',
    jurisdiction: '',
    description: '',
    parties: ['', ''],
    confidential: false
  });

  const [showPrediction, setShowPrediction] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [errors, setErrors] = useState({});

  // Handle input changes
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle party name changes
  const handlePartyChange = (index, value) => {
    const newParties = [...formData.parties];
    newParties[index] = value;
    setFormData(prev => ({
      ...prev,
      parties: newParties
    }));
  };

  // Add new party
  const addParty = () => {
    setFormData(prev => ({
      ...prev,
      parties: [...prev.parties, '']
    }));
  };

  // Remove party
  const removeParty = (index) => {
    if (formData.parties.length <= 2) return; // Minimum 2 parties
    const newParties = formData.parties.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      parties: newParties
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.caseType) {
      newErrors.caseType = 'Case type is required';
    }

    if (!formData.disputeValue || parseFloat(formData.disputeValue) <= 0) {
      newErrors.disputeValue = 'Valid dispute value is required';
    }

    if (!formData.jurisdiction) {
      newErrors.jurisdiction = 'Jurisdiction is required';
    }

    const validParties = formData.parties.filter(p => p.trim());
    if (validParties.length < 2) {
      newErrors.parties = 'At least 2 parties are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const validParties = formData.parties.filter(p => p.trim());
    const submissionData = {
      ...formData,
      parties: validParties,
      prediction: prediction
    };

    if (onSubmit) {
      onSubmit(submissionData);
    }
  };

  // Handle search mediators
  const handleSearchMediators = () => {
    if (!validateForm()) {
      return;
    }

    const validParties = formData.parties.filter(p => p.trim());
    const searchData = {
      ...formData,
      parties: validParties,
      prediction: prediction
    };

    if (onSearchMediators) {
      onSearchMediators(searchData);
    }
  };

  return (
    <div className={`bg-neu-200 rounded-xl p-6 shadow-neu ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <FaFileAlt className="text-2xl text-blue-500" aria-hidden="true" />
        <div>
          <h2 className="text-lg font-bold text-neu-800">Case Intake Form</h2>
          <p className="text-xs text-neu-600">
            Provide case details for settlement prediction and mediator matching
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Case Type */}
        <div>
          <label htmlFor="caseType" className="block text-sm font-semibold text-neu-800 mb-2">
            Case Type <span className="text-red-500">*</span>
          </label>
          <select
            id="caseType"
            value={formData.caseType}
            onChange={(e) => handleChange('caseType', e.target.value)}
            className={`w-full px-4 py-3 bg-neu-100 border ${
              errors.caseType ? 'border-red-500' : 'border-neu-300'
            } rounded-lg text-neu-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-neu-inset min-h-[44px]`}
            aria-invalid={errors.caseType ? 'true' : 'false'}
            aria-describedby={errors.caseType ? 'caseType-error' : undefined}
          >
            <option value="">Select case type...</option>
            {CASE_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {errors.caseType && (
            <p id="caseType-error" className="text-xs text-red-600 mt-1" role="alert">
              {errors.caseType}
            </p>
          )}
        </div>

        {/* Dispute Value */}
        <div>
          <label htmlFor="disputeValue" className="block text-sm font-semibold text-neu-800 mb-2">
            Dispute Value (USD) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neu-600 font-semibold">
              $
            </span>
            <input
              id="disputeValue"
              type="number"
              min="0"
              step="0.01"
              value={formData.disputeValue}
              onChange={(e) => handleChange('disputeValue', e.target.value)}
              placeholder="e.g., 50000"
              className={`w-full pl-8 pr-4 py-3 bg-neu-100 border ${
                errors.disputeValue ? 'border-red-500' : 'border-neu-300'
              } rounded-lg text-neu-800 placeholder-neu-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-neu-inset min-h-[44px]`}
              aria-invalid={errors.disputeValue ? 'true' : 'false'}
              aria-describedby={errors.disputeValue ? 'disputeValue-error' : undefined}
            />
          </div>
          {errors.disputeValue && (
            <p id="disputeValue-error" className="text-xs text-red-600 mt-1" role="alert">
              {errors.disputeValue}
            </p>
          )}
        </div>

        {/* Jurisdiction */}
        <div>
          <label htmlFor="jurisdiction" className="block text-sm font-semibold text-neu-800 mb-2">
            Jurisdiction (State) <span className="text-red-500">*</span>
          </label>
          <select
            id="jurisdiction"
            value={formData.jurisdiction}
            onChange={(e) => handleChange('jurisdiction', e.target.value)}
            className={`w-full px-4 py-3 bg-neu-100 border ${
              errors.jurisdiction ? 'border-red-500' : 'border-neu-300'
            } rounded-lg text-neu-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-neu-inset min-h-[44px]`}
            aria-invalid={errors.jurisdiction ? 'true' : 'false'}
            aria-describedby={errors.jurisdiction ? 'jurisdiction-error' : undefined}
          >
            <option value="">Select state...</option>
            {US_STATES.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
          {errors.jurisdiction && (
            <p id="jurisdiction-error" className="text-xs text-red-600 mt-1" role="alert">
              {errors.jurisdiction}
            </p>
          )}
        </div>

        {/* Parties */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-neu-800">
              Parties Involved <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={addParty}
              className="flex items-center gap-1 px-3 py-1.5 bg-neu-200 text-neu-700 rounded-lg text-xs font-medium shadow-neu hover:shadow-neu-lg active:shadow-neu-inset transition-all duration-200"
              aria-label="Add another party"
            >
              <FaPlus className="text-xs" />
              <span>Add Party</span>
            </button>
          </div>
          <div className="space-y-2">
            {formData.parties.map((party, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={party}
                  onChange={(e) => handlePartyChange(index, e.target.value)}
                  placeholder={`Party ${index + 1} name`}
                  className="flex-1 px-4 py-3 bg-neu-100 border border-neu-300 rounded-lg text-neu-800 placeholder-neu-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-neu-inset min-h-[44px]"
                  aria-label={`Party ${index + 1} name`}
                />
                {formData.parties.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeParty(index)}
                    className="flex-shrink-0 w-11 h-11 flex items-center justify-center bg-neu-200 text-red-500 rounded-lg shadow-neu hover:shadow-neu-lg active:shadow-neu-inset transition-all duration-200"
                    aria-label={`Remove party ${index + 1}`}
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            ))}
          </div>
          {errors.parties && (
            <p className="text-xs text-red-600 mt-1" role="alert">
              {errors.parties}
            </p>
          )}
        </div>

        {/* Case Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-neu-800 mb-2">
            Case Description (Optional)
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Provide a brief description of the case..."
            rows={4}
            className="w-full px-4 py-3 bg-neu-100 border border-neu-300 rounded-lg text-neu-800 placeholder-neu-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-neu-inset resize-none"
          />
        </div>

        {/* Confidential Checkbox */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="confidential"
            checked={formData.confidential}
            onChange={(e) => handleChange('confidential', e.target.checked)}
            className="w-5 h-5 rounded border-neu-300 text-blue-500 focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="confidential" className="text-sm text-neu-700">
            This case contains confidential information
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-neu-300">
          <button
            type="button"
            onClick={() => {
              if (validateForm()) {
                setShowPrediction(true);
              }
            }}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold shadow-neu hover:shadow-neu-lg active:shadow-neu-inset transition-all duration-200 min-h-[44px]"
          >
            Get Settlement Prediction
          </button>
          <button
            type="button"
            onClick={handleSearchMediators}
            className="flex-1 px-4 py-3 bg-neu-200 text-neu-800 rounded-xl font-semibold shadow-neu hover:shadow-neu-lg active:shadow-neu-inset transition-all duration-200 flex items-center justify-center gap-2 min-h-[44px]"
          >
            <FaSearch />
            <span>Search Mediators</span>
          </button>
        </div>
      </form>

      {/* Settlement Prediction */}
      {showPrediction && formData.caseType && formData.disputeValue && formData.jurisdiction && (
        <div className="mt-6 pt-6 border-t border-neu-300">
          <SettlementPredictor
            caseType={formData.caseType}
            disputeValue={formData.disputeValue}
            jurisdiction={formData.jurisdiction}
            parties={formData.parties.filter(p => p.trim())}
            autoPredict={true}
            onPredictionComplete={(pred) => setPrediction(pred)}
          />
        </div>
      )}
    </div>
  );
};

export default CaseIntakeForm;
export { CaseIntakeForm };
