import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  SatelliteDishIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  SproutIcon,
  LayersIcon,
  FlaskIcon
} from './Icons';
import './SatelliteDroughtRiskCard.css';

/**
 * Standard USDM Drought Tiers Configuration
 */
const DROUGHT_TIER_CONFIG = {
  D_NORMAL: {
    code: 'D_NORMAL',
    name: 'Normal Moisture Equilibrium',
    badgeColor: '#2d6a4f',
    textColor: '#ffffff',
    riskLabel: 'Optimal',
    urgencyText: 'Maintain standard seasonal irrigation schedule according to crop evapotranspiration demand (ETc).'
  },
  D0: {
    code: 'D0',
    name: 'Abnormally Dry',
    badgeColor: '#e9c46a',
    textColor: '#1b4332',
    riskLabel: 'Watch (Mild Deficit)',
    urgencyText: 'Apply supplemental maintenance irrigation of 15-20 mm every 4-5 days during early morning hours.'
  },
  D1: {
    code: 'D1',
    name: 'Moderate Drought',
    badgeColor: '#f4a261',
    textColor: '#1b4332',
    riskLabel: 'Warning (Stomatal Regulation)',
    urgencyText: 'Elevate irrigation scheduling to 25-30 mm every 3 days. Prioritize critical flowering stages.'
  },
  D2: {
    code: 'D2',
    name: 'Severe Drought',
    badgeColor: '#e76f51',
    textColor: '#ffffff',
    riskLabel: 'Critical (Yield Loss Risk)',
    urgencyText: 'Implement deficit irrigation: concentrate water supplies on prime blocks, maintaining 35 mm weekly application.'
  },
  D3: {
    code: 'D3',
    name: 'Extreme Drought',
    badgeColor: '#d62828',
    textColor: '#ffffff',
    riskLabel: 'Emergency (Crop Failure Risk)',
    urgencyText: 'Emergency solar borehole pumping required immediately. File parametric micro-insurance notice.'
  },
  D4: {
    code: 'D4',
    name: 'Exceptional Drought',
    badgeColor: '#780000',
    textColor: '#ffffff',
    riskLabel: 'Catastrophic Desiccation',
    urgencyText: 'Total canopy death imminent. Regional disaster zone declarations and immediate compensation claim.'
  }
};

