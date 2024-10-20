/**
 * ==============================================================================
 * 🌾 AGRILY HYPERLOCAL WEATHER: MASTER AGROMETEOROLOGICAL COCKPIT PAGE
 * ==============================================================================
 *
 * Enterprise command center for hyperlocal farm weather intelligence:
 *  - Automated Weather Station (AWS) & Virtual OpenWeatherMap Node selector
 *  - Real-time FAO-56 Penman-Monteith ET0 / ETc, VPD, Dew Point & Delta-T KPIs
 *  - Active Frost, Heatwave, Harmattan & Flash-Flood early warning banners
 *  - Interactive 8x8 Microclimate Doppler & Isotherm Radar Canvas
 *  - 7-Day Evapotranspiration vs. Rainfall Hydrological Chart
 *  - 24-Hour Agrochemical Spray Window Schedule & Multi-Channel Alert Modal
 * ==============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import './HyperlocalWeatherCockpit.css';
import MicroclimateRadarCanvas from '../components/MicroclimateRadarCanvas';
import EvapotranspirationTimelineChart from '../components/EvapotranspirationTimelineChart';
import AgroSprayWindowCard from '../components/AgroSprayWindowCard';
import WeatherAlertSubscriptionModal from '../components/WeatherAlertSubscriptionModal';
import {
  CloudRainIcon,
  ThermometerIcon,
  WindIcon,
  DropletIcon,
  SunIcon,
  BellRingIcon,
  AlertTriangleIcon,
  RefreshIcon,
  SnowflakeIcon
} from '../components/Icons';

const FALLBACK_STATIONS = [
  {
    _id: 's1',
    stationCode: 'AWS-JOS-1042',
    stationName: 'Jos Plateau Montane Observatory #4 (Vom Corridor)',
    stationType: 'Automated Weather Station (AWS)',
    stateRegion: 'Plateau',
    agroEcologicalZone: 'Mid-Altitude Montane',
    primaryCropFocus: 'Potato',
    elevationMeters: 1285,
    batteryVoltageVolts: 13.2,
    operationalStatus: 'Online'
  },
  {
    _id: 's2',
    stationCode: 'AWS-KAN-2018',
    stationName: 'Kano Kadawa Irrigation Valley Synoptic Node',
    stationType: 'OpenWeatherMap Virtual Grid Node',
    stateRegion: 'Kano',
    agroEcologicalZone: 'Sudan Savannah',
    primaryCropFocus: 'Maize',
    elevationMeters: 472,
    batteryVoltageVolts: 12.9,
    operationalStatus: 'Online'
  },
  {
    _id: 's3',
    stationCode: 'AWS-BEN-3055',
    stationName: 'Makurdi Floodplain Agrometeorological Tower',
    stationType: 'NiMet Synoptic Observatory',
    stateRegion: 'Benue',
    agroEcologicalZone: 'Southern Guinea Savannah',
    primaryCropFocus: 'Rice',
    elevationMeters: 112,
    batteryVoltageVolts: 12.6,
    operationalStatus: 'Online'
  }
];

export default function HyperlocalWeatherCockpit() {
  const [stations, setStations] = useState(FALLBACK_STATIONS);
  const [selectedStationCode, setSelectedStationCode] = useState('AWS-JOS-1042');
  const [selectedCrop, setSelectedCrop] = useState('Potato');
  const [telemetryData, setTelemetryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulatingFrost, setSimulatingFrost] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [bannerNotice, setBannerNotice] = useState('');

  const activeStation =
    stations.find((s) => s.stationCode === selectedStationCode) || stations[0] || FALLBACK_STATIONS[0];

  const fetchStations = useCallback(async () => {
    try {
      const res = await fetch('/api/weather/stations');
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setStations(json.data);
      }
    } catch {
      // Offline fallback already seeded
    }
  }, []);

  const fetchStationTelemetry = useCallback(async (stationCode, cropType) => {
    if (!stationCode) return;
    try {
      setLoading(true);
      const res = await fetch(
        `/api/weather/stations/${stationCode}/telemetry?cropType=${encodeURIComponent(cropType)}`
      );
      const json = await res.json();
      if (json.success) {
        setTelemetryData(json);
      }
    } catch {
      // Retain deterministic fallback in state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  useEffect(() => {
    fetchStationTelemetry(selectedStationCode, selectedCrop);
  }, [selectedStationCode, selectedCrop, fetchStationTelemetry]);

  const handleStationChange = (e) => {
    const newCode = e.target.value;
    setSelectedStationCode(newCode);
    const matched = stations.find((s) => s.stationCode === newCode);
    if (matched?.primaryCropFocus) {
      setSelectedCrop(matched.primaryCropFocus);
    }
  };

  const handleSimulateFrostSurge = async () => {
    setSimulatingFrost(true);
    try {
      const res = await fetch('/api/weather/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationCode: selectedStationCode,
          cropType: selectedCrop,
          airTempCelsius: 1.6,
          minTempCelsius: 0.8,
          maxTempCelsius: 16.2,
          relativeHumidityPct: 44,
          windSpeedKmh: 2.2,
          cloudCoverPct: 5
        })
      });
      const json = await res.json();
      if (json.success) {
        setBannerNotice(
          `Ingested Nocturnal Radiative Frost Surge (${json.reading.canopyTempCelsius}°C Canopy) on ${selectedStationCode}.`
        );
        await fetchStationTelemetry(selectedStationCode, selectedCrop);
      }
    } catch {
      setBannerNotice(
        `Simulated Nocturnal Radiative Frost Alert (0.9°C Canopy) triggered on ${selectedStationCode}.`
      );
    } finally {
      setSimulatingFrost(false);
    }
  };

  const currentObs = telemetryData?.currentObservation || {
    airTempCelsius: 14.8,
    minTempCelsius: 2.2,
    maxTempCelsius: 21.5,
    canopyTempCelsius: 1.1,
    relativeHumidityPct: 52,
    dewPointCelsius: 4.9,
    wetBulbCelsius: 9.8,
    deltaTCelsius: 5.0,
    vaporPressureDeficitKpa: 0.82,
    windSpeedKmh: 8.2,
    windGustKmh: 11.4,
    solarIrradianceWm2: 610,
    referenceEvapotranspirationMmDay: 4.3,
    cropEvapotranspirationEtcMmDay: 4.95,
    frostRiskProbabilityPct: 84,
    sprayWindowSuitability: 'Optimal Window'
  };

  const activeAlerts =
    Array.isArray(telemetryData?.hazardEvaluation?.alerts) &&
    telemetryData.hazardEvaluation.alerts.length > 0
      ? telemetryData.hazardEvaluation.alerts
      : [
          {
            alertCode: `ALT-FROST-${selectedStationCode}`,
            hazardType: 'RADIATIVE_FROST',
            severity: 'Critical Emergency',
            headline: `CRITICAL FREEZE: Canopy temp projected at 1.1°C (Radiative Inversion Frost)`,
            cropImpact: `${selectedCrop} faces intracellular ice crystallization and vascular necrosis below critical threshold.`,
            mitigationActions: [
              'Activate overhead micro-sprinkler frost protection (2.5–3.5 mm/hr) before wet-bulb temperature reaches 0.5°C to release latent heat of fusion (334 kJ/kg).',
              'Pre-irrigate dry topsoil before sunset to increase soil thermal conductivity and upward nocturnal longwave heat flux.'
            ]
          }
        ];

  return (
    <div className="hyperlocal-weather-page" data-testid="hyperlocal-weather-cockpit">
      {/* Top Executive Hero Header */}
      <header className="weather-cockpit-hero">
        <div className="weather-hero-inner">
          <div className="weather-hero-left">
            <span className="weather-hero-badge">
              <CloudRainIcon size={15} /> SPRINT 20 &bull; AGROMETEOROLOGICAL EARLY WARNING SYSTEM
            </span>
            <h1 className="weather-hero-title">
              Hyperlocal Weather Alerts &amp; Microclimate Cockpit
            </h1>
            <p className="weather-hero-subtitle">
              Real-time OpenWeatherMap &amp; NiMet synoptic ingestion, FAO-56 Penman-Monteith evapotranspiration,
              nocturnal radiative frost mechanics, and Delta-T foliar spray optimization.
            </p>
          </div>

          <div className="weather-hero-actions">
            <button
              type="button"
              className="weather-btn-secondary"
              onClick={handleSimulateFrostSurge}
              disabled={simulatingFrost}
              data-testid="simulate-frost-surge-btn"
            >
              <SnowflakeIcon size={16} />
              <span>{simulatingFrost ? 'Ingesting Telemetry...' : 'Simulate Frost Surge'}</span>
            </button>

            <button
              type="button"
              className="weather-btn-primary"
              onClick={() => setIsSubscriptionModalOpen(true)}
              data-testid="open-subscription-modal-btn"
            >
              <BellRingIcon size={16} />
              <span>Configure Push / SMS Alerts</span>
            </button>
          </div>
        </div>

        {/* Station & Crop Control Bar */}
        <div className="weather-control-bar">
          <div className="control-select-group">
            <label htmlFor="weather-station-select">Observatory / Virtual Grid Node</label>
            <select
              id="weather-station-select"
              value={selectedStationCode}
              onChange={handleStationChange}
              data-testid="weather-station-select"
            >
              {stations.map((st) => (
                <option key={st.stationCode} value={st.stationCode}>
                  {st.stationCode} &mdash; {st.stationName} ({st.agroEcologicalZone})
                </option>
              ))}
            </select>
          </div>

          <div className="control-select-group">
            <label htmlFor="weather-crop-select">Crop Cardinal Model</label>
            <select
              id="weather-crop-select"
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              data-testid="weather-crop-select"
            >
              {['Potato', 'Maize', 'Rice', 'Tomato', 'Cassava', 'Soybean', 'Onion', 'Cocoa'].map(
                (crop) => (
                  <option key={crop} value={crop}>
                    {crop}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="station-elevation-pill">
            <span>Altitude: <strong>{activeStation.elevationMeters ?? 1285}m ASL</strong></span>
            <span>Status: <strong className="online-dot">{activeStation.operationalStatus || 'Online'}</strong></span>
          </div>

          <button
            type="button"
            className="weather-refresh-btn"
            onClick={() => fetchStationTelemetry(selectedStationCode, selectedCrop)}
            aria-label="Refresh station telemetry"
            data-testid="refresh-weather-telemetry-btn"
          >
            <RefreshIcon size={15} /> Refresh
          </button>
        </div>
      </header>

      <main className="weather-cockpit-main">
        {bannerNotice && (
          <div className="weather-toast-banner" data-testid="weather-ingestion-banner">
            <AlertTriangleIcon size={18} />
            <span>{bannerNotice}</span>
          </div>
        )}

        {/* 5 Real-Time Agrometeorological KPI Cards */}
        <section className="weather-kpi-grid" aria-label="Real-Time Microclimate KPIs">
          <div className="weather-kpi-card" data-testid="kpi-air-canopy-temp">
            <div className="kpi-card-top">
              <span className="kpi-label">Air / Canopy Temp</span>
              <ThermometerIcon size={18} color="#2d6a4f" />
            </div>
            <strong className="kpi-value">
              {currentObs.airTempCelsius}&deg;C / {currentObs.canopyTempCelsius}&deg;C
            </strong>
            <span className="kpi-sub">
              Min {currentObs.minTempCelsius}&deg;C &bull; Max {currentObs.maxTempCelsius}&deg;C
            </span>
          </div>

          <div className="weather-kpi-card" data-testid="kpi-fao56-et">
            <div className="kpi-card-top">
              <span className="kpi-label">FAO-56 Reference ET0 / ETc</span>
              <SunIcon size={18} color="#bc6c25" />
            </div>
            <strong className="kpi-value">
              {currentObs.referenceEvapotranspirationMmDay} /{' '}
              {currentObs.cropEvapotranspirationEtcMmDay ?? currentObs.referenceEvapotranspirationMmDay} mm
            </strong>
            <span className="kpi-sub">
              Daily Irrigation: {Math.round((currentObs.cropEvapotranspirationEtcMmDay ?? 4.8) * 10)} m&sup3;/ha
            </span>
          </div>

          <div className="weather-kpi-card" data-testid="kpi-vpd-humidity">
            <div className="kpi-card-top">
              <span className="kpi-label">Vapor Pressure Deficit (VPD)</span>
              <DropletIcon size={18} color="#2d6a4f" />
            </div>
            <strong className="kpi-value">{currentObs.vaporPressureDeficitKpa} kPa</strong>
            <span className="kpi-sub">
              RH {currentObs.relativeHumidityPct}% &bull; Dew Point {currentObs.dewPointCelsius}&deg;C
            </span>
          </div>

          <div className="weather-kpi-card" data-testid="kpi-delta-t-wind">
            <div className="kpi-card-top">
              <span className="kpi-label">Spray &Delta;T &amp; Wind Speed</span>
              <WindIcon size={18} color="#1b4332" />
            </div>
            <strong className="kpi-value">
              &Delta;T {currentObs.deltaTCelsius}&deg;C &bull; {currentObs.windSpeedKmh} km/h
            </strong>
            <span className="kpi-sub">{currentObs.sprayWindowSuitability || 'Optimal Window'}</span>
          </div>

          <div className="weather-kpi-card" data-testid="kpi-frost-probability">
            <div className="kpi-card-top">
              <span className="kpi-label">Nocturnal Frost Risk</span>
              <SnowflakeIcon size={18} color="#991b1b" />
            </div>
            <strong className="kpi-value">{currentObs.frostRiskProbabilityPct ?? 0}%</strong>
            <span className="kpi-sub">
              Wet-Bulb {currentObs.wetBulbCelsius}&deg;C &bull; {selectedCrop} Model
            </span>
          </div>
        </section>

        {/* Active Weather Hazard Alerts Section */}
        <section className="weather-alerts-section" data-testid="active-weather-alerts-section">
          <div className="alerts-section-header">
            <h2 className="alerts-section-title">
              <AlertTriangleIcon size={20} color="#991b1b" /> Active Hyperlocal Crop Protection Advisories ({activeAlerts.length})
            </h2>
            {loading && <span className="telemetry-sync-pill">Syncing Synoptic Feed...</span>}
          </div>

          <div className="alerts-cards-list">
            {activeAlerts.map((alert, idx) => (
              <div
                key={alert.alertCode || idx}
                className={`weather-alert-banner-card ${
                  alert.severity === 'Critical Emergency' ? 'critical' : 'warning'
                }`}
                data-testid={`weather-alert-card-${idx}`}
              >
                <div className="alert-banner-top">
                  <span className="alert-hazard-tag">{alert.hazardType}</span>
                  <span className="alert-severity-pill">{alert.severity}</span>
                </div>
                <h3 className="alert-headline">{alert.headline}</h3>
                <p className="alert-crop-impact">{alert.cropImpact}</p>
                {Array.isArray(alert.mitigationActions) && (
                  <ul className="alert-mitigation-list">
                    {alert.mitigationActions.map((act, i) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Spatial Radar Canvas */}
        <section className="weather-cockpit-section">
          <MicroclimateRadarCanvas
            radarGrid={telemetryData?.radarGrid}
            stationName={activeStation.stationName}
            stationCode={activeStation.stationCode}
            agroEcologicalZone={activeStation.agroEcologicalZone}
          />
        </section>

        {/* 7-Day Evapotranspiration & 24-Hour Spray Schedule */}
        <section className="weather-dual-grid">
          <EvapotranspirationTimelineChart
            sevenDayForecast={telemetryData?.sevenDayForecast}
            timelineSummary={telemetryData?.timelineSummary}
            cropType={selectedCrop}
          />

          <AgroSprayWindowCard sprayPlan={telemetryData?.sprayPlan} />
        </section>
      </main>

      <WeatherAlertSubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        stationCode={activeStation.stationCode}
        stationName={activeStation.stationName}
        cropType={selectedCrop}
        onSaveSubscription={(sub) => {
          setBannerNotice(
            `Active Push/SMS/WhatsApp alert subscription confirmed for ${sub.subscriberEmail} (${sub.stationCode}).`
          );
        }}
      />
    </div>
  );
}
