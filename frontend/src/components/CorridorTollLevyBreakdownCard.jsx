import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './CorridorTollLevyBreakdownCard.css';

/**
 * State Produce Inspection Fees & Toll Rates (Naira)
 */
const STATE_PRODUCE_RATES = {
  Kano: { produceFee: 15000, forestryLevy: 5000, lgaSanitation: 3500 },
  Kaduna: { produceFee: 12000, forestryLevy: 4000, lgaSanitation: 3000 },
  Benue: { produceFee: 18000, forestryLevy: 6000, lgaSanitation: 4000 },
  Plateau: { produceFee: 14000, forestryLevy: 4500, lgaSanitation: 3000 },
  Oyo: { produceFee: 10000, forestryLevy: 3500, lgaSanitation: 2500 },
  Lagos: { produceFee: 20000, forestryLevy: 0, lgaSanitation: 6500 },
  Niger: { produceFee: 11000, forestryLevy: 4000, lgaSanitation: 2800 },
  Ogun: { produceFee: 9500, forestryLevy: 3000, lgaSanitation: 2500 }
};

export default function CorridorTollLevyBreakdownCard({ className = '' }) {
  const [originState, setOriginState] = useState('Kano');
  const [destinationState, setDestinationState] = useState('Lagos');
  const [cargoTonnage, setCargoTonnage] = useState(20);
  const [baseTariffNgn, setBaseTariffNgn] = useState(850000);

  const originLevies = STATE_PRODUCE_RATES[originState] || STATE_PRODUCE_RATES.Kano;
  const destLevies = STATE_PRODUCE_RATES[destinationState] || STATE_PRODUCE_RATES.Lagos;

  const originSubtotal = originLevies.produceFee + originLevies.forestryLevy + originLevies.lgaSanitation;
  const destSubtotal = destLevies.produceFee + destLevies.lgaSanitation;

  // Weighbridge compliance fee based on payload weight
  let weighbridgeFee = 2500;
  if (cargoTonnage > 25) weighbridgeFee = 5000;
  else if (cargoTonnage > 15) weighbridgeFee = 3500;

  const federalBridgeTolls = 5000; // e.g. Niger Bridge / Lokoja River Crossing
  const totalGovernmentLevies = originSubtotal + destSubtotal + weighbridgeFee + federalBridgeTolls;

  // Statutory 7.5% VAT on haulage logistics fee
  const haulageServiceVat = Math.round(baseTariffNgn * 0.075);
  const grandTotalCost = baseTariffNgn + haulageServiceVat + totalGovernmentLevies;

  return (
    <div className={`corridor-toll-card-container ${className}`} data-testid="corridor-toll-levy-breakdown-card">
      <div className="toll-card-header">
        <div>
          <span className="statutory-badge">🏛️ NIGERIAN TAX & STATUTORY TOLLS</span>
          <h3 className="toll-title">Interstate Produce Levies & Haulage VAT</h3>
          <p className="toll-subtitle">
            Transparent matrix of state farm-gate inspection levies, interstate bridge tolls, and statutory 7.5% logistics VAT.
          </p>
        </div>
        <div className="vat-exemption-pill" data-testid="vat-exemption-pill">
          <span className="pill-tag">VAT ACT COMPLIANT</span>
          <span className="pill-status">Raw Produce 0% VAT Exempt</span>
          <span className="pill-detail">Haulage Service 7.5% VAT</span>
        </div>
      </div>

      <div className="toll-controls-row">
        <div className="toll-input-group">
          <label htmlFor="origin-state-select" className="toll-label">Origin State (Farm Gate)</label>
          <select
            id="origin-state-select"
            value={originState}
            onChange={(e) => setOriginState(e.target.value)}
            className="toll-select"
            data-testid="origin-state-select"
          >
            {Object.keys(STATE_PRODUCE_RATES).map((st) => (
              <option key={st} value={st}>{st} State</option>
            ))}
          </select>
        </div>

        <div className="toll-input-group">
          <label htmlFor="destination-state-select" className="toll-label">Destination Terminal</label>
          <select
            id="destination-state-select"
            value={destinationState}
            onChange={(e) => setDestinationState(e.target.value)}
            className="toll-select"
            data-testid="destination-state-select"
          >
            {Object.keys(STATE_PRODUCE_RATES).map((st) => (
              <option key={st} value={st}>{st} State</option>
            ))}
          </select>
        </div>

        <div className="toll-input-group">
          <label htmlFor="corridor-tonnage-input" className="toll-label">Payload: <strong>{cargoTonnage}T</strong></label>
          <input
            id="corridor-tonnage-input"
            type="range"
            min="5"
            max="35"
            step="1"
            value={cargoTonnage}
            onChange={(e) => setCargoTonnage(Number(e.target.value))}
            className="toll-range"
            data-testid="corridor-tonnage-input"
          />
        </div>

        <div className="toll-input-group">
          <label htmlFor="tariff-input" className="toll-label">Haulage Tariff: <strong>₦{baseTariffNgn.toLocaleString()}</strong></label>
          <input
            id="tariff-input"
            type="range"
            min="300000"
            max="2000000"
            step="25000"
            value={baseTariffNgn}
            onChange={(e) => setBaseTariffNgn(Number(e.target.value))}
            className="toll-range"
            data-testid="base-tariff-input"
          />
        </div>
      </div>

      <div className="breakdown-grid" data-testid="levy-breakdown-grid">
        {/* Origin Farm Gate Clearance */}
        <div className="breakdown-column">
          <h4 className="column-title">1. {originState} Farm-Gate Outflow</h4>
          <ul className="fee-list">
            <li>
              <span>State Produce Inspection</span>
              <strong>₦{originLevies.produceFee.toLocaleString()}</strong>
            </li>
            <li>
              <span>State Forestry Produce Levy</span>
              <strong>₦{originLevies.forestryLevy.toLocaleString()}</strong>
            </li>
            <li>
              <span>LGA Sanitation & Loading Permit</span>
              <strong>₦{originLevies.lgaSanitation.toLocaleString()}</strong>
            </li>
            <li className="subtotal-row">
              <span>Origin Subtotal</span>
              <strong className="subtotal-val">₦{originSubtotal.toLocaleString()}</strong>
            </li>
          </ul>
        </div>

        {/* Transit Checkpoints & Bridges */}
        <div className="breakdown-column">
          <h4 className="column-title">2. Interstate Bridges & Scales</h4>
          <ul className="fee-list">
            <li>
              <span>Federal River Crossing Tolls</span>
              <strong>₦{federalBridgeTolls.toLocaleString()}</strong>
            </li>
            <li>
              <span>FRSC Weighbridge Scale ({cargoTonnage}T)</span>
              <strong>₦{weighbridgeFee.toLocaleString()}</strong>
            </li>
            <li>
              <span>Corridor Security Escort Levy</span>
              <strong>₦0 (Exempt)</strong>
            </li>
            <li className="subtotal-row">
              <span>Transit Subtotal</span>
              <strong className="subtotal-val">₦{(federalBridgeTolls + weighbridgeFee).toLocaleString()}</strong>
            </li>
          </ul>
        </div>

        {/* Destination Terminal Levies */}
        <div className="breakdown-column">
          <h4 className="column-title">3. {destinationState} Market Inflow</h4>
          <ul className="fee-list">
            <li>
              <span>Market Gate Inflow Clearance</span>
              <strong>₦{destLevies.produceFee.toLocaleString()}</strong>
            </li>
            <li>
              <span>Discharge Sanitation & Waste Fee</span>
              <strong>₦{destLevies.lgaSanitation.toLocaleString()}</strong>
            </li>
            <li>
              <span>Terminal Offload Demurrage Protection</span>
              <strong>Included (4h)</strong>
            </li>
            <li className="subtotal-row">
              <span>Destination Subtotal</span>
              <strong className="subtotal-val">₦{destSubtotal.toLocaleString()}</strong>
            </li>
          </ul>
        </div>
      </div>

      {/* Financial Summary & Total */}
      <div className="toll-summary-panel">
        <div className="summary-item">
          <span className="summary-lbl">Base Haulage Tariff</span>
          <span className="summary-amt">₦{baseTariffNgn.toLocaleString()}</span>
        </div>
        <div className="summary-item">
          <span className="summary-lbl">Haulage Service VAT (7.5%)</span>
          <span className="summary-amt" data-testid="vat-amount-display">₦{haulageServiceVat.toLocaleString()}</span>
        </div>
        <div className="summary-item">
          <span className="summary-lbl">Total Statutory Levies & Tolls</span>
          <span className="summary-amt">₦{totalGovernmentLevies.toLocaleString()}</span>
        </div>
        <div className="summary-item grand-total">
          <span className="summary-lbl">Total Comprehensive Freight Outlay</span>
          <span className="summary-amt total-val" data-testid="grand-total-tariff">₦{grandTotalCost.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

CorridorTollLevyBreakdownCard.propTypes = {
  className: PropTypes.string
};
