/**
 * ==============================================================================
 * AGRILY BACKEND TEST SUITE - CROP YIELD LOSS & ECONOMIC VALUATION ENGINE
 * ==============================================================================
 * 
 * Verifies:
 * 1. Benchmark yield and farmgate pricing retrieval for 10 Nigerian commodities.
 * 2. Physiological growth stage multiplier impact on projected loss percentage.
 * 3. Tonnage and Naira financial loss calculation.
 * 4. Curative intervention scenario analysis and farmer ROI calculation.
 * 
 * @module tests/cropYieldLossEstimationModel.test
 */

'use strict';

const assert = require('assert');
const {
  CropYieldLossEstimationModel,
  CROP_PRODUCTION_BENCHMARKS,
  STAGE_MULTIPLIERS
} = require('../services/cropYieldLossEstimationModel');

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
  console.log('\n🧪 Starting Crop Yield Loss Estimation Model Tests...\n');

  // Test 1: Benchmark retrieval
  await runTest('getCropBenchmark should retrieve calibrated parameters for all 10 commodities', async () => {
    const crops = ['TOMATO', 'CASSAVA', 'MAIZE', 'YAM', 'COCOA', 'RICE', 'SORGHUM', 'COWPEA', 'PEPPER', 'OIL_PALM'];
    crops.forEach((c) => {
      const bm = CropYieldLossEstimationModel.getCropBenchmark(c);
      assert.ok(bm, `Benchmark must exist for ${c}`);
      assert.ok(bm.averageYieldTonsPerHa > 0);
      assert.ok(bm.farmgatePricePerTonNGN > 0);
    });
  });

  // Test 2: Flowering stage high vulnerability vs harvest-ready
  await runTest('estimateYieldLoss should calculate higher loss during flowering than at maturity', async () => {
    const floweringEst = CropYieldLossEstimationModel.estimateYieldLoss({
      cropName: 'Tomato',
      acreageHectares: 2.0,
      leafLesionCoveragePct: 30,
      growthStage: 'FLOWERING_POLLINATION'
    });

    const maturityEst = CropYieldLossEstimationModel.estimateYieldLoss({
      cropName: 'Tomato',
      acreageHectares: 2.0,
      leafLesionCoveragePct: 30,
      growthStage: 'MATURITY_HARVEST_READY'
    });

    assert.ok(
      floweringEst.uncontrolledOutbreakImpact.projectedLossPercentage >
      maturityEst.uncontrolledOutbreakImpact.projectedLossPercentage,
      'Flowering stage must suffer greater loss percentage than maturity'
    );
  });

  // Test 3: Economic valuation and ROI computation
  await runTest('estimateYieldLoss should calculate positive net savings and high ROI for high-value crops', async () => {
    const cocoaEst = CropYieldLossEstimationModel.estimateYieldLoss({
      cropName: 'COCOA',
      acreageHectares: 5.0,
      leafLesionCoveragePct: 40,
      growthStage: 'FLOWERING_POLLINATION',
      sprayInterventionCostPerHa: 50000 // ₦250k total cost
    });

    assert.ok(cocoaEst.uncontrolledOutbreakImpact.projectedFinancialLossNGN > 1000000, 'Cocoa loss must exceed ₦1M');
    assert.ok(cocoaEst.curativeInterventionScenario.monetaryValueSavedNGN > 1000000);
    assert.ok(cocoaEst.curativeInterventionScenario.netFarmerSavingsNGN > 0);
    assert.strictEqual(cocoaEst.actionRecommendation, 'IMMEDIATE_TREATMENT_MANDATED_HIGH_ROI');
  });

  // Test 4: Zero lesion healthy crop boundary
  await runTest('estimateYieldLoss should project 0% loss for healthy leaves', async () => {
    const healthyEst = CropYieldLossEstimationModel.estimateYieldLoss({
      cropName: 'RICE',
      acreageHectares: 10.0,
      leafLesionCoveragePct: 0.0,
      growthStage: 'TILLERING'
    });

    assert.strictEqual(healthyEst.uncontrolledOutbreakImpact.projectedLossPercentage, 0);
    assert.strictEqual(healthyEst.uncontrolledOutbreakImpact.projectedLostTonnage, 0);
    assert.strictEqual(healthyEst.uncontrolledOutbreakImpact.projectedFinancialLossNGN, 0);
  });

  console.log(`\n🎉 Crop Yield Loss Model Tests: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

runSuite().catch((err) => {
  console.error('Yield Loss Model test runner error:', err);
  process.exit(1);
});
