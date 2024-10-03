import React from 'react';
import './ZonalCropHealthMetricsCard.css';
import { SproutIcon, LeafIcon, AlertTriangleIcon } from './Icons';

export default function ZonalCropHealthMetricsCard({
  metrics = {},
  cropType = 'Maize',
  totalHectares = 24.5
}) {
  const {
    meanNdvi = 0.68,
    minNdvi = 0.22,
    maxNdvi = 0.89,
    stdDevNdvi = 0.11,
    meanNdwi = 0.18,
    chlorophyllIndex = 4.8,
    waterStressIndex = 0.22,
    canopyUniformityIndex = 0.84,
    cloudMaskPercentage = 1.2,
    vigorDistribution = {
      severeStressHectares: 1.2,
      moderateStressHectares: 3.5,
      healthyHectares: 14.8,
      hyperDenseHectares: 5.0
    },
    advisoryReport = 'Normal vegetative growth profile.'
  } = metrics;

  const ha = Number(totalHectares) || 24.5;
  const severePct = Math.round(((vigorDistribution?.severeStressHectares || 0) / ha) * 100);
  const modPct = Math.round(((vigorDistribution?.moderateStressHectares || 0) / ha) * 100);
  const healthyPct = Math.round(((vigorDistribution?.healthyHectares || 0) / ha) * 100);
  const hyperPct = Math.round(((vigorDistribution?.hyperDenseHectares || 0) / ha) * 100);

  const getStatusPill = (val) => {
    if (val >= 0.65) {
      return { label: 'Dense Canopy', bg: 'var(--color-primary-50)', color: 'var(--color-primary-800)', border: 'var(--color-primary-100)' };
    }
    if (val >= 0.40) {
      return { label: 'Healthy Growth', bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' };
    }
    if (val >= 0.20) {
      return { label: 'Moderate Stress', bg: 'var(--color-warning-bg)', color: 'var(--color-warning-text)', border: '#fde68a' };
    }
    return { label: 'Severe Stress', bg: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', border: '#fecaca' };
  };

  const status = getStatusPill(meanNdvi);

  return (
    <div className="zonal-metrics-card" data-testid="zonal-crop-health-metrics-card">
      <div className="zonal-card-header">
        <div className="zonal-title-wrapper">
          <span className="zonal-sprout-icon">
            <SproutIcon size={18} color="var(--color-primary-700)" />
          </span>
          <div>
            <h3 className="zonal-card-title">Zonal Crop Vigor Telemetry</h3>
            <span className="zonal-card-subtitle">{cropType} Canopy ({ha} Hectares)</span>
          </div>
        </div>

        <span
          className="zonal-status-pill"
          style={{ background: status.bg, color: status.color, borderColor: status.border }}
          data-testid="zonal-health-status-pill"
        >
          {status.label}
        </span>
      </div>

      <div className="metrics-kpi-grid">
        <div className="kpi-metric-box">
          <span className="kpi-label">Mean NDVI</span>
          <span className="kpi-value primary">{meanNdvi.toFixed(2)}</span>
          <span className="kpi-subtext">Range: {minNdvi.toFixed(2)} – {maxNdvi.toFixed(2)}</span>
        </div>

        <div className="kpi-metric-box">
          <span className="kpi-label">Chlorophyll Index (CIre)</span>
          <span className="kpi-value">{chlorophyllIndex.toFixed(1)}</span>
          <span className="kpi-subtext">Nitrogen Assimilation</span>
        </div>

        <div className="kpi-metric-box">
          <span className="kpi-label">Canopy Water Deficit</span>
          <span className={`kpi-value ${waterStressIndex > 0.4 ? 'warning' : 'success'}`}>
            {waterStressIndex.toFixed(2)}
          </span>
          <span className="kpi-subtext">NDWI: {meanNdwi.toFixed(2)}</span>
        </div>

        <div className="kpi-metric-box">
          <span className="kpi-label">Field Uniformity</span>
          <span className="kpi-value">{Math.round(canopyUniformityIndex * 100)}%</span>
          <span className="kpi-subtext">StdDev: ±{stdDevNdvi.toFixed(2)}</span>
        </div>
      </div>

      <div className="zonal-distribution-section">
        <div className="distribution-header">
          <span className="dist-title">Vigor Distribution Breakdown</span>
          <span className="dist-cloud">Cloud Occlusion: {cloudMaskPercentage}%</span>
        </div>

        <div className="stacked-progress-bar">
          <div
            className="bar-segment severe"
            style={{ width: `${severePct}%` }}
            title={`Severe Stress: ${vigorDistribution.severeStressHectares} Ha (${severePct}%)`}
          />
          <div
            className="bar-segment moderate"
            style={{ width: `${modPct}%` }}
            title={`Moderate Stress: ${vigorDistribution.moderateStressHectares} Ha (${modPct}%)`}
          />
          <div
            className="bar-segment healthy"
            style={{ width: `${healthyPct}%` }}
            title={`Healthy: ${vigorDistribution.healthyHectares} Ha (${healthyPct}%)`}
          />
          <div
            className="bar-segment hyper"
            style={{ width: `${hyperPct}%` }}
            title={`Dense Canopy: ${vigorDistribution.hyperDenseHectares} Ha (${hyperPct}%)`}
          />
        </div>

        <div className="distribution-legend-chips">
          <span className="legend-chip">
            <span className="chip-dot severe" /> Severe: {vigorDistribution.severeStressHectares || 0} Ha
          </span>
          <span className="legend-chip">
            <span className="chip-dot moderate" /> Moderate: {vigorDistribution.moderateStressHectares || 0} Ha
          </span>
          <span className="legend-chip">
            <span className="chip-dot healthy" /> Healthy: {vigorDistribution.healthyHectares || 0} Ha
          </span>
          <span className="legend-chip">
            <span className="chip-dot hyper" /> Dense: {vigorDistribution.hyperDenseHectares || 0} Ha
          </span>
        </div>
      </div>

      {advisoryReport && (
        <div className="advisory-recommendation-box">
          <div className="advisory-title-row">
            <LeafIcon size={14} color="var(--color-primary-700)" />
            <span className="advisory-title">Agronomic Satellite Advisory</span>
          </div>
          <p className="advisory-body">{advisoryReport}</p>
        </div>
      )}
    </div>
  );
}
