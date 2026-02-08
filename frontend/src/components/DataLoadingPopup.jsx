/**
 * DataLoadingPopup Component
 * Shows data population status to users
 *
 * Features:
 * - Real-time progress indicator
 * - Estimated completion time
 * - Dismissible notification
 * - Auto-dismisses when complete
 *
 * WCAG 2.1 Level AA compliant
 */

import React, { useState, useEffect } from 'react';
import { FaDatabase, FaTimes, FaCheckCircle, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

const DataLoadingPopup = ({
  apiBaseUrl = 'http://localhost:5001/api',
  onDismiss = null,
  autoCheck = true,
  checkInterval = 30000 // Check every 30 seconds
}) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState(null);

  // Check data population status
  const checkStatus = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/data-population/status`);

      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }

      const data = await response.json();
      setStatus(data);
      setLoading(false);
      setError(null);

      // Auto-dismiss when complete
      if (data.status === 'complete' && autoCheck) {
        setTimeout(() => {
          setDismissed(true);
        }, 5000); // Show "Complete" message for 5 seconds
      }

    } catch (err) {
      console.error('Error fetching data status:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();

    if (autoCheck) {
      const interval = setInterval(checkStatus, checkInterval);
      return () => clearInterval(interval);
    }
  }, [autoCheck, checkInterval]);

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  // Don't render if dismissed
  if (dismissed) {
    return null;
  }

  // Don't render if complete and no data
  if (!loading && !status && !error) {
    return null;
  }

  // Determine status color and icon
  const getStatusConfig = () => {
    if (loading) {
      return {
        color: 'blue',
        icon: FaSpinner,
        iconClass: 'animate-spin',
        title: 'Checking data status...'
      };
    }

    if (error) {
      return {
        color: 'red',
        icon: FaExclamationTriangle,
        iconClass: '',
        title: 'Error checking status'
      };
    }

    switch (status?.status) {
      case 'loading':
        return {
          color: 'blue',
          icon: FaDatabase,
          iconClass: 'animate-pulse',
          title: 'Loading mediator data...'
        };
      case 'rate_limited':
        return {
          color: 'yellow',
          icon: FaExclamationTriangle,
          iconClass: '',
          title: 'Waiting for API rate limit reset'
        };
      case 'complete':
        return {
          color: 'green',
          icon: FaCheckCircle,
          iconClass: '',
          title: 'Data loading complete!'
        };
      default:
        return {
          color: 'gray',
          icon: FaDatabase,
          iconClass: '',
          title: 'Data status unknown'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
    gray: 'bg-gray-50 border-gray-200'
  };

  const textColorClasses = {
    blue: 'text-blue-800',
    yellow: 'text-yellow-800',
    green: 'text-green-800',
    red: 'text-red-800',
    gray: 'text-gray-800'
  };

  const iconColorClasses = {
    blue: 'text-blue-500',
    yellow: 'text-yellow-500',
    green: 'text-green-500',
    red: 'text-red-500',
    gray: 'text-gray-500'
  };

  return (
    <div
      className={`fixed bottom-4 right-4 max-w-md rounded-lg shadow-lg border-2 p-4 z-50 ${colorClasses[config.color]}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 text-xl ${iconColorClasses[config.color]}`}>
          <Icon className={config.iconClass} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-bold ${textColorClasses[config.color]} mb-1`}>
            {config.title}
          </h3>

          {error && (
            <p className="text-xs text-red-700 mb-2">
              {error}
            </p>
          )}

          {!loading && !error && status && (
            <>
              <p className={`text-xs ${textColorClasses[config.color]} mb-2`}>
                {status.message}
              </p>

              {/* Progress info */}
              {status.progress && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={textColorClasses[config.color]}>
                      Progress: {status.progress.mediators}/{status.progress.total} mediators
                    </span>
                    <span className={textColorClasses[config.color]}>
                      {Math.round((status.progress.mediators / status.progress.total) * 100)}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${config.color === 'blue' ? 'bg-blue-500' : config.color === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'} transition-all duration-300`}
                      style={{ width: `${(status.progress.mediators / status.progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* ETA */}
              {status.eta && (
                <p className={`text-xs ${textColorClasses[config.color]} mt-2`}>
                  Estimated completion: {new Date(status.eta).toLocaleString()}
                </p>
              )}

              {/* Statistics */}
              {status.stats && (
                <div className={`text-xs ${textColorClasses[config.color]} mt-2 space-y-1`}>
                  {status.stats.fec && (
                    <div>FEC: {status.stats.fec.found} mediators with donation data</div>
                  )}
                  {status.stats.lda && (
                    <div>Lobbying: {status.stats.lda.found} mediators with filings</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className={`flex-shrink-0 ${textColorClasses[config.color]} hover:opacity-70 transition-opacity`}
          aria-label="Dismiss notification"
        >
          <FaTimes />
        </button>
      </div>

      {/* Action buttons for specific states */}
      {status?.status === 'rate_limited' && status.retryAt && (
        <div className="mt-3 pt-3 border-t border-yellow-300">
          <p className="text-xs text-yellow-700">
            Rate limit will reset in: {Math.max(0, Math.ceil((new Date(status.retryAt) - new Date()) / 1000 / 60))} minutes
          </p>
        </div>
      )}
    </div>
  );
};

export default DataLoadingPopup;
