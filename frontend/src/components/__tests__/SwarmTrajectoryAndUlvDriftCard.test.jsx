import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SwarmTrajectoryAndUlvDriftCard from '../SwarmTrajectoryAndUlvDriftCard';

describe('SwarmTrajectoryAndUlvDriftCard', () => {
  test('renders 72h swarm trajectory and updates ULV deposition when wind speed changes', () => {
    render(
      <SwarmTrajectoryAndUlvDriftCard
        pestKey="DESERT_LOCUST"
        pestCommonName="Desert & Migratory Locust"
      />
    );

    expect(
      screen.getByTestId('swarm-trajectory-ulv-card')
    ).toBeInTheDocument();

    const depBefore = screen.getByTestId('ulv-deposition-pct').textContent;
    const windInput = screen.getByLabelText(/Boundary Wind Speed/i);
    fireEvent.change(windInput, { target: { value: '32' } });

    const depAfter = screen.getByTestId('ulv-deposition-pct').textContent;
    expect(depAfter).not.toEqual(depBefore);
    expect(screen.getByTestId('ulv-spray-status')).toHaveTextContent(
      'SUSPEND_SPRAYING_DRIFT_HAZARD'
    );
  });
});

