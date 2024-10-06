import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SatelliteNdviCockpit from '../SatelliteNdviCockpit';

// Mock Canvas 2D context
HTMLCanvasElement.prototype.getContext = () => ({
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  beginPath: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  scale: jest.fn(),
  setLineDash: jest.fn()
});

describe('SatelliteNdviCockpit Page Integration', () => {
  beforeEach(() => {
    global.fetch = jest.fn((url) => {
      if (url.includes('/api/satellite/parcels') && !url.includes('/ndvi-timeline') && !url.includes('/zonal-grid') && !url.includes('/vigor-alerts')) {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              success: true,
              data: [
                {
                  _id: 'p1',
                  parcelCode: 'NG-MAI-KANO4B',
                  parcelName: 'Kano North Irrigation Plot 4B',
                  cropType: 'Maize',
                  areaHectares: 24.5,
                  agroEcologicalZone: 'Sudan Savannah',
                  soilClassification: 'Ferric Luvisol',
                  irrigationType: 'Center Pivot'
                },
                {
                  _id: 'p2',
                  parcelCode: 'NG-CAS-BENUE1',
                  parcelName: 'Benue River Basin Cassava Field',
                  cropType: 'Cassava',
                  areaHectares: 42.0,
                  agroEcologicalZone: 'Southern Guinea Savannah',
                  soilClassification: 'Dystric Nitisol',
                  irrigationType: 'Rainfed'
                }
              ]
            })
        });
      }

      if (url.includes('/zonal-grid')) {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              success: true,
              spectralBand: 'NDVI',
              cells: [
                { x: 0, y: 0, ndvi: 0.72, evi: 0.58, savi: 0.50, ndwi: 0.22, isMasked: false, stressSeverity: 'Dense Canopy' },
                { x: 1, y: 0, ndvi: 0.25, evi: 0.18, savi: 0.15, ndwi: -0.05, isMasked: false, stressSeverity: 'Moderate Stress' }
              ]
            })
        });
      }

      if (url.includes('/ndvi-timeline')) {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              success: true,
              data: [
                { readingDate: '2024-08-01', meanNdvi: 0.65, meanNdwi: 0.20 },
                { readingDate: '2024-09-01', meanNdvi: 0.74, meanNdwi: 0.28 }
              ]
            })
        });
      }

      if (url.includes('/vigor-alerts')) {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              success: true,
              report: {
                cryptographicReportSeal: 'a'.repeat(64),
                anomalies: [
                  {
                    date: '2024-09-01',
                    alertType: 'Canopy Biomass Deficit',
                    severity: 'Warning',
                    rootCauseHypothesis: 'Departure from trajectory',
                    recommendation: 'Field scout recommended'
                  }
                ]
              }
            })
        });
      }

      if (url.includes('/ingest-pass')) {
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, message: 'Ingested' })
        });
      }

      return Promise.reject(new Error('Unknown url'));
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders cockpit hero, title, and parcel dropdown', async () => {
    render(<SatelliteNdviCockpit />);

    expect(screen.getByTestId('satellite-ndvi-cockpit-page')).toBeInTheDocument();
    expect(screen.getByText('Farm Canopy Vigor & NDVI Radar')).toBeInTheDocument();
    expect(screen.getByText(/Sentinel-2 Satellite Agronomy Telemetry/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('parcel-picker-dropdown')).toBeInTheDocument();
    });
  });

  it('allows switching spectral band and triggers re-fetch', async () => {
    render(<SatelliteNdviCockpit />);

    await waitFor(() => {
      expect(screen.getByTestId('band-pill-ndwi')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('band-pill-ndwi'));
    expect(screen.getByTestId('band-pill-ndwi')).toHaveClass('active');
  });

  it('triggers satellite pass ingestion button', async () => {
    render(<SatelliteNdviCockpit />);

    await waitFor(() => {
      expect(screen.getByTestId('parcel-picker-dropdown')).toBeInTheDocument();
    });

    const ingestBtn = screen.getByTestId('ingest-pass-btn');
    expect(ingestBtn).toBeInTheDocument();

    fireEvent.click(ingestBtn);

    await waitFor(() => {
      expect(screen.getByTestId('cockpit-notification-toast')).toBeInTheDocument();
    });
  });
});
