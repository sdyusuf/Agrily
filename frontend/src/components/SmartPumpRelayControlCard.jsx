import React from 'react';
import './SmartPumpRelayControlCard.css';

/**
 * SmartPumpRelayControlCard
 * Displays Hazen-Williams pipeline friction head loss, Total Dynamic Head (TDH),
 * Solar PV vs. Diesel pump energy economics, and safety-interlocked contactor actuation controls.
 */
const SmartPumpRelayControlCard = ({
  pumps = [],
  selectedPump = null,
  onSelectPump = () => {},
  onDispatchRelayCommand = () => {},
  onOpenManualOverrideModal = () => {},
}) => {
  const activePump = selectedPump || (pumps.length > 0 ? pumps[0] : null);
  const hyd = activePump?.hydraulics || {
    flowRateM3PerHour: 68.0,
    totalFrictionHeadLossM: 5.14,
    totalDynamicHeadMeters: 50.15,
    hydraulicPowerKw: 9.29,
    electricalInputPowerKw: 13.79,
    recommendedSolarPvArrayKwp: 17.65,
    pumpingDurationHours: 9.41,
    totalEnergyKwh: 129.8,
    dieselFuelCostSavedNgn: 49064,
  };

  const contactorState = activePump?.contactorState || 'ENERGIZED_PUMPING';
  const isEnergized =
    contactorState === 'ENERGIZED_PUMPING' ||
    contactorState === 'FERTIGATION_VENTURI_DOSING';

  return (
    <div
      className="smart-pump-card"
      data-testid="smart-pump-relay-control-card"
    >
      <div className="smart-pump-header">
        <div>
          <span className="smart-pump-eyebrow">
            HAZEN-WILLIAMS HYDRAULICS &amp; LO-RA RELAY TELEMETRY
          </span>
          <h3 className="smart-pump-title">
            {activePump?.stationName || 'Kura Solar-MPPT Submersible Pump Station #1'}
          </h3>
        </div>
        <span
          className={`smart-pump-status-pill ${
            isEnergized ? 'pill-energized' : 'pill-standby'
          }`}
          data-testid="pump-contactor-state-pill"
        >
          {contactorState}
        </span>
      </div>

      {/* Station selector pills */}
      {pumps.length > 0 && (
        <div className="smart-pump-station-bar">
          {pumps.map((p) => {
            const isSelected = activePump?.relayNodeCode === p.relayNodeCode;
            return (
              <button
                key={p.relayNodeCode}
                type="button"
                className={`smart-pump-node-btn ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectPump(p)}
                data-testid={`select-pump-btn-${p.relayNodeCode}`}
              >
                <span>{p.relayNodeCode}</span>
                <small>{p.powerSourceType?.replace(/_/g, ' ')}</small>
              </button>
            );
          })}
        </div>
      )}

      {/* Hazen-Williams Hydraulic Metrics Grid */}
      <div className="smart-pump-metrics-grid">
        <div className="smart-pump-metric-tile">
          <span className="sp-metric-label">Discharge Flow (Q)</span>
          <strong className="sp-metric-val" data-testid="pump-flow-rate-readout">
            {hyd.flowRateM3PerHour} m³/h
          </strong>
          <small className="sp-metric-sub">
            Pipe Ø {activePump?.pipeInnerDiameterMm || 110} mm HDPE
          </small>
        </div>

        <div className="smart-pump-metric-tile">
          <span className="sp-metric-label">Hazen-Williams Friction (hf)</span>
          <strong className="sp-metric-val" data-testid="pump-friction-loss-readout">
            {hyd.totalFrictionHeadLossM} m
          </strong>
          <small className="sp-metric-sub">
            TDH: {hyd.totalDynamicHeadMeters} m head
          </small>
        </div>

        <div className="smart-pump-metric-tile">
          <span className="sp-metric-label">Shaft Power &amp; Solar Array</span>
          <strong className="sp-metric-val" data-testid="pump-power-kw-readout">
            {hyd.electricalInputPowerKw} kW
          </strong>
          <small className="sp-metric-sub">
            PV Array: {hyd.recommendedSolarPvArrayKwp} kWp
          </small>
        </div>

        <div className="smart-pump-metric-tile highlight-ochre">
          <span className="sp-metric-label">Diesel Offset Savings</span>
          <strong className="sp-metric-val" data-testid="pump-diesel-saved-readout">
            ₦{Number(hyd.dieselFuelCostSavedNgn || 0).toLocaleString()}
          </strong>
          <small className="sp-metric-sub">
            Cycle: {hyd.pumpingDurationHours} hrs ({hyd.totalEnergyKwh} kWh)
          </small>
        </div>
      </div>

      {/* Safety Interlocks Banner */}
      <div className="smart-pump-safety-strip" data-testid="pump-safety-interlock-strip">
        <div className="safety-check-item">
          <span className="safety-dot ok" />
          <span>
            Borehole Drawdown Probe:{' '}
            <strong>
              {activePump?.boreholeDrawdownOk !== false ? 'SUBMERGED SAFE' : 'LOW LEVEL TRIP'}
            </strong>
          </span>
        </div>
        <div className="safety-check-item">
          <span className="safety-dot ok" />
          <span>
            Disc Filter ΔP:{' '}
            <strong>{activePump?.filterDifferentialPressureBar ?? 0.24} bar</strong> (Max 0.75 bar)
          </span>
        </div>
      </div>

      {/* Relay Action Buttons */}
      <div className="smart-pump-actions">
        <button
          type="button"
          className="sp-btn sp-btn-primary"
          onClick={() =>
            onDispatchRelayCommand({
              relayNodeCode: activePump?.relayNodeCode || 'PMP-RLY-1001',
              commandAction: 'ENERGIZE_PUMP',
              targetRuntimeMinutes: 180,
            })
          }
          data-testid="energize-pump-relay-btn"
        >
          Energize Main Contactor (3h Cycle)
        </button>

        <button
          type="button"
          className="sp-btn sp-btn-ochre"
          onClick={() =>
            onDispatchRelayCommand({
              relayNodeCode: activePump?.relayNodeCode || 'PMP-RLY-1001',
              commandAction: 'FERTIGATION_PULSE',
              targetRuntimeMinutes: 45,
            })
          }
          data-testid="fertigation-pulse-relay-btn"
        >
          Trigger Venturi Fertigation Pulse
        </button>

        <button
          type="button"
          className="sp-btn sp-btn-outline"
          onClick={onOpenManualOverrideModal}
          data-testid="open-manual-valve-override-btn"
        >
          Manual Solenoid Override &amp; Backflush
        </button>
      </div>
    </div>
  );
};

export default SmartPumpRelayControlCard;
