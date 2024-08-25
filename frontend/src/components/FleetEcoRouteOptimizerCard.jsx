import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './FleetEcoRouteOptimizerCard.css';

/**
 * Pre-calculated Nigerian corridors with realistic terrain friction and distance
 */
const SAMPLE_CORRIDOR_PRESETS = [
  {
    id: 'KANO_LAGOS',
    label: 'Kano → Lagos (Grain & Onion Corridor)',
    origin: 'Kano',
    destination: 'Lagos',
    baseKm: 995,
    routes: [
      {
        name: 'Expressway Route A (via Kaduna - Abuja - Lokoja - Ibadan)',
        distanceKm: 995,
        frictionFactor: 1.05,
        terrain: 'Dual Carriageway / Mixed Tollway',
        estimatedFuelLitres: 284,
        co2Kg: 761,
        dieselCostNgn: 326600,
        isEcoWinner: true
      },
      {
        name: 'Bypass Route B (via Bida - Mokwa - Ilorin - Oyo)',
        distanceKm: 1040,
        frictionFactor: 1.25,
        terrain: 'Single Lane Arterial / Potholed Stretches',
        estimatedFuelLitres: 346,
        co2Kg: 927,
        dieselCostNgn: 397900,
        isEcoWinner: false
      }
    ]
  },
  {
    id: 'BENUE_PORTHARCOURT',
    label: 'Makurdi (Benue) → Port Harcourt (Tuber & Citrus)',
    origin: 'Benue',
    destination: 'Rivers',
    baseKm: 580,
    routes: [
      {
        name: 'Southern Highway (via Enugu - Aba - Port Harcourt)',
        distanceKm: 580,
        frictionFactor: 1.10,
        terrain: 'Paved Interstate Corridor',
        estimatedFuelLitres: 165,
        co2Kg: 442,
        dieselCostNgn: 189750,
        isEcoWinner: true
      },
      {
        name: 'Alternate Rural Highway (via Owerri Bypass)',
        distanceKm: 625,
        frictionFactor: 1.30,
        terrain: 'Hilly Rural Roads / Heavy Congestion',
        estimatedFuelLitres: 211,
        co2Kg: 565,
        dieselCostNgn: 242650,
        isEcoWinner: false
      }
    ]
  },
  {
    id: 'JOS_ABUJA',
    label: 'Jos (Plateau) → Abuja (Fresh Vegetable Belt)',
    origin: 'Plateau',
    destination: 'FCT',
    baseKm: 290,
    routes: [
      {
        name: 'Forest Plateau Pass (via Akwanga - Keffi Expressway)',
        distanceKm: 290,
        frictionFactor: 1.08,
        terrain: 'Mountain Descent / Smooth Dual Carriageway',
        estimatedFuelLitres: 83,
        co2Kg: 222,
        dieselCostNgn: 95450,
        isEcoWinner: true
      },
      {
        name: 'Old Escarpment Road (via Kafanchan)',
        distanceKm: 345,
        frictionFactor: 1.35,
        terrain: 'Steep Escarpment / Rural Detour',
        estimatedFuelLitres: 121,
        co2Kg: 324,
        dieselCostNgn: 139150,
        isEcoWinner: false
      }
    ]
  }
];

