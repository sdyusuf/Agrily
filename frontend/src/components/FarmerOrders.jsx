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
import SearchBar from './SearchBar';
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
  const [searchQuery, setSearchQuery] = useState('');
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
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/orders/farmer/${encodeURIComponent(farmerEmail)}`, {
        headers: {
          'Accept': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      const contentType = response.headers?.get ? (response.headers.get('content-type') || '') : 'application/json';
      if (contentType && !contentType.includes('application/json')) {
        console.warn('Non-JSON response received from orders API:', response.status);
        setOrders([]);
        return;
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to retrieve farmer order queue.');
      }

      setOrders(data.orders || []);
    } catch (err) {
      console.warn('Farmer orders fetch error (using fallback state):', err.message);
      if (!initialOrders) {
        const friendlyMessage = err.message.includes('Unexpected token')
          ? 'Unable to connect to order fulfillment service. Please verify server connection.'
          : err.message;
        setError(friendlyMessage);
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

  // Filter orders according to active tab AND debounced search query
  const filteredOrders = useMemo(() => {
    let list = orders;
    if (activeFilter !== 'All') {
      list = list.filter(ord => ord.status === activeFilter);
    }
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(ord => {
        const orderRef = (ord.orderNumber || ord._id || '').toLowerCase();
        const buyerName = (ord.buyerName || '').toLowerCase();
        const buyerEmail = (ord.buyerEmail || '').toLowerCase();
        const buyerPhone = (ord.buyerPhone || '').toLowerCase();
        const items = (ord.items || []).map(it => (it.name || '').toLowerCase()).join(' ');
        const city = (ord.deliveryAddress?.city || '').toLowerCase();
        const state = (ord.deliveryAddress?.state || '').toLowerCase();

        return (
          orderRef.includes(q) ||
          buyerName.includes(q) ||
          buyerEmail.includes(q) ||
          buyerPhone.includes(q) ||
          items.includes(q) ||
          city.includes(q) ||
          state.includes(q)
        );
      });
    }
    return list;
  }, [orders, activeFilter, searchQuery]);

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

      {/* Debounced Search Bar */}
      <div className="agrily-order-search-bar-wrap mb-4">
        <SearchBar
          placeholder="Search orders by reference #, buyer, produce item, or drop-off location..."
          ariaLabel="Search orders queue"
          onSearch={(val) => setSearchQuery(val)}
          debounceMs={300}
        />
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
          <div className="agrily-error-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
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
          <div className="agrily-empty-icon" aria-hidden="true">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <h3>No Orders Found</h3>
          <p>
            {searchQuery
              ? `No orders match your search "${searchQuery}". Try searching with a different order number or buyer detail.`
              : activeFilter === 'All'
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
                              {isProcessing ? 'Updating...' : (
                                <>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: '-1px' }} aria-hidden="true">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                  Confirm Order
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              className="agrily-btn-cancel-sm"
                              onClick={() => handleStatusTransition(orderId, 'Cancelled')}
                              disabled={isProcessing}
                              aria-label={`Cancel order ${order.orderNumber}`}
                            >
                              Cancel
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
                            {isProcessing ? 'Updating...' : (
                              <>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: '-1px' }} aria-hidden="true">
                                  <rect x="1" y="3" width="15" height="13" />
                                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                                  <circle cx="5.5" cy="18.5" r="2.5" />
                                  <circle cx="18.5" cy="18.5" r="2.5" />
                                </svg>
                                Dispatch Freight
                              </>
                            )}
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
                            {isProcessing ? 'Updating...' : (
                              <>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: '-1px' }} aria-hidden="true">
                                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                  <line x1="12" y1="22.08" x2="12" y2="12" />
                                </svg>
                                Mark Delivered
                              </>
                            )}
                          </button>
                        )}

                        {order.status === 'Delivered' && (
                          <span className="agrily-completed-label">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: '-1px' }} aria-hidden="true">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Fulfilled & Settled
                          </span>
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
