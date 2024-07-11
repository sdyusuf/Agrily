/**
 * ==============================================================================
 * ROUTE PLANNER COCKPIT PAGE - COMPREHENSIVE UNIT TEST SUITE
 * ==============================================================================
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { RoutePlanner } from './RoutePlanner';

jest.mock('axios');

describe('RoutePlanner Cockpit Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders page headline and core cockpit subsystems', () => {
    render(<RoutePlanner />);

    expect(screen.getByText('Agricultural Route Optimization Cockpit')).toBeInTheDocument();
    expect(screen.getByText('Fleet Logistics & Dispatch Engine')).toBeInTheDocument();
    expect(screen.getByTestId('origin-depot-select')).toBeInTheDocument();
    expect(screen.getByTestId('destination-hub-select')).toBeInTheDocument();
    expect(screen.getByTestId('vehicle-select')).toBeInTheDocument();
    expect(screen.getByTestId('payload-capacity-bar')).toBeInTheDocument();
    expect(screen.getByTestId('route-metrics-summary')).toBeInTheDocument();
    expect(screen.getByTestId('vector-map-panel')).toBeInTheDocument();
  });

  test('allows switching between Itinerary and Harvest Order Pool tabs', () => {
    render(<RoutePlanner />);

    expect(screen.getByTestId('route-stop-sequence')).toBeInTheDocument();

    const poolTab = screen.getByTestId('tab-pool');
    fireEvent.click(poolTab);

    expect(screen.getByTestId('harvest-pool-list')).toBeInTheDocument();
    expect(screen.getByText('Makarfi Tomato Outgrowers Cluster')).toBeInTheDocument();
  });

  test('runs AI Route Optimizer and updates route with solution', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          algorithm: 'TSP_NEAREST_NEIGHBOR_2OPT',
          initialDistanceKm: 145.2,
          optimizedDistanceKm: 119.8,
          distanceSavedKm: 25.4,
          iterationsRun: 12,
          stops: [
            {
              stopId: 'STOP-ORD-HARVEST-101',
              stopSequence: 0,
              locationName: 'Makarfi Tomato Outgrowers Cluster',
              contactName: 'Garba Bello',
              contactPhone: '+2348011223344',
              address: 'Km 14 Zaria-Kano Road',
              state: 'Kaduna',
              roadSurface: 'SECONDARY_ASPHALT',
              producePayload: {
                produceName: 'Roma Plum Tomatoes',
                weightKg: 1200,
                volumeCrates: 48,
                perishabilityTier: 'HIGH'
              },
              timeWindow: {
                earliestArrival: new Date().toISOString(),
                latestArrival: new Date(Date.now() + 14400000).toISOString(),
                estimatedLoadingMinutes: 20
              },
              status: 'PENDING',
              delayMinutes: 0
            }
          ],
          metrics: {
            totalDistanceKm: 119.8,
            estimatedDurationMinutes: 165,
            totalPayloadWeightKg: 1200,
            totalPayloadVolumeCrates: 48,
            capacityUtilizationPct: 34.3,
            estimatedFuelConsumptionLiters: 32.2,
            estimatedCarbonFootprintKg: 86.3,
            stopsCount: 1
          }
        }
      }
    });

    render(<RoutePlanner />);

    const optimizeBtn = screen.getByTestId('optimize-btn');
    fireEvent.click(optimizeBtn);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/routes/optimize', expect.any(Object));
      expect(screen.getByTestId('alert-banner')).toHaveTextContent(/Saved 25.4 km via 2-Opt/);
    });
  });

  test('opens dispatch modal and issues cargo manifest', async () => {
    render(<RoutePlanner />);

    const dispatchBtn = screen.getByTestId('dispatch-btn');
    fireEvent.click(dispatchBtn);

    expect(screen.getByTestId('dispatch-modal')).toBeInTheDocument();
    expect(screen.getByText('Confirm Commercial Route Dispatch')).toBeInTheDocument();

    const confirmBtn = screen.getByTestId('confirm-dispatch-btn');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByTestId('manifest-view')).toBeInTheDocument();
      expect(screen.getByText(/OFFICIAL AGRICULTURAL TRANSIT BILL OF LADING/)).toBeInTheDocument();
      expect(screen.getByText(/Route officially dispatched/)).toBeInTheDocument();
    });
  });

  test('toggles simulation mode on button click', () => {
    render(<RoutePlanner />);

    const simBtn = screen.getByTestId('simulate-btn');
    expect(simBtn).toHaveTextContent('Simulate Tour');

    fireEvent.click(simBtn);
    expect(simBtn).toHaveTextContent('Pause Transit');

    fireEvent.click(simBtn);
    expect(simBtn).toHaveTextContent('Simulate Tour');
  });
});
