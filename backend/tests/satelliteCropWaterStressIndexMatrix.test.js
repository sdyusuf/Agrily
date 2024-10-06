/**
 * ==============================================================================
 * 🛰️ SATELLITE CROP WATER STRESS INDEX (CWSI) TEST MATRIX
 * ==============================================================================
 * 
 * Verifies:
 * 1. Vapor Pressure Deficit (VPD) Psychrometric Calculations:
 *    - Tetens saturation vapor pressure equation.
 *    - Relative humidity vapor deficit derivation in kPa.
 * 2. Non-Water-Stressed Baseline (NWSB) Derivations:
 *    - Slopes and intercepts for 10 staple commodities (Maize, Rice, Cassava, Yam, etc.).
 * 3. Jackson et al. (1981) CWSI Formulation:
 *    - Boundary verification: fully transpiring wet edge vs non-transpiring dry edge.
 * 4. Irrigation Dispatch Logic:
 *    - Automated relay triggers when CWSI breaches crop-specific thresholds.
 * 
 * @module tests/satelliteCropWaterStressIndexMatrix.test
 * ==============================================================================
 */

'use strict';

const assert = require('assert');
const {
  satelliteCropWaterStressIndexService,
  CROP_CWSI_BASELINES
} = require('../services/satelliteCropWaterStressIndexService');

let passed = 0;
let failed = 0;

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function runSuite() {
  console.log('\n🛰️ Starting Satellite Crop Water Stress Index (CWSI) Matrix Tests...\n');

  // Test 1: Saturation vapor pressure
  await runTest('calculateSaturationVaporPressure should compute accurate psychrometric vapor pressures', async () => {
    // At 20°C, e_s ~ 2.338 kPa
    const es20 = satelliteCropWaterStressIndexService.calculateSaturationVaporPressure(20.0);
    assert.ok(Math.abs(es20 - 2.338) < 0.05, `e_s at 20C (${es20}) should be ~2.338 kPa`);

    // At 30°C, e_s ~ 4.246 kPa
    const es30 = satelliteCropWaterStressIndexService.calculateSaturationVaporPressure(30.0);
    assert.ok(Math.abs(es30 - 4.246) < 0.05, `e_s at 30C (${es30}) should be ~4.246 kPa`);
  });

  // Test 2: Vapor Pressure Deficit (VPD)
  await runTest('calculateVaporPressureDeficit should scale with relative humidity', async () => {
    // Air temp 32°C, RH = 50%
    const vpd = satelliteCropWaterStressIndexService.calculateVaporPressureDeficit(32.0, 50.0);
    assert.ok(vpd > 2.0 && vpd < 3.0, `VPD (${vpd}) should be ~2.38 kPa`);

    // At 100% RH (saturated), VPD should be 0.0 kPa
    const vpdSaturated = satelliteCropWaterStressIndexService.calculateVaporPressureDeficit(30.0, 100.0);
    assert.strictEqual(vpdSaturated, 0.0);
  });

  // Test 3: Baselines for 10 crops
  await runTest('CROP_CWSI_BASELINES should define empirical parameters for all 10 staple crops', async () => {
    const crops = [
      'MAIZE', 'RICE', 'CASSAVA', 'YAM', 'SORGHUM',
      'MILLET', 'COWPEA', 'SOYBEAN', 'GROUNDNUT', 'OIL_PALM'
    ];

    for (const cropKey of crops) {
      const b = CROP_CWSI_BASELINES[cropKey];
      assert.ok(b, `Baseline for ${cropKey} must exist`);
      assert.ok(b.nwsbInterceptA > 1.0, `NWSB intercept for ${cropKey} must be > 1.0`);
      assert.ok(b.nwsbSlopeB > 1.0, `NWSB slope for ${cropKey} must be > 1.0`);
      assert.ok(b.upperBaselineDeltaT > 3.0, `Upper baseline for ${cropKey} must be > 3.0`);
      assert.ok(b.stressThresholdTrigger >= 0.30 && b.stressThresholdTrigger <= 0.70, `Trigger for ${cropKey} must be valid`);
      assert.ok(Array.isArray(b.criticalPhenologyStages) && b.criticalPhenologyStages.length > 0);
    }
  });

  // Test 4: Fully hydrated canopy (CWSI near 0)
  await runTest('evaluateCropWaterStress should return HYDRATED when canopy is transpirational and cool', async () => {
    // Air temp 30°C, RH 45% -> VPD ~2.34 kPa -> lower baseline for maize = 1.85 - 1.95 * 2.34 = -2.71°C
    // If canopy is cool at 27.5°C (Tc - Ta = -2.5°C), CWSI should be very low
    const result = satelliteCropWaterStressIndexService.evaluateCropWaterStress({
      canopyTempCelsius: 27.5,
      airTempCelsius: 30.0,
      relativeHumidityPct: 45.0,
      cropKey: 'MAIZE'
    });

    assert.strictEqual(result.cropKey, 'MAIZE');
    assert.ok(result.cwsi <= 0.20, `CWSI (${result.cwsi}) should be <= 0.20`);
    assert.strictEqual(result.stressTriage, 'HYDRATED');
    assert.strictEqual(result.isIrrigationRequired, false);
  });

  // Test 5: Severe water stress and irrigation triggering
  await runTest('evaluateCropWaterStress should trigger irrigation when canopy temperature is elevated', async () => {
    // Canopy hotter than ambient air (stomatal closure, no evaporative cooling)
    // Tc = 34°C, Ta = 30°C -> Tc - Ta = +4.0°C
    const result = satelliteCropWaterStressIndexService.evaluateCropWaterStress({
      canopyTempCelsius: 34.0,
      airTempCelsius: 30.0,
      relativeHumidityPct: 40.0,
      cropKey: 'MAIZE'
    });

    assert.ok(result.cwsi > 0.60, `CWSI (${result.cwsi}) should exceed 0.60 under severe stress`);
    assert.strictEqual(result.isIrrigationRequired, true);
    assert.ok(['SEVERE_STRESS', 'ACUTE_DESICCATION'].includes(result.stressTriage));
    assert.ok(result.actionRecommendation.includes('irrigation'));
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Fatal suite failure:', err);
  process.exit(1);
});
