import React, { useRef, useEffect, useState, useMemo } from 'react';
import './SatelliteCanopyVigorMap.css';
import { SatelliteDishIcon, EyeIcon } from './Icons';

/**
 * Maps an index value to a specific hex color ramp
 */
function getCellColor(value, band, isMasked) {
  if (isMasked) {
    return 'rgba(148, 163, 184, 0.4)'; // Gray for cloud
  }

  const v = Math.max(-1.0, Math.min(1.0, Number(value) || 0.0));

  if (band === 'NDWI') {
    // Moisture ramp: [-0.3, 0.4]
    if (v < -0.1) return '#d90429'; // Red (Severe water stress)
    if (v < 0.05) return '#f4a261'; // Orange
    if (v < 0.20) return '#e9c46a'; // Yellow
    if (v < 0.35) return '#2a9d8f'; // Cyan
    return '#1d3557'; // Deep blue (High canopy hydration)
  }

  if (band === 'CIR') {
    // False color infrared
    if (v < 0.25) return '#6c757d';
    if (v < 0.45) return '#e63946';
    if (v < 0.65) return '#b5179e';
    return '#7209b7';
  }

  // Default: NDVI / EVI / SAVI Vegetative biomass ramp
  if (v < 0.15) return '#d90429'; // Red (Defoliated / barren)
  if (v < 0.30) return '#f77f00'; // Amber (Severe stress)
  if (v < 0.45) return '#fcbf49'; // Yellow (Moderate stress)
  if (v < 0.60) return '#90be6d'; // Light green (Normal vigor)
  if (v < 0.75) return '#40916c'; // Emerald (Healthy canopy)
  return '#1b4332'; // Deep forest (Hyper-dense biomass)
}

export default function SatelliteCanopyVigorMap({
  parcel,
  cells = [],
  activeBand = 'NDVI',
  rows = 12,
  cols = 12,
  selectedDate = '2024-09-28',
  onCellHover
}) {
  const canvasRef = useRef(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1.0);

  const displayBandKey = useMemo(() => {
    switch (activeBand) {
      case 'NDWI':
        return 'ndwi';
      case 'EVI':
        return 'evi';
      case 'SAVI':
        return 'savi';
      default:
        return 'ndvi';
    }
  }, [activeBand]);

  // Render Canvas Grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Apply zoom transform
    ctx.save();
    ctx.scale(zoomLevel, zoomLevel);

    const cellWidth = width / cols;
    const cellHeight = height / rows;

    // Draw background grid cells
    cells.forEach((cell) => {
      const x = cell.x * cellWidth;
      const y = cell.y * cellHeight;
      const val = cell[displayBandKey] !== undefined ? cell[displayBandKey] : cell.ndvi;

      ctx.fillStyle = getCellColor(val, activeBand, cell.isMasked);
      ctx.fillRect(x, y, cellWidth, cellHeight);

      // Subtle border for high zoom inspection
      if (zoomLevel > 1.2) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, cellWidth, cellHeight);
      }
    });

    // Draw boundary polygon contour
    ctx.strokeStyle = '#bc6c25'; // Agrily Harvest Ochre
    ctx.lineWidth = 3 / zoomLevel;
    ctx.setLineDash([6 / zoomLevel, 4 / zoomLevel]);
    ctx.strokeRect(cellWidth * 0.5, cellHeight * 0.5, width - cellWidth, height - cellHeight);

    // Highlight hovered cell
    if (hoveredCell) {
      const hx = hoveredCell.x * cellWidth;
      const hy = hoveredCell.y * cellHeight;
      ctx.setLineDash([]);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5 / zoomLevel;
      ctx.strokeRect(hx, hy, cellWidth, cellHeight);
    }

    ctx.restore();
  }, [cells, rows, cols, activeBand, displayBandKey, hoveredCell, zoomLevel]);

  // Handle canvas mouse move
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / zoomLevel;
    const mouseY = (e.clientY - rect.top) / zoomLevel;

    const cellWidth = canvas.width / cols;
    const cellHeight = canvas.height / rows;

    const c = Math.floor(mouseX / cellWidth);
    const r = Math.floor(mouseY / cellHeight);

    if (c >= 0 && c < cols && r >= 0 && r < rows) {
      const match = cells.find((cell) => cell.x === c && cell.y === r);
      if (match) {
        setHoveredCell(match);
        if (onCellHover) onCellHover(match);
      }
    }
  };

  const handleMouseLeave = () => {
    setHoveredCell(null);
    if (onCellHover) onCellHover(null);
  };

  return (
    <div className="satellite-map-container" data-testid="satellite-canopy-vigor-map">
      <div className="satellite-map-topbar">
        <div className="map-badge-group">
          <span className="live-telemetry-pill">
            <span className="pulse-satellite-dot" />
            Sentinel-2B L2A Surface Reflectance (10m)
          </span>
          <span className="pass-date-pill">{selectedDate}</span>
          <span className="band-active-pill">{activeBand} Layer</span>
        </div>

        <div className="map-control-actions">
          <button
            type="button"
            className="map-zoom-btn"
            onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.25))}
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            className="map-zoom-btn"
            onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
            aria-label="Zoom out"
          >
            -
          </button>
          <button
            type="button"
            className="map-zoom-btn reset-btn"
            onClick={() => setZoomLevel(1.0)}
          >
            100%
          </button>
        </div>
      </div>

      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={560}
          height={400}
          className="satellite-raster-canvas"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          data-testid="satellite-raster-canvas"
        />

        {hoveredCell && (
          <div
            className="cell-tooltip"
            style={{
              left: `${Math.min(420, (hoveredCell.x * (560 / cols)) * zoomLevel + 20)}px`,
              top: `${Math.max(10, (hoveredCell.y * (400 / rows)) * zoomLevel - 40)}px`
            }}
          >
            <div className="tooltip-header">
              <strong>{hoveredCell.cellId}</strong>
              <span className={`status-tag ${hoveredCell.isMasked ? 'masked' : 'active'}`}>
                {hoveredCell.isMasked ? 'Cloud Occluded' : hoveredCell.stressSeverity}
              </span>
            </div>
            <div className="tooltip-body">
              <span>{activeBand}: <strong>{hoveredCell[displayBandKey] || hoveredCell.ndvi}</strong></span>
              <span>Lat: {hoveredCell.lat}</span>
              <span>Lng: {hoveredCell.lng}</span>
            </div>
          </div>
        )}
      </div>

      <div className="satellite-map-legend">
        <span className="legend-label">Canopy Health Scale:</span>
        <div className="legend-gradient-bar" />
        <div className="legend-steps">
          <span>Severe Stress (&lt;0.20)</span>
          <span>Moderate (0.20-0.40)</span>
          <span>Healthy (0.40-0.65)</span>
          <span>Dense Biomass (&gt;0.65)</span>
        </div>
      </div>
    </div>
  );
}
