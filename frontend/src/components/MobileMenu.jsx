import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTimes, FaHome, FaChartLine, FaSignOutAlt, FaUser, FaBars } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    navigate('/login');
  };

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger Button - Only visible on mobile - Neomorphism */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden flex items-center justify-center w-11 h-11 bg-neu-200 text-neu-700 rounded-xl shadow-neu hover:shadow-neu-lg active:shadow-neu-inset transition-all duration-200"
        aria-label="Open menu"
      >
        <FaBars className="text-lg" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-[60] md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer - Slides in from right - RULE 5 Compliant - Neomorphism Theme */}
      <div
        className={`fixed top-0 right-0 h-full w-[280px] bg-gradient-to-b from-neu-200 to-neu-300 shadow-neu-lg z-[70] transform transition-transform duration-300 ease-in-out md:hidden flex flex-col max-h-screen border-l-2 border-neu-400 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header - Fixed - Neomorphism */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 bg-neu-200 shadow-neu-inset">
          <h2 className="text-lg font-bold text-neu-800">Menu</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center w-11 h-11 bg-neu-200 text-neu-700 rounded-xl shadow-neu hover:shadow-neu-inset active:shadow-neu-inset transition-all duration-200"
            aria-label="Close menu"
          >
            <FaTimes className="text-lg" />
          </button>
        </div>

        {/* Navigation Links - Scrollable Content - Neomorphism */}
        <nav className="flex-1 overflow-y-auto flex flex-col p-4 gap-3 bg-neu-200">
          {user ? (
            <>
              {/* User Info - Neomorphism Card */}
              <div className="mb-2 p-4 bg-neu-200 rounded-xl shadow-neu-inset">
                <p className="text-sm font-semibold text-neu-800 mb-1">{user.name}</p>
                <p className="text-xs text-neu-600">{user.email}</p>
                <div className="mt-2">
                  <span className="text-xs px-3 py-1 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-full font-medium shadow-neu">
                    {user.subscriptionTier === 'premium' ? 'Premium' : 'Free'}
                  </span>
                </div>
              </div>

              {/* Home Link - Neomorphism */}
              <Link
                to="/"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-4 py-3 bg-neu-200 text-neu-800 rounded-xl shadow-neu hover:shadow-neu-lg active:shadow-neu-inset transition-all duration-200 min-h-[44px]"
              >
                <FaHome className="text-lg text-blue-500" />
                <span className="font-medium text-base">{t('nav.home')}</span>
              </Link>

              {/* Safeguards Link - Neomorphism */}
              <Link
                to="/safeguards"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-4 py-3 bg-neu-200 text-neu-800 rounded-xl shadow-neu hover:shadow-neu-lg active:shadow-neu-inset transition-all duration-200 min-h-[44px]"
              >
                <span className="font-medium text-base">{t('nav.safeguards')}</span>
              </Link>

              {/* Mediators Link - Neomorphism */}
              <Link
                to="/mediators"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-4 py-3 bg-neu-200 text-neu-800 rounded-xl shadow-neu hover:shadow-neu-lg active:shadow-neu-inset transition-all duration-200 min-h-[44px]"
              >
                <span className="font-medium text-base">{t('nav.mediators')}</span>
              </Link>

              {/* Dashboard Link - Neomorphism */}
              <Link
                to="/dashboard"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-4 py-3 bg-neu-200 text-neu-800 rounded-xl shadow-neu hover:shadow-neu-lg active:shadow-neu-inset transition-all duration-200 min-h-[44px]"
              >
                <FaChartLine className="text-lg text-slate-600" />
                <span className="font-medium text-base">{t('nav.dashboard')}</span>
              </Link>

              {/* Logout Button - Neomorphism */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl shadow-neu hover:shadow-neu-lg active:shadow-neu-inset transition-all duration-200 min-h-[44px]"
              >
                <FaSignOutAlt className="text-lg" />
                <span className="font-medium text-base">{t('nav.logout')}</span>
              </button>

              {/* Language Switcher */}
              <div className="mt-2">
                <LanguageSwitcher />
              </div>
            </>
          ) : (
            <>
              {/* Home Link - Neomorphism */}
              <Link
                to="/"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-4 py-3 bg-neu-200 text-neu-800 rounded-xl shadow-neu hover:shadow-neu-lg active:shadow-neu-inset transition-all duration-200 min-h-[44px]"
              >
                <FaHome className="text-lg text-slate-600" />
                <span className="font-medium text-base">{t('nav.home')}</span>
              </Link>

              {/* Safeguards Link - Neomorphism */}
              <Link
                to="/safeguards"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-4 py-3 bg-neu-200 text-neu-800 rounded-xl shadow-neu hover:shadow-neu-lg active:shadow-neu-inset transition-all duration-200 min-h-[44px]"
              >
                <span className="font-medium text-base">{t('nav.safeguards')}</span>
              </Link>

              {/* Mediators Link - Neomorphism */}
              <Link
                to="/mediators"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-4 py-3 bg-neu-200 text-neu-800 rounded-xl shadow-neu hover:shadow-neu-lg active:shadow-neu-inset transition-all duration-200 min-h-[44px]"
              >
                <span className="font-medium text-base">{t('nav.mediators')}</span>
              </Link>

              {/* Login Button - Dark blueish gray CTA - 3D Neomorphism */}
              <Link
                to="/login"
                onClick={handleLinkClick}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 text-white rounded-xl shadow-[0_8px_16px_rgba(71,85,105,0.3),0_4px_8px_rgba(0,0,0,0.1),inset_0_-2px_4px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.2)] hover:shadow-[0_12px_24px_rgba(71,85,105,0.4),0_6px_12px_rgba(0,0,0,0.15),inset_0_-2px_4px_rgba(0,0,0,0.25),inset_0_2px_4px_rgba(255,255,255,0.25)] active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.3),inset_0_-2px_4px_rgba(255,255,255,0.1)] transition-all duration-200 min-h-[44px] transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <FaUser className="text-base" />
                <span className="font-semibold text-base">{t('nav.login')}</span>
              </Link>

              {/* Register Link - Neomorphism */}
              <Link
                to="/register"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-4 py-3 bg-neu-200 text-neu-800 rounded-xl shadow-neu hover:shadow-neu-lg active:shadow-neu-inset transition-all duration-200 min-h-[44px]"
              >
                <FaUser className="text-lg text-neu-600" />
                <span className="font-medium text-base">{t('nav.signup')}</span>
              </Link>

              {/* Language Switcher */}
              <div className="mt-2">
                <LanguageSwitcher />
              </div>
            </>
          )}
        </nav>

        {/* Footer - Fixed - Neomorphism */}
        <div className="flex-shrink-0 p-4 bg-neu-200 shadow-neu-inset">
          <p className="text-xs text-neu-600 text-center font-medium">
            Fair Mediator v1.0
          </p>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
