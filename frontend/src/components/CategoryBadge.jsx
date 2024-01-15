import React from 'react';
import './CategoryBadge.css';

// Supported agricultural taxonomy definitions
export const CATEGORY_META = {
  grains: { label: 'Grains & Cereals', icon: '🌾' },
  tubers: { label: 'Tubers & Roots', icon: '🥔' },
  fruits: { label: 'Fresh Fruits', icon: '🍎' },
  vegetables: { label: 'Vegetables & Greens', icon: '🥬' },
  livestock: { label: 'Livestock', icon: '🐄' },
  poultry: { label: 'Poultry & Eggs', icon: '🐔' },
  dairy: { label: 'Dairy Produce', icon: '🥛' },
  other: { label: 'Other Farm Produce', icon: '📦' }
};

/**
 * Visual badge for produce category display on cards & modals
 */
export const CategoryBadge = ({ category = 'other', size = 'md', className = '', showIcon = true }) => {
  const normalizedKey = (category || 'other').toLowerCase();
  const meta = CATEGORY_META[normalizedKey] || { label: category || 'Produce', icon: '🌱' };
  const badgeClass = `badge-category-${normalizedKey in CATEGORY_META ? normalizedKey : 'other'}`;

  return (
    <span className={`agrily-badge agrily-badge-${size} ${badgeClass} ${className}`.trim()}>
      {showIcon && <span aria-hidden="true">{meta.icon}</span>}
      <span>{meta.label}</span>
    </span>
  );
};

/**
 * Interactive filter chip button for marketplace browsing and search bars
 */
export const CategoryChip = ({
  category = 'all',
  label,
  icon,
  isActive = false,
  onClick,
  size = 'md',
  className = ''
}) => {
  const normalizedKey = (category || 'all').toLowerCase();
  const meta = CATEGORY_META[normalizedKey] || {};
  const displayLabel = label || meta.label || (normalizedKey === 'all' ? 'All Produce' : category);
  const displayIcon = icon !== undefined ? icon : (meta.icon || (normalizedKey === 'all' ? '🧺' : '🌱'));

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && onClick) {
      e.preventDefault();
      onClick(category);
    }
  };

  return (
    <button
      type="button"
      role="button"
      aria-pressed={isActive}
      tabIndex={0}
      onClick={() => onClick && onClick(category)}
      onKeyDown={handleKeyDown}
      className={`agrily-badge agrily-badge-${size} agrily-chip-button ${
        isActive ? 'agrily-chip-active' : ''
      } ${className}`.trim()}
    >
      {displayIcon && <span aria-hidden="true">{displayIcon}</span>}
      <span>{displayLabel}</span>
    </button>
  );
};

/**
 * Status indicator badge for produce stock availability
 */
export const StockBadge = ({ isSold = false, quantity = 0, size = 'sm', className = '' }) => {
  if (isSold || quantity <= 0) {
    return (
      <span className={`agrily-badge agrily-badge-${size} stock-badge-sold ${className}`.trim()}>
        <span className="status-dot status-dot-sold" aria-hidden="true" />
        <span>Sold Out</span>
      </span>
    );
  }

  if (quantity > 0 && quantity <= 5) {
    return (
      <span className={`agrily-badge agrily-badge-${size} stock-badge-low ${className}`.trim()}>
        <span className="status-dot status-dot-low" aria-hidden="true" />
        <span>Low Stock ({quantity} left)</span>
      </span>
    );
  }

  return (
    <span className={`agrily-badge agrily-badge-${size} stock-badge-available ${className}`.trim()}>
      <span className="status-dot status-dot-available" aria-hidden="true" />
      <span>In Stock</span>
    </span>
  );
};

export default CategoryBadge;
