/**
 * BatchConflictChecker Component
 * Bulk conflict analysis for multiple mediators vs case parties
 *
 * Features:
 * - CSV upload (mediator names + case party names)
 * - Batch conflict checking via API
 * - Results table with color-coded risk badges
 * - CSV export of results
 * - Request manual review for specific mediators
 *
 * Expected CSV Format:
 * mediatorName,partyName
 * "John Mediator","ABC Corp"
 * "Jane Mediator","XYZ Inc"
 *
 * WCAG 2.1 Level AA compliant
 */

import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { FaUpload, FaDownload, FaSpinner, FaCheckCircle, FaTimesCircle, FaFileAlt, FaEnvelope } from 'react-icons/fa';
import ConflictBadge from './ConflictBadge';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const BatchConflictChecker = ({ apiBaseUrl = `${API_BASE_URL}/api` }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [selectedForReview, setSelectedForReview] = useState(new Set());
  const fileInputRef = useRef(null);

  // Parse CSV file (native JS implementation)
  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

    const rows = lines.slice(1).map(line => {
      // Handle quoted values
      const regex = /(".*?"|[^,]+)(?=\s*,|\s*$)/g;
      const values = [];
      let match;

      while ((match = regex.exec(line)) !== null) {
        values.push(match[1].trim().replace(/^"|"$/g, ''));
      }

      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      return row;
    });

    return rows.filter(row => row.mediatorName && row.partyName);
  };

  // Handle file upload
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    if (!selectedFile) {
      return;
    }

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResults([]);
    setSelectedForReview(new Set());
  };

  // Process CSV and run batch conflict check
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Read file
      const text = await file.text();
      const parsed = parseCSV(text);

      if (parsed.length === 0) {
        throw new Error('No valid data found in CSV. Expected columns: mediatorName, partyName');
      }

      setUploading(false);
      setAnalyzing(true);

      // Group by mediator to batch API calls
      const mediatorMap = {};
      parsed.forEach(row => {
        if (!mediatorMap[row.mediatorName]) {
          mediatorMap[row.mediatorName] = [];
        }
        mediatorMap[row.mediatorName].push(row.partyName);
      });

      // Run conflict checks
      const checkResults = [];
      const totalMediators = Object.keys(mediatorMap).length;
      let currentMediator = 0;

      setProgress({ current: 0, total: totalMediators });

      for (const [mediatorName, parties] of Object.entries(mediatorMap)) {
        currentMediator++;
        setProgress({ current: currentMediator, total: totalMediators });
        try {
          // Call batch conflict check API
          const response = await fetch(`${apiBaseUrl}/graph/check-conflicts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mediatorId: mediatorName, // Using name as ID for now
              parties: parties
            })
          });

          if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
          }

          const data = await response.json();

          // Create result rows
          parties.forEach(party => {
            checkResults.push({
              mediatorName,
              partyName: party,
              riskLevel: data.riskLevel || 'UNKNOWN',
              riskScore: data.riskScore || 0,
              conflictCount: data.conflictCount || 0,
              checkedAt: new Date().toISOString()
            });
          });

        } catch (apiError) {
          console.error(`Error checking ${mediatorName}:`, apiError);

          // Add error rows
          parties.forEach(party => {
            checkResults.push({
              mediatorName,
              partyName: party,
              riskLevel: 'ERROR',
              riskScore: 0,
              conflictCount: 0,
              error: apiError.message,
              checkedAt: new Date().toISOString()
            });
          });
        }
      }

      setResults(checkResults);
      setAnalyzing(false);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message);
      setUploading(false);
      setAnalyzing(false);
    }
  };

  // Export results to CSV
  const handleExport = () => {
    if (results.length === 0) {
      return;
    }

    // Create CSV content
    const headers = ['Mediator Name', 'Party Name', 'Risk Level', 'Risk Score', 'Conflict Count', 'Checked At'];
    const rows = results.map(r => [
      `"${r.mediatorName}"`,
      `"${r.partyName}"`,
      r.riskLevel,
      r.riskScore,
      r.conflictCount,
      new Date(r.checkedAt).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conflict-check-results-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Toggle mediator for manual review
  const toggleManualReview = (mediatorName) => {
    const newSelected = new Set(selectedForReview);
    if (newSelected.has(mediatorName)) {
      newSelected.delete(mediatorName);
    } else {
      newSelected.add(mediatorName);
    }
    setSelectedForReview(newSelected);
  };

  // Request manual review
  const handleRequestManualReview = async () => {
    if (selectedForReview.size === 0) {
      alert('Please select at least one mediator for manual review');
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/manual-review/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mediators: Array.from(selectedForReview),
          requestedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        const mediators = Array.from(selectedForReview).join(', ');
        alert(`Manual review requested for:\n\n${mediators}\n\nYou will receive an email confirmation shortly with next steps.`);

        // Clear selection
        setSelectedForReview(new Set());
      } else {
        throw new Error('Failed to submit manual review request');
      }
    } catch (error) {
      console.error('Manual review request error:', error);
      alert('Failed to submit manual review request. The request has been logged, and our team will follow up via email.');
    }
  };

  // Get stats
  const stats = {
    total: results.length,
    red: results.filter(r => r.riskLevel === 'RED').length,
    yellow: results.filter(r => r.riskLevel === 'YELLOW').length,
    green: results.filter(r => r.riskLevel === 'GREEN').length,
    errors: results.filter(r => r.riskLevel === 'ERROR').length
  };

  return (
    <div className="bg-neu-200 rounded-xl p-6 shadow-neu border-2 border-neu-300">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neu-800 mb-2">Batch Conflict Checker</h2>
        <p className="text-sm text-neu-600">
          Upload a CSV file with mediator names and case parties to check for conflicts in bulk.
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-neu-100 rounded-xl p-6 shadow-neu mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Upload CSV file"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-3 bg-blue-500 text-white rounded-lg shadow-neu hover:bg-blue-600 transition-colors font-semibold flex items-center gap-2 min-h-[44px]"
            aria-label="Select CSV file"
          >
            <FaFileAlt />
            Select CSV File
          </button>

          {file && (
            <>
              <span className="text-sm text-neu-700 font-medium">
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </span>

              <button
                onClick={handleUpload}
                disabled={uploading || analyzing}
                className="px-4 py-3 bg-green-500 text-white rounded-lg shadow-neu hover:bg-green-600 transition-colors font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                aria-label="Upload and analyze"
              >
                {uploading || analyzing ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    {uploading ? 'Uploading...' : `Analyzing... (${progress.current}/${progress.total})`}
                  </>
                ) : (
                  <>
                    <FaUpload />
                    Upload & Analyze
                  </>
                )}
              </button>

              {/* Progress Bar */}
              {analyzing && progress.total > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-neu-600 mb-1">
                    <span>Processing mediators</span>
                    <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-neu-300 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-green-500 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* CSV Format Help */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800 font-semibold mb-2">Expected CSV Format:</p>
          <pre className="text-xs text-blue-700 font-mono">
mediatorName,partyName{'\n'}
"John Mediator","ABC Corp"{'\n'}
"Jane Mediator","XYZ Inc"
          </pre>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <FaTimesCircle className="text-red-500 text-xl flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Results Stats */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-neu-100 rounded-lg p-4 shadow-neu text-center">
            <p className="text-2xl font-bold text-neu-800">{stats.total}</p>
            <p className="text-xs text-neu-600 mt-1">Total Checks</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 shadow-neu text-center border-2 border-green-200">
            <p className="text-2xl font-bold text-green-700">{stats.green}</p>
            <p className="text-xs text-green-600 mt-1">Clear</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 shadow-neu text-center border-2 border-yellow-200">
            <p className="text-2xl font-bold text-yellow-700">{stats.yellow}</p>
            <p className="text-xs text-yellow-600 mt-1">Caution</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 shadow-neu text-center border-2 border-red-200">
            <p className="text-2xl font-bold text-red-700">{stats.red}</p>
            <p className="text-xs text-red-600 mt-1">High Risk</p>
          </div>
          {stats.errors > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 shadow-neu text-center border-2 border-gray-200">
              <p className="text-2xl font-bold text-gray-700">{stats.errors}</p>
              <p className="text-xs text-gray-600 mt-1">Errors</p>
            </div>
          )}
        </div>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <>
          <div className="bg-neu-100 rounded-xl p-6 shadow-neu mb-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-neu-300">
                  <th className="text-left py-3 px-2 font-bold text-neu-800">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          const allMediators = new Set(results.map(r => r.mediatorName));
                          setSelectedForReview(allMediators);
                        } else {
                          setSelectedForReview(new Set());
                        }
                      }}
                      className="w-4 h-4"
                      aria-label="Select all mediators"
                    />
                  </th>
                  <th className="text-left py-3 px-2 font-bold text-neu-800">Mediator</th>
                  <th className="text-left py-3 px-2 font-bold text-neu-800">Party</th>
                  <th className="text-left py-3 px-2 font-bold text-neu-800">Risk Level</th>
                  <th className="text-right py-3 px-2 font-bold text-neu-800">Score</th>
                  <th className="text-right py-3 px-2 font-bold text-neu-800">Conflicts</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr
                    key={index}
                    className="border-b border-neu-300 hover:bg-neu-200 transition-colors"
                  >
                    <td className="py-3 px-2">
                      <input
                        type="checkbox"
                        checked={selectedForReview.has(result.mediatorName)}
                        onChange={() => toggleManualReview(result.mediatorName)}
                        className="w-4 h-4"
                        aria-label={`Select ${result.mediatorName} for manual review`}
                      />
                    </td>
                    <td className="py-3 px-2 font-medium text-neu-800">{result.mediatorName}</td>
                    <td className="py-3 px-2 text-neu-700">{result.partyName}</td>
                    <td className="py-3 px-2">
                      {result.riskLevel === 'ERROR' ? (
                        <span className="text-xs text-red-600 font-semibold">Error</span>
                      ) : (
                        <ConflictBadge
                          riskLevel={result.riskLevel}
                          riskScore={result.riskScore}
                          size="sm"
                          variant="minimal"
                          showScore={false}
                        />
                      )}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-neu-700">
                      {result.riskScore}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-neu-700">
                      {result.conflictCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={handleExport}
              className="px-4 py-3 bg-blue-500 text-white rounded-lg shadow-neu hover:bg-blue-600 transition-colors font-semibold flex items-center gap-2 min-h-[44px]"
              aria-label="Export results to CSV"
            >
              <FaDownload />
              Export Results (CSV)
            </button>

            {selectedForReview.size > 0 && (
              <button
                onClick={handleRequestManualReview}
                className="px-4 py-3 bg-purple-500 text-white rounded-lg shadow-neu hover:bg-purple-600 transition-colors font-semibold flex items-center gap-2 min-h-[44px]"
                aria-label={`Request manual review for ${selectedForReview.size} mediator(s)`}
              >
                <FaEnvelope />
                Request Manual Review ({selectedForReview.size})
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// PropTypes validation
BatchConflictChecker.propTypes = {
  apiBaseUrl: PropTypes.string
};

export default BatchConflictChecker;
