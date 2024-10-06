import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  SatelliteDishIcon,
  LayersIcon,
  XIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  LeafIcon,
  EyeIcon
} from './Icons';
import './SatelliteBandInspectorModal.css';

/**
 * Sentinel-2 MSI 12-Band Radiometric Calibration Specifications
 */
const SENTINEL_BAND_DEFINITIONS = [
  {
    bandKey: 'B01',
    bandName: 'Coastal Aerosol',
    centralWavelengthNm: 443,
    bandwidthNm: 20,
    resolutionM: 60,
    spectrumGroup: 'AEROSOL',
    colorHex: '#4d194d',
    primarySensitivity: 'Atmospheric aerosol correction, coastal bathymetry, Harmattan dust tracking'
  },
  {
    bandKey: 'B02',
    bandName: 'Blue',
    centralWavelengthNm: 490,
    bandwidthNm: 65,
    resolutionM: 10,
    spectrumGroup: 'VISIBLE',
    colorHex: '#1d3557',
    primarySensitivity: 'Soil/vegetation discrimination, forest canopy mapping, EVI blue feedback'
  },
  {
    bandKey: 'B03',
    bandName: 'Green',
    centralWavelengthNm: 560,
    bandwidthNm: 35,
    resolutionM: 10,
    spectrumGroup: 'VISIBLE',
    colorHex: '#2d6a4f',
    primarySensitivity: 'Green vegetation reflectance peak, plant vigor, NDWI water indexing'
  },
  {
    bandKey: 'B04',
    bandName: 'Red',
    centralWavelengthNm: 665,
    bandwidthNm: 30,
    resolutionM: 10,
    spectrumGroup: 'VISIBLE',
    colorHex: '#e63946',
    primarySensitivity: 'Chlorophyll absorption maximum, NDVI calculation, foliar biomass boundary'
  },
  {
    bandKey: 'B05',
    bandName: 'Vegetation Red Edge 1',
    centralWavelengthNm: 705,
    bandwidthNm: 15,
    resolutionM: 20,
    spectrumGroup: 'RED_EDGE',
    colorHex: '#9d0208',
    primarySensitivity: 'Chlorophyll content estimation, incipient nitrogen stress onset detection'
  },
  {
    bandKey: 'B06',
    bandName: 'Vegetation Red Edge 2',
    centralWavelengthNm: 740,
    bandwidthNm: 15,
    resolutionM: 20,
    spectrumGroup: 'RED_EDGE',
    colorHex: '#d00000',
    primarySensitivity: 'Leaf Area Index (LAI) inflection tracking, canopy structural vigor'
  },
  {
    bandKey: 'B07',
    bandName: 'Vegetation Red Edge 3',
    centralWavelengthNm: 783,
    bandwidthNm: 20,
    resolutionM: 20,
    spectrumGroup: 'RED_EDGE',
    colorHex: '#dc2f02',
    primarySensitivity: 'Boundary to NIR plateau, high-density crop biomass differentiation'
  },
  {
    bandKey: 'B08',
    bandName: 'Near Infrared (NIR)',
    centralWavelengthNm: 842,
    bandwidthNm: 115,
    resolutionM: 10,
    spectrumGroup: 'NIR',
    colorHex: '#52b788',
    primarySensitivity: 'Spongy mesophyll cellular scattering, NDVI numerator, crop vigor monitoring'
  },
  {
    bandKey: 'B8A',
    bandName: 'Narrow NIR',
    centralWavelengthNm: 865,
    bandwidthNm: 20,
    resolutionM: 20,
    spectrumGroup: 'NIR',
    colorHex: '#74c69d',
    primarySensitivity: 'Atmospheric water vapor absorption bypass, precise biophysical LAI inversion'
  },
  {
    bandKey: 'B09',
    bandName: 'Water Vapour',
    centralWavelengthNm: 945,
    bandwidthNm: 20,
    resolutionM: 60,
    spectrumGroup: 'ATMOSPHERE',
    colorHex: '#457b9d',
    primarySensitivity: 'Columnar atmospheric water vapor content estimation for BOA corrections'
  },
  {
    bandKey: 'B11',
    bandName: 'Shortwave Infrared 1',
    centralWavelengthNm: 1610,
    bandwidthNm: 90,
    resolutionM: 20,
    spectrumGroup: 'SWIR',
    colorHex: '#bc6c25',
    primarySensitivity: 'Canopy liquid water absorption, NDWI moisture stress, plant desiccation'
  },
  {
    bandKey: 'B12',
    bandName: 'Shortwave Infrared 2',
    centralWavelengthNm: 2190,
    bandwidthNm: 180,
    resolutionM: 20,
    spectrumGroup: 'SWIR',
    colorHex: '#8338ec',
    primarySensitivity: 'Soil mineralogy, non-photosynthetic dry biomass/mulch, cloud discrimination'
  }
];

