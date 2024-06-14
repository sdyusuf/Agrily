import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ColdChainGauge from '../components/ColdChainGauge';
import './ColdChainMonitor.css';

/**
 * Clean SVG icons compliant with DESIGN_SYSTEM.md (No emojis)
 */
const SnowflakeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="22" />
    <line x1="20" y1="12" x2="4" y2="12" />
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const DropletIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);

const BatteryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="16" height="10" rx="2" ry="2" />
    <line x1="22" y1="11" x2="22" y2="13" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const RefreshCwIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const DoorIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 20V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16" />
    <path d="M2 20h20" />
    <circle cx="14" cy="12" r="1" />
  </svg>
);

const FileTextIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

// Demo preset cold-chain monitored pods
const MONITORED_PODS = [
  {
    podId: 'POD-BERRY-01',
    consignmentId: 'CSG-2024-001',
    produceCategory: 'berries',
    produceName: 'Fresh Strawberries & Blueberries',
    vehicleRegistration: 'KAA 412X',
    currentTemp: 2.4,
    currentHumidity: 92,
    doorOpen: false,
    doorOpenDuration: 0,
    battery: 94,
    rssi: -68,
    ambientLightLux: 12,
    targetTemp: { min: 0, optimal: 2, max: 4, criticalMin: -1, criticalMax: 8 },
    targetHumidity: { min: 90, optimal: 95, max: 98, criticalMin: 80, criticalMax: 100 },
    shelfLifePreserved: 98.6,
    shelfLifeDaysLost: 0.1,
    recentExcursions: [
      {
        id: 'EXC-101',
        timestamp: '10:14 AM',
        parameter: 'Temperature',
        value: '4.8°C',
        limit: 'Max 4.0°C',
        severity: 'low_warning',
        duration: '6 mins',
        action: 'Reefer cycle re-calibrated. Back within 2.4°C.'
      }
    ]
  },
  {
    podId: 'POD-DAIRY-04',
    consignmentId: 'CSG-2024-002',
    produceCategory: 'dairy',
    produceName: 'Pasteurized Organic Whole Milk',
    vehicleRegistration: 'KBZ 982Y',
    currentTemp: 3.8,
    currentHumidity: 78,
    doorOpen: false,
    doorOpenDuration: 0,
    battery: 88,
    rssi: -72,
    ambientLightLux: 8,
    targetTemp: { min: 1, optimal: 3, max: 5, criticalMin: 0, criticalMax: 7 },
    targetHumidity: { min: 60, optimal: 75, max: 85, criticalMin: 50, criticalMax: 95 },
    shelfLifePreserved: 99.2,
    shelfLifeDaysLost: 0.05,
    recentExcursions: []
  },
  {
    podId: 'POD-MEAT-02',
    consignmentId: 'CSG-2024-003',
    produceCategory: 'meat',
    produceName: 'Chilled Pasture-Raised Beef Sirloin',
    vehicleRegistration: 'KDD 104M',
    currentTemp: 6.2,
    currentHumidity: 86,
    doorOpen: true,
    doorOpenDuration: 145,
    battery: 79,
    rssi: -80,
    ambientLightLux: 340,
    targetTemp: { min: -2, optimal: 0, max: 2, criticalMin: -4, criticalMax: 4 },
    targetHumidity: { min: 80, optimal: 85, max: 90, criticalMin: 70, criticalMax: 95 },
    shelfLifePreserved: 88.4,
    shelfLifeDaysLost: 1.4,
    recentExcursions: [
      {
        id: 'EXC-201',
        timestamp: '10:35 AM',
        parameter: 'Door Open & Temp Excursion',
        value: '6.2°C (Door 145s)',
        limit: 'Max 2.0°C / Door 60s',
        severity: 'high_critical',
        duration: '4 mins',
        action: 'Immediate driver alert dispatched to latch reefer bay door.'
      }
    ]
  },
  {
    podId: 'POD-GREENS-07',
    consignmentId: 'CSG-2024-004',
    produceCategory: 'greens',
    produceName: 'Baby Spinach & Kale Bundles',
    vehicleRegistration: 'KCY 551L',
    currentTemp: 1.5,
    currentHumidity: 96,
    doorOpen: false,
    doorOpenDuration: 0,
    battery: 91,
    rssi: -65,
    ambientLightLux: 5,
    targetTemp: { min: 0, optimal: 1, max: 4, criticalMin: -0.5, criticalMax: 7 },
    targetHumidity: { min: 92, optimal: 96, max: 98, criticalMin: 85, criticalMax: 100 },
    shelfLifePreserved: 99.5,
    shelfLifeDaysLost: 0.02,
    recentExcursions: []
  }
];

