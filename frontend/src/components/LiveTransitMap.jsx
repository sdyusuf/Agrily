import React, { useState, useMemo } from 'react';
import './LiveTransitMap.css';

/**
 * Standard vector icon primitives for map controls
 */
const CompassIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

const ZoomInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="11" y1="8" x2="11" y2="14" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const ZoomOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const CrosshairIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="22" y1="12" x2="18" y2="12" />
    <line x1="6" y1="12" x2="2" y2="12" />
    <line x1="12" y1="6" x2="12" y2="2" />
    <line x1="12" y1="22" x2="12" y2="18" />
  </svg>
);

const RouteTrailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="19" r="3" />
    <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
    <circle cx="18" cy="5" r="3" />
  </svg>
);

const TruckMarkerIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const FarmOriginIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const WarehouseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18" />
    <path d="M5 21V7l7-4 7 4v14" />
    <path d="M9 10h6v11H9z" />
  </svg>
);

/**
 * LiveTransitMap Component
 * Visualizes real-time vehicle GPS telemetry, waypoint breadcrumb trails,
 * and consignment transit progress on a responsive canvas.
 */
export const LiveTransitMap = ({
  consignmentOrderId = 'ORD-2024-NG-99812',
  driverName = 'Ibrahim Aliyu Bello',
  vehicleRegistration = 'KAD-481-XA',
  origin = {
    name: 'Zaria Maize & Grain Farmgate Depot',
    city: 'Zaria, Kaduna State',
    coordinates: { lng: 7.7199, lat: 11.0855 }
  },
  destination = {
    name: 'Mile 12 International Agro Wholesale Terminal',
    city: 'Mile 12, Lagos State',
    coordinates: { lng: 3.3942, lat: 6.6118 }
  },
  currentTelemetry = {
    coordinates: { lng: 4.5418, lat: 8.4966 },
    speedKmh: 68.4,
    headingDegrees: 195,
    altitudeMeters: 290,
    batteryLevelPct: 89,
    cargoTemperatureC: 3.8,
    recordedAt: new Date().toISOString()
  },
  breadcrumbs = [
    { coordinates: { lng: 7.7199, lat: 11.0855 } },
    { coordinates: { lng: 6.5569, lat: 9.6177 } },
    { coordinates: { lng: 5.0450, lat: 8.9500 } },
    { coordinates: { lng: 4.5418, lat: 8.4966 } }
  ],
  isLive = true
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showBreadcrumbs, setShowBreadcrumbs] = useState(true);
  const [isCentered, setIsCentered] = useState(true);

  // Bounding box calculations to normalize lat/long into SVG coordinate space (800x420)
  const mapWidth = 800;
  const mapHeight = 420;
  const padding = 60;

  const allPoints = useMemo(() => {
    const points = [
      origin?.coordinates || { lng: -1.3658, lat: 7.3789 },
      destination?.coordinates || { lng: -0.0166, lat: 5.6698 },
      currentTelemetry?.coordinates || { lng: -0.7812, lat: 6.4251 },
      ...(breadcrumbs || []).map(b => b.coordinates)
    ];
    return points.filter(p => p && typeof p.lng === 'number' && typeof p.lat === 'number');
  }, [origin, destination, currentTelemetry, breadcrumbs]);

  const bounds = useMemo(() => {
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    allPoints.forEach(p => {
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
    });

    // Provide default fallback delta if coordinates are identical
    if (maxLng - minLng < 0.05) { minLng -= 0.1; maxLng += 0.1; }
    if (maxLat - minLat < 0.05) { minLat -= 0.1; maxLat += 0.1; }

    return { minLng, maxLng, minLat, maxLat };
  }, [allPoints]);

  const projectToSvg = (coords) => {
    if (!coords || typeof coords.lng !== 'number' || typeof coords.lat !== 'number') {
      return { x: mapWidth / 2, y: mapHeight / 2 };
    }
    const lngSpan = bounds.maxLng - bounds.minLng;
    const latSpan = bounds.maxLat - bounds.minLat;

    // Invert lat because SVG origin (0,0) is top-left
    const x = padding + ((coords.lng - bounds.minLng) / lngSpan) * (mapWidth - 2 * padding);
    const y = padding + ((bounds.maxLat - coords.lat) / latSpan) * (mapHeight - 2 * padding);
    return { x, y };
  };

  const originSvg = projectToSvg(origin?.coordinates);
  const destSvg = projectToSvg(destination?.coordinates);
  const vehicleSvg = projectToSvg(currentTelemetry?.coordinates);

  const trailPathD = useMemo(() => {
    if (!breadcrumbs || breadcrumbs.length === 0) return '';
    return breadcrumbs.reduce((acc, pt, idx) => {
      const proj = projectToSvg(pt.coordinates);
      return idx === 0 ? `M ${proj.x} ${proj.y}` : `${acc} L ${proj.x} ${proj.y}`;
    }, '');
  }, [breadcrumbs, bounds]);

  const plannedRouteD = `M ${originSvg.x} ${originSvg.y} Q ${(originSvg.x + destSvg.x) / 2 - 30} ${(originSvg.y + destSvg.y) / 2 + 30} ${destSvg.x} ${destSvg.y}`;

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.75));
  const handleCenter = () => setIsCentered(true);
  const toggleBreadcrumbs = () => setShowBreadcrumbs(prev => !prev);

  return (
    <div className="live-transit-map-container" data-testid="live-transit-map">
      {/* Header Bar */}
      <div className="map-header-ribbon">
        <div className="map-title-wrap">
          <div className="map-title-icon-badge" aria-hidden="true">
            <CompassIcon />
          </div>
          <div>
            <h3 className="map-title-text">Active Fleet Geolocation Radar</h3>
            <p className="map-subtitle-text">
              Consignment: <strong>{consignmentOrderId}</strong> • Driver: {driverName} ({vehicleRegistration})
            </p>
          </div>
        </div>

        <div className="map-status-pill-wrap">
          <span className={`map-status-pill ${isLive ? 'live' : 'offline'}`} data-testid="live-status-pill">
            <span className={`pulse-dot ${isLive ? 'active' : 'gray'}`} />
            {isLive ? 'Live Telemetry Active' : 'Offline / Cached'}
          </span>
        </div>
      </div>

      {/* SVG Canvas Stage */}
      <div className="map-canvas-stage">
        <div className="map-grid-overlay" />

        {/* Floating Zoom & Layer Controls */}
        <div className="map-floating-controls" role="toolbar" aria-label="Map Navigation Controls">
          <button
            type="button"
            className="map-control-btn"
            onClick={handleZoomIn}
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomInIcon />
          </button>
          <button
            type="button"
            className="map-control-btn"
            onClick={handleZoomOut}
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOutIcon />
          </button>
          <button
            type="button"
            className={`map-control-btn ${isCentered ? 'active' : ''}`}
            onClick={handleCenter}
            title="Center on Vehicle"
            aria-label="Center on Vehicle"
          >
            <CrosshairIcon />
          </button>
          <button
            type="button"
            className={`map-control-btn ${showBreadcrumbs ? 'active' : ''}`}
            onClick={toggleBreadcrumbs}
            title="Toggle Breadcrumb Waypoints"
            aria-label="Toggle Breadcrumb Waypoints"
          >
            <RouteTrailIcon />
          </button>
        </div>

        {/* Legend */}
        <div className="map-legend-overlay">
          <div className="legend-item">
            <span className="legend-swatch origin" />
            <span>Farm Origin</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch vehicle" />
            <span>Transit Truck</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch destination" />
            <span>Destination Port</span>
          </div>
        </div>

        {/* Responsive Map SVG */}
        <svg
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          className="map-svg-viewport"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center', transition: 'transform 0.25s ease' }}
          role="img"
          aria-label="Consignment Transit Map"
        >
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#bc6c25" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.4" />
            </linearGradient>
            <filter id="shadowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.18" />
            </filter>
          </defs>

          {/* Planned corridor path */}
          <path
            d={plannedRouteD}
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="3"
            strokeDasharray="6 6"
          />

          {/* Historical breadcrumbs trail */}
          {showBreadcrumbs && trailPathD && (
            <path
              d={trailPathD}
              fill="none"
              stroke="#2d6a4f"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
            />
          )}

          {/* Breadcrumb waypoint nodes */}
          {showBreadcrumbs && (breadcrumbs || []).map((pt, i) => {
            const p = projectToSvg(pt.coordinates);
            return (
              <circle
                key={`crumb-${i}`}
                cx={p.x}
                cy={p.y}
                r="3.5"
                fill="#52b788"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            );
          })}

          {/* Origin Farm Pinpoint */}
          <g transform={`translate(${originSvg.x}, ${originSvg.y})`} filter="url(#shadowFilter)">
            <circle cx="0" cy="0" r="14" fill="#bc6c25" />
            <circle cx="0" cy="0" r="6" fill="#ffffff" />
            <text x="0" y="24" textAnchor="middle" fontSize="11" fontWeight="700" fill="#7f3b08">
              {origin?.city || 'Origin Farm'}
            </text>
          </g>

          {/* Destination Warehouse Pinpoint */}
          <g transform={`translate(${destSvg.x}, ${destSvg.y})`} filter="url(#shadowFilter)">
            <circle cx="0" cy="0" r="14" fill="#2563eb" />
            <circle cx="0" cy="0" r="6" fill="#ffffff" />
            <text x="0" y="24" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e40af">
              {destination?.city || 'Destination Harbor'}
            </text>
          </g>

          {/* Real-time Vehicle Marker with Heading */}
          <g
            transform={`translate(${vehicleSvg.x}, ${vehicleSvg.y})`}
            filter="url(#shadowFilter)"
            data-testid="vehicle-marker"
          >
            {/* Ping Radar Wave Ring */}
            <circle cx="0" cy="0" r="22" fill="#52b788" opacity="0.25">
              <animate attributeName="r" values="16;28;16" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.35;0;0.35" dur="2.4s" repeatCount="indefinite" />
            </circle>

            {/* Vehicle Base Badge */}
            <circle cx="0" cy="0" r="16" fill="#1b4332" stroke="#ffffff" strokeWidth="2.5" />
            <g transform="translate(-11, -11)" stroke="#ffffff">
              <TruckMarkerIcon />
            </g>

            {/* Heading Pointer Arrow */}
            <g transform={`rotate(${currentTelemetry?.headingDegrees || 0})`}>
              <polygon points="0,-22 -5,-16 5,-16" fill="#dda15e" stroke="#ffffff" strokeWidth="1" />
            </g>

            <text x="0" y="-26" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1b4332">
              {vehicleRegistration} ({currentTelemetry?.speedKmh || 0} km/h)
            </text>
          </g>
        </svg>
      </div>

      {/* Telemetry Metrics Bar */}
      <div className="map-telemetry-metrics-bar">
        <div className="telemetry-metric-cell">
          <span className="metric-label">Transit Speed</span>
          <div className="metric-value-wrap">
            <span className="metric-number" data-testid="metric-speed">
              {currentTelemetry?.speedKmh || 0}
            </span>
            <span className="metric-unit">km/h</span>
          </div>
        </div>

        <div className="telemetry-metric-cell">
          <span className="metric-label">Heading</span>
          <div className="metric-value-wrap">
            <span className="metric-number" data-testid="metric-heading">
              {currentTelemetry?.headingDegrees || 0}°
            </span>
            <span className="metric-unit">bearing</span>
          </div>
        </div>

        <div className="telemetry-metric-cell">
          <span className="metric-label">Cargo Temp</span>
          <div className="metric-value-wrap">
            <span className="metric-number" data-testid="metric-temp">
              {currentTelemetry?.cargoTemperatureC !== null && currentTelemetry?.cargoTemperatureC !== undefined
                ? currentTelemetry.cargoTemperatureC
                : '--'}
            </span>
            <span className="metric-unit">°C Reefer</span>
          </div>
        </div>

        <div className="telemetry-metric-cell">
          <span className="metric-label">Battery</span>
          <div className="metric-value-wrap">
            <span className="metric-number" data-testid="metric-battery">
              {currentTelemetry?.batteryLevelPct || 100}%
            </span>
            <span className="metric-unit">telemetry pod</span>
          </div>
        </div>

        <div className="telemetry-metric-cell">
          <span className="metric-label">Altitude</span>
          <div className="metric-value-wrap">
            <span className="metric-number" data-testid="metric-altitude">
              {currentTelemetry?.altitudeMeters || 0}
            </span>
            <span className="metric-unit">meters ASL</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTransitMap;
