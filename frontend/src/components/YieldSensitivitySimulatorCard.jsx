/**
 * ==============================================================================
 * 🌾 AGRILY HARVEST YIELD PREDICTOR: WHAT-IF SENSITIVITY & SHAP ATTRIBUTION CARD
 * ==============================================================================
 *
 * Interactive sensitivity simulator allowing farmers and agronomists to adjust:
 *  - Peak Canopy NDVI (0.30 - 0.90)
 *  - Seasonal Rainfall + Irrigation Supply (mm)
 *  - Applied Nitrogen Fertilizer (kg N/ha)
 *  - Phytosanitary Pest / Disease Loss (%)
 * Displays SHAP-style feature attributions and Monte Carlo P10/P50/P90 bands.
 * ==============================================================================
 */

import React, { useState } from 'react';
import './YieldSensitivitySimulatorCard.css';
import { FlaskIcon, ZapIcon, TargetIcon } from './Icons';

export default function YieldSensitivitySimulatorCard({
  prediction = {},
  monteCarlo = {},
  cropType = 'Maize',
  cultivarCode = 'SAMMAZ-15',
  areaHectares = 24.5,
  onRunSimulation
}) {
  const [peakNdvi, setPeakNdvi] = useState(0.79);
  const [seasonalRainfallMm, setSeasonalRainfallMm] = useState(650);
  const [appliedNitrogenKgHa, setAppliedNitrogenKgHa] = useState(120);
  const [pestDiseaseLossPct, setPestDiseaseLossPct] = useState(3.5);

  const safeAttributions =
    Array.isArray(prediction?.featureAttributions) && prediction.featureAttributions.length > 0
      ? prediction.featureAttributions
      : [
          { featureName: 'Canopy Vigor (Peak NDVI & fPAR)', contributionTonsPerHa: 0.42, importanceWeightPct: 34 },
          { featureName: 'Soil Moisture & FAO-33 ET Supply', contributionTonsPerHa: 0.28, importanceWeightPct: 26 },
          { featureName: 'Mitscherlich N-P-K Fertility Uptake', contributionTonsPerHa: 0.21, importanceWeightPct: 22 },
          { featureName: 'Plant Stand Density & Canopy Closure', contributionTonsPerHa: 0.11, importanceWeightPct: 11 },
          { featureName: 'Phytosanitary Pest/Pathology Retention', contributionTonsPerHa: -0.21, importanceWeightPct: 7 }
        ];

  const handleTriggerSimulate = (e) => {
    e.preventDefault();
    if (typeof onRunSimulation === 'function') {
      onRunSimulation({
        cropType,
        cultivarCode,
        areaHectares,
        peakNdvi: Number(peakNdvi),
        seasonalRainfallMm: Number(seasonalRainfallMm),
        appliedNitrogenKgHa: Number(appliedNitrogenKgHa),
        pestDiseaseLossPct: Number(pestDiseaseLossPct)
      });
    }
  };

  return (
    <div className="yield-simulator-card" data-testid="yield-sensitivity-simulator-card">
      <div className="simulator-card-header">
        <div>
          <span className="simulator-eyebrow">
            <FlaskIcon size={14} /> MONTEITH-RIDGE ENSEMBLE &bull; WHAT-IF SENSITIVITY ENGINE
          </span>
          <h3 className="simulator-card-title">
            Agronomic Input Sensitivity &amp; Monte Carlo Confidence Fan
          </h3>
          <p className="simulator-card-subtitle">
            Perturb fertilizer N-rate, irrigation water supply, and canopy NDVI to simulate harvest tonnage response
          </p>
        </div>

        <div className="mc-confidence-pill" data-testid="monte-carlo-confidence-badge">
          <TargetIcon size={15} />
          <span>
            Monte Carlo Confidence: <strong>{monteCarlo?.confidenceScorePct ?? 89}%</strong> (CV{' '}
            {monteCarlo?.coefficientOfVariationPct ?? 11.2}%)
          </span>
        </div>
      </div>

      {/* Monte Carlo P10 / P50 / P90 Quantile Strip */}
      <div className="monte-carlo-quantile-grid" data-testid="monte-carlo-quantile-strip">
        <div className="quantile-box p10">
          <span className="quantile-tag">P10 Downside (Drought/Shock)</span>
          <strong className="quantile-main">
            {monteCarlo?.p10DownsideTonsPerHa ?? 5.12} t/ha
          </strong>
          <small>
            Total: {monteCarlo?.p10TotalTonnage ?? 125.4} MT &bull; &#8358;
            {Number(monteCarlo?.p10GrossRevenueNgn ?? 85272000).toLocaleString()}
          </small>
        </div>

        <div className="quantile-box p50">
          <span className="quantile-tag">P50 Median Expected Harvest</span>
          <strong className="quantile-main">
            {monteCarlo?.p50MedianTonsPerHa ?? prediction?.predictedYieldTonsPerHa ?? 6.14} t/ha
          </strong>
          <small>
            Total: {monteCarlo?.p50TotalTonnage ?? prediction?.totalHarvestTonnage ?? 150.4} MT &bull; &#8358;
            {Number(
              monteCarlo?.p50GrossRevenueNgn ?? prediction?.projectedGrossRevenueNgn ?? 102272000
            ).toLocaleString()}
          </small>
        </div>

        <div className="quantile-box p90">
          <span className="quantile-tag">P90 Upside (Optimal Radiation)</span>
          <strong className="quantile-main">
            {monteCarlo?.p90UpsideTonsPerHa ?? 7.08} t/ha
          </strong>
          <small>
            Total: {monteCarlo?.p90TotalTonnage ?? 173.5} MT &bull; &#8358;
            {Number(monteCarlo?.p90GrossRevenueNgn ?? 117980000).toLocaleString()}
          </small>
        </div>
      </div>

      <div className="simulator-split-layout">
        <form onSubmit={handleTriggerSimulate} className="simulator-controls-form">
          <h4 className="simulator-subheading">Interactive Management Levers</h4>

          <div className="slider-control-group">
            <div className="slider-label-row">
              <label htmlFor="sim-ndvi-slider">Peak Canopy NDVI (fPAR)</label>
              <strong>{peakNdvi}</strong>
            </div>
            <input
              id="sim-ndvi-slider"
              type="range"
              min="0.30"
              max="0.90"
              step="0.01"
              value={peakNdvi}
              onChange={(e) => setPeakNdvi(e.target.value)}
              data-testid="sim-ndvi-slider"
            />
          </div>

          <div className="slider-control-group">
            <div className="slider-label-row">
              <label htmlFor="sim-rain-slider">Seasonal Water Supply (Rain + Irrigation)</label>
              <strong>{seasonalRainfallMm} mm</strong>
            </div>
            <input
              id="sim-rain-slider"
              type="range"
              min="250"
              max="1400"
              step="10"
              value={seasonalRainfallMm}
              onChange={(e) => setSeasonalRainfallMm(e.target.value)}
              data-testid="sim-rainfall-slider"
            />
          </div>

          <div className="slider-control-group">
            <div className="slider-label-row">
              <label htmlFor="sim-nitrogen-slider">Applied Nitrogen Rate (Urea + NPK)</label>
              <strong>{appliedNitrogenKgHa} kg N/ha</strong>
            </div>
            <input
              id="sim-nitrogen-slider"
              type="range"
              min="15"
              max="200"
              step="5"
              value={appliedNitrogenKgHa}
              onChange={(e) => setAppliedNitrogenKgHa(e.target.value)}
              data-testid="sim-nitrogen-slider"
            />
          </div>

          <div className="slider-control-group">
            <div className="slider-label-row">
              <label htmlFor="sim-pest-slider">Estimated Pest / Pathology Defoliation</label>
              <strong>{pestDiseaseLossPct}%</strong>
            </div>
            <input
              id="sim-pest-slider"
              type="range"
              min="0"
              max="45"
              step="0.5"
              value={pestDiseaseLossPct}
              onChange={(e) => setPestDiseaseLossPct(e.target.value)}
              data-testid="sim-pest-slider"
            />
          </div>

          <button
            type="submit"
            className="run-simulation-cta-btn"
            data-testid="run-yield-simulation-btn"
          >
            <ZapIcon size={16} /> Recompute Ensemble Yield Forecast
          </button>
        </form>

        <div className="shap-attributions-panel" data-testid="shap-feature-attributions">
          <h4 className="simulator-subheading">Ridge &amp; Mechanistic Feature Importance</h4>
          <div className="shap-bars-list">
            {safeAttributions.map((feat, idx) => (
              <div key={feat.featureName || idx} className="shap-bar-item">
                <div className="shap-bar-top">
                  <span className="shap-feature-name">{feat.featureName}</span>
                  <span className="shap-weight-tag">
                    Weight {feat.importanceWeightPct}% ({feat.contributionTonsPerHa >= 0 ? '+' : ''}
                    {feat.contributionTonsPerHa} t/ha)
                  </span>
                </div>
                <div className="shap-progress-track">
                  <div
                    className="shap-progress-fill"
                    style={{ width: `${Math.min(100, feat.importanceWeightPct * 2.4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

