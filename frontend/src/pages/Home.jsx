/**
 * ============================================================================
 * AGRILY AGRICULTURAL COMMERCE & PROVENANCE PLATFORM
 * Farmer Operations Dashboard Page (Home.jsx)
 * ============================================================================
 * 
 * @page Home
 * @module frontend/src/pages/Home
 * @description
 * Primary operational dashboard for verified producers, smallholder farmers,
 * and cooperative aggregators. Re-architected to seamlessly mirror the aesthetic
 * standards and palette of the Agrily Landing Page, featuring:
 *  - Glassmorphic navigation header (TopBar)
 *  - Operations Hero Banner with time-aware greeting and trust credentials
 *  - Interactive FarmProfileEditor modal for KYC & geolocation updates
 *  - Real-time revenue & sales telemetry cards (RevenueCards)
 *  - Waybill fulfillment queue with lifecycle state transitions (FarmerOrders)
 *  - Live produce inventory catalog (ProductList) with quick listing actions
 * 
 * @license Private / Proprietary Agrily Inc.
 */

import React, { useEffect, useState, useContext } from 'react';
import TopBar from '../components/TopBar';
import { useUser } from '../auth/useUser';
import { useToken } from '../auth/useToken';
import { useNavigate, Link } from 'react-router-dom';
import './Home.css';
import { Container, Row, Col } from 'react-bootstrap';
import Footer from '../components/Footer';
import ProductList from '../components/ProductList';
import RevenueCards from '../components/RevenueCards';
import FarmerOrders from '../components/FarmerOrders';
import { AppContext } from '../state/AppContext';
import { WheatIcon, SproutIcon } from '../components/Icons';
import { TrustBadge } from '../components/TrustBadge';
import FarmProfileEditor from '../components/FarmProfileEditor';

