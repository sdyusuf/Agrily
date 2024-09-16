/**
 * @file SoilNutrientDeficiencyRadarCard.test.js
 * @description Unit tests for Soil Nutrient Deficiency Radar Card Component.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SoilNutrientDeficiencyRadarCard from '../components/SoilNutrientDeficiencyRadarCard';

describe('SoilNutrientDeficiencyRadarCard Component', () => {
  const mockSoilChemistryAcidic = {
    phWater: 5.1,
    organicCarbonPct: 0.85,
    totalNitrogenPct: 0.07,
    availablePhosphorusBray1MgPerKg: 6.5, // Critical deficit
    exchangeableCalciumCa: 2.5,
    exchangeableMagnesiumMg: 0.8,
    exchangeablePotassiumK: 0.22,
    exchangeableSodiumNa: 0.05,
    exchangeableAcidityAlPlusH: 1.4,
    sulfateSulfurMgPerKg: 6.0,
    zincPpm: 1.1,
    boronPpm: 0.25
  };

  const mockSoilChemistryOptimal = {
    phWater: 6.5,
    organicCarbonPct: 1.4,
    totalNitrogenPct: 0.14,
    availablePhosphorusBray1MgPerKg: 20.0,
    exchangeableCalciumCa: 4.8,
    exchangeableMagnesiumMg: 1.8,
    exchangeablePotassiumK: 0.45,
    exchangeableSodiumNa: 0.08,
    exchangeableAcidityAlPlusH: 0.1,
    sulfateSulfurMgPerKg: 11.5,
    zincPpm: 2.2,
    boronPpm: 0.55
  };

  test('renders header, SVG radar chart, and crop standard selector', () => {
    render(<SoilNutrientDeficiencyRadarCard soilChemistry={mockSoilChemistryAcidic} initialCrop="MAIZE" />);

    expect(screen.getByText('Soil Nutrient Deficiency Radar')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Nutrient Radar Chart/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Crop Standard:/i)).toBeInTheDocument();
  });

  test('identifies and displays Liebig Law of the Minimum limiting factor', () => {
    render(<SoilNutrientDeficiencyRadarCard soilChemistry={mockSoilChemistryAcidic} initialCrop="MAIZE" />);

    expect(screen.getByText('LIEBIG LIMITING FACTOR')).toBeInTheDocument();
    expect(screen.getByText(/Under Liebig's Law of the Minimum, harvest yield is strictly constrained by/i)).toBeInTheDocument();
  });

  test('displays acidic soil liming advisory when pH is below 5.5', () => {
    render(<SoilNutrientDeficiencyRadarCard soilChemistry={mockSoilChemistryAcidic} initialCrop="MAIZE" />);

    expect(screen.getByText(/Acidic Soil Leaching Detected/i)).toBeInTheDocument();
    expect(screen.getByText(/Agricultural Dolomitic Limestone/i)).toBeInTheDocument();
  });

  test('calculates and renders high fertility index for balanced soil', () => {
    render(<SoilNutrientDeficiencyRadarCard soilChemistry={mockSoilChemistryOptimal} initialCrop="MAIZE" />);

    expect(screen.getByText('HIGH YIELD CAPACITY')).toBeInTheDocument();
    expect(screen.queryByText(/Acidic Soil Leaching Detected/i)).not.toBeInTheDocument();
  });

  test('switching crop standard calls onCropChange callback', () => {
    const onCropChangeMock = jest.fn();
    render(
      <SoilNutrientDeficiencyRadarCard
        soilChemistry={mockSoilChemistryAcidic}
        initialCrop="MAIZE"
        onCropChange={onCropChangeMock}
      />
    );

    const select = screen.getByLabelText(/Crop Standard:/i);
    fireEvent.change(select, { target: { value: 'TOMATO' } });

    expect(onCropChangeMock).toHaveBeenCalledWith('TOMATO');
    expect(screen.getByText('Tomato (Vegetable)')).toBeInTheDocument();
  });
});
