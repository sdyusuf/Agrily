import React from 'react';
import PropTypes from 'prop-types';
import './EscrowStatusBadge.css';

/**
 * Clean SVG icons compliant with DESIGN_SYSTEM.md (No emojis)
 */
const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const TruckShieldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 17h4V5H2v12h3" />
    <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1" />
    <circle cx="7.5" cy="17.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const UndoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
);

const STATUS_CONFIGS = {
  INITIALIZED: {
    label: 'Escrow Initialized',
    className: 'escrow-badge-init',
    icon: LockIcon
  },
  DEPOSITED_LOCKED: {
    label: 'Funds Locked in Escrow',
    className: 'escrow-badge-locked',
    icon: LockIcon
  },
  IN_TRANSIT_SECURED: {
    label: 'In-Transit Secured',
    className: 'escrow-badge-transit',
    icon: TruckShieldIcon
  },
  INSPECTION_PENDING: {
    label: 'Inspection Window Open',
    className: 'escrow-badge-inspection',
    icon: ClockIcon
  },
  RELEASED_TO_FARMER: {
    label: 'Disbursed to Producer',
    className: 'escrow-badge-released',
    icon: CheckCircleIcon
  },
  DISPUTED: {
    label: 'Arbitration Freeze',
    className: 'escrow-badge-disputed',
    icon: AlertTriangleIcon
  },
  REFUNDED: {
    label: 'Refunded to Buyer',
    className: 'escrow-badge-refunded',
    icon: UndoIcon
  }
};

const STAGES = [
  { key: 'DEPOSITED_LOCKED', label: '1. Deposit Locked' },
  { key: 'IN_TRANSIT_SECURED', label: '2. Transit Checkpoint' },
  { key: 'INSPECTION_PENDING', label: '3. Inspection Period' },
  { key: 'RELEASED_TO_FARMER', label: '4. Disbursed' }
];

export default function EscrowStatusBadge({
  status = 'INITIALIZED',
  showStepper = false,
  currency = 'NGN',
  amount = 0,
  amountReleased = 0,
  onClick = null
}) {
  const config = STATUS_CONFIGS[status] || STATUS_CONFIGS.INITIALIZED;
  const IconComponent = config.icon;

  const currentStageIndex = STAGES.findIndex(s => s.key === status);

  return (
    <div
      className="agrily-escrow-badge-container"
      data-testid="escrow-status-badge"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className={`escrow-pill-badge ${config.className}`}>
        <span className="badge-pulse-indicator" />
        <span className="badge-icon-wrap" aria-hidden="true">
          <IconComponent />
        </span>
        <span className="badge-status-text">{config.label}</span>
      </div>

      {showStepper && (
        <div className="escrow-stepper-track" aria-label="Escrow Lifecycle Progress">
          {STAGES.map((stage, idx) => {
            const isCompleted = currentStageIndex > idx || status === 'RELEASED_TO_FARMER';
            const isCurrent = currentStageIndex === idx && status !== 'RELEASED_TO_FARMER';

            return (
              <div
                key={stage.key}
                className={`stepper-node ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''}`}
              >
                <div className="stepper-dot">
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span className="stepper-label">{stage.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {amount > 0 && (
        <div className="escrow-amount-micro-bar">
          <span className="amount-locked-text">
            Locked: <strong>{currency} {Number(amount).toLocaleString()}</strong>
          </span>
          {amountReleased > 0 && (
            <span className="amount-released-tag">
              ({currency} {Number(amountReleased).toLocaleString()} released)
            </span>
          )}
        </div>
      )}
    </div>
  );
}

EscrowStatusBadge.propTypes = {
  status: PropTypes.string,
  showStepper: PropTypes.bool,
  currency: PropTypes.string,
  amount: PropTypes.number,
  amountReleased: PropTypes.number,
  onClick: PropTypes.func
};
