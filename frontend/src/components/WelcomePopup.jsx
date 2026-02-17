import { useState, useEffect } from 'react';
import { FaShieldAlt, FaLock, FaUserSecret } from 'react-icons/fa';

const WelcomePopup = ({ onClose }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setIsOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={handleClose}
      />

      {/* Welcome Card - Modern & Mobile-Optimized */}
      <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
        <div
          className="bg-dark-neu-300 rounded-t-2xl sm:rounded-2xl shadow-dark-neu-lg w-full sm:max-w-md mx-auto flex flex-col overflow-hidden animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Content */}
          <div className="p-5 sm:p-7">
            {/* Header with Icon */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-3">
                <FaShieldAlt className="text-2xl text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Welcome to FairMediator
              </h2>
              <p className="text-sm text-white/70 leading-relaxed max-w-sm mx-auto">
                Transparent mediator selection with AI-powered screening & matching
              </p>
            </div>

            {/* Privacy Features - Compact Grid */}
            <div className="grid grid-cols-1 gap-2 mb-5">
              <div className="flex items-start gap-3 p-3 bg-dark-neu-400 rounded-xl border border-dark-neu-500">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mt-0.5">
                  <FaLock className="text-blue-400 text-sm" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-sm mb-0.5">Secure & Private</h3>
                  <p className="text-xs text-white/60">
                    Strong security safeguards protect your dispute information
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-dark-neu-400 rounded-xl border border-dark-neu-500">
                <div className="flex-shrink-0 w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mt-0.5">
                  <FaUserSecret className="text-green-400 text-sm" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-sm mb-0.5">Auto-Delete</h3>
                  <p className="text-xs text-white/60">
                    Data automatically deleted 30 days after case resolution
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleClose}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all"
            >
              Get Started
            </button>

            {/* Footer note */}
            <p className="text-center text-xs text-white/40 mt-3">
              By continuing, you agree to our{' '}
              <a href="/terms" className="text-blue-400 hover:underline">
                Terms
              </a>
              {' '}and{' '}
              <a href="/privacy" className="text-blue-400 hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        @media (min-width: 640px) {
          .animate-slide-up {
            animation: none;
          }
        }
      `}</style>
    </>
  );
};

export default WelcomePopup;
