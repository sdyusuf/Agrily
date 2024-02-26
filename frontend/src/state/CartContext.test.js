/**
 * ==============================================================================
 * AGRILY FRONTEND TEST SUITE - CART CONTEXT & STATE MANAGER UNIT TESTS
 * ==============================================================================
 * 
 * Test Suite Description:
 * Verifies global cart state mutation, minimum order quantity rules, bulk total
 * computations, freight delivery estimation, and drawer toggle actions.
 * 
 * @module state/CartContext.test
 * @requires react
 * @requires @testing-library/react
 * @requires ./CartContext
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { CartProvider, useCart, AGRILY_CART_STORAGE_KEY } from './CartContext';

// Helper component to exercise CartContext actions within React tree
const TestCartConsumer = () => {
  const {
    cartItems,
    isCartOpen,
    openCart,
    closeCart,
    toggleCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    deliveryEstimate,
    grandTotal,
    totalItems
  } = useCart();

  return (
    <div>
      <div data-testid="cart-open-state">{isCartOpen ? 'open' : 'closed'}</div>
      <div data-testid="total-items">{totalItems}</div>
      <div data-testid="cart-subtotal">{cartSubtotal}</div>
      <div data-testid="delivery-estimate">{deliveryEstimate}</div>
      <div data-testid="grand-total">{grandTotal}</div>
      <div data-testid="items-count">{cartItems.length}</div>

      <button onClick={openCart} data-testid="btn-open">Open</button>
      <button onClick={closeCart} data-testid="btn-close">Close</button>
      <button onClick={toggleCart} data-testid="btn-toggle">Toggle</button>
      <button onClick={clearCart} data-testid="btn-clear">Clear</button>

      <button
        onClick={() => addToCart({
          id: 'prod-1',
          name: 'Sweet Potatoes',
          price: 5000,
          unit: 'crate',
          quantity: 20,
          minOrderQuantity: 2,
          ownerEmail: 'farmer@agrily.com'
        }, 3)}
        data-testid="btn-add-potatoes"
      >
        Add Potatoes
      </button>

      <button
        onClick={() => addToCart({
          id: 'prod-2',
          name: 'Yellow Maize',
          price: 20000,
          unit: 'bag',
          quantity: 50,
          minOrderQuantity: 5,
          ownerEmail: 'grain@agrily.com'
        }, 1)} // Note: adding 1 but MOQ is 5, should enforce 5
        data-testid="btn-add-maize-moq"
      >
        Add Maize MOQ
      </button>

      <button
        onClick={() => updateQuantity('prod-1', 10)}
        data-testid="btn-update-potatoes"
      >
        Update Potatoes
      </button>

      <button
        onClick={() => updateQuantity('prod-1', 0)}
        data-testid="btn-zero-potatoes"
      >
        Zero Potatoes
      </button>

      <button
        onClick={() => removeFromCart('prod-2')}
        data-testid="btn-remove-maize"
      >
        Remove Maize
      </button>
    </div>
  );
};

describe('CartContext Unit Tests', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  test('initializes with empty cart and closed drawer', () => {
    render(
      <CartProvider>
        <TestCartConsumer />
      </CartProvider>
    );

    expect(screen.getByTestId('cart-open-state').textContent).toBe('closed');
    expect(screen.getByTestId('total-items').textContent).toBe('0');
    expect(screen.getByTestId('cart-subtotal').textContent).toBe('0');
    expect(screen.getByTestId('items-count').textContent).toBe('0');
  });

  test('toggles drawer open and closed state', () => {
    render(
      <CartProvider>
        <TestCartConsumer />
      </CartProvider>
    );

    // Open drawer
    act(() => {
      screen.getByTestId('btn-open').click();
    });
    expect(screen.getByTestId('cart-open-state').textContent).toBe('open');

    // Close drawer
    act(() => {
      screen.getByTestId('btn-close').click();
    });
    expect(screen.getByTestId('cart-open-state').textContent).toBe('closed');

    // Toggle drawer
    act(() => {
      screen.getByTestId('btn-toggle').click();
    });
    expect(screen.getByTestId('cart-open-state').textContent).toBe('open');
  });

  test('adds produce item and calculates subtotals with freight estimate', () => {
    render(
      <CartProvider>
        <TestCartConsumer />
      </CartProvider>
    );

    // Add potatoes (3 crates * 5,000 = 15,000)
    act(() => {
      screen.getByTestId('btn-add-potatoes').click();
    });

    expect(screen.getByTestId('cart-open-state').textContent).toBe('open');
    expect(screen.getByTestId('total-items').textContent).toBe('3');
    expect(screen.getByTestId('cart-subtotal').textContent).toBe('15000');
    expect(screen.getByTestId('delivery-estimate').textContent).toBe('2500'); // Standard freight
    expect(screen.getByTestId('grandTotal' in screen ? 'grand-total' : 'grand-total').textContent).toBe('17500');
  });

  test('enforces minimum order quantity when adding item to cart', () => {
    render(
      <CartProvider>
        <TestCartConsumer />
      </CartProvider>
    );

    // Add maize requesting 1 unit, but MOQ is 5
    act(() => {
      screen.getByTestId('btn-add-maize-moq').click();
    });

    // Quantity should be clamped up to MOQ (5 bags * 20,000 = 100,000)
    expect(screen.getByTestId('total-items').textContent).toBe('5');
    expect(screen.getByTestId('cart-subtotal').textContent).toBe('100000');
  });

  test('updates quantity and removes item when quantity reaches zero', () => {
    render(
      <CartProvider>
        <TestCartConsumer />
      </CartProvider>
    );

    // Add potatoes (3 crates * 5,000 = 15,000)
    act(() => {
      screen.getByTestId('btn-add-potatoes').click();
    });

    // Update quantity to 10 crates (10 * 5,000 = 50,000)
    act(() => {
      screen.getByTestId('btn-update-potatoes').click();
    });

    expect(screen.getByTestId('total-items').textContent).toBe('10');
    expect(screen.getByTestId('cart-subtotal').textContent).toBe('50000');

    // Setting quantity to 0 removes item
    act(() => {
      screen.getByTestId('btn-zero-potatoes').click();
    });

    expect(screen.getByTestId('total-items').textContent).toBe('0');
    expect(screen.getByTestId('items-count').textContent).toBe('0');
  });

  test('removes item explicitly and clears cart', () => {
    render(
      <CartProvider>
        <TestCartConsumer />
      </CartProvider>
    );

    act(() => {
      screen.getByTestId('btn-add-potatoes').click();
      screen.getByTestId('btn-add-maize-moq').click();
    });

    expect(screen.getByTestId('items-count').textContent).toBe('2');

    // Remove maize
    act(() => {
      screen.getByTestId('btn-remove-maize').click();
    });
    expect(screen.getByTestId('items-count').textContent).toBe('1');

    // Clear cart
    act(() => {
      screen.getByTestId('btn-clear').click();
    });
    expect(screen.getByTestId('items-count').textContent).toBe('0');
    expect(screen.getByTestId('total-items').textContent).toBe('0');
  });

  test('throws descriptive error when useCart is invoked outside CartProvider', () => {
    // Suppress console.error in Jest output during expected boundary throw
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(<TestCartConsumer />);
    }).toThrow('useCart must be used within a <CartProvider>');

    console.error = originalError;
  });
});
