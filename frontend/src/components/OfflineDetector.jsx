/**
 * OfflineDetector Component
 * Detects when user goes offline and shows banner
 * Auto-hides when connection is restored
 */

import { useState, useEffect } from 'react';
import { FaWifi, FaTimes } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const OfflineDetector = () => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-hide banner after 3 seconds when back online
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        isOnline ? 'translate-y-0' : 'translate-y-0'
      }`}
      role="alert"
      aria-live="assertive"
    >
      <div
        className={`flex items-center justify-between px-4 py-3 shadow-lg ${
          isOnline
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
        }`}
      >
        <div className="flex items-center gap-3">
          <FaWifi className="text-xl" />
          <div>
            <p className="font-semibold text-sm">
              {isOnline ? t('offline.backOnline') : t('offline.youAreOffline')}
            </p>
            <p className="text-xs opacity-90">
              {isOnline
                ? t('offline.connectionRestored')
                : t('offline.checkConnection')
              }
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowBanner(false)}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Close notification"
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );
};

export default OfflineDetector;
