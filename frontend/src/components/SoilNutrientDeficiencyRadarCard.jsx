/**
 * ==============================================================================
 * AGRILY AGRONOMY DOMAIN - SOIL NUTRIENT DEFICIENCY RADAR COMPONENT
 * ==============================================================================
 * 
 * Architecture Overview:
 * Interactive radial radar card visualizing measured soil macro- and micronutrients
 * against crop-specific agronomical thresholds. Implements Liebig's Law of the
 * Minimum to pinpoint the single nutrient that restricts crop yield potential,
 * accompanied by Soil Fertility Index (SFI), Base Saturation %, and liming alerts.
 * 
 * Nutrients Evaluated:
 * - Nitrogen (N, %)
 * - Available Phosphorus (P2O5, Bray-1 ppm)
 * - Exchangeable Potassium (K, cmol/kg)
 * - Exchangeable Calcium (Ca, cmol/kg)
 * - Exchangeable Magnesium (Mg, cmol/kg)
 * - Sulfate Sulfur (S, ppm)
 * - Zinc (Zn, ppm)
 * - Boron (B, ppm)
 * 
 * Design Standards: Strictly adheres to DESIGN_SYSTEM.md ("Earth & Innovation")
 * 
 * @module components/SoilNutrientDeficiencyRadarCard
 * @version 1.0.0
 * @author Agrily Frontend Engineering Team
 */

import React, { useState, useMemo } from 'react';
import './SoilNutrientDeficiencyRadarCard.css';

// Default Crop Standards
const CROP_BENCHMARKS = Object.freeze({
  MAIZE: {
    name: 'Maize (Grain)',
    optimalPh: '6.0 - 6.8',
    nOptimal: 0.12,
    pOptimal: 15.0,
    kOptimal: 0.40,
    caOptimal: 4.5,
    mgOptimal: 1.5,
    sOptimal: 10.0,
    znOptimal: 2.0,
    bOptimal: 0.5
  },
  TOMATO: {
    name: 'Tomato (Vegetable)',
    optimalPh: '6.0 - 6.8',
    nOptimal: 0.15,
    pOptimal: 25.0,
    kOptimal: 0.50,
    caOptimal: 5.0,
    mgOptimal: 2.0,
    sOptimal: 12.0,
    znOptimal: 2.0,
    bOptimal: 0.6
  },
  CASSAVA: {
    name: 'Cassava (Tuber)',
    optimalPh: '5.5 - 6.5',
    nOptimal: 0.10,
    pOptimal: 12.0,
    kOptimal: 0.40,
    caOptimal: 3.5,
    mgOptimal: 1.2,
    sOptimal: 8.0,
    znOptimal: 1.2,
    bOptimal: 0.3
  },
  RICE: {
    name: 'Rice (Paddy/Upland)',
    optimalPh: '5.5 - 6.5',
    nOptimal: 0.14,
    pOptimal: 16.0,
    kOptimal: 0.38,
    caOptimal: 4.0,
    mgOptimal: 1.5,
    sOptimal: 12.0,
    znOptimal: 2.5,
    bOptimal: 0.4
  },
  YAM: {
    name: 'Yam (Tuber)',
    optimalPh: '6.0 - 6.8',
    nOptimal: 0.12,
    pOptimal: 14.0,
    kOptimal: 0.48,
    caOptimal: 4.5,
    mgOptimal: 1.6,
    sOptimal: 10.0,
    znOptimal: 1.8,
    bOptimal: 0.4
  }
});

const NUTRIENT_DEFINITIONS = [
  { key: 'n', label: 'Nitrogen (N)', symbol: 'N', unit: '%', optKey: 'nOptimal', measKey: 'totalNitrogenPct', defaultMeas: 0.08 },
  { key: 'p', label: 'Phosphorus (P)', symbol: 'P', unit: 'ppm', optKey: 'pOptimal', measKey: 'availablePhosphorusBray1MgPerKg', defaultMeas: 10.0 },
  { key: 'k', label: 'Potassium (K)', symbol: 'K', unit: 'cmol/kg', optKey: 'kOptimal', measKey: 'exchangeablePotassiumK', defaultMeas: 0.28 },
  { key: 'ca', label: 'Calcium (Ca)', symbol: 'Ca', unit: 'cmol/kg', optKey: 'caOptimal', measKey: 'exchangeableCalciumCa', defaultMeas: 3.8 },
  { key: 'mg', label: 'Magnesium (Mg)', symbol: 'Mg', unit: 'cmol/kg', optKey: 'mgOptimal', measKey: 'exchangeableMagnesiumMg', defaultMeas: 1.2 },
  { key: 's', label: 'Sulfur (S)', symbol: 'S', unit: 'ppm', optKey: 'sOptimal', measKey: 'sulfateSulfurMgPerKg', defaultMeas: 7.5 },
  { key: 'zn', label: 'Zinc (Zn)', symbol: 'Zn', unit: 'ppm', optKey: 'znOptimal', measKey: 'zincPpm', defaultMeas: 1.4 },
  { key: 'b', label: 'Boron (B)', symbol: 'B', unit: 'ppm', optKey: 'bOptimal', measKey: 'boronPpm', defaultMeas: 0.35 }
];

