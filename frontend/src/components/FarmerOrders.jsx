/**
 * ==============================================================================
 * AGRILY AGRICULTURAL COMMERCE PLATFORM - FARMER ORDERS FULFILLMENT BOARD
 * ==============================================================================
 * 
 * Component Description:
 * A comprehensive order fulfillment management console empowering agricultural
 * producers to monitor incoming purchase requests, inspect buyer freight drop-off
 * locations, and transition supply chain states (Pending -> Confirmed -> In Transit -> Delivered).
 * 
 * Agricultural Fulfillment Workflow:
 *  1. Verification: Farmer inspects produce quantities and harvest schedule upon order arrival.
 *  2. Confirmation ('Confirm'): Confirms crop availability, triggering backend inventory decrement.
 *  3. Haulage Dispatch ('Dispatch Freight'): Produce is packaged into standard crates/bags,
 *     loaded onto transit trucks, and tracking waybill is stamped.
 *  4. Drop-off Reconciliation ('Mark Delivered'): Logistics delivery completed, triggering escrow
 *     payout settlement.
 * 
 * @component FarmerOrders
 * @requires react
 * @requires ../auth/useUser
 * @requires ../auth/useToken
 * @requires ./FarmerOrders.css
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUser } from '../auth/useUser';
import { useToken } from '../auth/useToken';
import './FarmerOrders.css';

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

/**
 * Format ISO date string into readable agricultural dispatch date.
 * @param {string|Date} dateVal
 * @returns {string} Formatted date string
 */
const formatDate = (dateVal) => {
  if (!dateVal) return 'Recently';
  try {
    const d = new Date(dateVal);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return 'Recently';
  }
};

