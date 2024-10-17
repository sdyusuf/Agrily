/**
 * ==============================================================================
 * 🌾 AGRILY HYPERLOCAL WEATHER: AGROCHEMICAL SPRAY WINDOW ADVISOR CARD
 * ==============================================================================
 *
 * Displays 24-hour Delta-T (T_dry - T_wet), wind drift ceiling (km/h), thermal
 * inversion lockouts, and rainfastness wash-off windows for safe agrochemical
 * spraying.
 * ==============================================================================
 */

import React, { useState } from 'react';
import './AgroSprayWindowCard.css';
import { WindIcon, DropletIcon, CheckCircleIcon, AlertTriangleIcon, ClockIcon } from './Icons';

export default function AgroSprayWindowCard({ sprayPlan = {} }) {
  const [selectedHourIdx, setSelectedHourIdx] = useState(6);

  const hourlyWindows =
    Array.isArray(sprayPlan?.hourlyWindows) && sprayPlan.hourlyWindows.length > 0
      ? sprayPlan.hourlyWindows
      : [
          {
            observationTimestamp: '2024-10-14T06:00:00Z',
            airTempCelsius: 23.5,
            wetBulbCelsius: 18.8,
            deltaTCelsius: 4.7,
            windSpeedKmh: 6.8,
            windGustKmh: 9.0,
            precipitationMm: 0,
            upcoming3hRainMm: 0,
            status: 'Optimal Window',
            suitabilityScore: 95,
            colorToken: 'emerald',
            nozzleGuidance: 'Standard Flat-Fan or Medium VMD (250–350 µm) at 2.5 bar',
            limitingFactors: []
          },
          {
            observationTimestamp: '2024-10-14T13:00:00Z',
            airTempCelsius: 36.2,
            wetBulbCelsius: 23.8,
            deltaTCelsius: 12.4,
            windSpeedKmh: 18.5,
            windGustKmh: 24.2,
            precipitationMm: 0,
            upcoming3hRainMm: 0,
            status: 'High Drift Risk',
            suitabilityScore: 22,
            colorToken: 'danger',
            nozzleGuidance: 'LOCKOUT: Wind exceeds 15 km/h safe drift ceiling',
            limitingFactors: ['Wind speed 18.5 km/h', 'High Delta-T (12.4°C)']
          }
        ];

  const safeIdx = Math.min(selectedHourIdx, hourlyWindows.length - 1);
  const activeSlot = hourlyWindows[Math.max(0, safeIdx)] || hourlyWindows[0];
  const recommended = sprayPlan?.recommendedWindow || {
    startTimestamp: '2024-10-14T06:00:00Z',
    endTimestamp: '2024-10-14T08:00:00Z',
    durationHours: 3,
    averageSuitabilityScore: 94,
    meanDeltaTCelsius: 4.8,
    meanWindSpeedKmh: 7.2,
    nozzleRecommendation: 'Standard Flat-Fan or Medium VMD (250–350 µm) at 2.5 bar'
  };

  const formatHour = (iso) => {
    if (!iso) return '06:00';
    const match = String(iso).match(/T(\d{2}:\d{2})/);
    return match ? match[1] : String(iso).slice(0, 5);
  };

  return (
    <div className="agro-spray-card" data-testid="agro-spray-window-card">
      <div className="spray-card-header">
        <div>
          <span className="spray-eyebrow">
            <DropletIcon size={14} /> DELTA-T (&Delta;T) &amp; DRIFT SPRAY OPTIMIZER
          </span>
          <h3 className="spray-card-title">24-Hour Foliar Application Window Schedule</h3>
          <p className="spray-card-subtitle">
            Psychrometric droplet survival (&Delta;T 2&ndash;8&deg;C), anemometer drift limits (&le;15 km/h) &amp; 3h rainfastness
          </p>
        </div>

        <div className="spray-summary-counters">
          <div className="spray-counter-pill optimal">
            <strong>{sprayPlan?.optimalHoursCount ?? 9}h</strong> Optimal
          </div>
          <div className="spray-counter-pill marginal">
            <strong>{sprayPlan?.marginalHoursCount ?? 6}h</strong> Marginal
          </div>
          <div className="spray-counter-pill lockout">
            <strong>{sprayPlan?.lockoutHoursCount ?? 9}h</strong> Lockout
          </div>
        </div>
      </div>

      {recommended && (
        <div className="recommended-boom-banner" data-testid="recommended-spray-banner">
          <div className="boom-banner-left">
            <CheckCircleIcon size={20} color="#1b4332" />
            <div>
              <span className="boom-banner-label">BEST 3-HOUR TRACTOR / KNAPSACK BOOM BLOCK</span>
              <h4 className="boom-banner-window">
                {formatHour(recommended.startTimestamp)} &ndash; {formatHour(recommended.endTimestamp)} WAT
                <span className="boom-score-badge">Score {recommended.averageSuitabilityScore}/100</span>
              </h4>
              <p className="boom-nozzle-note">{recommended.nozzleRecommendation}</p>
            </div>
          </div>
          <div className="boom-banner-metrics">
            <div>
              <span>Mean &Delta;T</span>
              <strong>{recommended.meanDeltaTCelsius}&deg;C</strong>
            </div>
            <div>
              <span>Mean Wind</span>
              <strong>{recommended.meanWindSpeedKmh} km/h</strong>
            </div>
          </div>
        </div>
      )}

      <div className="spray-hourly-strip" role="listbox" aria-label="24-Hour Spray Schedule Strip">
        {hourlyWindows.slice(0, 12).map((slot, idx) => {
          const isSelected = idx === safeIdx;
          return (
            <button
              key={slot.observationTimestamp || idx}
              type="button"
              className={`spray-hour-slot ${slot.colorToken || 'emerald'} ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedHourIdx(idx)}
              data-testid={`spray-slot-${idx}`}
            >
              <span className="slot-time">{formatHour(slot.observationTimestamp)}</span>
              <strong className="slot-dt">&Delta;T {slot.deltaTCelsius}&deg;</strong>
              <span className="slot-wind">{slot.windSpeedKmh} km/h</span>
            </button>
          );
        })}
      </div>

      <div className="spray-slot-detail-panel" data-testid="spray-slot-detail">
        <div className="slot-detail-top">
          <div className="slot-detail-title-group">
            <ClockIcon size={16} />
            <strong>Selected Window: {formatHour(activeSlot.observationTimestamp)} WAT</strong>
            <span className={`slot-status-badge ${activeSlot.colorToken || 'emerald'}`}>
              {activeSlot.status} ({activeSlot.suitabilityScore}/100)
            </span>
          </div>
          <span className="slot-nozzle-pill">{activeSlot.nozzleGuidance}</span>
        </div>

        <div className="slot-detail-metrics-row">
          <div className="slot-detail-stat">
            <span>Dry-Bulb / Wet-Bulb</span>
            <strong>
              {activeSlot.airTempCelsius}&deg;C / {activeSlot.wetBulbCelsius}&deg;C
            </strong>
          </div>
          <div className="slot-detail-stat">
            <span>Psychrometric &Delta;T</span>
            <strong>{activeSlot.deltaTCelsius}&deg;C</strong>
          </div>
          <div className="slot-detail-stat">
            <span>Wind / Gusts</span>
            <strong>
              <WindIcon size={14} /> {activeSlot.windSpeedKmh} / {activeSlot.windGustKmh} km/h
            </strong>
          </div>
          <div className="slot-detail-stat">
            <span>3h Lookahead Rain</span>
            <strong>{activeSlot.upcoming3hRainMm ?? 0} mm</strong>
          </div>
        </div>

        {Array.isArray(activeSlot.limitingFactors) && activeSlot.limitingFactors.length > 0 && (
          <div className="slot-limiting-warning" data-testid="spray-limiting-factors">
            <AlertTriangleIcon size={15} />
            <span>
              <strong>Limiting Factors:</strong> {activeSlot.limitingFactors.join(' • ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
