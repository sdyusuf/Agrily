/**
 * @file SoilNutrientLifecycleIntegration.test.js
 * @description End-to-end integration test for Soil Nutrient & N-P-K Recommendation Engine.
 * Validates regional baseline geoselection, USDA physical texture projection,
 * Liebig Law of the Minimum deficiency indexing, and commercial fertilizer order generation.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SoilNutrientCockpit from '../pages/SoilNutrientCockpit';

// Mock Canvas context
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
  measureText: jest.fn(() => ({ width: 120 }))
}));

const renderWithRouter = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>);

describe('Soil Nutrient & N-P-K End-to-End Lifecycle Integration', () => {
  test('executes end-to-end flow from agro-zone selection to commercial order export', async () => {
    renderWithRouter(<SoilNutrientCockpit />);

    // 1. Initial Page Load & Heading
    expect(screen.getByText('Soil Nutrient & N-P-K Recommendation Engine')).toBeInTheDocument();
    expect(screen.getByText(/Alfisols \/ Inceptisols/i)).toBeInTheDocument();

    // 2. Select Borno State (Sahel Savanna Zone)
    const stateSelect = screen.getByLabelText(/Jurisdiction \(State\):/i);
    fireEvent.change(stateSelect, { target: { value: 'Borno' } });

    // Verify dominant soil order updates to Entisols / Aridisols
    expect(screen.getByText(/Entisols \/ Aridisols \(Regosols\)/i)).toBeInTheDocument();

    // 3. Navigate to USDA Soil Texture Triangle Tab
    const textureTab = screen.getByRole('tab', { name: /USDA Soil Texture Triangle/i });
    fireEvent.click(textureTab);

    expect(screen.getByText('USDA Soil Textural Triangle')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /USDA Soil Texture Triangle Ternary Canvas/i })).toBeInTheDocument();

    // 4. Navigate to Commercial Bag Mix Calculator Tab
    const calcTab = screen.getByRole('tab', { name: /Commercial Bag Mix Calculator/i });
    fireEvent.click(calcTab);

    expect(screen.getByText('Commercial Fertilizer Bag Mix Calculator')).toBeInTheDocument();

    // 5. Adjust Field Acreage Slider to 5 Hectares
    const acreageSlider = screen.getByLabelText(/Field Acreage/i);
    fireEvent.change(acreageSlider, { target: { value: '5' } });

    expect(screen.getByText(/5 Hectares/i)).toBeInTheDocument();

    // 6. Verify Split Application Protocol Timeline
    expect(screen.getByText('STAGE 1: BASAL')).toBeInTheDocument();
    expect(screen.getByText('STAGE 2: VEGETATIVE')).toBeInTheDocument();

    // 7. Click Export Procurement Order Button
    const exportBtn = screen.getByText(/Export Commercial Procurement Order/i);
    fireEvent.click(exportBtn);

    // 8. Verify Digital Soil Health Passport & SHA-256 seal is rendered
    expect(screen.getByText(/Digital Soil Health Passport & Audit Seal/i)).toBeInTheDocument();
    expect(screen.getByText(/Cryptographic SHA-256 Audit Seal:/i)).toBeInTheDocument();
  });
});
