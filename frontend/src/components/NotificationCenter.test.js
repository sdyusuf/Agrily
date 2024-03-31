/**
 * ============================================================================
 * AGRILY AGRICULTURAL COMMERCE & PROVENANCE PLATFORM
 * NotificationCenter Component Unit Test Suite
 * ============================================================================
 * 
 * @module frontend/src/components/NotificationCenter.test
 * @description
 * Unit tests validating render states, unread badge counters, dropdown toggling,
 * keyboard accessibility, category tab filters, mark-all-read mutations, dismiss actions,
 * and relative time formatting.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotificationCenter, { formatRelativeTime } from './NotificationCenter';

const mockNotifications = [
  {
    id: 'n-1',
    category: 'order',
    title: 'Order Waybill Issued',
    message: 'Produce in transit on Truck #TR-88.',
    timestamp: new Date().toISOString(),
    isRead: false,
    severity: 'info'
  },
  {
    id: 'n-2',
    category: 'escrow',
    title: 'Settlement Cleared',
    message: '₦250,000 released from escrow.',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    isRead: false,
    severity: 'success'
  },
  {
    id: 'n-3',
    category: 'verification',
    title: 'Audited Profile',
    message: 'GAP certificate verified.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    isRead: true,
    severity: 'success'
  }
];

describe('NotificationCenter Component Unit Tests', () => {
  it('renders bell trigger button with unread badge counter', () => {
    render(<NotificationCenter initialNotifications={mockNotifications} />);

    const bellBtn = screen.getByTestId('notification-bell-button');
    expect(bellBtn).toBeInTheDocument();
    expect(bellBtn).toHaveAttribute('aria-expanded', 'false');

    const badge = screen.getByTestId('notification-unread-count');
    expect(badge).toHaveTextContent('2'); // 2 unread out of 3
  });

  it('opens and closes dropdown panel when bell button is clicked', () => {
    render(<NotificationCenter initialNotifications={mockNotifications} />);

    const bellBtn = screen.getByTestId('notification-bell-button');
    expect(screen.queryByTestId('notification-dropdown')).not.toBeInTheDocument();

    // Open dropdown
    fireEvent.click(bellBtn);
    expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
    expect(bellBtn).toHaveAttribute('aria-expanded', 'true');

    // Close dropdown
    fireEvent.click(bellBtn);
    expect(screen.queryByTestId('notification-dropdown')).not.toBeInTheDocument();
  });

  it('closes dropdown panel when Escape key is pressed', () => {
    render(<NotificationCenter initialNotifications={mockNotifications} />);

    const bellBtn = screen.getByTestId('notification-bell-button');
    fireEvent.click(bellBtn);
    expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByTestId('notification-dropdown')).not.toBeInTheDocument();
  });

  it('filters notifications when clicking category tabs', () => {
    render(<NotificationCenter initialNotifications={mockNotifications} />);

    const bellBtn = screen.getByTestId('notification-bell-button');
    fireEvent.click(bellBtn);

    // Initial all alerts: 3 items
    expect(screen.getByText('Order Waybill Issued')).toBeInTheDocument();
    expect(screen.getByText('Settlement Cleared')).toBeInTheDocument();
    expect(screen.getByText('Audited Profile')).toBeInTheDocument();

    // Switch to escrow tab
    const escrowTab = screen.getByTestId('tab-escrow');
    fireEvent.click(escrowTab);

    expect(screen.getByText('Settlement Cleared')).toBeInTheDocument();
    expect(screen.queryByText('Order Waybill Issued')).not.toBeInTheDocument();
    expect(screen.queryByText('Audited Profile')).not.toBeInTheDocument();
  });

  it('marks all notifications as read when clicking "Mark all read"', () => {
    render(<NotificationCenter initialNotifications={mockNotifications} />);

    const bellBtn = screen.getByTestId('notification-bell-button');
    fireEvent.click(bellBtn);

    const markAllBtn = screen.getByTestId('btn-mark-all-read');
    fireEvent.click(markAllBtn);

    // Unread pill in header and badge on bell should disappear
    expect(screen.queryByTestId('btn-mark-all-read')).not.toBeInTheDocument();
    expect(screen.queryByTestId('notification-unread-count')).not.toBeInTheDocument();
  });

  it('dismisses a notification item when clicking the dismiss button', () => {
    render(<NotificationCenter initialNotifications={mockNotifications} />);

    const bellBtn = screen.getByTestId('notification-bell-button');
    fireEvent.click(bellBtn);

    const dismissBtn = screen.getByTestId('btn-dismiss-n-1');
    fireEvent.click(dismissBtn);

    expect(screen.queryByTestId('notif-item-n-1')).not.toBeInTheDocument();
  });

  it('displays empty state view when a category has zero alerts', () => {
    render(
      <NotificationCenter
        initialNotifications={[
          {
            id: 'n-only-escrow',
            category: 'escrow',
            title: 'Escrow Alert',
            message: 'Funds held',
            timestamp: new Date().toISOString(),
            isRead: false
          }
        ]}
      />
    );

    const bellBtn = screen.getByTestId('notification-bell-button');
    fireEvent.click(bellBtn);

    // Click order tab where there are 0 alerts
    const orderTab = screen.getByTestId('tab-order');
    fireEvent.click(orderTab);

    expect(screen.getByTestId('notification-empty')).toBeInTheDocument();
    expect(screen.getByText('All caught up!')).toBeInTheDocument();
  });

  describe('formatRelativeTime Utility Helper', () => {
    it('accurately converts timestamps into relative human-readable intervals', () => {
      const now = new Date();
      expect(formatRelativeTime(now.toISOString())).toBe('Just now');

      const tenMinutesAgo = new Date(Date.now() - 1000 * 60 * 10);
      expect(formatRelativeTime(tenMinutesAgo.toISOString())).toBe('10m ago');

      const twoHoursAgo = new Date(Date.now() - 1000 * 60 * 60 * 2);
      expect(formatRelativeTime(twoHoursAgo.toISOString())).toBe('2h ago');

      const threeDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 3);
      expect(formatRelativeTime(threeDaysAgo.toISOString())).toBe('3d ago');

      expect(formatRelativeTime(null)).toBe('');
    });
  });
});
