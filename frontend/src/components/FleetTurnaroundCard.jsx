/**
 * @file FleetTurnaroundCard.jsx
 * @description Tactile Fleet Turnaround & Dwell Time Breakdown Card
 * Displays trip stage milestones (Loading, Transit, Inspection, Offloading),
 * dwell time variance against corridor baselines, and bottleneck alerts.
 */

import React from 'react';
import './FleetTurnaroundCard.css';

export default function FleetTurnaroundCard({
  trackingNumber = 'FLT-20240815-9A2',
  vehicleRegNumber = 'KN-882-TRK',
  vehicleType = 'MEDIUM_TRUCK_8_TON',
  corridorName = 'Kano-Kaduna-Abuja-Lagos Grain Expressway',
  originState = 'KANO',
  destinationState = 'LAGOS',
  durations = {
    originLoadingTime: 60,
    transitTime: 1980,
    docksideInspectionTime: 30,
    destinationOffloadingTime: 45,
    totalTurnaroundTime: 2115,
    transitDelayMinutes: 0
  },
  primaryBottleneck = 'IN_TRANSIT',
  onInspectDetails
}) {
  const formatMins = (minutes = 0) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  const total = Math.max(1, durations.totalTurnaroundTime || 1);
  const loadingPct = Math.round(((durations.originLoadingTime || 0) / total) * 100);
  const transitPct = Math.round(((durations.transitTime || 0) / total) * 100);
  const inspectionPct = Math.round(((durations.docksideInspectionTime || 0) / total) * 100);
  const offloadingPct = Math.round(((durations.destinationOffloadingTime || 0) / total) * 100);

  const isBottleneck = (stageName) => primaryBottleneck === stageName;

  return (
    <div className="fleet-turnaround-card" data-testid="fleet-turnaround-card">
      <div className="fleet-card-header">
        <div className="fleet-header-info">
          <span className="fleet-badge-tracking">{trackingNumber}</span>
          <h3 className="fleet-vehicle-reg">{vehicleRegNumber}</h3>
          <p className="fleet-corridor-text">
            <span className="route-dot origin-dot" /> {originState} ➔ <span className="route-dot dest-dot" /> {destinationState}
            <span className="corridor-subtext"> ({corridorName})</span>
          </p>
        </div>
        <div className="fleet-vehicle-pill">
          <span className="vehicle-type-label">{vehicleType.replace(/_/g, ' ')}</span>
        </div>
      </div>

      <div className="fleet-total-turnaround-banner">
        <div className="total-turnaround-stat">
          <span className="stat-label">Total Turnaround Duration</span>
          <span className="stat-value">{formatMins(durations.totalTurnaroundTime)}</span>
        </div>
        {durations.transitDelayMinutes > 0 ? (
          <span className="delay-badge delay-warning">
            +{formatMins(durations.transitDelayMinutes)} Delay
          </span>
        ) : (
          <span className="delay-badge delay-ok">✓ On-Time Corridor Transit</span>
        )}
      </div>

      {/* Segmented Turnaround Progress Bar */}
      <div className="turnaround-segmented-bar" role="progressbar" aria-label="Turnaround stage progression">
        <div
          className={`bar-segment seg-loading ${isBottleneck('ORIGIN_LOADING') ? 'bottleneck-active' : ''}`}
          style={{ width: `${Math.max(8, loadingPct)}%` }}
          title={`Loading: ${loadingPct}%`}
        />
        <div
          className={`bar-segment seg-transit ${isBottleneck('IN_TRANSIT') ? 'bottleneck-active' : ''}`}
          style={{ width: `${Math.max(15, transitPct)}%` }}
          title={`Transit: ${transitPct}%`}
        />
        <div
          className={`bar-segment seg-inspection ${isBottleneck('DOCKSIDE_INSPECTION') ? 'bottleneck-active' : ''}`}
          style={{ width: `${Math.max(6, inspectionPct)}%` }}
          title={`Inspection: ${inspectionPct}%`}
        />
        <div
          className={`bar-segment seg-offloading ${isBottleneck('DESTINATION_OFFLOADING') ? 'bottleneck-active' : ''}`}
          style={{ width: `${Math.max(6, offloadingPct)}%` }}
          title={`Offloading: ${offloadingPct}%`}
        />
      </div>

      {/* Granular Stage Cards Grid */}
      <div className="stage-breakdown-grid">
        <div className={`stage-stat-item ${isBottleneck('ORIGIN_LOADING') ? 'is-bottleneck' : ''}`}>
          <div className="stage-indicator-badge origin-badge">Origin Loading</div>
          <span className="stage-duration-val">{formatMins(durations.originLoadingTime)}</span>
          <span className="stage-pct-subtext">{loadingPct}% of trip</span>
        </div>

        <div className={`stage-stat-item ${isBottleneck('IN_TRANSIT') ? 'is-bottleneck' : ''}`}>
          <div className="stage-indicator-badge transit-badge">Interstate Transit</div>
          <span className="stage-duration-val">{formatMins(durations.transitTime)}</span>
          <span className="stage-pct-subtext">{transitPct}% of trip</span>
        </div>

        <div className={`stage-stat-item ${isBottleneck('DOCKSIDE_INSPECTION') ? 'is-bottleneck' : ''}`}>
          <div className="stage-indicator-badge inspection-badge">Dockside Quality</div>
          <span className="stage-duration-val">{formatMins(durations.docksideInspectionTime)}</span>
          <span className="stage-pct-subtext">{inspectionPct}% of trip</span>
        </div>

        <div className={`stage-stat-item ${isBottleneck('DESTINATION_OFFLOADING') ? 'is-bottleneck' : ''}`}>
          <div className="stage-indicator-badge offload-badge">Dest. Offload</div>
          <span className="stage-duration-val">{formatMins(durations.destinationOffloadingTime)}</span>
          <span className="stage-pct-subtext">{offloadingPct}% of trip</span>
        </div>
      </div>

      <div className="fleet-card-footer">
        <div className="bottleneck-summary">
          <span className="bottleneck-label">Primary Bottleneck:</span>
          <span className="bottleneck-value">{primaryBottleneck.replace(/_/g, ' ')}</span>
        </div>
        {onInspectDetails && (
          <button
            type="button"
            className="btn-inspect-fleet"
            onClick={() => onInspectDetails(trackingNumber)}
          >
            Audit Telemetry ➔
          </button>
        )}
      </div>
    </div>
  );
}