/**
 * Standard Spectral Reflectance Signatures across Sentinel-2 Bands
 */
const REFERENCE_SIGNATURES = {
  HEALTHY_CANOPY: {
    label: 'Healthy Green Maize Canopy',
    colorHex: '#2d6a4f',
    reflectances: {
      B01: 0.025,
      B02: 0.035,
      B03: 0.082,
      B04: 0.045,
      B05: 0.125,
      B06: 0.320,
      B07: 0.460,
      B08: 0.520,
      B8A: 0.535,
      B09: 0.420,
      B11: 0.190,
      B12: 0.095
    }
  },
  STRESSED_CANOPY: {
    label: 'Water-Stressed / Chlorotic Crop',
    colorHex: '#dda15e',
    reflectances: {
      B01: 0.055,
      B02: 0.085,
      B03: 0.120,
      B04: 0.165,
      B05: 0.195,
      B06: 0.245,
      B07: 0.280,
      B08: 0.295,
      B8A: 0.300,
      B09: 0.260,
      B11: 0.310,
      B12: 0.220
    }
  },
  BARE_SOIL: {
    label: 'Sandy Loam Agricultural Soil',
    colorHex: '#bc6c25',
    reflectances: {
      B01: 0.080,
      B02: 0.110,
      B03: 0.155,
      B04: 0.200,
      B05: 0.230,
      B06: 0.255,
      B07: 0.275,
      B08: 0.295,
      B8A: 0.305,
      B09: 0.315,
      B11: 0.380,
      B12: 0.350
    }
  },
  WATER_BODY: {
    label: 'Irrigation Canal / Freshwater',
    colorHex: '#1d3557',
    reflectances: {
      B01: 0.045,
      B02: 0.060,
      B03: 0.050,
      B04: 0.025,
      B05: 0.015,
      B06: 0.008,
      B07: 0.005,
      B08: 0.005,
      B8A: 0.004,
      B09: 0.002,
      B11: 0.001,
      B12: 0.001
    }
  }
};

