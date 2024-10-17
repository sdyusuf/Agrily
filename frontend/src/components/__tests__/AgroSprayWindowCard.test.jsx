import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AgroSprayWindowCard from '../AgroSprayWindowCard';

describe('AgroSprayWindowCard Component', () => {
  const mockSprayPlan = {
    totalHoursEvaluated: 24,
    optimalHoursCount: 8,
    marginalHoursCount: 5,
    lockoutHoursCount: 11,
    recommendedWindow: {
      startTimestamp: '2024-10-14T06:00:00Z',
      endTimestamp: '2024-10-14T08:00:00Z',
      durationHours: 3,
      averageSuitabilityScore: 95,
      meanDeltaTCelsius: 4.9,
      meanWindSpeedKmh: 7.4,
      nozzleRecommendation: 'Standard Flat-Fan or Medium VMD (250–350 µm) at 2.5 bar'
    },
    hourlyWindows: [
      {
        observationTimestamp: '2024-10-14T06:00:00Z',
        airTempCelsius: 24.0,
        wetBulbCelsius: 19.2,
        deltaTCelsius: 4.8,
        windSpeedKmh: 7.2,
        windGustKmh: 9.5,
        precipitationMm: 0,
        upcoming3hRainMm: 0,
        status: 'Optimal Window',
        suitabilityScore: 95,
        colorToken: 'emerald',
        nozzleGuidance: 'Standard Flat-Fan or Medium VMD (250–350 µm) at 2.5 bar',
        limitingFactors: []
      },
      {
        observationTimestamp: '2024-10-14T14:00:00Z',
        airTempCelsius: 37.5,
        wetBulbCelsius: 24.0,
        deltaTCelsius: 13.5,
        windSpeedKmh: 19.4,
        windGustKmh: 26.0,
        precipitationMm: 0,
        upcoming3hRainMm: 0,
        status: 'High Drift Risk',
        suitabilityScore: 22,
        colorToken: 'danger',
        nozzleGuidance: 'LOCKOUT: Wind exceeds 15 km/h safe drift ceiling',
        limitingFactors: ['Wind speed 19.4 km/h', 'High Delta-T (13.5°C)']
      }
    ]
  };

  test('renders recommended 3-hour boom block and hourly spray slots', () => {
    render(<AgroSprayWindowCard sprayPlan={mockSprayPlan} />);
    expect(screen.getByTestId('agro-spray-window-card')).toBeInTheDocument();
    expect(screen.getByTestId('recommended-spray-banner')).toBeInTheDocument();
    expect(screen.getByText(/Score 95\/100/i)).toBeInTheDocument();
  });

  test('selects an hourly slot and displays limiting factors when present', () => {
    render(<AgroSprayWindowCard sprayPlan={mockSprayPlan} />);
    const slot0 = screen.getByTestId('spray-slot-0');
    fireEvent.click(slot0);
    expect(screen.getByText(/Optimal Window \(95\/100\)/i)).toBeInTheDocument();

    const slot1 = screen.getByTestId('spray-slot-1');
    fireEvent.click(slot1);
    expect(screen.getByTestId('spray-limiting-factors')).toBeInTheDocument();
    expect(screen.getByText(/Wind speed 19.4 km\/h/i)).toBeInTheDocument();
  });
});
