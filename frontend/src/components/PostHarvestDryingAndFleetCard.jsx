/**
 * ==============================================================================
 * 🌾 AGRILY SPRINT 21: POST-HARVEST GRAIN DRYING, AFLATOXIN & FLEET LOGISTICS CARD
 * ==============================================================================
 *
 * Interactive post-harvest engineering card computing:
 *  - Commercial moisture shrinkage & LPG batch column dryer thermal energy
 *  - Equilibrium Relative Humidity (ERH %), water activity (Aw), & Aflatoxin B1 risk
 *  - PICS Triple-Layer Hermetic Bagging storage longevity uplift
 *  - Combine harvester work-rate, shattering loss, & 30-ton silo trailer dispatch
 * ==============================================================================
 */

import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import './PostHarvestDryingAndFleetCard.css';

const CROP_DRYING_DEFAULTS = {
  MAIZE: {
    standardMoisturePct: 13.5,
    safeLongTermMoisturePct: 12.5,
    latentHeatKjKg: 2680,
    bulkDensityKgM3: 745,
    shatteringLossPerDayPct: 0.38,
    baseThreshingLossPct: 2.1,
    aflatoxinFactor: 1.35,
  },
  RICE_PADDY: {
    standardMoisturePct: 14.0,
    safeLongTermMoisturePct: 13.0,
    latentHeatKjKg: 2740,
    bulkDensityKgM3: 585,
    shatteringLossPerDayPct: 0.45,
    baseThreshingLossPct: 2.6,
    aflatoxinFactor: 0.95,
  },
  SOYBEAN: {
    standardMoisturePct: 12.0,
    safeLongTermMoisturePct: 11.0,
    latentHeatKjKg: 2790,
    bulkDensityKgM3: 770,
    shatteringLossPerDayPct: 0.65,
    baseThreshingLossPct: 2.8,
    aflatoxinFactor: 0.85,
  },
  SORGHUM: {
    standardMoisturePct: 13.0,
    safeLongTermMoisturePct: 12.0,
    latentHeatKjKg: 2660,
    bulkDensityKgM3: 755,
    shatteringLossPerDayPct: 0.29,
    baseThreshingLossPct: 1.9,
    aflatoxinFactor: 1.05,
  },
  CASSAVA: {
    standardMoisturePct: 65.0,
    safeLongTermMoisturePct: 12.0,
    latentHeatKjKg: 2520,
    bulkDensityKgM3: 620,
    shatteringLossPerDayPct: 0.85,
    baseThreshingLossPct: 3.8,
    aflatoxinFactor: 0.75,
  },
};