export default function SatelliteDroughtRiskCard({
  parcelName = 'Plot Alpha',
  cropType = 'Maize',
  zoneName = 'Sudan Savanna',
  meanNdvi = 0.65,
  lstCelsius = 32.5,
  vciPct = 58.0,
  tciPct = 52.0,
  tvdi = 0.42,
  cwsi = 0.38
}) {
  const [simulationLstOffset, setSimulationLstOffset] = useState(0);

  // Compute simulated indices based on interactive LST thermal slider
  const effectiveLst = Number((lstCelsius + simulationLstOffset).toFixed(1));
  const effectiveTci = Math.max(0.0, Math.min(100.0, Number((tciPct - simulationLstOffset * 4.5).toFixed(1))));
  const effectiveVhi = Math.max(0.0, Math.min(100.0, Number((0.5 * vciPct + 0.5 * effectiveTci).toFixed(1))));
  const effectiveTvdi = Math.max(0.0, Math.min(1.0, Number((tvdi + simulationLstOffset * 0.04).toFixed(3))));
  const effectiveCwsi = Math.max(0.0, Math.min(1.0, Number((cwsi + simulationLstOffset * 0.05).toFixed(3))));

  // Classify drought tier
  let activeTier = DROUGHT_TIER_CONFIG.D_NORMAL;
  if (effectiveVhi < 6.0) {
    activeTier = DROUGHT_TIER_CONFIG.D4;
  } else if (effectiveVhi < 16.0) {
    activeTier = DROUGHT_TIER_CONFIG.D3;
  } else if (effectiveVhi < 26.0) {
    activeTier = DROUGHT_TIER_CONFIG.D2;
  } else if (effectiveVhi < 36.0) {
    activeTier = DROUGHT_TIER_CONFIG.D1;
  } else if (effectiveVhi < 46.0) {
    activeTier = DROUGHT_TIER_CONFIG.D0;
  }

  return (
    <div className="satellite-drought-risk-card" data-testid="satellite-drought-risk-card">
      {/* Header */}
      <div className="drought-card-header">
        <div className="header-meta-group">
          <div className="drought-header-badge">
            <SatelliteDishIcon size={16} />
            <span>Multi-Index Satellite Thermal Telemetry</span>
          </div>
          <h2 className="drought-card-title">Satellite Drought &amp; Moisture Stress Radar</h2>
          <p className="drought-card-subtitle">
            Parcel: <strong>{parcelName}</strong> ({cropType} in {zoneName}) | Sentinel-2 L2A BOA Surface Temperature Coupling
          </p>
        </div>

        {/* Primary USDM Drought Tier Badge */}
        <div
          className="drought-tier-badge"
          style={{ backgroundColor: activeTier.badgeColor, color: activeTier.textColor }}
          data-testid="drought-tier-badge"
        >
          <span className="badge-code">{activeTier.code}</span>
          <span className="badge-name">{activeTier.name}</span>
          <span className="badge-risk">({activeTier.riskLabel})</span>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="drought-metrics-grid">
        {/* Vegetation Health Index (VHI) */}
        <div className="drought-metric-item">
          <div className="metric-header">
            <span className="metric-title">Vegetation Health Index (VHI)</span>
            <span className="metric-code">Kogan 2001</span>
          </div>
          <div className="metric-main-value">
            <span className="value-num">{effectiveVhi}%</span>
            <span className="value-sub">Biomass &amp; Thermal Equilibrium</span>
          </div>
          <div className="metric-bar-track">
            <div
              className="metric-bar-fill"
              style={{
                width: `${effectiveVhi}%`,
                backgroundColor: activeTier.badgeColor
              }}
            />
          </div>
          <span className="metric-hint">VCI: {vciPct}% | TCI: {effectiveTci}%</span>
        </div>

        {/* Temperature Vegetation Dryness Index (TVDI) */}
        <div className="drought-metric-item">
          <div className="metric-header">
            <span className="metric-title">Dryness Index (TVDI)</span>
            <span className="metric-code">Sandholt 2002</span>
          </div>
          <div className="metric-main-value">
            <span className="value-num">{effectiveTvdi}</span>
            <span className="value-sub">LST-NDVI Trapezoid Space</span>
          </div>
          <div className="metric-bar-track">
            <div
              className="metric-bar-fill"
              style={{
                width: `${effectiveTvdi * 100}%`,
                backgroundColor: '#bc6c25'
              }}
            />
          </div>
          <span className="metric-hint">Soil Moisture Deficit: {(effectiveTvdi * 100).toFixed(0)}%</span>
        </div>

        {/* Crop Water Stress Index (CWSI) */}
        <div className="drought-metric-item">
          <div className="metric-header">
            <span className="metric-title">Water Stress Index (CWSI)</span>
            <span className="metric-code">Jackson 1981</span>
          </div>
          <div className="metric-main-value">
            <span className="value-num">{effectiveCwsi}</span>
            <span className="value-sub">Canopy Transpiration Deficit</span>
          </div>
          <div className="metric-bar-track">
            <div
              className="metric-bar-fill"
              style={{
                width: `${effectiveCwsi * 100}%`,
                backgroundColor: effectiveCwsi > 0.42 ? '#e76f51' : '#52b788'
              }}
            />
          </div>
          <span className="metric-hint">
            {effectiveCwsi > 0.42 ? 'Irrigation Trigger Active' : 'Normal Conductance'}
          </span>
        </div>

        {/* Land Surface Temperature (LST) */}
        <div className="drought-metric-item">
          <div className="metric-header">
            <span className="metric-title">Canopy Surface Temp (LST)</span>
            <span className="metric-code">Thermal Radiometer</span>
          </div>
          <div className="metric-main-value">
            <span className="value-num">{effectiveLst}°C</span>
            <span className="value-sub">Overpass Mean Skin Temperature</span>
          </div>
          <div className="metric-bar-track">
            <div
              className="metric-bar-fill"
              style={{
                width: `${Math.min(100, Math.max(0, (effectiveLst - 20) * 4))}%`,
                backgroundColor: effectiveLst > 36 ? '#d62828' : '#2d6a4f'
              }}
            />
          </div>
          <span className="metric-hint">Ambient Baseline: {lstCelsius}°C</span>
        </div>
      </div>

      {/* Interactive Heat & Drought Stress Scenario Simulator */}
      <div className="simulator-section">
        <div className="simulator-header">
          <span className="simulator-title">
            <FlaskIcon size={16} /> Interactive Heatwave &amp; Desiccation Simulation Slider
          </span>
          <span className="simulator-offset">
            Simulated Temp Anomaly: <strong>{simulationLstOffset >= 0 ? `+${simulationLstOffset}` : simulationLstOffset}°C</strong>
          </span>
        </div>
        <input
          type="range"
          min="-3"
          max="8"
          step="0.5"
          value={simulationLstOffset}
          onChange={(e) => setSimulationLstOffset(parseFloat(e.target.value))}
          className="simulator-slider"
          data-testid="lst-simulator-slider"
          aria-label="Simulate canopy temperature anomaly"
        />
        <div className="slider-ticks">
          <span>-3°C (Post-Rain Cooling)</span>
          <span>0°C (Baseline)</span>
          <span>+4°C (Midday Heatwave)</span>
          <span>+8°C (Extreme Sahelian Flash Drought)</span>
        </div>
      </div>

      {/* Actionable Agronomic Irrigation Prescriptions */}
      <div className="prescriptions-card">
        <div className="prescription-header">
          <SproutIcon size={18} color="#2d6a4f" />
          <span className="prescription-title">Actionable Smallholder Agronomic Prescription:</span>
        </div>
        <p className="prescription-text">{activeTier.urgencyText}</p>

        <div className="prescription-tags">
          <span className="prescription-tag">
            <CheckCircleIcon size={14} /> Mulch Recommendation: 5-7 cm organic crop residue
          </span>
          <span className="prescription-tag">
            <AlertCircleIcon size={14} /> Nitrogen Timing: Suspend dry granular fertilizer during water deficit
          </span>
        </div>
      </div>
    </div>
  );
}

SatelliteDroughtRiskCard.propTypes = {
  parcelName: PropTypes.string,
  cropType: PropTypes.string,
  zoneName: PropTypes.string,
  meanNdvi: PropTypes.number,
  lstCelsius: PropTypes.number,
  vciPct: PropTypes.number,
  tciPct: PropTypes.number,
  tvdi: PropTypes.number,
  cwsi: PropTypes.number
};
