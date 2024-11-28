import React, { useState } from 'react';
import './ManualValveOverrideModal.css';

/**
 * ManualValveOverrideModal
 * Allows irrigation engineers and farm supervisors to dispatch manual solenoid
 * valve overrides, disc-filter backflush cycles, or tensiometer calibration packets.
 */
const ManualValveOverrideModal = ({
  isOpen = false,
  onClose = () => {},
  selectedPump = null,
  onSubmitOverride = () => {},
}) => {
  const [relayNodeCode, setRelayNodeCode] = useState(
    selectedPump?.relayNodeCode || 'PMP-RLY-1001'
  );
  const [commandAction, setCommandAction] = useState('ENERGIZE_PUMP');
  const [targetRuntimeMinutes, setTargetRuntimeMinutes] = useState(120);
  const [filterDifferentialPressureBar, setFilterDifferentialPressureBar] =
    useState(0.26);
  const [boreholeDrawdownOk, setBoreholeDrawdownOk] = useState(true);
  const [operatorNotes, setOperatorNotes] = useState(
    'Scheduled afternoon root-zone refill cycle per FAO-56 tensiometer telemetry.'
  );

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitOverride({
      relayNodeCode,
      commandAction,
      targetRuntimeMinutes: Number(targetRuntimeMinutes),
      filterDifferentialPressureBar: Number(filterDifferentialPressureBar),
      boreholeDrawdownOk,
      operatorNotes,
    });
  };

  return (
    <div
      className="valve-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="valve-override-modal-title"
      data-testid="manual-valve-override-modal"
    >
      <div className="valve-modal-container">
        <div className="valve-modal-header">
          <div>
            <span className="valve-modal-eyebrow">
              LO-RA SOLENOID &amp; CONTACTOR SAFETY CONSOLE
            </span>
            <h2 id="valve-override-modal-title" className="valve-modal-title">
              Manual Pump &amp; Solenoid Valve Override
            </h2>
          </div>
          <button
            type="button"
            className="valve-modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
            data-testid="close-valve-override-modal-btn"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="valve-modal-form">
          <div className="valve-form-row">
            <label htmlFor="override-relay-code">Target Pump Relay Node</label>
            <select
              id="override-relay-code"
              value={relayNodeCode}
              onChange={(e) => setRelayNodeCode(e.target.value)}
              data-testid="override-relay-node-select"
            >
              <option value="PMP-RLY-1001">
                PMP-RLY-1001 — Kura Solar-MPPT Submersible Station #1
              </option>
              <option value="PMP-RLY-1002">
                PMP-RLY-1002 — Garun Mallam Center-Pivot Booster #2
              </option>
              <option value="PMP-RLY-1003">
                PMP-RLY-1003 — Goronyo Canal Lift &amp; Venturi Skid #3
              </option>
            </select>
          </div>

          <div className="valve-form-row">
            <label htmlFor="override-command-action">Contactor / Solenoid Action</label>
            <select
              id="override-command-action"
              value={commandAction}
              onChange={(e) => setCommandAction(e.target.value)}
              data-testid="override-command-action-select"
            >
              <option value="ENERGIZE_PUMP">
                ENERGIZE_PUMP — Full Root-Zone Refill Cycle
              </option>
              <option value="FERTIGATION_PULSE">
                FERTIGATION_PULSE — Venturi NPK Solenoid Injection
              </option>
              <option value="EMERGENCY_STOP">
                EMERGENCY_STOP — Immediate Contactor De-Energize
              </option>
            </select>
          </div>

          <div className="valve-form-grid-2">
            <div className="valve-form-row">
              <label htmlFor="override-runtime-minutes">
                Target Runtime (Minutes)
              </label>
              <input
                id="override-runtime-minutes"
                type="number"
                min="5"
                max="1440"
                value={targetRuntimeMinutes}
                onChange={(e) => setTargetRuntimeMinutes(e.target.value)}
                data-testid="override-runtime-input"
              />
            </div>

            <div className="valve-form-row">
              <label htmlFor="override-filter-dp">
                Disc Filter ΔP (bar)
              </label>
              <input
                id="override-filter-dp"
                type="number"
                step="0.05"
                min="0.05"
                max="1.5"
                value={filterDifferentialPressureBar}
                onChange={(e) => setFilterDifferentialPressureBar(e.target.value)}
                data-testid="override-filter-dp-input"
              />
            </div>
          </div>

          <div className="valve-checkbox-row">
            <input
              id="borehole-drawdown-check"
              type="checkbox"
              checked={boreholeDrawdownOk}
              onChange={(e) => setBoreholeDrawdownOk(e.target.checked)}
              data-testid="override-borehole-ok-checkbox"
            />
            <label htmlFor="borehole-drawdown-check">
              Borehole Stilling-Well Level Above Cavitation Cutout Probe
            </label>
          </div>

          <div className="valve-form-row">
            <label htmlFor="override-operator-notes">Agronomist / Operator Log</label>
            <textarea
              id="override-operator-notes"
              rows="2"
              value={operatorNotes}
              onChange={(e) => setOperatorNotes(e.target.value)}
              data-testid="override-operator-notes-input"
            />
          </div>

          <div className="valve-modal-footer">
            <button
              type="button"
              className="valve-btn-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="valve-btn-submit"
              data-testid="submit-valve-override-btn"
            >
              Dispatch LoRa Relay Packet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualValveOverrideModal;
