import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SatelliteCanopyVigorMap from '../SatelliteCanopyVigorMap';

// Mock Canvas 2D Context for Jest JSDOM
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

describe('SatelliteCanopyVigorMap Component', () => {
  const mockCells = [
    { cellId: 'CELL-R0-C0', x: 0, y: 0, lat: 12.015, lng: 8.525, ndvi: 0.72, evi: 0.58, savi: 0.52, ndwi: 0.22, isMasked: false, stressSeverity: 'Dense Canopy' },
    { cellId: 'CELL-R0-C1', x: 1, y: 0, lat: 12.015, lng: 8.526, ndvi: 0.28, evi: 0.18, savi: 0.16, ndwi: -0.05, isMasked: false, stressSeverity: 'Moderate Stress' },
    { cellId: 'CELL-R1-C0', x: 0, y: 1, lat: 12.016, lng: 8.525, ndvi: 0.12, evi: 0.08, savi: 0.09, ndwi: -0.15, isMasked: false, stressSeverity: 'Severe Stress' },
    { cellId: 'CELL-R1-C1', x: 1, y: 1, lat: 12.016, lng: 8.526, ndvi: 0.10, evi: 0.05, savi: 0.08, ndwi: -0.20, isMasked: true, stressSeverity: 'Masked Cloud' }
  ];

  it('renders satellite map container and telemetry pills', () => {
    render(
      <SatelliteCanopyVigorMap
        cells={mockCells}
        activeBand="NDVI"
        rows={2}
        cols={2}
        selectedDate="2024-09-28"
      />
    );

    expect(screen.getByTestId('satellite-canopy-vigor-map')).toBeInTheDocument();
    expect(screen.getByText(/Sentinel-2B L2A Surface Reflectance/i)).toBeInTheDocument();
    expect(screen.getByText('2024-09-28')).toBeInTheDocument();
    expect(screen.getByText('NDVI Layer')).toBeInTheDocument();
    expect(screen.getByTestId('satellite-raster-canvas')).toBeInTheDocument();
  });

  it('handles zoom controls interaction', () => {
    render(
      <SatelliteCanopyVigorMap
        cells={mockCells}
        activeBand="NDVI"
        rows={2}
        cols={2}
      />
    );

    const zoomInBtn = screen.getByLabelText(/Zoom in/i);
    const zoomOutBtn = screen.getByLabelText(/Zoom out/i);
    const resetBtn = screen.getByText('100%');

    fireEvent.click(zoomInBtn);
    fireEvent.click(zoomOutBtn);
    fireEvent.click(resetBtn);
    expect(resetBtn).toBeInTheDocument();
  });

  it('renders canopy health legend bar and steps', () => {
    render(<SatelliteCanopyVigorMap cells={mockCells} />);
    expect(screen.getByText(/Canopy Health Scale:/i)).toBeInTheDocument();
    expect(screen.getByText(/Severe Stress/i)).toBeInTheDocument();
    expect(screen.getByText(/Dense Biomass/i)).toBeInTheDocument();
  });
});
