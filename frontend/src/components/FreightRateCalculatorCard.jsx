/**
 * @file FreightRateCalculatorCard.jsx
 * @description Interactive Nigerian Regional Agro-Freight Tariff Calculator
 * Calculates dynamic freight quotes with diesel price surcharges, reefer premiums,
 * and seasonal market volatility indices adhering to DESIGN_SYSTEM.md.
 */

import React, { useState, useEffect } from 'react';
import './FreightRateCalculatorCard.css';

const NIGERIAN_STATES = [
  'KANO', 'KADUNA', 'PLATEAU', 'BENUE', 'OYO', 'ONDO', 'LAGOS', 'RIVERS', 'ABUJA', 'BORNO', 'SOKOTO', 'OGUN', 'ENUGU', 'EDO', 'DELTA'
];

export default function FreightRateCalculatorCard({
  defaultOrigin = 'KANO',
  defaultDestination = 'LAGOS',
  defaultTonnage = 10,
  onQuoteCalculated,
  onBookDispatch
}) {
  const [origin, setOrigin] = useState(defaultOrigin);
  const [destination, setDestination] = useState(defaultDestination);
  const [tonnage, setTonnage] = useState(defaultTonnage);
  const [isReefer, setIsReefer] = useState(false);
  const [dieselPrice, setDieselPrice] = useState(950);
  const [season, setSeason] = useState('DRY_SEASON_HARVEST');
  const [quote, setQuote] = useState(null);
  const [copied, setCopied] = useState(false);

  // Client-side instant calculation matching backend algorithm
  useEffect(() => {
    const isSameState = origin === destination;
    const distanceKm = isSameState ? 85 : (
      (origin === 'KANO' && destination === 'LAGOS') ? 995 :
      (origin === 'PLATEAU' && destination === 'RIVERS') ? 760 :
      (origin === 'BENUE' && destination === 'LAGOS') ? 680 :
      (origin === 'ONDO' && destination === 'LAGOS') ? 310 :
      (origin === 'SOKOTO' && destination === 'OYO') ? 840 :
      (origin === 'BORNO' && destination === 'ABUJA') ? 820 : 620
    );

    const baseRatePerTonKm = 34.00;
    const rawBase = distanceKm * tonnage * baseRatePerTonKm;

    // Diesel surcharge
    const benchmarkDiesel = 950;
    const dieselRatio = (dieselPrice - benchmarkDiesel) / benchmarkDiesel;
    const fuelSurchargePct = Math.max(-0.15, dieselRatio * 0.45);
    const fuelSurcharge = Math.round(rawBase * fuelSurchargePct);

    // Reefer premium
    const reeferPremium = isReefer ? Math.round(rawBase * 0.25) : 0;

    // Seasonal multiplier
    let seasonMult = 1.12;
    if (season === 'RAINY_SEASON_PEAK') seasonMult = 1.20;
    if (season === 'OFF_SEASON_BASELINE') seasonMult = 1.00;

    const tolls = isSameState ? 2500 : 9500;
    const security = ['BORNO', 'SOKOTO'].includes(origin) ? 25000 : 0;

    let total = (rawBase + fuelSurcharge + reeferPremium) * seasonMult + tolls + security;
    const finalTariff = Math.max(50000, Math.round(total));
    const effectiveRate = parseFloat((finalTariff / (distanceKm * tonnage)).toFixed(2));

    const calculatedQuote = {
      origin,
      destination,
      distanceKm,
      tonnage,
      isReefer,
      rawBaseFreightNgn: Math.round(rawBase),
      fuelSurchargeNgn: fuelSurcharge,
      reeferPremiumNgn: reeferPremium,
      statutoryTollsNgn: tolls,
      securitySurchargeNgn: security,
      seasonMultiplier: seasonMult,
      finalTariffNgn: finalTariff,
      effectiveRatePerTonKmNgn: effectiveRate
    };

    setQuote(calculatedQuote);
    if (onQuoteCalculated) onQuoteCalculated(calculatedQuote);
  }, [origin, destination, tonnage, isReefer, dieselPrice, season, onQuoteCalculated]);

  const handleCopyQuote = () => {
    if (!quote) return;
    const text = `Agrily Freight Quote: ${quote.origin} ➔ ${quote.destination} | ${quote.tonnage} Tons | ₦${quote.finalTariffNgn.toLocaleString()}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="freight-calculator-card" data-testid="freight-calculator-card">
      <div className="calc-header">
        <div className="calc-title-box">
          <span className="calc-badge">Dynamic Agro-Freight Index</span>
          <h3 className="calc-heading">Haulage Freight Rate Calculator</h3>
        </div>
        <div className="calc-live-indicator">
          <span className="pulsing-radar-dot" /> Live Pricing
        </div>
      </div>

      <div className="calc-inputs-grid">
        {/* Origin & Destination */}
        <div className="input-group">
          <label htmlFor="origin-select" className="input-label">Origin State</label>
          <select
            id="origin-select"
            className="calc-select"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          >
            {NIGERIAN_STATES.map((st) => (
              <option key={`orig-${st}`} value={st}>{st}</option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label htmlFor="dest-select" className="input-label">Destination State</label>
          <select
            id="dest-select"
            className="calc-select"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          >
            {NIGERIAN_STATES.map((st) => (
              <option key={`dest-${st}`} value={st}>{st}</option>
            ))}
          </select>
        </div>

        {/* Tonnage Slider */}
        <div className="input-group full-width">
          <div className="slider-label-row">
            <label htmlFor="tonnage-slider" className="input-label">Cargo Weight (Tonnage)</label>
            <span className="slider-value-badge">{tonnage} Tonnes</span>
          </div>
          <input
            id="tonnage-slider"
            type="range"
            min="1"
            max="40"
            step="0.5"
            className="calc-range-slider"
            value={tonnage}
            onChange={(e) => setTonnage(parseFloat(e.target.value))}
          />
        </div>

        {/* Reefer Toggle & Season */}
        <div className="input-group">
          <label htmlFor="season-select" className="input-label">Trade Season</label>
          <select
            id="season-select"
            className="calc-select"
            value={season}
            onChange={(e) => setSeason(e.target.value)}
          >
            <option value="DRY_SEASON_HARVEST">Dry Season Harvest (+12%)</option>
            <option value="RAINY_SEASON_PEAK">Rainy Season Peak (+20%)</option>
            <option value="OFF_SEASON_BASELINE">Off-Season Baseline (0%)</option>
          </select>
        </div>

        <div className="input-group toggle-group">
          <span className="input-label">Cold-Chain Reefer</span>
          <button
            type="button"
            className={`reefer-toggle-btn ${isReefer ? 'active-reefer' : ''}`}
            onClick={() => setIsReefer(!isReefer)}
            aria-pressed={isReefer}
          >
            <span className="toggle-icon">{isReefer ? '❄️ Active Reefer' : '🚚 Ambient Transit'}</span>
          </button>
        </div>

        {/* Diesel Pump Benchmark */}
        <div className="input-group full-width">
          <div className="slider-label-row">
            <label htmlFor="diesel-input" className="input-label">Local Diesel Price (₦/Litre)</label>
            <span className="diesel-delta-subtext">
              {dieselPrice > 950 ? `+₦${dieselPrice - 950} surcharge` : 'Baseline rate'}
            </span>
          </div>
          <input
            id="diesel-input"
            type="number"
            min="700"
            max="1800"
            step="10"
            className="calc-text-input"
            value={dieselPrice}
            onChange={(e) => setDieselPrice(parseFloat(e.target.value) || 950)}
          />
        </div>
      </div>

      {/* Quote Breakdown Display */}
      {quote && (
        <div className="quote-results-container">
          <div className="quote-main-total-banner">
            <div className="tariff-primary-stat">
              <span className="total-tariff-label">Estimated Freight Tariff</span>
              <span className="total-tariff-amount">₦{quote.finalTariffNgn.toLocaleString()}</span>
            </div>
            <div className="rate-per-tonkm">
              <span className="tonkm-label">Yield Metric</span>
              <span className="tonkm-val">₦{quote.effectiveRatePerTonKmNgn} / ton-km</span>
            </div>
          </div>

          <div className="quote-line-items">
            <div className="line-item">
              <span>Base Haulage ({quote.distanceKm} km × {quote.tonnage} T)</span>
              <span>₦{quote.rawBaseFreightNgn.toLocaleString()}</span>
            </div>
            {quote.fuelSurchargeNgn !== 0 && (
              <div className="line-item surcharge-item">
                <span>Diesel Inflation Surcharge</span>
                <span>+{quote.fuelSurchargeNgn > 0 ? `₦${quote.fuelSurchargeNgn.toLocaleString()}` : `-₦${Math.abs(quote.fuelSurchargeNgn).toLocaleString()}`}</span>
              </div>
            )}
            {quote.reeferPremiumNgn > 0 && (
              <div className="line-item reefer-item">
                <span>Reefer Cold-Chain Assurance (+25%)</span>
                <span>+₦{quote.reeferPremiumNgn.toLocaleString()}</span>
              </div>
            )}
            {quote.securitySurchargeNgn > 0 && (
              <div className="line-item security-item">
                <span>Corridor Security Escort</span>
                <span>+₦{quote.securitySurchargeNgn.toLocaleString()}</span>
              </div>
            )}
            <div className="line-item">
              <span>Statutory Road Levies & Tolls</span>
              <span>₦{quote.statutoryTollsNgn.toLocaleString()}</span>
            </div>
          </div>

          <div className="calc-action-buttons">
            <button
              type="button"
              className="btn-copy-quote"
              onClick={handleCopyQuote}
            >
              {copied ? '✓ Quote Copied!' : '📋 Copy Quote'}
            </button>
            {onBookDispatch && (
              <button
                type="button"
                className="btn-book-dispatch"
                onClick={() => onBookDispatch(quote)}
              >
                Dispatch Consignment ➔
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
