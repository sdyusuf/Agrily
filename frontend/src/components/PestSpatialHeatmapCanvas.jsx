/**
 * ==============================================================================
 * 🐛 AGRILY SPRINT 22: 2D GAUSSIAN KDE PEST INFESTATION HEATMAP & WIND PLUME RADAR
 * ==============================================================================
 *
 * Interactive 8×8 (64-cell) Kernel Density Estimation (KDE) spatial contagion
 * surface coupled with 72-hour wind-advection moth/locust/quelea trajectory
 * vectors and pheromone trap catch density overlays.
 * ==============================================================================
 */

import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import './PestSpatialHeatmapCanvas.css';

const HEATMAP_MODES = [
  { id: 'KDE_CONTAGION', label: 'KDE Outbreak Intensity' },
  { id: 'PHEROMONE_SURGE', label: 'Pheromone Trap Surge' },
  { id: 'WIND_ADVECTION', label: '72h Wind Dispersal Plume' },
];

const STATE_CORRIDOR_ANCHORS = [
  { row: 1, col: 4, corridorCode: 'COR-BO-CHAD', label: 'Lake Chad Basin (Borno)', windBearingDeg: 240, windSpeedKmh: 26.0 },
  { row: 2, col: 3, corridorCode: 'COR-JG-HADEJIA', label: 'Hadejia Wetland (Jigawa)', windBearingDeg: 235, windSpeedKmh: 22.4 },
  { row: 2, col: 2, corridorCode: 'COR-KN-KURA', label: 'Kura Irrigation Belt (Kano)', windBearingDeg: 210, windSpeedKmh: 19.0 },
  { row: 3, col: 2, corridorCode: 'COR-KD-ZARIA', label: 'Zaria Giwa Maize Belt (Kaduna)', windBearingDeg: 225, windSpeedKmh: 16.5 },
  { row: 4, col: 3, corridorCode: 'COR-PL-JOS', label: 'Barkin Ladi Highland (Plateau)', windBearingDeg: 195, windSpeedKmh: 15.2 },
  { row: 5, col: 3, corridorCode: 'COR-BN-GBOKO', label: 'Gboko Benue Alluvial (Benue)', windBearingDeg: 45, windSpeedKmh: 12.8 },
  { row: 5, col: 1, corridorCode: 'COR-OY-ISEYIN', label: 'Iseyin Derived Savanna (Oyo)', windBearingDeg: 35, windSpeedKmh: 13.4 },
  { row: 6, col: 2, corridorCode: 'COR-OD-IDANRE', label: 'Idanre Cocoa Belt (Ondo)', windBearingDeg: 30, windSpeedKmh: 10.5 },
];

function getCellBackgroundColor(cell, mode) {
  const score =
    mode === 'KDE_CONTAGION'
      ? cell.kdeHotspotIndex
      : mode === 'PHEROMONE_SURGE'
      ? Math.min(100, cell.mothsPerNight * 2.2)
      : Math.min(100, cell.windDispersal72hKm * 0.72);

  if (score >= 72) return '#9b2226';
  if (score >= 52) return '#bc6c25';
  if (score >= 34) return '#dda15e';
  if (score >= 20) return '#52b788';
  return '#2d6a4f';
}

