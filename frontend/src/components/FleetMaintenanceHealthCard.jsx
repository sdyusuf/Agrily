import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './FleetMaintenanceHealthCard.css';

const SAMPLE_VEHICLES = [
  {
    id: 'KND-882-XA',
    truckModel: 'Mack Anthem 30T Rigid',
    assignedCarrier: 'Dawanau Express Haulage Ltd',
    odometerKm: 86400,
    oilChangeOdoKm: 81000,
    brakeServiceOdoKm: 76000,
    tyreServiceOdoKm: 72000,
    reeferHours: 110,
    isRefrigerated: true
  },
  {
    id: 'ABJ-319-YF',
    truckModel: 'Mercedes Actros 25T High-Deck',
    assignedCarrier: 'Arewa Cold-Chain Logistics',
    odometerKm: 142000,
    oilChangeOdoKm: 128000,
    brakeServiceOdoKm: 118000,
    tyreServiceOdoKm: 115000,
    reeferHours: 420,
    isRefrigerated: true
  },
  {
    id: 'LOS-904-KT',
    truckModel: 'MAN TGS 20T Curtainsider',
    assignedCarrier: 'Eko Agro-Transit Hub',
    odometerKm: 54000,
    oilChangeOdoKm: 52000,
    brakeServiceOdoKm: 50000,
    tyreServiceOdoKm: 48000,
    reeferHours: 0,
    isRefrigerated: false
  }
];

