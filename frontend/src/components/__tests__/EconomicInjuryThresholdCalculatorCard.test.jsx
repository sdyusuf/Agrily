import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EconomicInjuryThresholdCalculatorCard from '../EconomicInjuryThresholdCalculatorCard';

describe('EconomicInjuryThresholdCalculatorCard', () => {
  test('renders Pedigo EIL/ET thresholds and updates action decision when incidence slider changes', () => {
    const handleEvalChange = jest.fn();
    render(
      <EconomicInjuryThresholdCalculatorCard
        pestKey="FALL_ARMYWORM"
        onEvaluationChange={handleEvalChange}
      />
    );

    expect(
      screen.getByTestId('eil-threshold-calculator-card')
    ).toBeInTheDocument();

    const incidenceSlider = screen.getByTestId('eil-incidence-slider');
    fireEvent.change(incidenceSlider, { target: { value: '62' } });

    expect(screen.getByTestId('eil-action-decision')).toHaveTextContent(
      'IMMEDIATE_IPM_AND_TARGETED_KNOCKDOWN'
    );
    expect(handleEvalChange).toHaveBeenCalled();
  });
});
