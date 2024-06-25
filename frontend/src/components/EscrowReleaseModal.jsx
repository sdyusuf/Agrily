import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './EscrowReleaseModal.css';

const ShieldCheckIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export default function EscrowReleaseModal({
  isOpen = false,
  onClose,
  contract = null,
  milestone = null,
  onConfirmRelease,
  isSubmitting = false
}) {
  const [inspectionChecked, setInspectionChecked] = useState(false);
  const [coldChainChecked, setColdChainChecked] = useState(false);
  const [authSignature, setAuthSignature] = useState('');
  const [formError, setFormError] = useState('');

  if (!isOpen || !contract) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inspectionChecked || !coldChainChecked) {
      setFormError('Please complete both pre-release inspection checks.');
      return;
    }
    if (!authSignature || authSignature.trim().length < 4) {
      setFormError('Please enter your 4+ character authorization PIN or key.');
      return;
    }

    setFormError('');
    onConfirmRelease({
      contractId: contract.contractId,
      milestoneIndex: milestone?.index ?? 1,
      buyerSignature: authSignature.trim()
    });
  };

  const releaseAmount = milestone?.amount || contract.farmerPayoutAmount || 0;

  return (
    <div className="escrow-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="escrow-modal-card">
        <div className="escrow-modal-header">
          <div className="modal-header-icon-title">
            <div className="modal-icon-shield">
              <ShieldCheckIcon />
            </div>
            <div>
              <h3 id="modal-title" className="modal-title">Authorize Escrow Disbursement</h3>
              <p className="modal-subtitle">Dual-signature cryptographic release to verified farmer account</p>
            </div>
          </div>
          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            aria-label="Close Release Modal"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="escrow-modal-body">
          {formError && (
            <div className="escrow-modal-error" role="alert">
              {formError}
            </div>
          )}

          {/* Release Summary Box */}
          <div className="release-summary-card">
            <div className="summary-row">
              <span className="summary-label">Contract ID:</span>
              <span className="summary-val font-mono">{contract.contractId}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Produce Consignment:</span>
              <span className="summary-val">{contract.orderId}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Recipient Producer:</span>
              <span className="summary-val">{contract.farmerName} ({contract.farmerEmail})</span>
            </div>
            <div className="summary-divider" />
            <div className="summary-row highlight">
              <span className="summary-label">Disbursement Amount:</span>
              <span className="summary-amount">
                {contract.currency} {Number(releaseAmount).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Verification Checkboxes */}
          <div className="inspection-check-group">
            <h4 className="check-group-title">Inspection & Quality Audit Sign-Off</h4>

            <label className="inspection-checkbox-item">
              <input
                type="checkbox"
                checked={coldChainChecked}
                onChange={(e) => setColdChainChecked(e.target.checked)}
                disabled={isSubmitting}
              />
              <span className="check-text">
                <strong>Reefer Cold-Chain Integrity:</strong> Temperature and humidity readings maintained continuous compliance without unmitigated critical thermal excursions.
              </span>
            </label>

            <label className="inspection-checkbox-item">
              <input
                type="checkbox"
                checked={inspectionChecked}
                onChange={(e) => setInspectionChecked(e.target.checked)}
                disabled={isSubmitting}
              />
              <span className="check-text">
                <strong>Physical Cargo Acceptance:</strong> Quality, grade, packaging, and quantity verified in accordance with purchase order terms.
              </span>
            </label>
          </div>

          {/* Buyer Authorization Key */}
          <div className="auth-signature-group">
            <label htmlFor="authPin" className="auth-label">
              <LockIcon />
              <span>Buyer Authorization Signature / PIN</span>
            </label>
            <input
              id="authPin"
              type="password"
              className="auth-input"
              placeholder="e.g. AUTH-9821 or 6-digit PIN"
              value={authSignature}
              onChange={(e) => setAuthSignature(e.target.value)}
              disabled={isSubmitting}
              required
            />
            <span className="auth-hint">Enter your buyer credential to digitally sign this tranche release.</span>
          </div>

          {/* Modal Footer Controls */}
          <div className="escrow-modal-footer">
            <button
              type="button"
              className="btn-escrow-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-escrow-confirm"
              disabled={isSubmitting || !coldChainChecked || !inspectionChecked}
            >
              {isSubmitting ? 'Signing & Disbursing...' : 'Authorize Disbursement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

EscrowReleaseModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  contract: PropTypes.object,
  milestone: PropTypes.object,
  onConfirmRelease: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool
};
