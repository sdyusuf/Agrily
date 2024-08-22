/**
 * @file CarrierLeaderboardTable.test.js
 * @description Unit tests for CarrierLeaderboardTable React component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CarrierLeaderboardTable from './CarrierLeaderboardTable';

describe('CarrierLeaderboardTable Component', () => {
  const mockRankings = [
    {
      rank: 1,
      carrierCode: 'CAR-001',
      carrierName: 'Arewa Express Haulage',
      tier: 'PLATINUM_AGRO_CARRIER',
      fleetSize: 14,
      overallScore: 97,
      onTimeRatePct: 98.5,
      safetyScore: 99,
      freightBonusPct: 4.5,
      priorityDispatchAccess: true
    },
    {
      rank: 2,
      carrierCode: 'CAR-002',
      carrierName: 'Plateau Reefer Transit',
      tier: 'GOLD_AGRO_CARRIER',
      fleetSize: 8,
      overallScore: 89,
      onTimeRatePct: 93.0,
      safetyScore: 91,
      freightBonusPct: 2.0,
      priorityDispatchAccess: true
    },
    {
      rank: 3,
      carrierCode: 'CAR-003',
      carrierName: 'Oyo Cargo Lines',
      tier: 'SILVER_AGRO_CARRIER',
      fleetSize: 5,
      overallScore: 76,
      onTimeRatePct: 82.0,
      safetyScore: 80,
      freightBonusPct: 0,
      priorityDispatchAccess: false
    }
  ];

  test('renders carrier table with headers and ranks', () => {
    render(<CarrierLeaderboardTable rankings={mockRankings} />);

    expect(screen.getByText('Arewa Express Haulage')).toBeInTheDocument();
    expect(screen.getByText('Plateau Reefer Transit')).toBeInTheDocument();
    expect(screen.getByText('Oyo Cargo Lines')).toBeInTheDocument();
    expect(screen.getByText('CAR-001')).toBeInTheDocument();
  });

  test('filters carriers dynamically via search input', () => {
    render(<CarrierLeaderboardTable rankings={mockRankings} />);

    const searchInput = screen.getByLabelText(/search carriers/i);
    fireEvent.change(searchInput, { target: { value: 'Plateau' } });

    expect(screen.getByText('Plateau Reefer Transit')).toBeInTheDocument();
    expect(screen.queryByText('Arewa Express Haulage')).not.toBeInTheDocument();
  });

  test('filters carriers by tier chips', () => {
    render(<CarrierLeaderboardTable rankings={mockRankings} />);

    const platinumChip = screen.getByRole('button', { name: /platinum/i });
    fireEvent.click(platinumChip);

    expect(screen.getByText('Arewa Express Haulage')).toBeInTheDocument();
    expect(screen.queryByText('Oyo Cargo Lines')).not.toBeInTheDocument();
  });

  test('triggers onSelectCarrier callback when row is clicked', () => {
    const handleSelect = jest.fn();
    render(<CarrierLeaderboardTable rankings={mockRankings} onSelectCarrier={handleSelect} />);

    const row = screen.getByText('Arewa Express Haulage').closest('tr');
    fireEvent.click(row);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith(mockRankings[0]);
  });
});
