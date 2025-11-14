import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaBalanceScale, FaRobot, FaUser, FaSignOutAlt, FaCrown } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

/**
 * Header - Global navigation with auth state
 * DRY: Reuses neomorphic styles and icons
 */
const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Don't show auth UI on auth pages
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'].includes(location.pathname);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-dark-neu-300 shadow-dark-neu-lg sticky top-0 z-50 border-b border-dark-neu-500">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-5 lg:py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-5">
            {/* Icon with graffiti-style glow */}
            <div className="relative cursor-pointer" onClick={() => navigate('/')}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl blur-lg opacity-50"></div>
              <div className="relative bg-gradient-to-br from-blue-400 to-blue-600 p-3.5 rounded-xl shadow-dark-neu-lg">
                <FaBalanceScale className="text-2xl text-white drop-shadow-lg" />
              </div>
            </div>

            {/* Text with graffiti styling */}
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-blue-900 tracking-tight drop-shadow-md cursor-pointer" onClick={() => navigate('/')}>
                FairMediator
              </h1>
              <p className="text-sm text-dark-neu-50 font-semibold mt-1 tracking-wide opacity-80">
                Intelligent Mediator Matching & Screening Platform
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* AI Badge with convex neumorphism */}
            <div className="flex items-center space-x-3 px-5 py-3 bg-dark-neu-400 rounded-xl shadow-dark-neu border border-dark-neu-200">
              <div className="relative">
                <FaRobot className="text-xl text-blue-400 drop-shadow-lg animate-pulse" />
                <div className="absolute inset-0 bg-blue-400 blur-md opacity-30"></div>
              </div>
              <div className="hidden md:flex flex-col">
                <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
                  100% FREE
                </span>
                <span className="text-xs text-dark-neu-50 font-medium opacity-70">
                  Hugging Face AI
                </span>
              </div>
              <span className="md:hidden text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
                FREE
              </span>
            </div>

            {/* Auth UI - Only show on protected pages */}
            {!isAuthPage && user && (
              <>
                {/* User Info Card */}
                <div className="flex items-center space-x-3 px-4 py-2.5 bg-dark-neu-400 rounded-xl shadow-dark-neu border border-dark-neu-200">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg">
                      <FaUser className="text-sm text-white" />
                    </div>
                    {user.subscriptionTier === 'premium' && (
                      <div className="absolute -top-1 -right-1">
                        <FaCrown className="text-xs text-yellow-400 drop-shadow-lg" />
                      </div>
                    )}
                  </div>
                  <div className="hidden md:flex flex-col">
                    <span className="text-sm font-semibold text-blue-900 truncate max-w-[150px]">
                      {user.name || user.email}
                    </span>
                    <span className="text-xs text-dark-neu-50 font-medium opacity-70 capitalize">
                      {user.subscriptionTier} Plan
                    </span>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-dark-neu-400 rounded-xl shadow-dark-neu border border-dark-neu-200 hover:shadow-dark-neu-lg transition-all duration-200 group"
                  aria-label="Logout"
                >
                  <FaSignOutAlt className="text-red-400 group-hover:text-red-500 transition-colors" />
                  <span className="hidden md:inline text-sm font-semibold text-blue-900">
                    Logout
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Graffiti-style bottom accent line */}
      <div className="h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30"></div>
    </header>
  );
};

export default Header;
