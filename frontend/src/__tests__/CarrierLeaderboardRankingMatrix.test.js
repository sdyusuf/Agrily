/**
 * @file CarrierLeaderboardRankingMatrix.test.js
 * @description Frontend Test Suite for Carrier Leaderboard Ranking, Tiers & Search Matrix
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CarrierLeaderboardTable from '../components/CarrierLeaderboardTable';

describe('Carrier Leaderboard Ranking Matrix Suite', () => {
  const sampleRankings = [
    {
      rank: 1,
      carrierCode: 'CAR-AREWA-01',
      carrierName: 'Arewa Express Agro-Haulage',
      tier: 'PLATINUM_AGRO_CARRIER',
      fleetSize: 18,
      overallScore: 98,
      onTimeRatePct: 99.1,
      safetyScore: 99,
      freightBonusPct: 4.5,
      priorityDispatchAccess: true
    },
    {
      rank: 2,
      carrierCode: 'CAR-BENUE-02',
      carrierName: 'Middle-Belt Cold-Reefer Logistics',
      tier: 'GOLD_AGRO_CARRIER',
      fleetSize: 12,
      overallScore: 90,
      onTimeRatePct: 94.0,
      safetyScore: 92,
      freightBonusPct: 2.0,
      priorityDispatchAccess: true
    },
    {
      rank: 3,
      carrierCode: 'CAR-ODUA-03',
      carrierName: 'Western Agrilogistics Fleet',
      tier: 'SILVER_AGRO_CARRIER',
      fleetSize: 6,
      overallScore: 78,
      onTimeRatePct: 84.5,
      safetyScore: 81,
      freightBonusPct: 0,
      priorityDispatchAccess: false
    },
    {
      rank: 4,
      carrierCode: 'CAR-NIGER-04',
      carrierName: 'Kainji Heavy Cargo Haulers',
      tier: 'BRONZE_CARRIER',
      fleetSize: 4,
      overallScore: 68,
      onTimeRatePct: 74.0,
      safetyScore: 72,
      freightBonusPct: 0,
      priorityDispatchAccess: false
    }
  ];

  test('renders all 4 tier ranking rows and rank numbers', () => {
    render(<CarrierLeaderboardTable rankings={sampleRankings} />);

    expect(screen.getByText('Arewa Express Agro-Haulage')).toBeInTheDocument();
    expect(screen.getByText('Middle-Belt Cold-Reefer Logistics')).toBeInTheDocument();
    expect(screen.getByText('Western Agrilogistics Fleet')).toBeInTheDocument();
    expect(screen.getByText('Kainji Heavy Cargo Haulers')).toBeInTheDocument();
  });

  test('displays medal emojis for top 3 ranked carriers', () => {
    render(<CarrierLeaderboardTable rankings={sampleRankings} />);

    expect(screen.getByTitle('Rank 1')).toBeInTheDocument();
    expect(screen.getByTitle('Rank 2')).toBeInTheDocument();
    expect(screen.getByTitle('Rank 3')).toBeInTheDocument();
    expect(screen.getByText('#4')).toBeInTheDocument();
  });

  test('renders priority dispatch VIP badge for platinum and gold carriers', () => {
    render(<CarrierLeaderboardTable rankings={sampleRankings} />);

    const vipBadges = screen.getAllByText(/⚡ VIP/i);
    expect(vipBadges.length).toBe(2); // Platinum and Gold
  });

  test('shows empty state message when search returns no match', () => {
    render(<CarrierLeaderboardTable rankings={sampleRankings} />);

    const searchInput = screen.getByLabelText(/search carriers/i);
    fireEvent.change(searchInput, { target: { value: 'NonExistentCarrier' } });

    expect(screen.getByText(/no carriers found matching the search criteria/i)).toBeInTheDocument();
  });
});
