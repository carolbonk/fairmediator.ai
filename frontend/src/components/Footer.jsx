import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-dark-neu-300 shadow-dark-neu-lg border-t border-dark-neu-500 mt-auto">
      {/* Top accent line */}
      <div className="h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30"></div>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Tagline + Copyright - Left/Center on mobile */}
          <div className="text-center sm:text-left">
            {/* Tagline - Mobile/Tablet only (hidden on desktop where it shows in navbar) */}
            <p className="lg:hidden text-white text-xs opacity-60">
              Intelligent Mediator Matching & Screening Platform
            </p>
            <p className="text-white text-xs opacity-60 lg:mt-0 mt-0.5">
              © 2025 - 2026 FairMediator.AI.
            </p>
            <p className="text-white text-xs opacity-60">
              All rights reserved.
            </p>
          </div>

          {/* Links - Right - Always Column */}
          <div className="flex flex-col items-center sm:items-end gap-1.5">
            <Link
              to="/mediators/apply"
              className="text-white text-xs opacity-70 hover:opacity-100 transition-opacity underline"
            >
              Are you a Mediator? Join us!
            </Link>
            <Link
              to="/mediators"
              className="text-white text-xs opacity-70 hover:opacity-100 transition-opacity underline"
            >
              Mediators Across America
            </Link>
            <Link
              to="/safeguards"
              className="text-white text-xs opacity-70 hover:opacity-100 transition-opacity underline"
            >
              How We Protect Your Mediation
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
