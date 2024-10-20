import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HyperlocalWeatherCockpit from '../HyperlocalWeatherCockpit';

// Mock Canvas 2D context for jsdom
HTMLCanvasElement.prototype.getContext = () => ({
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  beginPath: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn()
});

describe('HyperlocalWeatherCockpit Master Page Integration', () => {
  beforeEach(() => {
    global.fetch = jest.fn((url) => {
      if (url.includes('/api/weather/stations') && !url.includes('/telemetry')) {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              success: true,
              data: [
                {
                  _id: 's1',
                  stationCode: 'AWS-JOS-1042',
                  stationName: 'Jos Plateau Montane Observatory #4 (Vom Corridor)',
                  agroEcologicalZone: 'Mid-Altitude Montane',
                  primaryCropFocus: 'Potato',
                  elevationMeters: 1285,
                  operationalStatus: 'Online'
                },
                {
                  _id: 's2',
                  stationCode: 'AWS-KAN-2018',
                  stationName: 'Kano Kadawa Irrigation Valley Synoptic Node',
                  agroEcologicalZone: 'Sudan Savannah',
                  primaryCropFocus: 'Maize',
                  elevationMeters: 472,
                  operationalStatus: 'Online'
                }
              ]
            })
        });
      }

      if (url.includes('/telemetry')) {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              success: true,
              station: {
                stationCode: 'AWS-JOS-1042',
                stationName: 'Jos Plateau Montane Observatory #4 (Vom Corridor)',
                agroEcologicalZone: 'Mid-Altitude Montane',
                elevationMeters: 1285
              },
              currentObservation: {
                airTempCelsius: 13.5,
                minTempCelsius: 1.8,
                maxTempCelsius: 21.0,
                canopyTempCelsius: 0.9,
                relativeHumidityPct: 50,
                dewPointCelsius: 4.1,
                wetBulbCelsius: 9.0,
                deltaTCelsius: 4.5,
                vaporPressureDeficitKpa: 0.78,
                windSpeedKmh: 7.4,
                referenceEvapotranspirationMmDay: 4.1,
                cropEvapotranspirationEtcMmDay: 4.7,
                frostRiskProbabilityPct: 86,
                sprayWindowSuitability: 'Optimal Window'
              },
              hazardEvaluation: {
                overallRiskLevel: 'Critical Emergency',
                alerts: [
                  {
                    alertCode: 'ALT-FROST-AWS-JOS-1042',
                    hazardType: 'RADIATIVE_FROST',
                    severity: 'Critical Emergency',
                    headline: 'CRITICAL FREEZE: Canopy temp projected at 0.9°C',
                    cropImpact: 'Potato faces intracellular ice crystallization below 0.5°C.',
                    mitigationActions: ['Activate overhead micro-sprinkler frost protection.']
                  }
                ]
              },
              timelineSummary: {
                cumulativeRainfallMm: 14.2,
                cumulativeEtcMm: 31.8,
                moistureBalanceMm: -17.6,
                lowestCanopyTempCelsius: 0.9
              },
              sevenDayForecast: [
                {
                  observationTimestamp: '2024-10-14T12:00:00Z',
                  minTempCelsius: 1.8,
                  maxTempCelsius: 21.0,
                  referenceEvapotranspirationMmDay: 4.1,
                  cropEvapotranspirationEtcMmDay: 4.7,
                  precipitationMm: 0,
                  soilMoistureVolumetricPct: 24.5,
                  heatStressSeverity: 'Optimal'
                }
              ],
              sprayPlan: {
                optimalHoursCount: 9,
                marginalHoursCount: 5,
                lockoutHoursCount: 10,
                recommendedWindow: {
                  startTimestamp: '2024-10-14T06:00:00Z',
                  endTimestamp: '2024-10-14T08:00:00Z',
                  durationHours: 3,
                  averageSuitabilityScore: 95,
                  meanDeltaTCelsius: 4.6,
                  meanWindSpeedKmh: 7.2,
                  nozzleRecommendation: 'Standard Flat-Fan (250–350 µm)'
                },
                hourlyWindows: [
                  {
                    observationTimestamp: '2024-10-14T06:00:00Z',
                    airTempCelsius: 15.0,
                    wetBulbCelsius: 10.4,
                    deltaTCelsius: 4.6,
                    windSpeedKmh: 7.2,
                    windGustKmh: 9.5,
                    status: 'Optimal Window',
                    suitabilityScore: 95,
                    colorToken: 'emerald',
                    nozzleGuidance: 'Standard Flat-Fan (250–350 µm)',
                    limitingFactors: []
                  }
                ]
              },
              radarGrid: Array.from({ length: 64 }, (_, i) => ({
                cellId: `R${Math.floor(i / 8)}-C${i % 8}`,
                row: Math.floor(i / 8),
                col: i % 8,
                canopyTempCelsius: 1.2,
                precipIntensityMmHr: 0,
                windSpeedKmh: 7.4,
                windDirectionDegrees: 215,
                vpdKpa: 0.8,
                relativeHumidityPct: 55,
                cellHazardLabel: 'Frost Pocket'
              }))
            })
        });
      }

      if (url.includes('/api/weather/ingest')) {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              success: true,
              reading: { canopyTempCelsius: -0.4 }
            })
        });
      }

      return Promise.resolve({
        json: () => Promise.resolve({ success: true })
      });
    });
  });

  test('renders cockpit hero, 5 KPI cards, active frost alert, radar canvas, ET chart, and spray card', async () => {
    render(<HyperlocalWeatherCockpit />);

    expect(screen.getByTestId('hyperlocal-weather-cockpit')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-air-canopy-temp')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-fao56-et')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-vpd-humidity')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-delta-t-wind')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-frost-probability')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('microclimate-radar-card')).toBeInTheDocument();
      expect(screen.getByTestId('evapotranspiration-timeline-chart')).toBeInTheDocument();
      expect(screen.getByTestId('agro-spray-window-card')).toBeInTheDocument();
    });
  });

  test('opens alert subscription modal, saves preferences, and triggers frost simulation', async () => {
    render(<HyperlocalWeatherCockpit />);

    const openModalBtn = screen.getByTestId('open-subscription-modal-btn');
    fireEvent.click(openModalBtn);

    expect(screen.getByTestId('weather-subscription-modal')).toBeInTheDocument();

    const testPushBtn = screen.getByTestId('test-alert-dispatch-btn');
    fireEvent.click(testPushBtn);
    expect(screen.getByTestId('subscription-status-toast')).toBeInTheDocument();

    const closeBtn = screen.getByTestId('close-subscription-modal-btn');
    fireEvent.click(closeBtn);

    const simBtn = screen.getByTestId('simulate-frost-surge-btn');
    fireEvent.click(simBtn);

    await waitFor(() => {
      expect(screen.getByTestId('weather-ingestion-banner')).toBeInTheDocument();
    });
  });
});
