/**
 * @file SoilNutrientEndToEndIntegration.test.js
 * @description Comprehensive multi-scenario frontend integration tests for Agrily Soil Health
 * and Precision N-P-K Recommendation Engine.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SoilNutrientCockpit from '../pages/SoilNutrientCockpit';

// Canvas Mock
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  clearRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  arc: jest.fn(),
  roundRect: jest.fn(),
  fillText: jest.fn(),
  setLineDash: jest.fn(),
  measureText: jest.fn(() => ({ width: 100 }))
}));

const renderWithRouter = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>);

describe('Soil Nutrient Multi-Scenario End-to-End Integration', () => {
  test('Scenario 1: Humid Rainforest Acid Leaching triggers Dolomitic Lime advisory', async () => {
    renderWithRouter(<SoilNutrientCockpit />);

    // Select Edo State (Humid Rainforest zone, pH 5.0)
    const stateSelect = screen.getByLabelText(/Jurisdiction \(State\):/i);
    fireEvent.change(stateSelect, { target: { value: 'Edo' } });

    expect(screen.getByText(/Humid Rainforest \(Tree Crop Belt\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Ultisols \/ Oxisols \(Ferralsols\)/i)).toBeInTheDocument();

    // Verify liming alert banner is displayed
    expect(screen.getByText(/Acidic Soil Leaching Detected/i)).toBeInTheDocument();
    expect(screen.getByText(/Agricultural Dolomitic Limestone/i)).toBeInTheDocument();
  });

  test('Scenario 2: Sahel Savanna Sandy Zone switches to Sorghum and Sand physical profile', async () => {
    renderWithRouter(<SoilNutrientCockpit />);

    // Select Borno State (Sahel Savanna, 85% Sand)
    const stateSelect = screen.getByLabelText(/Jurisdiction \(State\):/i);
    fireEvent.change(stateSelect, { target: { value: 'Borno' } });

    expect(screen.getByText(/Sahel Savanna/i)).toBeInTheDocument();
    expect(screen.getByText(/Entisols \/ Aridisols/i)).toBeInTheDocument();

    // Switch to Texture Triangle tab
    const textureTab = screen.getByRole('tab', { name: /USDA Soil Texture Triangle/i });
    fireEvent.click(textureTab);

    expect(screen.getByRole('img', { name: /USDA Soil Texture Triangle Ternary Canvas/i })).toBeInTheDocument();
  });

  test('Scenario 3: Tuber crop protocol includes MOP 0-0-60 potash booster in bag mix table', async () => {
    renderWithRouter(<SoilNutrientCockpit />);

    // Select Benue State (Southern Guinea Savanna, primary crop Yam)
    const stateSelect = screen.getByLabelText(/Jurisdiction \(State\):/i);
    fireEvent.change(stateSelect, { target: { value: 'Benue' } });

    expect(screen.getByText(/Southern Guinea Savanna/i)).toBeInTheDocument();

    // Navigate to Commercial Bag Mix Calculator
    const calcTab = screen.getByRole('tab', { name: /Commercial Bag Mix Calculator/i });
    fireEvent.click(calcTab);

    // Verify Yam protocol badge is displayed
    expect(screen.getByText(/YAM PROTOCOL/i)).toBeInTheDocument();
    expect(screen.getByText(/Muriate of Potash/i)).toBeInTheDocument();
    expect(screen.getByText('STAGE 1: BASAL')).toBeInTheDocument();
    expect(screen.getByText('STAGE 2: VEGETATIVE')).toBeInTheDocument();
  });

  test('Scenario 4: Export Procurement Order generates complete order summary', async () => {
    renderWithRouter(<SoilNutrientCockpit />);

    // Navigate to Commercial Bag Mix Calculator
    const calcTab = screen.getByRole('tab', { name: /Commercial Bag Mix Calculator/i });
    fireEvent.click(calcTab);

    const exportBtn = screen.getByText(/Export Commercial Procurement Order/i);
    fireEvent.click(exportBtn);

    // Button updates with confirmation
    await waitFor(() => {
      expect(screen.getByText(/Order CSV Copied to Clipboard!/i)).toBeInTheDocument();
    });
  });
});
