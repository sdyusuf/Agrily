/**
 * ==============================================================================
 * AGRILY FRONTEND TEST SUITE - CART DRAWER COMPONENT UNIT TESTS
 * ==============================================================================
 * 
 * Test Suite Description:
 * Verifies interactive behavior, empty states, produce item card rendering,
 * quantity adjustments, navigation to checkout, and accessibility controls of CartDrawer.
 * 
 * @module components/CartDrawer.test
 * @requires react
 * @requires @testing-library/react
 * @requires ./CartDrawer
 * @requires ../state/CartContext
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CartDrawer from './CartDrawer';
import { CartContext } from '../state/CartContext';

// Mock useNavigate from react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('CartDrawer Unit Tests', () => {
  const defaultMockCartValue = {
    cartItems: [],
    isCartOpen: false,
    closeCart: jest.fn(),
    openCart: jest.fn(),
    toggleCart: jest.fn(),
    addToCart: jest.fn(),
    updateQuantity: jest.fn(),
    removeFromCart: jest.fn(),
    clearCart: jest.fn(),
    cartSubtotal: 0,
    deliveryEstimate: 0,
    grandTotal: 0,
    totalItems: 0,
    uniqueItemCount: 0
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('does not render when isCartOpen is false', () => {
    render(
      <BrowserRouter>
        <CartContext.Provider value={{ ...defaultMockCartValue, isCartOpen: false }}>
          <CartDrawer />
        </CartContext.Provider>
      </BrowserRouter>
    );

    expect(screen.queryByTestId('cart-drawer')).not.toBeInTheDocument();
  });

  test('renders empty cart state when open with zero items', () => {
    render(
      <BrowserRouter>
        <CartContext.Provider value={{ ...defaultMockCartValue, isCartOpen: true, cartItems: [] }}>
          <CartDrawer />
        </CartContext.Provider>
      </BrowserRouter>
    );

    expect(screen.getByTestId('cart-drawer')).toBeInTheDocument();
    expect(screen.getByText('Your produce cart is empty')).toBeInTheDocument();
    expect(screen.getByText('Browse Farm Marketplace')).toBeInTheDocument();
  });

  test('renders populated cart with line items, prices, and totals', () => {
    const mockItems = [
      {
        id: 'item-1',
        name: 'Fresh Tomatoes',
        price: 8000,
        unit: 'crate',
        quantity: 2,
        ownerEmail: 'farmer.kaduna@agrily.com',
        imageURL: '',
        minOrderQuantity: 1,
        maxAvailable: 50
      }
    ];

    render(
      <BrowserRouter>
        <CartContext.Provider
          value={{
            ...defaultMockCartValue,
            isCartOpen: true,
            cartItems: mockItems,
            totalItems: 2,
            cartSubtotal: 16000,
            deliveryEstimate: 2500,
            grandTotal: 18500
          }}
        >
          <CartDrawer />
        </CartContext.Provider>
      </BrowserRouter>
    );

    expect(screen.getByText('Fresh Tomatoes')).toBeInTheDocument();
    expect(screen.getByText('Farmer: farmer.kaduna@agrily.com')).toBeInTheDocument();
    expect(screen.getByText('Proceed to Checkout')).toBeInTheDocument();
  });

  test('calls updateQuantity when quantity stepper buttons are clicked', () => {
    const mockUpdateQuantity = jest.fn();
    const mockItems = [
      {
        id: 'item-1',
        name: 'Fresh Tomatoes',
        price: 8000,
        unit: 'crate',
        quantity: 3,
        ownerEmail: 'farmer@agrily.com',
        minOrderQuantity: 1,
        maxAvailable: 50
      }
    ];

    render(
      <BrowserRouter>
        <CartContext.Provider
          value={{
            ...defaultMockCartValue,
            isCartOpen: true,
            cartItems: mockItems,
            updateQuantity: mockUpdateQuantity
          }}
        >
          <CartDrawer />
        </CartContext.Provider>
      </BrowserRouter>
    );

    // Click decrease button
    const decreaseBtn = screen.getByLabelText('Decrease quantity for Fresh Tomatoes');
    fireEvent.click(decreaseBtn);
    expect(mockUpdateQuantity).toHaveBeenCalledWith('item-1', 2);

    // Click increase button
    const increaseBtn = screen.getByLabelText('Increase quantity for Fresh Tomatoes');
    fireEvent.click(increaseBtn);
    expect(mockUpdateQuantity).toHaveBeenCalledWith('item-1', 4);
  });

  test('calls removeFromCart when delete icon button is clicked', () => {
    const mockRemoveFromCart = jest.fn();
    const mockItems = [
      {
        id: 'item-1',
        name: 'Fresh Tomatoes',
        price: 8000,
        unit: 'crate',
        quantity: 2,
        ownerEmail: 'farmer@agrily.com'
      }
    ];

    render(
      <BrowserRouter>
        <CartContext.Provider
          value={{
            ...defaultMockCartValue,
            isCartOpen: true,
            cartItems: mockItems,
            removeFromCart: mockRemoveFromCart
          }}
        >
          <CartDrawer />
        </CartContext.Provider>
      </BrowserRouter>
    );

    const deleteBtn = screen.getByRole('button', { name: /remove fresh tomatoes from cart/i });
    fireEvent.click(deleteBtn);

    expect(mockRemoveFromCart).toHaveBeenCalledWith('item-1');
  });

  test('navigates to /checkout and closes cart when checkout button is clicked', () => {
    const mockCloseCart = jest.fn();
    const mockItems = [
      {
        id: 'item-1',
        name: 'Fresh Tomatoes',
        price: 8000,
        unit: 'crate',
        quantity: 1,
        ownerEmail: 'farmer@agrily.com'
      }
    ];

    render(
      <BrowserRouter>
        <CartContext.Provider
          value={{
            ...defaultMockCartValue,
            isCartOpen: true,
            cartItems: mockItems,
            closeCart: mockCloseCart,
            grandTotal: 10500
          }}
        >
          <CartDrawer />
        </CartContext.Provider>
      </BrowserRouter>
    );

    const checkoutBtn = screen.getByRole('button', { name: /proceed to checkout/i });
    fireEvent.click(checkoutBtn);

    expect(mockCloseCart).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/checkout');
  });

  test('calls closeCart when clicking close header button or overlay backdrop', () => {
    const mockCloseCart = jest.fn();

    render(
      <BrowserRouter>
        <CartContext.Provider
          value={{
            ...defaultMockCartValue,
            isCartOpen: true,
            closeCart: mockCloseCart
          }}
        >
          <CartDrawer />
        </CartContext.Provider>
      </BrowserRouter>
    );

    // Click close button
    const closeBtn = screen.getByRole('button', { name: /close shopping cart/i });
    fireEvent.click(closeBtn);
    expect(mockCloseCart).toHaveBeenCalledTimes(1);

    // Click overlay backdrop
    const overlay = screen.getByTestId('cart-overlay');
    fireEvent.click(overlay);
    expect(mockCloseCart).toHaveBeenCalledTimes(2);
  });
});
