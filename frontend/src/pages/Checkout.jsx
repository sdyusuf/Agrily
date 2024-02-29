/**
 * ==============================================================================
 * AGRILY AGRICULTURAL COMMERCE PLATFORM - PROCUREMENT CHECKOUT PAGE
 * ==============================================================================
 * 
 * Page Description:
 * This page implements the multi-step agricultural procurement checkout workflow.
 * Commercial buyers, food processors, and consumers review their produce cart items,
 * supply recipient details and freight destination address, choose escrow or bank
 * transfer settlement, and submit the confirmed purchase order to the backend API.
 * 
 * Agricultural Logistics & Supply Chain Architecture:
 * Produce procurement requires rigorous logistical coordination:
 *  1. Destination Precision: Trucks require designated drop-off coordinates, farm-gate
 *     access codes, or warehouse cold-storage bay instructions.
 *  2. Escrow Protection: Funds are safely held in Agrily Agricultural Escrow until
 *     the buyer inspects produce quality upon truck arrival.
 *  3. Stock Consistency: Validates final unit counts and totals with backend before
 *     issuing unique order references.
 * 
 * @page Checkout
 * @requires react
 * @requires react-router-dom
 * @requires ../state/CartContext
 * @requires ../auth/useUser
 * @requires ./Checkout.css
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { useCart } from '../state/CartContext';
import { useUser } from '../auth/useUser';
import './Checkout.css';

/**
 * Format numeric currency values into formatted Nigerian Naira (NGN) string.
 * @param {number} amount
 * @returns {string} Formatted currency
 */
const formatNaira = (amount) => {
  const valid = Number(amount) || 0;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0
  }).format(valid);
};

