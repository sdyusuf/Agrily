/**
 * @file FertilizerBagMixCalculatorCard.test.js
 * @description Unit tests for Fertilizer Bag Mix Calculator Card Component.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FertilizerBagMixCalculatorCard, { COMMERCIAL_PRODUCTS_CATALOG } from '../components/FertilizerBagMixCalculatorCard';

describe('FertilizerBagMixCalculatorCard Component', () => {
  test('renders header, acreage slider, yield goal slider, and quotation table', () => {
    render(
      <FertilizerBagMixCalculatorCard
        targetCrop="MAIZE"
        initialAcreageHectares={2.0}
        initialTargetYieldTons={4.5}
      />
    );

    expect(screen.getByText('Commercial Fertilizer Bag Mix Calculator')).toBeInTheDocument();
    expect(screen.getByText(/MAIZE PROTOCOL/i)).toBeInTheDocument();
    expect(screen.getByText('Cumulative Supply Requirement:')).toBeInTheDocument();
    expect(screen.getByText('Agronomic Split-Application Protocol')).toBeInTheDocument();
  });

  test('adjusting field acreage updates calculated bag quantities and costs', () => {
    render(
      <FertilizerBagMixCalculatorCard
        targetCrop="MAIZE"
        initialAcreageHectares={2.0}
        initialTargetYieldTons={4.5}
      />
    );

    const acreageSlider = screen.getByLabelText(/Field Acreage/i) || screen.getByDisplayValue('2');
    fireEvent.change(acreageSlider, { target: { value: '4' } });

    expect(screen.getByText(/4 Hectares/i)).toBeInTheDocument();
  });

  test('selecting alternative basal compound updates the quotation table', () => {
    render(
      <FertilizerBagMixCalculatorCard
        targetCrop="TOMATO"
        initialAcreageHectares={2.0}
        initialTargetYieldTons={20.0}
      />
    );

    const dapButton = screen.getByText(/DAP-18-46-0/i);
    fireEvent.click(dapButton);

    expect(screen.getByText(/Dangote Granular DAP 18-46-0/i)).toBeInTheDocument();
  });

  test('renders 3-stage split application timeline with instructions', () => {
    render(
      <FertilizerBagMixCalculatorCard
        targetCrop="YAM"
        initialAcreageHectares={3.0}
        initialTargetYieldTons={18.0}
      />
    );

    expect(screen.getByText('STAGE 1: BASAL')).toBeInTheDocument();
    expect(screen.getByText('STAGE 2: VEGETATIVE')).toBeInTheDocument();
    expect(screen.getByText(/STAGE 3: FLOWERING \/ BULKING/i)).toBeInTheDocument();
  });

  test('clicking export procurement order button triggers export handler', () => {
    const onExportMock = jest.fn();
    render(
      <FertilizerBagMixCalculatorCard
        targetCrop="MAIZE"
        initialAcreageHectares={2.0}
        initialTargetYieldTons={4.5}
        onOrderExport={onExportMock}
      />
    );

    const exportBtn = screen.getByText(/Export Commercial Procurement Order/i);
    fireEvent.click(exportBtn);

    expect(onExportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        targetCrop: 'MAIZE',
        acreageHectares: 2.0,
        targetYieldTons: 4.5
      })
    );
  });
});
