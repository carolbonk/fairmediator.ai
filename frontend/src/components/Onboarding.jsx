import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const Onboarding = ({ shouldStart, onComplete }) => {
  const { t } = useTranslation();
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

  const stepsData = t('onboarding.steps', { returnObjects: true });
  const steps = Array.isArray(stepsData)
    ? stepsData.map((step, i) => ({ ...step, showSkip: i === 0 }))
    : [];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={handleSkip}
      />

      {/* Onboarding Card */}
      <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
        <div
          className="bg-dark-neu-300 rounded-t-2xl sm:rounded-2xl shadow-dark-neu-lg w-full sm:max-w-lg mx-auto overflow-hidden animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top accent bar */}
          <div className="h-0.5 bg-blue-500 w-full" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-4 border-b border-dark-neu-500">
            <span className="text-xs font-semibold tracking-widest text-blue-400 uppercase">
              {currentStepData.label}
            </span>
            <button
              onClick={handleSkip}
              className="text-xs text-white/50 hover:text-white/80 transition-colors"
              aria-label={t('onboarding.dismiss')}
            >
              {t('onboarding.dismiss')}
            </button>
          </div>

          {/* Content */}
          <div className="px-5 sm:px-6 py-5 sm:py-6">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-3 leading-snug">
              {currentStepData.title}
            </h2>
            <p className="text-sm text-white/70 leading-relaxed">
              {currentStepData.content}
            </p>
          </div>

          {/* Progress bar */}
          <div className="px-5 sm:px-6">
            <div className="h-px bg-dark-neu-500 w-full">
              <div
                className="h-px bg-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4">
            <span className="text-xs text-white/40">
              {currentStep + 1} / {steps.length}
            </span>
            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-4 py-2 text-sm text-white/60 hover:text-white font-medium transition-colors"
                >
                  {t('onboarding.back')}
                </button>
              )}
              {currentStepData.showSkip && (
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 text-sm text-white/40 hover:text-white/60 font-medium transition-colors"
                >
                  {t('onboarding.skip')}
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-5 py-2 text-sm bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                {currentStep === steps.length - 1 ? t('onboarding.getStarted') : t('onboarding.continue')}
              </button>
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
          animation: slide-up 0.25s ease-out;
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
