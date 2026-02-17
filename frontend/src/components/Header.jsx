import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaSignOutAlt, FaChartLine, FaCog } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import MobileMenu from './MobileMenu';
import LanguageSwitcher from './LanguageSwitcher';
import logoBlue from '../images/Fair_Mediator_logoBlue.svg';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [aboutOpen, setAboutOpen] = useState(false);
  const aboutRef = useRef(null);

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
