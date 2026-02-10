import { useState, useEffect } from 'react';

const Onboarding = ({ shouldStart, onComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has seen the onboarding and welcome popup
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');

    // Show onboarding automatically after welcome popup is dismissed
    // OR if shouldStart is explicitly triggered
    if (!hasSeenOnboarding && (hasSeenWelcome || shouldStart)) {
      // Small delay to allow WelcomePopup to fully close first
      const timer = setTimeout(() => setIsOpen(true), 300);
      return () => clearTimeout(timer);
    }
  }, [shouldStart]); // Re-check when shouldStart changes or component mounts

  const handleSkip = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setIsOpen(false);
    // Scroll to top of page (especially important for mobile)
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
      title: "Quick Tour",
      content: "Let us show you how FairMediator works! This will only take a moment.",
      showSkip: true
    },
    {
      title: "1. Describe Your Case",
      content: "Start by chatting with our AI assistant. Describe your legal dispute, upload documents, and let us analyze the details of your case."
    },
    {
      title: "2. Get Matched",
      content: "Our AI analyzes political leanings, case complexity, and emotional factors to recommend mediators that best fit your specific situation."
    },
    {
      title: "3. Review & Select",
      content: "Browse mediators categorized by political alignment (Liberal, Moderate, Conservative) and filter by budget to find your perfect match."
    },
    {
      title: "Ready to Start!",
      content: "You're all set! Begin by describing your case in the chat panel, and we'll help you find the right mediator."
    }
  ];

  const currentStepData = steps[currentStep];

  return (
    <>
      {/* Backdrop - Blur and Darken */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50"
        onClick={handleSkip}
      />

      {/* Onboarding Popup */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 sm:p-6 md:p-8">
        <div
          className="bg-dark-neu-300 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] mx-auto flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-8 sm:p-10 md:p-12">
            <div className="text-center mb-8 flex flex-col items-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{currentStepData.title}</h2>
              <p className="text-white text-base sm:text-lg leading-relaxed text-center max-w-xl mx-auto">
                {currentStepData.content}
              </p>
            </div>

            {/* Progress Indicators */}
            <div className="flex justify-center gap-2 mb-6">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? 'w-8 bg-white'
                      : index < currentStep
                      ? 'w-2 bg-dark-neu-100'
                      : 'w-2 bg-dark-neu-500'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Fixed Buttons at Bottom */}
          <div className="flex gap-3 p-8 sm:p-10 md:p-12 pt-0 flex-shrink-0">
            {currentStepData.showSkip ? (
              <>
                <button
                  onClick={handleSkip}
                  className="flex-1 py-4 px-6 bg-dark-neu-400 text-white font-semibold text-base rounded-2xl border border-dark-neu-500 hover:bg-dark-neu-500 transition-all duration-200"
                >
                  Skip Tour
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 py-4 px-6 bg-white text-dark-neu-300 font-semibold text-base rounded-2xl shadow-lg hover:bg-neu-100 transition-all duration-200"
                >
                  Start Tour
                </button>
              </>
            ) : (
              <>
                {currentStep > 0 && (
                  <button
                    onClick={handlePrevious}
                    className="py-4 px-6 bg-dark-neu-400 text-white font-semibold text-base rounded-2xl border border-dark-neu-500 hover:bg-dark-neu-500 transition-all duration-200"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="flex-1 py-4 px-6 bg-white text-dark-neu-300 font-semibold text-base rounded-2xl shadow-lg hover:bg-neu-100 transition-all duration-200"
                >
                  {currentStep === steps.length - 1 ? "Get Started" : "Next"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Onboarding;