const PostHarvestDryingAndFleetCard = ({
  cropKey = 'MAIZE',
  cropName = 'Hybrid White Maize (SAMMAZ-51)',
  areaHectares = 6.5,
  predictedYieldTonsHa = 4.52,
}) => {
  const spec =
    CROP_DRYING_DEFAULTS[String(cropKey).toUpperCase()] ||
    CROP_DRYING_DEFAULTS.MAIZE;

  const [harvestMoisturePct, setHarvestMoisturePct] = useState(
    Math.min(70, Number((spec.standardMoisturePct + 4.5).toFixed(1)))
  );
  const [siloTemperatureC, setSiloTemperatureC] = useState(29.0);
  const [daysDelayedHarvest, setDaysDelayedHarvest] = useState(2);
  const [activeCombineHarvesters, setActiveCombineHarvesters] = useState(1);
  const [hermeticPicsBagging, setHermeticPicsBagging] = useState(true);

  const postHarvestMetrics = useMemo(() => {
    const areaHa = Math.max(0.5, Number(areaHectares) || 6.5);
    const yieldTonsHa = Math.max(0.5, Number(predictedYieldTonsHa) || 4.5);
    const grossFieldWetTons = areaHa * yieldTonsHa;

    // 1. Combine threshing & delayed harvest shattering loss
    const fieldLossPct = Math.min(
      25,
      spec.baseThreshingLossPct +
        Number(daysDelayedHarvest || 0) * spec.shatteringLossPerDayPct
    );
    const fieldLossTons = grossFieldWetTons * (fieldLossPct / 100);
    const combineRecoveredWetTons = Math.max(0, grossFieldWetTons - fieldLossTons);

    // 2. Moisture shrinkage mass balance
    const moistureIn = Math.max(
      spec.standardMoisturePct,
      Number(harvestMoisturePct) || spec.standardMoisturePct
    );
    const shrinkRatio =
      moistureIn > spec.standardMoisturePct
        ? (100 - moistureIn) / (100 - spec.standardMoisturePct)
        : 1.0;
    const dryStandardNetTons = combineRecoveredWetTons * shrinkRatio;
    const evaporatedWaterKg = Math.max(
      0,
      (combineRecoveredWetTons - dryStandardNetTons) * 1000
    );

    // 3. Thermal drying energy & LPG fuel demand
    const thermalEnergyMj =
      (evaporatedWaterKg * (spec.latentHeatKjKg / 1000)) / 0.58;
    const lpgFuelKg = thermalEnergyMj / 46.1;
    const dryingCostNgn = Math.round(lpgFuelKg * 1250);

    // 4. Equilibrium Relative Humidity (ERH) & Aflatoxin B1 storage safety
    const postDryingMoisture = hermeticPicsBagging
      ? spec.safeLongTermMoisturePct
      : spec.standardMoisturePct + 0.8;
    const erhPct = Math.min(
      98,
      Math.max(
        35,
        58 +
          (postDryingMoisture - spec.safeLongTermMoisturePct) * 4.8 +
          (Number(siloTemperatureC) - 25) * 0.65
      )
    );
    const waterActivityAw = Number((erhPct / 100).toFixed(3));
    const rawRisk =
      (waterActivityAw <= 0.68 ? 14 : 42 + (waterActivityAw - 0.68) * 240) *
      spec.aflatoxinFactor *
      (hermeticPicsBagging ? 0.52 : 1.0);
    const aflatoxinRiskScore = Math.min(100, Math.max(4, Math.round(rawRisk)));

    const safeStorageDays = Math.max(
      7,
      Math.round(
        220 *
          Math.exp(-0.065 * Math.max(0, Number(siloTemperatureC) - 20)) *
          (hermeticPicsBagging ? 1.65 : 0.85)
      )
    );

    // 5. Fleet & bagging evacuation
    const fiftyKgBagsRequired = Math.ceil((dryStandardNetTons * 1000) / 50);
    const thirtyTonTrailersRequired = Math.max(
      1,
      Math.ceil(dryStandardNetTons / 28.5)
    );
    const tenTonCantersRequired = Math.max(
      1,
      Math.ceil(dryStandardNetTons / 9.5)
    );
    const combineHoursRequired = Number(
      (areaHa / (2.85 * Math.max(1, Number(activeCombineHarvesters)))).toFixed(1)
    );

    return {
      grossFieldWetTons: Number(grossFieldWetTons.toFixed(2)),
      fieldLossPct: Number(fieldLossPct.toFixed(2)),
      fieldLossTons: Number(fieldLossTons.toFixed(2)),
      dryStandardNetTons: Number(dryStandardNetTons.toFixed(2)),
      evaporatedWaterKg: Math.round(evaporatedWaterKg),
      thermalEnergyMj: Math.round(thermalEnergyMj),
      lpgFuelKg: Number(lpgFuelKg.toFixed(1)),
      dryingCostNgn,
      erhPct: Number(erhPct.toFixed(1)),
      waterActivityAw,
      aflatoxinRiskScore,
      safeStorageDays,
      fiftyKgBagsRequired,
      thirtyTonTrailersRequired,
      tenTonCantersRequired,
      combineHoursRequired,
    };
  }, [
    areaHectares,
    predictedYieldTonsHa,
    spec,
    harvestMoisturePct,
    siloTemperatureC,
    daysDelayedHarvest,
    activeCombineHarvesters,
    hermeticPicsBagging,
  ]);

  return (
    <section
      className="postharvest-fleet-card"
      data-testid="postharvest-drying-fleet-card"
      aria-label="Post-Harvest Grain Drying, Aflatoxin Safety and Fleet Evacuation Planner"
    >
      <header className="postharvest-card-header">
        <div>
          <span className="postharvest-eyebrow">
            POST-HARVEST PSYCHROMETRIC DRYING • AFLATOXIN B1 • SILO FLEET DISPATCH
          </span>
          <h3 className="postharvest-title">
            Grain Drying Energy, Mycotoxin Storage Safety &amp; Evacuation Fleet Planner
          </h3>
          <p className="postharvest-subtitle">
            Cultivar: <strong>{cropName}</strong> • Commercial Target Moisture:{' '}
            <strong>{spec.standardMoisturePct}%</strong> • Safe Silo Moisture:{' '}
            <strong>{spec.safeLongTermMoisturePct}%</strong>
          </p>
        </div>

        <div className="postharvest-safety-badge">
          <span>Aflatoxin B1 Risk Index:</span>
          <strong
            className={
              postHarvestMetrics.aflatoxinRiskScore <= 25
                ? 'emerald'
                : postHarvestMetrics.aflatoxinRiskScore <= 55
                ? 'ochre'
                : 'alert'
            }
            data-testid="aflatoxin-risk-score"
          >
            {postHarvestMetrics.aflatoxinRiskScore}/100 (Aw{' '}
            {postHarvestMetrics.waterActivityAw})
          </strong>
        </div>
      </header>

      <div className="postharvest-controls-grid">
        <div className="ph-control-box">
          <div className="ph-label-row">
            <label htmlFor="ph-moisture-input">Field Harvest Moisture (%)</label>
            <strong>{harvestMoisturePct}%</strong>
          </div>
          <input
            id="ph-moisture-input"
            type="range"
            min="10"
            max="32"
            step="0.5"
            value={harvestMoisturePct}
            onChange={(e) => setHarvestMoisturePct(Number(e.target.value))}
          />
        </div>

        <div className="ph-control-box">
          <div className="ph-label-row">
            <label htmlFor="ph-temp-input">Silo Grain Temperature (°C)</label>
            <strong>{siloTemperatureC}°C</strong>
          </div>
          <input
            id="ph-temp-input"
            type="range"
            min="18"
            max="42"
            step="0.5"
            value={siloTemperatureC}
            onChange={(e) => setSiloTemperatureC(Number(e.target.value))}
          />
        </div>

        <div className="ph-control-box">
          <div className="ph-label-row">
            <label htmlFor="ph-delay-input">Harvest Delay Past R6 Maturity</label>
            <strong>{daysDelayedHarvest} days</strong>
          </div>
          <input
            id="ph-delay-input"
            type="range"
            min="0"
            max="18"
            step="1"
            value={daysDelayedHarvest}
            onChange={(e) => setDaysDelayedHarvest(Number(e.target.value))}
          />
        </div>

        <div className="ph-control-box">
          <div className="ph-label-row">
            <label htmlFor="ph-combine-select">Combine Harvester Units</label>
            <strong>{activeCombineHarvesters} Unit(s)</strong>
          </div>
          <div className="ph-toggle-row">
            <select
              id="ph-combine-select"
              value={activeCombineHarvesters}
              onChange={(e) => setActiveCombineHarvesters(Number(e.target.value))}
            >
              <option value={1}>1 Combine Harvester (6.0m header)</option>
              <option value={2}>2 Combine Harvesters (Tandem)</option>
              <option value={3}>3 Combine Harvesters (Custom Fleet)</option>
            </select>
            <label className="ph-checkbox-label">
              <input
                type="checkbox"
                checked={hermeticPicsBagging}
                onChange={(e) => setHermeticPicsBagging(e.target.checked)}
              />
              PICS Hermetic Bagging
            </label>
          </div>
        </div>
      </div>

      <div className="postharvest-metrics-strip">
        <div className="ph-metric-tile">
          <span className="ph-tile-tag">CLEAN DRY DELIVERABLE TONNAGE</span>
          <strong className="ph-tile-val emerald">
            {postHarvestMetrics.dryStandardNetTons} MT
          </strong>
          <small>
            Field Shattering Loss: {postHarvestMetrics.fieldLossTons} MT (
            {postHarvestMetrics.fieldLossPct}%)
          </small>
        </div>

        <div className="ph-metric-tile">
          <span className="ph-tile-tag">MOISTURE EVAPORATION &amp; LPG FUEL</span>
          <strong className="ph-tile-val ochre">
            {postHarvestMetrics.evaporatedWaterKg.toLocaleString()} kg H₂O
          </strong>
          <small>
            {postHarvestMetrics.lpgFuelKg} kg LPG ({postHarvestMetrics.thermalEnergyMj}{' '}
            MJ • ₦{postHarvestMetrics.dryingCostNgn.toLocaleString()})
          </small>
        </div>

        <div className="ph-metric-tile">
          <span className="ph-tile-tag">SAFE SILO STORAGE HORIZON</span>
          <strong className="ph-tile-val">
            {postHarvestMetrics.safeStorageDays} Days
          </strong>
          <small>
            Inter-granular ERH: {postHarvestMetrics.erhPct}% •{' '}
            {hermeticPicsBagging ? 'Hermetic O₂ Depletion' : 'Standard Woven Poly'}
          </small>
        </div>

        <div className="ph-metric-tile">
          <span className="ph-tile-tag">COMBINE &amp; HAULAGE DISPATCH</span>
          <strong className="ph-tile-val">
            {postHarvestMetrics.combineHoursRequired} Combine Hrs
          </strong>
          <small>
            {postHarvestMetrics.thirtyTonTrailersRequired} × 30t Trailers or{' '}
            {postHarvestMetrics.tenTonCantersRequired} × 10t Canters (
            {postHarvestMetrics.fiftyKgBagsRequired.toLocaleString()} bags)
          </small>
        </div>
      </div>
    </section>
  );
};

PostHarvestDryingAndFleetCard.propTypes = {
  cropKey: PropTypes.string,
  cropName: PropTypes.string,
  areaHectares: PropTypes.number,
  predictedYieldTonsHa: PropTypes.number,
};

export default PostHarvestDryingAndFleetCard;
