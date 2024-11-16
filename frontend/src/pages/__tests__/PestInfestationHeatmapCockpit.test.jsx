import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import PestInfestationHeatmapCockpit from '../PestInfestationHeatmapCockpit';

describe('PestInfestationHeatmapCockpit', () => {
  test('renders Pest Infestation Heatmap Cockpit, switches target species, and opens scouting modal', () => {
    render(
      <MemoryRouter>
        <PestInfestationHeatmapCockpit />
      </MemoryRouter>
    );

    expect(
      screen.getByText(
        /Pest Infestation Heatmap & IPM Biocontrol Surveillance Cockpit/i
      )
    ).toBeInTheDocument();

    const speciesSelect = screen.getByTestId('pest-species-select');
    fireEvent.change(speciesSelect, { target: { value: 'TUTA_ABSOLUTA' } });

    expect(screen.getByTestId('kpi-pest-incidence')).toHaveTextContent('41.2%');

    const openScoutingBtn = screen.getByTestId('open-scouting-modal-btn');
    fireEvent.click(openScoutingBtn);

    expect(
      screen.getByTestId('crowd-scouting-report-modal')
    ).toBeInTheDocument();
  });
});
