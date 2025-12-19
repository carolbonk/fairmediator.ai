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
      <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
        <div className="bg-gray-50 rounded-3xl shadow-neumorphic p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Welcome to FairMediator</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              AI-powered platform designed for the modular future of LawTech: aims to bring transparency and fairness to the mediator selection process screening & matching platform
            </p>
          </div>

          <button
            onClick={handleClose}
            className="w-full py-3 px-4 bg-dark-neu-400 text-white font-semibold rounded-2xl shadow-dark-neu hover:shadow-dark-neu-lg transition-all duration-200 border border-dark-neu-200"
          >
            Get Started
          </button>
        </div>
      </div>
    </>
  );
};

export default WelcomePopup;
