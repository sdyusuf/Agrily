import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SalinityLeachingAndAwdSimulatorCard from '../SalinityLeachingAndAwdSimulatorCard';

describe('SalinityLeachingAndAwdSimulatorCard Component', () => {
  test('renders Rhoades FAO-29 salinity leaching, IRRI Safe-AWD tube, and RBDA Warabandi controls', () => {
    render(<SalinityLeachingAndAwdSimulatorCard />);

    expect(
      screen.getByTestId('salinity-leaching-and-awd-simulator-card')
    ).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('ecw-salinity-slider'), {
      target: { value: '3.2' },
    });
    expect(screen.getByTestId('maas-hoffman-yield-readout')).toHaveTextContent(
      '77.2%'
    );

    fireEvent.change(screen.getByTestId('rice-phenology-stage-select'), {
      target: { value: 'FLOWERING_HEADING' },
    });
    expect(screen.getByTestId('awd-status-badge')).toHaveTextContent(
      'FLOWERING LOCK (+5 CM PONDING)'
    );

    fireEvent.change(screen.getByTestId('rbda-basin-select'), {
      target: { value: 'RBDA-03-CB' },
    });
    expect(screen.getByTestId('rbda-conveyance-readout')).toHaveTextContent('64%');
  });
});
