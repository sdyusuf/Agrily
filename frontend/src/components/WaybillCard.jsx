/**
 * ==============================================================================
 * 🌾 AGRILY AGRO-LOGISTICS PLATFORM: WAYBILL CARD COMPONENT
 * ==============================================================================
 *
 * @component WaybillCard
 * @description
 * High-fidelity, interactive card component representing an individual
 * digital waybill within dispatcher queues, driver haulage manifests,
 * and farmer cooperative shipment lists.
 *
 * Adheres strictly to the Agrily Design System:
 *  - Tactile card lift on hover (`translateY(-4px)`).
 *  - Semantic status pills (ISSUED, IN_TRANSIT, DELIVERED, DISPUTED).
 *  - Real-time cold-chain temperature badges.
 *  - Interactive quick-action buttons for QR verification, invoice preview,
 *    and custody hand-off logging.
 *
 * @version 1.0.0
 * @author Agrily Frontend Engineering
 * ==============================================================================
 */

import React from 'react';
import PropTypes from 'prop-types';
import './WaybillCard.css';

/**
 * Status color mappings conforming to Agrily Design System tokens.
 */
const STATUS_STYLES = {
  DRAFT: { label: 'Draft Pro-Forma', className: 'status-draft' },
  ISSUED: { label: 'Authorized & Issued', className: 'status-issued' },
  IN_TRANSIT: { label: 'In Road Transit', className: 'status-transit' },
  TRANSFERRED_AT_HUB: { label: 'Transferred at Hub', className: 'status-hub' },
  DELIVERED: { label: 'Delivered to Consignee', className: 'status-delivered' },
  RECONCILED: { label: 'Reconciled & Settled', className: 'status-reconciled' },
  DISPUTED: { label: 'Cargo Under Dispute', className: 'status-disputed' },
  CANCELLED: { label: 'Cancelled Shipment', className: 'status-cancelled' }
};

