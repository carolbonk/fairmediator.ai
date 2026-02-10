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
          className="bg-dark-neu-300 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] mx-auto flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-8 sm:p-10 md:p-12">
            <div className="text-center mb-8 flex flex-col items-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Welcome to FairMediator</h2>
              <p className="text-white text-base sm:text-lg leading-relaxed text-center max-w-xl">
                Platform designed for transparent and fair mediator selection with screening & matching
              </p>
            </div>

            {/* Privacy Information */}
            <div className="mt-8 p-6 bg-dark-neu-400/50 rounded-2xl border border-dark-neu-500">
              <p className="text-white text-base leading-relaxed text-center font-medium">
                We do value your privacy.
              </p>
              <p className="text-slate-200 text-base leading-relaxed text-center mt-4">
                Every dispute in production stays confidential, protected by strong security safeguards, and all conversation data is automatically deleted 30 days after your case reaches an attempted outcome.
              </p>
            </div>
          </div>

          {/* Fixed Button at Bottom */}
          <div className="p-8 sm:p-10 md:p-12 pt-0 flex-shrink-0">
            <button
              onClick={handleClose}
              className="w-full py-4 px-6 bg-white text-slate-800 font-semibold text-lg rounded-2xl shadow-lg hover:bg-slate-100 transition-all duration-200"
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
