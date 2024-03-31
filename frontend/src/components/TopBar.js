/**
 * ============================================================================
 * AGRILY AGRICULTURAL COMMERCE & PROVENANCE PLATFORM
 * TopBar Dashboard Navigation Component
 * ============================================================================
 * 
 * @module frontend/src/components/TopBar
 * @description
 * High-fidelity top navigation bar for the authenticated farmer/producer dashboard.
 * Matches the visual design system of the public landing page (NavBar) with:
 *  - Glassmorphic backdrop blur (rgba(255, 255, 255, 0.94), blur(12px))
 *  - Agrily emerald branding & SVG logo
 *  - Links to Dashboard, Marketplace, Orders
 *  - Floating CartDrawer trigger
 *  - Real-time NotificationCenter bell
 *  - Producer identity pill with emerald initials avatar & verification badge
 *  - Responsive mobile collapse menu
 */

import React from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Container from 'react-bootstrap/Container';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../auth/useUser';
import Logo from './Logo';
import { useCart } from '../state/CartContext';
import NotificationCenter from './NotificationCenter';
import { TrustBadge } from './TrustBadge';

function TopBar({ logout }) {
  const user = useUser();
  const navigate = useNavigate();
  const { firstName = '', lastName = '', email = '', isVerified = false, farmProfile } = user || {};

  const initials = ((firstName?.charAt(0) || '') + (lastName?.charAt(0) || '')).toUpperCase() || 'P';
  const displayName = firstName ? `${firstName} ${lastName}`.trim() : email.split('@')[0] || 'Farmer';

  let toggleCart = null;
  let totalItems = 0;
  try {
    const cart = useCart();
    toggleCart = cart.toggleCart;
    totalItems = cart.totalItems;
  } catch {
    // Outside cart provider fallback
  }

  const handleLogout = () => {
    if (typeof logout === 'function') {
      logout();
    } else {
      localStorage.removeItem('token');
      navigate('/index');
    }
  };

  return (
    <Navbar
      collapseOnSelect
      expand="lg"
      sticky="top"
      style={{
        background: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(229, 231, 235, 0.8)',
        padding: '0.85rem 0',
        transition: 'all 200ms ease',
        zIndex: 1040
      }}
    >
      <Container>
        <Logo size="md" linkTo="/home" />

        <Navbar.Toggle aria-controls="topbar-navbar-nav" style={{ border: 'none' }} />

        <Navbar.Collapse id="topbar-navbar-nav">
          <Nav className="ms-auto align-items-center" style={{ gap: '1.25rem' }}>
            <Nav.Link
              as={Link}
              to="/home"
              style={{ fontWeight: '600', color: '#1b4332', fontSize: '0.95rem' }}
            >
              Dashboard
            </Nav.Link>

            <Nav.Link
              as={Link}
              to="/marketplace"
              style={{ fontWeight: '500', color: '#475569', fontSize: '0.95rem' }}
            >
              Marketplace
            </Nav.Link>

            <Nav.Link
              as={Link}
              to="/add-product"
              style={{ fontWeight: '600', color: '#bc6c25', fontSize: '0.95rem' }}
            >
              + List Produce
            </Nav.Link>

            {/* Shopping Cart Trigger - Logged In Users Only */}
            {user && toggleCart && (
              <button
                type="button"
                onClick={toggleCart}
                aria-label={`Open shopping cart (${totalItems} items)`}
                style={{
                  background: 'none',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '0.45rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  cursor: 'pointer',
                  color: '#1b4332',
                  fontWeight: '600',
                  fontSize: '0.88rem',
                  position: 'relative',
                  transition: 'all 0.2s ease'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <span>Cart</span>
                {totalItems > 0 && (
                  <span
                    style={{
                      backgroundColor: '#bc6c25',
                      color: '#ffffff',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: '0.1rem'
                    }}
                  >
                    {totalItems}
                  </span>
                )}
              </button>
            )}

            {/* Notification Center Trigger - Logged In Users Only */}
            {user && <NotificationCenter />}

            {/* Producer Profile Pill & Logout / Fallback */}
            {user ? (
              <div
                className="d-flex align-items-center"
                style={{
                  gap: '0.85rem',
                  paddingLeft: '0.5rem',
                  borderLeft: '1px solid #e2e8f0'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem'
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #1b4332, #2d6a4f)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '0.875rem',
                      boxShadow: '0 2px 6px rgba(27, 67, 50, 0.2)',
                      flexShrink: 0
                    }}
                    title={displayName}
                  >
                    {initials}
                  </div>

                  <div className="d-none d-md-flex flex-column text-start">
                    <span
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: '700',
                        color: '#0f172a',
                        lineHeight: 1.2
                      }}
                    >
                      {displayName}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {isVerified ? 'Verified Producer' : 'Producer Account'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-agrily-outline"
                  style={{
                    padding: '0.4rem 0.95rem',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#475569',
                    borderColor: '#cbd5e1',
                    background: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="d-flex align-items-center" style={{ gap: '0.75rem', marginLeft: '0.5rem' }}>
                <Link
                  to="/login"
                  className="btn-agrily-outline"
                  style={{
                    textDecoration: 'none',
                    padding: '0.45rem 1.1rem',
                    fontSize: '0.9rem'
                  }}
                >
                  Sign In
                </Link>

                <Link
                  to="/register"
                  className="btn-agrily-harvest"
                  style={{
                    textDecoration: 'none',
                    padding: '0.45rem 1.15rem',
                    fontSize: '0.9rem'
                  }}
                >
                  Get Started
                </Link>
              </div>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default TopBar;