/**
 * ==============================================================================
 * AGRILY AGRONOMY DOMAIN - USDA SOIL TEXTURE TERNARY TRIANGLE CANVAS
 * ==============================================================================
 * 
 * Architecture Overview:
 * Interactive HTML5 Canvas component visualizing the USDA Soil Textural Triangle
 * via ternary coordinate projection. Allows farmers and agronomists to input or
 * interactively select Sand, Silt, and Clay percentages and immediately see the
 * classified textural domain, hydraulic retention properties, and tillage behavior.
 * 
 * Mathematical Formulation (Equilateral Ternary Projection):
 * For point with Sand S, Silt Si, and Clay C (S + Si + C = 100%):
 * y = H \cdot (1 - C / 100)
 * x = \frac{W}{2} \cdot \left(1 + \frac{Si - S}{100}\right)
 * 
 * Design Standards: Strictly adheres to DESIGN_SYSTEM.md ("Earth & Innovation")
 * 
 * @module components/SoilTextureTriangleCanvas
 * @version 1.0.0
 * @author Agrily Frontend Engineering Team
 */

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import './SoilTextureTriangleCanvas.css';

// 12 Standard USDA Textural Classes with Agronomic Metadata
export const USDA_TEXTURE_DATA = Object.freeze({
  SAND: {
    label: 'Sand',
    color: '#faedcd',
    borderColor: '#d4a373',
    drainage: 'Rapid (High Leaching)',
    aeration: 'Excessive',
    waterHolding: 'Very Low (50-80 mm/m)',
    tillage: 'Extremely Easy',
    advisory: 'Prone to rapid drought stress and severe nitrogen/potassium leaching. Requires heavy organic matter amendments.'
  },
  LOAMY_SAND: {
    label: 'Loamy Sand',
    color: '#fefae0',
    borderColor: '#e9edc9',
    drainage: 'Rapid',
    aeration: 'High',
    waterHolding: 'Low (80-110 mm/m)',
    tillage: 'Easy',
    advisory: 'Minimal nutrient buffering capacity. Split fertilizer applications recommended to prevent nutrient loss.'
  },
  SANDY_LOAM: {
    label: 'Sandy Loam',
    color: '#e9edc9',
    borderColor: '#ccd5ae',
    drainage: 'Well-Drained',
    aeration: 'Good',
    waterHolding: 'Moderate (110-150 mm/m)',
    tillage: 'Ideal / Easy',
    advisory: 'Premier arable soil for cereals, legumes, and root tubers across Northern and Southern Guinea Savannas.'
  },
  LOAM: {
    label: 'Loam',
    color: '#d8f3dc',
    borderColor: '#95d5b2',
    drainage: 'Optimal / Balanced',
    aeration: 'Optimal',
    waterHolding: 'High (150-190 mm/m)',
    tillage: 'Optimal',
    advisory: 'Equally balanced physical matrix. Outstanding microbial activity and uniform nutrient bioavailability.'
  },
  SILT_LOAM: {
    label: 'Silt Loam',
    color: '#b7e4c7',
    borderColor: '#74c69d',
    drainage: 'Moderate',
    aeration: 'Moderate',
    waterHolding: 'Very High (180-220 mm/m)',
    tillage: 'Moderate (Surface Crusting Risk)',
    advisory: 'High water retention but prone to topsoil compaction and surface crusting under torrential tropical rain.'
  },
  SILT: {
    label: 'Silt',
    color: '#95d5b2',
    borderColor: '#52b788',
    drainage: 'Moderate to Slow',
    aeration: 'Moderate',
    waterHolding: 'Very High (190-230 mm/m)',
    tillage: 'Prone to Erosion',
    advisory: 'Silky smooth texture. Susceptible to wind and gully erosion; maintain permanent vegetative mulch.'
  },
  SANDY_CLAY_LOAM: {
    label: 'Sandy Clay Loam',
    color: '#ffe5d9',
    borderColor: '#ffcad4',
    drainage: 'Moderate',
    aeration: 'Moderate',
    waterHolding: 'Good (140-180 mm/m)',
    tillage: 'Moderate Resistance',
    advisory: 'Resilient physical structure with good cation exchange capacity. Common in Middle Belt transition zones.'
  },
  CLAY_LOAM: {
    label: 'Clay Loam',
    color: '#ffccd5',
    borderColor: '#ffb3c1',
    drainage: 'Moderately Slow',
    aeration: 'Moderate to Low',
    waterHolding: 'High (160-200 mm/m)',
    tillage: 'Heavy when Wet',
    advisory: 'High natural nutrient reserves. Excellent for commercial rice paddies and moisture-retentive maize cultivation.'
  },
  SILTY_CLAY_LOAM: {
    label: 'Silty Clay Loam',
    color: '#e2ece9',
    borderColor: '#b4c5e4',
    drainage: 'Slow',
    aeration: 'Low',
    waterHolding: 'High (170-210 mm/m)',
    tillage: 'Sticky when Moist',
    advisory: 'Subject to waterlogging during peak monsoon precipitation. Subsurface drainage recommended.'
  },
  SANDY_CLAY: {
    label: 'Sandy Clay',
    color: '#dfccf1',
    borderColor: '#be95c4',
    drainage: 'Slow',
    aeration: 'Low',
    waterHolding: 'Moderate (130-170 mm/m)',
    tillage: 'Hard when Dry, Plastic when Wet',
    advisory: 'Narrow workable moisture window for mechanized disc plowing. Incorporate biochar to improve pore continuity.'
  },
  SILTY_CLAY: {
    label: 'Silty Clay',
    color: '#d6e2e9',
    borderColor: '#99c1de',
    drainage: 'Very Slow',
    aeration: 'Very Low',
    waterHolding: 'High (160-190 mm/m)',
    tillage: 'Difficult',
    advisory: 'Dense swelling clay. Outstanding for lowland swamp rice and sugar cane; requires raised bed seed ridges.'
  },
  CLAY: {
    label: 'Clay (Vertisol / Ultisol)',
    color: '#f0efeb',
    borderColor: '#c6ac8f',
    drainage: 'Impeded / Ponding',
    aeration: 'Poor (Anaerobic Risk)',
    waterHolding: 'Extremely High (170-220 mm/m)',
    tillage: 'Very Difficult (Deep Cracking)',
    advisory: 'Very high cation retention but high risk of root asphyxiation during waterlogging. Deep chisel subsoiling advised.'
  }
});