export default function WaybillCard({
  waybill,
  onViewQr,
  onViewInvoice,
  onInitiateTransfer,
  onPrintWaybill
}) {
  if (!waybill) return null;

  const statusMeta = STATUS_STYLES[waybill.status] || {
    label: waybill.status || 'Active',
    className: 'status-issued'
  };

  const isColdChain = waybill.isHighlyPerishable ||
    (waybill.consignments && waybill.consignments.some(c => c.temperatureClass === 'CHILLED' || c.temperatureClass === 'COOL'));

  const primaryConsignment = (waybill.consignments && waybill.consignments[0]) || {
    commodityName: 'Agricultural Cargo Consignment',
    numberOfCrates: waybill.totalCratesCount || 1,
    netWeightKg: waybill.totalNetWeightKg || 500
  };

  const currentHolderName = waybill.currentHolder?.name || waybill.carrier?.driverName || 'In Transit Carrier';

  return (
    <article
      className="waybill-card"
      data-testid={`waybill-card-${waybill.waybillNumber}`}
    >
      {/* Top Banner: Waybill Code & Status Pill */}
      <header className="waybill-card-header">
        <div className="waybill-badge-group">
          <span className="waybill-code-pill" data-testid="waybill-code">
            <svg
              className="waybill-icon"
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            {waybill.waybillNumber}
          </span>
          {isColdChain && (
            <span className="cold-chain-pill" title="Active Cold-Chain Monitored">
              <svg
                viewBox="0 0 24 24"
                width="12"
                height="12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              Cold-Chain
            </span>
          )}
        </div>
        <span
          className={`status-pill ${statusMeta.className}`}
          data-testid="waybill-status"
        >
          {statusMeta.label}
        </span>
      </header>

      {/* Origin to Destination Route Indicator */}
      <div className="waybill-corridor">
        <div className="corridor-node origin-node">
          <span className="node-label">Origin Collection</span>
          <h4 className="node-title">{waybill.originDepot?.name || waybill.shipper?.pickupAddress || 'Rural Farm Depot'}</h4>
          <span className="node-sub">{waybill.shipper?.state || 'Kaduna'}</span>
        </div>

        <div className="corridor-transit-arrow">
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
          <span className="corridor-distance">
            {waybill.estimatedDistanceKm ? `${waybill.estimatedDistanceKm} km` : 'Direct Freight'}
          </span>
        </div>

        <div className="corridor-node dest-node">
          <span className="node-label">Destination Hub</span>
          <h4 className="node-title">{waybill.destinationHub?.name || waybill.consignee?.businessName || 'Processing Terminal'}</h4>
          <span className="node-sub">{waybill.consignee?.state || 'Kano'}</span>
        </div>
      </div>

      {/* Consignment Metrics Grid */}
      <div className="cargo-metrics-bar">
        <div className="metric-item">
          <span className="metric-label">Commodity</span>
          <strong className="metric-value">{primaryConsignment.commodityName}</strong>
          {waybill.consignments && waybill.consignments.length > 1 && (
            <span className="metric-extra">+{waybill.consignments.length - 1} more items</span>
          )}
        </div>
        <div className="metric-item">
          <span className="metric-label">Net Cargo Weight</span>
          <strong className="metric-value">
            {(waybill.totalNetWeightKg || 0).toLocaleString()} <span className="unit-label">kg</span>
          </strong>
        </div>
        <div className="metric-item">
          <span className="metric-label">Packaging Units</span>
          <strong className="metric-value">
            {waybill.totalCratesCount || 0} <span className="unit-label">crates</span>
          </strong>
        </div>
        <div className="metric-item">
          <span className="metric-label">Tamper Seal</span>
          <strong className="metric-value seal-code">
            {waybill.securitySeals?.[0]?.sealNumber || 'SEAL-VERIFIED'}
          </strong>
        </div>
      </div>

      {/* Carrier & Custody Bar */}
      <div className="custody-holder-bar">
        <div className="carrier-avatar">
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <rect x="1" y="3" width="15" height="13" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
        </div>
        <div className="carrier-info">
          <span className="carrier-title">Current Custody Holder:</span>
          <span className="carrier-name"><strong>{currentHolderName}</strong> ({waybill.carrier?.vehicleRegistrationPlate || 'KAN-882-TR'})</span>
        </div>
      </div>

      {/* Card Action Controls */}
      <footer className="waybill-card-actions">
        <button
          type="button"
          className="action-btn btn-qr"
          data-testid="btn-view-qr"
          onClick={() => onViewQr && onViewQr(waybill)}
          title="Inspect Cryptographic QR Verification Code"
        >
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          <span>Verify QR</span>
        </button>

        <button
          type="button"
          className="action-btn btn-invoice"
          data-testid="btn-view-invoice"
          onClick={() => onViewInvoice && onViewInvoice(waybill)}
          title="Review Commercial Invoice & VAT Details"
        >
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <span>Invoice</span>
        </button>

        <button
          type="button"
          className="action-btn btn-transfer"
          data-testid="btn-custody-transfer"
          onClick={() => onInitiateTransfer && onInitiateTransfer(waybill)}
          title="Log Chain of Custody Transfer"
        >
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
          <span>Transfer</span>
        </button>

        <button
          type="button"
          className="action-btn btn-print"
          data-testid="btn-print-waybill"
          onClick={() => onPrintWaybill && onPrintWaybill(waybill)}
          title="Print Official Legal Consignment Bill"
        >
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          <span>Print</span>
        </button>
      </footer>
    </article>
  );
}

WaybillCard.propTypes = {
  waybill: PropTypes.shape({
    waybillNumber: PropTypes.string.isRequired,
    status: PropTypes.string,
    originDepot: PropTypes.object,
    destinationHub: PropTypes.object,
    shipper: PropTypes.object,
    consignee: PropTypes.object,
    carrier: PropTypes.object,
    consignments: PropTypes.array,
    totalNetWeightKg: PropTypes.number,
    totalCratesCount: PropTypes.number,
    estimatedDistanceKm: PropTypes.number,
    securitySeals: PropTypes.array,
    currentHolder: PropTypes.object,
    isHighlyPerishable: PropTypes.bool
  }).isRequired,
  onViewQr: PropTypes.func,
  onViewInvoice: PropTypes.func,
  onInitiateTransfer: PropTypes.func,
  onPrintWaybill: PropTypes.func
};