function Home() {
  const { value } = useContext(AppContext);
  const navigate = useNavigate();
  const [moment, setMoment] = useState('day');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [farmerProfile, setFarmerProfile] = useState(null);

  const user = useUser();
  const [token] = useToken();
  const { firstName = '', lastName = '', id, email = '', isVerified = false } = user || {};

  // Verify authentication state and greeting
  useEffect(() => {
    if (user === null) {
      navigate('/index');
    }
    checkTime();
  }, [user, navigate]);

  // Fetch producer farm profile from /api/users/profile/:email
  useEffect(() => {
    if (!email) return;

    let isMounted = true;
    async function loadProfile() {
      try {
        const res = await fetch(`/api/users/profile/${encodeURIComponent(email)}`);
        const contentType = res.headers?.get ? (res.headers.get('content-type') || '') : 'application/json';
        if (res.ok && (!contentType || contentType.includes('application/json'))) {
          const data = await res.json();
          if (isMounted && data.profile?.farmProfile) {
            setFarmerProfile(data.profile.farmProfile);
          }
        }
      } catch (err) {
        // Fallback to embedded user profile if endpoint unavailable
        if (isMounted && user?.farmProfile) {
          setFarmerProfile(user.farmProfile);
        }
      }
    }
    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [email, user]);

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/index');
  };

  const checkTime = () => {
    const today = new Date();
    const curHr = today.getHours();

    if (curHr < 12) {
      setMoment('morning');
    } else if (curHr < 18) {
      setMoment('afternoon');
    } else {
      setMoment('evening');
    }
  };

  const currentTrustScore = farmerProfile?.trustScore ?? (isVerified ? 98 : 85);
  const currentStatus = farmerProfile?.verificationStatus || (isVerified ? 'verified' : 'unverified');
  const farmLocation = farmerProfile?.farmLocation?.state || 'Active Agricultural Zone';
  const cooperative = farmerProfile?.cooperativeName || 'Independent Producer';

  return (
    <div className="agrily-home-dashboard" data-testid="farmer-dashboard">
      {/* 1. TOP NAVIGATION BAR */}
      <TopBar logout={logout} />

      {/* 2. OPERATIONS HERO BANNER (MATCHES LANDING PAGE JUMBOTRON) */}
      <header className="dashboard-hero-banner" role="banner">
        <Container>
          <Row className="align-items-center">
            <Col lg={8} xl={7}>
              {/* Pill Banner */}
              <div className="hero-pill-badge">
                <WheatIcon size={16} color="#dda15e" />
                <span>Farm Operations & Logistics Console</span>
              </div>

              {/* Personalized Greeting */}
              <h1 className="hero-greeting-title">
                Good {moment},{' '}
                <span className="hero-greeting-highlight">
                  {firstName || 'Producer'}
                </span>
              </h1>

              {/* Subheading */}
              <p className="hero-lead-text">
                Monitor your wholesale produce sales, coordinate haulage waybills, manage harvest inventory, and maintain your verified marketplace trust rating.
              </p>

              {/* Action Buttons */}
              <div className="hero-action-group">
                <Link to="/add-product" className="btn-hero-primary" data-testid="btn-add-produce">
                  <SproutIcon size={18} color="#ffffff" />
                  <span>+ List Harvested Produce</span>
                </Link>

                <button
                  type="button"
                  className="btn-hero-secondary"
                  onClick={() => setShowProfileModal(true)}
                  data-testid="btn-open-profile-modal"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span>Edit Farm Profile & KYC</span>
                </button>

                <Link to="/marketplace" className="btn-hero-secondary">
                  <span>Marketplace Catalog</span>
                </Link>
              </div>

              {/* Quick Operational Metrics Ribbon */}
              <div className="hero-quick-stats">
                <div className="stat-metric-card">
                  <span className="stat-metric-value">{currentTrustScore}%</span>
                  <span className="stat-metric-label">Buyer Trust Score</span>
                </div>

                <div className="stat-metric-card">
                  <div style={{ display: 'flex', alignItems: 'center', height: '1.65rem' }}>
                    <TrustBadge status={currentStatus} trustScore={currentTrustScore} size="sm" />
                  </div>
                  <span className="stat-metric-label">Producer Status</span>
                </div>

                <div className="stat-metric-card">
                  <span className="stat-metric-value" style={{ color: '#dda15e' }}>
                    {farmLocation}
                  </span>
                  <span className="stat-metric-label">Operational Hub</span>
                </div>

                <div className="stat-metric-card">
                  <span className="stat-metric-value" style={{ color: '#cbd5e1', fontSize: '1.1rem' }}>
                    {cooperative}
                  </span>
                  <span className="stat-metric-label">Growers Union</span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </header>

      {/* 3. MAIN DASHBOARD CONTENT */}
      <main className="py-4 flex-grow-1">
        <Container>
          {/* Email Verification Banner */}
          {!isVerified && (
            <div className="dashboard-alert-banner" role="alert" data-testid="unverified-alert">
              <div>
                <strong style={{ color: '#854d0e', display: 'block', marginBottom: '2px' }}>
                  Action Required: Email Verification Pending
                </strong>
                <p className="alert-banner-text">
                  Please verify your producer email address (<strong>{email || 'your email'}</strong>) to unlock direct bank settlements, freight escrow releases, and the Verified Farmer badge.
                </p>
              </div>
              <button
                type="button"
                className="btn-verify-now"
                onClick={() => navigate('/verify-email')}
              >
                Verify Email Now
              </button>
            </div>
          )}

          {/* SECTION 1: REVENUE & SALES ANALYTICS */}
          <section aria-label="Farm Revenue Analytics" className="mb-5">
            <div className="dashboard-section-header">
              <div className="section-headline-group">
                <div className="section-icon-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <div>
                  <h2 className="section-main-heading">Revenue & Sales Performance</h2>
                  <div className="section-subtext">Gross farm receipts, pending escrow, and volume fulfilled</div>
                </div>
              </div>
            </div>

            <RevenueCards email={email} />
          </section>

          {/* SECTION 2: ORDER FULFILLMENT MANAGEMENT */}
          <section aria-label="Incoming Buyer Orders" className="mb-5">
            <div className="dashboard-section-header">
              <div className="section-headline-group">
                <div className="section-icon-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="3" width="15" height="13"></rect>
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                    <circle cx="5.5" cy="18.5" r="2.5"></circle>
                    <circle cx="18.5" cy="18.5" r="2.5"></circle>
                  </svg>
                </div>
                <div>
                  <h2 className="section-main-heading">Order Fulfillment & Transit Dispatch</h2>
                  <div className="section-subtext">Manage incoming buyer consignments and issue transit waybills</div>
                </div>
              </div>
            </div>

            <FarmerOrders farmerEmail={email} />
          </section>

          {/* SECTION 3: MY LISTED FARM PRODUCE */}
          <section aria-label="My Produce Listings" className="mb-5">
            <div className="dashboard-section-header">
              <div className="section-headline-group">
                <div className="section-icon-badge">
                  <SproutIcon size={18} color="#2d6a4f" />
                </div>
                <div>
                  <h2 className="section-main-heading">My Listed Farm Produce</h2>
                  <div className="section-subtext">Active crop listings, live inventory balances, and pricing</div>
                </div>
              </div>

              <Link to="/add-product" className="btn-section-action" data-testid="link-add-produce">
                <span>+ Add Produce</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>

            {email ? (
              <ProductList email={email} />
            ) : (
              <p className="text-muted">Loading your farm produce catalogue...</p>
            )}
          </section>
        </Container>
      </main>

      {/* 4. FARM PROFILE & KYC EDITOR MODAL */}
      {showProfileModal && (
        <div
          className="profile-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-modal-title"
          data-testid="farm-profile-modal"
          onClick={() => setShowProfileModal(false)}
        >
          <div
            className="profile-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="profile-modal-close-btn"
              onClick={() => setShowProfileModal(false)}
              aria-label="Close Profile Editor"
              data-testid="btn-close-profile-modal"
            >
              &times;
            </button>

            <FarmProfileEditor
              initialProfile={farmerProfile || {}}
              userEmail={email}
              onSaveSuccess={(updated) => {
                if (updated?.farmProfile) {
                  setFarmerProfile(updated.farmProfile);
                }
              }}
              onCancel={() => setShowProfileModal(false)}
            />
          </div>
        </div>
      )}

      {/* 5. FOOTER */}
      <Footer />
    </div>
  );
}

export default Home;
