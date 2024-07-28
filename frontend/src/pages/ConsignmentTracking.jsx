import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LiveTransitMap from '../components/LiveTransitMap';
import './ConsignmentTracking.css';

/**
 * Standard vector icons adhering to DESIGN_SYSTEM.md
 */
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const GaugeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 14 4-4" />
    <path d="M3.34 19a10 10 0 1 1 17.32 0" />
  </svg>
);

const SnowflakeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="22" />
    <line x1="20" y1="12" x2="4" y2="12" />
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const RadioIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="2" />
    <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
  </svg>
);

const PhoneCallIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const DocumentIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const defaultConsignmentRecord = {
  orderId: 'ORD-2024-NG-99812',
  produce: 'Premium White Maize & Grain Lots (150 Bags / 7.5 MT)',
  currentStep: 3,
  estimatedArrival: 'Today, 18:45 WAT',
  etaHoursRemaining: '3h 15m remaining',
  distanceRemainingKm: 184,
  totalDistanceKm: 780,
  driver: {
    name: 'Ibrahim Aliyu Bello',
    phone: '+234 803 123 4567',
    licenseClass: 'FRSC Class C Heavy Freight',
    experienceYears: 8,
    rating: 4.95,
    completedTrips: 142
  },
  vehicle: {
    make: 'Isuzu',
    model: 'F-Series 15T Heavy Reefer',
    plateNumber: 'KAD-481-XA',
    hasReefer: true,
    reeferSetpointC: 4.0
  },
  origin: {
    name: 'Zaria Agro-Cooperative Farmgate Depot',
    city: 'Zaria, Kaduna State',
    coordinates: { lng: 7.7199, lat: 11.0855 }
  },
  destination: {
    name: 'Mile 12 International Wholesale Agro Hub',
    city: 'Ketu-Mile 12, Lagos State',
    coordinates: { lng: 3.3942, lat: 6.6118 }
  },
  currentTelemetry: {
    coordinates: { lng: 4.5418, lat: 8.4966 },
    speedKmh: 68.4,
    headingDegrees: 195,
    altitudeMeters: 290,
    batteryLevelPct: 89,
    cargoTemperatureC: 3.8,
    recordedAt: new Date().toISOString()
  },
  breadcrumbs: [
    { coordinates: { lng: 7.7199, lat: 11.0855 } },
    { coordinates: { lng: 6.5569, lat: 9.6177 } },
    { coordinates: { lng: 5.0450, lat: 8.9500 } },
    { coordinates: { lng: 4.5418, lat: 8.4966 } }
  ]
};

const MOCK_CONSIGNMENT_DATABASE = {
  'ORD-2024-NG-99812': defaultConsignmentRecord,
  'ORD-2024-GH-99812': defaultConsignmentRecord
};

