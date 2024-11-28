import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RootZoneDepletionBucketCanvas from '../RootZoneDepletionBucketCanvas';

describe('RootZoneDepletionBucketCanvas Component', () => {
  const mockZones = [
    {
      zoneCode: 'IRR-ZN-1001',
      zoneName: 'Hadejia-Jama’are Sector B — Drip Irrigated Roma Tomato',
      cropKey: 'TOMATO_IRRIGATED',
      scheduleEvaluation: {
        tawMm: 108.0,
        rawMm: 45.4,
        currentDepletionDrMm: 54.0,
        depletionOfTawPct: 50.0,
        currentMoistureVolPct: 16.0,
        waterStressCoeffKs: 0.86,
        grossIrrigationDepthMm: 60.0,
        grossWaterVolumeM3: 870,
        triggerDecision: 'IRRIGATE_IMMEDIATELY_RAW_EXCEEDED',
      },
    },
    {
      zoneCode: 'IRR-ZN-1002',
      zoneName: 'Kadawa Wheat Belt Block 4 — Center Pivot Durum Wheat',
      cropKey: 'WHEAT_IRRIGATED',
      scheduleEvaluation: {
        tawMm: 165.0,
        rawMm: 90.8,
        currentDepletionDrMm: 42.0,
        depletionOfTawPct: 25.5,
        currentMoistureVolPct: 24.5,
        waterStressCoeffKs: 1.0,
        grossIrrigationDepthMm: 0,
        grossWaterVolumeM3: 0,
        triggerDecision: 'ADEQUATE_MOISTURE_NO_IRRIGATION',
      },
    },
  ];

  test('renders root-zone bucket SVG, trigger pill, and responds to matric suction slider', () => {
    const onSelectZone = jest.fn();
    const onChangeMatricSuction = jest.fn();

    render(
      <RootZoneDepletionBucketCanvas
        zones={mockZones}
        selectedZone={mockZones[0]}
        onSelectZone={onSelectZone}
        matricSuctionKpa={46}
        onChangeMatricSuction={onChangeMatricSuction}
      />
    );

    expect(
      screen.getByTestId('root-zone-depletion-bucket-canvas')
    ).toBeInTheDocument();
    expect(screen.getByTestId('bucket-trigger-decision-badge')).toHaveTextContent(
      'IRRIGATE_IMMEDIATELY_RAW_EXCEEDED'
    );
    expect(screen.getByTestId('volumetric-moisture-readout')).toHaveTextContent('16%');

    const zone2Btn = screen.getByTestId('select-zone-btn-IRR-ZN-1002');
    fireEvent.click(zone2Btn);
    expect(onSelectZone).toHaveBeenCalledWith(mockZones[1]);

    const suctionSlider = screen.getByTestId('matric-suction-slider');
    fireEvent.change(suctionSlider, { target: { value: '72' } });
    expect(onChangeMatricSuction).toHaveBeenCalledWith(72);
  });
});
