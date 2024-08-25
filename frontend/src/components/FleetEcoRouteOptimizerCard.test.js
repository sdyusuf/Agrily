import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FleetEcoRouteOptimizerCard from './FleetEcoRouteOptimizerCard';

describe('FleetEcoRouteOptimizerCard', () => {
  it('renders correctly with title, savings pill, and default routes', () => {
    render(<FleetEcoRouteOptimizerCard />);

    expect(screen.getByTestId('fleet-eco-route-optimizer-card')).toBeInTheDocument();
    expect(screen.getByText('Regional Terrain & Carbon Minimizer')).toBeInTheDocument();
    expect(screen.getByTestId('eco-projected-savings-pill')).toBeInTheDocument();
    expect(screen.getByTestId('route-comparison-grid')).toBeInTheDocument();
  });

  it('allows changing trade corridor to Benue-Port Harcourt', () => {
    render(<FleetEcoRouteOptimizerCard />);

    const select = screen.getByTestId('corridor-select');
    fireEvent.change(select, { target: { value: 'BENUE_PORTHARCOURT' } });

    expect(select.value).toBe('BENUE_PORTHARCOURT');
    expect(screen.getByText(/Southern Highway/)).toBeInTheDocument();
  });

  it('recalculates fuel and cost when adjusting payload tonnage', () => {
    render(<FleetEcoRouteOptimizerCard />);

    const tonnageSlider = screen.getByTestId('tonnage-range-input');
    fireEvent.change(tonnageSlider, { target: { value: '30' } });

    expect(tonnageSlider.value).toBe('30');
    expect(screen.getByText(/30 Tonnes/)).toBeInTheDocument();
  });

  it('triggers onSelectRoute callback when clicking an alternate route card', () => {
    const handleSelect = jest.fn();
    render(<FleetEcoRouteOptimizerCard onSelectRoute={handleSelect} />);

    const routeCard1 = screen.getByTestId('route-card-1');
    fireEvent.click(routeCard1);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect.mock.calls[0][0].name).toContain('Bypass Route B');
  });

  it('toggles reefer cold-chain auxiliary power consumption', () => {
    render(<FleetEcoRouteOptimizerCard />);

    const reeferCheckbox = screen.getByTestId('reefer-checkbox');
    expect(reeferCheckbox.checked).toBe(false);

    fireEvent.click(reeferCheckbox);
    expect(reeferCheckbox.checked).toBe(true);
  });
});
