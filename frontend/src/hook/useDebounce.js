/**
 * ==============================================================================
 * AGRILY AGRICULTURAL COMMERCE & PROVENANCE PLATFORM
 * High-Performance React Debouncing Hook Suite
 * ==============================================================================
 * 
 * @module frontend/src/hook/useDebounce
 * @description
 * Provides universal, memory-safe, and highly responsive debounce primitives
 * for state values, callback invocations, and agricultural search inputs.
 * 
 * In agricultural commerce networks where users search thousands of catalog listings
 * (e.g. Grain varieties, Cassava stems, Fertilizer batches, Farmer order waybills),
 * sending an unthrottled API request on every keystroke leads to excessive network
 * chatter, database query thrashing, race conditions, and UI stutter.
 * 
 * This suite provides three foundational debounce abstractions:
 *  1. `useDebounce(value, delay)`: Debounces an arbitrary reactive state value.
 *  2. `useDebouncedCallback(callback, delay, options)`: Returns a debounced function
 *     with imperative `.cancel()` and `.flush()` capabilities.
 *  3. `useDebounceSearch(initialValue, delay, onSearch)`: Complete controller for search inputs,
 *     managing live query, debounced query, loading states, and reset actions.
 * 
 * @example
 * ```jsx
 * import { useDebounce, useDebouncedCallback } from '../hook/useDebounce';
 * 
 * // Example 1: Debouncing a search query state
 * const [query, setQuery] = useState('');
 * const debouncedQuery = useDebounce(query, 300);
 * 
 * useEffect(() => {
 *   if (debouncedQuery) {
 *     fetchProducts(debouncedQuery);
 *   }
 * }, [debouncedQuery]);
 * 
 * // Example 2: Debouncing an onSearch callback directly
 * const debouncedSearch = useDebouncedCallback((val) => {
 *   dispatchSearch(val);
 * }, 350);
 * ```
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * Standard debounce delay in milliseconds applied across Agrily search inputs.
 * 350ms provides optimal balance between tactile typing responsiveness and
 * minimizing unnecessary network query payload dispatches.
 */
export const DEFAULT_DEBOUNCE_DELAY_MS = 350;

/**
 * Custom React hook that delays updating the returned value until the specified
 * delay in milliseconds has elapsed since the last time the input value changed.
 * 
 * @template T
 * @param {T} value - The input value to debounce (e.g., search term, filter object)
 * @param {number} [delay=350] - Debounce interval in milliseconds
 * @returns {T} The debounced value
 */
export function useDebounce(value, delay = DEFAULT_DEBOUNCE_DELAY_MS) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const effectiveDelay = typeof delay === 'number' && delay >= 0 ? delay : DEFAULT_DEBOUNCE_DELAY_MS;

  useEffect(() => {
    // Schedule timer to update state after the debounce delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, effectiveDelay);

    // Cancel timer if value or delay changes before timeout fires,
    // or if the host component unmounts.
    return () => {
      clearTimeout(handler);
    };
  }, [value, effectiveDelay]);

  return debouncedValue;
}

/**
 * Custom React hook that creates a debounced version of a callback function.
 * Preserves access to the latest callback reference to prevent stale closures.
 * 
 * @param {Function} callback - The callback function to debounce
 * @param {number} [delay=350] - Debounce interval in milliseconds
 * @param {Object} [options={}] - Configuration options
 * @param {boolean} [options.leading=false] - If true, execute on the leading edge of timeout
 * @param {boolean} [options.trailing=true] - If true, execute on the trailing edge of timeout
 * @returns {Function & { cancel: Function, flush: Function }} Debounced callback function with controls
 */
export function useDebouncedCallback(
  callback,
  delay = DEFAULT_DEBOUNCE_DELAY_MS,
  options = { leading: false, trailing: true }
) {
  const callbackRef = useRef(callback);
  const timerRef = useRef(null);
  const lastArgsRef = useRef(null);
  const effectiveDelay = typeof delay === 'number' && delay >= 0 ? delay : DEFAULT_DEBOUNCE_DELAY_MS;

  // Keep callback reference up to date without re-triggering effects
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Imperative cancel method to abort pending invocations
  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    lastArgsRef.current = null;
  }, []);

  // Imperative flush method to execute immediately if pending
  const flush = useCallback(() => {
    if (timerRef.current && lastArgsRef.current && typeof callbackRef.current === 'function') {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      callbackRef.current(...lastArgsRef.current);
      lastArgsRef.current = null;
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const debouncedFn = useCallback(
    (...args) => {
      lastArgsRef.current = args;

      // Handle leading edge invocation if configured
      const shouldCallLeading = options.leading && !timerRef.current;

      if (shouldCallLeading && typeof callbackRef.current === 'function') {
        callbackRef.current(...args);
      }

      // Reset existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (options.trailing !== false && !shouldCallLeading && typeof callbackRef.current === 'function') {
          if (lastArgsRef.current) {
            callbackRef.current(...lastArgsRef.current);
            lastArgsRef.current = null;
          }
        }
      }, effectiveDelay);
    },
    [effectiveDelay, options.leading, options.trailing]
  );

  debouncedFn.cancel = cancel;
  debouncedFn.flush = flush;

  return debouncedFn;
}

/**
 * Custom React hook specialized for Search Bar inputs.
 * Bundles immediate input state with debounced state, clear action, and an optional change notifier.
 * 
 * @param {string} [initialValue=''] - Initial search input string
 * @param {number} [delay=350] - Debounce delay in milliseconds
 * @param {Function} [onSearch] - Optional callback triggered with debounced query
 * @returns {{
 *   query: string,
 *   debouncedQuery: string,
 *   setQuery: Function,
 *   handleClear: Function,
 *   isDebouncing: boolean
 * }} Search state and handlers
 */
export function useDebounceSearch(initialValue = '', delay = DEFAULT_DEBOUNCE_DELAY_MS, onSearch = null) {
  const [query, setQuery] = useState(initialValue);
  const debouncedQuery = useDebounce(query, delay);
  const isFirstRender = useRef(true);

  // Sync external initialValue changes
  useEffect(() => {
    setQuery(initialValue || '');
  }, [initialValue]);

  // Notify consumer of debounced query updates
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (typeof onSearch === 'function') {
      onSearch(debouncedQuery.trim());
    }
  }, [debouncedQuery, onSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    if (typeof onSearch === 'function') {
      onSearch('');
    }
  }, [onSearch]);

  const isDebouncing = useMemo(() => {
    return query.trim() !== debouncedQuery.trim();
  }, [query, debouncedQuery]);

  return {
    query,
    debouncedQuery,
    setQuery,
    handleClear,
    isDebouncing
  };
}

export default useDebounce;
