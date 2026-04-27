import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { trackRoadmapClick } from '../utils/analytics';

const FEATURE_COPY = {
  'stripe-connect': {
    title: 'Stripe Connect',
    blurb: 'Direct payouts to mediators through Stripe Connect.',
  },
  'party-portal': {
    title: 'Party Portal',
    blurb: 'A guided experience for parties — case context, mediator matches, and education.',
  },
  'attorney-portal': {
    title: 'Attorney Portal',
    blurb: 'Conflict screening, smart matching, and saved mediator lists for attorneys.',
  },
};

const DEFAULT_COPY = {
  title: 'Coming soon',
  blurb: 'This feature is on the roadmap.',
};

const RoadmapPopup = ({ feature, source, open, onClose }) => {
  const { user } = useAuth();
  const copy = FEATURE_COPY[feature] || DEFAULT_COPY;

  useEffect(() => {
    if (open) trackRoadmapClick({ feature, source, action: 'open', user });
  }, [open, feature, source, user]);

  if (!open) return null;

  const handleNotify = () => {
    trackRoadmapClick({ feature, source, action: 'notify_me', user });
    onClose?.();
  };

  const handleDismiss = () => {
    trackRoadmapClick({ feature, source, action: 'dismiss', user });
    onClose?.();
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-md z-[8999]"
        onClick={handleDismiss}
      />
      <div className="fixed inset-0 flex items-center justify-center z-[9000] p-4">
        <div
          className="bg-gray-50 rounded-3xl shadow-neumorphic w-full max-w-md p-8 sm:p-10"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="roadmap-title"
        >
          <div className="flex justify-center mb-5">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 shadow-neumorphic-inset text-xs font-semibold tracking-wide text-slate-700 uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              In progress
            </span>
          </div>

          <h2
            id="roadmap-title"
            className="text-2xl sm:text-3xl font-bold text-gray-800 text-center mb-2"
          >
            {copy.title}
          </h2>
          <p className="text-sm text-gray-500 text-center mb-2">
            This feature is on our roadmap and currently in progress.
          </p>
          <p className="text-sm text-gray-600 text-center mb-7 leading-relaxed">
            {copy.blurb}
          </p>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleNotify}
              className="w-full py-3 px-4 bg-dark-neu-400 text-white font-semibold rounded-2xl shadow-dark-neu hover:shadow-dark-neu-lg transition-all duration-200 border border-dark-neu-200"
            >
              Notify me when it&apos;s ready
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-3 px-4 bg-gray-50 text-slate-700 font-medium rounded-2xl shadow-neumorphic hover:shadow-neumorphic-hover transition-all duration-200 text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default RoadmapPopup;