const PestSpatialHeatmapCanvas = ({
  pestKey = 'FALL_ARMYWORM',
  pestCommonName = 'Fall Armyworm (Spodoptera frugiperda)',
  baselineIncidencePct = 34.5,
  bandwidthKm = 185,
  onSelectCell,
}) => {
  const [activeMode, setActiveMode] = useState('KDE_CONTAGION');
  const [selectedCellCode, setSelectedCellCode] = useState('KDE-R3-C2');

  const gridCells = useMemo(() => {
    const cells = [];
    const pestSeed = String(pestKey)
      .split('')
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

    for (let r = 1; r <= 8; r++) {
      for (let c = 1; c <= 8; c++) {
        const cellCode = `KDE-R${r}-C${c}`;
        const anchor = STATE_CORRIDOR_ANCHORS.find(
          (a) => a.row === r && a.col === c
        );

        // Deterministic 2D Gaussian-like gradient centered around Northern/Central belts
        const distFromEpicenter = Math.hypot(r - 3.1, c - 2.6);
        const wave = Math.sin((r * 2.3 + c * 1.7 + pestSeed * 0.05)) * 11;
        const rawKde =
          baselineIncidencePct * 1.85 * Math.exp(-0.14 * distFromEpicenter) +
          wave;
        const kdeHotspotIndex = Math.min(98, Math.max(8, Math.round(rawKde)));

        const mothsPerNight = Math.max(
          2,
          Math.round(kdeHotspotIndex * 0.48 + (r % 3) * 3)
        );
        const larvalDensityPerM2 = Number(
          (kdeHotspotIndex * 0.13).toFixed(1)
        );
        const windSpeedKmh = anchor
          ? anchor.windSpeedKmh
          : Number((12 + (9 - r) * 1.6).toFixed(1));
        const windBearingDeg = anchor
          ? anchor.windBearingDeg
          : r <= 4
          ? 225
          : 45;
        const windDispersal72hKm = Number((windSpeedKmh * 6.8).toFixed(1));

        const severityTier =
          kdeHotspotIndex >= 72
            ? 'CRITICAL_EPIDEMIC_PLUME'
            : kdeHotspotIndex >= 48
            ? 'ACTIVE_CONTAGION_CLUSTER'
            : 'ENDEMIC_SURVEILLANCE';

        cells.push({
          cellCode,
          row: r,
          col: c,
          corridorLabel:
            anchor?.label || `Agro-Grid Sector R${r}×C${c}`,
          kdeHotspotIndex,
          mothsPerNight,
          larvalDensityPerM2,
          windSpeedKmh,
          windBearingDeg,
          windDispersal72hKm,
          severityTier,
        });
      }
    }
    return cells;
  }, [pestKey, baselineIncidencePct]);

  const activeCell =
    gridCells.find((item) => item.cellCode === selectedCellCode) ||
    gridCells[17];

  const criticalCount = gridCells.filter(
    (c) => c.severityTier === 'CRITICAL_EPIDEMIC_PLUME'
  ).length;

  const handleCellClick = (cell) => {
    setSelectedCellCode(cell.cellCode);
    if (typeof onSelectCell === 'function') {
      onSelectCell(cell);
    }
  };

  return (
    <section
      className="pest-heatmap-card"
      data-testid="pest-spatial-heatmap-card"
      aria-label="2D Gaussian Kernel Density Pest Infestation Heatmap"
    >
      <header className="pest-heatmap-header">
        <div>
          <span className="pest-heatmap-eyebrow">
            2D GAUSSIAN KERNEL DENSITY (h = {bandwidthKm} km) • WIND-PLUME RADAR
          </span>
          <h3 className="pest-heatmap-title">
            Regional Pest Contagion Surface &amp; 72-Hour Swarm Advection Grid
          </h3>
          <p className="pest-heatmap-subtitle">
            Target Species: <strong>{pestCommonName}</strong> • Critical Epidemic Cells:{' '}
            <strong>{criticalCount} / 64</strong>
          </p>
        </div>

        <div className="pest-mode-tabs" role="tablist" aria-label="Heatmap overlay mode">
          {HEATMAP_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={activeMode === m.id}
              className={`pest-mode-btn ${activeMode === m.id ? 'active' : ''}`}
              onClick={() => setActiveMode(m.id)}
              data-testid={`pest-layer-${m.id}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </header>

      <div className="pest-heatmap-body">
        <div className="pest-grid-container" role="grid" aria-label="8 by 8 Pest KDE Grid">
          {gridCells.map((cell) => {
            const isSelected = cell.cellCode === activeCell.cellCode;
            const displayMetric =
              activeMode === 'KDE_CONTAGION'
                ? `${cell.kdeHotspotIndex}`
                : activeMode === 'PHEROMONE_SURGE'
                ? `${cell.mothsPerNight}/n`
                : `${Math.round(cell.windDispersal72hKm)}km`;

            return (
              <button
                key={cell.cellCode}
                type="button"
                className={`pest-kde-cell ${isSelected ? 'selected' : ''}`}
                style={{
                  backgroundColor: getCellBackgroundColor(cell, activeMode),
                }}
                onClick={() => handleCellClick(cell)}
                data-testid={`pest-cell-${cell.cellCode}`}
                title={`${cell.cellCode} (${cell.corridorLabel}): KDE ${cell.kdeHotspotIndex}/100`}
              >
                <span className="cell-metric-text">{displayMetric}</span>
                <span
                  className="cell-wind-arrow"
                  style={{ transform: `rotate(${cell.windBearingDeg}deg)` }}
                  aria-hidden="true"
                >
                  ↑
                </span>
              </button>
            );
          })}
        </div>

        <aside className="pest-cell-inspector" data-testid="pest-cell-inspector">
          <div className="inspector-badge-row">
            <span className="inspector-sector-code">{activeCell.cellCode}</span>
            <span
              className={`inspector-severity-pill ${
                activeCell.severityTier === 'CRITICAL_EPIDEMIC_PLUME'
                  ? 'critical'
                  : activeCell.severityTier === 'ACTIVE_CONTAGION_CLUSTER'
                  ? 'warning'
                  : 'safe'
              }`}
            >
              {activeCell.severityTier}
            </span>
          </div>

          <h4 className="inspector-corridor-title">{activeCell.corridorLabel}</h4>

          <div className="inspector-metrics-grid">
            <div className="inspector-stat-box">
              <span>KDE Hotspot Score</span>
              <strong>{activeCell.kdeHotspotIndex} / 100</strong>
              <small>Gaussian Kernel Density</small>
            </div>

            <div className="inspector-stat-box">
              <span>Pheromone Trap Catch</span>
              <strong>{activeCell.mothsPerNight} moths/night</strong>
              <small>Biofix Surge Telemetry</small>
            </div>

            <div className="inspector-stat-box">
              <span>Larval Canopy Density</span>
              <strong>{activeCell.larvalDensityPerM2} larvae/m²</strong>
              <small>W-Pattern Scouting Mean</small>
            </div>

            <div className="inspector-stat-box">
              <span>72h Downwind Plume</span>
              <strong>{activeCell.windDispersal72hKm} km</strong>
              <small>
                Bearing {activeCell.windBearingDeg}° @ {activeCell.windSpeedKmh} km/h
              </small>
            </div>
          </div>

          <div className="inspector-ipm-callout">
            <strong>Regional Biocontrol &amp; Early-Warning Directive:</strong>
            <p>
              {activeCell.kdeHotspotIndex >= 65
                ? 'Active moth flight and larval surge detected. Deploy Trichogramma / Telenomus egg parasitoids (60,000/ha) and evening Bacillus thuringiensis spray across downwind buffer corridors immediately.'
                : 'Moderate endemic activity. Maintain 5-point W-pattern foliar scouting every 72 hours and inspect Delta sticky pheromone lures.'}
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
};

PestSpatialHeatmapCanvas.propTypes = {
  pestKey: PropTypes.string,
  pestCommonName: PropTypes.string,
  baselineIncidencePct: PropTypes.number,
  bandwidthKm: PropTypes.number,
  onSelectCell: PropTypes.func,
};

export default PestSpatialHeatmapCanvas;
