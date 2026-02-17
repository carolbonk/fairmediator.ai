/**
 * Bulk Conflict Checker Component
 * Upload CSV or TXT file with party names to check for conflicts
 * Checks all parties against mediator affiliations in bulk
 */

import React, { useState, useRef } from 'react';
import { FaFileUpload, FaSpinner, FaCheckCircle, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import Tooltip from './Tooltip';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const BulkConflictChecker = ({ onResultsUpdate, compact = false }) => {
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const acceptedTypes = ['text/plain', 'text/csv', 'application/csv', 'text/comma-separated-values'];

  const handleFileSelect = async (file) => {
    if (!file) return;

    // Validate file type
    if (!acceptedTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setError('Please upload a .csv or .txt file');
      return;
    }

    // Validate file size (1MB max)
    if (file.size > 1024 * 1024) {
      setError('File size exceeds 1MB limit');
      return;
    }

    setUploading(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('parties', file);

      const response = await fetch(`${API_BASE_URL}/api/analysis/bulk-conflict`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check conflicts');
      }

      setResults(data.results);
      // Notify parent component of results
      if (onResultsUpdate) {
        onResultsUpdate(data.results);
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
    setResults(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Notify parent component that results are cleared
    if (onResultsUpdate) {
      onResultsUpdate(null);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-700';
    }
  };

  const getSeverityIcon = (severity) => {
    const className = severity === 'high' ? 'text-red-500' : 'text-yellow-500';
    return <FaExclamationTriangle className={className} />;
  };

  return (
    <div className="w-full">
      {/* Upload Area */}
      {!results && (
        <div
          className={`relative ${compact ? 'p-0' : 'card-neu p-6'} transition-all duration-200 ${
            !compact && (dragActive ? 'shadow-neu-inset' : 'hover:shadow-neu-lg')
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {compact ? (
            <div className="flex items-center justify-center gap-2 mb-3">
              <h3 className="text-xs font-semibold text-neu-700">
                Bulk Conflict Checker
              </h3>
              <Tooltip text="Upload a list of party names to check for conflicts with mediator affiliations in bulk. Automated matching only." />
            </div>
          ) : (
            <div className="flex items-start gap-3 mb-4">
              <FaFileUpload className="text-neu-500 text-xl flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-neu-700">
                    Bulk Conflict Checker
                  </h3>
                  <Tooltip text="Upload a list of party names to check for conflicts with mediator affiliations in bulk. Automated matching only." />
                </div>
                <p className="text-xs text-neu-600 mt-1">
                  Upload CSV or TXT file with party names to check for potential conflicts
                </p>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleChange}
            className="hidden"
            disabled={uploading}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`w-full button-neu ${compact ? 'text-xs py-2' : 'text-sm py-3'} flex items-center justify-center gap-2 disabled:opacity-50`}
          >
            {uploading ? (
              <>
                <FaSpinner className="animate-spin" />
                {compact ? 'Checking...' : 'Checking Conflicts...'}
              </>
            ) : (
              <>
                <FaFileUpload />
                {compact ? 'Upload CSV/TXT' : 'Choose File or Drag & Drop'}
              </>
            )}
          </button>

          <p className={`text-xs text-neu-500 text-center ${compact ? 'mt-1.5' : 'mt-3'}`}>
            {compact ? '.csv, .txt (max 1MB)' : 'Supported: .csv, .txt (max 1MB, up to 1000 parties)'}
          </p>

          {error && (
            <div className="mt-4 p-3 bg-red-50 rounded-xl shadow-neu-inset text-xs text-red-700 font-medium flex items-center gap-2">
              <FaTimes />
              {error}
            </div>
          )}
        </div>
      )}

      {/* Results Display - Hidden in compact mode (shown in StatisticsPanel instead) */}
      {results && !compact && (
        <div className="card-neu p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-500" />
              <h3 className="text-sm font-semibold text-neu-700">
                Conflict Check Complete
              </h3>
            </div>
            <button
              onClick={resetUpload}
              className="text-xs text-neu-600 hover:text-neu-800 font-medium"
            >
              Check Another File
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 bg-neu-50 rounded-xl shadow-neu-inset text-center">
              <div className="text-xs text-neu-600 font-medium mb-1">Total Parties</div>
              <div className="text-2xl font-bold text-neu-800">{results.totalParties}</div>
            </div>
            <div className="p-3 bg-neu-50 rounded-xl shadow-neu-inset text-center">
              <div className="text-xs text-neu-600 font-medium mb-1">Conflicts Found</div>
              <div className="text-2xl font-bold text-red-600">{results.totalConflicts}</div>
            </div>
            <div className="p-3 bg-neu-50 rounded-xl shadow-neu-inset text-center">
              <div className="text-xs text-neu-600 font-medium mb-1">High Severity</div>
              <div className="text-2xl font-bold text-red-600">{results.summary?.highSeverity || 0}</div>
            </div>
          </div>

          {/* Conflicts List */}
          {results.conflicts && results.conflicts.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-neu-700 mb-2">Detected Conflicts</h4>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {results.conflicts.map((conflict, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl shadow-neu-inset border ${getSeverityColor(conflict.severity)}`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {getSeverityIcon(conflict.severity)}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold mb-1">
                          {conflict.party}
                        </div>
                        <div className="text-xs opacity-90">
                          Mediator: {conflict.mediator.name}
                          {conflict.mediator.location && (
                            <span className="ml-1">
                              ({conflict.mediator.location.city}, {conflict.mediator.location.state})
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-bold uppercase px-2 py-1 bg-white/50 rounded">
                        {conflict.severity}
                      </span>
                    </div>

                    {/* Matches */}
                    {conflict.matches && conflict.matches.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {conflict.matches.map((match, matchIdx) => (
                          <div key={matchIdx} className="text-xs bg-white/50 px-2 py-1 rounded">
                            <span className="font-medium capitalize">
                              {match.type.replace(/_/g, ' ')}:
                            </span>{' '}
                            {match.value}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recommendation */}
                    {conflict.recommendation && (
                      <div className="mt-2 text-xs font-medium">
                        💡 {conflict.recommendation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-green-50 rounded-xl shadow-neu-inset text-center">
              <FaCheckCircle className="text-green-500 text-2xl mx-auto mb-2" />
              <p className="text-sm font-semibold text-green-700">
                No conflicts detected!
              </p>
              <p className="text-xs text-green-600 mt-1">
                All parties checked against {results.summary?.uniqueMediators || 0} mediators
              </p>
            </div>
          )}

          {/* Summary Details */}
          {results.summary && results.totalConflicts > 0 && (
            <div className="mt-4 p-3 bg-neu-50 rounded-xl shadow-neu-inset">
              <h5 className="text-xs font-semibold text-neu-700 mb-2">Summary</h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-neu-600">Unique Parties:</span>
                  <span className="font-semibold text-neu-800">{results.summary.uniqueParties}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neu-600">Unique Mediators:</span>
                  <span className="font-semibold text-neu-800">{results.summary.uniqueMediators}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neu-600">High Severity:</span>
                  <span className="font-semibold text-red-600">{results.summary.highSeverity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neu-600">Medium Severity:</span>
                  <span className="font-semibold text-yellow-600">{results.summary.mediumSeverity}</span>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-neu-500 text-center mt-4 italic">
            Checked at: {new Date(results.checkedAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default BulkConflictChecker;
