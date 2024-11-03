import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PostHarvestDryingAndFleetCard from '../PostHarvestDryingAndFleetCard';

describe('PostHarvestDryingAndFleetCard', () => {
  test('renders grain drying energy, aflatoxin risk score, and updates on moisture slider change', () => {
    render(
      <PostHarvestDryingAndFleetCard
        cropKey="MAIZE"
        cropName="Hybrid White Maize (SAMMAZ-51)"
        areaHectares={6.5}
        predictedYieldTonsHa={4.52}
      />
    );

    expect(
      screen.getByTestId('postharvest-drying-fleet-card')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Grain Drying Energy, Mycotoxin Storage Safety & Evacuation Fleet Planner/i
      )
    ).toBeInTheDocument();

    const riskBefore = screen.getByTestId('aflatoxin-risk-score').textContent;
    const tempInput = screen.getByLabelText(/Silo Grain Temperature/i);
    fireEvent.change(tempInput, { target: { value: '38.5' } });

    const riskAfter = screen.getByTestId('aflatoxin-risk-score').textContent;
    expect(riskAfter).not.toEqual(riskBefore);
  });

  test('toggles PICS hermetic bagging and updates combine harvester count', () => {
    render(
      <PostHarvestDryingAndFleetCard
        cropKey="RICE_PADDY"
        cropName="FARO-61 Lowland Irrigated Rice"
        areaHectares={8.0}
        predictedYieldTonsHa={5.08}
      />
    );

    const combineSelect = screen.getByLabelText(/Combine Harvester Units/i);
    fireEvent.change(combineSelect, { target: { value: '2' } });
    expect(combineSelect.value).toBe('2');

    const hermeticCheckbox = screen.getByRole('checkbox', {
      name: /PICS Hermetic Bagging/i,
    });
    expect(hermeticCheckbox).toBeChecked();
    fireEvent.click(hermeticCheckbox);
    expect(hermeticCheckbox).not.toBeChecked();
  });
});
