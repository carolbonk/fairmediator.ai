import React from 'react';

/**
 * SimpleBarChart - Lightweight bar chart visualization
 * DRY: Reusable for categorical data comparison
 * No external dependencies, pure SVG
 */
export default function SimpleBarChart({
  data = [],
  height = 300,
  barColor = '#667eea',
  showValues = true,
  horizontal = false
}) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl"
        style={{
          height: height + 'px',
          background: '#F0F2F5',
          boxShadow: 'inset 2px 2px 4px rgba(163, 177, 198, 0.3), inset -2px -2px 4px rgba(255, 255, 255, 0.5)'
        }}
      >
        <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>No data available</p>
      </div>
    );
  }

  const width = 600;
  const padding = { top: 20, right: 20, bottom: 50, left: 80 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Find max value
  const maxValue = Math.max(...data.map(d => d.value));

  // Color palette for multiple bars
  const colors = [
    '#667eea', '#764ba2', '#f093fb', '#4facfe',
    '#43e97b', '#fa709a', '#fee140', '#30cfd0'
  ];

  if (!horizontal) {
    // Vertical bars
    const barWidth = chartWidth / data.length * 0.7;
    const barSpacing = chartWidth / data.length;

    return (
      <div
        className="rounded-2xl p-4"
        style={{
          background: '#F0F2F5',
          boxShadow: 'inset 2px 2px 4px rgba(163, 177, 198, 0.3), inset -2px -2px 4px rgba(255, 255, 255, 0.5)'
        }}
      >
        <svg width="100%" height={height} viewBox={'0 0 ' + width + ' ' + height} preserveAspectRatio="xMidYMid meet">
          {/* Bars */}
          {data.map((item, index) => {
            const barHeight = (item.value / maxValue) * chartHeight;
            const x = padding.left + index * barSpacing + (barSpacing - barWidth) / 2;
            const y = padding.top + chartHeight - barHeight;
            const color = item.color || colors[index % colors.length];

            return (
              <g key={index}>
                {/* Bar with gradient */}
                <defs>
                  <linearGradient id={'gradient-' + index} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: color, stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: color + 'CC', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>

                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={'url(#gradient-' + index + ')'}
                  rx="4"
                />

                {/* Value on top */}
                {showValues && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 5}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="600"
                    fill="#374151"
                  >
                    {item.value}
                  </text>
                )}

                {/* Label */}
                <text
                  x={x + barWidth / 2}
                  y={height - padding.bottom + 20}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#6B7280"
                >
                  {item.label.length > 10 ? item.label.substring(0, 10) + '...' : item.label}
                </text>

                {/* Tooltip */}
                <title>{item.label + ': ' + item.value}</title>
              </g>
            );
          })}

          {/* Y-axis */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={height - padding.bottom}
            stroke="#D1D5DB"
            strokeWidth="2"
          />

          {/* Y-axis labels */}
          {[0, 0.5, 1].map((ratio, index) => {
            const value = Math.round(maxValue * ratio);
            const y = padding.top + chartHeight * (1 - ratio);
            return (
              <text
                key={index}
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="12"
                fill="#6B7280"
              >
                {value}
              </text>
            );
          })}
        </svg>
      </div>
    );
  } else {
    // Horizontal bars
    const barHeight = chartHeight / data.length * 0.7;
    const barSpacing = chartHeight / data.length;

    return (
      <div
        className="rounded-2xl p-4"
        style={{
          background: '#F0F2F5',
          boxShadow: 'inset 2px 2px 4px rgba(163, 177, 198, 0.3), inset -2px -2px 4px rgba(255, 255, 255, 0.5)'
        }}
      >
        <svg width="100%" height={height} viewBox={'0 0 ' + width + ' ' + height} preserveAspectRatio="xMidYMid meet">
          {/* Bars */}
          {data.map((item, index) => {
            const barWidth = (item.value / maxValue) * chartWidth;
            const x = padding.left;
            const y = padding.top + index * barSpacing + (barSpacing - barHeight) / 2;
            const color = item.color || colors[index % colors.length];

            return (
              <g key={index}>
                {/* Bar with gradient */}
                <defs>
                  <linearGradient id={'h-gradient-' + index} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: color, stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: color + 'CC', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>

                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={'url(#h-gradient-' + index + ')'}
                  rx="4"
                />

                {/* Value */}
                {showValues && (
                  <text
                    x={x + barWidth + 10}
                    y={y + barHeight / 2 + 4}
                    fontSize="12"
                    fontWeight="600"
                    fill="#374151"
                  >
                    {item.value}
                  </text>
                )}

                {/* Label */}
                <text
                  x={padding.left - 10}
                  y={y + barHeight / 2 + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill="#6B7280"
                >
                  {item.label}
                </text>

                {/* Tooltip */}
                <title>{item.label + ': ' + item.value}</title>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }
}
