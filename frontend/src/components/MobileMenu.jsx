import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTimes, FaHome, FaChartLine, FaSignOutAlt, FaUser, FaBars } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
      {/* Hamburger Button - Only visible on mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden flex items-center justify-center w-11 h-11 bg-dark-neu-400 text-white rounded-xl shadow-dark-neu hover:shadow-dark-neu-lg transition-all duration-200 border border-dark-neu-200"
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

      {/* Drawer - Slides in from right - RULE 5 Compliant */}
      <div
        className={`fixed top-0 right-0 h-full w-[280px] bg-dark-neu-300 shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out md:hidden flex flex-col max-h-screen ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header - Fixed */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-dark-neu-500">
          <h2 className="text-lg font-bold text-white">Menu</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center w-11 h-11 bg-dark-neu-400 text-white rounded-xl shadow-dark-neu hover:shadow-dark-neu-lg transition-all duration-200"
            aria-label="Close menu"
          >
            <FaTimes className="text-lg" />
          </button>
        </div>

        {/* Navigation Links - Scrollable Content */}
        <nav className="flex-1 overflow-y-auto flex flex-col p-4 gap-3">
          {user ? (
            <>
              {/* User Info */}
              <div className="mb-4 p-4 bg-dark-neu-400 rounded-xl shadow-dark-neu border border-dark-neu-200">
                <p className="text-sm font-semibold text-white mb-1">{user.name}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
                <div className="mt-2">
                  <span className="text-xs px-3 py-1 bg-blue-500 text-white rounded-full font-medium">
                    {user.subscriptionTier === 'premium' ? 'Premium' : 'Free'}
                  </span>
                </div>
              </div>

              {/* Home Link */}
              <Link
                to="/"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-4 py-3 bg-dark-neu-400 text-white rounded-xl shadow-dark-neu hover:shadow-dark-neu-lg transition-all duration-200 border border-dark-neu-200 min-h-[44px]"
              >
                <FaHome className="text-lg text-blue-400" />
                <span className="font-medium text-base">Home</span>
              </Link>

              {/* Safeguards Link */}
              <Link
                to="/safeguards"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-4 py-3 bg-dark-neu-400 text-white rounded-xl shadow-dark-neu hover:shadow-dark-neu-lg transition-all duration-200 border border-dark-neu-200 min-h-[44px]"
              >
                <span className="font-medium text-base">Safeguards</span>
              </Link>

              {/* Mediators Link */}
              <Link
                to="/mediators/apply"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl shadow-dark-neu hover:shadow-dark-neu-lg transition-all duration-200 min-h-[44px]"
              >
                <span className="font-medium text-base">Mediators</span>
              </Link>

              {/* Dashboard Link */}
              <Link
                to="/dashboard"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-4 py-3 bg-dark-neu-400 text-white rounded-xl shadow-dark-neu hover:shadow-dark-neu-lg transition-all duration-200 border border-dark-neu-200 min-h-[44px]"
              >
                <FaChartLine className="text-lg text-blue-400" />
                <span className="font-medium text-base">Dashboard</span>
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl shadow-dark-neu hover:shadow-dark-neu-lg transition-all duration-200 min-h-[44px]"
              >
                <FaSignOutAlt className="text-lg" />
                <span className="font-medium text-base">Logout</span>
              </button>
            </>
          ) : (
            <>
              {/* Home Link */}
              <Link
                to="/"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-4 py-3 bg-dark-neu-400 text-white rounded-xl shadow-dark-neu hover:shadow-dark-neu-lg transition-all duration-200 border border-dark-neu-200 min-h-[44px]"
              >
                <FaHome className="text-lg text-blue-400" />
                <span className="font-medium text-base">Home</span>
              </Link>

              {/* Safeguards Link */}
              <Link
                to="/safeguards"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-4 py-3 bg-dark-neu-400 text-white rounded-xl shadow-dark-neu hover:shadow-dark-neu-lg transition-all duration-200 border border-dark-neu-200 min-h-[44px]"
              >
                <span className="font-medium text-base">Safeguards</span>
              </Link>

              {/* Mediators Link */}
              <Link
                to="/mediators/apply"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl shadow-dark-neu hover:shadow-dark-neu-lg transition-all duration-200 min-h-[44px]"
              >
                <span className="font-medium text-base">Mediators</span>
              </Link>

              {/* Login Link */}
              <Link
                to="/login"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-4 py-3 bg-dark-neu-400 text-white rounded-xl shadow-dark-neu hover:shadow-dark-neu-lg transition-all duration-200 border border-dark-neu-200 min-h-[44px]"
              >
                <FaUser className="text-lg text-white" />
                <span className="font-medium text-base">Login</span>
              </Link>

              {/* Register Link */}
              <Link
                to="/register"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-dark-neu hover:shadow-dark-neu-lg transition-all duration-200 min-h-[44px]"
              >
                <FaUser className="text-lg" />
                <span className="font-medium text-base">Sign Up</span>
              </Link>
            </>
          )}
        </nav>

        {/* Footer - Fixed */}
        <div className="flex-shrink-0 p-4 border-t border-dark-neu-500">
          <p className="text-xs text-gray-400 text-center">
            Fair Mediator v1.0
          </p>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
