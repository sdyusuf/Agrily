/**
 * ==============================================================================
 * 🌾 AGRILY AGRO-LOGISTICS PLATFORM: COMMERCIAL INVOICE PREVIEW MODAL
 * ==============================================================================
 *
 * @component InvoicePreviewModal
 * @description
 * High-fidelity print-ready modal presenting itemized agricultural produce
 * sales billings, freight haulage tariffs, cold-chain premiums, escrow guarantee
 * fees, and statutory 7.5% VAT calculations.
 *
 * Provides a clean accounting statement for agricultural cooperatives,
 * logistics transporters, and institutional bulk purchasers.
 *
 * @version 1.0.0
 * @author Agrily Frontend Engineering
 * ==============================================================================
 */

import React from 'react';
import PropTypes from 'prop-types';
import './InvoicePreviewModal.css';

export default function InvoicePreviewModal({
  invoice,
  isOpen,
  onClose,
  onPrint
}) {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    if (onPrint) {
      onPrint(invoice);
    } else {
      window.print();
    }
  };

  const seller = invoice.seller || {
    entityName: 'Makarfi Agro Producer Syndicate',
    contactEmail: 'coop@makarfiagro.ng',
    contactPhone: '+2348039988771',
    address: 'Agro Extension Zone 3, Makarfi, Kaduna',
    taxIdentificationNumber: 'TIN-NG-88912401'
  };

  const buyer = invoice.buyer || {
    entityName: 'Kano Fresh Foods Processing Ltd',
    contactEmail: 'procurement@kanofresh.com',
    contactPhone: '+2348029998877',
    billingAddress: 'Plot 44 Bompai Industrial Area, Kano',
    taxIdentificationNumber: 'TIN-NG-99210452'
  };

  const items = invoice.items || [];
  const currencySymbol = invoice.currency === 'USD' ? '$' : '₦';

  return (
    <div
      className="invoice-modal-backdrop"
      data-testid="invoice-preview-modal"
      onClick={onClose}
    >
      <div
        className="invoice-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Controls Header */}
        <header className="invoice-modal-header">
          <div className="header-badge-group">
            <span className="invoice-tag">Commercial Tax Invoice</span>
            <span className="invoice-number" data-testid="invoice-number">
              {invoice.invoiceNumber || 'INV-20240716-4412'}
            </span>
          </div>
          <div className="header-actions">
            <button
              type="button"
              className="btn-print-invoice"
              data-testid="btn-print-invoice"
              onClick={handlePrint}
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Print Invoice</span>
            </button>
            <button
              type="button"
              className="close-btn"
              data-testid="close-invoice-modal"
              onClick={onClose}
              aria-label="Close"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </header>

        {/* Printable Invoice Sheet */}
        <div className="invoice-sheet" id="printable-invoice-sheet">
          {/* Top Title & Metadata */}
          <div className="invoice-sheet-top">
            <div>
              <h1 className="invoice-brand-title">🌾 AGRILY</h1>
              <p className="invoice-brand-sub">Agricultural Commodity Settlement & Haulage Invoice</p>
            </div>
            <div className="invoice-meta-box">
              <div className="meta-row">
                <span className="meta-label">Invoice Date:</span>
                <span className="meta-val">{new Date(invoice.issuedDate || Date.now()).toLocaleDateString()}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Payment Due:</span>
                <span className="meta-val">{new Date(invoice.dueDate || Date.now()).toLocaleDateString()}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Payment Terms:</span>
                <span className="meta-val">Escrow Protected</span>
              </div>
            </div>
          </div>

          {/* Seller and Buyer Billing Cards */}
          <div className="invoice-parties-grid">
            <div className="party-panel">
              <span className="panel-tag">Seller (Producer / Syndicate)</span>
              <h3 className="panel-name">{seller.entityName}</h3>
              <p className="panel-line">{seller.address}</p>
              <p className="panel-line">TIN: <strong>{seller.taxIdentificationNumber}</strong></p>
              <p className="panel-line">Tel: {seller.contactPhone} | {seller.contactEmail}</p>
            </div>

            <div className="party-panel">
              <span className="panel-tag">Billed To (Consignee / Buyer)</span>
              <h3 className="panel-name">{buyer.entityName}</h3>
              <p className="panel-line">{buyer.billingAddress}</p>
              <p className="panel-line">TIN: <strong>{buyer.taxIdentificationNumber}</strong></p>
              <p className="panel-line">Tel: {buyer.contactPhone} | {buyer.contactEmail}</p>
            </div>
          </div>

          {/* Itemized Line Items Table */}
          <table className="invoice-table" data-testid="invoice-items-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th>Commodity Description</th>
                <th style={{ textAlign: 'right', width: '100px' }}>Quantity</th>
                <th style={{ textAlign: 'right', width: '120px' }}>Unit Price</th>
                <th style={{ textAlign: 'right', width: '140px' }}>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item._id || idx}>
                  <td>{idx + 1}</td>
                  <td>
                    <strong>{item.commodityName}</strong>
                    <div className="item-sub">{item.variety || 'Standard Quality'}</div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {item.quantity.toLocaleString()} {item.unitOfMeasure || 'kg'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {currencySymbol}{item.unitPrice.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <strong>{currencySymbol}{(item.totalAmount || 0).toLocaleString()}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Financial Totals Reconciliation Breakdown */}
          <div className="invoice-financial-split">
            <div className="financial-notes">
              <span className="notes-heading">Escrow Guarantee Terms</span>
              <p className="notes-body">
                Produce funds are locked safely in Agrily Multi-Tier Escrow. Upon successful delivery
                and consignee digital sign-off, producer net proceeds (97.5%) and logistics freight tariffs
                are automatically released to registered bank accounts.
              </p>
              <div className="checksum-badge">
                <span className="cs-label">SHA-256 Invoice Integrity:</span>
                <span className="cs-code" data-testid="invoice-checksum-display">
                  {invoice.invoiceChecksum ? invoice.invoiceChecksum.substring(0, 32) + '...' : 'SECURED-FINANCIAL-CHECKSUM'}
                </span>
              </div>
            </div>

            <div className="totals-table">
              <div className="total-row">
                <span>Produce Subtotal:</span>
                <strong>{currencySymbol}{(invoice.produceSubtotal || 0).toLocaleString()}</strong>
              </div>
              <div className="total-row">
                <span>Freight Haulage Tariff:</span>
                <span>{currencySymbol}{(invoice.freightHaulageFee || 0).toLocaleString()}</span>
              </div>
              {invoice.coldChainSurcharge > 0 && (
                <div className="total-row">
                  <span>Cold-Chain Reefer Premium:</span>
                  <span>{currencySymbol}{(invoice.coldChainSurcharge || 0).toLocaleString()}</span>
                </div>
              )}
              <div className="total-row">
                <span>Escrow Platform Guarantee (1.5%):</span>
                <span>{currencySymbol}{(invoice.escrowProtectionFee || 0).toLocaleString()}</span>
              </div>
              <div className="total-row">
                <span>Statutory 7.5% VAT (Services):</span>
                <span>{currencySymbol}{(invoice.taxVatAmount || 0).toLocaleString()}</span>
              </div>
              <div className="total-row grand-total-row">
                <span>Total Amount Due:</span>
                <strong className="grand-total" data-testid="grand-total-amount">
                  {currencySymbol}{(invoice.totalInvoiceAmount || 0).toLocaleString()}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <footer className="invoice-modal-footer">
          <span className="footer-status-text">
            Status: <strong>{invoice.status || 'ISSUED'}</strong>
          </span>
          <button
            type="button"
            className="btn-close-invoice"
            data-testid="btn-close-invoice-modal"
            onClick={onClose}
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}

InvoicePreviewModal.propTypes = {
  invoice: PropTypes.shape({
    invoiceNumber: PropTypes.string,
    status: PropTypes.string,
    currency: PropTypes.string,
    issuedDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    seller: PropTypes.object,
    buyer: PropTypes.object,
    items: PropTypes.array,
    produceSubtotal: PropTypes.number,
    freightHaulageFee: PropTypes.number,
    coldChainSurcharge: PropTypes.number,
    escrowProtectionFee: PropTypes.number,
    taxVatAmount: PropTypes.number,
    totalInvoiceAmount: PropTypes.number,
    invoiceChecksum: PropTypes.string
  }),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onPrint: PropTypes.func
};
