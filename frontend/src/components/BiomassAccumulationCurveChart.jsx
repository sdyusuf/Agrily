import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import './BiomassAccumulationCurveChart.css';

const PHENOLOGY_STAGES_BY_CROP = {
  MAIZE: [
    { decile: 1, das: 12, gdd: 165, stageCode: 'VE_V2', label: 'Emergence & Early Leaf', lai: 0.45, fPar: 0.24 },
    { decile: 2, das: 24, gdd: 330, stageCode: 'V4_V6', label: 'Nodal Root Expansion', lai: 1.25, fPar: 0.52 },
    { decile: 3, das: 36, gdd: 510, stageCode: 'V8_V10', label: 'Rapid Stem Elongation', lai: 2.40, fPar: 0.76 },
    { decile: 4, das: 48, gdd: 695, stageCode: 'V12_VT', label: 'Tassel Emergence', lai: 3.65, fPar: 0.89 },
    { decile: 5, das: 60, gdd: 880, stageCode: 'R1', label: 'Silking & Pollination (Critical)', lai: 4.25, fPar: 0.93 },
    { decile: 6, das: 72, gdd: 1065, stageCode: 'R2', label: 'Blister Kernel Stage', lai: 4.15, fPar: 0.92 },
    { decile: 7, das: 84, gdd: 1245, stageCode: 'R3_R4', label: 'Milk to Dough Starch Fill', lai: 3.85, fPar: 0.88 },
    { decile: 8, das: 96, gdd: 1420, stageCode: 'R5', label: 'Dent & Milk-Line Progression', lai: 3.20, fPar: 0.81 },
    { decile: 9, das: 108, gdd: 1580, stageCode: 'R6', label: 'Black Layer Physiological Maturity', lai: 2.35, fPar: 0.67 },
    { decile: 10, das: 120, gdd: 1720, stageCode: 'HARV', label: 'Field Dry-Down & Combine Harvest', lai: 1.45, fPar: 0.48 },
  ],
  RICE_PADDY: [
    { decile: 1, das: 13, gdd: 190, stageCode: 'S1_V2', label: 'Seedling Establishment', lai: 0.55, fPar: 0.28 },
    { decile: 2, das: 26, gdd: 380, stageCode: 'V4', label: 'Early Tillering Initiation', lai: 1.45, fPar: 0.56 },
    { decile: 3, das: 39, gdd: 575, stageCode: 'V7', label: 'Active Tillering Flush', lai: 2.80, fPar: 0.81 },
    { decile: 4, das: 52, gdd: 775, stageCode: 'R0_R1', label: 'Panicle Initiation', lai: 4.10, fPar: 0.91 },
    { decile: 5, das: 65, gdd: 970, stageCode: 'R2', label: 'Booting & Flag Leaf Expansion', lai: 4.85, fPar: 0.95 },
    { decile: 6, das: 78, gdd: 1165, stageCode: 'R3_R4', label: 'Heading & Anthesis Flowering', lai: 4.75, fPar: 0.94 },
    { decile: 7, das: 91, gdd: 1360, stageCode: 'R5_R6', label: 'Milk to Soft Dough Curing', lai: 4.30, fPar: 0.90 },
    { decile: 8, das: 104, gdd: 1545, stageCode: 'R7', label: 'Hard Dough Panicle Bending', lai: 3.60, fPar: 0.84 },
    { decile: 9, das: 117, gdd: 1715, stageCode: 'R8', label: 'Physiological Ripening', lai: 2.65, fPar: 0.72 },
    { decile: 10, das: 130, gdd: 1860, stageCode: 'HARV', label: 'Harvest Maturity (14% Moisture)', lai: 1.80, fPar: 0.54 },
  ],
};

