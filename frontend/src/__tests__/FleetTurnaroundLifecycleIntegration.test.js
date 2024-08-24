/**
 * @file FleetTurnaroundLifecycleIntegration.test.js
 * @description Frontend Integration Test Suite for Fleet Turnaround & Dwell Lifecycle
 * Tests state transitions, delay badges, bottleneck alerts, and telemetry audit triggers.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FleetTurnaroundCard from '../components/FleetTurnaroundCard';
import FleetAnalyticsCockpit from '../pages/FleetAnalyticsCockpit';

describe('Fleet Turnaround Lifecycle Integration Suite', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            corridors: [],
            leaderboard: { rankings: [] }
          })
      })
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('formats turnaround minutes into clean human-readable hours and minutes', () => {
    render(
      <FleetTurnaroundCard
        trackingNumber="FLT-TEST-001"
        durations={{
          originLoadingTime: 75,
          transitTime: 1845,
          docksideInspectionTime: 40,
          destinationOffloadingTime: 65,
          totalTurnaroundTime: 2025,
          transitDelayMinutes: 45
        }}
        primaryBottleneck="IN_TRANSIT"
      />
    );

    expect(screen.getByText('33h 45m')).toBeInTheDocument(); // 2025 / 60 = 33h 45m
    expect(screen.getByText('1h 15m')).toBeInTheDocument(); // 75 mins loading
    expect(screen.getByText(/\+45m delay/i)).toBeInTheDocument();
  });

  test('highlights active bottleneck bar segment and badge', () => {
    render(
      <FleetTurnaroundCard
        trackingNumber="FLT-TEST-002"
        durations={{
          originLoadingTime: 180,
          transitTime: 600,
          docksideInspectionTime: 30,
          destinationOffloadingTime: 40,
          totalTurnaroundTime: 850
        }}
        primaryBottleneck="ORIGIN_LOADING"
      />
    );

    const bottleneckText = screen.getByText('ORIGIN LOADING');
    expect(bottleneckText).toBeInTheDocument();
  });

  test('cockpit page renders turnaround list and allows telemetry inspection', async () => {
    render(<FleetAnalyticsCockpit />);

    await waitFor(() => {
      expect(screen.getByText('KN-882-TRK')).toBeInTheDocument();
      expect(screen.getByText('PL-311-JOS')).toBeInTheDocument();
    });

    const auditButtons = screen.getAllByRole('button', { name: /audit telemetry/i });
    expect(auditButtons.length).toBeGreaterThanOrEqual(2);

    fireEvent.click(auditButtons[0]);
    expect(screen.getByRole('alert')).toHaveTextContent(/opened telemetry audit/i);
  });
});
