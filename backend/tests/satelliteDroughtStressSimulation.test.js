/**
 * ==============================================================================
 * 🛰️ SATELLITE DROUGHT STRESS & MOISTURE DEFICIT SIMULATION TEST MATRIX
 * ==============================================================================
 * 
 * Verifies:
 * 1. Multi-Spectral Drought Indices:
 *    - Vegetation Condition Index (VCI) [Kogan 1990].
 *    - Temperature Condition Index (TCI) [Kogan 1995].
 *    - Composite Vegetation Health Index (VHI) [Kogan 2001].
 *    - Temperature Vegetation Dryness Index (TVDI) [Sandholt 2002] in LST-NDVI trapezoid space.
 *    - Crop Water Deficit Index (CWDI).
 * 2. Agro-Ecological Feature Spaces:
 *    - Sahel Savanna, Sudan Savanna, Guinea Savanna, Rainforest, Mangrove Swamp boundary configs.
 * 3. West African USDM-Equivalent Drought Tiers:
 *    - D_NORMAL (No Drought) -> D0 (Abnormally Dry) -> D1 (Moderate) -> D2 (Severe) -> D3 (Extreme) -> D4 (Exceptional).
 * 4. Agronomic Prescriptions & Crop Triage:
 *    - Irrigation rates, mulching depths, fertilizer withholding rules for Maize, Rice, Sorghum, Cassava.
 * 
 * @module tests/satelliteDroughtStressSimulation.test
 * ==============================================================================
 */

'use strict';

const assert = require('assert');
const {
  satelliteDroughtStressIndexService,
  DROUGHT_SEVERITY_TIERS,
  AGRO_ZONE_LST_FEATURE_SPACE
} = require('../services/satelliteDroughtStressIndexService');

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
  console.log('\n🛰️ Starting Satellite Drought Stress & Moisture Deficit Simulation Suite Tests...\n');

  // Test 1: VCI calculations
  await runTest('calculateVci should compute accurate historical percentile scaling', async () => {
    const vciMid = satelliteDroughtStressIndexService.calculateVci(0.50, 0.20, 0.80);
    assert.strictEqual(vciMid, 50.0);

    const vciMax = satelliteDroughtStressIndexService.calculateVci(0.80, 0.20, 0.80);
    assert.strictEqual(vciMax, 100.0);

    const vciMin = satelliteDroughtStressIndexService.calculateVci(0.20, 0.20, 0.80);
    assert.strictEqual(vciMin, 0.0);
  });

  // Test 2: VCI Clamping
  await runTest('calculateVci should clamp values safely to [0.0, 100.0]', async () => {
    assert.strictEqual(satelliteDroughtStressIndexService.calculateVci(0.10, 0.20, 0.80), 0.0);
    assert.strictEqual(satelliteDroughtStressIndexService.calculateVci(0.95, 0.20, 0.80), 100.0);
    assert.strictEqual(satelliteDroughtStressIndexService.calculateVci(0.40, 0.40, 0.40), 50.0);
  });

  // Test 3: TCI Inversion
  await runTest('calculateTci should invert thermal values so higher LST yields lower TCI', async () => {
    const tciHot = satelliteDroughtStressIndexService.calculateTci(35.0, 20.0, 40.0);
    assert.strictEqual(tciHot, 25.0);

    const tciCool = satelliteDroughtStressIndexService.calculateTci(24.0, 20.0, 40.0);
    assert.strictEqual(tciCool, 80.0);
  });

  // Test 4: VHI Combination
  await runTest('calculateVhi should compute composite biomass-thermal index with alpha weighting', async () => {
    const vhiBalanced = satelliteDroughtStressIndexService.calculateVhi(60.0, 40.0, 0.5);
    assert.strictEqual(vhiBalanced, 50.0);

    const vhiBiomassPriority = satelliteDroughtStressIndexService.calculateVhi(80.0, 20.0, 0.7);
    assert.strictEqual(vhiBiomassPriority, 62.0);
  });

  // Test 5: TVDI across all Nigerian agro-ecological zones
  await runTest('calculateTvdi should compute valid dryness indices across all 5 zones', async () => {
    const zones = ['SAHEL', 'SUDAN_SAVANNA', 'GUINEA_SAVANNA', 'RAINFOREST', 'MANGROVE_SWAMP'];

    for (const zoneKey of zones) {
      const tvdiResult = satelliteDroughtStressIndexService.calculateTvdi(0.45, 32.0, zoneKey);
      assert.ok(tvdiResult.tvdi >= 0.0 && tvdiResult.tvdi <= 1.0, `TVDI for ${zoneKey} must be in [0, 1]`);
      assert.ok(tvdiResult.lstDryBoundaryCelsius > tvdiResult.lstWetBoundaryCelsius, `Dry edge must exceed wet edge in ${zoneKey}`);
      assert.strictEqual(tvdiResult.moistureDeficitPct, Number((tvdiResult.tvdi * 100).toFixed(1)));
    }
  });

  // Test 6: USDM Drought Classification Tiers
  await runTest('classifyDroughtSeverity should map VHI to standard USDM severity tiers', async () => {
    const dNormal = satelliteDroughtStressIndexService.classifyDroughtSeverity(65.0, 'MAIZE');
    assert.strictEqual(dNormal.droughtTier, 'D_NORMAL');
    assert.strictEqual(dNormal.riskLevel, 'OPTIMAL');

    const d0 = satelliteDroughtStressIndexService.classifyDroughtSeverity(40.0, 'SORGHUM');
    assert.strictEqual(d0.droughtTier, 'D0');
    assert.strictEqual(d0.riskLevel, 'WATCH');
    assert.ok(d0.advisory.irrigationPrescription.includes('15-20 mm'));

    const d1 = satelliteDroughtStressIndexService.classifyDroughtSeverity(30.0, 'RICE');
    assert.strictEqual(d1.droughtTier, 'D1');
    assert.strictEqual(d1.riskLevel, 'WARNING');

    const d2 = satelliteDroughtStressIndexService.classifyDroughtSeverity(22.0, 'MAIZE');
    assert.strictEqual(d2.droughtTier, 'D2');
    assert.strictEqual(d2.riskLevel, 'CRITICAL');

    const d3 = satelliteDroughtStressIndexService.classifyDroughtSeverity(10.0, 'CASSAVA');
    assert.strictEqual(d3.droughtTier, 'D3');
    assert.strictEqual(d3.riskLevel, 'EMERGENCY');

    const d4 = satelliteDroughtStressIndexService.classifyDroughtSeverity(3.5, 'CASSAVA');
    assert.strictEqual(d4.droughtTier, 'D4');
    assert.strictEqual(d4.riskLevel, 'CATASTROPHIC');
  });

  // Test 7: End-to-End Parcel Drought Stress Evaluation
  await runTest('evaluateParcelDroughtStress should assemble a full multi-index diagnostic report', async () => {
    const report = satelliteDroughtStressIndexService.evaluateParcelDroughtStress({
      ndvi: 0.38,
      lstCelsius: 36.5,
      zoneKey: 'GUINEA_SAVANNA',
      cropType: 'MAIZE'
    });

    assert.strictEqual(report.cropType, 'MAIZE');
    assert.ok(report.agroEcologicalZone.includes('Guinea Savanna'));
    assert.ok(report.indices.vci !== undefined);
    assert.ok(report.indices.tci !== undefined);
    assert.ok(report.indices.vhi !== undefined);
    assert.ok(report.indices.tvdi !== undefined);
    assert.ok(report.indices.cwdi !== undefined);
    assert.ok(report.droughtClassification.advisory.irrigationPrescription);
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
