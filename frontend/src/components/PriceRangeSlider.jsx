import React, { useState, useEffect } from 'react';
import './PriceRangeSlider.css';

const PRESETS = [
  { label: 'All Prices', min: 0, max: 200000 },
  { label: 'Under ₦5K', min: 0, max: 5000 },
  { label: '₦5K – ₦25K', min: 5000, max: 25000 },
  { label: '₦25K – ₦100K', min: 25000, max: 100000 },
  { label: 'Over ₦100K', min: 100000, max: 200000 }
];

function PriceRangeSlider({
  minBound = 0,
  maxBound = 200000,
  step = 1000,
  initialMin = 0,
  initialMax = 200000,
  onChange,
  className = ''
}) {
  const [minPrice, setMinPrice] = useState(initialMin);
  const [maxPrice, setMaxPrice] = useState(initialMax);
  const [activePreset, setActivePreset] = useState('All Prices');

  useEffect(() => {
    setMinPrice(initialMin);
    setMaxPrice(initialMax);
  }, [initialMin, initialMax]);

  const handleMinChange = (e) => {
    const val = Math.min(Number(e.target.value), maxPrice - step);
    setMinPrice(val);
    setActivePreset('');
    if (onChange) {
      onChange({ minPrice: val, maxPrice });
    }
  };

  const handleMaxChange = (e) => {
    const val = Math.max(Number(e.target.value), minPrice + step);
    setMaxPrice(val);
    setActivePreset('');
    if (onChange) {
      onChange({ minPrice, maxPrice: val });
    }
  };

  const handlePresetClick = (preset) => {
    setMinPrice(preset.min);
    setMaxPrice(preset.max);
    setActivePreset(preset.label);
    if (onChange) {
      onChange({ minPrice: preset.min, maxPrice: preset.max });
    }
  };

  const formatNaira = (amount) => {
    return Number(amount).toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0
    });
  };

  return (
    <div className={`agrily-price-slider-card ${className}`.trim()}>
      <div className="agrily-price-slider-header">
        <span className="agrily-price-slider-title">Price Range</span>
        <span className="agrily-price-display-pill" data-testid="price-display-pill">
          {formatNaira(minPrice)} – {formatNaira(maxPrice)}
        </span>
      </div>

      <div className="agrily-range-inputs">
        <div className="agrily-range-input-row">
          <span className="agrily-range-label">Min</span>
          <input
            type="range"
            min={minBound}
            max={maxBound}
            step={step}
            value={minPrice}
            onChange={handleMinChange}
            aria-label="Minimum produce price"
            className="agrily-range-slider"
          />
        </div>

        <div className="agrily-range-input-row">
          <span className="agrily-range-label">Max</span>
          <input
            type="range"
            min={minBound}
            max={maxBound}
            step={step}
            value={maxPrice}
            onChange={handleMaxChange}
            aria-label="Maximum produce price"
            className="agrily-range-slider"
          />
        </div>
      </div>

      <div className="agrily-price-presets">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className={`agrily-price-preset-btn ${activePreset === preset.label ? 'active' : ''}`}
            onClick={() => handlePresetClick(preset)}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default PriceRangeSlider;
