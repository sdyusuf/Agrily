/**
 * ==============================================================================
 * AGRILY AGRICULTURAL COMMERCE PLATFORM - ORDER CONFIRMATION & RECEIPT PAGE
 * ==============================================================================
 * 
 * Page Description:
 * This page renders the post-purchase confirmation receipt for agricultural produce
 * procurement orders. It provides commercial buyers with their unique order reference,
 * estimated dispatch and freight haulage delivery window, itemized produce breakdown,
 * freight drop-off depot coordinates, and Agrily Escrow protection milestones.
 * 
 * Commercial Agricultural Trade Context:
 * In wholesale agricultural supply chains, an order confirmation serves multiple purposes:
 *  1. Consignment Waybill Reference: Used by freight hauliers and farm gate operators
 *     at physical checkpoint gates.
 *  2. Inspection Checklist: Details produce units, packaging standards (bags, crates, tons)
 *     against which buyer receiving agents grade the crop at delivery.
 *  3. Escrow Milestones: Outlines payment release conditions once moisture, grade, and
 *     quantity criteria are verified.
 * 
 * @page OrderConfirmation
 * @requires react
 * @requires react-router-dom
 * @requires ./OrderConfirmation.css
 */

import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import './OrderConfirmation.css';

/**
 * Format currency in Nigerian Naira (NGN) format.
 * @param {number} amount
 * @returns {string} Formatted currency string
 */
