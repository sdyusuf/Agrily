/**
 * ==============================================================================
 * 🌾 AGRILY HYPERLOCAL WEATHER: MICROCLIMATE DOPPLER & ISOTHERM RADAR CANVAS
 * ==============================================================================
 *
 * Interactive 8x8 spatial microclimate grid visualizer rendering:
 *  - Layer 1 (PRECIP): Convective rainfall intensity cells (mm/hr)
 *  - Layer 2 (TEMP_FROST): Canopy isotherm & nocturnal frost pocket contours (°C)
 *  - Layer 3 (WIND_DRIFT): Anemometer wind speed & directional vector arrows (km/h)
 *  - Layer 4 (VPD_DEFICIT): Atmospheric Vapor Pressure Deficit stress zones (kPa)
 *
 * Adheres strictly to DESIGN_SYSTEM.md ("Earth & Innovation").
 * ==============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import './MicroclimateRadarCanvas.css';
import {
  CloudRainIcon,
  ThermometerIcon,
  WindIcon,
  DropletIcon,
  CompassIcon
} from './Icons';

const RADAR_LAYERS = [
  { id: 'PRECIP', label: 'Precipitation Radar', unit: 'mm/hr', icon: CloudRainIcon },
  { id: 'TEMP_FROST', label: 'Canopy Frost / Thermal', unit: '°C', icon: ThermometerIcon },
  { id: 'WIND_DRIFT', label: 'Wind Vectors & Drift', unit: 'km/h', icon: WindIcon },
  { id: 'VPD_DEFICIT', label: 'VPD Desiccation', unit: 'kPa', icon: DropletIcon }
];

function getCellColor(cell, layerId) {
  if (!cell) return '#e2e8f0';
  if (layerId === 'PRECIP') {
    const val = Number(cell.precipIntensityMmHr || 0);
    if (val >= 25) return '#991b1b';
    if (val >= 14) return '#bc6c25';
    if (val >= 5) return '#2d6a4f';
    if (val >= 1) return '#52b788';
    return '#f0fdf4';
  }
  if (layerId === 'TEMP_FROST') {
    const t = Number(cell.canopyTempCelsius ?? 24);
    if (t <= 1.5) return '#1e3a8a';
    if (t <= 4.0) return '#3b82f6';
    if (t >= 37.5) return '#991b1b';
    if (t >= 33.5) return '#bc6c25';
    return '#2d6a4f';
  }
  if (layerId === 'WIND_DRIFT') {
    const w = Number(cell.windSpeedKmh || 0);
    if (w > 16) return '#991b1b';
    if (w > 12) return '#dda15e';
    if (w < 3) return '#64748b';
    return '#2d6a4f';
  }
  // VPD_DEFICIT
  const vpd = Number(cell.vpdKpa || 1.2);
  if (vpd >= 3.0) return '#991b1b';
  if (vpd >= 2.2) return '#bc6c25';
  if (vpd >= 1.4) return '#dda15e';
  return '#2d6a4f';
}

export default function MicroclimateRadarCanvas({
  radarGrid = [],
  stationName = 'Jos Plateau Montane Observatory #4',
  stationCode = 'AWS-JOS-1042',
  agroEcologicalZone = 'Mid-Altitude Montane',
  onSelectCell
}) {
  const [activeLayer, setActiveLayer] = useState('PRECIP');
  const [selectedCell, setSelectedCell] = useState(null);
  const canvasRef = useRef(null);

  const safeGrid = Array.isArray(radarGrid) && radarGrid.length > 0
    ? radarGrid
    : Array.from({ length: 64 }, (_, idx) => {
        const row = Math.floor(idx / 8);
        const col = idx % 8;
        return {
          cellId: `R${row}-C${col}`,
          row,
          col,
          canopyTempCelsius: Number((3.2 + row * 1.4).toFixed(1)),
          precipIntensityMmHr: Number(Math.max(0, 22 - Math.hypot(row - 3, col - 4) * 5).toFixed(1)),
          windSpeedKmh: Number((7.5 + col * 1.3).toFixed(1)),
          windDirectionDegrees: 215,
          vpdKpa: Number((1.1 + col * 0.22).toFixed(2)),
          relativeHumidityPct: 68,
          cellHazardLabel: row === 0 && col === 0 ? 'Frost Pocket' : 'Nominal'
        };
      });

  const activeInspectionCell = selectedCell || safeGrid[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof canvas.getContext !== 'function') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width || 400;
    const height = canvas.height || 400;
    const cols = 8;
    const rows = 8;
    const cellW = width / cols;
    const cellH = height / rows;

    if (typeof ctx.clearRect === 'function') {
      ctx.clearRect(0, 0, width, height);
    }

    safeGrid.forEach((cell) => {
      const x = (cell.col || 0) * cellW;
      const y = (cell.row || 0) * cellH;
      const fill = getCellColor(cell, activeLayer);

      ctx.fillStyle = fill;
      if (typeof ctx.fillRect === 'function') {
        ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);
      }

      if (
        activeInspectionCell &&
        activeInspectionCell.cellId === cell.cellId &&
        typeof ctx.strokeRect === 'function'
      ) {
        ctx.strokeStyle = '#081c15';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(x + 3, y + 3, cellW - 6, cellH - 6);
      }
    });
  }, [safeGrid, activeLayer, activeInspectionCell]);

  const handleCellClick = (cell) => {
    setSelectedCell(cell);
    if (typeof onSelectCell === 'function') {
      onSelectCell(cell);
    }
  };

  return (
    <div className="microclimate-radar-card" data-testid="microclimate-radar-card">
      <div className="microclimate-radar-header">
        <div>
          <span className="radar-eyebrow-pill">
            <CompassIcon size={14} /> LIVE DOPPLER &amp; MICROCLIMATE GRID ({stationCode})
          </span>
          <h3 className="radar-card-title">{stationName}</h3>
          <p className="radar-card-subtitle">
            Agro-Ecological Belt: <strong>{agroEcologicalZone}</strong> &bull; 8&times;8 Spatial Telemetry Resolution (500m Cells)
          </p>
        </div>

        <div className="radar-layer-Controls" role="tablist" aria-label="Radar Layer Selector">
          {RADAR_LAYERS.map((layer) => {
            const IconComp = layer.icon;
            const isActive = activeLayer === layer.id;
            return (
              <button
                key={layer.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`radar-layer-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveLayer(layer.id)}
                data-testid={`radar-layer-${layer.id}`}
              >
                <IconComp size={15} />
                <span>{layer.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="microclimate-radar-body">
        <div className="radar-canvas-wrapper">
          <canvas
            ref={canvasRef}
            width={384}
            height={384}
            className="radar-backing-canvas"
            aria-label="Spatial Microclimate Telemetry Canvas"
          />

          <div className="radar-interactive-overlay" data-testid="radar-interactive-grid">
            {safeGrid.slice(0, 64).map((cell) => {
              const isSelected = activeInspectionCell?.cellId === cell.cellId;
              const metricDisplay =
                activeLayer === 'PRECIP'
                  ? `${cell.precipIntensityMmHr}mm`
                  : activeLayer === 'TEMP_FROST'
                  ? `${cell.canopyTempCelsius}°C`
                  : activeLayer === 'WIND_DRIFT'
                  ? `${cell.windSpeedKmh}km/h`
                  : `${cell.vpdKpa}kPa`;

              return (
                <button
                  key={cell.cellId}
                  type="button"
                  className={`radar-grid-cell-btn ${isSelected ? 'selected' : ''}`}
                  style={{ backgroundColor: getCellColor(cell, activeLayer) }}
                  onClick={() => handleCellClick(cell)}
                  title={`${cell.cellId}: ${metricDisplay} (${cell.cellHazardLabel})`}
                  data-testid={`radar-cell-${cell.cellId}`}
                >
                  <span className="cell-metric-value">{metricDisplay}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="radar-inspector-sidebar" data-testid="radar-cell-inspector">
          <div className="inspector-badge-row">
            <span className="inspector-sector-tag">SECTOR {activeInspectionCell?.cellId}</span>
            <span
              className={`inspector-hazard-pill ${
                activeInspectionCell?.cellHazardLabel === 'Nominal' ? 'safe' : 'warning'
              }`}
            >
              {activeInspectionCell?.cellHazardLabel || 'Nominal'}
            </span>
          </div>

          <h4 className="inspector-heading">Sub-Parcel Microclimate Telemetry</h4>

          <div className="inspector-metrics-grid">
            <div className="inspector-metric-box">
              <span className="metric-box-label">Canopy Temp</span>
              <strong className="metric-box-value">
                {activeInspectionCell?.canopyTempCelsius ?? 24.0}°C
              </strong>
              <span className="metric-box-sub">2m Shelter &amp; Leaf IR</span>
            </div>

            <div className="inspector-metric-box">
              <span className="metric-box-label">Rainfall Rate</span>
              <strong className="metric-box-value">
                {activeInspectionCell?.precipIntensityMmHr ?? 0} mm/hr
              </strong>
              <span className="metric-box-sub">Convective Radar</span>
            </div>

            <div className="inspector-metric-box">
              <span className="metric-box-label">Wind Vector</span>
              <strong className="metric-box-value">
                {activeInspectionCell?.windSpeedKmh ?? 8.5} km/h
              </strong>
              <span className="metric-box-sub">
                Azimuth {activeInspectionCell?.windDirectionDegrees ?? 215}&deg;
              </span>
            </div>

            <div className="inspector-metric-box">
              <span className="metric-box-label">VPD Demand</span>
              <strong className="metric-box-value">
                {activeInspectionCell?.vpdKpa ?? 1.2} kPa
              </strong>
              <span className="metric-box-sub">
                RH {activeInspectionCell?.relativeHumidityPct ?? 62}%
              </span>
            </div>
          </div>

          <div className="radar-legend-block">
            <span className="legend-title">Active Layer Legend ({activeLayer})</span>
            <div className="legend-scale-pills">
              <span className="legend-pill emerald">Optimal / Safe</span>
              <span className="legend-pill ochre">Elevated Watch</span>
              <span className="legend-pill crimson">Critical Hazard</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
