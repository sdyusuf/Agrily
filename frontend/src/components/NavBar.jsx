/**
 * ==============================================================================
 * 🌾 AGRILY AGRO-COMMERCE PLATFORM: REFINED NAVIGATION BAR COMPONENT
 * ==============================================================================
 * 
 * Executive, uncluttered frosted-glass navigation bar conforming strictly
 * to the Agrily Modern UI Design System ("Earth & Innovation").
 * 
 * Key Highlights:
 *  - Categorized "Logistics & Fleet" dropdown to eliminate link overcrowding.
 *  - Accessible dropdown with renderMenuOnMount for seamless DOM discovery & SEO.
 *  - Active route indicators and tactile micro-interactions.
 *  - Responsive mobile collapse and role-based action triggers.
 * 
 * @module components/NavBar
 * @author Agrily Frontend Engineering
 * ==============================================================================
 */

import React from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Container from 'react-bootstrap/Container';
import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';
import { useCart } from '../state/CartContext';
import NotificationCenter from './NotificationCenter';
import { useUser } from '../auth/useUser';
import './NavBar.css';

function NavBar() {
  const user = useUser();
  const location = useLocation();

  let toggleCart = null;
  let totalItems = 0;
  try {
    const cart = useCart();
    toggleCart = cart.toggleCart;
    totalItems = cart.totalItems;
  } catch {
    // Graceful fallback if rendered outside CartProvider
  }

  // Role & actor identification
  const userRole = (user?.role || '').toUpperCase();
  const isDriver = userRole === 'DRIVER' || userRole === 'PRIMARY_DRIVER' || userRole === 'TRANSPORTER';

  // Determine active section states
  const pathname = location.pathname || '';
  const isMarketplaceActive = pathname === '/marketplace';
  const isAgronomyActive = pathname.startsWith('/agronomy');
  const isHomeActive = pathname === '/' || pathname === '/home';
  const isEscrowActive = pathname.startsWith('/escrow');
  const isLogisticsActive = [
    '/route-planner',
    '/dispatch',
    '/routes',
    '/waybills',
    '/tracking',
    '/cold-chain',
    '/driver'
  ].some(route => pathname.startsWith(route));

  return (
    <Navbar
      collapseOnSelect
      expand="lg"
      sticky="top"
      className="agrily-navbar"
    >
      <Container>
        {/* Brand Logo */}
        <Logo size="md" linkTo={user ? "/home" : "/"} />

        {/* Mobile Hamburger Toggle */}
        <Navbar.Toggle
          aria-controls="responsive-navbar-nav"
          style={{ border: 'none', padding: '0.4rem', outline: 'none' }}
        />

        {/* Main Navigation Links */}
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="ms-auto align-items-center" style={{ gap: '0.65rem' }}>
            {/* 1. Home (Public & Authenticated) */}
            <Nav.Link
              as={Link}
              to={user ? (isDriver ? "/driver/dashboard" : "/home") : "/"}
              className={`agrily-nav-link ${isHomeActive ? 'active-link' : ''}`}
            >
              Home
            </Nav.Link>

            {/* 2. Marketplace (Public Commercial Catalog) */}
            <Nav.Link
              as={Link}
              to="/marketplace"
              className={`agrily-nav-link ${isMarketplaceActive ? 'active-link' : ''}`}
              style={{ fontWeight: isMarketplaceActive ? '700' : '600' }}
            >
              Marketplace
            </Nav.Link>

            {/* 2.5 Agronomy AI (Public Pathology & Treatment Vision) */}
            <Nav.Link
              as={Link}
              to="/agronomy"
              className={`agrily-nav-link ${isAgronomyActive ? 'active-link' : ''}`}
              style={{ fontWeight: isAgronomyActive ? '700' : '600' }}
              data-testid="nav-agronomy-link"
            >
              Agronomy AI
            </Nav.Link>

            {/* 3. Logistics & Fleet (Strictly Authenticated: Operations & Fleet) */}
            {user && (
              <NavDropdown
                title={
                  <span className="d-inline-flex align-items-center" style={{ gap: '0.35rem' }}>
                    Logistics &amp; Fleet
                    <svg className="dropdown-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                }
                id="nav-logistics-dropdown"
                renderMenuOnMount={true}
                className={`agrily-nav-dropdown ${isLogisticsActive ? 'active-dropdown' : ''}`}
                menuVariant="light"
              >
                <div className="agrily-dropdown-menu">
                  <p className="dropdown-header-label">Fleet Operations &amp; Transit</p>

                  {/* Route Dispatch */}
                  <NavDropdown.Item
                    as={Link}
                    to="/route-planner"
                    className="agrily-dropdown-item"
                    data-testid="nav-routes-link"
                  >
                    <div className="dropdown-item-icon icon-emerald">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                    <div className="dropdown-item-content">
                      <span className="dropdown-item-title">Route Dispatch</span>
                      <span className="dropdown-item-desc">AI multi-stop route planner</span>
                    </div>
                  </NavDropdown.Item>

                  {/* Digital Waybills */}
                  <NavDropdown.Item
                    as={Link}
                    to="/waybills"
                    className="agrily-dropdown-item"
                    data-testid="nav-waybills-link"
                  >
                    <div className="dropdown-item-icon icon-ochre">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                    </div>
                    <div className="dropdown-item-content">
                      <span className="dropdown-item-title">Waybills</span>
                      <span className="dropdown-item-desc">Digital consignment &amp; QR seals</span>
                    </div>
                  </NavDropdown.Item>

                  {/* Live Radar */}
                  <NavDropdown.Item
                    as={Link}
                    to="/tracking"
                    className="agrily-dropdown-item"
                    data-testid="nav-tracking-link"
                  >
                    <div className="dropdown-item-icon icon-blue">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <div className="dropdown-item-content">
                      <span className="dropdown-item-title">Live Radar</span>
                      <span className="dropdown-item-desc">Real-time GPS vehicle tracking</span>
                    </div>
                  </NavDropdown.Item>

                  {/* Cold-Chain Telemetry */}
                  <NavDropdown.Item
                    as={Link}
                    to="/cold-chain"
                    className="agrily-dropdown-item"
                    data-testid="nav-coldchain-link"
                  >
                    <div className="dropdown-item-icon icon-indigo">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </div>
                    <div className="dropdown-item-content">
                      <span className="dropdown-item-title">Cold-Chain</span>
                      <span className="dropdown-item-desc">IoT climate &amp; sensor telemetry</span>
                    </div>
                  </NavDropdown.Item>

                  {/* Fleet Drivers Portal / Driver Cockpit */}
                  <NavDropdown.Item
                    as={Link}
                    to={isDriver ? "/driver/dashboard" : "/driver/register"}
                    className="agrily-dropdown-item"
                    data-testid="nav-driver-portal"
                  >
                    <div className="dropdown-item-icon icon-slate">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="1" y="3" width="15" height="13" />
                        <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
                        <circle cx="5.5" cy="18.5" r="2.5" />
                        <circle cx="18.5" cy="18.5" r="2.5" />
                      </svg>
                    </div>
                    <div className="dropdown-item-content">
                      <span className="dropdown-item-title">
                        {isDriver ? 'Driver Cockpit' : 'Fleet Drivers'}
                      </span>
                      <span className="dropdown-item-desc">
                        {isDriver ? 'Active duty & consignment hauls' : 'Transporter registration & portal'}
                      </span>
                    </div>
                  </NavDropdown.Item>

                  {/* Fleet Analytics & Yield */}
                  <NavDropdown.Item
                    as={Link}
                    to="/fleet-analytics"
                    className="agrily-dropdown-item"
                    data-testid="nav-fleet-analytics-link"
                  >
                    <div className="dropdown-item-icon icon-emerald">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                      </svg>
                    </div>
                    <div className="dropdown-item-content">
                      <span className="dropdown-item-title">Fleet Analytics</span>
                      <span className="dropdown-item-desc">Turnaround, fuel &amp; freight yields</span>
                    </div>
                  </NavDropdown.Item>
                </div>
              </NavDropdown>
            )}

            {/* 4. Escrow Vault (Strictly Authenticated: Financial Settlements) */}
            {user && (
              <Nav.Link
                as={Link}
                to="/escrow"
                className={`agrily-nav-link ${isEscrowActive ? 'active-link' : ''}`}
                data-testid="nav-escrow-link"
              >
                Escrow Vault
              </Nav.Link>
            )}

            {/* 5. Explore (Public & Authenticated: Discovery & Links) */}
            <NavDropdown
              title={
                <span className="d-inline-flex align-items-center" style={{ gap: '0.35rem' }}>
                  Explore
                  <svg className="dropdown-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              }
              id="nav-explore-dropdown"
              renderMenuOnMount={true}
              className="agrily-nav-dropdown"
            >
              <div className="agrily-dropdown-menu" style={{ minWidth: '240px' }}>
                <NavDropdown.Item as={Link} to="/#categories" className="agrily-dropdown-item">
                  <div className="dropdown-item-icon icon-emerald">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </div>
                  <div className="dropdown-item-content">
                    <span className="dropdown-item-title">Categories</span>
                    <span className="dropdown-item-desc">Fresh produce taxonomy</span>
                  </div>
                </NavDropdown.Item>

                <NavDropdown.Item as={Link} to="/#about" className="agrily-dropdown-item">
                  <div className="dropdown-item-icon icon-ochre">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  </div>
                  <div className="dropdown-item-content">
                    <span className="dropdown-item-title">Why Agrily</span>
                    <span className="dropdown-item-desc">Mission &amp; escrow model</span>
                  </div>
                </NavDropdown.Item>

                {/* Public utility links for unauthenticated visitors */}
                {!user && (
                  <>
                    <NavDropdown.Item as={Link} to="/tracking" className="agrily-dropdown-item" data-testid="guest-track-link">
                      <div className="dropdown-item-icon icon-blue">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </div>
                      <div className="dropdown-item-content">
                        <span className="dropdown-item-title">Track Consignment</span>
                        <span className="dropdown-item-desc">Public order &amp; waybill lookup</span>
                      </div>
                    </NavDropdown.Item>

                    <NavDropdown.Item as={Link} to="/driver/register" className="agrily-dropdown-item" data-testid="guest-driver-register">
                      <div className="dropdown-item-icon icon-slate">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <rect x="1" y="3" width="15" height="13" />
                          <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
                          <circle cx="5.5" cy="18.5" r="2.5" />
                          <circle cx="18.5" cy="18.5" r="2.5" />
                        </svg>
                      </div>
                      <div className="dropdown-item-content">
                        <span className="dropdown-item-title">Become a Transporter</span>
                        <span className="dropdown-item-desc">Join Agrily logistics fleet</span>
                      </div>
                    </NavDropdown.Item>
                  </>
                )}
              </div>
            </NavDropdown>

            {/* Cart Trigger Button - Logged In Users Only */}
            {user && toggleCart && (
              <button
                type="button"
                onClick={toggleCart}
                aria-label={`Open shopping cart (${totalItems} items)`}
                className="nav-cart-btn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <span>Cart</span>
                {totalItems > 0 && (
                  <span className="cart-count-badge">
                    {totalItems}
                  </span>
                )}
              </button>
            )}

            {/* Notification Center Trigger - Logged In Users Only */}
            {user && <NotificationCenter />}

            {/* Auth Action Buttons */}
            {user ? (
              <div className="d-flex align-items-center" style={{ gap: '0.6rem', marginLeft: '0.4rem' }}>
                <Link
                  to={isDriver ? "/driver/dashboard" : "/home"}
                  className="nav-btn-register"
                >
                  Dashboard &rarr;
                </Link>
              </div>
            ) : (
              <div className="d-flex align-items-center" style={{ gap: '0.6rem', marginLeft: '0.4rem' }}>
                <Link
                  to="/login"
                  className="nav-btn-signin"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="nav-btn-register"
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