/**
 * ============================================================================
 * AGRILY AGRICULTURAL COMMERCE & PROVENANCE PLATFORM
 * NotificationBell & NotificationCenter Component
 * ============================================================================
 * 
 * @component NotificationCenter
 * @module frontend/src/components/NotificationCenter
 * @description
 * Real-time agricultural alert and notification center designed for producers,
 * aggregators, and institutional produce buyers. Displays supply chain updates,
 * waybill transit events, escrow settlements, and trust badge approvals.
 * 
 * Supply Chain Notification Classes:
 *  1. 'order': Waybill dispatches, pickup scheduling, batch delivery confirmations.
 *  2. 'escrow': Escrow fund lockings, milestone releases, and payment clearances.
 *  3. 'verification': Field inspection outcomes, CAC KYC reviews, trust score changes.
 *  4. 'inventory': Produce expiration warnings and low-stock threshold triggers.
 * 
 * Architectural Compliance:
 *  - Follows Agrily Design System tokens (Emerald, Earth Ochre, glassmorphic dropdowns).
 *  - Fully accessible ARIA semantics, keyboard esc dismiss, and click-outside listeners.
 * 
 * @license Private / Proprietary Agrily Inc.
 */

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './NotificationCenter.css';

/**
 * Initial mock seed notifications illustrating real-world agricultural commerce events.
 */
export const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif-1',
    category: 'order',
    title: 'Produce Dispatched to Transit',
    message: 'Waybill #WB-2024-918 has been issued for 50 Bags of White Maize. Cold-chain truck departing Samaru Hub.',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    isRead: false,
    severity: 'info'
  },
  {
    id: 'notif-2',
    category: 'escrow',
    title: 'Escrow Funds Released',
    message: 'Buyer confirmed receipt of 200 Yam Tubers. ₦480,000 released from escrow to your primary settlement account.',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    isRead: false,
    severity: 'success'
  },
  {
    id: 'notif-3',
    category: 'verification',
    title: 'Verified Producer Badge Approved',
    message: 'Field agronomy audit concluded successfully. Verified Farmer Trust Badge is now active on your produce catalog.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    isRead: true,
    severity: 'success'
  },
  {
    id: 'notif-4',
    category: 'inventory',
    title: 'Low Stock Alert',
    message: 'Fresh Habanero Peppers inventory is down to 3 crates. Update harvest listing or re-stock.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    isRead: true,
    severity: 'warning'
  }
];

/**
 * Format relative elapsed timestamps into friendly concise strings (e.g., "25m ago", "3h ago").
 * 
 * @param {string|Date} dateInput
 * @returns {string} Relative time string
 */
export function formatRelativeTime(dateInput) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

/**
 * Icon renderer for notification category badges.
 */
function CategoryIcon({ category }) {
  switch (category) {
    case 'order':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13"></rect>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
          <circle cx="5.5" cy="18.5" r="2.5"></circle>
          <circle cx="18.5" cy="18.5" r="2.5"></circle>
        </svg>
      );
    case 'escrow':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
          <path d="M12 6v2m0 8v2"></path>
        </svg>
      );
    case 'verification':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          <polyline points="9 12 11 14 15 10"></polyline>
        </svg>
      );
    case 'inventory':
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
      );
  }
}

/**
 * NotificationCenter Component
 * 
 * Bell icon with unread badge counter and floating interactive notification dropdown.
 * 
 * @param {Object} props
 * @param {Array<Object>} [props.initialNotifications] - Array of notification items
 * @param {Function} [props.onNotificationClick] - Callback invoked when an alert item is clicked
 */
export default function NotificationCenter({
  initialNotifications = DEFAULT_NOTIFICATIONS,
  onNotificationClick
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeTab, setActiveTab] = useState('all');
  const dropdownRef = useRef(null);

  // Sync internal state if props change
  useEffect(() => {
    if (Array.isArray(initialNotifications)) {
      setNotifications(initialNotifications);
    }
  }, [initialNotifications]);

  // Click outside to dismiss menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard Escape listener
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'all') return true;
    return n.category === activeTab;
  });

  const handleMarkAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const handleToggleRead = (id) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  };

  const handleDeleteNotif = (id, e) => {
    e.stopPropagation();
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const handleItemClick = (item) => {
    if (!item.isRead) {
      handleToggleRead(item.id);
    }
    if (typeof onNotificationClick === 'function') {
      onNotificationClick(item);
    }
  };

  return (
    <div className="agrily-notification-wrapper" ref={dropdownRef} data-testid="notification-center">
      {/* BELL TRIGGER BUTTON */}
      <button
        type="button"
        className={`notification-bell-btn ${isOpen ? 'bell-active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Open notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
        data-testid="notification-bell-button"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="bell-icon"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>

        {unreadCount > 0 && (
          <span className="notification-badge-counter" data-testid="notification-unread-count">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* FLOATING NOTIFICATION PANEL */}
      {isOpen && (
        <div
          className="notification-dropdown-panel"
          role="dialog"
          aria-label="Agricultural Alerts & Notifications"
          data-testid="notification-dropdown"
        >
          {/* HEADER */}
          <div className="notification-panel-header">
            <div className="header-left">
              <h4 className="header-title">Notifications</h4>
              {unreadCount > 0 && (
                <span className="unread-pill-indicator">{unreadCount} new</span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                className="btn-mark-all-read"
                onClick={handleMarkAllRead}
                data-testid="btn-mark-all-read"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* FILTER TABS */}
          <div className="notification-filter-tabs">
            {['all', 'order', 'escrow', 'verification'].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`filter-tab-btn ${activeTab === tab ? 'tab-active' : ''}`}
                onClick={() => setActiveTab(tab)}
                data-testid={`tab-${tab}`}
              >
                {tab === 'all'
                  ? 'All Alerts'
                  : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* NOTIFICATION ITEMS LIST */}
          <div className="notification-items-list" data-testid="notification-list">
            {filteredNotifications.length === 0 ? (
              <div className="notification-empty-state" data-testid="notification-empty">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <p className="empty-title">All caught up!</p>
                <p className="empty-desc">No new notifications in this category.</p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notification-item ${!notif.isRead ? 'item-unread' : ''} notif-cat-${notif.category}`}
                  onClick={() => handleItemClick(notif)}
                  data-testid={`notif-item-${notif.id}`}
                  role="button"
                  tabIndex={0}
                >
                  <div className={`notif-icon-bubble bubble-${notif.category}`}>
                    <CategoryIcon category={notif.category} />
                  </div>

                  <div className="notif-content-area">
                    <div className="notif-top-row">
                      <span className="notif-title">{notif.title}</span>
                      <span className="notif-time">{formatRelativeTime(notif.timestamp)}</span>
                    </div>

                    <p className="notif-message">{notif.message}</p>
                  </div>

                  <button
                    type="button"
                    className="notif-dismiss-btn"
                    onClick={(e) => handleDeleteNotif(notif.id, e)}
                    title="Dismiss alert"
                    aria-label={`Dismiss ${notif.title}`}
                    data-testid={`btn-dismiss-${notif.id}`}
                  >
                    &times;
                  </button>
                </div>
              ))
            )}
          </div>

          {/* FOOTER */}
          <div className="notification-panel-footer">
            <span className="footer-status-text">
              Real-time sync with Agrily dispatch network
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

NotificationCenter.propTypes = {
  initialNotifications: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      category: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired,
      timestamp: PropTypes.string.isRequired,
      isRead: PropTypes.bool.isRequired,
      severity: PropTypes.string
    })
  ),
  onNotificationClick: PropTypes.func
};
