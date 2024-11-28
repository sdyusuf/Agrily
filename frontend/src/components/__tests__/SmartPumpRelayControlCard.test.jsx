import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SmartPumpRelayControlCard from '../SmartPumpRelayControlCard';

describe('SmartPumpRelayControlCard Component', () => {
  const mockPumps = [
    {
      relayNodeCode: 'PMP-RLY-1001',
      stationName: 'Kura Solar-MPPT Submersible Pump Station #1',
      powerSourceType: 'SOLAR_PV_HYBRID_MPPT',
      pipeInnerDiameterMm: 110,
      filterDifferentialPressureBar: 0.24,
      boreholeDrawdownOk: true,
      contactorState: 'ENERGIZED_PUMPING',
      hydraulics: {
        flowRateM3PerHour: 68.0,
        totalFrictionHeadLossM: 5.14,
        totalDynamicHeadMeters: 50.15,
        electricalInputPowerKw: 13.79,
        recommendedSolarPvArrayKwp: 17.65,
        pumpingDurationHours: 9.41,
        totalEnergyKwh: 129.8,
        dieselFuelCostSavedNgn: 49064,
      },
    },
  ];

  test('renders Hazen-Williams hydraulics and dispatches contactor relay commands', () => {
    const onDispatchRelayCommand = jest.fn();
    const onOpenManualOverrideModal = jest.fn();

    render(
      <SmartPumpRelayControlCard
        pumps={mockPumps}
        selectedPump={mockPumps[0]}
        onDispatchRelayCommand={onDispatchRelayCommand}
        onOpenManualOverrideModal={onOpenManualOverrideModal}
      />
    );

    expect(
      screen.getByTestId('smart-pump-relay-control-card')
    ).toBeInTheDocument();
    expect(screen.getByTestId('pump-flow-rate-readout')).toHaveTextContent('68 m³/h');
    expect(screen.getByTestId('pump-friction-loss-readout')).toHaveTextContent('5.14 m');

    fireEvent.click(screen.getByTestId('energize-pump-relay-btn'));
    expect(onDispatchRelayCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        relayNodeCode: 'PMP-RLY-1001',
        commandAction: 'ENERGIZE_PUMP',
      })
    );

    fireEvent.click(screen.getByTestId('open-manual-valve-override-btn'));
    expect(onOpenManualOverrideModal).toHaveBeenCalledTimes(1);
  });
});
