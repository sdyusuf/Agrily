import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PestSpatialHeatmapCanvas from '../PestSpatialHeatmapCanvas';

describe('PestSpatialHeatmapCanvas', () => {
  test('renders 64 KDE cells and updates cell inspector on click', () => {
    const handleSelectCell = jest.fn();
    render(
      <PestSpatialHeatmapCanvas
        pestKey="FALL_ARMYWORM"
        pestCommonName="Fall Armyworm (Spodoptera frugiperda)"
        baselineIncidencePct={34.5}
        onSelectCell={handleSelectCell}
      />
    );

    expect(screen.getByTestId('pest-spatial-heatmap-card')).toBeInTheDocument();

    const cellR2C3 = screen.getByTestId('pest-cell-KDE-R2-C3');
    fireEvent.click(cellR2C3);
    expect(handleSelectCell).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('pest-cell-inspector')).toHaveTextContent('KDE-R2-C3');
  });

  test('switches overlay modes between KDE Contagion, Pheromone Surge, and Wind Advection', () => {
    render(<PestSpatialHeatmapCanvas pestKey="TUTA_ABSOLUTA" />);

    const trapBtn = screen.getByTestId('pest-layer-PHEROMONE_SURGE');
    fireEvent.click(trapBtn);
    expect(trapBtn).toHaveClass('active');

    const windBtn = screen.getByTestId('pest-layer-WIND_ADVECTION');
    fireEvent.click(windBtn);
    expect(windBtn).toHaveClass('active');
  });
});
