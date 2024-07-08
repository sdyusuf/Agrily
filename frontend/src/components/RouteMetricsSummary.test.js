/**
 * ==============================================================================
 * ROUTE METRICS SUMMARY KPI COMPONENT - UNIT TESTS
 * ==============================================================================
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { RouteMetricsSummary } from './RouteMetricsSummary';

describe('RouteMetricsSummary Component', () => {
  test('renders all 5 strategic KPI metric cards', () => {
    render(
      <RouteMetricsSummary
        totalDistanceKm={142.5}
        estimatedDurationMinutes={195} // 3h 15m
        totalPayloadWeightKg={2800}
        estimatedFuelConsumptionLiters={38.4}
        estimatedCarbonFootprintKg={102.9}
        stopsCount={4}
      />
    );

    expect(screen.getByTestId('route-metrics-summary')).toBeInTheDocument();
    expect(screen.getByTestId('metric-distance-value')).toHaveTextContent('142.5 km');
    expect(screen.getByTestId('metric-duration-value')).toHaveTextContent('3h 15m');
    expect(screen.getByTestId('metric-weight-value')).toHaveTextContent('2,800 kg');
    expect(screen.getByTestId('metric-fuel-value')).toHaveTextContent('38.4 L');
    expect(screen.getByTestId('metric-carbon-value')).toHaveTextContent('102.9 kg CO₂');
    expect(screen.getByText('4 collection waypoints')).toBeInTheDocument();
  });

  test('formats minutes only duration when less than 1 hour', () => {
    render(
      <RouteMetricsSummary
        totalDistanceKm={25.0}
        estimatedDurationMinutes={45}
        totalPayloadWeightKg={500}
        estimatedFuelConsumptionLiters={6.2}
        estimatedCarbonFootprintKg={16.6}
        stopsCount={1}
      />
    );

    expect(screen.getByTestId('metric-duration-value')).toHaveTextContent('45m');
  });

  test('handles zero and undefined values gracefully without crashing', () => {
    render(<RouteMetricsSummary />);

    expect(screen.getByTestId('metric-distance-value')).toHaveTextContent('0.0 km');
    expect(screen.getByTestId('metric-duration-value')).toHaveTextContent('0m');
    expect(screen.getByTestId('metric-weight-value')).toHaveTextContent('0 kg');
  });
});
