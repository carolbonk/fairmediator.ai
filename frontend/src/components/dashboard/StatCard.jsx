import React from 'react';

/**
 * StatCard - Reusable metric display card
 * DRY: Used across all dashboard views
 * Neomorphic design with gradient accents
 */
export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = '#667eea'
}) {
  const getTrendColor = () => {
    if (!trend) return '#6B7280';
    return trend > 0 ? '#10B981' : trend < 0 ? '#EF4444' : '#6B7280';
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    return trend > 0 ? '↑' : trend < 0 ? '↓' : '→';
  };

  return (
    <div
      className="rounded-2xl p-6 transition-all duration-200 hover:transform hover:scale-105"
      style={{
        background: '#F0F2F5',
        boxShadow: '8px 8px 16px rgba(163, 177, 198, 0.6), -8px -8px 16px rgba(255, 255, 255, 0.5)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#6B7280',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {title}
          </h3>
        </div>

        {Icon && (
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, ' + color + ' 0%, ' + color + 'CC 100%)',
              boxShadow: '4px 4px 12px ' + color + '40',
            }}
          >
            <Icon className="text-white text-xl" />
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-2">
        <span style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          color: '#111827',
          lineHeight: 1
        }}>
          {value}
        </span>
      </div>

      {/* Subtitle and Trend */}
      <div className="flex items-center justify-between">
        {subtitle && (
          <span style={{
            fontSize: '0.875rem',
            color: '#6B7280'
          }}>
            {subtitle}
          </span>
        )}

        {trend !== undefined && (
          <div className="flex items-center space-x-1">
            <span style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: getTrendColor()
            }}>
              {getTrendIcon()} {Math.abs(trend)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
