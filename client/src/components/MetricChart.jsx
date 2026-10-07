import React, { useState } from 'react';

export function MetricChart({ data = [], metricType = 'heart_rate', unit = 'bpm', color = '#0ea5e9' }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div style={{
        height: '220px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-muted)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--text-muted)'
      }}>
        <p>No metric readings recorded yet.</p>
        <span style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Log your first measurement to view trends.</span>
      </div>
    );
  }

  const width = 600;
  const height = 220;
  const padding = { top: 25, right: 30, bottom: 35, left: 45 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Extract values
  const primaryValues = data.map(d => d.metric_value);
  const secondaryValues = data.map(d => d.secondary_value).filter(v => v !== null && v !== undefined);
  const allValues = [...primaryValues, ...secondaryValues];

  const minVal = Math.max(0, Math.min(...allValues) * 0.85);
  const maxVal = Math.max(...allValues) * 1.15 || 100;

  const getX = (index) => {
    if (data.length === 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (val) => {
    return padding.top + chartHeight - ((val - minVal) / (maxVal - minVal || 1)) * chartHeight;
  };

  // Generate primary path
  const primaryPoints = data.map((d, i) => `${getX(i)},${getY(d.metric_value)}`).join(' ');
  const areaPoints = `${getX(0)},${padding.top + chartHeight} ${primaryPoints} ${getX(data.length - 1)},${padding.top + chartHeight}`;

  const hasSecondary = data.some(d => d.secondary_value !== null && d.secondary_value !== undefined);
  const secondaryPoints = hasSecondary
    ? data.map((d, i) => `${getX(i)},${getY(d.secondary_value || 0)}`).join(' ')
    : '';

  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <defs>
          <linearGradient id="primaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 0.33, 0.66, 1].map((pct, i) => {
          const y = padding.top + chartHeight * (1 - pct);
          const val = Math.round(minVal + (maxVal - minVal) * pct);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="var(--border-subtle)"
                strokeDasharray="3 3"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="var(--text-muted)"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Shaded Area */}
        <polygon points={areaPoints} fill="url(#primaryAreaGrad)" />

        {/* Primary Line */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={primaryPoints}
        />

        {/* Secondary Line if present (e.g. Diastolic) */}
        {hasSecondary && (
          <polyline
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            strokeDasharray="4 4"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={secondaryPoints}
          />
        )}

        {/* Data points */}
        {data.map((d, i) => {
          const x = getX(i);
          const y = getY(d.metric_value);
          const isHovered = hoveredIndex === i;

          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={x}
                cy={y}
                r={isHovered ? 6 : 4}
                fill="var(--bg-surface)"
                stroke={color}
                strokeWidth={isHovered ? 3 : 2}
              />
              {/* Date label on x-axis */}
              <text
                x={x}
                y={height - 10}
                textAnchor="middle"
                fontSize="9"
                fill="var(--text-muted)"
              >
                {new Date(d.recorded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating tooltip */}
      {hoveredIndex !== null && data[hoveredIndex] && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '15px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.4rem 0.75rem',
            boxShadow: 'var(--shadow-sm)',
            fontSize: '0.825rem',
            pointerEvents: 'none'
          }}
        >
          <strong>
            {data[hoveredIndex].metric_value} {unit}
          </strong>
          {data[hoveredIndex].secondary_value && (
            <span style={{ color: '#6366f1' }}>
              {' '}/ {data[hoveredIndex].secondary_value} {unit}
            </span>
          )}
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            {new Date(data[hoveredIndex].recorded_at).toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  );
}
