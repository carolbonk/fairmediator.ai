import { useState, useEffect } from 'react';

const Onboarding = ({ shouldStart, onComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has seen the onboarding before
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');

    if (shouldStart && !hasSeenOnboarding) {
      setIsOpen(true);
    }
  }, [shouldStart]);

  const handleSkip = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setIsOpen(false);
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
      <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
        <div
          className="bg-gray-50 rounded-3xl shadow-neumorphic p-8 max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">{currentStepData.title}</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
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
                    ? 'w-8 bg-blue-500'
                    : index < currentStep
                    ? 'w-2 bg-blue-300'
                    : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            {currentStepData.showSkip ? (
              <>
                <button
                  onClick={handleSkip}
                  className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 font-semibold rounded-2xl shadow-neumorphic-inset hover:shadow-neumorphic transition-all duration-200"
                >
                  Skip Tour
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 py-3 px-4 bg-dark-neu-400 text-white font-semibold rounded-2xl shadow-dark-neu hover:shadow-dark-neu-lg transition-all duration-200 border border-dark-neu-200"
                >
                  Start Tour
                </button>
              </>
            ) : (
              <>
                {currentStep > 0 && (
                  <button
                    onClick={handlePrevious}
                    className="py-3 px-6 bg-gray-200 text-gray-700 font-semibold rounded-2xl shadow-neumorphic-inset hover:shadow-neumorphic transition-all duration-200"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="flex-1 py-3 px-4 bg-dark-neu-400 text-white font-semibold rounded-2xl shadow-dark-neu hover:shadow-dark-neu-lg transition-all duration-200 border border-dark-neu-200"
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