const formatNaira = (amount) => {
  const valid = Number(amount) || 0;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0
  }).format(valid);
};

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  // Extract order state passed from Checkout navigation
  const state = location.state || {};
  const order = state.order || null;
  const orderReference = state.orderReference || order?.orderNumber || 'AGR-2024-SAMPLE';
  const estimatedDeliveryDays = state.estimatedDeliveryDays || '2 - 4 business days';

  // Fallback demo items if accessed directly without router state
  const items = order?.items || [
    {
      productId: 'demo-1',
      name: 'Fresh Harvest Produce Consignment',
      quantity: 10,
      unit: 'crate',
      price: 8500,
      ownerEmail: 'producer@agrily.com'
    }
  ];

  const totalAmount = order?.totalAmount || items.reduce((acc, it) => acc + (it.quantity * it.price), 0);
  const deliveryAddress = order?.deliveryAddress || {
    street: 'Farm Drop-off Depot, Agro Terminal',
    city: 'Lagos',
    state: 'Lagos State',
    country: 'Nigeria'
  };

  const handleCopyReference = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(orderReference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrintReceipt = () => {
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  };

  return (
    <div className="agrily-confirmation-page">
      <NavBar />

      <main className="agrily-confirmation-main">
        <Container className="py-5">
          {/* Hero Success Badge */}
          <div className="agrily-confirmation-hero text-center mb-5">
            <div className="agrily-confirmation-check-icon" aria-hidden="true">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <span className="agrily-confirmation-status-pill">Order Confirmed & Pending Dispatch</span>
            <h1 className="agrily-confirmation-heading">Thank You For Your Produce Order!</h1>
            <p className="agrily-confirmation-subheading">
              Your agricultural procurement order has been logged with producing farmers and assigned a freight consignment waybill.
            </p>

            {/* Reference ID Banner */}
            <div className="agrily-reference-banner">
              <div className="agrily-reference-label">Order Reference ID:</div>
              <div className="agrily-reference-code" data-testid="order-reference-code">
                {orderReference}
              </div>
              <button
                type="button"
                className="agrily-copy-btn"
                onClick={handleCopyReference}
                aria-label="Copy order reference to clipboard"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <Row className="g-4">
            {/* Left Column: Itemized Receipt & Delivery Coordinates */}
            <Col lg={8}>
              {/* Receipt Card */}
              <div className="agrily-receipt-card mb-4">
                <div className="agrily-receipt-card-header d-flex align-items-center justify-content-between">
                  <h2 className="agrily-receipt-card-title">Consignment Itemized Breakdown</h2>
                  <span className="agrily-receipt-count-tag">{items.length} Line {items.length === 1 ? 'Item' : 'Items'}</span>
                </div>

                <div className="agrily-receipt-table-wrapper">
                  <table className="agrily-receipt-table">
                    <thead>
                      <tr>
                        <th>Produce Item</th>
                        <th>Standard Unit</th>
                        <th className="text-center">Qty</th>
                        <th className="text-end">Unit Price</th>
                        <th className="text-end">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={item.productId || idx}>
                          <td>
                            <div className="agrily-receipt-item-name">{item.name}</div>
                            <div className="agrily-receipt-item-sub">Producer: {item.ownerEmail || 'Local Farm'}</div>
                          </td>
                          <td>
                            <span className="agrily-unit-tag">{item.unit || 'unit'}</span>
                          </td>
                          <td className="text-center fw-bold">{item.quantity}</td>
                          <td className="text-end">{formatNaira(item.price)}</td>
                          <td className="text-end fw-bold text-success">{formatNaira(item.quantity * item.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="4" className="text-end fw-bold pt-3">Gross Procurement Total:</td>
                        <td className="text-end fw-bold text-success pt-3 fs-5" data-testid="order-total-amount">
                          {formatNaira(totalAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Delivery Logistics Card */}
              <div className="agrily-receipt-card">
                <div className="agrily-receipt-card-header">
                  <h2 className="agrily-receipt-card-title">Logistics & Destination Coordinates</h2>
                </div>

                <Row className="g-3 pt-2">
                  <Col sm={6}>
                    <div className="agrily-info-group">
                      <span className="agrily-info-label">Drop-off Depot / Street:</span>
                      <span className="agrily-info-val">{deliveryAddress.street}</span>
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div className="agrily-info-group">
                      <span className="agrily-info-label">City & Territory:</span>
                      <span className="agrily-info-val">{deliveryAddress.city}, {deliveryAddress.state}</span>
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div className="agrily-info-group">
                      <span className="agrily-info-label">Country:</span>
                      <span className="agrily-info-val">{deliveryAddress.country || 'Nigeria'}</span>
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div className="agrily-info-group">
                      <span className="agrily-info-label">Expected Delivery Window:</span>
                      <span className="agrily-info-val text-success fw-bold">{estimatedDeliveryDays}</span>
                    </div>
                  </Col>
                  {deliveryAddress.specialInstructions && (
                    <Col xs={12}>
                      <div className="agrily-info-group">
                        <span className="agrily-info-label">Offloading & Cold Storage Instructions:</span>
                        <span className="agrily-info-val">{deliveryAddress.specialInstructions}</span>
                      </div>
                    </Col>
                  )}
                </Row>
              </div>
            </Col>

            {/* Right Column: Escrow Steps & Print Actions */}
            <Col lg={4}>
              {/* Escrow Protection Card */}
              <div className="agrily-escrow-card mb-4">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <span className="agrily-escrow-badge">🛡️ Agrily Escrow</span>
                  <span className="fw-bold text-dark">Procurement Lifecycle</span>
                </div>

                <div className="agrily-timeline">
                  <div className="agrily-timeline-step completed">
                    <div className="agrily-timeline-bullet">1</div>
                    <div className="agrily-timeline-content">
                      <span className="agrily-timeline-title">Order Placed</span>
                      <span className="agrily-timeline-desc">Procurement request transmitted to producer.</span>
                    </div>
                  </div>

                  <div className="agrily-timeline-step active">
                    <div className="agrily-timeline-bullet">2</div>
                    <div className="agrily-timeline-content">
                      <span className="agrily-timeline-title">Farmer Confirmation</span>
                      <span className="agrily-timeline-desc">Producer confirms harvest allocation and grading.</span>
                    </div>
                  </div>

                  <div className="agrily-timeline-step">
                    <div className="agrily-timeline-bullet">3</div>
                    <div className="agrily-timeline-content">
                      <span className="agrily-timeline-title">Freight Transit</span>
                      <span className="agrily-timeline-desc">Waybill issued and truck dispatched to destination.</span>
                    </div>
                  </div>

                  <div className="agrily-timeline-step">
                    <div className="agrily-timeline-bullet">4</div>
                    <div className="agrily-timeline-content">
                      <span className="agrily-timeline-title">Inspection & Settlement</span>
                      <span className="agrily-timeline-desc">You verify produce quality; escrow releases funds.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="agrily-confirmation-actions-card">
                <button
                  type="button"
                  className="btn-agrily-outline agrily-print-btn w-100 mb-3"
                  onClick={handlePrintReceipt}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2">
                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                    <rect x="6" y="14" width="12" height="8"></rect>
                  </svg>
                  Print Consignment Receipt
                </button>

                <Link to="/marketplace" className="btn-agrily-harvest w-100 text-center d-block text-decoration-none">
                  Return to Farm Marketplace
                </Link>
              </div>
            </Col>
          </Row>
        </Container>
      </main>

      <Footer />
    </div>
  );
};

export default OrderConfirmation;
