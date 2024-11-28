import React from 'react';
import './RootZoneDepletionBucketCanvas.css';

/**
 * RootZoneDepletionBucketCanvas
 * Interactive SVG root-zone soil water balance "bucket" diagram showing:
 *  - Field Capacity (theta_FC) ceiling
 *  - Readily Available Water (RAW) trigger threshold line
 *  - Current Root-Zone Depletion (D_r in mm) vs. Total Available Water (TAW in mm)
 *  - Permanent Wilting Point (theta_WP) floor
 *  - Matric Suction (kPa) & Van Genuchten moisture sliders
 */
const RootZoneDepletionBucketCanvas = ({
  zones = [],
  selectedZone = null,
  onSelectZone = () => {},
  matricSuctionKpa = 46,
  onChangeMatricSuction = () => {},
  referenceEt0MmDay = 6.4,
  onChangeReferenceEt0 = () => {},
}) => {
  const activeZone = selectedZone || (zones.length > 0 ? zones[0] : null);
  const evalData = activeZone?.scheduleEvaluation || {
    cropName: 'Irrigated Roma Tomato',
    textureName: 'Sandy Loam',
    tawMm: 108.0,
    rawMm: 45.4,
    currentDepletionDrMm: 52.3,
    depletionOfTawPct: 48.4,
    currentMoistureVolPct: 16.2,
    waterStressCoeffKs: 0.88,
    actualCropEtcMmDay: 6.5,
    netIrrigationDepthMm: 52.3,
    grossIrrigationDepthMm: 58.1,
    grossWaterVolumeM3: 842,
    daysToNextIrrigationTrigger: 0,
    triggerDecision: 'IRRIGATE_IMMEDIATELY_RAW_EXCEEDED',
  };

  const tawMm = Math.max(10, Number(evalData?.tawMm || 108));
  const rawMm = Math.min(tawMm, Math.max(5, Number(evalData?.rawMm || 45)));
  const currentDepletionMm = Math.min(
    tawMm,
    Math.max(0, Number(evalData?.currentDepletionDrMm || 48))
  );

  // SVG Bucket coordinates (y=40 is Field Capacity, y=240 is Permanent Wilting Point)
  const bucketTopY = 40;
  const bucketHeightPx = 200;
  const rawLineY = bucketTopY + (rawMm / tawMm) * bucketHeightPx;
  const waterSurfaceY = bucketTopY + (currentDepletionMm / tawMm) * bucketHeightPx;
  const remainingWaterHeightPx = Math.max(6, bucketTopY + bucketHeightPx - waterSurfaceY);

  const isStressExceeded = currentDepletionMm >= rawMm;

  return (
    <div
      className="rz-bucket-card"
      data-testid="root-zone-depletion-bucket-canvas"
    >
      <div className="rz-bucket-header">
        <div>
          <span className="rz-bucket-eyebrow">
            FAO-56 ROOT-ZONE SOIL WATER BALANCE ENGINE
          </span>
          <h3 className="rz-bucket-title">
            {activeZone?.zoneName || 'Hadejia-Jama’are Sector B — Drip Tomato'}
          </h3>
        </div>
        <span
          className={`rz-bucket-pill ${
            isStressExceeded ? 'pill-urgent' : 'pill-optimal'
          }`}
          data-testid="bucket-trigger-decision-badge"
        >
          {evalData?.triggerDecision || 'ADEQUATE_MOISTURE_NO_IRRIGATION'}
        </span>
      </div>

      {/* Zone selector tabs */}
      {zones.length > 0 && (
        <div className="rz-zone-tabs" role="tablist" aria-label="Irrigation Zones">
          {zones.map((z) => {
            const isSelected = activeZone?.zoneCode === z.zoneCode;
            return (
              <button
                key={z.zoneCode}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`rz-zone-tab-btn ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectZone(z)}
                data-testid={`select-zone-btn-${z.zoneCode}`}
              >
                <span className="rz-tab-code">{z.zoneCode}</span>
                <span className="rz-tab-crop">{z.cropKey.replace(/_/g, ' ')}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="rz-bucket-visual-grid">
        {/* SVG Soil Profile Bucket */}
        <div className="rz-svg-wrapper">
          <svg
            viewBox="0 0 420 280"
            className="rz-bucket-svg"
            role="img"
            aria-label="Root zone soil moisture depletion bucket diagram"
          >
            <defs>
              <linearGradient id="soilWaterGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#52b788" stopOpacity="0.88" />
                <stop offset="100%" stopColor="#1b4332" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="soilDryZoneGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fefae0" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#dda15e" stopOpacity="0.45" />
              </linearGradient>
            </defs>

            {/* Outer Soil Column */}
            <rect
              x="70"
              y={bucketTopY}
              width="210"
              height={bucketHeightPx}
              rx="12"
              fill="url(#soilDryZoneGrad)"
              stroke="#1b4332"
              strokeWidth="2.5"
            />

            {/* Remaining Water Fill */}
            <rect
              x="72"
              y={waterSurfaceY}
              width="206"
              height={remainingWaterHeightPx}
              rx="10"
              fill="url(#soilWaterGrad)"
              data-testid="svg-remaining-water-rect"
            />

            {/* Field Capacity Line (Top) */}
            <line
              x1="55"
              y1={bucketTopY}
              x2="305"
              y2={bucketTopY}
              stroke="#1b4332"
              strokeWidth="2"
            />
            <text x="312" y={bucketTopY + 4} className="rz-svg-label-bold">
              FC (0 mm Depl.)
            </text>

            {/* RAW Threshold Line */}
            <line
              x1="60"
              y1={rawLineY}
              x2="305"
              y2={rawLineY}
              stroke="#bc6c25"
              strokeWidth="2.5"
              strokeDasharray="6 4"
            />
            <text x="312" y={rawLineY + 4} className="rz-svg-label-ochre">
              RAW ({rawMm.toFixed(1)} mm)
            </text>

            {/* Current Water Level Indicator */}
            <line
              x1="68"
              y1={waterSurfaceY}
              x2="282"
              y2={waterSurfaceY}
              stroke="#081c15"
              strokeWidth="2.5"
            />
            <text
              x="175"
              y={Math.min(228, Math.max(62, waterSurfaceY - 8))}
              textAnchor="middle"
              className="rz-svg-depletion-readout"
            >
              Dr = {currentDepletionMm.toFixed(1)} mm ({evalData.depletionOfTawPct}%)
            </text>

            {/* Permanent Wilting Point Floor */}
            <line
              x1="55"
              y1={bucketTopY + bucketHeightPx}
              x2="305"
              y2={bucketTopY + bucketHeightPx}
              stroke="#991b1b"
              strokeWidth="2"
            />
            <text
              x="312"
              y={bucketTopY + bucketHeightPx + 4}
              className="rz-svg-label-danger"
            >
              PWP (TAW {tawMm.toFixed(1)} mm)
            </text>
          </svg>
        </div>

        {/* Interactive Tensiometer & ET0 Sliders + Readouts */}
        <div className="rz-controls-column">
          <div className="rz-slider-group">
            <label htmlFor="matric-suction-slider" className="rz-slider-label">
              <span>Tensiometer Matric Suction (ψm)</span>
              <strong>{Number(matricSuctionKpa).toFixed(0)} kPa</strong>
            </label>
            <input
              id="matric-suction-slider"
              type="range"
              min="5"
              max="160"
              step="1"
              value={matricSuctionKpa}
              onChange={(e) => onChangeMatricSuction(Number(e.target.value))}
              className="rz-range-input"
              data-testid="matric-suction-slider"
            />
            <div className="rz-slider-scale">
              <span>5 kPa (Wet FC)</span>
              <span>33 kPa (Optimal)</span>
              <span>160 kPa (Dry Stress)</span>
            </div>
          </div>

          <div className="rz-slider-group">
            <label htmlFor="reference-et0-slider" className="rz-slider-label">
              <span>Penman-Monteith Reference ET₀</span>
              <strong>{Number(referenceEt0MmDay).toFixed(1)} mm/day</strong>
            </label>
            <input
              id="reference-et0-slider"
              type="range"
              min="2.5"
              max="10.5"
              step="0.1"
              value={referenceEt0MmDay}
              onChange={(e) => onChangeReferenceEt0(Number(e.target.value))}
              className="rz-range-input"
              data-testid="reference-et0-slider"
            />
          </div>

          <div className="rz-kpi-mini-grid">
            <div className="rz-kpi-box">
              <span className="rz-kpi-label">Volumetric θ(ψ)</span>
              <strong className="rz-kpi-value" data-testid="volumetric-moisture-readout">
                {evalData.currentMoistureVolPct}%
              </strong>
            </div>
            <div className="rz-kpi-box">
              <span className="rz-kpi-label">Stress Factor (Ks)</span>
              <strong className="rz-kpi-value" data-testid="water-stress-ks-readout">
                {evalData.waterStressCoeffKs}
              </strong>
            </div>
            <div className="rz-kpi-box">
              <span className="rz-kpi-label">Gross Refill Depth</span>
              <strong className="rz-kpi-value" data-testid="gross-irrigation-depth-readout">
                {evalData.grossIrrigationDepthMm} mm
              </strong>
            </div>
            <div className="rz-kpi-box">
              <span className="rz-kpi-label">Gross Water Dose</span>
              <strong className="rz-kpi-value" data-testid="gross-water-volume-readout">
                {Number(evalData.grossWaterVolumeM3 || 0).toLocaleString()} m³
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RootZoneDepletionBucketCanvas;
