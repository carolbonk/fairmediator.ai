import { useState, memo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaQuestionCircle } from 'react-icons/fa';

/**
 * Reusable Tooltip Component
 * Shows explanatory text on hover with a "?" icon
 * Consistent neumorphism styling across the platform
 * Memoized for performance - used frequently across app
 * Uses React Portal to render on top of everything
 */
const Tooltip = memo(({ text, position = 'top' }) => {
  const [show, setShow] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const tooltipRef = useRef(null);

  // Calculate tooltip position when shown
  useEffect(() => {
    if (show && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();

      let top = 0;
      let left = 0;

      const spacing = 12; // Gap between button and tooltip

      switch (position) {
        case 'top':
          top = rect.top - spacing;
          left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + spacing;
          left = rect.left + rect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - spacing;
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + spacing;
          break;
      }

      setTooltipPosition({ top, left });
    }
  }, [show, position]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="text-neu-500 hover:text-blue-500 transition-all duration-200 focus:outline-none focus:text-blue-500 rounded-full group inline-flex items-center"
        aria-label="More information"
      >
        <FaQuestionCircle className="text-base group-hover:scale-110 transition-transform duration-200" />
      </button>

      {show && createPortal(
        <div
          ref={tooltipRef}
          className="fixed z-[9999] animate-fade-in w-max max-w-[300px]"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: position === 'top' ? 'translate(-50%, -100%)' :
                      position === 'bottom' ? 'translate(-50%, 0)' :
                      position === 'left' ? 'translate(-100%, -50%)' :
                      'translate(0, -50%)'
          }}
        >
          {/* Dark tooltip card */}
          <div className="relative bg-dark-neu-300 rounded-xl shadow-dark-neu-lg px-4 py-3 border border-dark-neu-500">
            {/* Content - split on ⚠️ to create visual separation */}
            {(() => {
              const parts = text.split('⚠️');
              if (parts.length > 1) {
                return (
                  <>
                    <p className="text-xs leading-relaxed text-white/80 font-medium break-words">
                      {parts[0].trim()}
                    </p>
                    <div className="my-2 border-t border-white/20"></div>
                    <p className="text-xs leading-relaxed text-yellow-200 font-medium break-words">
                      <span className="mr-1">⚠️</span>
                      {parts[1].trim()}
                    </p>
                  </>
                );
              }
              return (
                <p className="text-xs leading-relaxed text-white/80 font-medium break-words">
                  {text}
                </p>
              );
            })()}


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
        </div>,
        document.body
      )}
    </>
  );
});

export default Tooltip;
