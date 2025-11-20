import { useState } from 'react';
import { FaQuestionCircle } from 'react-icons/fa';

/**
 * Reusable Tooltip Component
 * Shows explanatory text on hover with a "?" icon
 * Consistent neumorphism styling across the platform
 */
const Tooltip = ({ text, position = 'top' }) => {
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
          className={`absolute ${positionClasses[position]} z-50 animate-fade-in`}
          style={{ width: '300px' }}
        >
          {/* Neumorphism tooltip card */}
          <div className="relative bg-neu-100 rounded-2xl shadow-neu-lg p-4 border border-neu-200">
            {/* Content */}
            <p className="text-xs leading-relaxed text-neu-700 font-medium break-words overflow-wrap-anywhere">
              {text}
            </p>

            {/* Arrow indicator based on position */}
            {position === 'top' && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                <div className="w-3 h-3 bg-neu-100 border-r border-b border-neu-200 transform rotate-45"></div>
              </div>
            )}
            {position === 'bottom' && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1">
                <div className="w-3 h-3 bg-neu-100 border-l border-t border-neu-200 transform rotate-45"></div>
              </div>
            )}
            {position === 'left' && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-1">
                <div className="w-3 h-3 bg-neu-100 border-t border-r border-neu-200 transform rotate-45"></div>
              </div>
            )}
            {position === 'right' && (
              <div className="absolute right-full top-1/2 -translate-y-1/2 -mr-1">
                <div className="w-3 h-3 bg-neu-100 border-b border-l border-neu-200 transform rotate-45"></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
