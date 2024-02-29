/**
 * ==============================================================================
 * AGRILY FRONTEND TEST SUITE - CHECKOUT PAGE UNIT TESTS
 * ==============================================================================
 * 
 * Test Suite Description:
 * Verifies form validation, order review line item calculations, escrow payment
 * selection, empty cart redirect states, API dispatch, and navigation transitions.
 * 
 * @module pages/Checkout.test
 * @requires react
 * @requires @testing-library/react
 * @requires ./Checkout
 * @requires ../state/CartContext
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Checkout from './Checkout';
import { CartContext } from '../state/CartContext';

// Mock useNavigate from react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock useUser hook
jest.mock('../auth/useUser', () => ({
  useUser: () => ({
    name: 'Alhaji Danladi Garba',
    email: 'danladi@grainco.ng',
    phone: '+234 803 123 4567'
  })
}));

describe('Checkout Page Unit Tests', () => {
  const mockCartItems = [
    {
      id: 'prod-001',
      name: 'Bags of White Maize',
      price: 18000,
      unit: 'bag',
      quantity: 5,
      ownerEmail: 'kaduna.farmer@agrily.com',
      imageURL: ''
    }
  ];

  const defaultMockCart = {
    cartItems: mockCartItems,
    cartSubtotal: 90000,
    deliveryEstimate: 2500,
    grandTotal: 92500,
    clearCart: jest.fn(),
    isCartOpen: false,
    openCart: jest.fn(),
    closeCart: jest.fn(),
    toggleCart: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders empty cart card when user accesses checkout without items', () => {
    render(
      <BrowserRouter>
        <CartContext.Provider value={{ ...defaultMockCart, cartItems: [] }}>
          <Checkout />
        </CartContext.Provider>
      </BrowserRouter>
    );

    expect(screen.getByText('Your Cart is Empty')).toBeInTheDocument();
    expect(screen.getByText('Explore Farm Marketplace')).toBeInTheDocument();
  });

  test('renders checkout form, order line items, and totals when items exist in cart', () => {
    render(
      <BrowserRouter>
        <CartContext.Provider value={defaultMockCart}>
          <Checkout />
        </CartContext.Provider>
      </BrowserRouter>
    );

    expect(screen.getByText('Agricultural Order Checkout')).toBeInTheDocument();
    expect(screen.getByText('Bags of White Maize')).toBeInTheDocument();
    expect(screen.getByText('Agrily Escrow Protection')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Alhaji Danladi Garba')).toBeInTheDocument();
    expect(screen.getByDisplayValue('danladi@grainco.ng')).toBeInTheDocument();
  });

  test('displays validation errors when mandatory delivery address fields are missing', async () => {
    render(
      <BrowserRouter>
        <CartContext.Provider value={defaultMockCart}>
          <Checkout />
        </CartContext.Provider>
      </BrowserRouter>
    );

    // Clear required street and city
    const submitBtn = screen.getByRole('button', { name: /confirm & place order/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Delivery address / farm depot street address is required')).toBeInTheDocument();
    expect(screen.getByText('Destination city or LGA is required')).toBeInTheDocument();
  });

  test('validates email format and shows error for invalid email', async () => {
    render(
      <BrowserRouter>
        <CartContext.Provider value={defaultMockCart}>
          <Checkout />
        </CartContext.Provider>
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });

    const submitBtn = screen.getByRole('button', { name: /confirm & place order/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/please provide a valid email format/i)).toBeInTheDocument();
  });

  test('submits valid order, clears cart, and navigates to order-confirmation', async () => {
    const mockOrderResponse = {
      success: true,
      message: 'Agricultural procurement order created successfully!',
      order: {
        _id: 'order-123',
        orderNumber: 'AGR-20240229-TEST',
        totalAmount: 92500,
        status: 'Pending'
      },
      orderReference: 'AGR-20240229-TEST',
      estimatedDeliveryDays: '2 - 4 business days'
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockOrderResponse
    });

    render(
      <BrowserRouter>
        <CartContext.Provider value={defaultMockCart}>
          <Checkout />
        </CartContext.Provider>
      </BrowserRouter>
    );

    // Fill in required address details
    fireEvent.change(screen.getByLabelText(/street address/i), {
      target: { value: 'Plot 4, Wholesale Grain Terminal' }
    });
    fireEvent.change(screen.getByLabelText(/city \/ lga/i), {
      target: { value: 'Kano Municipal' }
    });

    const submitBtn = screen.getByRole('button', { name: /confirm & place order/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/orders', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }));
      expect(defaultMockCart.clearCart).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/order-confirmation', {
        state: {
          order: mockOrderResponse.order,
          orderReference: 'AGR-20240229-TEST',
          estimatedDeliveryDays: '2 - 4 business days'
        }
      });
    });
  });

  test('displays error alert banner when backend API order creation fails', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        message: 'Insufficient harvest stock for Bags of White Maize'
      })
    });

    render(
      <BrowserRouter>
        <CartContext.Provider value={defaultMockCart}>
          <Checkout />
        </CartContext.Provider>
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/street address/i), {
      target: { value: 'Plot 4, Wholesale Grain Terminal' }
    });
    fireEvent.change(screen.getByLabelText(/city \/ lga/i), {
      target: { value: 'Kano Municipal' }
    });

    const submitBtn = screen.getByRole('button', { name: /confirm & place order/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/insufficient harvest stock for bags of white maize/i)).toBeInTheDocument();
  });
});
