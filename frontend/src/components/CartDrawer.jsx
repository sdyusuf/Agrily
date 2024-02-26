/**
 * ==============================================================================
 * AGRILY AGRICULTURAL COMMERCE PLATFORM - FLOATING CART DRAWER COMPONENT
 * ==============================================================================
 * 
 * Component Description:
 * A modern, responsive slide-out drawer providing buyers instant access to their
 * agricultural procurement basket. Includes unit-aware quantity increment/decrement
 * controls, line item deletion, weight/freight delivery estimates, and direct
 * checkout transition triggers.
 * 
 * Design Standards Applied:
 *  - Colors: Lush Emerald (#1b4332, #2d6a4f), Warm Ochre (#bc6c25, #dda15e), Crisp Surface (#ffffff, #f8faf9)
 *  - Micro-interactions: Cubic-bezier slide-in transition, smooth quantity adjustment, soft elevation shadows
 *  - Responsiveness: Responsive drawer width (min(440px, 100vw)) with mobile-safe padding and bottom action bar
 *  - Null-safety: Graceful handling of missing images, empty states, and undefined producer fields
 * 
 * @component CartDrawer
 * @requires react
 * @requires react-router-dom
 * @requires ../state/CartContext
 * @requires ./CartDrawer.css
 */

import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../state/CartContext';
import './CartDrawer.css';

/**
 * Format currency in Nigerian Naira (NGN) format with comma separators.
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

const CartDrawer = () => {
  const navigate = useNavigate();
  const drawerRef = useRef(null);

  const {
    cartItems,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    deliveryEstimate,
    grandTotal,
    totalItems
  } = useCart();

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCartOpen) {
        closeCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, closeCart]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const handleCheckoutClick = () => {
    closeCart();
    navigate('/checkout');
  };

  const handleContinueShopping = () => {
    closeCart();
    navigate('/marketplace');
  };

  return (
    <div className="agrily-cart-overlay" onClick={closeCart} data-testid="cart-overlay">
      <aside
        className="agrily-cart-drawer"
        ref={drawerRef}
        onClick={(e) => e.stopPropagation()}
        aria-label="Agricultural Produce Shopping Cart"
        data-testid="cart-drawer"
      >
        {/* Drawer Header */}
        <header className="agrily-cart-header">
          <div className="agrily-cart-title-group">
            <div className="agrily-cart-icon-wrapper" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </div>
            <div>
              <h2 className="agrily-cart-title">Produce Cart</h2>
              <p className="agrily-cart-subtitle">
                {totalItems} {totalItems === 1 ? 'produce unit' : 'produce units'} selected
              </p>
            </div>
          </div>
          <button
            type="button"
            className="agrily-cart-close-btn"
            onClick={closeCart}
            aria-label="Close Shopping Cart"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </header>

        {/* Drawer Body: Cart Items List or Empty State */}
        <div className="agrily-cart-body">
          {cartItems.length === 0 ? (
            <div className="agrily-cart-empty-state">
              <div className="agrily-cart-empty-icon" aria-hidden="true">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
              </div>
              <h3 className="agrily-cart-empty-title">Your produce cart is empty</h3>
              <p className="agrily-cart-empty-text">
                Browse our fresh farm catalog to discover verified harvests, seasonal grains, and fresh vegetables directly from producers.
              </p>
              <button
                type="button"
                className="agrily-btn-primary agrily-cart-browse-btn"
                onClick={handleContinueShopping}
              >
                Browse Farm Marketplace
              </button>
            </div>
          ) : (
            <div className="agrily-cart-items-list">
              <div className="agrily-cart-items-header">
                <span>Selected Items ({cartItems.length})</span>
                <button
                  type="button"
                  className="agrily-cart-clear-link"
                  onClick={clearCart}
                  aria-label="Clear all items from cart"
                >
                  Clear All
                </button>
              </div>

              {cartItems.map((item) => (
                <article key={item.id} className="agrily-cart-item-card" data-testid={`cart-item-${item.id}`}>
                  {/* Item Thumbnail */}
                  <div className="agrily-cart-item-img-wrap">
                    {item.imageURL ? (
                      <img
                        src={item.imageURL}
                        alt={item.name}
                        className="agrily-cart-item-img"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="agrily-cart-item-img-placeholder" aria-hidden="true">
                        🌾
                      </div>
                    )}
                  </div>

                  {/* Item Information & Controls */}
                  <div className="agrily-cart-item-details">
                    <div className="agrily-cart-item-top">
                      <div>
                        <h4 className="agrily-cart-item-name">{item.name}</h4>
                        <span className="agrily-cart-item-farmer">
                          Farmer: {item.ownerEmail || 'Verified Producer'}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="agrily-cart-item-remove-btn"
                        onClick={() => removeFromCart(item.id)}
                        title="Remove item from cart"
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>

                    <div className="agrily-cart-item-pricing">
                      <span className="agrily-cart-item-unit-price">
                        {formatNaira(item.price)} <small>/ {item.unit || 'unit'}</small>
                      </span>
                      <span className="agrily-cart-item-line-total">
                        {formatNaira(item.price * item.quantity)}
                      </span>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="agrily-cart-stepper-container">
                      <div className="agrily-cart-stepper" role="group" aria-label="Quantity adjustment">
                        <button
                          type="button"
                          className="agrily-cart-stepper-btn"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= (item.minOrderQuantity || 1)}
                          aria-label={`Decrease quantity for ${item.name}`}
                          title={item.quantity <= (item.minOrderQuantity || 1) ? `Minimum order is ${item.minOrderQuantity} ${item.unit}` : 'Decrease quantity'}
                        >
                          −
                        </button>
                        <span className="agrily-cart-stepper-value" aria-live="polite">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="agrily-cart-stepper-btn"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.maxAvailable && item.quantity >= item.maxAvailable}
                          aria-label={`Increase quantity for ${item.name}`}
                        >
                          +
                        </button>
                      </div>
                      <span className="agrily-cart-unit-badge">
                        {item.unit || 'unit'}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer: Monetary Breakdown & Actions */}
        {cartItems.length > 0 && (
          <footer className="agrily-cart-footer">
            <div className="agrily-cart-summary-row">
              <span>Produce Subtotal</span>
              <span className="agrily-cart-summary-val">{formatNaira(cartSubtotal)}</span>
            </div>
            <div className="agrily-cart-summary-row">
              <span>Estimated Logistics Haulage</span>
              <span className="agrily-cart-summary-val">
                {deliveryEstimate === 0 ? (
                  <span className="agrily-cart-free-badge">FREE (Bulk Freight)</span>
                ) : (
                  formatNaira(deliveryEstimate)
                )}
              </span>
            </div>
            <div className="agrily-cart-summary-divider"></div>
            <div className="agrily-cart-summary-row agrily-cart-grand-total-row">
              <span className="agrily-cart-total-label">Estimated Total</span>
              <span className="agrily-cart-total-amount">{formatNaira(grandTotal)}</span>
            </div>

            <div className="agrily-cart-footer-actions">
              <button
                type="button"
                className="agrily-btn-primary agrily-cart-checkout-btn"
                onClick={handleCheckoutClick}
              >
                Proceed to Checkout
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
              <button
                type="button"
                className="agrily-cart-continue-btn"
                onClick={closeCart}
              >
                Continue Browsing
              </button>
            </div>
          </footer>
        )}
      </aside>
    </div>
  );
};

export default CartDrawer;
