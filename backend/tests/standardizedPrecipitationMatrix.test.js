/**
 * ==============================================================================
 * 🧪 SPRINT 20 UNIT TESTS: SPI DROUGHT, HARMATTAN AEROSOL & FROST THERMODYNAMICS
 * ==============================================================================
 */

const assert = require('assert');
const {
  classifyWmoDroughtIndex,
  computeStandardizedPrecipitationIndex
} = require('../services/standardizedPrecipitationEngine');
const {
  evaluateHarmattanAerosolImpact,
  calculateFrostSprinklerThermodynamics
} = require('../services/harmattanParticulateThermalEngine');

console.log('🧪 Starting SPI Drought, Harmattan Aerosol & Frost Thermodynamics Tests...');

// 1. WMO SPI Classification & Multi-Timescale Drought Trigger
{
  const severeDry = computeStandardizedPrecipitationIndex({
    agroEcologicalZone: 'Sudan Savannah',
    timescaleMonths: 3,
    observedRainfallMm: 65.0, // Norm for 3 months is 234mm
    observedEt0Mm: 540.0
  });

  assert.ok(severeDry.spiScore <= -1.5, `Expected SPI <= -1.5, got ${severeDry.spiScore}`);
  assert.ok(severeDry.speiScore <= -1.5, `Expected SPEI <= -1.5, got ${severeDry.speiScore}`);
  assert.strictEqual(severeDry.isParametricDroughtTriggered, true);

  const normalWet = classifyWmoDroughtIndex(0.25);
  assert.strictEqual(normalWet.severityCode, 'NORMAL');
  assert.strictEqual(normalWet.droughtTrigger, false);
  console.log('  ✓ Standardized Precipitation Index (SPI/SPEI) accurately classifies multi-month drought deficits');
}

// 2. Harmattan Aerosol Optical Depth (AOD) & PAR Dimming
{
  const dustStorm = evaluateHarmattanAerosolImpact({
    visibilityKm: 1.5,
    relativeHumidityPct: 16,
    windSpeedKmh: 22.0,
    clearSkySolarIrradianceWm2: 850
  });

  assert.ok(dustStorm.aerosolOpticalDepth550nm > 2.0);
  assert.strictEqual(dustStorm.plumeSeverity, 'Severe Harmattan Dust Storm');
  assert.ok(dustStorm.parAttenuationLossPct > 35.0);
  assert.strictEqual(dustStorm.isOrchardFlowerAbortionRisk, true);
  console.log('  ✓ Harmattan aerosol engine computes Koschmieder AOD_550nm, PM10, and PAR dimming');
}

// 3. Canopy Frost Protection Sprinkler Latent Heat Balance
{
  const freezeProtection = calculateFrostSprinklerThermodynamics({
    canopyTempCelsius: -2.4,
    windSpeedKmh: 4.0,
    relativeHumidityPct: 50,
    areaHectares: 10.0
  });

  assert.strictEqual(freezeProtection.isProtectionRequired, true);
  assert.ok(freezeProtection.recommendedApplicationRateMmHr >= 2.2);
  assert.ok(freezeProtection.requiredPumpFlowLitersPerMinute >= 3500);
  assert.ok(freezeProtection.latentHeatReleasedKwPerHectare >= 2000);

  const warmNight = calculateFrostSprinklerThermodynamics({
    canopyTempCelsius: 8.5,
    windSpeedKmh: 5.0,
    relativeHumidityPct: 70
  });
  assert.strictEqual(warmNight.isProtectionRequired, false);
  assert.strictEqual(warmNight.recommendedApplicationRateMmHr, 0);
  console.log('  ✓ Frost sprinkler thermodynamics calculates latent heat of fusion and pump flow rates');
}

console.log('✅ All SPI Drought, Harmattan Aerosol & Frost Thermodynamics tests passed!');