export default function FleetEcoRouteOptimizerCard({ onSelectRoute, className = '' }) {
  const [selectedCorridorId, setSelectedCorridorId] = useState('KANO_LAGOS');
  const [tonnage, setTonnage] = useState(20);
  const [isReefer, setIsReefer] = useState(false);
  const [dieselPriceNgn, setDieselPriceNgn] = useState(1150);
  const [activeRouteIndex, setActiveRouteIndex] = useState(0);

  const activePreset = SAMPLE_CORRIDOR_PRESETS.find(p => p.id === selectedCorridorId) || SAMPLE_CORRIDOR_PRESETS[0];

  // Dynamic adjustments based on load tonnage and reefer compressor load
  const tonnageMultiplier = 1 + (tonnage - 10) * 0.025;
  const reeferMultiplier = isReefer ? 1.18 : 1.0;

  const evaluatedRoutes = activePreset.routes.map((route, idx) => {
    const adjustedFuel = Math.round(route.estimatedFuelLitres * tonnageMultiplier * reeferMultiplier);
    const adjustedCo2 = Math.round(adjustedFuel * 2.68);
    const adjustedCost = Math.round(adjustedFuel * dieselPriceNgn);
    return {
      ...route,
      adjustedFuelLitres: adjustedFuel,
      adjustedCo2Kg: adjustedCo2,
      adjustedCostNgn: adjustedCost
    };
  });

  const greenest = evaluatedRoutes.reduce((min, r) => r.adjustedFuelLitres < min.adjustedFuelLitres ? r : min, evaluatedRoutes[0]);
  const worst = evaluatedRoutes.reduce((max, r) => r.adjustedFuelLitres > max.adjustedFuelLitres ? r : max, evaluatedRoutes[0]);

  const fuelSaved = Math.max(0, worst.adjustedFuelLitres - greenest.adjustedFuelLitres);
  const costSaved = Math.max(0, worst.adjustedCostNgn - greenest.adjustedCostNgn);
  const co2Saved = Math.max(0, worst.adjustedCo2Kg - greenest.adjustedCo2Kg);

  const handleRouteClick = (idx) => {
    setActiveRouteIndex(idx);
    if (onSelectRoute) {
      onSelectRoute(evaluatedRoutes[idx]);
    }
  };

  return (
    <div className={`eco-route-card-container ${className}`} data-testid="fleet-eco-route-optimizer-card">
      <div className="eco-route-header">
        <div className="eco-route-title-wrap">
          <span className="eco-badge-leaf">🌱 ECO-ROUTING OPTIMIZER</span>
          <h3 className="eco-route-title">Regional Terrain & Carbon Minimizer</h3>
          <p className="eco-route-subtitle">
            Simulates terrain friction, road topology, and cargo weight to calculate the lowest-emission agricultural haulage path.
          </p>
        </div>
        <div className="eco-savings-pill" data-testid="eco-projected-savings-pill">
          <span className="savings-label">Projected Green Savings</span>
          <span className="savings-value">₦{costSaved.toLocaleString()}</span>
          <span className="savings-subtext">-{co2Saved} kg CO₂ / trip</span>
        </div>
      </div>

      <div className="eco-controls-grid">
        <div className="control-group">
          <label htmlFor="corridor-select" className="control-label">Trade Corridor</label>
          <select
            id="corridor-select"
            className="control-select"
            value={selectedCorridorId}
            onChange={(e) => {
              setSelectedCorridorId(e.target.value);
              setActiveRouteIndex(0);
            }}
            data-testid="corridor-select"
          >
            {SAMPLE_CORRIDOR_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="tonnage-input" className="control-label">Payload Weight: <strong>{tonnage} Tonnes</strong></label>
          <input
            id="tonnage-input"
            type="range"
            min="2"
            max="35"
            step="1"
            value={tonnage}
            onChange={(e) => setTonnage(Number(e.target.value))}
            className="control-range"
            data-testid="tonnage-range-input"
          />
        </div>

        <div className="control-group">
          <label htmlFor="diesel-price-input" className="control-label">Diesel Price: <strong>₦{dieselPriceNgn}/L</strong></label>
          <input
            id="diesel-price-input"
            type="range"
            min="700"
            max="1800"
            step="25"
            value={dieselPriceNgn}
            onChange={(e) => setDieselPriceNgn(Number(e.target.value))}
            className="control-range"
            data-testid="diesel-price-input"
          />
        </div>

        <div className="control-group checkbox-group">
          <label className="checkbox-label" htmlFor="reefer-checkbox">
            <input
              id="reefer-checkbox"
              type="checkbox"
              checked={isReefer}
              onChange={(e) => setIsReefer(e.target.checked)}
              data-testid="reefer-checkbox"
            />
            <span className="checkbox-text">Refrigerated Reefer Trailer (+18% aux power)</span>
          </label>
        </div>
      </div>

      <div className="route-comparison-grid" data-testid="route-comparison-grid">
        {evaluatedRoutes.map((route, idx) => {
          const isSelected = idx === activeRouteIndex;
          const isWinner = route.adjustedFuelLitres === greenest.adjustedFuelLitres;

          return (
            <div
              key={route.name}
              className={`route-card ${isSelected ? 'selected' : ''} ${isWinner ? 'winner-card' : ''}`}
              onClick={() => handleRouteClick(idx)}
              data-testid={`route-card-${idx}`}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => { if (e.key === 'Enter') handleRouteClick(idx); }}
            >
              <div className="route-card-header">
                <span className="route-card-name">{route.name}</span>
                {isWinner && (
                  <span className="winner-badge" data-testid="greenest-route-badge">
                    ★ ECO RECOMMENDED
                  </span>
                )}
              </div>

              <div className="route-meta-row">
                <span className="route-terrain-tag">{route.terrain}</span>
                <span className="route-distance-tag">{route.distanceKm} km</span>
              </div>

              <div className="route-metrics-block">
                <div className="metric-box">
                  <span className="metric-label">Estimated Diesel</span>
                  <span className="metric-val">{route.adjustedFuelLitres} L</span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">Carbon Footprint</span>
                  <span className="metric-val">{route.adjustedCo2Kg} kg</span>
                </div>
                <div className="metric-box cost-box">
                  <span className="metric-label">Projected Fuel Cost</span>
                  <span className="metric-val highlight">₦{route.adjustedCostNgn.toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="eco-summary-footer">
        <div className="esg-score-badge">
          <span className="esg-star">★</span>
          <span>
            Selecting the optimized corridor reduces haulage emissions by{' '}
            <strong>
              {worst.adjustedFuelLitres > 0
                ? Math.round((fuelSaved / worst.adjustedFuelLitres) * 100)
                : 0}%
            </strong>, eligible for digital Agrily ESG offset credits.
          </span>
        </div>
      </div>
    </div>
  );
}

FleetEcoRouteOptimizerCard.propTypes = {
  onSelectRoute: PropTypes.func,
  className: PropTypes.string
};
