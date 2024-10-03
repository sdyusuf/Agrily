import React from 'react';
import { render, screen } from '@testing-library/react';
import ZonalCropHealthMetricsCard from '../ZonalCropHealthMetricsCard';

describe('ZonalCropHealthMetricsCard Component', () => {
  const mockMetrics = {
    meanNdvi: 0.72,
    minNdvi: 0.25,
    maxNdvi: 0.91,
    stdDevNdvi: 0.09,
    meanNdwi: 0.22,
    chlorophyllIndex: 5.4,
    waterStressIndex: 0.18,
    canopyUniformityIndex: 0.88,
    cloudMaskPercentage: 2.5,
    vigorDistribution: {
      severeStressHectares: 1.0,
      moderateStressHectares: 2.5,
      healthyHectares: 12.0,
      hyperDenseHectares: 9.0
    },
    advisoryReport: 'OPTIMAL CANOPY HEALTH: Strong photosynthetic biomass index.'
  };

  it('renders header, crop type, and health status pill', () => {
    render(<ZonalCropHealthMetricsCard metrics={mockMetrics} cropType="Maize" totalHectares={24.5} />);

    expect(screen.getByTestId('zonal-crop-health-metrics-card')).toBeInTheDocument();
    expect(screen.getByText('Zonal Crop Vigor Telemetry')).toBeInTheDocument();
    expect(screen.getByText(/Maize Canopy \(24.5 Hectares\)/i)).toBeInTheDocument();
    expect(screen.getByTestId('zonal-health-status-pill')).toHaveTextContent('Dense Canopy');
  });

  it('displays accurate KPI values for NDVI, CIre, and uniformity', () => {
    render(<ZonalCropHealthMetricsCard metrics={mockMetrics} />);

    expect(screen.getByText('0.72')).toBeInTheDocument();
    expect(screen.getByText('5.4')).toBeInTheDocument();
    expect(screen.getByText('88%')).toBeInTheDocument();
  });

  it('renders stacked progress bar segments and advisory text', () => {
    render(<ZonalCropHealthMetricsCard metrics={mockMetrics} />);

    expect(screen.getByText(/Vigor Distribution Breakdown/i)).toBeInTheDocument();
    expect(screen.getByText(/Cloud Occlusion: 2.5%/i)).toBeInTheDocument();
    expect(screen.getByText(/OPTIMAL CANOPY HEALTH/i)).toBeInTheDocument();
  });
});
