/**
 * @file FleetTurnaroundCard.test.js
 * @description Unit tests for FleetTurnaroundCard React component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FleetTurnaroundCard from './FleetTurnaroundCard';

describe('FleetTurnaroundCard Component', () => {
  const mockDurations = {
    originLoadingTime: 45,
    transitTime: 1800,
    docksideInspectionTime: 25,
    destinationOffloadingTime: 40,
    totalTurnaroundTime: 1910,
    transitDelayMinutes: 0
  };

  test('renders tracking number, vehicle registration, and corridor route', () => {
    render(
      <FleetTurnaroundCard
        trackingNumber="FLT-20240815-XYZ"
        vehicleRegNumber="ABJ-992-KND"
        vehicleType="REFRIGERATED_REEFER_15_TON"
        originState="KADUNA"
        destinationState="ABUJA"
        durations={mockDurations}
      />
    );

    expect(screen.getByText('FLT-20240815-XYZ')).toBeInTheDocument();
    expect(screen.getByText('ABJ-992-KND')).toBeInTheDocument();
    expect(screen.getByText(/KADUNA/)).toBeInTheDocument();
    expect(screen.getByText(/ABUJA/)).toBeInTheDocument();
    expect(screen.getByText(/refrigerated reefer 15 ton/i)).toBeInTheDocument();
  });

  test('displays on-time corridor transit badge when delay is 0', () => {
    render(
      <FleetTurnaroundCard
        durations={{ ...mockDurations, transitDelayMinutes: 0 }}
      />
    );

    expect(screen.getByText(/on-time corridor transit/i)).toBeInTheDocument();
  });

  test('displays transit delay badge when transitDelayMinutes > 0', () => {
    render(
      <FleetTurnaroundCard
        durations={{ ...mockDurations, transitDelayMinutes: 90 }}
      />
    );

    expect(screen.getByText(/\+1h 30m delay/i)).toBeInTheDocument();
  });

  test('highlights primary bottleneck stage correctly', () => {
    render(
      <FleetTurnaroundCard
        durations={mockDurations}
        primaryBottleneck="ORIGIN_LOADING"
      />
    );

    expect(screen.getByText('ORIGIN LOADING')).toBeInTheDocument();
  });

  test('triggers onInspectDetails callback when audit button clicked', () => {
    const handleInspect = jest.fn();
    render(
      <FleetTurnaroundCard
        trackingNumber="FLT-20240815-XYZ"
        durations={mockDurations}
        onInspectDetails={handleInspect}
      />
    );

    const auditBtn = screen.getByRole('button', { name: /audit telemetry/i });
    fireEvent.click(auditBtn);
    expect(handleInspect).toHaveBeenCalledTimes(1);
    expect(handleInspect).toHaveBeenCalledWith('FLT-20240815-XYZ');
  });
});
