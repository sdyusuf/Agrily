/**
 * ==============================================================================
 * AGRILY AGRICULTURAL COMMERCE & PROVENANCE PLATFORM
 * Universal Debounced SearchBar Component
 * ==============================================================================
 * 
 * @module frontend/src/components/SearchBar
 * @description
 * High-fidelity, debounced search input with tactile Agrily styling, custom SVG
 * magnifying glass and clear icons, and accessible ARIA attributes.
 * 
 * Architecture & Debounce Strategy:
 * Utilizes the central `useDebounceSearch` hook to throttle input updates (default 300ms-350ms).
 * Typing keystrokes update local visual text immediately while deferring parent `onSearch`
 * invocations until the user pauses, preventing unneeded backend query dispatches and
 * DOM re-render churn during fast typing.
 * 
 * Design Standards:
 *  - Emerald focus ring: `rgba(45, 106, 79, 0.25)` with `#2d6a4f` border
 *  - Subtle backdrop fill: `#f8faf9`
 *  - Clear button with hover scale and tactile focus
 * 
 * @component SearchBar
 * @requires react
 * @requires ../hook/useDebounce
 * @requires ./SearchBar.css
 */

import React from 'react';
import { useDebounceSearch, DEFAULT_DEBOUNCE_DELAY_MS } from '../hook/useDebounce';
import './SearchBar.css';

/**
 * Search Icon SVG primitive
 * @param {Object} props
 * @param {number} [props.size=18] - Dimension in pixels
 * @param {string} [props.color='currentColor'] - Stroke color
 */
function SearchIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

/**
 * Close / Clear icon SVG primitive
 * @param {Object} props
 * @param {number} [props.size=16] - Dimension in pixels
 * @param {string} [props.color='currentColor'] - Stroke color
 */
function CloseIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/**
 * Debounced Search Bar with tactile focus state and instant clear button
 * 
 * @param {Object} props
 * @param {string} [props.placeholder='Search produce by name or description...'] - Input placeholder
 * @param {string} [props.initialValue=''] - Initial query string
 * @param {Function} [props.onSearch] - Callback triggered with debounced string
 * @param {number} [props.debounceMs=300] - Debounce delay in milliseconds
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {string} [props.ariaLabel='Search produce'] - Accessible name for input
 */
function SearchBar({
  placeholder = 'Search produce by name or description...',
  initialValue = '',
  onSearch,
  debounceMs = 300,
  className = '',
  ariaLabel = 'Search produce'
}) {
  const {
    query,
    setQuery,
    handleClear,
    isDebouncing
  } = useDebounceSearch(initialValue, debounceMs || DEFAULT_DEBOUNCE_DELAY_MS, onSearch);

  return (
    <div
      className={`agrily-search-container ${className} ${isDebouncing ? 'is-debouncing' : ''}`.trim()}
    >
      {/* Magnifying Glass Prefix Icon */}
      <div className="agrily-search-icon-left" aria-hidden="true">
        <SearchIcon size={18} color="#2d6a4f" />
      </div>

      {/* Main Debounced Text Input */}
      <input
        type="text"
        className="agrily-search-input"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label={ariaLabel}
        autoComplete="off"
        spellCheck="false"
      />

      {/* Reset / Clear Input Button */}
      {query.length > 0 && (
        <button
          type="button"
          className="agrily-search-clear-btn"
          onClick={handleClear}
          aria-label="Clear search input"
          title="Clear search"
        >
          <CloseIcon size={16} />
        </button>
      )}
    </div>
  );
}

export default SearchBar;
