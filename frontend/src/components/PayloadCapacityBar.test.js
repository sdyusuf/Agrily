/**
 * ==============================================================================
 * PAYLOAD CAPACITY BAR COMPONENT - UNIT TESTS
 * ==============================================================================
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { PayloadCapacityBar } from './PayloadCapacityBar';

describe('PayloadCapacityBar Component', () => {
  test('renders optimal load status when payload is under 75%', () => {
    render(
      <PayloadCapacityBar
        currentPayloadKg={2000}
        maxPayloadKg={4000}
        currentCrates={80}
        maxCrates={160}
        vehicleType="Refrigerated Van"
        registrationNumber="KAD-789-XY"
      />
    );

    expect(screen.getByTestId('payload-capacity-bar')).toBeInTheDocument();
    expect(screen.getByText('Optimal Load')).toBeInTheDocument();
    expect(screen.getByText('Refrigerated Van')).toBeInTheDocument();
    expect(screen.getByText('KAD-789-XY')).toBeInTheDocument();
    expect(screen.getByTestId('utilization-percentage')).toHaveTextContent('50%');
    expect(screen.getByText(/available payload headroom remaining/i)).toBeInTheDocument();
  });

  test('renders near-capacity status when payload is between 75% and 99%', () => {
    render(
      <PayloadCapacityBar
        currentPayloadKg={3200}
        maxPayloadKg={4000}
        currentCrates={128}
        maxCrates={160}
      />
    );

    expect(screen.getByText('Near Capacity')).toBeInTheDocument();
    expect(screen.getByTestId('utilization-percentage')).toHaveTextContent('80%');
  });

  test('renders overload critical warning banner when payload exceeds limit', () => {
    render(
      <PayloadCapacityBar
        currentPayloadKg={4500}
        maxPayloadKg={4000}
        currentCrates={180}
        maxCrates={160}
      />
    );

    expect(screen.getByText('Overloaded (Exceeds Legal Limit)')).toBeInTheDocument();
    expect(screen.getByTestId('overload-warning')).toBeInTheDocument();
    expect(screen.getByText(/Route payload exceeds vehicle limit by/i)).toBeInTheDocument();
    expect(screen.getByText(/500 kg/)).toBeInTheDocument();
  });

  test('displays crate count utilization correctly', () => {
    render(
      <PayloadCapacityBar
        currentPayloadKg={1500}
        maxPayloadKg={3000}
        currentCrates={60}
        maxCrates={120}
      />
    );

    expect(screen.getByText(/60 \/ 120/)).toBeInTheDocument();
  });
});
