import React, { useState, useEffect, useRef } from 'react';
import './SearchBar.css';

/**
 * Search icon SVG component
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
 * Close / Clear icon SVG component
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
 * Debounced search input component with clear button
 */
function SearchBar({
  placeholder = 'Search produce by name or description...',
  initialValue = '',
  onSearch,
  debounceMs = 300,
  className = ''
}) {
  const [query, setQuery] = useState(initialValue);
  const isFirstRender = useRef(true);

  // Sync with initialValue prop if it changes externally
  useEffect(() => {
    setQuery(initialValue || '');
  }, [initialValue]);

  // Handle debounced search invocation
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      if (onSearch) {
        onSearch(query.trim());
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs, onSearch]);

  const handleClear = () => {
    setQuery('');
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <div className={`agrily-search-container ${className}`.trim()}>
      <div className="agrily-search-icon-left">
        <SearchIcon size={18} />
      </div>

      <input
        type="text"
        className="agrily-search-input"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search produce"
      />

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