const BiomassAccumulationCurveChart = ({
  cropKey = 'MAIZE',
  predictedP50TonsHa = 4.45,
  harvestIndex = 0.48,
  radiationUseEfficiencyGPerMj = 3.65,
}) => {
  const [selectedDecile, setSelectedDecile] = useState(5);
  const [metricView, setMetricView] = useState('BIOMASS_AND_GRAIN');

  const curvePoints = useMemo(() => {
    const baseStages =
      PHENOLOGY_STAGES_BY_CROP[cropKey] || PHENOLOGY_STAGES_BY_CROP.MAIZE;
    const totalDryBiomassTonsHa =
      harvestIndex > 0 ? predictedP50TonsHa / harvestIndex : predictedP50TonsHa * 2.1;

    return baseStages.map((stage) => {
      // Logistic growth curve S(t) = 1 / (1 + exp(-k * (decile - 5.2)))
      const logisticFraction = 1 / (1 + Math.exp(-0.88 * (stage.decile - 5.1)));
      const normalizedFraction = Math.min(1, logisticFraction * 1.02);

      const cumulativeBiomassTonsHa = Number(
        (totalDryBiomassTonsHa * normalizedFraction).toFixed(2)
      );

      // Partitioning to harvestable grain begins post-anthesis (decile >= 5)
      const grainPartitionRatio =
        stage.decile < 5
          ? 0
          : Math.min(1, Math.pow((stage.decile - 4.4) / 5.6, 1.25));
      const harvestableGrainTonsHa = Number(
        (predictedP50TonsHa * grainPartitionRatio).toFixed(2)
      );

      return {
        ...stage,
        cumulativeBiomassTonsHa,
        harvestableGrainTonsHa,
        dailyParInterceptionMjM2: Number((9.2 * stage.fPar).toFixed(2)),
      };
    });
  }, [cropKey, predictedP50TonsHa, harvestIndex]);

  const activePoint =
    curvePoints.find((pt) => pt.decile === selectedDecile) || curvePoints[4];

  const maxBiomass = Math.max(
    1,
    ...curvePoints.map((pt) => pt.cumulativeBiomassTonsHa)
  );

  // SVG coordinates (width 640, height 230)
  const svgWidth = 640;
  const svgHeight = 230;
  const padLeft = 48;
  const padRight = 24;
  const padTop = 22;
  const padBottom = 34;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const getX = (index) => padLeft + (index / (curvePoints.length - 1)) * plotW;
  const getY = (val, maxVal) => padTop + plotH - (val / maxVal) * plotH;

  const biomassPolyline = curvePoints
    .map((pt, idx) => `${getX(idx)},${getY(pt.cumulativeBiomassTonsHa, maxBiomass)}`)
    .join(' ');

  const grainPolyline = curvePoints
    .map((pt, idx) => `${getX(idx)},${getY(pt.harvestableGrainTonsHa, maxBiomass)}`)
    .join(' ');

  const laiPolyline = curvePoints
    .map((pt, idx) => `${getX(idx)},${getY(pt.lai, 5.5)}`)
    .join(' ');

  return (
    <section
      className="biomass-curve-card"
      aria-label="Monteith Radiation Use Efficiency and Biomass Accumulation Curve"
    >
      <header className="biomass-curve-header">
        <div>
          <span className="biomass-eyebrow">
            MONTEITH RADIATION USE EFFICIENCY (RUE = {radiationUseEfficiencyGPerMj} g/MJ)
          </span>
          <h3 className="biomass-title">
            Phenological GDD Thermal-Time &amp; Dry Matter Partitioning Curve
          </h3>
        </div>
        <div className="biomass-view-toggle" role="group" aria-label="Chart metric mode">
          <button
            type="button"
            className={`biomass-toggle-btn ${
              metricView === 'BIOMASS_AND_GRAIN' ? 'active' : ''
            }`}
            onClick={() => setMetricView('BIOMASS_AND_GRAIN')}
          >
            Biomass &amp; Grain (t/ha)
          </button>
          <button
            type="button"
            className={`biomass-toggle-btn ${
              metricView === 'CANOPY_LAI' ? 'active' : ''
            }`}
            onClick={() => setMetricView('CANOPY_LAI')}
          >
            Canopy LAI &amp; fPAR
          </button>
        </div>
      </header>

      <div className="biomass-svg-wrapper">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="biomass-svg-canvas"
          role="img"
          aria-label="Cumulative dry biomass and grain partitioning curve across 10 thermal deciles"
        >
          {/* Horizontal grid lines */}
          {[0.25, 0.5, 0.75, 1].map((ratio) => {
            const yPos = padTop + plotH * (1 - ratio);
            const labelVal =
              metricView === 'BIOMASS_AND_GRAIN'
                ? (maxBiomass * ratio).toFixed(1)
                : (5.5 * ratio).toFixed(1);
            return (
              <g key={ratio}>
                <line
                  x1={padLeft}
                  y1={yPos}
                  x2={svgWidth - padRight}
                  y2={yPos}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                />
                <text
                  x={padLeft - 8}
                  y={yPos + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#475569"
                >
                  {labelVal}
                </text>
              </g>
            );
          })}

          {metricView === 'BIOMASS_AND_GRAIN' ? (
            <>
              <polyline
                fill="none"
                stroke="#1b4332"
                strokeWidth="3"
                points={biomassPolyline}
              />
              <polyline
                fill="none"
                stroke="#bc6c25"
                strokeWidth="3"
                strokeDasharray="6 3"
                points={grainPolyline}
              />
            </>
          ) : (
            <polyline
              fill="none"
              stroke="#2d6a4f"
              strokeWidth="3"
              points={laiPolyline}
            />
          )}

          {/* Interactive decile nodes */}
          {curvePoints.map((pt, idx) => {
            const cx = getX(idx);
            const cy =
              metricView === 'BIOMASS_AND_GRAIN'
                ? getY(pt.cumulativeBiomassTonsHa, maxBiomass)
                : getY(pt.lai, 5.5);
            const isSelected = pt.decile === selectedDecile;
            return (
              <g
                key={pt.decile}
                className="biomass-node-group"
                onClick={() => setSelectedDecile(pt.decile)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={isSelected ? 7 : 4.5}
                  fill={isSelected ? '#bc6c25' : '#2d6a4f'}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <text
                  x={cx}
                  y={svgHeight - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight={isSelected ? '700' : '500'}
                  fill={isSelected ? '#1b4332' : '#475569'}
                >
                  {pt.stageCode}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="biomass-stage-strip" role="tablist" aria-label="Growth stage deciles">
        {curvePoints.map((pt) => (
          <button
            key={pt.decile}
            type="button"
            role="tab"
            aria-selected={pt.decile === selectedDecile}
            className={`biomass-stage-pill ${
              pt.decile === selectedDecile ? 'active' : ''
            }`}
            onClick={() => setSelectedDecile(pt.decile)}
            data-testid={`biomass-decile-btn-${pt.decile}`}
          >
            D{pt.decile}: {pt.stageCode}
          </button>
        ))}
      </div>

      <div className="biomass-inspector-bar">
        <div className="biomass-stat">
          <span className="biomass-stat-label">Selected Phenology Stage</span>
          <strong className="biomass-stat-value" data-testid="active-phenology-stage">
            {activePoint.stageCode} — {activePoint.label}
          </strong>
          <span className="biomass-stat-sub">
            Day {activePoint.das} After Sowing ({activePoint.gdd} °C·d GDD)
          </span>
        </div>

        <div className="biomass-stat">
          <span className="biomass-stat-label">Above-Ground Dry Matter</span>
          <strong className="biomass-stat-value emerald">
            {activePoint.cumulativeBiomassTonsHa} t/ha
          </strong>
          <span className="biomass-stat-sub">
            Canopy LAI: {activePoint.lai} (fPAR {(activePoint.fPar * 100).toFixed(0)}%)
          </span>
        </div>

        <div className="biomass-stat">
          <span className="biomass-stat-label">Partitioned Grain Yield</span>
          <strong className="biomass-stat-value ochre">
            {activePoint.harvestableGrainTonsHa} t/ha
          </strong>
          <span className="biomass-stat-sub">
            Target Harvest Index (HI): {harvestIndex}
          </span>
        </div>
      </div>
    </section>
  );
};

BiomassAccumulationCurveChart.propTypes = {
  cropKey: PropTypes.string,
  predictedP50TonsHa: PropTypes.number,
  harvestIndex: PropTypes.number,
  radiationUseEfficiencyGPerMj: PropTypes.number,
};

export default BiomassAccumulationCurveChart;