const Checkout = () => {
  const navigate = useNavigate();
  const user = useUser();

  const {
    cartItems,
    cartSubtotal,
    deliveryEstimate,
    grandTotal,
    clearCart
  } = useCart();

  // --------------------------------------------------------------------------
  // FORM STATE
  // --------------------------------------------------------------------------
  const [formData, setFormData] = useState({
    buyerName: user?.name || '',
    buyerEmail: user?.email || '',
    buyerPhone: user?.phone || '',
    street: '',
    city: '',
    state: 'Lagos State',
    postalCode: '',
    country: 'Nigeria',
    specialInstructions: '',
    paymentMethod: 'escrow', // 'escrow' | 'transfer' | 'delivery'
    notes: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);

  // --------------------------------------------------------------------------
  // INPUT CHANGE HANDLER
  // --------------------------------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field-specific validation error upon editing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // --------------------------------------------------------------------------
  // CLIENT-SIDE VALIDATION
  // --------------------------------------------------------------------------
  const validateForm = () => {
    const errors = {};

    if (!formData.buyerName.trim()) {
      errors.buyerName = 'Full name or company name is required';
    }

    if (!formData.buyerEmail.trim()) {
      errors.buyerEmail = 'Contact email address is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.buyerEmail.trim())) {
        errors.buyerEmail = 'Please provide a valid email format (e.g. buyer@example.com)';
      }
    }

    if (!formData.buyerPhone.trim()) {
      errors.buyerPhone = 'Phone number is required for logistics coordination';
    }

    if (!formData.street.trim()) {
      errors.street = 'Delivery address / farm depot street address is required';
    }

    if (!formData.city.trim()) {
      errors.city = 'Destination city or LGA is required';
    }

    if (!formData.state.trim()) {
      errors.state = 'Destination state or territory is required';
    }

    return errors;
  };

  // --------------------------------------------------------------------------
  // SUBMISSION HANDLER
  // --------------------------------------------------------------------------
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setSubmissionError(null);

    // Validate empty cart
    if (!cartItems || cartItems.length === 0) {
      setSubmissionError('Your cart is empty. Please add produce items before submitting an order.');
      return;
    }

    // Validate inputs
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Scroll to first error safely
      if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
        try {
          window.scrollTo({ top: 200, behavior: 'smooth' });
        } catch {
          // No-op for test environments
        }
      }
      return;
    }

    setIsSubmitting(true);

    try {
      // Build order payload matching backend schema requirements
      const payload = {
        buyerEmail: formData.buyerEmail.toLowerCase().trim(),
        buyerName: formData.buyerName.trim(),
        buyerPhone: formData.buyerPhone.trim(),
        items: cartItems.map(item => ({
          productId: item.id,
          name: item.name,
          unit: item.unit,
          quantity: item.quantity,
          price: item.price,
          ownerEmail: item.ownerEmail,
          imageURL: item.imageURL
        })),
        totalAmount: grandTotal,
        deliveryAddress: {
          street: formData.street.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          postalCode: formData.postalCode.trim(),
          country: formData.country.trim(),
          specialInstructions: formData.specialInstructions.trim()
        },
        paymentStatus: formData.paymentMethod === 'escrow' ? 'escrow' : 'unpaid',
        notes: formData.notes.trim()
      };

      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || (data.errors && data.errors.join(', ')) || 'Failed to submit procurement order.'
        );
      }

      // Order created successfully: clear cart and redirect to confirmation
      clearCart();
      navigate('/order-confirmation', {
        state: {
          order: data.order,
          orderReference: data.orderReference,
          estimatedDeliveryDays: data.estimatedDeliveryDays
        }
      });
    } catch (err) {
      console.error('Order submission failed:', err);
      setSubmissionError(err.message || 'Network error encountered while placing your order. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // EMPTY CART GUARD
  // --------------------------------------------------------------------------
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="agrily-checkout-page">
        <NavBar />
        <Container className="my-5 py-5 text-center">
          <div className="agrily-checkout-empty-card">
            <div className="agrily-checkout-empty-icon" aria-hidden="true">
              🛒
            </div>
            <h2 className="agrily-checkout-empty-title">Your Cart is Empty</h2>
            <p className="agrily-checkout-empty-desc">
              You do not have any produce items in your cart to proceed with checkout.
              Browse our catalog of verified harvests and bulk commodities.
            </p>
            <Link to="/marketplace" className="btn-agrily-harvest agrily-checkout-return-btn">
              Explore Farm Marketplace
            </Link>
          </div>
        </Container>
        <Footer />
      </div>
    );
  }

  return (
    <div className="agrily-checkout-page">
      <NavBar />

      <main className="agrily-checkout-main">
        <Container className="py-5">
          {/* Page Breadcrumb & Header */}
          <header className="agrily-checkout-header mb-4">
            <nav aria-label="breadcrumb">
              <ol className="agrily-checkout-breadcrumb">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/marketplace">Marketplace</Link></li>
                <li aria-current="page">Procurement Checkout</li>
              </ol>
            </nav>
            <h1 className="agrily-checkout-heading">Agricultural Order Checkout</h1>
            <p className="agrily-checkout-subheading">
              Finalize produce specifications, delivery depot address, and escrow terms.
            </p>
          </header>

          {/* Submission Failure Alert */}
          {submissionError && (
            <Alert variant="danger" className="agrily-checkout-alert mb-4" onClose={() => setSubmissionError(null)} dismissible>
              <div className="d-flex align-items-center gap-2">
                <strong>Order Submission Error:</strong> {submissionError}
              </div>
            </Alert>
          )}

          <form onSubmit={handleSubmitOrder} noValidate>
            <Row className="g-4">
              {/* Left Column: Buyer Info & Delivery Address Form */}
              <Col lg={7}>
                {/* Section 1: Buyer Contact Info */}
                <div className="agrily-checkout-section-card mb-4">
                  <div className="agrily-checkout-section-header">
                    <span className="agrily-checkout-section-step">1</span>
                    <h2 className="agrily-checkout-section-title">Buyer Contact Information</h2>
                  </div>

                  <Row className="g-3">
                    <Col sm={12}>
                      <label htmlFor="buyerName" className="agrily-form-label">
                        Full Name / Company Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        id="buyerName"
                        name="buyerName"
                        value={formData.buyerName}
                        onChange={handleChange}
                        className={`agrily-form-control ${formErrors.buyerName ? 'is-invalid' : ''}`}
                        placeholder="e.g. Alhaji Danladi Garba or Green Harvest Wholesalers"
                        required
                      />
                      {formErrors.buyerName && (
                        <div className="invalid-feedback">{formErrors.buyerName}</div>
                      )}
                    </Col>

                    <Col sm={6}>
                      <label htmlFor="buyerEmail" className="agrily-form-label">
                        Email Address <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        id="buyerEmail"
                        name="buyerEmail"
                        value={formData.buyerEmail}
                        onChange={handleChange}
                        className={`agrily-form-control ${formErrors.buyerEmail ? 'is-invalid' : ''}`}
                        placeholder="buyer@example.com"
                        required
                      />
                      {formErrors.buyerEmail && (
                        <div className="invalid-feedback">{formErrors.buyerEmail}</div>
                      )}
                    </Col>

                    <Col sm={6}>
                      <label htmlFor="buyerPhone" className="agrily-form-label">
                        Phone Number <span className="text-danger">*</span>
                      </label>
                      <input
                        type="tel"
                        id="buyerPhone"
                        name="buyerPhone"
                        value={formData.buyerPhone}
                        onChange={handleChange}
                        className={`agrily-form-control ${formErrors.buyerPhone ? 'is-invalid' : ''}`}
                        placeholder="+234 803 000 0000"
                        required
                      />
                      {formErrors.buyerPhone && (
                        <div className="invalid-feedback">{formErrors.buyerPhone}</div>
                      )}
                    </Col>
                  </Row>
                </div>

                {/* Section 2: Freight Delivery Destination */}
                <div className="agrily-checkout-section-card mb-4">
                  <div className="agrily-checkout-section-header">
                    <span className="agrily-checkout-section-step">2</span>
                    <h2 className="agrily-checkout-section-title">Freight Delivery Destination</h2>
                  </div>

                  <Row className="g-3">
                    <Col xs={12}>
                      <label htmlFor="street" className="agrily-form-label">
                        Street Address or Farm Depot Location <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        id="street"
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                        className={`agrily-form-control ${formErrors.street ? 'is-invalid' : ''}`}
                        placeholder="Plot 12, Agribusiness Cluster, KM 18 Expressway"
                        required
                      />
                      {formErrors.street && (
                        <div className="invalid-feedback">{formErrors.street}</div>
                      )}
                    </Col>

                    <Col sm={6}>
                      <label htmlFor="city" className="agrily-form-label">
                        City / LGA <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className={`agrily-form-control ${formErrors.city ? 'is-invalid' : ''}`}
                        placeholder="Ikeja, Kaduna, Kano, etc."
                        required
                      />
                      {formErrors.city && (
                        <div className="invalid-feedback">{formErrors.city}</div>
                      )}
                    </Col>

                    <Col sm={6}>
                      <label htmlFor="state" className="agrily-form-label">
                        State / Province <span className="text-danger">*</span>
                      </label>
                      <select
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className={`agrily-form-select ${formErrors.state ? 'is-invalid' : ''}`}
                      >
                        <option value="Lagos State">Lagos State</option>
                        <option value="Kano State">Kano State</option>
                        <option value="Kaduna State">Kaduna State</option>
                        <option value="Oyo State">Oyo State</option>
                        <option value="FCT Abuja">FCT Abuja</option>
                        <option value="Ogun State">Ogun State</option>
                        <option value="Plateau State">Plateau State</option>
                        <option value="Benue State">Benue State</option>
                        <option value="Niger State">Niger State</option>
                        <option value="Enugu State">Enugu State</option>
                        <option value="Rivers State">Rivers State</option>
                        <option value="Other">Other / Regional Border</option>
                      </select>
                      {formErrors.state && (
                        <div className="invalid-feedback">{formErrors.state}</div>
                      )}
                    </Col>

                    <Col xs={12}>
                      <label htmlFor="specialInstructions" className="agrily-form-label">
                        Logistics & Offloading Notes (Optional)
                      </label>
                      <textarea
                        id="specialInstructions"
                        name="specialInstructions"
                        rows="2"
                        value={formData.specialInstructions}
                        onChange={handleChange}
                        className="agrily-form-control"
                        placeholder="e.g. Unload at Grain Bay 3; Cold chain vehicle required for tomatoes."
                      ></textarea>
                    </Col>
                  </Row>
                </div>

                {/* Section 3: Escrow & Payment Method */}
                <div className="agrily-checkout-section-card mb-4">
                  <div className="agrily-checkout-section-header">
                    <span className="agrily-checkout-section-step">3</span>
                    <h2 className="agrily-checkout-section-title">Payment & Escrow Protection</h2>
                  </div>

                  <div className="agrily-payment-options-grid">
                    <label className={`agrily-payment-card ${formData.paymentMethod === 'escrow' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="escrow"
                        checked={formData.paymentMethod === 'escrow'}
                        onChange={handleChange}
                      />
                      <div className="agrily-payment-card-body">
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <span className="agrily-payment-title">Agrily Escrow Protection</span>
                          <span className="agrily-badge-recommended">Recommended</span>
                        </div>
                        <p className="agrily-payment-desc">
                          Funds are securely deposited in escrow and only released to the farmer after you inspect produce upon delivery.
                        </p>
                      </div>
                    </label>

                    <label className={`agrily-payment-card ${formData.paymentMethod === 'transfer' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="transfer"
                        checked={formData.paymentMethod === 'transfer'}
                        onChange={handleChange}
                      />
                      <div className="agrily-payment-card-body">
                        <span className="agrily-payment-title">Commercial Wire / Bank Transfer</span>
                        <p className="agrily-payment-desc">
                          Invoice generated with designated Agrily corporate banking coordinates for enterprise procurement settlement.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </Col>

              {/* Right Column: Order Summary & Confirmation CTA */}
              <Col lg={5}>
                <aside className="agrily-checkout-summary-card">
                  <h2 className="agrily-checkout-summary-title">Procurement Order Summary</h2>

                  {/* Produce Line Items List */}
                  <div className="agrily-checkout-items-list">
                    {cartItems.map((item) => (
                      <div key={item.id} className="agrily-checkout-item-row">
                        <div className="agrily-checkout-item-info">
                          <span className="agrily-checkout-item-name">{item.name}</span>
                          <span className="agrily-checkout-item-meta">
                            {item.quantity} {item.unit || 'unit'}s &times; {formatNaira(item.price)}
                          </span>
                          <span className="agrily-checkout-item-farmer">
                            Producer: {item.ownerEmail || 'Local Farm'}
                          </span>
                        </div>
                        <div className="agrily-checkout-item-total">
                          {formatNaira(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Subtotal & Delivery Calculation Breakdown */}
                  <div className="agrily-checkout-totals-block">
                    <div className="agrily-checkout-calc-row">
                      <span>Produce Subtotal</span>
                      <span>{formatNaira(cartSubtotal)}</span>
                    </div>

                    <div className="agrily-checkout-calc-row">
                      <span>Estimated Freight Haulage</span>
                      <span>
                        {deliveryEstimate === 0 ? (
                          <span className="text-success fw-bold">FREE (Bulk Freight)</span>
                        ) : (
                          formatNaira(deliveryEstimate)
                        )}
                      </span>
                    </div>

                    <div className="agrily-checkout-divider"></div>

                    <div className="agrily-checkout-calc-row agrily-checkout-grand-row">
                      <span>Gross Procurement Total</span>
                      <span className="agrily-checkout-grand-amount">{formatNaira(grandTotal)}</span>
                    </div>
                  </div>

                  {/* Submission CTA Button */}
                  <button
                    type="submit"
                    className="btn-agrily-harvest agrily-checkout-submit-btn w-100"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                        Confirming Procurement...
                      </>
                    ) : (
                      <>
                        Confirm & Place Order ({formatNaira(grandTotal)})
                      </>
                    )}
                  </button>

                  <p className="agrily-checkout-guarantee-note">
                    🔒 Protected by Agrily Escrow Guarantee. Direct from vetted agricultural producers.
                  </p>
                </aside>
              </Col>
            </Row>
          </form>
        </Container>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
