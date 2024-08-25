import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FleetMaintenanceHealthCard from './FleetMaintenanceHealthCard';

describe('FleetMaintenanceHealthCard', () => {
  it('renders roadworthiness clearance pill and wear progress tracks', () => {
    render(<FleetMaintenanceHealthCard />);

    expect(screen.getByTestId('fleet-maintenance-health-card')).toBeInTheDocument();
    expect(screen.getByText('Vehicle Roadworthiness & Pre-Trip Health')).toBeInTheDocument();
    expect(screen.getByTestId('clearance-status-pill')).toBeInTheDocument();
    expect(screen.getByTestId('component-wear-grid')).toBeInTheDocument();
  });

  it('switches vehicle and displays safety clearance status', () => {
    render(<FleetMaintenanceHealthCard />);

    const selector = screen.getByTestId('vehicle-selector');
    // Switch to ABJ-319-YF which is overdue for service
    fireEvent.change(selector, { target: { value: 'ABJ-319-YF' } });

    expect(selector.value).toBe('ABJ-319-YF');
    const clearanceLabel = screen.getByTestId('clearance-label-text');
    expect(clearanceLabel).toBeInTheDocument();
  });

  it('allows simulating certified depot service completion', () => {
    render(<FleetMaintenanceHealthCard />);

    // Select ABJ-319-YF which has pending actions
    const selector = screen.getByTestId('vehicle-selector');
    fireEvent.change(selector, { target: { value: 'ABJ-319-YF' } });

    const serviceBtn = screen.getByTestId('simulate-service-btn');
    expect(serviceBtn).toBeInTheDocument();

    fireEvent.click(serviceBtn);

    // After service, all-clear banner should appear
    expect(screen.getByTestId('all-clear-banner')).toBeInTheDocument();
    expect(screen.getByText(/All components within safety tolerances/)).toBeInTheDocument();
  });
});
