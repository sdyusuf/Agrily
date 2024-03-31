import React from 'react';
import './CategoryBadge.css';
import {
  CategoryIcon,
  WheatIcon,
  RootIcon,
  AppleIcon,
  LeafIcon,
  CowIcon,
  EggIcon,
  MilkIcon,
  PackageIcon,
  BasketIcon
} from './Icons';

// Supported agricultural taxonomy definitions with clean SVG icon renderers
export const CATEGORY_META = {
  grains: {
    label: 'Grains & Cereals',
    renderIcon: (size) => <WheatIcon size={size} />
  },
  tubers: {
    label: 'Tubers & Roots',
    renderIcon: (size) => <RootIcon size={size} />
  },
  fruits: {
    label: 'Fresh Fruits',
    renderIcon: (size) => <AppleIcon size={size} />
  },
  vegetables: {
    label: 'Vegetables & Greens',
    renderIcon: (size) => <LeafIcon size={size} />
  },
  livestock: {
    label: 'Livestock',
    renderIcon: (size) => <CowIcon size={size} />
  },
  poultry: {
    label: 'Poultry & Eggs',
    renderIcon: (size) => <EggIcon size={size} />
  },
  dairy: {
    label: 'Dairy Produce',
    renderIcon: (size) => <MilkIcon size={size} />
  },
  other: {
    label: 'Other Farm Produce',
    renderIcon: (size) => <PackageIcon size={size} />
  }
};

const iconSizes = {
  sm: 13,
  md: 15,
  lg: 18
};

/**
 * Visual badge for produce category display on cards & modals
 */
export const CategoryBadge = ({ category = 'other', size = 'md', className = '', showIcon = true }) => {
  const normalizedKey = (category || 'other').toLowerCase();
  const meta = CATEGORY_META[normalizedKey] || {
    label: category || 'Produce',
    renderIcon: (sz) => <PackageIcon size={sz} />
  };
  const badgeClass = `badge-category-${normalizedKey in CATEGORY_META ? normalizedKey : 'other'}`;
  const iconPixelSize = iconSizes[size] || iconSizes.md;

  return (
    <span className={`agrily-badge agrily-badge-${size} ${badgeClass} ${className}`.trim()}>
      {showIcon && (
        <span className="d-inline-flex align-items-center" aria-hidden="true">
          {meta.renderIcon ? meta.renderIcon(iconPixelSize) : <CategoryIcon category={normalizedKey} size={iconPixelSize} />}
        </span>
      )}
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
  const iconPixelSize = iconSizes[size] || iconSizes.md;

  const renderChipIcon = () => {
    if (icon !== undefined) return icon;
    if (normalizedKey === 'all') return <BasketIcon size={iconPixelSize} />;
    if (meta.renderIcon) return meta.renderIcon(iconPixelSize);
    return <CategoryIcon category={normalizedKey} size={iconPixelSize} />;
  };

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
      <span className="d-inline-flex align-items-center" aria-hidden="true">
        {renderChipIcon()}
      </span>
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