// Nigerian Regional Preset Textures
export const NIGERIAN_TEXTURE_PRESETS = [
  { name: 'Sahel Sand (Borno/Yobe)', sand: 90, silt: 5, clay: 5, code: 'SAND' },
  { name: 'Sudan Sandy Loam (Kano/Katsina)', sand: 68, silt: 20, clay: 12, code: 'SANDY_LOAM' },
  { name: 'Guinea Savanna Loam (Kaduna/Plateau)', sand: 45, silt: 35, clay: 20, code: 'LOAM' },
  { name: 'Rainforest Clay Loam (Oyo/Edo)', sand: 32, silt: 34, clay: 34, code: 'CLAY_LOAM' },
  { name: 'Coastal Silty Clay (Delta/Rivers)', sand: 12, silt: 48, clay: 40, code: 'SILTY_CLAY' }
];

export function classifyTextureClass(sand = 0, silt = 0, clay = 0) {
  const s = Number(sand) || 0;
  const si = Number(silt) || 0;
  const c = Number(clay) || 0;

  if (silt + 1.5 * clay < 15) return 'SAND';
  if (silt + 2 * clay < 30) return 'LOAMY_SAND';
  if ((clay >= 7 && clay < 20) && (s > 52) && (silt + 2 * clay >= 30)) return 'SANDY_LOAM';
  if (clay < 7 && silt < 50 && (silt + 2 * clay >= 30)) return 'SANDY_LOAM';

  if (clay >= 40) {
    if (c >= 40 && s <= 45 && si < 40) return 'CLAY';
    if (c >= 40 && si >= 40) return 'SILTY_CLAY';
    if (c >= 35 && s >= 45) return 'SANDY_CLAY';
    return 'CLAY';
  }

  if (clay >= 27 && clay < 40) {
    if (s <= 20) return 'SILTY_CLAY_LOAM';
    if (s > 45) return 'SANDY_CLAY_LOAM';
    return 'CLAY_LOAM';
  }

  if (silt >= 80 && clay < 12) return 'SILT';
  if ((silt >= 50 && (clay >= 12 && clay < 27)) || (silt >= 50 && silt < 80 && clay < 12)) return 'SILT_LOAM';
  if (clay >= 7 && clay < 27 && silt >= 28 && silt < 50 && s <= 52) return 'LOAM';

  return 'LOAM';
}

