/**
 * ==============================================================================
 * AGRILY AGRICULTURAL COMMERCE PLATFORM - FARMER REVENUE CARDS COMPONENT
 * ==============================================================================
 * 
 * Component Description:
 * Renders statistical KPI summary cards displaying gross sales earnings,
 * pending escrow settlement funds, physical produce volume sold (units/tonnage),
 * and active inventory listings for an authenticated agricultural producer.
 * 
 * Design Standards Applied:
 *  - Colors: Curated Agrily palette (#1b4332 emerald, #bc6c25 ochre, #2d6a4f forest, #0284c7 sky)
 *  - Tactile Micro-interactions: translateY(-4px) hover elevation, soft drop-shadows
 *  - Responsiveness: Responsive 4-card grid across mobile (1 col), tablet (2 col), and desktop (4 col)
 *  - Null-safety: Graceful zero fallbacks when analytics API returns empty or pending data
 * 
 * @component RevenueCards
 * @requires react
 * @requires ./RevenueCards.css
 */

import React, { useState, useEffect, useCallback } from 'react';
import './RevenueCards.css';

/**
 * Format currency numbers into Nigerian Naira (NGN) format.
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

const RevenueCards = ({ email: propEmail, initialMetrics = null, activeListings = null }) => {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [activeListingsCount, setActiveListingsCount] = useState(activeListings || 0);
  const [loading, setLoading] = useState(!initialMetrics && Boolean(propEmail));
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    if (!propEmail) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:5000/api/analytics/farmer/${encodeURIComponent(propEmail)}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to retrieve revenue analytics');
      }

      setMetrics(data.metrics || null);
      if (data.activeListingsCount !== undefined) {
        setActiveListingsCount(data.activeListingsCount);
      }
    } catch (err) {
      console.warn('Analytics fetch error (using fallback zero state):', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [propEmail]);

  useEffect(() => {
    if (!initialMetrics && propEmail) {
      fetchAnalytics();
    }
  }, [fetchAnalytics, initialMetrics, propEmail]);

  // Fallback defaults if metrics null
  const grossRevenue = metrics?.grossRevenue || 0;
  const pendingRevenue = metrics?.pendingRevenue || 0;
  const totalUnitsSold = metrics?.totalUnitsSold || 0;
  const completedOrders = metrics?.statusCounts?.delivered || 0;

  if (loading) {
    return (
      <div className="agrily-revenue-cards-grid" data-testid="revenue-cards-loading">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="agrily-kpi-card skeleton">
            <div className="skeleton-icon"></div>
            <div className="skeleton-line sm"></div>
            <div className="skeleton-line lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="agrily-revenue-cards-grid" data-testid="revenue-cards-grid">
      {/* KPI Card 1: Gross Realized Revenue */}
      <div className="agrily-kpi-card emerald" data-testid="kpi-gross-revenue">
        <div className="agrily-kpi-header">
          <span className="agrily-kpi-title">Gross Sales Revenue</span>
          <div className="agrily-kpi-icon-wrap emerald" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
        </div>
        <div className="agrily-kpi-value">{formatNaira(grossRevenue)}</div>
        <div className="agrily-kpi-meta">
          <span className="agrily-kpi-badge success">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: '-1px' }} aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Confirmed & Delivered
          </span>
          <span className="agrily-kpi-subtext">{completedOrders} deals completed</span>
        </div>
      </div>

      {/* KPI Card 2: Pending Escrow / Transit Revenue */}
      <div className="agrily-kpi-card ochre" data-testid="kpi-pending-revenue">
        <div className="agrily-kpi-header">
          <span className="agrily-kpi-title">Pending Escrow Payouts</span>
          <div className="agrily-kpi-icon-wrap ochre" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
        </div>
        <div className="agrily-kpi-value">{formatNaira(pendingRevenue)}</div>
        <div className="agrily-kpi-meta">
          <span className="agrily-kpi-badge warning">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: '-1px' }} aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            In Escrow / Transit
          </span>
          <span className="agrily-kpi-subtext">Awaiting inspection</span>
        </div>
      </div>

      {/* KPI Card 3: Total Harvest Units Sold */}
      <div className="agrily-kpi-card forest" data-testid="kpi-units-sold">
        <div className="agrily-kpi-header">
          <span className="agrily-kpi-title">Produce Volume Sold</span>
          <div className="agrily-kpi-icon-wrap forest" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          </div>
        </div>
        <div className="agrily-kpi-value">
          {totalUnitsSold.toLocaleString()} <small className="unit">units</small>
        </div>
        <div className="agrily-kpi-meta">
          <span className="agrily-kpi-badge neutral">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: '-1px' }} aria-hidden="true">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
            Crates, Bags & Tons
          </span>
          <span className="agrily-kpi-subtext">Cumulative dispatched</span>
        </div>
      </div>

      {/* KPI Card 4: Active Farm Listings */}
      <div className="agrily-kpi-card sky" data-testid="kpi-active-listings">
        <div className="agrily-kpi-header">
          <span className="agrily-kpi-title">Active Market Batches</span>
          <div className="agrily-kpi-icon-wrap sky" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </div>
        </div>
        <div className="agrily-kpi-value">
          {activeListingsCount.toLocaleString()} <small className="unit">batches</small>
        </div>
        <div className="agrily-kpi-meta">
          <span className="agrily-kpi-badge info">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: '-1px' }} aria-hidden="true">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            Ready for Dispatch
          </span>
          <span className="agrily-kpi-subtext">Listed on marketplace</span>
        </div>
      </div>
    </div>
  );
};

export default RevenueCards;
