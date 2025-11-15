import React from 'react';

/**
 * SimpleLineChart - Lightweight time series visualization
 * DRY: Reusable for any time-series data
 * No external dependencies, pure SVG
 */
export default function SimpleLineChart({
  data = [],
  height = 200,
  lineColor = '#667eea',
  fillColor = '#667eea20',
  showGrid = true,
  showDots = true
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
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Find min/max values
  const values = data.map(d => d.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const valueRange = maxValue - minValue || 1;

  // Calculate points
  const points = data.map((item, index) => {
    const x = padding.left + (index / (data.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - ((item.value - minValue) / valueRange) * chartHeight;
    return { x, y, ...item };
  });

  // Create path for line
  const linePath = points.map((point, index) =>
    (index === 0 ? 'M' : 'L') + ' ' + point.x + ' ' + point.y
  ).join(' ');

  // Create path for filled area
  const areaPath = linePath +
    ' L ' + points[points.length - 1].x + ' ' + (height - padding.bottom) +
    ' L ' + padding.left + ' ' + (height - padding.bottom) +
    ' Z';

  // Grid lines
  const gridLines = showGrid ? [0, 0.25, 0.5, 0.75, 1].map(ratio =>
    padding.top + chartHeight * (1 - ratio)
  ) : [];

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: '#F0F2F5',
        boxShadow: 'inset 2px 2px 4px rgba(163, 177, 198, 0.3), inset -2px -2px 4px rgba(255, 255, 255, 0.5)'
      }}
    >
      <svg width="100%" height={height} viewBox={'0 0 ' + width + ' ' + height} preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {showGrid && gridLines.map((y, index) => (
          <line
            key={index}
            x1={padding.left}
            y1={y}
            x2={width - padding.right}
            y2={y}
            stroke="#D1D5DB"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}

        {/* Area fill */}
        <path
          d={areaPath}
          fill={fillColor}
          opacity="0.3"
        />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {showDots && points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              fill={lineColor}
              stroke="#FFFFFF"
              strokeWidth="2"
            />
            {/* Tooltip on hover */}
            <title>{point.label + ': ' + point.value}</title>
          </g>
        ))}

        {/* X-axis labels */}
        {data.map((item, index) => {
          const x = padding.left + (index / (data.length - 1)) * chartWidth;
          return (
            <text
              key={index}
              x={x}
              y={height - padding.bottom + 20}
              textAnchor="middle"
              fontSize="12"
              fill="#6B7280"
            >
              {item.label}
            </text>
          );
        })}

        {/* Y-axis labels */}
        {[0, 0.5, 1].map((ratio, index) => {
          const value = Math.round(minValue + valueRange * ratio);
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
}
