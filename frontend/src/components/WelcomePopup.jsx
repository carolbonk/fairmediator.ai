import { useState, useEffect } from 'react';

const WelcomePopup = ({ onClose }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen the welcome popup before
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');

    if (!hasSeenWelcome) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setIsOpen(false);
    // Scroll to top for mobile users
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - Blur and Darken */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50"
        onClick={handleClose}
      />

      {/* Popup */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 sm:p-6 md:p-8">
        <div
          className="bg-gray-50 rounded-3xl shadow-neumorphic w-[85%] max-w-md max-h-[85vh] mx-auto flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8">
            <div className="text-center mb-6 flex flex-col items-center">
              <h2 className="text-fluid-2xl font-bold text-gray-800 mb-3">Welcome to FairMediator</h2>
              <p className="text-gray-600 text-fluid-base leading-relaxed text-center max-w-md">
                Platform designed for transparent and fair mediator selection with screening & matching
              </p>
            </div>

            {/* Privacy Information */}
            <div className="mt-6 p-4 bg-white rounded-xl shadow-sm">
              <p className="text-gray-700 text-fluid-sm leading-relaxed text-center">
                We do value your privacy.
              </p>
              <p className="text-gray-600 text-fluid-sm leading-relaxed text-center mt-3">
                Every dispute in production stays confidential, protected by strong security safeguards, and all conversation data is automatically deleted 30 days after your case reaches an attempted outcome.
              </p>
            </div>
          </div>

          {/* Fixed Button at Bottom */}
          <div className="p-6 sm:p-8 pt-0 flex-shrink-0">
            <button
              onClick={handleClose}
              className="w-full py-3 px-4 bg-dark-neu-400 text-white font-semibold rounded-2xl shadow-dark-neu hover:shadow-dark-neu-lg transition-all duration-200 border border-dark-neu-200"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default WelcomePopup;
