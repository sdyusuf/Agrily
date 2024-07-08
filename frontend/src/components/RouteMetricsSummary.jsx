/**
 * ==============================================================================
 * AGRILY AGRICULTURAL LOGISTICS - ROUTE METRICS SUMMARY KPI COMPONENT
 * ==============================================================================
 * 
 * Component Description:
 * Renders strategic KPI cards summarizing total distance (km), estimated duration,
 * cargo payload weight, diesel fuel burn (liters), and carbon footprint (kg CO2e).
 * 
 * Design Standards:
 *  - Follows Agrily DESIGN_SYSTEM.md
 *  - Micro-interactions with soft shadows and lift
 * 
 * @module components/RouteMetricsSummary
 */

import React from 'react';
import PropTypes from 'prop-types';
import './RouteMetricsSummary.css';

/**
 * Formats duration in minutes to hours and minutes (e.g. 2h 45m).
 * @param {number} totalMinutes 
 * @returns {string} Formatted duration string
 */
const formatDuration = (totalMinutes) => {
  if (!totalMinutes || totalMinutes <= 0) return '0m';
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
};

export const RouteMetricsSummary = ({
  totalDistanceKm = 0,
  estimatedDurationMinutes = 0,
  totalPayloadWeightKg = 0,
  estimatedFuelConsumptionLiters = 0,
  estimatedCarbonFootprintKg = 0,
  stopsCount = 0
}) => {
  return (
    <div className="route-metrics-summary-grid" data-testid="route-metrics-summary">
      {/* 1. Distance Metric Card */}
      <div className="metric-kpi-card" data-testid="metric-distance">
        <div className="kpi-icon-wrap icon-emerald">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div className="kpi-body">
          <span className="kpi-label">Total Distance</span>
          <h3 className="kpi-value" data-testid="metric-distance-value">
            {totalDistanceKm.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{' '}
            <span className="kpi-unit">km</span>
          </h3>
          <span className="kpi-subtext">{stopsCount} collection waypoints</span>
        </div>
      </div>

      {/* 2. Transit Time Metric Card */}
      <div className="metric-kpi-card" data-testid="metric-duration">
        <div className="kpi-icon-wrap icon-ochre">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="1" y="3" width="15" height="13"></rect>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
            <circle cx="5.5" cy="18.5" r="2.5"></circle>
            <circle cx="18.5" cy="18.5" r="2.5"></circle>
          </svg>
        </div>
        <div className="kpi-body">
          <span className="kpi-label">Est. Transit Time</span>
          <h3 className="kpi-value" data-testid="metric-duration-value">
            {formatDuration(estimatedDurationMinutes)}
          </h3>
          <span className="kpi-subtext">Includes farm loading stops</span>
        </div>
      </div>

      {/* 3. Total Payload Cargo Weight */}
      <div className="metric-kpi-card" data-testid="metric-weight">
        <div className="kpi-icon-wrap icon-green">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
        </div>
        <div className="kpi-body">
          <span className="kpi-label">Consignment Weight</span>
          <h3 className="kpi-value" data-testid="metric-weight-value">
            {totalPayloadWeightKg.toLocaleString()}{' '}
            <span className="kpi-unit">kg</span>
          </h3>
          <span className="kpi-subtext">Farm harvest cargo</span>
        </div>
      </div>

      {/* 4. Estimated Diesel Fuel Consumption */}
      <div className="metric-kpi-card" data-testid="metric-fuel">
        <div className="kpi-icon-wrap icon-amber">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3 2v20h18V2H3zm14 14H7v-2h10v2zm0-4H7v-2h10v2zm0-4H7V6h10v2z"></path>
          </svg>
        </div>
        <div className="kpi-body">
          <span className="kpi-label">Diesel Consumption</span>
          <h3 className="kpi-value" data-testid="metric-fuel-value">
            {estimatedFuelConsumptionLiters.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{' '}
            <span className="kpi-unit">L</span>
          </h3>
          <span className="kpi-subtext">Gross tonnage scaled</span>
        </div>
      </div>

      {/* 5. Carbon Footprint */}
      <div className="metric-kpi-card" data-testid="metric-carbon">
        <div className="kpi-icon-wrap icon-slate">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
          </svg>
        </div>
        <div className="kpi-body">
          <span className="kpi-label">Carbon Footprint</span>
          <h3 className="kpi-value" data-testid="metric-carbon-value">
            {estimatedCarbonFootprintKg.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{' '}
            <span className="kpi-unit">kg CO₂</span>
          </h3>
          <span className="kpi-subtext">Scope 1 transit emissions</span>
        </div>
      </div>
    </div>
  );
};

RouteMetricsSummary.propTypes = {
  totalDistanceKm: PropTypes.number,
  estimatedDurationMinutes: PropTypes.number,
  totalPayloadWeightKg: PropTypes.number,
  estimatedFuelConsumptionLiters: PropTypes.number,
  estimatedCarbonFootprintKg: PropTypes.number,
  stopsCount: PropTypes.number
};

export default RouteMetricsSummary;
