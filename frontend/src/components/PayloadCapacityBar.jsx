/**
 * ==============================================================================
 * AGRILY AGRICULTURAL LOGISTICS - VEHICLE PAYLOAD CAPACITY GAUGE COMPONENT
 * ==============================================================================
 * 
 * Component Description:
 * Displays real-time cargo payload weight and crate volume capacity utilization
 * against commercial vehicle limits. Provides visual threshold alerts to prevent
 * dangerous truck overload on rural unpaved feeder roads.
 * 
 * Design Standards:
 *  - Emerald (#1b4332, #2d6a4f) for optimal operating zones (< 75%)
 *  - Harvest Ochre (#bc6c25, #dda15e) for near-capacity zones (75% - 99%)
 *  - Crimson (#b91c1c) for dangerous overload state (>= 100%)
 * 
 * @module components/PayloadCapacityBar
 */

import React from 'react';
import PropTypes from 'prop-types';
import './PayloadCapacityBar.css';

export const PayloadCapacityBar = ({
  currentPayloadKg = 0,
  maxPayloadKg = 3500,
  currentCrates = 0,
  maxCrates = 120,
  vehicleType = 'Commercial Haulage Truck',
  registrationNumber = ''
}) => {
  const safeCurrent = Math.max(0, currentPayloadKg);
  const safeMax = Math.max(1, maxPayloadKg);
  const utilizationPct = Math.round((safeCurrent / safeMax) * 100);
  const isOverloaded = safeCurrent > safeMax;
  const excessKg = Math.max(0, safeCurrent - safeMax);
  const remainingKg = Math.max(0, safeMax - safeCurrent);

  // Status classification
  let statusTier = 'optimal';
  let statusText = 'Optimal Load';
  if (isOverloaded) {
    statusTier = 'overloaded';
    statusText = 'Overloaded (Exceeds Legal Limit)';
  } else if (utilizationPct >= 75) {
    statusTier = 'near-capacity';
    statusText = 'Near Capacity';
  }

  const fillWidth = Math.min(100, utilizationPct);

  return (
    <div className={`payload-capacity-gauge-card tier-${statusTier}`} data-testid="payload-capacity-bar">
      {/* Header Info */}
      <div className="gauge-header">
        <div className="gauge-title-col">
          <span className="gauge-badge">Vehicle Cargo Payload</span>
          <h4 className="gauge-vehicle-title">
            {vehicleType} {registrationNumber && <span className="reg-tag">{registrationNumber}</span>}
          </h4>
        </div>
        <div className="gauge-status-badge" data-testid="capacity-status-badge">
          <span className={`status-dot dot-${statusTier}`}></span>
          <span className="status-label">{statusText}</span>
        </div>
      </div>

      {/* Primary Weight Progress Bar */}
      <div className="progress-track-wrapper">
        <div
          className="progress-track-bar"
          role="progressbar"
          aria-valuenow={utilizationPct}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Cargo payload utilization"
        >
          <div
            className={`progress-fill fill-${statusTier}`}
            style={{ width: `${fillWidth}%` }}
            data-testid="capacity-fill"
          ></div>
        </div>
      </div>

      {/* Utilization Statistics & Metrics */}
      <div className="gauge-stats-grid">
        <div className="gauge-stat-box">
          <span className="stat-label">Loaded Harvest Weight</span>
          <span className="stat-value" data-testid="loaded-weight-value">
            {safeCurrent.toLocaleString()} <span className="unit">kg</span>
          </span>
        </div>

        <div className="gauge-stat-box">
          <span className="stat-label">Maximum Axle Limit</span>
          <span className="stat-value">
            {safeMax.toLocaleString()} <span className="unit">kg</span>
          </span>
        </div>

        <div className="gauge-stat-box">
          <span className="stat-label">Capacity Utilization</span>
          <span className={`stat-value stat-${statusTier}`} data-testid="utilization-percentage">
            {utilizationPct}%
          </span>
        </div>

        <div className="gauge-stat-box">
          <span className="stat-label">Crate Volume Capacity</span>
          <span className="stat-value">
            {currentCrates} / {maxCrates} <span className="unit">crates</span>
          </span>
        </div>
      </div>

      {/* Capacity Alert Banners */}
      {isOverloaded ? (
        <div className="capacity-warning-banner alert-critical" data-testid="overload-warning">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>
            <strong>Safety Warning:</strong> Route payload exceeds vehicle limit by <strong>{excessKg.toLocaleString()} kg</strong>.
            Please reassign harvest stops or dispatch a larger truck.
          </span>
        </div>
      ) : (
        <div className="capacity-warning-banner alert-safe">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>
            <strong>Safe Operating Load:</strong> <strong>{remainingKg.toLocaleString()} kg</strong> available payload headroom remaining.
          </span>
        </div>
      )}
    </div>
  );
};

PayloadCapacityBar.propTypes = {
  currentPayloadKg: PropTypes.number,
  maxPayloadKg: PropTypes.number,
  currentCrates: PropTypes.number,
  maxCrates: PropTypes.number,
  vehicleType: PropTypes.string,
  registrationNumber: PropTypes.string
};

export default PayloadCapacityBar;
