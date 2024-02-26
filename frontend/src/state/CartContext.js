/**
 * ==============================================================================
 * AGRILY AGRICULTURAL COMMERCE PLATFORM - GLOBAL CART CONTEXT & PROVIDER
 * ==============================================================================
 * 
 * Module Description:
 * This React Context module provides centralized client-side state management for
 * agricultural produce cart operations, bulk order calculations, quantity adjustments,
 * persistent local storage synchronization, and the slide-out floating CartDrawer UI.
 * 
 * Agricultural Commerce Considerations:
 * Unlike standard retail commodities, farm produce purchasing involves unique
 * logistical and physical constraints:
 *  1. Unit Integrity: Quantities correspond to specific packaging units (bags, crates,
 *     tons, kilograms) rather than generic units.
 *  2. Minimum Order Quantities (MOQ): Producers enforce MOQs to make freight dispatch
 *     economically viable (e.g., minimum 5 crates of fresh tomatoes).
 *  3. Bulk Weight & Freight Estimation: Heavy produce (e.g., 50kg grain bags, metric tons)
 *     requires dynamic freight estimation as volume increases.
 *  4. Producer Separation: Carts can hold produce from multiple distinct farming cooperatives,
 *     requiring multi-vendor attribution per line item.
 * 
 * @module state/CartContext
 * @requires react
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

/**
 * Storage key utilized for persistent local browser cache.
 * @constant {string}
 */
export const AGRILY_CART_STORAGE_KEY = 'agrily_cart_items_v1';

/**
 * React Context instance for Cart state.
 */
export const CartContext = createContext(null);

/**
 * CartProvider Component
 * 
 * Wraps the application or marketplace view hierarchy to provide global access
 * to produce shopping cart state, drawer toggles, and mutator actions.
 * 
 * @component
 * @param {Object} props - React props
 * @param {React.ReactNode} props.children - Child components receiving context
 * @returns {JSX.Element} Provider wrapping child elements
 */
