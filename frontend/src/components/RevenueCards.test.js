/**
 * ==============================================================================
 * AGRILY FRONTEND TEST SUITE - REVENUE CARDS COMPONENT UNIT TESTS
 * ==============================================================================
 * 
 * Test Suite Description:
 * Verifies that farmer KPI metric cards render formatted sales revenues,
 * pending escrow figures, physical units, active crop listings, and handle API loading.
 * 
 * @module components/RevenueCards.test
 * @requires react
 * @requires @testing-library/react
 * @requires ./RevenueCards
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import RevenueCards from './RevenueCards';

describe('RevenueCards Component Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders zero defaults when no metrics are provided', () => {
    render(<RevenueCards initialMetrics={null} activeListings={0} />);

    expect(screen.getByTestId('revenue-cards-grid')).toBeInTheDocument();
    expect(screen.getByText('Gross Sales Revenue')).toBeInTheDocument();
    expect(screen.getByText('Pending Escrow Payouts')).toBeInTheDocument();
    expect(screen.getByText('Produce Volume Sold')).toBeInTheDocument();
    expect(screen.getByText('Active Market Batches')).toBeInTheDocument();

    // Zero currency checks
    expect(screen.getByTestId('kpi-gross-revenue')).toHaveTextContent(/0/);
    expect(screen.getByTestId('kpi-pending-revenue')).toHaveTextContent(/0/);
    expect(screen.getByTestId('kpi-units-sold')).toHaveTextContent('0 units');
    expect(screen.getByTestId('kpi-active-listings')).toHaveTextContent('0 batches');
  });

  test('renders populated metrics with currency formatting and units sold', () => {
    const mockMetrics = {
      grossRevenue: 2450000,
      pendingRevenue: 350000,
      totalUnitsSold: 1250,
      statusCounts: {
        delivered: 18
      }
    };

    render(
      <RevenueCards
        initialMetrics={mockMetrics}
        activeListings={14}
      />
    );

    // Verify formatted values
    expect(screen.getByTestId('kpi-gross-revenue')).toHaveTextContent(/2,450,000/);
    expect(screen.getByTestId('kpi-pending-revenue')).toHaveTextContent(/350,000/);
    expect(screen.getByTestId('kpi-units-sold')).toHaveTextContent('1,250 units');
    expect(screen.getByTestId('kpi-active-listings')).toHaveTextContent('14 batches');
    expect(screen.getByText('18 deals completed')).toBeInTheDocument();
  });

  test('fetches analytics from backend API when email is provided', async () => {
    const mockApiResponse = {
      success: true,
      farmerEmail: 'farmer@agrily.com',
      activeListingsCount: 8,
      metrics: {
        grossRevenue: 850000,
        pendingRevenue: 120000,
        totalUnitsSold: 420,
        statusCounts: { delivered: 5 }
      }
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    render(<RevenueCards email="farmer@agrily.com" />);

    // Initially displays loading skeleton
    expect(screen.getByTestId('revenue-cards-loading')).toBeInTheDocument();

    // Await API completion
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/analytics/farmer/farmer%40agrily.com');
      expect(screen.getByTestId('revenue-cards-grid')).toBeInTheDocument();
    });

    expect(screen.getByTestId('kpi-gross-revenue')).toHaveTextContent(/850,000/);
    expect(screen.getByTestId('kpi-units-sold')).toHaveTextContent('420 units');
    expect(screen.getByTestId('kpi-active-listings')).toHaveTextContent('8 batches');
  });
});
