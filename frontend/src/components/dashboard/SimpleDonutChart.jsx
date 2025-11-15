import React from 'react';

/**
 * SimpleDonutChart - Lightweight donut/pie chart visualization
 * DRY: Reusable for proportional data
 * No external dependencies, pure SVG
 */
export default function SimpleDonutChart({
  data = [],
  size = 200,
  innerRadius = 0.6,
  showLegend = true,
  showPercentages = true
}) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl"
        style={{
          height: size + 'px',
          background: '#F0F2F5',
          boxShadow: 'inset 2px 2px 4px rgba(163, 177, 198, 0.3), inset -2px -2px 4px rgba(255, 255, 255, 0.5)'
        }}
      >
        <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>No data available</p>
      </div>
    );
  }

  const colors = [
    '#667eea', '#764ba2', '#f093fb', '#4facfe',
    '#43e97b', '#fa709a', '#fee140', '#30cfd0'
  ];

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = Math.min(size / 2, size / 2) - 20;

  // Calculate arc paths
  let currentAngle = -90; // Start at top
  const slices = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    // Convert angles to radians
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    // Calculate outer arc points
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    // Calculate inner arc points
    const innerR = radius * innerRadius;
    const x3 = centerX + innerR * Math.cos(endRad);
    const y3 = centerY + innerR * Math.sin(endRad);
    const x4 = centerX + innerR * Math.cos(startRad);
    const y4 = centerY + innerR * Math.sin(startRad);

    const largeArc = angle > 180 ? 1 : 0;

    const path = [
      'M', x1, y1,
      'A', radius, radius, 0, largeArc, 1, x2, y2,
      'L', x3, y3,
      'A', innerR, innerR, 0, largeArc, 0, x4, y4,
      'Z'
    ].join(' ');

    // Calculate label position (middle of arc)
    const midAngle = (startAngle + endAngle) / 2;
    const midRad = (midAngle * Math.PI) / 180;
    const labelRadius = radius * 0.75;
    const labelX = centerX + labelRadius * Math.cos(midRad);
    const labelY = centerY + labelRadius * Math.sin(midRad);

    return {
      path,
      color: item.color || colors[index % colors.length],
      label: item.label,
      value: item.value,
      percentage: percentage.toFixed(1),
      labelX,
      labelY
    };
  });

  return (
    <div className="flex flex-col items-center">
      <div
        className="rounded-2xl p-4"
        style={{
          background: '#F0F2F5',
          boxShadow: 'inset 2px 2px 4px rgba(163, 177, 198, 0.3), inset -2px -2px 4px rgba(255, 255, 255, 0.5)'
        }}
      >
        <svg width={size} height={size}>
          {/* Slices */}
          {slices.map((slice, index) => (
            <g key={index}>
              <defs>
                <linearGradient id={'donut-gradient-' + index} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: slice.color, stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: slice.color + 'CC', stopOpacity: 1 }} />
                </linearGradient>
              </defs>

              <path
                d={slice.path}
                fill={'url(#donut-gradient-' + index + ')'}
                stroke="#F0F2F5"
                strokeWidth="2"
                className="transition-all duration-200 hover:opacity-80"
              />

              {/* Percentage labels on slices */}
              {showPercentages && parseFloat(slice.percentage) > 5 && (
                <text
                  x={slice.labelX}
                  y={slice.labelY}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="700"
                  fill="#FFFFFF"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  {slice.percentage}%
                </text>
              )}

              {/* Tooltip */}
              <title>{slice.label + ': ' + slice.value + ' (' + slice.percentage + '%)'}</title>
            </g>
          ))}

          {/* Center circle for total */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius * innerRadius - 5}
            fill="#F0F2F5"
          />

          <text
            x={centerX}
            y={centerY - 10}
            textAnchor="middle"
            fontSize="12"
            fill="#6B7280"
            fontWeight="600"
          >
            TOTAL
          </text>
          <text
            x={centerX}
            y={centerY + 15}
            textAnchor="middle"
            fontSize="24"
            fill="#111827"
            fontWeight="800"
          >
            {total}
          </text>
        </svg>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="mt-4 flex flex-wrap gap-3 justify-center">
          {slices.map((slice, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '3px',
                  background: slice.color
                }}
              />
              <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                {slice.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
