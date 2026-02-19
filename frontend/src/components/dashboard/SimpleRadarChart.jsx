/**
 * SimpleRadarChart - Pure SVG radar/spider chart
 * No external dependencies. Matches the existing dashboard chart style.
 *
 * Props:
 *   axes      — [{ label: string }]  (3-8 axes)
 *   series    — [{ name, color, values: number[] }]  values are 0-1 per axis
 *   size      — number (default 280)
 */

export default function SimpleRadarChart({ axes = [], series = [], size = 280 }) {
  if (!axes.length || !series.length) return null;

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.36; // radius of outermost ring
  const RINGS = 4;
  const n = axes.length;

  // Angle for axis i (start at top, clockwise)
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const polarToXY = (r, i) => ({
    x: cx + r * Math.cos(angle(i)),
    y: cy + r * Math.sin(angle(i)),
  });

  // Build polygon points for a series
  const polygonPoints = (values) =>
    values
      .map((v, i) => {
        const { x, y } = polarToXY(Math.max(0, Math.min(1, v)) * maxR, i);
        return `${x},${y}`;
      })
      .join(' ');

  // Ring grid lines
  const ringPolygon = (ratio) =>
    Array.from({ length: n }, (_, i) => {
      const { x, y } = polarToXY(ratio * maxR, i);
      return `${x},${y}`;
    }).join(' ');

  const COLORS = ['#667eea', '#f093fb', '#43e97b', '#fa709a', '#fee140'];

  return (
    <div
      className="rounded-2xl p-4 flex items-center justify-center"
      style={{
        background: '#F0F2F5',
        boxShadow: 'inset 2px 2px 4px rgba(163,177,198,0.3), inset -2px -2px 4px rgba(255,255,255,0.5)'
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label="Radar comparison chart"
        role="img"
      >
        {/* Grid rings */}
        {Array.from({ length: RINGS }, (_, ri) => (
          <polygon
            key={ri}
            points={ringPolygon((ri + 1) / RINGS)}
            fill="none"
            stroke="#D1D5DB"
            strokeWidth="0.8"
          />
        ))}

        {/* Axis lines */}
        {axes.map((_, i) => {
          const outer = polarToXY(maxR, i);
          return (
            <line
              key={i}
              x1={cx} y1={cy}
              x2={outer.x} y2={outer.y}
              stroke="#D1D5DB"
              strokeWidth="0.8"
            />
          );
        })}

        {/* Series polygons */}
        {series.map((s, si) => {
          const color = s.color || COLORS[si % COLORS.length];
          return (
            <g key={si}>
              <polygon
                points={polygonPoints(s.values)}
                fill={color}
                fillOpacity="0.15"
                stroke={color}
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {/* Dots at each vertex */}
              {s.values.map((v, i) => {
                const { x, y } = polarToXY(Math.max(0, Math.min(1, v)) * maxR, i);
                return (
                  <circle key={i} cx={x} cy={y} r="3.5" fill={color} stroke="#fff" strokeWidth="1">
                    <title>{axes[i]?.label}: {Math.round(v * 100)}%</title>
                  </circle>
                );
              })}
            </g>
          );
        })}

        {/* Axis labels */}
        {axes.map((ax, i) => {
          const labelR = maxR + 20;
          const { x, y } = polarToXY(labelR, i);
          const anchor = x < cx - 4 ? 'end' : x > cx + 4 ? 'start' : 'middle';
          return (
            <text
              key={i}
              x={x}
              y={y + 4}
              textAnchor={anchor}
              fontSize="10"
              fill="#6B7280"
              fontWeight="500"
            >
              {ax.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
