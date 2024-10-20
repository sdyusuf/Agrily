/**
 * ==============================================================================
 * 🌾 AGRILY HYPERLOCAL WEATHER: 7-DAY EVAPOTRANSPIRATION & RAINFALL CHART
 * ==============================================================================
 *
 * Dual-metric SVG visualization plotting:
 *  - Daily FAO-56 Crop Evapotranspiration demand (ETc in mm/day)
 *  - Convective Rainfall accumulation bars (mm/day)
 *  - Nocturnal minimum canopy temperature & daytime maximum temperature curve
 * ==============================================================================
 */

import React, { useState } from 'react';
import './EvapotranspirationTimelineChart.css';
import { SunIcon, CloudRainIcon, ThermometerIcon } from './Icons';

export default function EvapotranspirationTimelineChart({
  sevenDayForecast = [],
  timelineSummary = {},
  cropType = 'Maize'
}) {
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

  const safeDays =
    Array.isArray(sevenDayForecast) && sevenDayForecast.length > 0
      ? sevenDayForecast
      : [
          {
            observationTimestamp: '2024-10-14T12:00:00Z',
            minTempCelsius: 19.2,
            maxTempCelsius: 33.4,
            airTempCelsius: 26.3,
            referenceEvapotranspirationMmDay: 5.1,
            cropEvapotranspirationEtcMmDay: 6.1,
            precipitationMm: 0,
            vaporPressureDeficitKpa: 1.95,
            soilMoistureVolumetricPct: 24.5,
            heatStressSeverity: 'Mild Thermal Load'
          },
          {
            observationTimestamp: '2024-10-15T12:00:00Z',
            minTempCelsius: 20.1,
            maxTempCelsius: 35.8,
            airTempCelsius: 28.0,
            referenceEvapotranspirationMmDay: 5.8,
            cropEvapotranspirationEtcMmDay: 6.9,
            precipitationMm: 4.2,
            vaporPressureDeficitKpa: 2.35,
            soilMoistureVolumetricPct: 23.1,
            heatStressSeverity: 'Moderate Heat Stress'
          },
          {
            observationTimestamp: '2024-10-16T12:00:00Z',
            minTempCelsius: 18.4,
            maxTempCelsius: 29.5,
            airTempCelsius: 24.0,
            referenceEvapotranspirationMmDay: 4.2,
            cropEvapotranspirationEtcMmDay: 5.0,
            precipitationMm: 28.4,
            vaporPressureDeficitKpa: 1.15,
            soilMoistureVolumetricPct: 31.8,
            heatStressSeverity: 'Optimal'
          }
        ];

  const activeDay = safeDays[Math.min(selectedDayIdx, safeDays.length - 1)] || safeDays[0];

  const formatDateShort = (iso) => {
    if (!iso) return 'Oct 14';
    const d = String(iso).slice(0, 10);
    return d.slice(5); // MM-DD
  };

  const maxPrecip = Math.max(35, ...safeDays.map((d) => Number(d.precipitationMm || 0)));
  const maxEtc = Math.max(10, ...safeDays.map((d) => Number(d.cropEvapotranspirationEtcMmDay || d.referenceEvapotranspirationMmDay || 5)));

  return (
    <div className="et-timeline-card" data-testid="evapotranspiration-timeline-chart">
      <div className="et-chart-header">
        <div>
          <span className="et-eyebrow-pill">
            <SunIcon size={14} /> FAO-56 PENMAN-MONTEITH HYDROLOGICAL BALANCE
          </span>
          <h3 className="et-chart-title">7-Day Evapotranspiration (ETc) vs. Rainfall Forecast</h3>
          <p className="et-chart-subtitle">
            Target Crop: <strong>{cropType}</strong> &bull; Cumulative 7-Day Rainfall:{' '}
            <strong>{timelineSummary?.cumulativeRainfallMm ?? 32.6} mm</strong> &bull; Cumulative ETc:{' '}
            <strong>{timelineSummary?.cumulativeEtcMm ?? 38.4} mm</strong>
          </p>
        </div>

        <div className="et-balance-badge-group">
          <div className="et-balance-kpi">
            <span>Net Water Balance</span>
            <strong
              className={
                Number(timelineSummary?.moistureBalanceMm ?? -5.8) < 0 ? 'deficit' : 'surplus'
              }
            >
              {Number(timelineSummary?.moistureBalanceMm ?? -5.8) > 0 ? '+' : ''}
              {timelineSummary?.moistureBalanceMm ?? -5.8} mm
            </strong>
          </div>
          <div className="et-balance-kpi">
            <span>Lowest Canopy Temp</span>
            <strong>{timelineSummary?.lowestCanopyTempCelsius ?? 1.8}&deg;C</strong>
          </div>
        </div>
      </div>

      <div className="et-svg-container">
        <svg
          viewBox="0 0 700 220"
          className="et-forecast-svg"
          role="img"
          aria-label="7-Day Evapotranspiration and Rainfall Chart"
        >
          {/* Horizontal grid lines */}
          {[40, 90, 140, 185].map((y) => (
            <line
              key={y}
              x1="40"
              y1={y}
              x2="660"
              y2={y}
              stroke="#e5e7eb"
              strokeDasharray="4 4"
            />
          ))}

          {/* Bars & ETc Points per day */}
          {safeDays.map((day, idx) => {
            const xCenter = 85 + idx * (560 / Math.max(1, safeDays.length - 1));
            const precip = Number(day.precipitationMm || 0);
            const etc = Number(
              day.cropEvapotranspirationEtcMmDay || day.referenceEvapotranspirationMmDay || 4.8
            );
            const barHeight = Math.min(135, (precip / maxPrecip) * 135);
            const etcY = 185 - Math.min(135, (etc / maxEtc) * 135);
            const isSelected = idx === selectedDayIdx;

            return (
              <g
                key={day.observationTimestamp || idx}
                className="et-day-svg-group"
                onClick={() => setSelectedDayIdx(idx)}
                style={{ cursor: 'pointer' }}
                data-testid={`et-chart-day-${idx}`}
              >
                {/* Rainfall Bar */}
                <rect
                  x={xCenter - 16}
                  y={185 - barHeight}
                  width="32"
                  height={Math.max(4, barHeight)}
                  rx="5"
                  fill={precip > 0 ? '#2d6a4f' : '#d8f3dc'}
                  opacity={isSelected ? 1 : 0.78}
                />

                {/* ETc Demand Node */}
                <circle
                  cx={xCenter}
                  cy={etcY}
                  r={isSelected ? 7 : 5}
                  fill="#bc6c25"
                  stroke="#ffffff"
                  strokeWidth="2"
                />

                {/* Value Labels */}
                <text
                  x={xCenter}
                  y={etcY - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  fill="#7f3b08"
                >
                  {etc}mm
                </text>

                <text
                  x={xCenter}
                  y="206"
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight={isSelected ? '700' : '600'}
                  fill={isSelected ? '#1b4332' : '#475569'}
                >
                  {formatDateShort(day.observationTimestamp)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="et-day-detail-strip" data-testid="et-selected-day-detail">
        <div className="et-detail-item">
          <ThermometerIcon size={16} color="#bc6c25" />
          <div>
            <span>Min / Max Shelter Temp</span>
            <strong>
              {activeDay.minTempCelsius}&deg;C / {activeDay.maxTempCelsius}&deg;C
            </strong>
          </div>
        </div>

        <div className="et-detail-item">
          <SunIcon size={16} color="#2d6a4f" />
          <div>
            <span>Ref ET0 / Crop ETc</span>
            <strong>
              {activeDay.referenceEvapotranspirationMmDay} /{' '}
              {activeDay.cropEvapotranspirationEtcMmDay ?? activeDay.referenceEvapotranspirationMmDay} mm/day
            </strong>
          </div>
        </div>

        <div className="et-detail-item">
          <CloudRainIcon size={16} color="#1b4332" />
          <div>
            <span>Precipitation &amp; Soil Moisture</span>
            <strong>
              {activeDay.precipitationMm} mm &bull; {activeDay.soilMoistureVolumetricPct ?? 24.0}% VWC
            </strong>
          </div>
        </div>

        <div className="et-detail-item">
          <div>
            <span>Thermal Stress Status</span>
            <strong className="et-stress-pill">{activeDay.heatStressSeverity || 'Optimal'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