export default function FleetMaintenanceHealthCard({ className = '' }) {
  const [selectedVehicleId, setSelectedVehicleId] = useState('KND-882-XA');
  const [vehicles, setVehicles] = useState(SAMPLE_VEHICLES);

  const vehicle = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];

  const kmSinceOil = vehicle.odometerKm - vehicle.oilChangeOdoKm;
  const kmSinceBrakes = vehicle.odometerKm - vehicle.brakeServiceOdoKm;
  const kmSinceTyres = vehicle.odometerKm - vehicle.tyreServiceOdoKm;

  // Roadworthiness calculations
  let score = 100;
  const pendingActions = [];

  if (kmSinceOil >= 10000) {
    score -= 20;
    pendingActions.push({ item: 'Engine Oil & Filter Service', costNgn: 45000, urgency: 'HIGH' });
  }
  if (kmSinceBrakes >= 20000) {
    score -= 35;
    pendingActions.push({ item: 'Brake Lining & Drum Overhaul', costNgn: 65000, urgency: 'CRITICAL' });
  }
  if (kmSinceTyres >= 25000) {
    score -= 15;
    pendingActions.push({ item: 'Tyre Tread Rotation & Alignment', costNgn: 30000, urgency: 'MEDIUM' });
  }
  if (vehicle.isRefrigerated && vehicle.reeferHours >= 300) {
    score -= 20;
    pendingActions.push({ item: 'Thermo King Reefer Compressor Overhaul', costNgn: 85000, urgency: 'HIGH' });
  }

  score = Math.max(10, Math.min(100, score));

  let clearanceStatus = 'APPROVED_FOR_LONG_HAUL';
  let clearanceLabel = 'APPROVED FOR INTERSTATE TRANSIT';
  let clearanceClass = 'approved';

  if (score < 50) {
    clearanceStatus = 'GROUNDED_SAFETY_STANDSTILL';
    clearanceLabel = 'GROUNDED — SAFETY REPAIRS REQUIRED';
    clearanceClass = 'grounded';
  } else if (score < 80) {
    clearanceStatus = 'MAINTENANCE_DUE_WARNING';
    clearanceLabel = 'WARNING — ROUTINE SERVICE OVERDUE';
    clearanceClass = 'warning';
  }

  const handleSimulateService = () => {
    setVehicles(prev => prev.map(v => {
      if (v.id === vehicle.id) {
        return {
          ...v,
          oilChangeOdoKm: v.odometerKm,
          brakeServiceOdoKm: v.odometerKm,
          tyreServiceOdoKm: v.odometerKm,
          reeferHours: 0
        };
      }
      return v;
    }));
  };

  return (
    <div className={`maintenance-card-container ${className}`} data-testid="fleet-maintenance-health-card">
      <div className="maintenance-card-header">
        <div>
          <span className="maintenance-badge-wrench">🛠️ FLEET DIAGNOSTICS</span>
          <h3 className="maintenance-title">Vehicle Roadworthiness & Pre-Trip Health</h3>
          <p className="maintenance-subtitle">
            FRSC-aligned roadworthiness scoring, brake lining safety checks, and reefer compressor service cycles.
          </p>
        </div>
        <div className={`clearance-status-pill ${clearanceClass}`} data-testid="clearance-status-pill">
          <span className="clearance-tag">FRSC DISPATCH CLEARANCE</span>
          <strong className="clearance-label" data-testid="clearance-label-text">{clearanceLabel}</strong>
          <span className="clearance-score">{score}% Roadworthiness</span>
        </div>
      </div>

      <div className="vehicle-selector-row">
        <label htmlFor="vehicle-select" className="selector-label">Inspect Fleet Vehicle:</label>
        <select
          id="vehicle-select"
          className="vehicle-dropdown"
          value={selectedVehicleId}
          onChange={(e) => setSelectedVehicleId(e.target.value)}
          data-testid="vehicle-selector"
        >
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>
              {v.id} — {v.truckModel} ({v.assignedCarrier})
            </option>
          ))}
        </select>
        <span className="odometer-badge">Odo: {vehicle.odometerKm.toLocaleString()} km</span>
      </div>

      {/* Component Wear Bars */}
      <div className="component-wear-grid" data-testid="component-wear-grid">
        <div className="wear-card">
          <div className="wear-header">
            <span>Brake Lining Condition</span>
            <strong>{Math.max(10, 100 - Math.round((kmSinceBrakes / 25000) * 100))}% Life</strong>
          </div>
          <div className="wear-progress-track">
            <div
              className={`wear-progress-fill ${kmSinceBrakes >= 20000 ? 'danger' : 'safe'}`}
              style={{ width: `${Math.max(5, 100 - Math.round((kmSinceBrakes / 25000) * 100))}%` }}
            />
          </div>
          <span className="wear-sub">{kmSinceBrakes.toLocaleString()} km since brake overhaul</span>
        </div>

        <div className="wear-card">
          <div className="wear-header">
            <span>Engine Oil Service Life</span>
            <strong>{Math.max(5, 100 - Math.round((kmSinceOil / 12000) * 100))}% Life</strong>
          </div>
          <div className="wear-progress-track">
            <div
              className={`wear-progress-fill ${kmSinceOil >= 10000 ? 'warning' : 'safe'}`}
              style={{ width: `${Math.max(5, 100 - Math.round((kmSinceOil / 12000) * 100))}%` }}
            />
          </div>
          <span className="wear-sub">{kmSinceOil.toLocaleString()} km on current synthetic oil</span>
        </div>

        <div className="wear-card">
          <div className="wear-header">
            <span>Tyre Tread Life</span>
            <strong>{Math.max(10, 100 - Math.round((kmSinceTyres / 30000) * 100))}% Life</strong>
          </div>
          <div className="wear-progress-track">
            <div
              className="wear-progress-fill safe"
              style={{ width: `${Math.max(5, 100 - Math.round((kmSinceTyres / 30000) * 100))}%` }}
            />
          </div>
          <span className="wear-sub">{kmSinceTyres.toLocaleString()} km since rotation</span>
        </div>

        {vehicle.isRefrigerated && (
          <div className="wear-card reefer-wear">
            <div className="wear-header">
              <span>Reefer Compressor Cycles</span>
              <strong>{vehicle.reeferHours} / 300 hrs</strong>
            </div>
            <div className="wear-progress-track">
              <div
                className={`wear-progress-fill ${vehicle.reeferHours >= 300 ? 'danger' : 'safe'}`}
                style={{ width: `${Math.min(100, Math.round((vehicle.reeferHours / 300) * 100))}%` }}
              />
            </div>
            <span className="wear-sub">Cold-chain chiller operating hours</span>
          </div>
        )}
      </div>

      {/* Pending Actions & Quick Service Simulator */}
      <div className="maintenance-actions-panel">
        <div className="actions-header">
          <h4 className="actions-title">Pending Maintenance Actions ({pendingActions.length})</h4>
          {pendingActions.length > 0 && (
            <button
              className="service-btn"
              onClick={handleSimulateService}
              data-testid="simulate-service-btn"
            >
              ✓ Complete Certified Depot Service
            </button>
          )}
        </div>

        {pendingActions.length === 0 ? (
          <div className="all-clear-banner" data-testid="all-clear-banner">
            <span>✓ All components within safety tolerances. Ready for long-haul produce transit.</span>
          </div>
        ) : (
          <ul className="actions-list" data-testid="pending-actions-list">
            {pendingActions.map(action => (
              <li key={action.item} className={`action-item ${action.urgency.toLowerCase()}`}>
                <div className="action-info">
                  <span className={`urgency-badge ${action.urgency.toLowerCase()}`}>{action.urgency}</span>
                  <span className="action-name">{action.item}</span>
                </div>
                <strong className="action-cost">₦{action.costNgn.toLocaleString()}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

FleetMaintenanceHealthCard.propTypes = {
  className: PropTypes.string
};
