/**
 * ============================================================================
 * AGRILY AGRICULTURAL COMMERCE & PROVENANCE PLATFORM
 * TrustBadge & VerificationSeal Components
 * ============================================================================
 * 
 * @component TrustBadge
 * @component VerificationSeal
 * @module frontend/src/components/TrustBadge
 * @description
 * High-visibility agricultural trust, KYC verification, and provenance badges.
 * Built according to the Agrily Design System tokens to give buyers instant clarity
 * regarding producer authenticity, field verification status, and historical fulfillment trust scores.
 * 
 * Visual Semantics:
 *  - Verified: Deep emerald badge (#1b4332 / #2d6a4f) with verified agricultural leaf/shield icon.
 *  - Pending: Warm ochre badge (#bc6c25 / #dda15e) indicating KYC submission under field review.
 *  - Unverified: Slate-gray badge (#64748b) for standard uninspected producers.
 *  - Flagged: Alert crimson badge (#dc2626) indicating compliance inquiry.
 * 
 * @license Private / Proprietary Agrily Inc.
 */

import React from 'react';
import PropTypes from 'prop-types';
import './TrustBadge.css';

/**
 * TrustBadge Icon Subcomponent
 * 
 * @param {Object} props
 * @param {string} props.status - Producer verification status
 * @param {number} [props.size] - Icon dimension in pixels
 */
function StatusIcon({ status, size = 16 }) {
  switch (status) {
    case 'verified':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 20 20"
          fill="currentColor"
          className="trust-badge-icon"
          data-testid="icon-verified"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      );

    case 'pending':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 20 20"
          fill="currentColor"
          className="trust-badge-icon"
          data-testid="icon-pending"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
            clipRule="evenodd"
          />
        </svg>
      );

    case 'flagged':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 20 20"
          fill="currentColor"
          className="trust-badge-icon"
          data-testid="icon-flagged"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      );

    case 'unverified':
    default:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 20 20"
          fill="currentColor"
          className="trust-badge-icon"
          data-testid="icon-unverified"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
            clipRule="evenodd"
          />
        </svg>
      );
  }
}

/**
 * TrustBadge Component
 * 
 * Compact badge displaying verification status and optional trust score.
 * Ideal for produce cards, table rows, and list items.
 * 
 * @param {Object} props
 * @param {('verified'|'pending'|'unverified'|'flagged')} [props.status='unverified'] - Producer status
 * @param {number} [props.trustScore=100] - Trust score percentage (0-100)
 * @param {('sm'|'md'|'lg')} [props.size='md'] - Display sizing
 * @param {boolean} [props.showScore=true] - Whether to render trust score pill
 * @param {boolean} [props.showLabel=true] - Whether to render textual status description
 * @param {string} [props.className=''] - Additional CSS classes
 */
export function TrustBadge({
  status = 'unverified',
  trustScore = 100,
  size = 'md',
  showScore = true,
  showLabel = true,
  className = ''
}) {
  const normalizedStatus = ['verified', 'pending', 'unverified', 'flagged'].includes(status)
    ? status
    : 'unverified';

  const labelMap = {
    verified: 'Verified Farmer',
    pending: 'KYC Pending',
    unverified: 'Community Grower',
    flagged: 'Under Review'
  };

  const iconSizes = { sm: 14, md: 16, lg: 18 };

  return (
    <div
      className={`agrily-trust-badge-wrapper badge-size-${size} badge-status-${normalizedStatus} ${className}`}
      data-testid="trust-badge"
      title={`Status: ${labelMap[normalizedStatus]} (Trust Score: ${trustScore}%)`}
    >
      <div className="badge-pill">
        <StatusIcon status={normalizedStatus} size={iconSizes[size] || 16} />
        {showLabel && <span className="badge-label">{labelMap[normalizedStatus]}</span>}
      </div>

      {showScore && (
        <span className="badge-score" data-testid="trust-score-badge">
          {trustScore}%
        </span>
      )}
    </div>
  );
}

TrustBadge.propTypes = {
  status: PropTypes.oneOf(['verified', 'pending', 'unverified', 'flagged']),
  trustScore: PropTypes.number,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  showScore: PropTypes.bool,
  showLabel: PropTypes.bool,
  className: PropTypes.string
};

/**
 * VerificationSeal Component
 * 
 * Premium provenance seal displaying verified producer insignia, cooperative union,
 * regional origin state, and trust rating. Ideal for produce details modals, vendor pages,
 * and high-value batch listings.
 * 
 * @param {Object} props
 * @param {('verified'|'pending'|'unverified'|'flagged')} [props.status='unverified'] - Producer status
 * @param {string} [props.cooperativeName=''] - Affiliated cooperative or farm name
 * @param {string} [props.state=''] - Agro-ecological origin state
 * @param {number} [props.trustScore=100] - Trust rating percentage
 * @param {('sm'|'md'|'lg')} [props.size='md'] - Seal sizing
 */
export function VerificationSeal({
  status = 'unverified',
  cooperativeName = '',
  state = '',
  trustScore = 100,
  size = 'md'
}) {
  const isVerified = status === 'verified';

  return (
    <div
      className={`agrily-verification-seal seal-${status} seal-size-${size}`}
      data-testid="verification-seal"
    >
      <div className="seal-crest">
        <StatusIcon status={status} size={size === 'lg' ? 24 : 18} />
      </div>

      <div className="seal-content">
        <div className="seal-status-row">
          <span className="seal-status-title">
            {isVerified ? 'Agrily Verified Producer' : `${status.toUpperCase()} PRODUCER`}
          </span>
          <span className="seal-score-pill" data-testid="seal-score">{trustScore}% Trust</span>
        </div>

        {(cooperativeName || state) && (
          <div className="seal-provenance-meta">
            {cooperativeName && (
              <span className="seal-coop" data-testid="seal-coop">
                {cooperativeName}
              </span>
            )}
            {cooperativeName && state && <span className="seal-divider">•</span>}
            {state && (
              <span className="seal-state" data-testid="seal-state">
                {state} State
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

VerificationSeal.propTypes = {
  status: PropTypes.oneOf(['verified', 'pending', 'unverified', 'flagged']),
  cooperativeName: PropTypes.string,
  state: PropTypes.string,
  trustScore: PropTypes.number,
  size: PropTypes.oneOf(['sm', 'md', 'lg'])
};

export default TrustBadge;