export const CartProvider = ({ children }) => {
  // --------------------------------------------------------------------------
  // STATE DEFINITIONS
  // --------------------------------------------------------------------------

  /**
   * Cart items array initialized with safe LocalStorage hydration.
   * Each item contains: { id, name, price, unit, quantity, ownerEmail, imageURL, minOrderQuantity }
   */
  const [cartItems, setCartItems] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem(AGRILY_CART_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return Array.isArray(parsed) ? parsed : [];
        }
      }
    } catch (err) {
      console.warn('Unable to hydrate cart from localStorage:', err);
    }
    return [];
  });

  /**
   * Floating slide-out Cart Drawer visibility state.
   */
  const [isCartOpen, setIsCartOpen] = useState(false);

  // --------------------------------------------------------------------------
  // PERSISTENCE EFFECT
  // --------------------------------------------------------------------------

  /**
   * Automatically synchronizes cart state changes to browser LocalStorage.
   */
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(AGRILY_CART_STORAGE_KEY, JSON.stringify(cartItems));
      }
    } catch (err) {
      console.warn('Unable to persist cart to localStorage:', err);
    }
  }, [cartItems]);

  // --------------------------------------------------------------------------
  // DRAWER CONTROL ACTIONS
  // --------------------------------------------------------------------------

  /**
   * Opens the slide-out cart drawer.
   */
  const openCart = useCallback(() => {
    setIsCartOpen(true);
  }, []);

  /**
   * Closes the slide-out cart drawer.
   */
  const closeCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  /**
   * Toggles the open/closed visibility state of the cart drawer.
   */
  const toggleCart = useCallback(() => {
    setIsCartOpen(prev => !prev);
  }, []);

  // --------------------------------------------------------------------------
  // CART MUTATION ACTIONS
  // --------------------------------------------------------------------------

  /**
   * Adds an agricultural produce item to the cart or increments its quantity.
   * Respects minimum order quantities and maximum stock availability when defined.
   * 
   * @param {Object} product - Produce product document
   * @param {number} [quantity=1] - Quantity to add
   */
  const addToCart = useCallback((product, quantity = 1) => {
    if (!product) return;

    const productId = product._id || product.id;
    if (!productId) return;

    const qtyToAdd = Math.max(1, Number(quantity) || 1);
    const moq = Number(product.minOrderQuantity) || 1;
    const effectiveQty = qtyToAdd < moq ? moq : qtyToAdd;

    setCartItems(prevItems => {
      const existingIndex = prevItems.findIndex(item => item.id === productId);

      if (existingIndex > -1) {
        // Item already in cart: increment quantity
        const updated = [...prevItems];
        const existing = updated[existingIndex];
        const maxStock = Number(product.quantity) || Infinity;
        const newQty = Math.min(existing.quantity + effectiveQty, maxStock);

        updated[existingIndex] = {
          ...existing,
          quantity: newQty
        };
        return updated;
      } else {
        // New item: append to cart
        const newItem = {
          id: productId,
          name: product.name || 'Unnamed Produce',
          price: Number(product.price) || 0,
          unit: product.unit || 'kg',
          quantity: effectiveQty,
          ownerEmail: product.ownerEmail || '',
          imageURL: product.imageURL || '',
          category: product.category || 'other',
          minOrderQuantity: moq,
          maxAvailable: Number(product.quantity) || Infinity
        };
        return [...prevItems, newItem];
      }
    });

    // Automatically reveal drawer upon adding to give tactile feedback
    setIsCartOpen(true);
  }, []);

  /**
   * Updates the purchased quantity for a specific produce line item.
   * If quantity is set to 0 or below, removes the item from the cart.
   * 
   * @param {string} productId - ID of produce item to update
   * @param {number} newQuantity - Desired quantity count
   */
  const updateQuantity = useCallback((productId, newQuantity) => {
    const qty = Number(newQuantity);

    if (isNaN(qty) || qty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === productId) {
          const clampedQty = item.maxAvailable ? Math.min(qty, item.maxAvailable) : qty;
          return {
            ...item,
            quantity: clampedQty
          };
        }
        return item;
      });
    });
  }, []);

  /**
   * Removes a produce item completely from the cart.
   * 
   * @param {string} productId - ID of product to delete
   */
  const removeFromCart = useCallback((productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  }, []);

  /**
   * Empties all items from the active cart.
   */
  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // --------------------------------------------------------------------------
  // COMPUTED AGGREGATES & TOTALS
  // --------------------------------------------------------------------------

  /**
   * Subtotal cost of all produce items in cart.
   */
  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const q = Number(item.quantity) || 0;
      const p = Number(item.price) || 0;
      return acc + (q * p);
    }, 0);
  }, [cartItems]);

  /**
   * Cumulative count of all physical produce units.
   */
  const totalItems = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
  }, [cartItems]);

  /**
   * Total number of distinct produce line items.
   */
  const uniqueItemCount = useMemo(() => {
    return cartItems.length;
  }, [cartItems]);

  /**
   * Estimated freight delivery surcharge based on bulk produce volume.
   * Flat standard dispatch fee of 2,500 NGN, waived for orders over 150,000 NGN.
   */
  const deliveryEstimate = useMemo(() => {
    if (cartItems.length === 0) return 0;
    if (cartSubtotal >= 150000) return 0; // Free freight threshold
    return 2500;
  }, [cartItems.length, cartSubtotal]);

  /**
   * Final gross grand total combining produce subtotal and freight estimate.
   */
  const grandTotal = useMemo(() => {
    return cartSubtotal + deliveryEstimate;
  }, [cartSubtotal, deliveryEstimate]);

  // --------------------------------------------------------------------------
  // CONTEXT VALUE
  // --------------------------------------------------------------------------
  const value = {
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
    totalItems,
    uniqueItemCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

/**
 * Custom Hook: useCart
 * 
 * Safely consumes CartContext within React components.
 * Throws a clear developer error if called outside a <CartProvider>.
 * 
 * @function useCart
 * @returns {Object} Cart state and methods
 */
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a <CartProvider>');
  }
  return context;
};

export default CartContext;
