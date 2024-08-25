import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './DemurrageDetentionCalculatorModal.css';

const TERMINAL_PRESETS = [
  { id: 'MILE12', name: 'Mile 12 Perishable Market, Lagos', freeHours: 2.0, hourlyRate: 38000, category: 'PERISHABLE_COLD_CHAIN' },
  { id: 'DAWANAU', name: 'Dawanau Grain Market, Kano', freeHours: 4.0, hourlyRate: 25000, category: 'DRY_GRAIN_AGGREGATION' },
  { id: 'ZAKIBIAM', name: 'Zaki Biam Yam Market, Benue', freeHours: 5.0, hourlyRate: 20000, category: 'TUBER_BULK_TERMINAL' },
  { id: 'APAPA', name: 'Apapa Seaport Container Gate, Lagos', freeHours: 6.0, hourlyRate: 50000, category: 'EXPORT_SEAPORT_CORRIDOR' }
];

export default function DemurrageDetentionCalculatorModal({ isOpen, onClose, className = '' }) {
  const [selectedTerminalId, setSelectedTerminalId] = useState('MILE12');
  const [dwellHours, setDwellHours] = useState(8.5);
  const [isReefer, setIsReefer] = useState(true);

  if (!isOpen) return null;

  const terminal = TERMINAL_PRESETS.find(t => t.id === selectedTerminalId) || TERMINAL_PRESETS[0];

  const billableHours = Math.max(0, parseFloat((dwellHours - terminal.freeHours).toFixed(1)));
  const baseDemurrage = Math.round(billableHours * terminal.hourlyRate);

  const nightStayovers = Math.floor(dwellHours / 18);
  const stayoverFee = nightStayovers * 35000;

  const reeferDieselLoss = isReefer && billableHours > 0 ? Math.round(billableHours * 3.5 * 1150) : 0;
  const totalDemurrage = baseDemurrage + stayoverFee + reeferDieselLoss;
  const driverPayout = Math.round(totalDemurrage * 0.90);

  return (
    <div className="demurrage-modal-backdrop" data-testid="demurrage-modal-backdrop" onClick={onClose}>
      <div
        className={`demurrage-modal-dialog ${className}`}
        data-testid="demurrage-detention-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="demurrage-modal-header">
          <div>
            <span className="demurrage-badge">⏳ OFF-LOAD CONGESTION & DETENTION</span>
            <h3 className="modal-title">Terminal Demurrage & Driver Protection</h3>
            <p className="modal-subtitle">
              Calculates gate dwell detention penalties, night stayover surcharges, and direct carrier compensation.
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
            data-testid="close-modal-btn"
          >
            ✕
          </button>
        </div>

        <div className="modal-controls-grid">
          <div className="modal-control-group">
            <label htmlFor="terminal-select" className="modal-label">Terminal Market Hub</label>
            <select
              id="terminal-select"
              value={selectedTerminalId}
              onChange={(e) => setSelectedTerminalId(e.target.value)}
              className="modal-select"
              data-testid="terminal-select"
            >
              {TERMINAL_PRESETS.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="modal-control-group">
            <label htmlFor="dwell-slider" className="modal-label">
              Total Terminal Dwell Time: <strong>{dwellHours} Hours</strong>
            </label>
            <input
              id="dwell-slider"
              type="range"
              min="1"
              max="36"
              step="0.5"
              value={dwellHours}
              onChange={(e) => setDwellHours(Number(e.target.value))}
              className="modal-range"
              data-testid="dwell-range-slider"
            />
          </div>

          <div className="modal-control-group checkbox-align">
            <label className="reefer-toggle-label" htmlFor="aux-reefer-toggle">
              <input
                id="aux-reefer-toggle"
                type="checkbox"
                checked={isReefer}
                onChange={(e) => setIsReefer(e.target.checked)}
                data-testid="aux-reefer-toggle"
              />
              <span>Reefer Compressor Running (Stationary Fuel Burn)</span>
            </label>
          </div>
        </div>

        {/* Dynamic Dwell Breakdown Bar */}
        <div className="dwell-visual-container">
          <div className="dwell-bar-header">
            <span>Free Dwell Allowance: <strong>{terminal.freeHours} hrs</strong></span>
            <span>
              Billable Detention:{' '}
              <strong className={billableHours > 0 ? 'text-danger' : 'text-success'} data-testid="billable-hours-text">
                {billableHours} hrs
              </strong>
            </span>
          </div>
          <div className="dwell-progress-track">
            <div
              className="dwell-free-portion"
              style={{ width: `${Math.min(100, (terminal.freeHours / Math.max(terminal.freeHours, dwellHours)) * 100)}%` }}
            />
            {billableHours > 0 && (
              <div
                className="dwell-billable-portion"
                style={{ width: `${Math.min(100, (billableHours / Math.max(terminal.freeHours, dwellHours)) * 100)}%` }}
              />
            )}
          </div>
        </div>

        {/* Financial Calculation Summary */}
        <div className="demurrage-payout-panel">
          <div className="payout-row">
            <span>Hourly Detention Rate ({terminal.name.split(',')[0]}):</span>
            <strong>₦{terminal.hourlyRate.toLocaleString()} / hr</strong>
          </div>
          <div className="payout-row">
            <span>Base Detention Surcharge ({billableHours} hrs):</span>
            <strong>₦{baseDemurrage.toLocaleString()}</strong>
          </div>
          {stayoverFee > 0 && (
            <div className="payout-row stayover">
              <span>Night Stayover Surcharge ({nightStayovers} nights):</span>
              <strong>+₦{stayoverFee.toLocaleString()}</strong>
            </div>
          )}
          {reeferDieselLoss > 0 && (
            <div className="payout-row reefer">
              <span>Stationary Reefer Chiller Fuel Loss:</span>
              <strong>+₦{reeferDieselLoss.toLocaleString()}</strong>
            </div>
          )}
          <div className="payout-row total-row">
            <span>Total Demurrage Invoice:</span>
            <strong className="invoice-total" data-testid="total-demurrage-text">
              ₦{totalDemurrage.toLocaleString()}
            </strong>
          </div>
          <div className="carrier-share-banner">
            <span>Driver Payout (90% Platform Guarantee):</span>
            <strong className="carrier-payout-val" data-testid="driver-payout-text">
              ₦{driverPayout.toLocaleString()}
            </strong>
          </div>
        </div>

        <div className="modal-footer-actions">
          <button
            type="button"
            className="dismiss-btn"
            onClick={onClose}
            data-testid="dismiss-modal-btn"
          >
            Close Calculator
          </button>
        </div>
      </div>
    </div>
  );
}

DemurrageDetentionCalculatorModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  className: PropTypes.string
};