const SoilNutrientDeficiencyRadarCard = ({
  soilChemistry = {},
  initialCrop = 'MAIZE',
  onCropChange = null
}) => {
  const [selectedCrop, setSelectedCrop] = useState(initialCrop);

  const cropBenchmark = useMemo(() => {
    return CROP_BENCHMARKS[selectedCrop] || CROP_BENCHMARKS.MAIZE;
  }, [selectedCrop]);

  const handleCropSelect = (crop) => {
    setSelectedCrop(crop);
    if (onCropChange) onCropChange(crop);
  };

  // Safe extraction of chemistry values with fallbacks
  const ph = Number(soilChemistry?.phWater || 6.2);
  const cations = soilChemistry?.exchangeableCations || {};
  const ca = Number(cations.calciumCa ?? soilChemistry?.exchangeableCalciumCa ?? 3.8);
  const mg = Number(cations.magnesiumMg ?? soilChemistry?.exchangeableMagnesiumMg ?? 1.2);
  const k = Number(cations.potassiumK ?? soilChemistry?.exchangeablePotassiumK ?? 0.28);
  const na = Number(cations.sodiumNa ?? soilChemistry?.exchangeableSodiumNa ?? 0.05);
  const acidity = Number(soilChemistry?.exchangeableAcidityAlPlusH ?? 0.2);

  // ECEC and Base Saturation
  const sumBases = ca + mg + k + na;
  const ecec = Number((sumBases + acidity).toFixed(2));
  const baseSaturationPct = ecec > 0 ? Number(((sumBases / ecec) * 100).toFixed(1)) : 75.0;

  // Compute Nutrient Satisfaction Ratios & Liebig's Minimum
  const { nutrientMetrics, liebigLimiting, sfiScore } = useMemo(() => {
    const metrics = NUTRIENT_DEFINITIONS.map((def) => {
      let measured = Number(soilChemistry?.[def.measKey]);
      if (isNaN(measured) || measured === undefined) {
        if (def.key === 'ca') measured = ca;
        else if (def.key === 'mg') measured = mg;
        else if (def.key === 'k') measured = k;
        else measured = def.defaultMeas;
      }

      const optimal = Number(cropBenchmark[def.optKey]) || 1.0;
      const ratio = measured / optimal;
      const satisfactionPct = Math.min(150, Math.round(ratio * 100));

      let tier = 'OPTIMAL';
      let tierColor = '#2d6a4f'; // Emerald

      if (satisfactionPct < 60) {
        tier = 'CRITICAL_DEFICIT';
        tierColor = '#dc2626'; // Red
      } else if (satisfactionPct < 85) {
        tier = 'MODERATE_DEFICIT';
        tierColor = '#bc6c25'; // Harvest Ochre
      } else if (satisfactionPct > 130) {
        tier = 'HIGH_SURPLUS';
        tierColor = '#7c3aed'; // Purple
      }

      return {
        ...def,
        measured: Number(measured.toFixed(2)),
        optimal,
        ratio: Number(ratio.toFixed(2)),
        satisfactionPct,
        tier,
        tierColor
      };
    });

    // Identify Liebig Minimum
    const sorted = [...metrics].sort((a, b) => a.ratio - b.ratio);
    const limiting = sorted[0];

    // Compute SFI (0-100)
    const nRatio = Math.min(1.0, metrics[0].ratio);
    const pRatio = Math.min(1.0, metrics[1].ratio);
    const kRatio = Math.min(1.0, metrics[2].ratio);
    const microRatio = Math.min(1.0, (metrics[3].ratio + metrics[4].ratio + metrics[5].ratio + metrics[6].ratio + metrics[7].ratio) / 5);
    const sfi = Math.round((nRatio * 25) + (pRatio * 25) + (kRatio * 25) + (microRatio * 25));

    return { nutrientMetrics: metrics, liebigLimiting: limiting, sfiScore: sfi };
  }, [soilChemistry, cropBenchmark, ca, mg, k]);

  // Liming requirement check
  const requiresLiming = ph < 5.5 || baseSaturationPct < 50;
  const requiresSulfur = ph > 7.8;

  // Radar Polygon Coordinates Generator
  const radarChartData = useMemo(() => {
    const centerX = 160;
    const centerY = 160;
    const maxRadius = 110;
    const count = nutrientMetrics.length;
    const angleStep = (Math.PI * 2) / count;

    // 100% threshold circle points
    const optimalPoints = [];
    // Actual measured points
    const measuredPoints = [];
    // Axis line endpoints and labels
    const axisLines = [];

    nutrientMetrics.forEach((item, index) => {
      const angle = (index * angleStep) - (Math.PI / 2); // Start at top

      // Axis Line
      const axisX = centerX + Math.cos(angle) * maxRadius;
      const axisY = centerY + Math.sin(angle) * maxRadius;
      const labelX = centerX + Math.cos(angle) * (maxRadius + 22);
      const labelY = centerY + Math.sin(angle) * (maxRadius + 22);

      axisLines.push({
        x1: centerX,
        y1: centerY,
        x2: axisX,
        y2: axisY,
        labelX,
        labelY,
        symbol: item.symbol,
        label: item.label
      });

      // Optimal 100% point (Radius ratio 1.0)
      const optR = maxRadius * 0.70; // 70% of max is optimal baseline
      optimalPoints.push({
        x: centerX + Math.cos(angle) * optR,
        y: centerY + Math.sin(angle) * optR
      });

      // Measured point scaled
      const cappedRatio = Math.min(1.5, Math.max(0.1, item.ratio));
      const measR = optR * cappedRatio;
      measuredPoints.push({
        x: centerX + Math.cos(angle) * measR,
        y: centerY + Math.sin(angle) * measR,
        color: item.tierColor
      });
    });

    const optSvgPath = optimalPoints.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ') + ' Z';
    const measSvgPath = measuredPoints.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ') + ' Z';

    return { centerX, centerY, maxRadius, axisLines, optSvgPath, measSvgPath, measuredPoints };
  }, [nutrientMetrics]);

  return (
    <div className="soil-nutrient-radar-card" id="soil-nutrient-radar-card">
      <div className="radar-card-header">
        <div className="header-icon-box">
          <span className="radar-icon">🔬</span>
        </div>
        <div className="header-info">
          <h3 className="radar-title">Soil Nutrient Deficiency Radar</h3>
          <p className="radar-subtitle">
            Liebig Law of the Minimum & crop-specific nutritional capacity
          </p>
        </div>
        <div className="crop-selector-container">
          <label htmlFor="radar-crop-select" className="crop-label">Crop Standard:</label>
          <select
            id="radar-crop-select"
            value={selectedCrop}
            onChange={(e) => handleCropSelect(e.target.value)}
            className="radar-crop-select"
          >
            {Object.keys(CROP_BENCHMARKS).map((cKey) => (
              <option key={cKey} value={cKey}>
                {CROP_BENCHMARKS[cKey].name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="radar-card-body">
        {/* SVG Radar Visualizer */}
        <div className="radar-svg-container">
          <svg viewBox="0 0 320 320" className="nutrient-radar-svg" role="img" aria-label="Nutrient Radar Chart">
            {/* Concentric Reference Circles (25%, 50%, 75%, 100%) */}
            {[0.25, 0.5, 0.75, 1.0].map((frac, idx) => (
              <circle
                key={idx}
                cx={radarChartData.centerX}
                cy={radarChartData.centerY}
                r={radarChartData.maxRadius * frac}
                className="radar-grid-circle"
              />
            ))}

            {/* Axis Spokes */}
            {radarChartData.axisLines.map((axis, idx) => (
              <line
                key={idx}
                x1={axis.x1}
                y1={axis.y1}
                x2={axis.x2}
                y2={axis.y2}
                className="radar-axis-line"
              />
            ))}

            {/* Optimal Target Threshold Polygon (100% capacity) */}
            <path
              d={radarChartData.optSvgPath}
              className="radar-optimal-polygon"
            />

            {/* Measured Nutrient Actual Polygon */}
            <path
              d={radarChartData.measSvgPath}
              className="radar-measured-polygon"
            />

            {/* Measured Data Points */}
            {radarChartData.measuredPoints.map((pt, idx) => (
              <circle
                key={idx}
                cx={pt.x}
                cy={pt.y}
                r={5}
                fill={pt.color}
                stroke="#ffffff"
                strokeWidth={2}
                className="radar-data-dot"
              />
            ))}

            {/* Axis Labels */}
            {radarChartData.axisLines.map((axis, idx) => (
              <text
                key={idx}
                x={axis.labelX}
                y={axis.labelY}
                textAnchor="middle"
                dominantBaseline="central"
                className="radar-axis-text"
              >
                {axis.symbol}
              </text>
            ))}
          </svg>

          <div className="radar-legend-bar">
            <span className="legend-item">
              <span className="legend-chip opt-chip"></span> Target 100%
            </span>
            <span className="legend-item">
              <span className="legend-chip meas-chip"></span> Measured Profile
            </span>
          </div>
        </div>

        {/* Nutritional Breakdown Table & SFI Meter */}
        <div className="nutrient-breakdown-panel">
          <div className="sfi-score-card">
            <div className="sfi-text-col">
              <span className="sfi-label">Overall Soil Fertility Index (SFI)</span>
              <span className="sfi-value">{sfiScore} / 100</span>
            </div>
            <div className={`sfi-tier-badge tier-${sfiScore >= 70 ? 'high' : sfiScore >= 45 ? 'med' : 'low'}`}>
              {sfiScore >= 75 ? 'HIGH YIELD CAPACITY' : sfiScore >= 50 ? 'MODERATE FERTILITY' : 'CRITICAL DEFICIT'}
            </div>
          </div>

          <div className="cation-property-row">
            <div className="prop-chip">
              <span className="prop-name">Soil pH</span>
              <span className="prop-val">{ph.toFixed(1)}</span>
            </div>
            <div className="prop-chip">
              <span className="prop-name">ECEC</span>
              <span className="prop-val">{ecec} cmol/kg</span>
            </div>
            <div className="prop-chip">
              <span className="prop-name">Base Saturation</span>
              <span className="prop-val">{baseSaturationPct}%</span>
            </div>
          </div>

          <div className="nutrient-pill-grid">
            {nutrientMetrics.map((item) => (
              <div key={item.key} className={`nutrient-stat-pill status-${item.tier.toLowerCase()}`}>
                <div className="stat-pill-top">
                  <span className="pill-nutrient-symbol">{item.symbol}</span>
                  <span className="pill-pct">{item.satisfactionPct}%</span>
                </div>
                <div className="stat-pill-values">
                  <span>{item.measured} {item.unit}</span>
                  <span className="opt-sub">Opt: {item.optimal}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Liebig's Law of the Minimum Banner */}
      <div className="liebig-limiting-banner">
        <div className="liebig-badge">
          <span className="barrel-icon">🛢️</span>
          <span>LIEBIG LIMITING FACTOR</span>
        </div>
        <p className="liebig-explanation">
          Under Liebig's Law of the Minimum, harvest yield is strictly constrained by <strong>{liebigLimiting.label}</strong>, 
          which stands at only <strong>{liebigLimiting.satisfactionPct}%</strong> of required agronomic capacity. Even with excess Nitrogen or Potassium, yield will not surpass this barrel stave limit.
        </p>
      </div>

      {/* Liming Requirement Banner if Applicable */}
      {requiresLiming && (
        <div className="liming-alert-banner">
          <span className="alert-symbol">⚠️</span>
          <p className="alert-text">
            <strong>Acidic Soil Leaching Detected (pH {ph.toFixed(1)}):</strong> Agricultural Dolomitic Limestone (CaCO3 · MgCO3) amendment is advised at 1.0 – 1.5 metric tons/hectare before planting to neutralize toxic soluble Aluminum (Al3+) and restore cation base balance.
          </p>
        </div>
      )}

      {requiresSulfur && (
        <div className="liming-alert-banner sulfur-alert">
          <span className="alert-symbol">⚠️</span>
          <p className="alert-text">
            <strong>Alkaline Soil (pH {ph.toFixed(1)}):</strong> Elemental sulfur or ammonium sulfate amendment recommended to lower soil reaction and prevent micronutrient (Zinc, Iron) lockout.
          </p>
        </div>
      )}
    </div>
  );
};

export default SoilNutrientDeficiencyRadarCard;
