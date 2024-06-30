import React from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Container from 'react-bootstrap/Container';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { useCart } from '../state/CartContext';
import NotificationCenter from './NotificationCenter';
import { useUser } from '../auth/useUser';

function NavBar() {
  const user = useUser();
  let toggleCart = null;
  let totalItems = 0;
  try {
    const cart = useCart();
    toggleCart = cart.toggleCart;
    totalItems = cart.totalItems;
  } catch {
    // Graceful fallback if rendered outside CartProvider
  }

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
        transition: 'all 200ms ease'
      }}
    >
      <Container>
        <Logo size="md" linkTo={user ? "/home" : "/"} />

        <Navbar.Toggle aria-controls="responsive-navbar-nav" style={{ border: 'none' }} />

        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="ms-auto align-items-center" style={{ gap: '1.25rem' }}>
            <Nav.Link
              as={Link}
              to={user ? "/home" : "/"}
              style={{ fontWeight: '500', color: '#475569', fontSize: '0.95rem' }}
            >
              Home
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/marketplace"
              style={{ fontWeight: '600', color: '#1b4332', fontSize: '0.95rem' }}
            >
              Marketplace
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/driver/register"
              style={{ fontWeight: '500', color: '#475569', fontSize: '0.95rem' }}
              data-testid="nav-driver-portal"
            >
              Fleet Drivers
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/tracking"
              style={{ fontWeight: '500', color: '#475569', fontSize: '0.95rem' }}
              data-testid="nav-tracking-link"
            >
              Live Radar
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/cold-chain"
              style={{ fontWeight: '500', color: '#475569', fontSize: '0.95rem' }}
              data-testid="nav-coldchain-link"
            >
              Cold-Chain
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/escrow"
              style={{ fontWeight: '500', color: '#475569', fontSize: '0.95rem' }}
              data-testid="nav-escrow-link"
            >
              Escrow Vault
            </Nav.Link>
            <Nav.Link
              href="#about"
              style={{ fontWeight: '500', color: '#475569', fontSize: '0.95rem' }}
            >
              Why Agrily
            </Nav.Link>
            <Nav.Link
              href="#categories"
              style={{ fontWeight: '500', color: '#475569', fontSize: '0.95rem' }}
            >
              Categories
            </Nav.Link>

            {/* Cart Trigger Button - Logged In Users Only */}
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

            {user ? (
              <div className="d-flex align-items-center" style={{ gap: '0.75rem', marginLeft: '0.5rem' }}>
                <Link
                  to="/home"
                  className="btn-agrily-harvest"
                  style={{
                    textDecoration: 'none',
                    padding: '0.45rem 1.15rem',
                    fontSize: '0.9rem'
                  }}
                >
                  Dashboard &rarr;
                </Link>
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

export default NavBar;