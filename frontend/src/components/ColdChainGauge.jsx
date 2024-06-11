import React, { useMemo } from 'react';
import './ColdChainGauge.css';

/**
 * Standard vector icons adhering to DESIGN_SYSTEM.md
 */
const ThermometerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
  </svg>
);

const DropletIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

/**
 * ColdChainGauge Component
 * Tactile circular dial displaying environmental IoT metrics, safe thresholds,
 * and automated cold-chain breach classifications.
 */
export const ColdChainGauge = ({
  type = 'temperature',
  title = 'Reefer Cargo Core',
  currentValue = 2.4,
  unit = '°C',
  minScale = -10,
  maxScale = 30,
  targetRange = { min: 0.5, max: 4.0, optimal: 2.0 },
  podId = 'POD-101',
  isDoorOpen = false,
  batteryPercent = 94
}) => {
  const isTemp = type === 'temperature';
  const val = typeof currentValue === 'number' ? currentValue : 0;
  const tMin = targetRange?.min !== undefined ? targetRange.min : 0;
  const tMax = targetRange?.max !== undefined ? targetRange.max : 10;
  const tOpt = targetRange?.optimal !== undefined ? targetRange.optimal : (tMin + tMax) / 2;

  // Compute status classification
  const statusInfo = useMemo(() => {
    if (val > tMax) {
      const diff = val - tMax;
      return {
        status: diff >= (isTemp ? 3.0 : 15) ? 'critical' : 'warning',
        label: diff >= (isTemp ? 3.0 : 15) ? 'Critical High Excursion' : 'Above Target Zone',
        colorClass: diff >= (isTemp ? 3.0 : 15) ? 'critical' : 'warning'
      };
    }
    if (val < tMin) {
      const diff = tMin - val;
      return {
        status: diff >= (isTemp ? 2.0 : 15) ? 'critical' : 'warning',
        label: diff >= (isTemp ? 2.0 : 15) ? 'Critical Chilling Breach' : 'Below Target Floor',
        colorClass: diff >= (isTemp ? 2.0 : 15) ? 'critical' : 'warning'
      };
    }
    return {
      status: 'safe',
      label: 'Optimal Cold Chain',
      colorClass: 'safe'
    };
  }, [val, tMin, tMax, isTemp]);

  // SVG Gauge Math: 180 degree semi-circle arc (radius = 80)
  const radius = 80;
  const arcLength = Math.PI * radius; // ~251.32px

  const scaleSpan = maxScale - minScale;
  const normalizedFraction = Math.min(Math.max((val - minScale) / scaleSpan, 0), 1);
  const valueStrokeOffset = arcLength * (1 - normalizedFraction);

  // Safe range arc calculation
  const safeStartFraction = Math.min(Math.max((tMin - minScale) / scaleSpan, 0), 1);
  const safeEndFraction = Math.min(Math.max((tMax - minScale) / scaleSpan, 0), 1);
  const safeSpanFraction = safeEndFraction - safeStartFraction;

  return (
    <div className="cold-chain-gauge-card" data-testid={`cold-chain-gauge-${type}`}>
      {/* Header */}
      <div className="gauge-card-header">
        <div className="gauge-title-wrap">
          <div className={`gauge-icon-badge ${type === 'humidity' ? 'humidity' : ''}`}>
            {isTemp ? <ThermometerIcon /> : <DropletIcon />}
          </div>
          <div>
            <h4>{title}</h4>
            <span>Pod: {podId}</span>
          </div>
        </div>

        <span className="gauge-meta-item">
          Battery: <strong>{batteryPercent}%</strong>
        </span>
      </div>

      {/* Radial Semi-Circle Gauge */}
      <div className="gauge-svg-stage">
        <svg viewBox="0 0 200 120" className="gauge-svg">
          {/* Background Meter Track */}
          <path
            d="M 20 105 A 80 80 0 0 1 180 105"
            className="gauge-bg-arc"
          />

          {/* Safe Zone Highlighting Arc */}
          <path
            d="M 20 105 A 80 80 0 0 1 180 105"
            className="gauge-safe-arc"
            strokeDasharray={`${safeSpanFraction * arcLength} ${arcLength}`}
            strokeDashoffset={`-${safeStartFraction * arcLength}`}
          />

          {/* Value Progress Arc */}
          <path
            d="M 20 105 A 80 80 0 0 1 180 105"
            className={`gauge-value-arc ${statusInfo.colorClass}`}
            strokeDasharray={`${arcLength} ${arcLength}`}
            strokeDashoffset={valueStrokeOffset}
          />
        </svg>

        {/* Center Readout */}
        <div className="gauge-center-readout">
          <div>
            <span className="readout-numeric" data-testid={`gauge-val-${type}`}>{val}</span>
            <span className="readout-unit">{unit}</span>
          </div>
          <span className="readout-target-subtext">
            Setpoint: {tOpt}{unit} ({tMin}–{tMax}{unit})
          </span>
        </div>
      </div>

      {/* Status Pill Badge */}
      <div className={`gauge-status-badge ${statusInfo.colorClass}`} data-testid={`gauge-status-${type}`}>
        {statusInfo.status === 'safe' ? <ShieldCheckIcon /> : <AlertTriangleIcon />}
        <span>{statusInfo.label}</span>
      </div>

      {/* Footer Specs */}
      <div className="gauge-footer-meta">
        <span className="gauge-meta-item">
          Target Range: <strong>{tMin}{unit} to {tMax}{unit}</strong>
        </span>
        <span className="gauge-meta-item">
          Door Contact: <strong style={{ color: isDoorOpen ? '#991b1b' : '#065f46' }}>
            {isDoorOpen ? 'Open (Ajar)' : 'Sealed'}
          </strong>
        </span>
      </div>
    </div>
  );
};

export default ColdChainGauge;
