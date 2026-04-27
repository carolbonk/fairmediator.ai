import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
// TODO(human): Import the CSS module styles

/**
 * TwoColumnLayout Component
 *
 * Provides independent scrolling for left and right columns on desktop screens.
 * On mobile (< 768px), columns stack vertically with normal scrolling.
 *
 * Features:
 * - Independent scroll contexts for each column
 * - Scroll only activates when cursor is over a specific column
 * - Responsive: stacks on mobile, side-by-side on desktop
 * - Configurable column widths and gaps
 */
const TwoColumnLayout = ({
  leftContent,
  rightContent,
  leftWidth = '1fr',
  rightWidth = '1fr',
  gap = '1.5rem',
  className = '',
  leftClassName = '',
  rightClassName = '',
  mobileBreakpoint = '768px'
}) => {
  const leftColumnRef = useRef(null);
  const rightColumnRef = useRef(null);

  useEffect(() => {
    // Function to handle wheel events with better performance
    const handleWheel = (e, columnRef) => {
      const column = columnRef.current;
      if (!column) return;

      // Check if the column can scroll
      const canScroll = column.scrollHeight > column.clientHeight;
      if (!canScroll) return;

      // Check if we're at the boundaries
      const isAtTop = column.scrollTop === 0;
      const isAtBottom = Math.ceil(column.scrollTop + column.clientHeight) >= column.scrollHeight;

      // Prevent default only if we can scroll in the direction of the wheel
      if ((e.deltaY < 0 && !isAtTop) || (e.deltaY > 0 && !isAtBottom)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Add wheel event listeners to each column
    const leftColumn = leftColumnRef.current;
    const rightColumn = rightColumnRef.current;

    const handleLeftWheel = (e) => handleWheel(e, leftColumnRef);
    const handleRightWheel = (e) => handleWheel(e, rightColumnRef);

    if (leftColumn) {
      leftColumn.addEventListener('wheel', handleLeftWheel, { passive: false });
    }
    if (rightColumn) {
      rightColumn.addEventListener('wheel', handleRightWheel, { passive: false });
    }

    // Cleanup
    return () => {
      if (leftColumn) {
        leftColumn.removeEventListener('wheel', handleLeftWheel);
      }
      if (rightColumn) {
        rightColumn.removeEventListener('wheel', handleRightWheel);
      }
    };
  }, []);

  return (
    <div
      className={`two-column-layout ${className}`}
      style={{
        '--left-width': leftWidth,
        '--right-width': rightWidth,
        '--column-gap': gap,
        '--mobile-breakpoint': mobileBreakpoint
      }}
    >
      {/* Left Column */}
      <div
        ref={leftColumnRef}
        className={`column-left ${leftClassName}`}
        data-column="left"
      >
        {leftContent}
      </div>

      {/* Right Column */}
      <div
        ref={rightColumnRef}
        className={`column-right ${rightClassName}`}
        data-column="right"
      >
        {rightContent}
      </div>

      {/* Styles */}
      <style jsx>{`
        .two-column-layout {
          display: grid;
          grid-template-columns: var(--left-width) var(--right-width);
          gap: var(--column-gap);
          height: calc(100vh - 120px); /* Adjust based on header/footer height */
          position: relative;
          overflow: hidden; /* Prevent parent scrolling */
        }

        .column-left,
        .column-right {
          overflow-y: auto;
          overflow-x: hidden;
          height: 100%;
          position: relative;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
        }

        /* Custom scrollbar for better UX */
        .column-left::-webkit-scrollbar,
        .column-right::-webkit-scrollbar {
          width: 8px;
        }

        .column-left::-webkit-scrollbar-track,
        .column-right::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 4px;
        }

        .column-left::-webkit-scrollbar-thumb,
        .column-right::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }

        .column-left::-webkit-scrollbar-thumb:hover,
        .column-right::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }

        /* Visual feedback on hover */
        .column-left:hover,
        .column-right:hover {
          box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.1);
        }

        /* Mobile responsive - stack columns */
        @media (max-width: 767px) {
          .two-column-layout {
            display: block;
            height: auto;
            overflow: visible;
          }

          .column-left,
          .column-right {
            overflow-y: visible;
            height: auto;
            margin-bottom: var(--column-gap);
          }

          .column-left::-webkit-scrollbar,
          .column-right::-webkit-scrollbar {
            display: none;
          }
        }

        /* Firefox scrollbar support */
        .column-left,
        .column-right {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.05);
        }

        /* Prevent text selection while scrolling */
        .column-left.scrolling,
        .column-right.scrolling {
          user-select: none;
        }
      `}</style>
    </div>
  );
};

TwoColumnLayout.propTypes = {
  leftContent: PropTypes.node.isRequired,
  rightContent: PropTypes.node.isRequired,
  leftWidth: PropTypes.string,
  rightWidth: PropTypes.string,
  gap: PropTypes.string,
  className: PropTypes.string,
  leftClassName: PropTypes.string,
  rightClassName: PropTypes.string,
  mobileBreakpoint: PropTypes.string
};

export default TwoColumnLayout;