export const ConsignmentTracking = () => {
  const [searchQuery, setSearchQuery] = useState('ORD-2024-NG-99812');
  const [activeOrder, setActiveOrder] = useState(defaultConsignmentRecord);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim().toUpperCase();
    if (MOCK_CONSIGNMENT_DATABASE[query]) {
      setActiveOrder(MOCK_CONSIGNMENT_DATABASE[query]);
    } else {
      // Create fallback display representation for arbitrary query
      setActiveOrder({
        ...defaultConsignmentRecord,
        orderId: query
      });
    }
  };

  const handleShareClick = () => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const steps = [
    { num: 1, label: 'Farm Loaded', time: '07:30 GMT' },
    { num: 2, label: 'Inspection Passed', time: '09:15 GMT' },
    { num: 3, label: 'In Transit', time: 'Active Now' },
    { num: 4, label: 'Regional Gate', time: 'Est. 17:00' },
    { num: 5, label: 'Delivered', time: 'Est. 18:45' }
  ];

  const currentStep = activeOrder?.currentStep || 3;
  const progressPercent = Math.min(Math.max(((currentStep - 1) / (steps.length - 1)) * 100, 0), 100);

  return (
    <div className="consignment-tracking-page" data-testid="consignment-tracking-page">
      <div className="tracking-page-container">
        {/* Breadcrumb Navigation */}
        <nav className="tracking-nav-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/" className="breadcrumb-link">Home</Link>
          <span className="breadcrumb-separator">/</span>
          <Link to="/marketplace" className="breadcrumb-link">Logistics</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-active">Live Consignment Tracking</span>
        </nav>

        {/* Header Section */}
        <div className="tracking-header-section">
          <div className="tracking-header-titles">
            <h1>Live Consignment GPS Radar</h1>
            <p>Real-time vehicle telemetry, cold-chain temperature logs, and delivery milestones</p>
          </div>

          <form onSubmit={handleSearchSubmit} className="tracking-search-bar" role="search">
            <SearchIcon />
            <input
              type="text"
              className="tracking-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter Consignment ID..."
              aria-label="Search Consignment ID"
            />
            <button type="submit" className="track-btn">Track Order</button>
          </form>
        </div>

        {/* Milestone Stepper Card */}
        <div className="transit-stepper-card">
          <div className="stepper-header">
            <h3 className="stepper-title">{activeOrder?.produce || 'Agricultural Consignment'}</h3>
            <span className="stepper-eta-badge" data-testid="eta-badge">
              ETA: {activeOrder?.estimatedArrival || 'Calculating'}
            </span>
          </div>

          <div className="stepper-track-container">
            <div className="stepper-track-line" />
            <div className="stepper-track-progress" style={{ width: `${progressPercent}%` }} />

            {steps.map((st) => {
              const isCompleted = st.num < currentStep;
              const isActive = st.num === currentStep;
              return (
                <div
                  key={`step-${st.num}`}
                  className={`stepper-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                >
                  <div className="step-node">
                    {isCompleted ? <CheckIcon /> : st.num}
                  </div>
                  <span className="step-label">{st.label}</span>
                  <span className="step-time">{st.time}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Two-Column Tracking Dashboard */}
        <div className="tracking-dashboard-grid">
          {/* Main Map & Live Telemetry Left Column */}
          <div className="tracking-main-visualizer">
            <LiveTransitMap
              consignmentOrderId={activeOrder?.orderId}
              driverName={activeOrder?.driver?.name}
              vehicleRegistration={activeOrder?.vehicle?.plateNumber}
              origin={activeOrder?.origin}
              destination={activeOrder?.destination}
              currentTelemetry={activeOrder?.currentTelemetry}
              breadcrumbs={activeOrder?.breadcrumbs}
              isLive={true}
            />

            {/* Telemetry Metric Cards */}
            <div className="telemetry-cards-deck">
              <div className="telemetry-card">
                <div className="card-icon-badge">
                  <ClockIcon />
                </div>
                <div className="card-content">
                  <h4>Arrival Timeline</h4>
                  <p className="card-metric-val" data-testid="card-eta-val">
                    {activeOrder?.etaHoursRemaining || '3h 15m'}
                  </p>
                  <p className="card-subtext">On schedule via N6 Highway Corridor</p>
                </div>
              </div>

              <div className="telemetry-card">
                <div className="card-icon-badge harvest">
                  <GaugeIcon />
                </div>
                <div className="card-content">
                  <h4>Route Distance</h4>
                  <p className="card-metric-val" data-testid="card-distance-val">
                    {activeOrder?.distanceRemainingKm || 184} km remaining
                  </p>
                  <p className="card-subtext">
                    {activeOrder?.totalDistanceKm - activeOrder?.distanceRemainingKm} of {activeOrder?.totalDistanceKm} km completed
                  </p>
                </div>
              </div>

              <div className="telemetry-card">
                <div className="card-icon-badge blue">
                  <SnowflakeIcon />
                </div>
                <div className="card-content">
                  <h4>Cold-Chain Reefer</h4>
                  <p className="card-metric-val" data-testid="card-reefer-val">
                    +{activeOrder?.currentTelemetry?.cargoTemperatureC || 3.8}°C
                  </p>
                  <p className="card-subtext">Optimal range for grain moisture lock</p>
                </div>
              </div>

              <div className="telemetry-card">
                <div className="card-icon-badge">
                  <RadioIcon />
                </div>
                <div className="card-content">
                  <h4>Telemetry Sensor Pod</h4>
                  <p className="card-metric-val" data-testid="card-pod-val">
                    {activeOrder?.currentTelemetry?.batteryLevelPct || 89}% Battery
                  </p>
                  <p className="card-subtext">GPS Accuracy: ±3.2 meters • 4G LTE Ping</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Right Column */}
          <div className="tracking-sidebar">
            {/* Driver Profile Card */}
            <div className="sidebar-card">
              <h3 className="sidebar-card-title">Assigned Carrier Driver</h3>
              <div className="driver-profile-row">
                <div className="driver-avatar-circle">
                  {activeOrder?.driver?.name ? activeOrder.driver.name.charAt(0) : 'D'}
                </div>
                <div className="driver-identity">
                  <h4>{activeOrder?.driver?.name || 'Assigned Driver'}</h4>
                  <p>{activeOrder?.driver?.licenseClass || 'Commercial License'}</p>
                </div>
              </div>

              <div className="driver-detail-specs">
                <div className="spec-line">
                  <span>Vehicle Make:</span>
                  <span>{activeOrder?.vehicle?.make} {activeOrder?.vehicle?.model}</span>
                </div>
                <div className="spec-line">
                  <span>License Plate:</span>
                  <span>{activeOrder?.vehicle?.plateNumber}</span>
                </div>
                <div className="spec-line">
                  <span>Driver Rating:</span>
                  <span>{activeOrder?.driver?.rating} / 5.0 Rating</span>
                </div>
                <div className="spec-line">
                  <span>Completed Runs:</span>
                  <span>{activeOrder?.driver?.completedTrips} Verified Hauls</span>
                </div>
              </div>

              <button
                type="button"
                className="sidebar-action-btn primary"
                onClick={() => alert(`Calling driver at ${activeOrder?.driver?.phone}`)}
              >
                <PhoneCallIcon />
                <span>Call Driver ({activeOrder?.driver?.phone})</span>
              </button>
            </div>

            {/* Consignment Document & Dispatch Actions */}
            <div className="sidebar-card">
              <h3 className="sidebar-card-title">Dispatch Actions</h3>
              <button
                type="button"
                className="sidebar-action-btn outline"
                onClick={() => alert('Downloading official Bill of Lading (PDF)...')}
              >
                <DocumentIcon />
                <span>Download Bill of Lading (PDF)</span>
              </button>

              <button
                type="button"
                className="sidebar-action-btn outline"
                onClick={handleShareClick}
              >
                <ShareIcon />
                <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Share Live Tracking Link'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsignmentTracking;
