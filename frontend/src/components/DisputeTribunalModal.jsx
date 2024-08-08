/**
 * ==============================================================================
 * 🌾 AGRILY AGRO-COMMERCE PLATFORM: DISPUTE TRIBUNAL MODAL COMPONENT
 * ==============================================================================
 * 
 * Interactive arbitration chamber modal for docketing escrow claims,
 * attaching telemetry evidence, and simulating algorithmic tribunal rulings.
 * Strictly adheres to DESIGN_SYSTEM.md ("Earth & Innovation" tokens).
 * 
 * @module components/DisputeTribunalModal
 * @author Agrily Frontend Engineering
 * ==============================================================================
 */

import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import './DisputeTribunalModal.css';

const baseSvgProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
};

const ScaleIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} {...baseSvgProps} className={className}>
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="M7 21h10" />
    <path d="M12 3v18" />
    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
  </svg>
);

const AlertTriangleIcon = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} {...baseSvgProps} className={className}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const ThermometerIcon = ({ size = 18 }) => (
  <svg width={size} height={size} {...baseSvgProps}>
    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
  </svg>
);

const FileTextIcon = ({ size = 18 }) => (
  <svg width={size} height={size} {...baseSvgProps}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const CpuIcon = ({ size = 18 }) => (
  <svg width={size} height={size} {...baseSvgProps}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" />
    <line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" />
    <line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" />
    <line x1="20" y1="14" x2="23" y2="14" />
    <line x1="1" y1="9" x2="4" y2="9" />
    <line x1="1" y1="14" x2="4" y2="14" />
  </svg>
);

const CloseIcon = ({ size = 20 }) => (
  <svg width={size} height={size} {...baseSvgProps}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const DISPUTE_REASONS = [
  { value: 'EXCESSIVE_SPOILAGE_ROTTEN', label: 'Excessive Spoilage & Rotten Produce (>8% threshold)' },
  { value: 'TRANSIT_COLD_CHAIN_FAILURE', label: 'Cold-Chain Reefer Failure / Temperature Excursion' },
  { value: 'QUANTITY_WEIGHT_SHORTAGE', label: 'Produce Weight / Crate Quantity Shortage at Dock' },
  { value: 'FOREIGN_MATTER_CONTAMINATION', label: 'Foreign Contaminants / Statutory Defect Exceeded' },
  { value: 'LATE_DELIVERY_DECAY', label: 'Unreasonable Transit Delay Leading to Produce Decay' },
  { value: 'COUNTERFEIT_SUBSTANDARD_GRADE', label: 'Grade Substandard / Produce Not As Represented' }
];

export default function DisputeTribunalModal({
  show,
  onClose,
  vault = {},
  onSubmitDispute,
  isSubmitting = false
}) {
  const [reasonCategory, setReasonCategory] = useState('EXCESSIVE_SPOILAGE_ROTTEN');
  const [disputedAmountClaimNgn, setDisputedAmountClaimNgn] = useState(
    Math.round((Number(vault?.totalPrincipalNgn) || 1000000) * 0.5)
  );
  const [description, setDescription] = useState('');
  const [transitMaxTempCelsius, setTransitMaxTempCelsius] = useState(14.5);
  const [spoilageMeasuredPct, setSpoilageMeasuredPct] = useState(9.5);
  const [errorMsg, setErrorMsg] = useState('');

  // Simulated live algorithmic verdict preview
  const simulatedRuling = useMemo(() => {
    let outcome = 'SETTLEMENT_SPLIT';
    let carrierFaultPct = 0;
    let farmerFaultPct = 0;
    let rationale = '';

    if (reasonCategory === 'TRANSIT_COLD_CHAIN_FAILURE' || transitMaxTempCelsius > 12.0) {
      carrierFaultPct = 80;
      farmerFaultPct = 20;
      outcome = 'CARRIER_LIABLE_DEDUCTION';
      rationale = `IoT telematics confirmed temperature reached ${transitMaxTempCelsius}°C exceeding 10°C cold chain limit. Primary liability assigned to logistics carrier.`;
    } else if (spoilageMeasuredPct > 15.0) {
      farmerFaultPct = 85;
      carrierFaultPct = 15;
      outcome = 'FULL_REFUND_BUYER';
      rationale = `Severe decay rate (${spoilageMeasuredPct}%) exceeds dock intake limits. Farmer harvest quality non-compliant with Grade A standards.`;
    } else {
      farmerFaultPct = 50;
      carrierFaultPct = 50;
      outcome = 'SETTLEMENT_SPLIT';
      rationale = 'Pro-rata compromise ruling recommended with shared risk distribution across parties.';
    }

    return { outcome, carrierFaultPct, farmerFaultPct, rationale };
  }, [reasonCategory, transitMaxTempCelsius, spoilageMeasuredPct]);

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!description.trim() || description.length < 15) {
      setErrorMsg('Please provide a substantive claim description (minimum 15 characters).');
      return;
    }

    const payload = {
      disputeReasonCategory: reasonCategory,
      disputedAmountClaimNgn: Number(disputedAmountClaimNgn),
      claimantStatement: description,
      evidenceLocker: {
        iotTemperatureLogs: [
          {
            sensorId: 'IOT-REEFER-099',
            recordedAt: new Date().toISOString(),
            temperatureCelsius: Number(transitMaxTempCelsius),
            location: 'Lagos-Ibadan Agro Corridor KM 42'
          }
        ],
        dockReceiptPhotos: [
          {
            url: 'https://storage.agrily.com/evidence/dock-spoilage-001.webp',
            caption: 'Dockside inspection crate decay inspection'
          }
        ]
      }
    };

    if (onSubmitDispute) {
      onSubmitDispute(payload);
    }
  };

  return (
    <div className="tribunal-modal-overlay" role="dialog" aria-modal="true" data-testid="dispute-tribunal-modal">
      <div className="tribunal-modal-container">
        {/* Modal Header */}
        <div className="tribunal-modal-header">
          <div className="tribunal-header-branding">
            <span className="tribunal-icon-badge">
              <ScaleIcon size={22} />
            </span>
            <div>
              <h2 className="tribunal-title">Escrow Dispute Tribunal Chamber</h2>
              <p className="tribunal-subtitle">
                Docketing Formal Arbitration for Vault <strong>{vault?.vaultNumber || 'VAULT-CURRENT'}</strong>
              </p>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close arbitration dialog">
            <CloseIcon size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="tribunal-modal-body">
            {errorMsg && (
              <div className="tribunal-alert-box error" role="alert">
                <AlertTriangleIcon size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Algorithmic Simulator Box */}
            <div className="ruling-simulator-card">
              <div className="simulator-header">
                <span className="simulator-badge">
                  <CpuIcon size={16} />
                  <span>Algorithmic Adjudication Engine</span>
                </span>
                <span className="simulator-status">Simulated Real-Time Liability</span>
              </div>
              <p className="simulator-rationale">{simulatedRuling.rationale}</p>
              <div className="liability-split-preview">
                <div className="liability-col carrier">
                  <span className="liability-label">Logistics Carrier Fault</span>
                  <strong className="liability-val">{simulatedRuling.carrierFaultPct}%</strong>
                </div>
                <div className="liability-col farmer">
                  <span className="liability-label">Producer Harvest Fault</span>
                  <strong className="liability-val">{simulatedRuling.farmerFaultPct}%</strong>
                </div>
              </div>
            </div>

            {/* Dispute Cause & Claim Amount */}
            <div className="input-grid two-col">
              <div className="form-group">
                <label className="input-label">Statutory Dispute Reason</label>
                <select
                  className="form-control"
                  value={reasonCategory}
                  onChange={(e) => setReasonCategory(e.target.value)}
                  data-testid="select-dispute-reason"
                >
                  {DISPUTE_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="input-label">Claimed Refund Amount (NGN)</label>
                <input
                  type="number"
                  className="form-control"
                  value={disputedAmountClaimNgn}
                  onChange={(e) => setDisputedAmountClaimNgn(e.target.value)}
                  min="1"
                  max={vault?.totalPrincipalNgn || 50000000}
                  required
                  data-testid="input-disputed-amount"
                />
              </div>
            </div>

            {/* Evidence Telemetry Parameters */}
            <div className="evidence-section-card">
              <h3 className="evidence-heading">IoT Telematics & Dockside Evidence</h3>
              <div className="input-grid two-col">
                <div className="evidence-slider-box">
                  <div className="evidence-label-row">
                    <span><ThermometerIcon size={16} /> Max Transit Reefer Temp</span>
                    <strong className="evidence-val">{transitMaxTempCelsius}°C</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="35"
                    step="0.5"
                    value={transitMaxTempCelsius}
                    onChange={(e) => setTransitMaxTempCelsius(parseFloat(e.target.value))}
                    className="metric-range"
                    data-testid="range-transit-temp"
                  />
                  <div className="evidence-subtext">&gt;12°C triggers carrier transit liability</div>
                </div>

                <div className="evidence-slider-box">
                  <div className="evidence-label-row">
                    <span><AlertTriangleIcon size={16} /> Measured Dock Spoilage Rate</span>
                    <strong className="evidence-val">{spoilageMeasuredPct}%</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="0.5"
                    value={spoilageMeasuredPct}
                    onChange={(e) => setSpoilageMeasuredPct(parseFloat(e.target.value))}
                    className="metric-range"
                    data-testid="range-spoilage-pct"
                  />
                  <div className="evidence-subtext">&gt;8% statutory rejection threshold</div>
                </div>
              </div>
            </div>

            {/* Description Textarea */}
            <div className="form-group">
              <label className="input-label">Detailed Claimant Statement & Factual Affidavit</label>
              <textarea
                className="form-control statement-textarea"
                rows="4"
                placeholder="Detail inspection failures, temperature excursions, and waybill discrepancies for tribunal review..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                data-testid="textarea-dispute-description"
              />
              <span className="character-count-hint">
                {description.length} characters (minimum 15 required)
              </span>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="tribunal-modal-footer">
            <button type="button" className="btn-agrily-outline" onClick={onClose} disabled={isSubmitting}>
              Dismiss
            </button>
            <button
              type="submit"
              className="btn-tribunal-freeze"
              disabled={isSubmitting}
              data-testid="btn-submit-dispute"
            >
              {isSubmitting ? 'Lodging Arbitration Docket...' : 'Freeze Escrow & Lodge Tribunal Docket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

DisputeTribunalModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  vault: PropTypes.shape({
    vaultNumber: PropTypes.string,
    totalPrincipalNgn: PropTypes.number
  }),
  onSubmitDispute: PropTypes.func,
  isSubmitting: PropTypes.bool
};
