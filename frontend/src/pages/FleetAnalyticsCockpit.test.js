/**
 * @file FleetAnalyticsCockpit.test.js
 * @description Unit tests for FleetAnalyticsCockpit page component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FleetAnalyticsCockpit from './FleetAnalyticsCockpit';

describe('FleetAnalyticsCockpit Page Component', () => {
  beforeEach(() => {
    global.fetch = jest.fn((url) => {
      if (url.includes('/corridors')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            corridors: [
              {
                benchmarkCode: 'BENCH-KN-LOS-01',
                corridorName: 'Kano-Kaduna-Abuja-Lagos Grain Expressway',
                originState: 'KANO',
                destinationState: 'LAGOS',
                distanceKm: 995,
                estimatedTransitHours: 34,
                baseTariffPerTonKmNgn: 32.50,
                securityRiskLevel: 'LOW_STANDARD_PATROL'
              }
            ]
          })
        });
      }
      if (url.includes('/leaderboard')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            leaderboard: {
              rankings: [
                {
                  rank: 1,
                  carrierCode: 'CAR-001',
                  carrierName: 'Arewa Express Haulage',
                  tier: 'PLATINUM_AGRO_CARRIER',
                  fleetSize: 15,
                  overallScore: 96,
                  onTimeRatePct: 97.8,
                  safetyScore: 98,
                  freightBonusPct: 4.5,
                  priorityDispatchAccess: true
                }
              ]
            }
          })
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders page heading and KPI metric cards', async () => {
    render(<FleetAnalyticsCockpit />);

    expect(screen.getByText(/fleet performance & haulage analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/average turnaround/i)).toBeInTheDocument();
    expect(screen.getByText(/fleet fuel economy/i)).toBeInTheDocument();
    expect(screen.getByText(/corridor on-time rate/i)).toBeInTheDocument();
    expect(screen.getByText(/monitored fleet/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('FLT-20240815-KND')).toBeInTheDocument();
    });
  });

  test('navigates between cockpit tabs', async () => {
    render(<FleetAnalyticsCockpit />);

    // Default tab is turnaround
    expect(screen.getByText(/active transit & gate dwell logs/i)).toBeInTheDocument();

    // Click calculator tab
    const calcTab = screen.getByRole('tab', { name: /freight rate calculator/i });
    fireEvent.click(calcTab);
    expect(screen.getByText(/haulage freight rate calculator/i)).toBeInTheDocument();

    // Click leaderboard tab
    const leaderboardTab = screen.getByRole('tab', { name: /carrier leaderboard/i });
    fireEvent.click(leaderboardTab);
    await waitFor(() => {
      expect(screen.getByText('Arewa Express Haulage')).toBeInTheDocument();
    });

    // Click trade corridors tab
    const corridorsTab = screen.getByRole('tab', { name: /nigerian trade corridors/i });
    fireEvent.click(corridorsTab);
    await waitFor(() => {
      expect(screen.getByText('Kano-Kaduna-Abuja-Lagos Grain Expressway')).toBeInTheDocument();
    });
  });

  test('triggers sync telemetry toast notification', async () => {
    render(<FleetAnalyticsCockpit />);

    const syncBtn = screen.getByRole('button', { name: /sync telemetry/i });
    fireEvent.click(syncBtn);

    expect(screen.getByRole('alert')).toHaveTextContent(/live fleet telemetry synced successfully/i);

    await waitFor(() => {
      expect(screen.getByText('FLT-20240815-KND')).toBeInTheDocument();
    });
  });
});
