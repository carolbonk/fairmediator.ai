/**
 * ConflictBadge Component
 * Displays color-coded conflict risk indicators with WCAG compliance
 *
 * Risk Levels:
 * - GREEN (<8 points): Clear - No significant conflicts
 * - YELLOW (8-15 points): Caution - Review recommended
 * - RED (>15 points): High Risk - Recusal recommended
 *
 * WCAG Compliance:
 * - Color contrast ≥ 4.5:1
 * - Touch targets ≥ 44x44pt
 * - Screen reader friendly
 * - Keyboard accessible
 */

import React from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';

const ConflictBadge = ({
  riskLevel,
  riskScore = 0,
  showScore = true,
  showIcon = true,
  size = 'md', // 'sm', 'md', 'lg'
  variant = 'pill', // 'pill', 'square', 'minimal'
  onClick = null,
  className = '',
  ariaLabel = null
}) => {
  // Risk level configuration
  const getRiskConfig = () => {
    switch (riskLevel?.toUpperCase()) {
      case 'GREEN':
        return {
          label: 'Clear',
          icon: FaCheckCircle,
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
          iconColor: 'text-green-500',
          description: 'No significant conflicts detected'
        };
      case 'YELLOW':
        return {
          label: 'Caution',
          icon: FaExclamationTriangle,
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-500',
          description: 'Review recommended'
        };
      case 'RED':
        return {
          label: 'High Risk',
          icon: FaTimesCircle,
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
          iconColor: 'text-red-500',
          description: 'Recusal recommended'
        };
      default:
        return {
          label: 'Unknown',
          icon: FaInfoCircle,
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
          iconColor: 'text-gray-500',
          description: 'Status unknown'
        };
    }
  };

  const config = getRiskConfig();
  const Icon = config.icon;

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
    `Conflict risk: ${config.label}${showScore ? `, score ${riskScore}` : ''}. ${config.description}`;

  // Interactive styles
  const interactiveClasses = onClick
    ? 'cursor-pointer hover:shadow-neu-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
    : '';

  // Minimal variant (just icon + label)
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
        className={`inline-flex items-center gap-1.5 ${sizes.container} ${config.textColor} font-semibold ${interactiveClasses} ${className}`}
      >
        {showIcon && <Icon className={`${sizes.icon} ${config.iconColor}`} />}
        <span>{config.label}</span>
        {showScore && (
          <span className="font-mono text-xs opacity-75">
            ({riskScore})
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
        ${config.bgColor}
        ${config.textColor}
        ${config.borderColor}
        border-2
        ${variantStyle}
        shadow-neu
        font-semibold
        ${interactiveClasses}
        ${className}
      `}
    >
      {showIcon && (
        <Icon
          className={`${sizes.icon} ${config.iconColor} flex-shrink-0`}
          aria-hidden="true"
        />
      )}

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="whitespace-nowrap">{config.label}</span>

        {showScore && (
          <span
            className="px-2 py-0.5 bg-white/50 rounded font-mono text-xs flex-shrink-0"
            aria-label={`Risk score ${riskScore} out of 100`}
          >
            {riskScore}
          </span>
        )}
      </div>
    </div>
  );
};

// Export as default and named export
export default ConflictBadge;
export { ConflictBadge };
