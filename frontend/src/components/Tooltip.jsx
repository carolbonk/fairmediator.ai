import { useState, memo } from 'react';
import { FaQuestionCircle } from 'react-icons/fa';

/**
 * Reusable Tooltip Component
 * Shows explanatory text on hover with a "?" icon
 * Consistent neumorphism styling across the platform
 * Memoized for performance - used frequently across app
 */
const Tooltip = memo(({ text, position = 'top' }) => {
  const [show, setShow] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-3',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-3',
    left: 'right-full top-1/2 -translate-y-1/2 mr-3',
    right: 'left-full top-1/2 -translate-y-1/2 ml-3'
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="text-neu-500 hover:text-blue-500 transition-all duration-200 focus:outline-none focus:text-blue-500 rounded-full group"
        aria-label="More information"
      >
        <FaQuestionCircle className="text-base group-hover:scale-110 transition-transform duration-200" />
      </button>

      {show && (
        <div
          className={`absolute ${positionClasses[position]} z-50 animate-fade-in w-max max-w-[220px]`}
        >
          {/* Dark tooltip card */}
          <div className="relative bg-dark-neu-300 rounded-xl shadow-dark-neu-lg px-3 py-2 border border-dark-neu-500">
            {/* Content */}
            <p className="text-xs leading-relaxed text-white/80 font-medium break-words">
              {text}
            </p>

            {/* Arrow indicator based on position */}
            {position === 'top' && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                <div className="w-3 h-3 bg-dark-neu-300 border-r border-b border-dark-neu-500 transform rotate-45"></div>
              </div>
            )}
            {position === 'bottom' && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1">
                <div className="w-3 h-3 bg-dark-neu-300 border-l border-t border-dark-neu-500 transform rotate-45"></div>
              </div>
            )}
            {position === 'left' && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-1">
                <div className="w-3 h-3 bg-dark-neu-300 border-t border-r border-dark-neu-500 transform rotate-45"></div>
              </div>
            )}
            {position === 'right' && (
              <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-1">
                <div className="w-3 h-3 bg-dark-neu-300 border-b border-l border-dark-neu-500 transform rotate-45"></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default Tooltip;
