import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import YieldSensitivitySimulatorCard from '../YieldSensitivitySimulatorCard';

describe('YieldSensitivitySimulatorCard', () => {
  test('renders P10, P50, P90 quantile cards and triggers simulation callback when sliders change', () => {
    const handleRunSimulation = jest.fn();
    render(
      <YieldSensitivitySimulatorCard
        cropType="Maize"
        areaHectares={5.0}
        onRunSimulation={handleRunSimulation}
      />
    );

    expect(
      screen.getByText(/Agronomic Input Sensitivity & Monte Carlo Confidence Fan/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId('monte-carlo-quantile-strip')).toBeInTheDocument();

    const nitrogenSlider = screen.getByTestId('sim-nitrogen-slider');
    fireEvent.change(nitrogenSlider, { target: { value: '165' } });

    const runBtn = screen.getByTestId('run-yield-simulation-btn');
    fireEvent.click(runBtn);

    expect(handleRunSimulation).toHaveBeenCalledWith(
      expect.objectContaining({
        appliedNitrogenKgHa: 165,
      })
    );
  });
});
