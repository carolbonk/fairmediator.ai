import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaSignOutAlt, FaChartLine } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import MobileMenu from './MobileMenu';
import LanguageSwitcher from './LanguageSwitcher';
import logoBlue from '../images/Fair_Mediator_logoBlue.svg';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

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
                Fair Mediador
              </p>
              {/* Tagline - Desktop only */}
              <p className="hidden lg:block text-sm text-white font-medium tracking-wide opacity-80 whitespace-nowrap">
                Intelligent Mediator Matching & Screening Platform
              </p>
            </div>
          </div>

          {/* Navigation - Desktop only (hidden on mobile, replaced by hamburger) */}
          <div className="hidden md:flex items-center gap-2">
            {/* Safeguards Link - Modern, sleek */}
            <Link
              to="/safeguards"
              className="px-3 py-2 text-white text-sm font-medium hover:text-gray-300 transition-colors duration-200"
            >
              {t('nav.safeguards')}
            </Link>

            {/* Mediators Link - Modern, sleek */}
            <Link
              to="/mediators"
              className="px-3 py-2 text-white text-sm font-medium hover:text-gray-300 transition-colors duration-200"
            >
              {t('nav.mediators')}
            </Link>

            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1.5 px-3 py-2 text-white text-sm font-medium hover:text-blue-300 transition-colors duration-200"
                >
                  <FaChartLine className="text-sm" />
                  <span>{t('nav.dashboard')}</span>
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
