import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SubParcelYieldHeatmapCanvas from '../SubParcelYieldHeatmapCanvas';

describe('SubParcelYieldHeatmapCanvas', () => {
  test('renders 64 sub-parcel cells and updates inspector on click', () => {
    const handleSelectCell = jest.fn();
    render(
      <SubParcelYieldHeatmapCanvas
        cropType="Maize"
        parcelCode="PRC-KD-104"
        parcelName="Kaduna North Block A"
        onSelectCell={handleSelectCell}
      />
    );

    expect(
      screen.getByTestId('subparcel-yield-heatmap-card')
    ).toBeInTheDocument();

    const cellZ23 = screen.getByTestId('yield-cell-Z2-3');
    expect(cellZ23).toBeInTheDocument();

    fireEvent.click(cellZ23);
    expect(handleSelectCell).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('yield-cell-inspector')).toHaveTextContent('BLOCK Z2-3');
  });

  test('switches overlay layers between yield, biomass, harvest index, and revenue', () => {
    render(<SubParcelYieldHeatmapCanvas cropType="Soybean" />);

    const biomassLayerBtn = screen.getByTestId('yield-layer-BIOMASS_ACCUM');
    fireEvent.click(biomassLayerBtn);
    expect(biomassLayerBtn).toHaveClass('active');

    const hiLayerBtn = screen.getByTestId('yield-layer-HARVEST_INDEX');
    fireEvent.click(hiLayerBtn);
    expect(hiLayerBtn).toHaveClass('active');
  });
});