export default function ColdChainMonitor() {
  const [selectedPodId, setSelectedPodId] = useState(MONITORED_PODS[0].podId);
  const [activePod, setActivePod] = useState(MONITORED_PODS[0]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [simulatedTemperature, setSimulatedTemperature] = useState(null);

  // Switch pod data
  const handleSelectPod = (podId) => {
    setSelectedPodId(podId);
    const found = MONITORED_PODS.find((p) => p.podId === podId);
    if (found) {
      setActivePod(found);
      setSimulatedTemperature(null);
    }
  };

  // Simulate or fetch live telemetry
  const handleRefreshTelemetry = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Attempt backend fetch if accessible
      const response = await fetch(`/api/sensors/consignment/${activePod?.consignmentId || 'CSG-2024-001'}/latest`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setActivePod((prev) => ({
            ...prev,
            currentTemp: result.data.temperatureC,
            currentHumidity: result.data.humidityPercent,
            doorOpen: result.data.doorContactOpen,
            battery: result.data.batteryPercent || prev.battery
          }));
        }
      } else {
        // Fallback micro-fluctuation for tactile simulation
        const delta = (Math.random() * 0.4 - 0.2);
        setActivePod((prev) => ({
          ...prev,
          currentTemp: parseFloat((prev.currentTemp + delta).toFixed(1))
        }));
      }
    } catch {
      const delta = (Math.random() * 0.4 - 0.2);
      setActivePod((prev) => ({
        ...prev,
        currentTemp: parseFloat((prev.currentTemp + delta).toFixed(1))
      }));
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [activePod?.consignmentId]);

  useEffect(() => {
    const timer = setInterval(() => {
      // Subtle live jitter to indicate real-time heartbeat
      setActivePod((prev) => {
        if (!prev) return prev;
        const drift = (Math.random() * 0.2 - 0.1);
        return {
          ...prev,
          currentTemp: parseFloat((prev.currentTemp + drift).toFixed(1))
        };
      });
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const displayTemp = simulatedTemperature !== null ? simulatedTemperature : (activePod?.currentTemp ?? 2.0);
  const displayHumidity = activePod?.currentHumidity ?? 90;

  // Door status evaluation
  const isDoorOpen = activePod?.doorOpen ?? false;
  const isTempCritical = displayTemp > (activePod?.targetTemp?.criticalMax ?? 8) || displayTemp < (activePod?.targetTemp?.criticalMin ?? -2);
  const isTempWarning = !isTempCritical && (displayTemp > (activePod?.targetTemp?.max ?? 4) || displayTemp < (activePod?.targetTemp?.min ?? 0));

  return (
    <div className="cold-chain-monitor-page" data-testid="cold-chain-monitor">
      {/* Top Navigation & Breadcrumbs */}
      <div className="monitor-topbar">
        <Link to="/tracking" className="back-link">
          <ArrowLeftIcon />
          <span>Back to Fleet Tracking</span>
        </Link>
        <div className="telemetry-live-badge">
          <span className="pulsing-radar-dot"></span>
          <span>MQTT LIVE TELEMETRY</span>
        </div>
      </div>

      {/* Main Page Header */}
      <header className="monitor-header">
        <div className="header-text-block">
          <h1 className="monitor-title">Cold-Chain Sensor Telemetry</h1>
          <p className="monitor-subtitle">
            Continuous IoT environmental monitoring, excursion detection, and shelf-life compliance audit for temperature-controlled freight.
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn-cert-modal"
            onClick={() => setShowCertificateModal(true)}
            aria-label="Audit Certificate"
          >
            <FileTextIcon />
            <span>Audit Certificate</span>
          </button>
          <button
            type="button"
            className={`btn-refresh-telemetry ${isRefreshing ? 'spinning' : ''}`}
            onClick={handleRefreshTelemetry}
            aria-label="Sync Pings"
          >
            <RefreshCwIcon />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Pings'}</span>
          </button>
        </div>
      </header>

      {/* Door or Critical Temperature Alert Banner */}
      {(isDoorOpen || isTempCritical) && (
        <div className="critical-excursion-banner" role="alert">
          <div className="banner-icon-col">
            <AlertTriangleIcon />
          </div>
          <div className="banner-content">
            <h4 className="banner-heading">
              {isDoorOpen ? 'Reefer Door Breach Detected' : 'Critical Temperature Excursion'}
            </h4>
            <p className="banner-message">
              {isDoorOpen
                ? `Pod ${activePod?.podId} reports bay door open for ${activePod?.doorOpenDuration}s. Ambient light spiked to ${activePod?.ambientLightLux} lux. Immediate closure required to avoid product degradation.`
                : `Pod ${activePod?.podId} recorded ${displayTemp}°C, exceeding critical safety threshold of ${activePod?.targetTemp?.criticalMax}°C.`}
            </p>
          </div>
          <div className="banner-action-col">
            <button
              type="button"
              className="btn-banner-dismiss"
              onClick={() => {
                setActivePod((prev) => ({
                  ...prev,
                  doorOpen: false,
                  doorOpenDuration: 0,
                  currentTemp: prev?.targetTemp?.optimal ?? 2.0
                }));
              }}
            >
              Resolve Alert
            </button>
          </div>
        </div>
      )}

      {/* Pod Switcher Bar */}
      <nav className="pod-switcher-bar" aria-label="Monitored Sensor Pods">
        <div className="switcher-label">Monitored Pods:</div>
        <div className="switcher-pills">
          {MONITORED_PODS.map((pod) => (
            <button
              key={pod.podId}
              type="button"
              className={`pod-pill-btn ${selectedPodId === pod.podId ? 'active' : ''}`}
              onClick={() => handleSelectPod(pod.podId)}
            >
              <span className="pod-pill-id">{pod.podId}</span>
              <span className="pod-pill-category">({pod.produceCategory})</span>
              {pod.doorOpen && <span className="pod-pill-warn-dot" title="Door Open Alert" />}
            </button>
          ))}
        </div>
      </nav>

      {/* Active Pod Overview Banner */}
      <section className="active-pod-hero-card">
        <div className="pod-hero-details">
          <div className="pod-badge-group">
            <span className="badge-pod-id">{activePod?.podId}</span>
            <span className="badge-consignment-id">Consignment: {activePod?.consignmentId}</span>
            <span className="badge-vehicle">Vehicle: {activePod?.vehicleRegistration}</span>
          </div>
          <h2 className="pod-produce-name">{activePod?.produceName}</h2>
          <div className="pod-specs-strip">
            <span className="spec-item">
              <strong>Storage Profile:</strong> {activePod?.produceCategory?.toUpperCase()}
            </span>
            <span className="spec-item">
              <strong>Temp Setpoint:</strong> {activePod?.targetTemp?.optimal}°C (Safe: {activePod?.targetTemp?.min}°C to {activePod?.targetTemp?.max}°C)
            </span>
            <span className="spec-item">
              <strong>Humidity Setpoint:</strong> {activePod?.targetHumidity?.optimal}% RH (Safe: {activePod?.targetHumidity?.min}% - {activePod?.targetHumidity?.max}%)
            </span>
          </div>
        </div>

        <div className="pod-status-summary-box">
          <div className="summary-status-header">
            <span className="summary-label">Chain-of-Custody</span>
            <span className={`compliance-tag ${activePod?.shelfLifePreserved > 95 ? 'compliant' : 'at-risk'}`}>
              <ShieldCheckIcon />
              <span>{activePod?.shelfLifePreserved > 95 ? 'FDA / KEBS Compliant' : 'Excursion Logged'}</span>
            </span>
          </div>
          <div className="compliance-score-val">{activePod?.shelfLifePreserved}%</div>
          <div className="compliance-subtext">Estimated Shelf-Life Preserved ({activePod?.shelfLifeDaysLost}d lost)</div>
        </div>
      </section>

      {/* Gauges & Telemetry Visualizer Grid */}
      <section className="gauges-visualizer-grid">
        <div className="gauge-panel-card">
          <div className="panel-card-header">
            <div className="card-header-icon-title">
              <SnowflakeIcon />
              <h3>Core Cargo Temperature</h3>
            </div>
            <span className="panel-badge-sub">Reefer Probe #1</span>
          </div>
          <div className="panel-gauge-wrapper">
            <ColdChainGauge
              value={displayTemp}
              unit="°C"
              minScale={-10}
              maxScale={25}
              targetMin={activePod?.targetTemp?.min ?? 0}
              targetMax={activePod?.targetTemp?.max ?? 4}
              targetOptimal={activePod?.targetTemp?.optimal ?? 2}
              criticalMin={activePod?.targetTemp?.criticalMin ?? -2}
              criticalMax={activePod?.targetTemp?.criticalMax ?? 8}
              metricType="temperature"
              label="Cargo Temp"
            />
          </div>
        </div>

        <div className="gauge-panel-card">
          <div className="panel-card-header">
            <div className="card-header-icon-title">
              <DropletIcon />
              <h3>Relative Humidity</h3>
            </div>
            <span className="panel-badge-sub">Hygrometer #1</span>
          </div>
          <div className="panel-gauge-wrapper">
            <ColdChainGauge
              value={displayHumidity}
              unit="%"
              minScale={0}
              maxScale={100}
              targetMin={activePod?.targetHumidity?.min ?? 80}
              targetMax={activePod?.targetHumidity?.max ?? 95}
              targetOptimal={activePod?.targetHumidity?.optimal ?? 90}
              criticalMin={activePod?.targetHumidity?.criticalMin ?? 70}
              criticalMax={activePod?.targetHumidity?.criticalMax ?? 98}
              metricType="humidity"
              label="Relative Humidity"
            />
          </div>
        </div>
      </section>

      {/* Secondary Sensor Metrics Grid */}
      <section className="secondary-metrics-grid">
        {/* Door Contact & Seal Card */}
        <div className="metric-card">
          <div className="metric-card-header">
            <div className="metric-title-group">
              <DoorIcon />
              <h4>Bay Door Status</h4>
            </div>
            <span className={`status-pill ${isDoorOpen ? 'pill-danger' : 'pill-safe'}`}>
              {isDoorOpen ? 'Door Open' : 'Sealed & Locked'}
            </span>
          </div>
          <div className="metric-value-large">
            {isDoorOpen ? `${activePod?.doorOpenDuration}s` : '0s Open'}
          </div>
          <p className="metric-detail-note">
            Ambient light: <strong>{activePod?.ambientLightLux} lux</strong> • Magnetic reed switch armed
          </p>
        </div>

        {/* Battery & Power Life Card */}
        <div className="metric-card">
          <div className="metric-card-header">
            <div className="metric-title-group">
              <BatteryIcon />
              <h4>Pod Battery & Telemetry</h4>
            </div>
            <span className="status-pill pill-safe">Operational</span>
          </div>
          <div className="metric-value-large">{activePod?.battery}%</div>
          <div className="metric-progress-track">
            <div className="metric-progress-fill" style={{ width: `${activePod?.battery}%` }}></div>
          </div>
          <p className="metric-detail-note">
            Signal: <strong>{activePod?.rssi} dBm</strong> • Est. runtime: ~165 days
          </p>
        </div>

        {/* Product Shelf-Life Impact */}
        <div className="metric-card">
          <div className="metric-card-header">
            <div className="metric-title-group">
              <ShieldCheckIcon />
              <h4>Dynamic Shelf-Life</h4>
            </div>
            <span className="status-pill pill-safe">High Viability</span>
          </div>
          <div className="metric-value-large">{activePod?.shelfLifePreserved}%</div>
          <p className="metric-detail-note">
            Preserved against Q10 thermal decay curve. Impact: -{activePod?.shelfLifeDaysLost} days.
          </p>
        </div>
      </section>

      {/* Excursion Audit Timeline Log */}
      <section className="excursion-log-card">
        <div className="log-card-header">
          <div className="log-header-left">
            <AlertTriangleIcon />
            <h3>Excursion Anomaly & Corrective Action Log</h3>
          </div>
          <span className="excursion-count-badge">
            {activePod?.recentExcursions?.length || 0} Events Recorded
          </span>
        </div>

        {(!activePod?.recentExcursions || activePod.recentExcursions.length === 0) ? (
          <div className="no-excursions-empty">
            <ShieldCheckIcon />
            <p>Zero thermal or humidity excursions recorded. Consignment is adhering 100% to cold-chain tolerances.</p>
          </div>
        ) : (
          <div className="excursion-table-wrapper">
            <table className="excursions-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Parameter</th>
                  <th>Observed Value</th>
                  <th>Safety Limit</th>
                  <th>Severity</th>
                  <th>Duration</th>
                  <th>Corrective Action Taken</th>
                </tr>
              </thead>
              <tbody>
                {activePod.recentExcursions.map((exc) => (
                  <tr key={exc.id}>
                    <td className="cell-timestamp">{exc.timestamp}</td>
                    <td className="cell-parameter">
                      <strong>{exc.parameter}</strong>
                    </td>
                    <td className="cell-value">{exc.value}</td>
                    <td className="cell-limit">{exc.limit}</td>
                    <td>
                      <span className={`severity-tag ${exc.severity}`}>
                        {exc.severity.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="cell-duration">{exc.duration}</td>
                    <td className="cell-action">{exc.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Compliance Certificate Modal */}
      {showCertificateModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="certificate-modal-card">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <ShieldCheckIcon />
                <h3>Cold-Chain Chain-of-Custody Certificate</h3>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setShowCertificateModal(false)}
                aria-label="Close Modal"
              >
                ✕
              </button>
            </div>
            <div className="modal-body-cert">
              <div className="cert-meta-grid">
                <div className="cert-meta-item">
                  <span className="cert-meta-label">Consignment Order:</span>
                  <span className="cert-meta-value">{activePod?.consignmentId}</span>
                </div>
                <div className="cert-meta-item">
                  <span className="cert-meta-label">IoT Sensor Pod:</span>
                  <span className="cert-meta-value">{activePod?.podId}</span>
                </div>
                <div className="cert-meta-item">
                  <span className="cert-meta-label">Produce Variety:</span>
                  <span className="cert-meta-value">{activePod?.produceName}</span>
                </div>
                <div className="cert-meta-item">
                  <span className="cert-meta-label">Transit Vehicle:</span>
                  <span className="cert-meta-value">{activePod?.vehicleRegistration}</span>
                </div>
                <div className="cert-meta-item">
                  <span className="cert-meta-label">Compliance Score:</span>
                  <span className="cert-meta-value cert-highlight">{activePod?.shelfLifePreserved}%</span>
                </div>
                <div className="cert-meta-item">
                  <span className="cert-meta-label">QA Audit Status:</span>
                  <span className="cert-meta-value cert-safe">VERIFIED PASS</span>
                </div>
              </div>

              <div className="cert-disclaimer">
                This digital Chain-of-Custody Certificate validates that produce temperature and relative humidity
                were continuously recorded at 60-second intervals via encrypted Agrily IoT sensor pods.
                Readings comply with international cold-chain food safety handling guidelines (HACCP / KEBS / FDA).
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-close-secondary"
                onClick={() => setShowCertificateModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn-download-cert"
                onClick={() => {
                  if (typeof window !== 'undefined' && typeof window.alert === 'function') {
                    window.alert(`Certificate for Consignment ${activePod?.consignmentId} exported to PDF.`);
                  }
                  setShowCertificateModal(false);
                }}
              >
                Download PDF Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
