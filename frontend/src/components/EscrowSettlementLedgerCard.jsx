/**
 * ==============================================================================
 * 🌾 AGRILY AGRO-COMMERCE PLATFORM: ESCROW SETTLEMENT LEDGER CARD
 * ==============================================================================
 * 
 * Interactive tri-party escrow vault card displaying financial breakdown,
 * milestone sequence, SON/NAFDAC inspection grade, and arbitration state.
 * Strictly adheres to DESIGN_SYSTEM.md ("Earth & Innovation" tokens).
 * 
 * @module components/EscrowSettlementLedgerCard
 * @author Agrily Frontend Engineering
 * ==============================================================================
 */

import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import './EscrowSettlementLedgerCard.css';

// SVG Icons (Compliant with DESIGN_SYSTEM.md - No Emojis)
const baseSvgProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
};

const LockIcon = ({ size = 16 }) => (
  <svg width={size} height={size} {...baseSvgProps}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const TruckIcon = ({ size = 16 }) => (
  <svg width={size} height={size} {...baseSvgProps}>
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const AwardCheckIcon = ({ size = 16 }) => (
  <svg width={size} height={size} {...baseSvgProps}>
    <circle cx="12" cy="8" r="7" />
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </svg>
);

const ScaleIcon = ({ size = 16 }) => (
  <svg width={size} height={size} {...baseSvgProps}>
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="M7 21h10" />
    <path d="M12 3v18" />
    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
  </svg>
);

const CheckCircleIcon = ({ size = 16 }) => (
  <svg width={size} height={size} {...baseSvgProps}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const ClockIcon = ({ size = 16 }) => (
  <svg width={size} height={size} {...baseSvgProps}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const DownloadIcon = ({ size = 16 }) => (
  <svg width={size} height={size} {...baseSvgProps}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const STATUS_MAP = {
  INITIALIZED: { label: 'Vault Created', className: 'status-init' },
  DEPOSITED_LOCKED: { label: 'Locked in Escrow', className: 'status-locked' },
  IN_TRANSIT: { label: 'Produce in Transit', className: 'status-transit' },
  DELIVERED_PENDING_INSPECTION: { label: 'Inspection Window Active', className: 'status-inspecting' },
  INSPECTION_PASSED: { label: 'Quality Verified (SON)', className: 'status-passed' },
  FUNDS_DISBURSED: { label: 'Settled & Disbursed', className: 'status-disbursed' },
  IN_DISPUTE_ARBITRATION: { label: 'In Dispute Arbitration', className: 'status-dispute' },
  RESOLVED_SETTLED: { label: 'Dispute Resolved', className: 'status-resolved' },
  REFUNDED_BUYER: { label: 'Refunded to Buyer', className: 'status-refunded' }
};

const GRADE_MAP = {
  GRADE_A_EXPORT_PREMIUM: { label: 'Grade A: Export Premium', class: 'grade-pill-a' },
  GRADE_B_WHOLESALE_STANDARD: { label: 'Grade B: Wholesale Std', class: 'grade-pill-b' },
  GRADE_C_PROCESSING_ONLY: { label: 'Grade C: Processing', class: 'grade-pill-c' },
  REJECTED_UNFIT: { label: 'Rejected: Unfit', class: 'grade-pill-reject' }
};

export default function EscrowSettlementLedgerCard({
  vault = {},
  onInspect,
  onDispute,
  onRelease,
  onDownloadReceipt,
  userRole = 'buyer',
  isActionLoading = false
}) {
  const [copied, setCopied] = useState(false);

  const statusConfig = STATUS_MAP[vault.status] || {
    label: vault.status || 'Active',
    className: 'status-default'
  };

  const handleCopyVault = () => {
    if (vault.vaultNumber && navigator.clipboard) {
      navigator.clipboard.writeText(vault.vaultNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Safe currency formatter for Nigerian Naira (NGN)
  const formatNgn = (val) => {
    const num = Number(val) || 0;
    return `₦${num.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calculate percentages for the multi-split visual bar
  const total = Number(vault.totalPrincipalNgn) || 1;
  const farmerPct = Math.round(((Number(vault.farmerPayoutNgn) || 0) / total) * 100);
  const carrierPct = Math.round(((Number(vault.carrierFeeNgn) || 0) / total) * 100);
  const platformPct = Math.round(((Number(vault.platformCommissionFee) || 0) / total) * 100);
  const taxPct = Math.max(0, 100 - farmerPct - carrierPct - platformPct);

  // Remaining inspection countdown calculation
  const inspectionCountdown = useMemo(() => {
    if (!vault.inspectionWindowClosesAt) return null;
    const diff = new Date(vault.inspectionWindowClosesAt).getTime() - Date.now();
    if (diff <= 0) return 'Inspection window lapsed (Eligible for auto-release)';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m remaining in window`;
  }, [vault.inspectionWindowClosesAt]);

  const canInspect = ['DELIVERED_PENDING_INSPECTION', 'DEPOSITED_LOCKED', 'IN_TRANSIT'].includes(vault.status) &&
    ['buyer', 'admin'].includes(userRole);

  const canDispute = ['DELIVERED_PENDING_INSPECTION', 'INSPECTION_PASSED'].includes(vault.status) &&
    ['buyer', 'farmer', 'carrier', 'admin'].includes(userRole);

  const canRelease = ['INSPECTION_PASSED', 'DELIVERED_PENDING_INSPECTION'].includes(vault.status) &&
    ['buyer', 'admin'].includes(userRole);

  return (
    <div className="escrow-ledger-card" data-testid={`escrow-card-${vault.vaultNumber || 'item'}`}>
      {/* Top Header Row */}
      <div className="ledger-card-header">
        <div className="vault-id-meta">
          <span className="vault-icon-badge">
            <LockIcon size={18} />
          </span>
          <div>
            <div className="vault-number-row">
              <span className="vault-number-title" data-testid="vault-number-display">
                {vault.vaultNumber || 'VAULT-PENDING'}
              </span>
              <button
                type="button"
                className="btn-copy-chip"
                onClick={handleCopyVault}
                title="Copy Vault Number"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <span className="vault-date-meta">
              Locked on {vault.createdAt ? new Date(vault.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
            </span>
          </div>
        </div>

        <div className="vault-status-cluster">
          <span className={`status-pill ${statusConfig.className}`} data-testid="vault-status-badge">
            {statusConfig.label}
          </span>
          {vault.qualityCertificate?.assignedGrade && (
            <span
              className={`grade-pill ${GRADE_MAP[vault.qualityCertificate.assignedGrade]?.class || 'grade-pill-default'}`}
              data-testid="inspection-grade-pill"
            >
              <AwardCheckIcon size={14} />
              {GRADE_MAP[vault.qualityCertificate.assignedGrade]?.label || vault.qualityCertificate.assignedGrade}
            </span>
          )}
        </div>
      </div>

      {/* Financial Principal & Tri-Party Multi-Split Bar */}
      <div className="ledger-financial-section">
        <div className="principal-headline-row">
          <span className="principal-label">Total Vault Escrow Principal</span>
          <span className="principal-amount" data-testid="total-principal-display">
            {formatNgn(vault.totalPrincipalNgn)}
          </span>
        </div>

        {/* Visual Progress Split Bar */}
        <div className="split-progress-bar" title="Settlement Breakdown">
          <div
            className="split-segment farmer"
            style={{ width: `${farmerPct}%` }}
            title={`Farmer Payout: ${farmerPct}%`}
          />
          <div
            className="split-segment carrier"
            style={{ width: `${carrierPct}%` }}
            title={`Logistics Transit: ${carrierPct}%`}
          />
          <div
            className="split-segment platform"
            style={{ width: `${platformPct}%` }}
            title={`Agrily Platform: ${platformPct}%`}
          />
          <div
            className="split-segment tax"
            style={{ width: `${taxPct}%` }}
            title={`Tax/VAT: ${taxPct}%`}
          />
        </div>

        {/* Financial Breakdown Grid */}
        <div className="settlement-breakdown-grid">
          <div className="split-stat-box farmer">
            <span className="split-label">Farmer Harvest Net</span>
            <strong className="split-value" data-testid="farmer-payout-display">
              {formatNgn(vault.farmerPayoutNgn)}
            </strong>
            <span className="split-pct">{farmerPct}%</span>
          </div>

          <div className="split-stat-box carrier">
            <span className="split-label">Logistics Transit Fee</span>
            <strong className="split-value">
              {formatNgn(vault.carrierFeeNgn)}
            </strong>
            <span className="split-pct">{carrierPct}%</span>
          </div>

          <div className="split-stat-box platform">
            <span className="split-label">Agrily Platform Fee</span>
            <strong className="split-value">
              {formatNgn(vault.platformCommissionFee)}
            </strong>
            <span className="split-pct">{platformPct}%</span>
          </div>

          <div className="split-stat-box tax">
            <span className="split-label">Statutory VAT Withholding</span>
            <strong className="split-value">
              {formatNgn(vault.taxVatWithholding)}
            </strong>
            <span className="split-pct">{taxPct}%</span>
          </div>
        </div>
      </div>

      {/* Milestone Stepper */}
      <div className="ledger-milestone-stepper">
        <div className={`milestone-step ${(vault.milestones?.length || 0) >= 1 ? 'completed' : 'pending'}`}>
          <div className="step-circle"><LockIcon size={12} /></div>
          <span className="step-title">Vault Funded</span>
        </div>
        <div className="step-divider" />
        <div className={`milestone-step ${(vault.milestones?.length || 0) >= 2 || vault.status === 'IN_TRANSIT' ? 'completed' : 'pending'}`}>
          <div className="step-circle"><TruckIcon size={12} /></div>
          <span className="step-title">In Transit</span>
        </div>
        <div className="step-divider" />
        <div className={`milestone-step ${vault.qualityCertificate ? 'completed' : 'pending'}`}>
          <div className="step-circle"><AwardCheckIcon size={12} /></div>
          <span className="step-title">Inspected (SON)</span>
        </div>
        <div className="step-divider" />
        <div className={`milestone-step ${vault.status === 'FUNDS_DISBURSED' ? 'completed' : 'pending'}`}>
          <div className="step-circle"><CheckCircleIcon size={12} /></div>
          <span className="step-title">Settled</span>
        </div>
      </div>

      {/* Inspection Timer or Dispute Banner */}
      {vault.status === 'DELIVERED_PENDING_INSPECTION' && inspectionCountdown && (
        <div className="countdown-ribbon" data-testid="inspection-countdown-box">
          <ClockIcon size={16} />
          <span>{inspectionCountdown}</span>
        </div>
      )}

      {vault.status === 'IN_DISPUTE_ARBITRATION' && (
        <div className="dispute-alert-banner" data-testid="dispute-alert-banner">
          <ScaleIcon size={18} />
          <div>
            <strong>Tribunal Arbitration Docket Active</strong>
            <p>Case is under active algorithmic adjudication by the Agrily Evidence Tribunal.</p>
          </div>
        </div>
      )}

      {/* Interactive Action Footer */}
      <div className="ledger-card-actions">
        <div className="actions-left">
          {onDownloadReceipt && (
            <button
              type="button"
              className="btn-action-ghost"
              onClick={() => onDownloadReceipt(vault)}
              title="Download Cryptographic Receipt"
              data-testid="btn-download-receipt"
            >
              <DownloadIcon size={15} />
              <span>Audit Receipt</span>
            </button>
          )}
        </div>

        <div className="actions-right">
          {canDispute && onDispute && (
            <button
              type="button"
              className="btn-action-dispute"
              onClick={() => onDispute(vault)}
              disabled={isActionLoading}
              data-testid="btn-open-dispute"
            >
              <ScaleIcon size={15} />
              <span>Lodge Dispute</span>
            </button>
          )}

          {canInspect && onInspect && (
            <button
              type="button"
              className="btn-action-inspect"
              onClick={() => onInspect(vault)}
              disabled={isActionLoading}
              data-testid="btn-open-inspection"
            >
              <AwardCheckIcon size={15} />
              <span>Inspect Produce</span>
            </button>
          )}

          {canRelease && onRelease && (
            <button
              type="button"
              className="btn-action-release"
              onClick={() => onRelease(vault)}
              disabled={isActionLoading}
              data-testid="btn-release-vault"
            >
              <CheckCircleIcon size={15} />
              <span>Disburse Escrow</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

EscrowSettlementLedgerCard.propTypes = {
  vault: PropTypes.shape({
    vaultNumber: PropTypes.string,
    status: PropTypes.string,
    totalPrincipalNgn: PropTypes.number,
    farmerPayoutNgn: PropTypes.number,
    carrierFeeNgn: PropTypes.number,
    platformCommissionFee: PropTypes.number,
    taxVatWithholding: PropTypes.number,
    inspectionWindowClosesAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    qualityCertificate: PropTypes.object,
    milestones: PropTypes.array,
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
  }),
  onInspect: PropTypes.func,
  onDispute: PropTypes.func,
  onRelease: PropTypes.func,
  onDownloadReceipt: PropTypes.func,
  userRole: PropTypes.string,
  isActionLoading: PropTypes.bool
};
