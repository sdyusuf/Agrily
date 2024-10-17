import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MicroclimateRadarCanvas from '../MicroclimateRadarCanvas';

describe('MicroclimateRadarCanvas Component', () => {
  const sampleGrid = Array.from({ length: 64 }, (_, idx) => {
    const row = Math.floor(idx / 8);
    const col = idx % 8;
    return {
      cellId: `R${row}-C${col}`,
      row,
      col,
      canopyTempCelsius: row === 0 && col === 0 ? 0.8 : 24.5,
      precipIntensityMmHr: row === 1 && col === 1 ? 28.5 : 2.0,
      windSpeedKmh: 9.2,
      windDirectionDegrees: 210,
      vpdKpa: 1.45,
      relativeHumidityPct: 64,
      cellHazardLabel: row === 0 && col === 0 ? 'Frost Pocket' : 'Nominal'
    };
  });

  test('renders station metadata, layer tabs, and 64 interactive radar cells', () => {
    render(
      <MicroclimateRadarCanvas
        radarGrid={sampleGrid}
        stationName="Jos Plateau Montane Observatory #4"
        stationCode="AWS-JOS-1042"
        agroEcologicalZone="Mid-Altitude Montane"
      />
    );

    expect(screen.getByTestId('microclimate-radar-card')).toBeInTheDocument();
    expect(screen.getByText(/Jos Plateau Montane Observatory #4/i)).toBeInTheDocument();
    expect(screen.getByTestId('radar-cell-R0-C0')).toBeInTheDocument();
    expect(screen.getByTestId('radar-cell-R7-C7')).toBeInTheDocument();
  });

  test('switches radar layers and updates cell inspector on click', () => {
    const onSelectMock = jest.fn();
    render(
      <MicroclimateRadarCanvas
        radarGrid={sampleGrid}
        stationCode="AWS-JOS-1042"
        onSelectCell={onSelectMock}
      />
    );

    const frostTab = screen.getByTestId('radar-layer-TEMP_FROST');
    fireEvent.click(frostTab);
    expect(frostTab).toHaveAttribute('aria-selected', 'true');

    const targetCell = screen.getByTestId('radar-cell-R1-C1');
    fireEvent.click(targetCell);
    expect(onSelectMock).toHaveBeenCalledWith(expect.objectContaining({ cellId: 'R1-C1' }));
    expect(screen.getByText(/SECTOR R1-C1/i)).toBeInTheDocument();
  });
});
