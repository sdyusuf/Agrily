/**
 * ==============================================================================
 * AGRILY FRONTEND TEST SUITE - NAVBAR NAVIGATION UNIT TESTS
 * ==============================================================================
 * 
 * Verifies public navigation bar rendering, role-based visibility of Cart and
 * Notification triggers strictly for logged-in users, and dynamic auth CTA transitions.
 * 
 * @module components/NavBar.test
 * @requires react
 * @requires @testing-library/react
 * @requires ./NavBar
 * @requires ../state/CartContext
 * @requires ../auth/useUser
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NavBar from './NavBar';
import { CartContext } from '../state/CartContext';
import * as useUserModule from '../auth/useUser';

const mockCartContextValue = {
  cartItems: [{ _id: 'prod-1', name: 'Cassava Tubers', price: 5000, quantity: 2 }],
  isCartOpen: false,
  toggleCart: jest.fn(),
  totalItems: 2,
  cartSubtotal: 10000
};

describe('NavBar Component Unit Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('hides protected links (Logistics & Fleet, Escrow Vault, Cart, Notifications, Dashboard) when user is unauthenticated (logged out)', () => {
    // Mock user as null (not logged in)
    jest.spyOn(useUserModule, 'useUser').mockReturnValue(null);

    render(
      <BrowserRouter>
        <CartContext.Provider value={mockCartContextValue}>
          <NavBar />
        </CartContext.Provider>
      </BrowserRouter>
    );

    // Verify public links exist
    expect(screen.getByText(/Home/i)).toBeInTheDocument();
    expect(screen.getByText(/Marketplace/i)).toBeInTheDocument();
    expect(screen.getByText(/Explore/i)).toBeInTheDocument();
    expect(screen.getByTestId('guest-track-link')).toBeInTheDocument();
    expect(screen.getByTestId('guest-driver-register')).toBeInTheDocument();

    // Verify protected links requiring login are strictly HIDDEN
    expect(screen.queryByText(/Escrow Vault/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Logistics & Fleet/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('nav-routes-link')).not.toBeInTheDocument();
    expect(screen.queryByTestId('nav-waybills-link')).not.toBeInTheDocument();
    expect(screen.queryByTestId('nav-coldchain-link')).not.toBeInTheDocument();

    // Verify Cart trigger is NOT rendered for logged-out visitors
    expect(screen.queryByRole('button', { name: /open shopping cart/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Cart')).not.toBeInTheDocument();

    // Verify Notification bell is NOT rendered for logged-out visitors
    expect(screen.queryByTestId('notification-bell-button')).not.toBeInTheDocument();

    // Verify guest CTAs are visible
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /get started/i })).toBeInTheDocument();

    // Verify Dashboard link is not shown to guests
    expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument();
  });

  test('renders protected links (Logistics & Fleet, Escrow Vault, Cart, Notifications, Dashboard) when user is authenticated (logged in)', () => {
    // Mock user as logged-in farmer
    jest.spyOn(useUserModule, 'useUser').mockReturnValue({
      email: 'farmer.kaduna@agrily.com',
      firstName: 'Ibrahim',
      lastName: 'Kaduna',
      role: 'FARMER',
      isVerified: true
    });

    render(
      <BrowserRouter>
        <CartContext.Provider value={mockCartContextValue}>
          <NavBar />
        </CartContext.Provider>
      </BrowserRouter>
    );

    // Verify public and protected links are rendered
    expect(screen.getByText(/Home/i)).toBeInTheDocument();
    expect(screen.getByText(/Marketplace/i)).toBeInTheDocument();
    expect(screen.getByText(/Logistics & Fleet/i)).toBeInTheDocument();
    expect(screen.getByTestId('nav-routes-link')).toBeInTheDocument();
    expect(screen.getByTestId('nav-waybills-link')).toBeInTheDocument();
    expect(screen.getByTestId('nav-tracking-link')).toBeInTheDocument();
    expect(screen.getByTestId('nav-coldchain-link')).toBeInTheDocument();
    expect(screen.getByTestId('nav-escrow-link')).toBeInTheDocument();

    // Verify Cart trigger IS rendered with item count
    const cartButton = screen.getByRole('button', { name: /open shopping cart \(2 items\)/i });
    expect(cartButton).toBeInTheDocument();
    expect(within(cartButton).getByText('Cart')).toBeInTheDocument();
    expect(within(cartButton).getByText('2')).toBeInTheDocument();

    // Verify Notification bell trigger IS rendered
    expect(screen.getByTestId('notification-bell-button')).toBeInTheDocument();

    // Verify Dashboard navigation CTA is displayed for farmer (points to /home)
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink).toHaveAttribute('href', '/home');

    // Verify guest sign-in link is hidden for authenticated sessions
    expect(screen.queryByRole('link', { name: /sign in/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /get started/i })).not.toBeInTheDocument();
  });

  test('renders driver-specific cockpit routing when user has driver role', () => {
    // Mock user as driver
    jest.spyOn(useUserModule, 'useUser').mockReturnValue({
      email: 'driver.kofi@agrily.com',
      firstName: 'Kofi',
      lastName: 'Boateng',
      role: 'PRIMARY_DRIVER',
      isVerified: true
    });

    render(
      <BrowserRouter>
        <CartContext.Provider value={mockCartContextValue}>
          <NavBar />
        </CartContext.Provider>
      </BrowserRouter>
    );

    // Verify Driver Cockpit item is in dropdown
    expect(screen.getByText(/Driver Cockpit/i)).toBeInTheDocument();

    // Verify Dashboard CTA directs to driver dashboard
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink).toHaveAttribute('href', '/driver/dashboard');
  });
});