const FarmerOrders = ({ initialOrders = null, farmerEmail: propEmail = null }) => {
  const user = useUser();
  const [token] = useToken();

  const farmerEmail = propEmail || user?.email || '';

  const [orders, setOrders] = useState(initialOrders || []);
  const [loading, setLoading] = useState(!initialOrders);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);

  // Fetch farmer orders if not supplied via props
  const fetchFarmerOrders = useCallback(async () => {
    if (!farmerEmail) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:5000/api/orders/farmer/${encodeURIComponent(farmerEmail)}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to retrieve farmer order queue.');
      }

      setOrders(data.orders || []);
    } catch (err) {
      console.warn('Farmer orders fetch error (using fallback state):', err.message);
      // If error occurs and no orders exist, keep current state gracefully
      if (!initialOrders) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [farmerEmail, token, initialOrders]);

  useEffect(() => {
    if (!initialOrders) {
      fetchFarmerOrders();
    }
  }, [fetchFarmerOrders, initialOrders]);

  // Handle one-click status transition
  const handleStatusTransition = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    setActionNotice(null);

    try {
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update order fulfillment status.');
      }

      // Optimistically update local order state
      setOrders(prevOrders =>
        prevOrders.map(ord => {
          if (ord._id === orderId || ord.orderNumber === orderId) {
            return {
              ...ord,
              status: newStatus
            };
          }
          return ord;
        })
      );

      setActionNotice(`Order status successfully updated to "${newStatus}".`);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err) {
      console.error('Status transition failure:', err);
      setActionNotice(`Error: ${err.message}`);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Filter orders according to active tab
  const filteredOrders = useMemo(() => {
    if (activeFilter === 'All') return orders;
    return orders.filter(ord => ord.status === activeFilter);
  }, [orders, activeFilter]);

  // Compute status counts for filter tabs
  const counts = useMemo(() => {
    const map = { All: orders.length, Pending: 0, Confirmed: 0, 'In Transit': 0, Delivered: 0, Cancelled: 0 };
    orders.forEach(ord => {
      if (map[ord.status] !== undefined) {
        map[ord.status]++;
      }
    });
    return map;
  }, [orders]);

  return (
    <div className="agrily-farmer-orders-container" data-testid="farmer-orders-board">
      {/* Header and Summary Bar */}
      <div className="agrily-farmer-orders-header">
        <div>
          <h2 className="agrily-farmer-orders-title">Produce Order Fulfillment Queue</h2>
          <p className="agrily-farmer-orders-subtitle">
            Manage buyer procurement requests, verify harvest stock allocations, and track dispatch haulage.
          </p>
        </div>

        <button
          type="button"
          className="agrily-refresh-btn"
          onClick={fetchFarmerOrders}
          disabled={loading}
          aria-label="Refresh order queue"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={loading ? 'spin' : ''}>
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          Refresh Queue
        </button>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div className={`agrily-action-notice ${actionNotice.startsWith('Error') ? 'error' : 'success'}`} role="alert">
          {actionNotice}
        </div>
      )}

      {/* Status Filter Chips */}
      <div className="agrily-order-filter-chips" role="tablist">
        {['All', 'Pending', 'Confirmed', 'In Transit', 'Delivered', 'Cancelled'].map(statusKey => (
          <button
            key={statusKey}
            type="button"
            role="tab"
            aria-selected={activeFilter === statusKey}
            className={`agrily-order-filter-chip ${activeFilter === statusKey ? 'active' : ''}`}
            onClick={() => setActiveFilter(statusKey)}
          >
            {statusKey}
            <span className="agrily-chip-badge">{counts[statusKey] || 0}</span>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="agrily-orders-loading-state" data-testid="orders-loading">
          <div className="agrily-spinner" aria-hidden="true"></div>
          <p>Retrieving incoming harvest procurement orders...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && orders.length === 0 && (
        <div className="agrily-orders-error-state" role="alert">
          <div className="agrily-error-icon">⚠️</div>
          <h3>Unable to Load Orders</h3>
          <p>{error}</p>
          <button type="button" className="btn-agrily-harvest" onClick={fetchFarmerOrders}>
            Retry Fetching
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredOrders.length === 0 && (
        <div className="agrily-orders-empty-state" data-testid="orders-empty-state">
          <div className="agrily-empty-icon" aria-hidden="true">📦</div>
          <h3>No Orders Found</h3>
          <p>
            {activeFilter === 'All'
              ? 'You do not have any incoming buyer orders at this time. When buyers purchase your produce on the marketplace, requests will appear here.'
              : `You do not have any orders currently marked as "${activeFilter}".`}
          </p>
        </div>
      )}

      {/* Orders Table */}
      {!loading && filteredOrders.length > 0 && (
        <div className="agrily-orders-table-wrapper">
          <table className="agrily-orders-table">
            <thead>
              <tr>
                <th>Order Ref & Date</th>
                <th>Buyer Information</th>
                <th>Consignment Produce Items</th>
                <th>Destination Drop-off</th>
                <th className="text-end">Monetary Value</th>
                <th className="text-center">Status</th>
                <th className="text-center">Fulfillment Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const orderId = order._id || order.orderNumber;
                const isProcessing = updatingOrderId === orderId;

                return (
                  <tr key={orderId} className={`agrily-order-row status-${order.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                    {/* Order Reference & Date */}
                    <td>
                      <div className="agrily-order-ref-code">{order.orderNumber || order._id}</div>
                      <div className="agrily-order-date">{formatDate(order.createdAt)}</div>
                    </td>

                    {/* Buyer Contact */}
                    <td>
                      <div className="agrily-buyer-name">{order.buyerName || 'Commercial Buyer'}</div>
                      <div className="agrily-buyer-contact">{order.buyerEmail}</div>
                      {order.buyerPhone && (
                        <div className="agrily-buyer-phone">{order.buyerPhone}</div>
                      )}
                    </td>

                    {/* Consignment Items */}
                    <td>
                      <div className="agrily-items-summary">
                        {(order.items || []).map((it, i) => (
                          <div key={i} className="agrily-item-pill">
                            <span className="agrily-item-pill-name">{it.name}</span>
                            <span className="agrily-item-pill-qty">
                              {it.quantity} {it.unit || 'unit'}s
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Drop-off Address */}
                    <td>
                      <div className="agrily-dropoff-address">
                        {order.deliveryAddress?.street ? (
                          <>
                            <span className="d-block text-truncate" style={{ maxWidth: '180px' }}>
                              {order.deliveryAddress.street}
                            </span>
                            <small className="text-muted">
                              {order.deliveryAddress.city}, {order.deliveryAddress.state}
                            </small>
                          </>
                        ) : (
                          <span className="text-muted">Farm Gate Pickup</span>
                        )}
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="text-end fw-bold text-success">
                      {formatNaira(order.totalAmount)}
                    </td>

                    {/* Status Badge */}
                    <td className="text-center">
                      <span className={`agrily-status-pill pill-${order.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                        {order.status}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="text-center">
                      <div className="agrily-action-buttons-group">
                        {order.status === 'Pending' && (
                          <>
                            <button
                              type="button"
                              className="agrily-btn-confirm"
                              onClick={() => handleStatusTransition(orderId, 'Confirmed')}
                              disabled={isProcessing}
                              aria-label={`Confirm order ${order.orderNumber}`}
                            >
                              {isProcessing ? 'Updating...' : '✓ Confirm Order'}
                            </button>
                            <button
                              type="button"
                              className="agrily-btn-cancel-sm"
                              onClick={() => handleStatusTransition(orderId, 'Cancelled')}
                              disabled={isProcessing}
                              aria-label={`Cancel order ${order.orderNumber}`}
                            >
                              ✕ Cancel
                            </button>
                          </>
                        )}

                        {order.status === 'Confirmed' && (
                          <button
                            type="button"
                            className="agrily-btn-transit"
                            onClick={() => handleStatusTransition(orderId, 'In Transit')}
                            disabled={isProcessing}
                            aria-label={`Dispatch order ${order.orderNumber} into transit`}
                          >
                            {isProcessing ? 'Updating...' : '🚚 Dispatch Freight'}
                          </button>
                        )}

                        {order.status === 'In Transit' && (
                          <button
                            type="button"
                            className="agrily-btn-delivered"
                            onClick={() => handleStatusTransition(orderId, 'Delivered')}
                            disabled={isProcessing}
                            aria-label={`Mark order ${order.orderNumber} as delivered`}
                          >
                            {isProcessing ? 'Updating...' : '📦 Mark Delivered'}
                          </button>
                        )}

                        {order.status === 'Delivered' && (
                          <span className="agrily-completed-label">✓ Fulfilled & Settled</span>
                        )}

                        {order.status === 'Cancelled' && (
                          <span className="agrily-cancelled-label">Revoked</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FarmerOrders;
