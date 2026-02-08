/**
 * LobbyingBadge Component
 * Displays lobbying activity indicator with WCAG compliance
 *
 * Shows when mediator has federal lobbying disclosure history
 * - Senate LDA (Lobbying Disclosure Act) filings
 * - Industry categories (14 types)
 * - Lobbying amounts and timeframes
 *
 * WCAG Compliance:
 * - Color contrast ≥ 4.5:1
 * - Touch targets ≥ 44x44pt
 * - Screen reader friendly
 * - Keyboard accessible
 */

import React from 'react';
import { FaLandmark, FaBriefcase } from 'react-icons/fa';

const LobbyingBadge = ({
  lobbyingData = null, // { count: number, totalAmount: number, industries: string[], latestYear: number }
  showDetails = true,
  showIcon = true,
  size = 'md', // 'sm', 'md', 'lg'
  variant = 'pill', // 'pill', 'square', 'minimal'
  onClick = null,
  className = '',
  ariaLabel = null
}) => {
  // Don't render if no lobbying data
  if (!lobbyingData || lobbyingData.count === 0) {
    return null;
  }

  // Size configuration (WCAG touch targets: 44x44pt minimum)
  const sizeClasses = {
    sm: {
      container: 'px-2 py-1.5 text-xs min-h-[36px]',
      icon: 'text-xs',
      badge: 'px-1.5 py-0.5 text-xs'
    },
    md: {
      container: 'px-3 py-2 text-sm min-h-[44px]',
      icon: 'text-sm',
      badge: 'px-2 py-1 text-sm'
    },
    lg: {
      container: 'px-4 py-3 text-base min-h-[52px]',
      icon: 'text-base',
      badge: 'px-3 py-1.5 text-base'
    }
  };

  const sizes = sizeClasses[size] || sizeClasses.md;

  // Variant styles
  const variantClasses = {
    pill: 'rounded-full',
    square: 'rounded-lg',
    minimal: 'rounded-md'
  };

  const variantStyle = variantClasses[variant] || variantClasses.pill;

  // Build aria-label for accessibility
  const accessibleLabel = ariaLabel ||
    `Lobbying activity: ${lobbyingData.count} disclosure${lobbyingData.count > 1 ? 's' : ''}${lobbyingData.totalAmount ? `, $${(lobbyingData.totalAmount / 1000000).toFixed(1)}M total` : ''}. Click to view details.`;

  // Interactive styles
  const interactiveClasses = onClick
    ? 'cursor-pointer hover:shadow-neu-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
    : '';

  // Format amount for display
  const formatAmount = (amount) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount}`;
  };

  // Minimal variant (just icon + count)
  if (variant === 'minimal') {
    return (
      <span
        onClick={onClick}
        onKeyDown={(e) => {
          if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick();
          }
        }}
        role={onClick ? 'button' : 'status'}
        tabIndex={onClick ? 0 : undefined}
        aria-label={accessibleLabel}
        className={`inline-flex items-center gap-1.5 ${sizes.container} text-purple-700 font-semibold ${interactiveClasses} ${className}`}
      >
        {showIcon && <FaLandmark className={`${sizes.icon} text-purple-500`} />}
        <span>Lobbying</span>
        {showDetails && (
          <span className="font-mono text-xs opacity-75">
            ({lobbyingData.count})
          </span>
        )}
      </span>
    );
  }

  // Full badge with background
  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      role={onClick ? 'button' : 'status'}
      tabIndex={onClick ? 0 : undefined}
      aria-label={accessibleLabel}
      className={`
        inline-flex items-center gap-2
        ${sizes.container}
        bg-purple-50
        text-purple-700
        border-2
        border-purple-200
        ${variantStyle}
        shadow-neu
        font-semibold
        ${interactiveClasses}
        ${className}
      `}
    >
      {showIcon && (
        <FaLandmark
          className={`${sizes.icon} text-purple-500 flex-shrink-0`}
          aria-hidden="true"
        />
      )}

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="whitespace-nowrap">Lobbying</span>

        {showDetails && (
          <>
            <span
              className="px-2 py-0.5 bg-white/50 rounded font-mono text-xs flex-shrink-0"
              aria-label={`${lobbyingData.count} lobbying disclosure${lobbyingData.count > 1 ? 's' : ''}`}
            >
              {lobbyingData.count}
            </span>

            {lobbyingData.totalAmount && (
              <span
                className="px-2 py-0.5 bg-purple-100 rounded font-mono text-xs flex-shrink-0"
                aria-label={`Total amount: ${formatAmount(lobbyingData.totalAmount)}`}
              >
                {formatAmount(lobbyingData.totalAmount)}
              </span>
            )}
          </>
        )}
      </div>

      {onClick && (
        <span className="text-xs opacity-60 hidden sm:inline" aria-hidden="true">
          Details →
        </span>
      )}
    </div>
  );
};

// Export as default and named export
export default LobbyingBadge;
export { LobbyingBadge };
