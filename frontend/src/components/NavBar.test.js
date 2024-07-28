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

  test('hides Cart and Notification triggers when user is unauthenticated (logged out)', () => {
    // Mock user as null (not logged in)
    jest.spyOn(useUserModule, 'useUser').mockReturnValue(null);

    render(
      <BrowserRouter>
        <CartContext.Provider value={mockCartContextValue}>
          <NavBar />
        </CartContext.Provider>
      </BrowserRouter>
    );

    // Verify brand logo and public links exist
    expect(screen.getByText(/Home/i)).toBeInTheDocument();
    expect(screen.getByText(/Marketplace/i)).toBeInTheDocument();
    expect(screen.getByText(/Fleet Drivers/i)).toBeInTheDocument();
    expect(screen.getByText(/Live Radar/i)).toBeInTheDocument();
    expect(screen.getByText(/Cold-Chain/i)).toBeInTheDocument();
    expect(screen.getByText(/Escrow Vault/i)).toBeInTheDocument();
    expect(screen.getByText(/Route Dispatch/i)).toBeInTheDocument();
    expect(screen.getByText(/Waybills/i)).toBeInTheDocument();

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

  test('renders Cart and Notification triggers when user is authenticated (logged in)', () => {
    // Mock user as logged-in farmer
    jest.spyOn(useUserModule, 'useUser').mockReturnValue({
      email: 'farmer.kaduna@agrily.com',
      firstName: 'Ibrahim',
      lastName: 'Kaduna',
      isVerified: true
    });

    render(
      <BrowserRouter>
        <CartContext.Provider value={mockCartContextValue}>
          <NavBar />
        </CartContext.Provider>
      </BrowserRouter>
    );

    // Verify Cart trigger IS rendered with item count
    const cartButton = screen.getByRole('button', { name: /open shopping cart \(2 items\)/i });
    expect(cartButton).toBeInTheDocument();
    expect(within(cartButton).getByText('Cart')).toBeInTheDocument();
    expect(within(cartButton).getByText('2')).toBeInTheDocument();

    // Verify Notification bell trigger IS rendered
    expect(screen.getByTestId('notification-bell-button')).toBeInTheDocument();

    // Verify Dashboard navigation CTA is displayed
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();

    // Verify guest sign-in link is hidden for authenticated sessions
    expect(screen.queryByRole('link', { name: /sign in/i })).not.toBeInTheDocument();
  });
});
