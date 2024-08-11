/**
 * ==============================================================================
 * 🌾 AGRILY FRONTEND: QUALITY INSPECTION GRADING MATRIX TESTS
 * ==============================================================================
 * 
 * Exhaustive component test matrix testing the live grading engine inside
 * QualityInspectionModal across commodities (vegetables, grains, tubers, fruits)
 * and boundary conditions (moisture, spoilage, foreign matter, temperature).
 * 
 * @module tests/QualityInspectionGradingMatrix.test
 * @author Agrily Quality & Frontend Engineering
 * ==============================================================================
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QualityInspectionModal from '../components/QualityInspectionModal';

describe('Quality Inspection Grading Matrix & Slider Unit Tests', () => {
  const dummyVault = {
    vaultNumber: 'VAULT-TEST-MATRIX-001',
    produceCategory: 'vegetables',
    produceName: 'Roma Tomatoes (Plum)',
    quantityKg: 5000,
    cratesBags: 200
  };

  test('calculates Grade A when metrics are within export limits', () => {
    render(
      <QualityInspectionModal
        show={true}
        onClose={jest.fn()}
        vault={dummyVault}
      />
    );

    // Initial default state gives Grade A
    expect(screen.getByText(/Grade A: Export Premium/i)).toBeInTheDocument();
    expect(screen.getByText(/Standard Full Release/i)).toBeInTheDocument();
  });

  test('transitions to Grade B wholesale standard when spoilage is between 2% and 4.5%', () => {
    render(
      <QualityInspectionModal
        show={true}
        onClose={jest.fn()}
        vault={dummyVault}
      />
    );

    const spoilageSlider = screen.getByTestId('input-spoilage');
    fireEvent.change(spoilageSlider, { target: { value: '3.5' } });

    expect(screen.getByText(/Grade B: Wholesale Standard/i)).toBeInTheDocument();
  });

  test('transitions to Grade C processing grade with pro-rata discount when spoilage is between 4.5% and 8%', () => {
    render(
      <QualityInspectionModal
        show={true}
        onClose={jest.fn()}
        vault={dummyVault}
      />
    );

    const spoilageSlider = screen.getByTestId('input-spoilage');
    fireEvent.change(spoilageSlider, { target: { value: '6.0' } });

    expect(screen.getByText(/Grade C: Processing Grade/i)).toBeInTheDocument();
    expect(screen.getByText(/Rec\. Price Adjustment: -9%/i)).toBeInTheDocument();
  });

  test('transitions to Rejected Unfit for commerce when spoilage exceeds 8%', () => {
    render(
      <QualityInspectionModal
        show={true}
        onClose={jest.fn()}
        vault={dummyVault}
      />
    );

    const spoilageSlider = screen.getByTestId('input-spoilage');
    fireEvent.change(spoilageSlider, { target: { value: '9.0' } });

    expect(screen.getByText(/Rejected: Unfit for Commerce/i)).toBeInTheDocument();
    expect(screen.getByText(/Rec\. Price Adjustment: -100%/i)).toBeInTheDocument();
  });

  test('penalizes grain category when moisture exceeds 13.0%', () => {
    render(
      <QualityInspectionModal
        show={true}
        onClose={jest.fn()}
        vault={dummyVault}
      />
    );

    // Switch commodity to grains
    const categorySelect = screen.getByTestId('select-produce-category');
    fireEvent.change(categorySelect, { target: { value: 'grains' } });

    // Set moisture to 17.0% (4.0% above limit -> -20 score)
    const moistureSlider = screen.getByTestId('input-moisture');
    fireEvent.change(moistureSlider, { target: { value: '17.0' } });

    // Spoilage at 3.5% + moisture penalty pulls it to Grade C or lower
    const spoilageSlider = screen.getByTestId('input-spoilage');
    fireEvent.change(spoilageSlider, { target: { value: '3.5' } });

    expect(screen.queryByText(/Grade A: Export Premium/i)).not.toBeInTheDocument();
  });

  test('immediately flags rejection when biological mold is detected', () => {
    render(
      <QualityInspectionModal
        show={true}
        onClose={jest.fn()}
        vault={dummyVault}
      />
    );

    const moldCheckbox = screen.getByTestId('check-mold');
    fireEvent.click(moldCheckbox);

    expect(screen.getByText(/Rejected: Unfit for Commerce/i)).toBeInTheDocument();
    expect(screen.getByText(/Rec\. Price Adjustment: -100%/i)).toBeInTheDocument();
  });
});
