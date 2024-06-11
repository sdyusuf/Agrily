import React from 'react';
import { render, screen } from '@testing-library/react';
import ColdChainGauge from './ColdChainGauge';

describe('ColdChainGauge Component Unit Tests', () => {
  test('renders temperature gauge with safe status when within target range', () => {
    render(
      <ColdChainGauge
        type="temperature"
        title="Reefer Chilled Core"
        currentValue={2.2}
        unit="°C"
        targetRange={{ min: 0.5, max: 4.0, optimal: 2.0 }}
        podId="POD-REEFER-01"
        isDoorOpen={false}
        batteryPercent={98}
      />
    );

    expect(screen.getByTestId('cold-chain-gauge-temperature')).toBeInTheDocument();
    expect(screen.getByText('Reefer Chilled Core')).toBeInTheDocument();
    expect(screen.getByTestId('gauge-val-temperature')).toHaveTextContent('2.2');
    expect(screen.getByTestId('gauge-status-temperature')).toHaveTextContent(/Optimal Cold Chain/i);
    expect(screen.getByText(/Sealed/i)).toBeInTheDocument();
    expect(screen.getByText(/98%/i)).toBeInTheDocument();
  });

  test('displays warning when value is above maximum limit', () => {
    render(
      <ColdChainGauge
        type="temperature"
        currentValue={5.5}
        targetRange={{ min: 0.5, max: 4.0, optimal: 2.0 }}
      />
    );

    expect(screen.getByTestId('gauge-val-temperature')).toHaveTextContent('5.5');
    expect(screen.getByTestId('gauge-status-temperature')).toHaveTextContent(/Above Target Zone/i);
  });

  test('displays critical excursion when temperature spikes significantly above limits', () => {
    render(
      <ColdChainGauge
        type="temperature"
        currentValue={9.8}
        targetRange={{ min: 0.5, max: 4.0, optimal: 2.0 }}
        isDoorOpen={true}
      />
    );

    expect(screen.getByTestId('gauge-val-temperature')).toHaveTextContent('9.8');
    expect(screen.getByTestId('gauge-status-temperature')).toHaveTextContent(/Critical High Excursion/i);
    expect(screen.getByText(/Open \(Ajar\)/i)).toBeInTheDocument();
  });

  test('renders humidity gauge with relative percentage dial', () => {
    render(
      <ColdChainGauge
        type="humidity"
        title="Relative Cargo Humidity"
        currentValue={88}
        unit="%"
        targetRange={{ min: 80, max: 95, optimal: 88 }}
        podId="POD-HUM-02"
      />
    );

    expect(screen.getByTestId('cold-chain-gauge-humidity')).toBeInTheDocument();
    expect(screen.getByTestId('gauge-val-humidity')).toHaveTextContent('88');
    expect(screen.getByTestId('gauge-status-humidity')).toHaveTextContent(/Optimal Cold Chain/i);
  });

  test('handles missing or null props gracefully without crashing', () => {
    render(<ColdChainGauge currentValue={null} targetRange={null} />);
    expect(screen.getByTestId('gauge-val-temperature')).toHaveTextContent('0');
  });
});
