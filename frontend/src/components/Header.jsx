import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaSignOutAlt, FaChartLine, FaCog, FaBell, FaCheckDouble, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import MobileMenu from './MobileMenu';
import LanguageSwitcher from './LanguageSwitcher';
import logoBlue from '../images/Fair_Mediator_logoBlue.svg';
import { getAlerts, markAlertRead, markAllAlertsRead } from '../services/api';

const SEVERITY_ICON = {
  HIGH: <FaExclamationTriangle className="text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />,
  MEDIUM: <FaExclamationTriangle className="text-yellow-400 flex-shrink-0 mt-0.5" aria-hidden="true" />,
  LOW: <FaInfoCircle className="text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />,
};

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [aboutOpen, setAboutOpen] = useState(false);
  const aboutRef = useRef(null);

  // ── Alerts state ──────────────────────────────────────────────────────────
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const alertsRef = useRef(null);

  const fetchAlerts = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getAlerts();
      if (data?.data) {
        setAlerts(data.data.alerts || []);
        setUnreadCount(data.data.unreadCount || 0);
      }
    } catch {
      // Silent — don't break the header if alerts API is unreachable
    }
  }, [user]);

  // Initial fetch + poll every 60s
  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60_000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // Close alerts dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (alertsRef.current && !alertsRef.current.contains(e.target)) {
        setAlertsOpen(false);
      }
    };
    if (alertsOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [alertsOpen]);

  const handleAlertClick = async (alert) => {
    if (!alert.isRead) {
      try {
        await markAlertRead(alert._id);
        setAlerts(prev => prev.map(a => a._id === alert._id ? { ...a, isRead: true } : a));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch { /* silent */ }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAlertsRead();
      setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (aboutRef.current && !aboutRef.current.contains(e.target)) {
        setAboutOpen(false);
      }
    };
    if (aboutOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [aboutOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-dark-neu-300 shadow-dark-neu-lg sticky top-0 z-50 border-b border-dark-neu-500">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-1">
        <div className="flex items-center justify-between relative">
          {/* Logo - Left */}
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <img
              src={logoBlue}
              alt="Fair Mediator"
              className="h-12 sm:h-16 w-auto drop-shadow-lg"
            />
          </Link>

          {/* Main Title + Tagline - Center - Hidden on mobile */}
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2">
            <div className="text-center">
              <p className="text-fluid-base text-white font-bold tracking-wide whitespace-nowrap">
                {t('nav.brandName')}
              </p>
              {/* Tagline - Desktop only */}
              <p className="hidden lg:block text-sm text-white font-medium tracking-wide opacity-80 whitespace-nowrap">
                {t('nav.tagline')}
              </p>
            </div>
          </div>

          {/* Navigation - Desktop only (hidden on mobile, replaced by hamburger) */}
          <div className="hidden md:flex items-center gap-2">
            {/* About Dropdown */}
            <div className="relative" ref={aboutRef}>
              <button
                onClick={() => setAboutOpen(!aboutOpen)}
                className="flex items-center gap-1 px-3 py-2 text-white text-sm font-medium hover:text-gray-300 transition-colors duration-200 focus:outline-none"
                aria-expanded={aboutOpen}
                aria-haspopup="true"
              >
                {t('nav.about')}
                <svg
                  className={`w-3 h-3 transition-transform duration-200 ${aboutOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {aboutOpen && (
                <div className="absolute left-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                  <Link
                    to="/mediators"
                    onClick={() => setAboutOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {t('nav.mediators')}
                  </Link>
                  <Link
                    to="/safeguards"
                    onClick={() => setAboutOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {t('nav.safeguards')}
                  </Link>
                </div>
              )}
            </div>

            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1.5 px-3 py-2 text-white text-sm font-medium hover:text-blue-300 transition-colors duration-200"
                >
                  <FaChartLine className="text-sm" />
                  <span>{t('nav.dashboard')}</span>
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center gap-1.5 px-3 py-2 text-white text-sm font-medium hover:text-blue-300 transition-colors duration-200"
                >
                  <FaCog className="text-sm" />
                  <span>{t('nav.settings')}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 text-white text-sm font-medium hover:text-red-300 transition-colors duration-200"
                >
                  <FaSignOutAlt className="text-sm" />
                  <span>{t('nav.logout')}</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-all duration-200"
              >
                <FaUser className="text-sm" />
                <span>{t('nav.login')}</span>
              </Link>
            )}

            {/* Conflict Alerts Bell */}
            {user && (
              <div className="relative" ref={alertsRef}>
                <button
                  onClick={() => setAlertsOpen(prev => !prev)}
                  className="relative flex items-center justify-center w-9 h-9 rounded-xl text-white hover:text-blue-300 hover:bg-dark-neu-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500"
                  aria-label={`Alerts${unreadCount > 0 ? ` — ${unreadCount} unread` : ''}`}
                  aria-expanded={alertsOpen}
                  aria-haspopup="true"
                >
                  <FaBell className="text-base" aria-hidden="true" />
                  {unreadCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none"
                      aria-hidden="true"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Alerts dropdown */}
                {alertsOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-80 bg-dark-neu-300 border border-dark-neu-500 rounded-2xl shadow-dark-neu-lg z-50 overflow-hidden"
                    role="dialog"
                    aria-label="Conflict alerts"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-dark-neu-500">
                      <span className="text-sm font-bold text-white">Alerts</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="flex items-center gap-1.5 text-xs text-blue-300 hover:text-blue-200 transition-colors"
                          aria-label="Mark all alerts as read"
                        >
                          <FaCheckDouble aria-hidden="true" />
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* Alert list */}
                    <div className="max-h-[320px] overflow-y-auto">
                      {alerts.length === 0 ? (
                        <div className="py-8 text-center">
                          <FaBell className="text-2xl text-dark-neu-100 mx-auto mb-2" aria-hidden="true" />
                          <p className="text-sm text-neu-400">No alerts yet</p>
                        </div>
                      ) : (
                        alerts.map(alert => (
                          <button
                            key={alert._id}
                            onClick={() => handleAlertClick(alert)}
                            className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-dark-neu-500 hover:bg-dark-neu-400 transition-colors last:border-0 ${!alert.isRead ? 'bg-dark-neu-400/50' : ''}`}
                            aria-label={`${alert.isRead ? 'Read' : 'Unread'} alert: ${alert.message}`}
                          >
                            {SEVERITY_ICON[alert.severity] || SEVERITY_ICON.LOW}
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs leading-relaxed ${alert.isRead ? 'text-neu-400' : 'text-white/90'}`}>
                                {alert.message}
                              </p>
                              <p className="text-[10px] text-neu-500 mt-0.5">
                                {new Date(alert.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                            {!alert.isRead && (
                              <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 mt-1" aria-hidden="true" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Language Switcher */}
            <LanguageSwitcher />
          </div>

          {/* Mobile Menu - Only visible on mobile */}
          <MobileMenu />
        </div>
      </div>

      {/* Graffiti-style bottom accent line */}
      <div className="h-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent opacity-30"></div>
    </header>
  );
};

export default Header;
