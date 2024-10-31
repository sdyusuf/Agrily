/**
 * ==============================================================================
 * 🌾 AGRILY HARVEST YIELD PREDICTOR: SUB-PARCEL YIELD HEATMAP CANVAS
 * ==============================================================================
 *
 * Interactive 8x8 spatial productivity map (64 management cells) rendering:
 *  - Layer 1 (YIELD_TONS): Predicted harvestable yield (metric tons/ha)
 *  - Layer 2 (BIOMASS_ACCUM): Above-ground dry-matter biomass (tons/ha)
 *  - Layer 3 (HARVEST_INDEX): Partitioning efficiency (HI = Yield / Biomass)
 *  - Layer 4 (REVENUE_NGN): Projected gross revenue density (NGN / ha)
 *
 * Adheres strictly to DESIGN_SYSTEM.md ("Earth & Innovation").
 * ==============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import './SubParcelYieldHeatmapCanvas.css';
import { LayersIcon, SproutIcon, WheatIcon, TargetIcon } from './Icons';

const YIELD_LAYERS = [
  { id: 'YIELD_TONS', label: 'Harvest Yield (t/ha)', icon: WheatIcon },
  { id: 'BIOMASS_ACCUM', label: 'Dry Biomass (t/ha)', icon: SproutIcon },
  { id: 'HARVEST_INDEX', label: 'Harvest Index (HI)', icon: TargetIcon },
  { id: 'REVENUE_NGN', label: 'Revenue Density (₦/ha)', icon: LayersIcon }
];

function getYieldCellColor(cell, layerId) {
  if (!cell) return '#d8f3dc';
  const mult = Number(cell.spatialMultiplier ?? 1.0);
  if (layerId === 'REVENUE_NGN') {
    if (mult >= 1.08) return '#1b4332';
    if (mult >= 0.95) return '#2d6a4f';
    if (mult >= 0.84) return '#bc6c25';
    return '#991b1b';
  }
  if (mult >= 1.08) return '#1b4332';
  if (mult >= 0.96) return '#2d6a4f';
  if (mult >= 0.85) return '#52b788';
  if (mult >= 0.75) return '#bc6c25';
  return '#991b1b';
}

export default function SubParcelYieldHeatmapCanvas({
  spatialZoneGrid = {},
  parcelName = 'Kano North Irrigation Plot 4B',
  parcelCode = 'NG-MAI-KANO4B',
  cropType = 'Maize',
  onSelectCell
}) {
  const [activeLayer, setActiveLayer] = useState('YIELD_TONS');
  const [selectedCell, setSelectedCell] = useState(null);
  const canvasRef = useRef(null);

  const safeCells =
    Array.isArray(spatialZoneGrid?.cells) && spatialZoneGrid.cells.length > 0
      ? spatialZoneGrid.cells
      : Array.from({ length: 64 }, (_, idx) => {
          const row = Math.floor(idx / 8);
          const col = idx % 8;
          const mult = Number((1.12 - Math.hypot(row - 3, col - 2) * 0.045).toFixed(2));
          const yld = Number((6.1 * mult).toFixed(2));
          return {
            cellId: `Z${row}-${col}`,
            row,
            col,
            yieldTonsPerHa: yld,
            biomassTonsPerHa: Number((12.8 * mult).toFixed(2)),
            harvestIndex: 0.48,
            ndviScore: Number(Math.min(0.9, 0.76 * mult).toFixed(2)),
            revenueNgnPerHa: Math.round(yld * 680000),
            spatialMultiplier: mult,
            managementZone:
              mult >= 1.08
                ? 'High-Yield Core Zone'
                : mult <= 0.82
                ? 'Low-Yield Compaction / Nutrient Deficit'
                : 'Standard Productivity Zone'
          };
        });

  const activeInspectionCell = selectedCell || safeCells[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof canvas.getContext !== 'function' || (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || ''))) return;
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx || typeof ctx.fillRect !== 'function') return;
      const cellW = (canvas.width || 384) / 8;
      const cellH = (canvas.height || 384) / 8;
      if (typeof ctx.clearRect === 'function') {
        ctx.clearRect(0, 0, canvas.width || 384, canvas.height || 384);
      }
      safeCells.forEach((cell) => {
        ctx.fillStyle = getYieldCellColor(cell, activeLayer);
        ctx.fillRect((cell.col || 0) * cellW + 2, (cell.row || 0) * cellH + 2, cellW - 4, cellH - 4);
      });
    } catch {
      // Graceful fallback when running in jsdom without canvas mock
    }
  }, [safeCells, activeLayer]);

  const handleCellClick = (cell) => {
    setSelectedCell(cell);
    if (typeof onSelectCell === 'function') {
      onSelectCell(cell);
    }
  };

  return (
    <div className="subparcel-yield-card" data-testid="subparcel-yield-heatmap-card">
      <div className="subparcel-yield-header">
        <div>
          <span className="yield-map-eyebrow">
            <LayersIcon size={14} /> SPATIAL YIELD &amp; BIOMASS PRODUCTIVITY MAP ({parcelCode})
          </span>
          <h3 className="yield-map-title">{parcelName}</h3>
          <p className="yield-map-subtitle">
            Crop: <strong>{cropType}</strong> &bull; High-Yield Core Blocks:{' '}
            <strong>{spatialZoneGrid?.highYieldCellsCount ?? 18}</strong> &bull; Deficit Blocks:{' '}
            <strong>{spatialZoneGrid?.lowYieldCellsCount ?? 9}</strong>
          </p>
        </div>

        <div className="yield-layer-tabs" role="tablist" aria-label="Yield Map Layer Selector">
          {YIELD_LAYERS.map((layer) => {
            const IconComp = layer.icon;
            const isActive = activeLayer === layer.id;
            return (
              <button
                key={layer.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`yield-layer-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveLayer(layer.id)}
                data-testid={`yield-layer-${layer.id}`}
              >
                <IconComp size={15} />
                <span>{layer.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="subparcel-yield-body">
        <div className="yield-canvas-box">
          <canvas
            ref={canvasRef}
            width={384}
            height={384}
            className="yield-hidden-canvas"
            aria-label="Sub-Parcel Yield Spatial Canvas"
          />

          <div className="yield-grid-overlay" data-testid="yield-interactive-grid">
            {safeCells.slice(0, 64).map((cell) => {
              const isSelected = activeInspectionCell?.cellId === cell.cellId;
              const cellLabel =
                activeLayer === 'YIELD_TONS'
                  ? `${cell.yieldTonsPerHa}t`
                  : activeLayer === 'BIOMASS_ACCUM'
                  ? `${cell.biomassTonsPerHa}t`
                  : activeLayer === 'HARVEST_INDEX'
                  ? `HI ${cell.harvestIndex}`
                  : `₦${Math.round((cell.revenueNgnPerHa || 0) / 1000000 * 10) / 10}M`;

              return (
                <button
                  key={cell.cellId}
                  type="button"
                  className={`yield-cell-btn ${isSelected ? 'selected' : ''}`}
                  style={{ backgroundColor: getYieldCellColor(cell, activeLayer) }}
                  onClick={() => handleCellClick(cell)}
                  title={`${cell.cellId}: ${cell.yieldTonsPerHa} t/ha (${cell.managementZone})`}
                  data-testid={`yield-cell-${cell.cellId}`}
                >
                  <span>{cellLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="yield-zone-inspector" data-testid="yield-cell-inspector">
          <div className="zone-inspector-top">
            <span className="zone-cell-badge">BLOCK {activeInspectionCell?.cellId}</span>
            <span
              className={`zone-class-pill ${
                String(activeInspectionCell?.managementZone).includes('Deficit')
                  ? 'deficit'
                  : 'optimal'
              }`}
            >
              {activeInspectionCell?.managementZone}
            </span>
          </div>

          <h4 className="zone-inspector-title">Block Harvest &amp; Partitioning Diagnostics</h4>

          <div className="zone-inspector-stats">
            <div className="zone-stat-card">
              <span>Predicted Grain/Tuber Yield</span>
              <strong>{activeInspectionCell?.yieldTonsPerHa} t/ha</strong>
              <small>Spatial Index: {activeInspectionCell?.spatialMultiplier}&times;</small>
            </div>

            <div className="zone-stat-card">
              <span>Above-Ground Biomass</span>
              <strong>{activeInspectionCell?.biomassTonsPerHa} t/ha</strong>
              <small>Monteith APAR Integral</small>
            </div>

            <div className="zone-stat-card">
              <span>Harvest Index (HI)</span>
              <strong>{activeInspectionCell?.harvestIndex}</strong>
              <small>Canopy NDVI: {activeInspectionCell?.ndviScore}</small>
            </div>

            <div className="zone-stat-card">
              <span>Revenue Density</span>
              <strong>
                &#8358;{Number(activeInspectionCell?.revenueNgnPerHa || 0).toLocaleString()}/ha
              </strong>
              <small>Farm-Gate Spot Valuation</small>
            </div>
          </div>

          <div className="zone-prescription-box">
            <strong>Variable-Rate Combine &amp; Input Advisory:</strong>
            <p>
              {String(activeInspectionCell?.managementZone).includes('Deficit')
                ? 'Sub-parcel compaction or N-deficit detected. Apply variable-rate foliar urea + deep sub-soiling prior to next planting cycle.'
                : 'High canopy assimilate partitioning confirmed. Schedule primary combine harvester pass at 14–16% grain moisture.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

