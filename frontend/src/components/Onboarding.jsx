import { useState, useEffect } from 'react';
import { FaArrowRight, FaArrowLeft, FaTimes } from 'react-icons/fa';

const Onboarding = ({ shouldStart, onComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');

    if (!hasSeenOnboarding && (hasSeenWelcome || shouldStart)) {
      const timer = setTimeout(() => setIsOpen(true), 300);
      return () => clearTimeout(timer);
    }
  }, [shouldStart]);

  const handleSkip = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setIsOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (onComplete) onComplete();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSkip();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  const steps = [
    {
      title: "Welcome to FairMediator",
      content: "Find the perfect mediator in 3 simple steps",
      icon: "👋",
      showSkip: true
    },
    {
      title: "Describe Your Case",
      content: "Chat with our AI or upload documents. We'll analyze the details instantly.",
      icon: "💬"
    },
    {
      title: "Get Matched",
      content: "AI analyzes case complexity and recommends mediators that fit your needs.",
      icon: "🎯"
    },
    {
      title: "Review & Select",
      content: "Browse by alignment, specialization, and budget to find your match.",
      icon: "✓"
    }
  ];

  const currentStepData = steps[currentStep];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={handleSkip}
      />

      {/* Onboarding Card - Modern & Compact */}
      <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
        <div
          className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md mx-auto flex flex-col overflow-hidden animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button - Top Right */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-neu-600 hover:text-neu-800 transition-colors rounded-full hover:bg-neu-100"
            aria-label="Close"
          >
            <FaTimes className="text-lg" />
          </button>

          {/* Content */}
          <div className="p-6 sm:p-8 pt-12 sm:pt-8">
            {/* Icon */}
            <div className="text-center mb-4">
              <div className="text-5xl sm:text-6xl mb-3">{currentStepData.icon}</div>
            </div>

            {/* Text */}
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-neu-800 mb-2">
                {currentStepData.title}
              </h2>
              <p className="text-sm sm:text-base text-neu-600 leading-relaxed">
                {currentStepData.content}
              </p>
            </div>

            {/* Progress Dots - Smaller and cleaner */}
            <div className="flex justify-center gap-1.5 mb-6">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? 'w-6 bg-blue-600'
                      : index < currentStep
                      ? 'w-1.5 bg-blue-300'
                      : 'w-1.5 bg-neu-300'
                  }`}
                />
              ))}
            </div>

            {/* Buttons - Compact and modern */}
            <div className="flex gap-2">
              {currentStepData.showSkip ? (
                <>
                  <button
                    onClick={handleSkip}
                    className="flex-1 py-3 px-4 text-neu-700 font-medium text-sm rounded-xl hover:bg-neu-100 transition-all"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2"
                  >
                    Start
                    <FaArrowRight className="text-xs" />
                  </button>
                </>
              ) : (
                <>
                  {currentStep > 0 && (
                    <button
                      onClick={handlePrevious}
                      className="py-3 px-4 text-neu-700 font-medium text-sm rounded-xl hover:bg-neu-100 transition-all flex items-center gap-2"
                    >
                      <FaArrowLeft className="text-xs" />
                      Back
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    className={`${
                      currentStep > 0 ? 'flex-1' : 'w-full'
                    } py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2`}
                  >
                    {currentStep === steps.length - 1 ? (
                      <>
                        Get Started
                        <FaArrowRight className="text-xs" />
                      </>
                    ) : (
                      <>
                        Next
                        <FaArrowRight className="text-xs" />
                      </>
                    )}
                  </button>
                </>
              )}
            </div>

            {/* Step counter - subtle */}
            <div className="text-center mt-4 text-xs text-neu-500">
              {currentStep + 1} of {steps.length}
            </div>
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

export default Onboarding;
