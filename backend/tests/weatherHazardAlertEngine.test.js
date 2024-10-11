/**
 * ==============================================================================
 * 🧪 SPRINT 20 UNIT TESTS: WEATHER HAZARD ALERT ENGINE & TIMELINE SCANNER
 * ==============================================================================
 */

const assert = require('assert');
const {
  evaluateMicroclimateHazards,
  analyzeForecastHazardTimeline
} = require('../services/weatherHazardAlertEngine');

console.log('🧪 Starting Weather Hazard Alert Engine Unit Tests...');

// 1. Radiative Frost Emergency Detection
{
  const frostResult = evaluateMicroclimateHazards(
    {
      stationCode: 'AWS-JOS-1042',
      airTempCelsius: 2.2,
      minTempCelsius: 1.4,
      maxTempCelsius: 16.0,
      relativeHumidityPct: 48,
      windSpeedKmh: 3.0,
      cloudCoverPct: 8
    },
    {
      cropType: 'Potato',
      phenologyStage: 'Vegetative'
    }
  );

  assert.strictEqual(frostResult.overallRiskLevel, 'Critical Emergency');
  assert.ok(frostResult.alerts.some((a) => a.hazardType === 'RADIATIVE_FROST'));
  const frostAlert = frostResult.alerts.find((a) => a.hazardType === 'RADIATIVE_FROST');
  assert.ok(frostAlert.mitigationActions.length >= 2);
  console.log('  ✓ Detects nocturnal radiative frost emergency and generates overhead sprinkler advisories');
}

// 2. Heatwave, Harmattan Desiccation & Dry Spell Multi-Hazard Detection
{
  const heatHarmattanResult = evaluateMicroclimateHazards(
    {
      stationCode: 'AWS-SOK-3011',
      airTempCelsius: 40.2,
      minTempCelsius: 26.5,
      maxTempCelsius: 41.0,
      relativeHumidityPct: 16,
      windSpeedKmh: 22.0,
      harmattanDustVisibilityKm: 1.5,
      consecutiveDryDays: 19,
      soilMoistureVolumetricPct: 8.5
    },
    {
      cropType: 'Maize',
      phenologyStage: 'Flowering / Anthesis'
    }
  );

  assert.strictEqual(heatHarmattanResult.overallRiskLevel, 'Critical Emergency');
  const hazardTypes = heatHarmattanResult.alerts.map((a) => a.hazardType);
  assert.ok(hazardTypes.includes('HEATWAVE_POLLEN_STERILITY'));
  assert.ok(hazardTypes.includes('HARMATTAN_DESICCATION'));
  assert.ok(hazardTypes.includes('DROUGHT_DEFICIT'));
  console.log('  ✓ Detects compounded heatwave pollen sterility, Harmattan desiccation, and drought deficit');
}

// 3. Convective Flash Flood & Fungal Blight Infection Window
{
  const floodBlightResult = evaluateMicroclimateHazards(
    {
      stationCode: 'AWS-BEN-2090',
      airTempCelsius: 23.5,
      relativeHumidityPct: 92,
      windSpeedKmh: 14.0,
      precipitationMm: 62.0,
      leafWetnessDurationHours: 14
    },
    {
      cropType: 'Tomato',
      phenologyStage: 'Fruit Set'
    }
  );

  const hazardTypes = floodBlightResult.alerts.map((a) => a.hazardType);
  assert.ok(hazardTypes.includes('FLASH_FLOOD_WATERLOGGING'));
  assert.ok(hazardTypes.includes('FUNGAL_BLIGHT_WETNESS'));
  console.log('  ✓ Detects convective flash flood downpour and fungal late-blight leaf wetness window');
}

// 4. Multi-Frame Forecast Timeline Aggregation
{
  const frames = [
    {
      observationTimestamp: '2024-10-12T03:00:00Z',
      airTempCelsius: 2.5,
      minTempCelsius: 1.8,
      relativeHumidityPct: 55,
      windSpeedKmh: 3.0,
      cloudCoverPct: 10,
      precipitationMm: 0
    },
    {
      observationTimestamp: '2024-10-12T14:00:00Z',
      airTempCelsius: 38.0,
      maxTempCelsius: 38.5,
      relativeHumidityPct: 24,
      windSpeedKmh: 12.0,
      precipitationMm: 0
    },
    {
      observationTimestamp: '2024-10-13T17:00:00Z',
      airTempCelsius: 24.0,
      relativeHumidityPct: 88,
      windSpeedKmh: 16.0,
      precipitationMm: 34.5
    }
  ];

  const timelineReport = analyzeForecastHazardTimeline(frames, { cropType: 'Tomato' });
  assert.strictEqual(timelineReport.totalFramesAnalyzed, 3);
  assert.ok(timelineReport.hazardWindowsCount >= 3);
  assert.strictEqual(timelineReport.cumulativeRainfallMm, 34.5);
  assert.ok(timelineReport.lowestCanopyTempCelsius < 1.0);
  assert.strictEqual(timelineReport.peakAirTempCelsius, 38.5);
  console.log('  ✓ Aggregates multi-frame forecast hazard windows, cumulative rainfall, and canopy extremes');
}

console.log('✅ All Weather Hazard Alert Engine tests passed!');
