import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-dark-neu-300 shadow-dark-neu-lg border-t border-dark-neu-500 mt-auto">
      {/* Top accent line */}
      <div className="h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30"></div>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Copyright - Left/Center on mobile */}
          <p className="text-white text-sm opacity-70 text-center sm:text-left">
            © 2025 - 2026 FairMediator.AI. All rights reserved.
          </p>

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
