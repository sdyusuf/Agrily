/**
 * ==============================================================================
 * AGRILY FRONTEND TEST SUITE - TOPBAR NAVIGATION UNIT TESTS
 * ==============================================================================
 * 
 * Verifies TopBar dashboard navigation, role-based visibility of Cart and
 * Notification triggers strictly for logged-in users, and user profile pill controls.
 * 
 * @module components/TopBar.test
 * @requires react
 * @requires @testing-library/react
 * @requires ./TopBar
 * @requires ../state/CartContext
 * @requires ../auth/useUser
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TopBar from './TopBar';
import { CartContext } from '../state/CartContext';
import * as useUserModule from '../auth/useUser';

const mockCartContextValue = {
  cartItems: [{ _id: 'prod-2', name: 'Millet Grain', price: 15000, quantity: 3 }],
  isCartOpen: false,
  toggleCart: jest.fn(),
  totalItems: 3,
  cartSubtotal: 45000
};

describe('TopBar Component Unit Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders Cart, Notification, avatar pill, and handles logout when user is authenticated', () => {
    jest.spyOn(useUserModule, 'useUser').mockReturnValue({
      email: 'aisha.farmer@agrily.com',
      firstName: 'Aisha',
      lastName: 'Bello',
      isVerified: true
    });

    const mockLogout = jest.fn();

    render(
      <BrowserRouter>
        <CartContext.Provider value={mockCartContextValue}>
          <TopBar logout={mockLogout} />
        </CartContext.Provider>
      </BrowserRouter>
    );

    // Verify Dashboard, Marketplace, List Produce links
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Marketplace')).toBeInTheDocument();
    expect(screen.getByText('+ List Produce')).toBeInTheDocument();

    // Verify Cart trigger is rendered with count
    const cartButton = screen.getByRole('button', { name: /open shopping cart \(3 items\)/i });
    expect(cartButton).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    // Verify Notification bell is rendered
    expect(screen.getByTestId('notification-bell-button')).toBeInTheDocument();

    // Verify user profile pill & initials
    expect(screen.getByText('AB')).toBeInTheDocument();
    expect(screen.getByText('Aisha Bello')).toBeInTheDocument();
    expect(screen.getByText('Verified Producer')).toBeInTheDocument();

    // Click logout
    const logoutBtn = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutBtn);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  test('hides Cart and Notification triggers when user session is null', () => {
    jest.spyOn(useUserModule, 'useUser').mockReturnValue(null);

    render(
      <BrowserRouter>
        <CartContext.Provider value={mockCartContextValue}>
          <TopBar />
        </CartContext.Provider>
      </BrowserRouter>
    );

    // Verify Cart trigger is NOT rendered
    expect(screen.queryByRole('button', { name: /open shopping cart/i })).not.toBeInTheDocument();

    // Verify Notification bell is NOT rendered
    expect(screen.queryByTestId('notification-bell-button')).not.toBeInTheDocument();

    // Verify guest fallback links
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /get started/i })).toBeInTheDocument();
  });
});
