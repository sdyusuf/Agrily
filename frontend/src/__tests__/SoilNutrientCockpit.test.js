/**
 * @file SoilNutrientCockpit.test.js
 * @description Unit tests for Master Soil Health & Nutrition Cockpit Page.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SoilNutrientCockpit from '../pages/SoilNutrientCockpit';

// Mock Canvas getContext for SoilTextureTriangleCanvas inside cockpit
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

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('SoilNutrientCockpit Master Page', () => {
  test('renders hero header, title, and regional geoselector dropdowns', () => {
    renderWithRouter(<SoilNutrientCockpit />);

    expect(screen.getByText('Soil Nutrient & N-P-K Recommendation Engine')).toBeInTheDocument();
    expect(screen.getByLabelText(/Agro-Ecological Zone:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Jurisdiction \(State\):/i)).toBeInTheDocument();
  });

  test('selecting state updates active agro-zone and dominant soil order', () => {
    renderWithRouter(<SoilNutrientCockpit />);

    const stateSelect = screen.getByLabelText(/Jurisdiction \(State\):/i);
    fireEvent.change(stateSelect, { target: { value: 'Kano' } });

    expect(screen.getByText(/Sudan Savanna/i)).toBeInTheDocument();
    expect(screen.getByText(/Alfisols \(Ferruginous Tropical Soils\)/i)).toBeInTheDocument();
  });

  test('navigates across tabs (Radar, Texture, Fertilizer Calculator)', () => {
    renderWithRouter(<SoilNutrientCockpit />);

    // Default tab is Liebig Radar
    expect(screen.getByText('Soil Nutrient Deficiency Radar')).toBeInTheDocument();

    // Click USDA Texture Triangle tab
    const textureTab = screen.getByRole('tab', { name: /USDA Soil Texture Triangle/i });
    fireEvent.click(textureTab);
    expect(screen.getByText('USDA Soil Textural Triangle')).toBeInTheDocument();

    // Click Commercial Bag Mix Calculator tab
    const calcTab = screen.getByRole('tab', { name: /Commercial Bag Mix Calculator/i });
    fireEvent.click(calcTab);
    expect(screen.getByText('Commercial Fertilizer Bag Mix Calculator')).toBeInTheDocument();
  });

  test('renders digital soil health passport and cryptographic SHA-256 seal', () => {
    renderWithRouter(<SoilNutrientCockpit />);

    expect(screen.getByText(/Digital Soil Health Passport & Audit Seal/i)).toBeInTheDocument();
    expect(screen.getByText('VERIFIED IITA / SSSN PROTOCOL')).toBeInTheDocument();
    expect(screen.getByText(/Cryptographic SHA-256 Audit Seal:/i)).toBeInTheDocument();
    expect(screen.getByText(/Dr. Amina Bello, FNSS/i)).toBeInTheDocument();
  });
});
