import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import HarvestYieldPredictorCockpit from '../HarvestYieldPredictorCockpit';

describe('HarvestYieldPredictorCockpit', () => {
  test('renders Harvest Yield Predictor Cockpit, switches cultivars, and opens Weighbridge Calibration Modal', () => {
    render(
      <MemoryRouter>
        <HarvestYieldPredictorCockpit />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/Harvest Yield Predictor & Sub-Parcel Productivity Cockpit/i)
    ).toBeInTheDocument();

    const cropSelect = screen.getByTestId('cockpit-crop-select');
    fireEvent.change(cropSelect, { target: { value: 'RICE_PADDY' } });

    expect(screen.getByTestId('kpi-p50-yield').textContent).toMatch(/t\/ha/i);

    const openModalBtn = screen.getByTestId('open-weighbridge-modal-btn');
    fireEvent.click(openModalBtn);

    expect(screen.getByTestId('weighbridge-calibration-modal')).toBeInTheDocument();
  });
});
