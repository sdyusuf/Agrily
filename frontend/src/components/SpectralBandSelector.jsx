import React from 'react';
import './SpectralBandSelector.css';
import { LayersIcon, EyeIcon } from './Icons';

const BAND_PRESETS = [
  {
    id: 'NDVI',
    name: 'NDVI (Canopy Biomass)',
    description: 'Chlorophyll absorption & photosynthetic vigor (Red vs NIR)',
    wavelength: 'B04 / B08',
    gradient: 'linear-gradient(90deg, #d90429, #f77f00, #52b788, #1b4332)'
  },
  {
    id: 'EVI',
    name: 'EVI (High Biomass)',
    description: 'Aerosol-corrected canopy index resisting saturation in dense foliage',
    wavelength: 'B02 / B04 / B08',
    gradient: 'linear-gradient(90deg, #bc6c25, #dda15e, #52b788, #081c15)'
  },
  {
    id: 'SAVI',
    name: 'SAVI (Soil Adjusted)',
    description: 'Compensates for bare soil reflectance in early emergence & arid zones',
    wavelength: 'L = 0.5 Correction',
    gradient: 'linear-gradient(90deg, #99582a, #ffe6a7, #40916c, #1b4332)'
  },
  {
    id: 'NDWI',
    name: 'NDWI (Canopy Moisture)',
    description: 'Liquid leaf water content & acute drought deficit indicator',
    wavelength: 'B08 NIR vs B11 SWIR',
    gradient: 'linear-gradient(90deg, #d90429, #ffd166, #06d6a0, #118ab2)'
  },
  {
    id: 'CIR',
    name: 'False Color IR (CIR)',
    description: 'High-contrast multispectral composite mapping plant stress in crimson',
    wavelength: 'NIR-Red-Green',
    gradient: 'linear-gradient(90deg, #2b2d42, #8d99ae, #e63946, #780000)'
  }
];

export default function SpectralBandSelector({ activeBand = 'NDVI', onSelectBand }) {
  return (
    <div className="spectral-band-selector-card" data-testid="spectral-band-selector">
      <div className="spectral-band-header">
        <div className="spectral-title-cluster">
          <span className="spectral-icon-badge">
            <LayersIcon size={16} color="var(--color-primary-700)" />
          </span>
          <div>
            <h4 className="spectral-title">Multi-Spectral Analysis Band</h4>
            <span className="spectral-subtitle">Sentinel-2 MSI Radiometric Spectral Layers</span>
          </div>
        </div>
      </div>

      <div className="spectral-pill-group" role="tablist" aria-label="Spectral bands">
        {BAND_PRESETS.map((band) => {
          const isActive = activeBand === band.id;
          return (
            <button
              key={band.id}
              role="tab"
              aria-selected={isActive}
              className={`spectral-pill-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectBand && onSelectBand(band.id)}
              data-testid={`band-pill-${band.id.toLowerCase()}`}
            >
              <div className="pill-top-row">
                <span className="pill-name">{band.name}</span>
                <span className="pill-wavelength">{band.wavelength}</span>
              </div>
              <p className="pill-description">{band.description}</p>
              <div className="pill-color-ramp" style={{ background: band.gradient }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