const SoilTextureTriangleCanvas = ({
  initialSand = 60,
  initialSilt = 25,
  initialClay = 15,
  onTextureChange = null,
  readOnly = false
}) => {
  const canvasRef = useRef(null);

  const [sand, setSand] = useState(initialSand);
  const [silt, setSilt] = useState(initialSilt);
  const [clay, setClay] = useState(initialClay);
  const [activeClass, setActiveClass] = useState('SANDY_LOAM');
  const [isHovered, setIsHovered] = useState(false);

  // Sync with initial props if they update externally
  useEffect(() => {
    setSand(initialSand);
    setSilt(initialSilt);
    setClay(initialClay);
  }, [initialSand, initialSilt, initialClay]);

  // Compute textural classification and trigger callback
  useEffect(() => {
    const computedClass = classifyTextureClass(sand, silt, clay);
    setActiveClass(computedClass);
    if (onTextureChange) {
      onTextureChange({
        sandPercentage: sand,
        siltPercentage: silt,
        clayPercentage: clay,
        texturalClass: computedClass,
        details: USDA_TEXTURE_DATA[computedClass] || USDA_TEXTURE_DATA.LOAM
      });
    }
  }, [sand, silt, clay, onTextureChange]);

  // Update Sand slider and dynamically balance Silt/Clay
  const handleSandChange = (newSand) => {
    const s = Math.min(100, Math.max(0, Number(newSand)));
    const remaining = 100 - s;
    const currentSubtotal = silt + clay;
    let newSilt, newClay;

    if (currentSubtotal === 0) {
      newSilt = Math.round(remaining / 2);
      newClay = remaining - newSilt;
    } else {
      const siltRatio = silt / currentSubtotal;
      newSilt = Math.round(remaining * siltRatio);
      newClay = remaining - newSilt;
    }

    setSand(s);
    setSilt(newSilt);
    setClay(newClay);
  };

  // Update Silt slider and balance
  const handleSiltChange = (newSilt) => {
    const si = Math.min(100, Math.max(0, Number(newSilt)));
    const remaining = 100 - si;
    const currentSubtotal = sand + clay;
    let newSand, newClay;

    if (currentSubtotal === 0) {
      newSand = Math.round(remaining / 2);
      newClay = remaining - newSand;
    } else {
      const sandRatio = sand / currentSubtotal;
      newSand = Math.round(remaining * sandRatio);
      newClay = remaining - newSand;
    }

    setSilt(si);
    setSand(newSand);
    setClay(newClay);
  };

  // Update Clay slider and balance
  const handleClayChange = (newClay) => {
    const c = Math.min(100, Math.max(0, Number(newClay)));
    const remaining = 100 - c;
    const currentSubtotal = sand + silt;
    let newSand, newSilt;

    if (currentSubtotal === 0) {
      newSand = Math.round(remaining / 2);
      newSilt = remaining - newSand;
    } else {
      const sandRatio = sand / currentSubtotal;
      newSand = Math.round(remaining * sandRatio);
      newSilt = remaining - newSand;
    }

    setClay(c);
    setSand(newSand);
    setSilt(newSilt);
  };

  // Preset selector
  const applyPreset = (preset) => {
    setSand(preset.sand);
    setSilt(preset.silt);
    setClay(preset.clay);
  };

  // Draw HTML5 Canvas Ternary Diagram
  const drawTriangle = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Padding
    const pad = 48;
    const triangleW = width - pad * 2;
    const triangleH = height - pad * 2;

    // Equilateral Triangle Vertices:
    // Top Vertex: (width / 2, pad) -> 100% Clay
    // Bottom Left: (pad, pad + triangleH) -> 100% Sand
    // Bottom Right: (width - pad, pad + triangleH) -> 100% Silt
    const pClay = { x: width / 2, y: pad };
    const pSand = { x: pad, y: pad + triangleH };
    const pSilt = { x: width - pad, y: pad + triangleH };

    // Function to map (Sand, Silt, Clay) to Canvas (x, y)
    const ternaryToCanvas = (s, si, c) => {
      // Normalize sum
      const total = s + si + c || 100;
      const normS = (s / total) * 100;
      const normSi = (si / total) * 100;
      const normC = (c / total) * 100;

      const y = pClay.y + (triangleH * (1 - normC / 100));
      const x = (width / 2) + ((triangleW / 2) * ((normSi - normS) / 100));
      return { x, y };
    };

    // 1. Draw Background Triangle Base
    ctx.beginPath();
    ctx.moveTo(pClay.x, pClay.y);
    ctx.lineTo(pSand.x, pSand.y);
    ctx.lineTo(pSilt.x, pSilt.y);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#2d6a4f';
    ctx.stroke();

    // 2. Draw Subtle Grid Lines (every 20%)
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = '#e2e8f0';

    for (let pct = 20; pct <= 80; pct += 20) {
      // Constant Clay horizontal line
      const ptC1 = ternaryToCanvas(100 - pct, 0, pct);
      const ptC2 = ternaryToCanvas(0, 100 - pct, pct);
      ctx.beginPath();
      ctx.moveTo(ptC1.x, ptC1.y);
      ctx.lineTo(ptC2.x, ptC2.y);
      ctx.stroke();

      // Constant Sand line
      const ptS1 = ternaryToCanvas(pct, 0, 100 - pct);
      const ptS2 = ternaryToCanvas(pct, 100 - pct, 0);
      ctx.beginPath();
      ctx.moveTo(ptS1.x, ptS1.y);
      ctx.lineTo(ptS2.x, ptS2.y);
      ctx.stroke();

      // Constant Silt line
      const ptSi1 = ternaryToCanvas(0, pct, 100 - pct);
      const ptSi2 = ternaryToCanvas(100 - pct, pct, 0);
      ctx.beginPath();
      ctx.moveTo(ptSi1.x, ptSi1.y);
      ctx.lineTo(ptSi2.x, ptSi2.y);
      ctx.stroke();
    }

    // 3. Highlight Region for Active Textural Class
    const currentMeta = USDA_TEXTURE_DATA[activeClass] || USDA_TEXTURE_DATA.LOAM;

    // 4. Vertex Labels
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillStyle = '#1b4332';
    ctx.textAlign = 'center';
    ctx.fillText('100% CLAY', pClay.x, pClay.y - 14);

    ctx.fillStyle = '#bc6c25';
    ctx.textAlign = 'right';
    ctx.fillText('100% SAND', pSand.x + 10, pSand.y + 26);

    ctx.fillStyle = '#2d6a4f';
    ctx.textAlign = 'left';
    ctx.fillText('100% SILT', pSilt.x - 10, pSilt.y + 26);

    // 5. Draw Selected Ternary Coordinate Point
    const userPoint = ternaryToCanvas(sand, silt, clay);

    // Projection dashed lines to triangle edges
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;

    // To Clay axis (horizontal)
    ctx.strokeStyle = 'rgba(27, 67, 50, 0.4)';
    ctx.beginPath();
    ctx.moveTo(userPoint.x, userPoint.y);
    ctx.lineTo(userPoint.x + 40, userPoint.y);
    ctx.stroke();

    // To Sand axis
    ctx.strokeStyle = 'rgba(188, 108, 37, 0.4)';
    ctx.beginPath();
    ctx.moveTo(userPoint.x, userPoint.y);
    ctx.lineTo(userPoint.x - 30, userPoint.y + 30);
    ctx.stroke();

    ctx.setLineDash([]); // Reset line dash

    // Outer pulsating glow circle
    ctx.beginPath();
    ctx.arc(userPoint.x, userPoint.y, 14, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(82, 183, 136, 0.25)';
    ctx.fill();

    // Inner marker point
    ctx.beginPath();
    ctx.arc(userPoint.x, userPoint.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#1b4332';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Floating Coordinate Tag
    const tagText = `${sand}%S · ${silt}%Si · ${clay}%C`;
    ctx.font = 'bold 11px Inter, sans-serif';
    const tagWidth = ctx.measureText(tagText).width + 16;
    const tagX = Math.min(width - tagWidth - 10, Math.max(10, userPoint.x - tagWidth / 2));
    const tagY = userPoint.y - 18;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(tagX, tagY - 14, tagWidth, 20, 6);
    ctx.fill();

    ctx.fillStyle = '#f8faf9';
    ctx.textAlign = 'center';
    ctx.fillText(tagText, tagX + tagWidth / 2, tagY);

  }, [sand, silt, clay, activeClass]);

  useEffect(() => {
    drawTriangle();
  }, [drawTriangle]);

  const activeMetadata = USDA_TEXTURE_DATA[activeClass] || USDA_TEXTURE_DATA.LOAM;

  return (
    <div className="soil-texture-card" id="soil-texture-triangle-card">
      <div className="soil-texture-header">
        <div className="header-icon-badge">
          <span className="texture-icon">📐</span>
        </div>
        <div className="header-text-block">
          <h3 className="texture-card-title">USDA Soil Textural Triangle</h3>
          <p className="texture-card-subtitle">
            Ternary physical fraction modeling & textural domain classification
          </p>
        </div>
        <div className="active-texture-pill" style={{ borderColor: activeMetadata.borderColor }}>
          <span className="pill-dot" style={{ backgroundColor: activeMetadata.borderColor }}></span>
          <span className="pill-label">{activeMetadata.label}</span>
        </div>
      </div>

      <div className="soil-texture-body">
        {/* Canvas Ternary Visualization */}
        <div className="canvas-container">
          <canvas
            ref={canvasRef}
            width={480}
            height={380}
            role="img"
            aria-label="USDA Soil Texture Triangle Ternary Canvas"
            className="soil-triangle-canvas"
          />
        </div>

        {/* Sliders & Numerical Inputs */}
        <div className="texture-controls-panel">
          <h4 className="controls-heading">Particle Size Distribution (% Mass)</h4>

          <div className="fraction-slider-group">
            <div className="slider-label-row">
              <span className="fraction-name">
                <span className="fraction-color-dot sand-dot"></span> Sand (0.05 – 2.0 mm)
              </span>
              <span className="fraction-value sand-val">{sand}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sand}
              disabled={readOnly}
              aria-label="Sand (0.05 – 2.0 mm)"
              onChange={(e) => handleSandChange(e.target.value)}
              className="fraction-range-input sand-range"
              id="sand-percentage-slider"
            />
          </div>

          <div className="fraction-slider-group">
            <div className="slider-label-row">
              <span className="fraction-name">
                <span className="fraction-color-dot silt-dot"></span> Silt (0.002 – 0.05 mm)
              </span>
              <span className="fraction-value silt-val">{silt}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={silt}
              disabled={readOnly}
              aria-label="Silt (0.002 – 0.05 mm)"
              onChange={(e) => handleSiltChange(e.target.value)}
              className="fraction-range-input silt-range"
              id="silt-percentage-slider"
            />
          </div>

          <div className="fraction-slider-group">
            <div className="slider-label-row">
              <span className="fraction-name">
                <span className="fraction-color-dot clay-dot"></span> Clay (&lt; 0.002 mm)
              </span>
              <span className="fraction-value clay-val">{clay}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={clay}
              disabled={readOnly}
              aria-label="Clay (< 0.002 mm)"
              onChange={(e) => handleClayChange(e.target.value)}
              className="fraction-range-input clay-range"
              id="clay-percentage-slider"
            />
          </div>

          {/* Regional Preset Buttons */}
          <div className="preset-selector-block">
            <span className="preset-title">Regional Agro-Zone Baselines:</span>
            <div className="preset-btn-cluster">
              {NIGERIAN_TEXTURE_PRESETS.map((p) => (
                <button
                  key={p.code}
                  type="button"
                  className={`preset-btn ${activeClass === p.code ? 'active-preset' : ''}`}
                  onClick={() => applyPreset(p)}
                >
                  {p.name.split(' (')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Agronomic Properties Matrix */}
      <div className="texture-diagnostics-footer">
        <div className="diagnostic-stat-tile">
          <span className="stat-label">Water Retention</span>
          <span className="stat-value">{activeMetadata.waterHolding}</span>
        </div>
        <div className="diagnostic-stat-tile">
          <span className="stat-label">Hydraulic Drainage</span>
          <span className="stat-value">{activeMetadata.drainage}</span>
        </div>
        <div className="diagnostic-stat-tile">
          <span className="stat-label">Pore Aeration</span>
          <span className="stat-value">{activeMetadata.aeration}</span>
        </div>
        <div className="diagnostic-stat-tile">
          <span className="stat-label">Tillage Workability</span>
          <span className="stat-value">{activeMetadata.tillage}</span>
        </div>
      </div>

      <div className="pedological-advisory-banner">
        <span className="advisory-icon">💡</span>
        <p className="advisory-text">
          <strong>Pedological Advisory:</strong> {activeMetadata.advisory}
        </p>
      </div>
    </div>
  );
};

export default SoilTextureTriangleCanvas;