export default function SatelliteBandInspectorModal({
  isOpen,
  onClose,
  parcelName = 'Plot Alpha',
  mgrsTile = '32NNG',
  observationDate = '2024-09-18'
}) {
  const [selectedBandKey, setSelectedBandKey] = useState('B08');
  const [activeSignatures, setActiveSignatures] = useState(['HEALTHY_CANOPY', 'STRESSED_CANOPY']);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentBand = SENTINEL_BAND_DEFINITIONS.find((b) => b.bandKey === selectedBandKey) || SENTINEL_BAND_DEFINITIONS[7];

  const toggleSignature = (sigKey) => {
    setActiveSignatures((prev) =>
      prev.includes(sigKey)
        ? prev.filter((k) => k !== sigKey)
        : [...prev, sigKey]
    );
  };

  return (
    <div
      className="band-inspector-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="band-inspector-title"
      data-testid="satellite-band-inspector-modal"
    >
      <div className="band-inspector-container">
        {/* Modal Header */}
        <div className="band-inspector-header">
          <div className="inspector-title-group">
            <div className="inspector-badge">
              <SatelliteDishIcon size={16} />
              <span>Multi-Spectral Radiometer</span>
            </div>
            <h2 id="band-inspector-title" className="inspector-title">
              Sentinel-2 Multi-Spectral Band &amp; Reflectance Signature Inspector
            </h2>
            <p className="inspector-meta">
              Parcel: <strong>{parcelName || 'Unknown Parcel'}</strong> | MGRS Tile: <strong>{mgrsTile || '32NNG'}</strong> | Observation Date: <strong>{observationDate || '2024-09-18'}</strong>
            </p>
          </div>
          <button
            type="button"
            className="inspector-close-btn"
            onClick={onClose}
            aria-label="Close Spectral Inspector"
            data-testid="close-band-inspector-btn"
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="band-inspector-body">
          {/* Spectral Bands Wavelength Strip */}
          <div className="spectrum-strip-section">
            <div className="section-label-group">
              <span className="section-title">
                <LayersIcon size={15} /> 12 Multi-Spectral Instrument (MSI) Sensor Bands
              </span>
              <span className="section-hint">Select a band to inspect radiometric calibration</span>
            </div>
            <div className="bands-strip" data-testid="bands-strip">
              {SENTINEL_BAND_DEFINITIONS.map((band) => {
                const isSelected = band.bandKey === selectedBandKey;
                return (
                  <button
                    key={band.bandKey}
                    type="button"
                    className={`band-chip-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedBandKey(band.bandKey)}
                    data-testid={`band-chip-${band.bandKey}`}
                    style={{
                      borderBottomColor: band.colorHex
                    }}
                  >
                    <span className="chip-key">{band.bandKey}</span>
                    <span className="chip-wl">{band.centralWavelengthNm} nm</span>
                    <span className="chip-res">{band.resolutionM}m</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Band Detail Card */}
          <div className="active-band-card" data-testid="active-band-card">
            <div className="band-card-header">
              <div className="band-card-indicator" style={{ backgroundColor: currentBand.colorHex }} />
              <div>
                <h3 className="band-card-title">
                  {currentBand.bandKey} - {currentBand.bandName}
                </h3>
                <span className="band-card-group">{currentBand.spectrumGroup} SPECTRUM</span>
              </div>
            </div>
            <div className="band-specs-grid">
              <div className="spec-item">
                <span className="spec-label">Central Wavelength</span>
                <span className="spec-value">{currentBand.centralWavelengthNm} nm</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Spectral Bandwidth</span>
                <span className="spec-value">{currentBand.bandwidthNm} nm</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Spatial Resolution (GSD)</span>
                <span className="spec-value">{currentBand.resolutionM} Meters</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Processing Tier</span>
                <span className="spec-value">Level-2A BOA Surface Reflectance</span>
              </div>
            </div>
            <div className="band-sensitivity-box">
              <span className="sensitivity-label">Agronomic &amp; Biophysical Sensitivity:</span>
              <p className="sensitivity-text">{currentBand.primarySensitivity}</p>
            </div>
          </div>

          {/* Spectral Reflectance Curves Comparison Chart */}
          <div className="signature-chart-section">
            <div className="chart-header">
              <div className="chart-title-group">
                <span className="chart-title">
                  <LeafIcon size={16} /> Spectral Reflectance Comparison Across Optical Wavelengths
                </span>
                <span className="chart-subtitle">
                  Comparing multi-spectral bottom-of-atmosphere reflectance signatures for Nigerian agricultural land covers
                </span>
              </div>
              <div className="signature-toggles">
                {Object.entries(REFERENCE_SIGNATURES).map(([key, sig]) => {
                  const isActive = activeSignatures.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`signature-toggle-btn ${isActive ? 'active' : ''}`}
                      onClick={() => toggleSignature(key)}
                      data-testid={`toggle-${key}`}
                    >
                      <span
                        className="toggle-swatch"
                        style={{ backgroundColor: sig.colorHex }}
                      />
                      <span>{sig.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom SVG Reflectance Curve */}
            <div className="reflectance-svg-wrapper">
              <svg
                className="reflectance-svg"
                viewBox="0 0 800 240"
                preserveAspectRatio="none"
                data-testid="reflectance-chart-svg"
              >
                {/* Horizontal Grid lines */}
                <line x1="50" y1="20" x2="780" y2="20" stroke="#e2e8f0" strokeDasharray="3 3" />
                <line x1="50" y1="70" x2="780" y2="70" stroke="#e2e8f0" strokeDasharray="3 3" />
                <line x1="50" y1="120" x2="780" y2="120" stroke="#e2e8f0" strokeDasharray="3 3" />
                <line x1="50" y1="170" x2="780" y2="170" stroke="#e2e8f0" strokeDasharray="3 3" />
                <line x1="50" y1="220" x2="780" y2="220" stroke="#cbd5e1" />

                {/* Y-Axis Labels */}
                <text x="40" y="25" textAnchor="end" className="svg-axis-label">0.60</text>
                <text x="40" y="75" textAnchor="end" className="svg-axis-label">0.45</text>
                <text x="40" y="125" textAnchor="end" className="svg-axis-label">0.30</text>
                <text x="40" y="175" textAnchor="end" className="svg-axis-label">0.15</text>
                <text x="40" y="224" textAnchor="end" className="svg-axis-label">0.00</text>

                {/* Render Polylines for Active Signatures */}
                {Object.entries(REFERENCE_SIGNATURES).map(([key, sig]) => {
                  if (!activeSignatures.includes(key)) return null;

                  const points = SENTINEL_BAND_DEFINITIONS.map((band, idx) => {
                    const x = 70 + (idx * (700 / 11));
                    const val = sig.reflectances[band.bandKey] || 0.0;
                    // Max Y is 0.60 -> height 200 (scale 200 / 0.60 = 333.33)
                    const y = Math.max(20, Math.min(220, 220 - (val * 333.33)));
                    return `${x},${y}`;
                  }).join(' ');

                  return (
                    <g key={key}>
                      <polyline
                        points={points}
                        fill="none"
                        stroke={sig.colorHex}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {SENTINEL_BAND_DEFINITIONS.map((band, idx) => {
                        const x = 70 + (idx * (700 / 11));
                        const val = sig.reflectances[band.bandKey] || 0.0;
                        const y = Math.max(20, Math.min(220, 220 - (val * 333.33)));
                        const isBandHighlighted = band.bandKey === selectedBandKey;
                        return (
                          <circle
                            key={band.bandKey}
                            cx={x}
                            cy={y}
                            r={isBandHighlighted ? 5 : 3}
                            fill={isBandHighlighted ? '#ffffff' : sig.colorHex}
                            stroke={sig.colorHex}
                            strokeWidth={isBandHighlighted ? 2.5 : 1.5}
                          />
                        );
                      })}
                    </g>
                  );
                })}

                {/* X-Axis Band Labels */}
                {SENTINEL_BAND_DEFINITIONS.map((band, idx) => {
                  const x = 70 + (idx * (700 / 11));
                  const isSelected = band.bandKey === selectedBandKey;
                  return (
                    <text
                      key={band.bandKey}
                      x={x}
                      y="235"
                      textAnchor="middle"
                      className={`svg-band-label ${isSelected ? 'highlighted' : ''}`}
                    >
                      {band.bandKey}
                    </text>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Radiative Transfer & Atmospheric Health Card */}
          <div className="correction-audit-banner">
            <div className="audit-icon">
              <CheckCircleIcon size={20} color="#2d6a4f" />
            </div>
            <div className="audit-content">
              <span className="audit-heading">Level-2A Bottom-Of-Atmosphere (BOA) Processing Active</span>
              <p className="audit-desc">
                Atmospheric path radiance, molecular Rayleigh scattering, and Saharan Harmattan dust plumes (AOD = 0.28, Bodhaine scale height) have been normalized via simplified 6S radiative transfer.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="band-inspector-footer">
          <button
            type="button"
            className="footer-btn-primary"
            onClick={onClose}
            data-testid="dismiss-band-inspector-btn"
          >
            Dismiss Inspector
          </button>
        </div>
      </div>
    </div>
  );
}

SatelliteBandInspectorModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  parcelName: PropTypes.string,
  mgrsTile: PropTypes.string,
  observationDate: PropTypes.string
};
