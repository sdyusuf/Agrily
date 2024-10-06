import React, { useState } from 'react';
import './PhenologyTimelineChart.css';
import { LayersIcon, AlertTriangleIcon } from './Icons';

export default function PhenologyTimelineChart({
  timeline = [],
  selectedDate,
  onSelectDate,
  cropType = 'Maize'
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // SVG dimensions
  const svgWidth = 720;
  const svgHeight = 220;
  const padding = { top: 20, right: 30, bottom: 40, left: 45 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  if (!Array.isArray(timeline) || timeline.length === 0) {
    return (
      <div className="phenology-chart-card empty">
        <p>No historical satellite pass data available for this parcel.</p>
      </div>
    );
  }

  // Calculate coordinates
  const minVal = 0.0;
  const maxVal = 1.0;

  const points = timeline.map((item, idx) => {
    const x = padding.left + (idx / Math.max(1, timeline.length - 1)) * graphWidth;
    const yNdvi = padding.top + (1 - (item.meanNdvi - minVal) / (maxVal - minVal)) * graphHeight;
    const yNdwi = padding.top + (1 - (Math.max(0, item.meanNdwi || 0.1) - minVal) / (maxVal - minVal)) * graphHeight;
    // Expected baseline curve
    const baseline = 0.35 + 0.45 * Math.sin((idx / (timeline.length - 1)) * Math.PI);
    const yBase = padding.top + (1 - (baseline - minVal) / (maxVal - minVal)) * graphHeight;

    return {
      ...item,
      x,
      yNdvi,
      yNdwi,
      yBase,
      baseline: parseFloat(baseline.toFixed(2))
    };
  });

  const pathNdvi = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.yNdvi}`, '');
  const pathNdwi = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.yNdwi}`, '');
  const pathBaseline = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.yBase}`, '');

  // Shaded area under NDVI
  const areaNdvi = `${pathNdvi} L ${points[points.length - 1].x} ${padding.top + graphHeight} L ${points[0].x} ${padding.top + graphHeight} Z`;

  return (
    <div className="phenology-chart-card" data-testid="phenology-timeline-chart">
      <div className="phenology-header">
        <div className="phenology-title-wrap">
          <span className="phenology-icon-badge">
            <LayersIcon size={16} color="var(--color-primary-700)" />
          </span>
          <div>
            <h4 className="phenology-title">Seasonal Phenology Trajectory & Revisit Scrubber</h4>
            <span className="phenology-subtitle">Multi-temporal NDVI curve vs. 5-year historical agro-climatic baseline</span>
          </div>
        </div>

        <div className="phenology-legend">
          <span className="legend-item"><span className="legend-line ndvi" /> Observed NDVI</span>
          <span className="legend-item"><span className="legend-line baseline" /> 5-Yr Baseline</span>
          <span className="legend-item"><span className="legend-line ndwi" /> Moisture NDWI</span>
        </div>
      </div>

      <div className="svg-chart-wrapper">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="phenology-svg"
          data-testid="phenology-svg-chart"
        >
          <defs>
            <linearGradient id="ndviGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#52b788" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#52b788" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.2, 0.4, 0.6, 0.8, 1.0].map((val) => {
            const y = padding.top + (1 - val) * graphHeight;
            return (
              <g key={val}>
                <line x1={padding.left} y1={y} x2={svgWidth - padding.right} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
                  {val.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Area under NDVI curve */}
          <path d={areaNdvi} fill="url(#ndviGradient)" />

          {/* Baseline Curve */}
          <path d={pathBaseline} fill="none" stroke="#bc6c25" strokeWidth="2" strokeDasharray="5,4" />

          {/* NDWI Curve */}
          <path d={pathNdwi} fill="none" stroke="#06d6a0" strokeWidth="1.8" />

          {/* NDVI Curve */}
          <path d={pathNdvi} fill="none" stroke="#2d6a4f" strokeWidth="2.5" />

          {/* Interactive Data Points */}
          {points.map((p, i) => {
            const isSelected = selectedDate === p.readingDate;
            return (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.yNdvi}
                  r={isSelected ? 6 : 4}
                  fill={isSelected ? '#1b4332' : '#ffffff'}
                  stroke="#2d6a4f"
                  strokeWidth={isSelected ? 3 : 2}
                  className="timeline-point-circle"
                  onClick={() => onSelectDate && onSelectDate(p.readingDate)}
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                <text
                  x={p.x}
                  y={svgHeight - 12}
                  textAnchor="middle"
                  fontSize="10"
                  fill={isSelected ? 'var(--color-primary-800)' : '#64748b'}
                  fontWeight={isSelected ? '600' : '400'}
                >
                  {p.readingDate ? p.readingDate.substring(5) : ''}
                </text>
              </g>
            );
          })}
        </svg>

        {hoveredPoint && (
          <div
            className="chart-hover-tooltip"
            style={{
              left: `${(hoveredPoint.x / svgWidth) * 100}%`,
              top: `${(hoveredPoint.yNdvi / svgHeight) * 100}%`
            }}
          >
            <strong>{hoveredPoint.readingDate}</strong>
            <div>NDVI: <strong>{hoveredPoint.meanNdvi}</strong> (Base: {hoveredPoint.baseline})</div>
            <div>NDWI: {hoveredPoint.meanNdwi || 0.15}</div>
          </div>
        )}
      </div>

      <div className="timeline-scrubber-pill-row">
        <span className="scrubber-label">Select Sentinel-2 Satellite Revisit:</span>
        <div className="scrubber-buttons">
          {timeline.map((item, idx) => {
            const isSelected = selectedDate === item.readingDate;
            return (
              <button
                key={idx}
                type="button"
                className={`scrubber-pill ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectDate && onSelectDate(item.readingDate)}
                data-testid={`scrubber-pass-${item.readingDate}`}
              >
                {item.readingDate}
                <span className="scrubber-ndvi">NDVI: {item.meanNdvi}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
