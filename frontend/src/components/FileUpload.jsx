/**
 * FileUpload Component
 * Upload and analyze legal documents (PDF, Word, TXT)
 * Extracts case type, jurisdiction, opposing parties, sentiment
 */

import React, { useState, useRef } from 'react';
import { FaFileUpload, FaSpinner, FaCheckCircle, FaTimes } from 'react-icons/fa';
import Tooltip from './Tooltip';

const FileUpload = ({ onAnalysisComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const acceptedTypes = [
    'text/plain',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const handleFileSelect = async (file) => {
    if (!file) return;

    // Validate file type
    if (!acceptedTypes.includes(file.type)) {
      setError('Please upload a .txt, .pdf, or .docx file');
      return;
    }

    // Validate file size (1MB max)
    if (file.size > 1024 * 1024) {
      setError('File size exceeds 1MB limit');
      return;
    }

    setUploading(true);
    setError(null);
    setAnalysis(null);

    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await fetch('http://localhost:5001/api/analysis/document', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze document');
      }

      setAnalysis(data.analysis);
      if (onAnalysisComplete) {
        onAnalysisComplete(data.analysis);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const resetUpload = () => {
    setAnalysis(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      {/* Upload Area - Ultra Compact */}
      {!analysis && (
        <div
          className={`relative transition-all duration-200`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,.docx"
            onChange={handleChange}
            className="hidden"
            disabled={uploading}
          />

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="button-neu text-sm py-2.5 px-4 flex items-center gap-2 disabled:opacity-50 min-h-[44px]"
            >
              {uploading ? (
                <>
                  <FaSpinner className="animate-spin text-xs" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <FaFileUpload className="text-xs" />
                  <span>Upload Doc</span>
                </>
              )}
            </button>
            <span className="text-xs text-neu-500">.txt, .pdf, .docx</span>
            <Tooltip text="AI extraction of case details" />
          </div>

          {error && (
            <div className="mt-1.5 p-1.5 bg-red-50 rounded-lg shadow-neu-inset text-xs text-red-700 font-medium flex items-center gap-1.5">
              <FaTimes className="text-xs" />
              {error}
            </div>
          )}
        </div>
      )}

      {/* Analysis Results - Compact */}
      {analysis && (
        <div className="space-y-2 mt-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <FaCheckCircle className="text-green-500 text-xs" />
              <span className="text-xs font-semibold text-neu-700">Extracted</span>
            </div>
            <button
              onClick={resetUpload}
              className="text-xs text-neu-600 hover:text-neu-800 font-medium"
            >
              Clear
            </button>
          </div>

          <div className="space-y-1.5">
            {/* Case Type */}
            <div className="p-2 bg-neu-50 rounded-lg shadow-neu-inset">
              <div className="text-xs text-neu-600">Case Type</div>
              <div className="text-xs font-semibold text-neu-800 capitalize">
                {analysis.caseType?.replace(/_/g, ' ') || 'General'}
              </div>
            </div>

            {/* Jurisdiction */}
            {analysis.jurisdiction && (
              <div className="p-2 bg-neu-50 rounded-lg shadow-neu-inset">
                <div className="text-xs text-neu-600">Jurisdiction</div>
                <div className="text-xs font-semibold text-neu-800">
                  {analysis.jurisdiction.city && `${analysis.jurisdiction.city}, `}
                  {analysis.jurisdiction.state}
                </div>
              </div>
            )}

            {/* Opposing Parties */}
            {analysis.opposingParties && analysis.opposingParties.length > 0 && (
              <div className="p-2 bg-neu-50 rounded-lg shadow-neu-inset">
                <div className="text-xs text-neu-600 mb-0.5">Opposing Parties</div>
                <div className="space-y-0.5">
                  {analysis.opposingParties.map((party, idx) => (
                    <div key={idx} className="text-xs font-semibold text-neu-800">
                      • {party}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sentiment */}
            {analysis.sentiment && (
              <div className="p-2 bg-neu-50 rounded-lg shadow-neu-inset">
                <div className="text-xs text-neu-600">Tone</div>
                <div className="text-xs font-semibold text-neu-800 capitalize">
                  {analysis.sentiment.tone}
                  {analysis.sentiment.confidence > 0 && (
                    <span className="text-xs text-neu-600 ml-1 font-normal">
                      ({analysis.sentiment.confidence}%)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Keywords */}
            {analysis.keywords && analysis.keywords.length > 0 && (
              <div className="p-2 bg-neu-50 rounded-lg shadow-neu-inset">
                <div className="text-xs text-neu-600 mb-1">Keywords</div>
                <div className="flex flex-wrap gap-1">
                  {analysis.keywords.slice(0, 6).map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 text-xs font-medium bg-neu-200 text-neu-700 rounded-full shadow-neu-inset"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
