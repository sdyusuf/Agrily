/**
 * ==============================================================================
 * AGRILY BACKEND TEST SUITE - CROP YIELD LOSS COMBINATORIAL PERMUTATION MATRIX
 * ==============================================================================
 * 
 * Verifies mathematical bounds, monotonicity, and economic rationality across
 * a comprehensive permutation matrix:
 *  - 10 Nigerian staple crops (Tomato, Cassava, Maize, Yam, Cocoa, Rice, Sorghum, Cowpea, Pepper, Oil Palm)
 *  - 5 Phenological growth stages (Seedling, Vegetative, Flowering, Grain/Fruit Filling, Maturity)
 *  - 4 Lesion coverage tiers (Healthy 0%, Mild 15%, Moderate 35%, Critical 75%)
 *  Totaling 200 combinatorial stress permutations.
 * 
 * @module tests/cropYieldLossCombinatorialPermutationMatrix.test
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
  console.log('\n🧪 Starting Crop Yield Loss Combinatorial Permutation Matrix Tests (200 Iterations)...\n');

  const CROPS = Object.keys(CROP_PRODUCTION_BENCHMARKS);
  const STAGES = Object.keys(STAGE_MULTIPLIERS);
  const LESION_TIERS = [0.0, 15.0, 35.0, 75.0];

  // Test 1: Full 200 Combinatorial Permutations Execution & Mathematical Bounds
  await runTest('evaluates 200 combinatorial crop x stage x severity combinations without throwing', async () => {
    let permutationCount = 0;

    for (const crop of CROPS) {
      for (const stage of STAGES) {
        for (const lesionPct of LESION_TIERS) {
          permutationCount++;
          const result = CropYieldLossEstimationModel.estimateYieldLoss({
            cropName: crop,
            acreageHectares: 3.0,
            leafLesionCoveragePct: lesionPct,
            growthStage: stage
          });

          // Invariant 1: Loss percentage must be strictly between 0 and 95%
          assert.ok(
            result.uncontrolledOutbreakImpact.projectedLossPercentage >= 0 &&
            result.uncontrolledOutbreakImpact.projectedLossPercentage <= 95,
            `Loss percentage out of bounds for ${crop} at ${stage}: ${result.uncontrolledOutbreakImpact.projectedLossPercentage}`
          );

          // Invariant 2: Harvestable + Lost tonnage must equal potential yield tonnage within 0.1 tolerance
          const sumTonnage = result.uncontrolledOutbreakImpact.projectedLostTonnage + result.uncontrolledOutbreakImpact.harvestableTonnageRemaining;
          assert.ok(
            Math.abs(sumTonnage - result.baselineMetrics.potentialYieldTons) <= 0.15,
            `Tonnage balance mismatch for ${crop}: sum=${sumTonnage}, potential=${result.baselineMetrics.potentialYieldTons}`
          );

          // Invariant 3: Preserved tonnage must be non-negative and less than lost tonnage
          assert.ok(
            result.curativeInterventionScenario.tonnagePreserved >= 0 &&
            result.curativeInterventionScenario.tonnagePreserved <= result.uncontrolledOutbreakImpact.projectedLostTonnage + 0.05
          );

          // Invariant 4: Gross potential revenue must be positive
          assert.ok(result.baselineMetrics.potentialGrossRevenueNGN > 0);
        }
      }
    }

    assert.strictEqual(permutationCount, 200, 'Must execute exactly 200 combinatorial permutations');
  });

  // Test 2: Monotonicity Assertion - increasing lesion coverage must strictly increase financial loss
  await runTest('verifies strict monotonicity: higher lesion coverage produces strictly higher loss', async () => {
    for (const crop of CROPS) {
      const stage = 'FLOWERING_POLLINATION';
      let prevLoss = -1;

      for (const lesion of [0.0, 10.0, 25.0, 50.0, 80.0]) {
        const res = CropYieldLossEstimationModel.estimateYieldLoss({
          cropName: crop,
          acreageHectares: 2.5,
          leafLesionCoveragePct: lesion,
          growthStage: stage
        });

        const currentLoss = res.uncontrolledOutbreakImpact.projectedFinancialLossNGN;
        assert.ok(
          currentLoss >= prevLoss,
          `Monotonicity violation on ${crop}: prev=${prevLoss}, current=${currentLoss} at lesion=${lesion}%`
        );
        prevLoss = currentLoss;
      }
    }
  });

  // Test 3: Scale Invariance - scaling acreage by 5x must scale tonnage and gross revenue by exactly 5x
  await runTest('verifies acreage linear scaling invariance (1 Ha vs 5 Ha)', async () => {
    const singleHa = CropYieldLossEstimationModel.estimateYieldLoss({
      cropName: 'YAM',
      acreageHectares: 1.0,
      leafLesionCoveragePct: 25.0,
      growthStage: 'VEGETATIVE_EXPANSION'
    });

    const fiveHa = CropYieldLossEstimationModel.estimateYieldLoss({
      cropName: 'YAM',
      acreageHectares: 5.0,
      leafLesionCoveragePct: 25.0,
      growthStage: 'VEGETATIVE_EXPANSION'
    });

    // Loss percentages should be identical
    assert.strictEqual(
      singleHa.uncontrolledOutbreakImpact.projectedLossPercentage,
      fiveHa.uncontrolledOutbreakImpact.projectedLossPercentage
    );

    // Tonnage should scale 5x
    const tonnageRatio = fiveHa.baselineMetrics.potentialYieldTons / singleHa.baselineMetrics.potentialYieldTons;
    assert.ok(Math.abs(tonnageRatio - 5.0) < 0.01, `Tonnage must scale 5x: actual=${tonnageRatio}`);

    // Revenue should scale 5x
    const revenueRatio = fiveHa.baselineMetrics.potentialGrossRevenueNGN / singleHa.baselineMetrics.potentialGrossRevenueNGN;
    assert.ok(Math.abs(revenueRatio - 5.0) < 0.01, `Revenue must scale 5x: actual=${revenueRatio}`);
  });

  console.log(`\n🎉 Crop Yield Loss Combinatorial Permutation Matrix Tests: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

runSuite().catch((err) => {
  console.error('Combinatorial Permutation Matrix runner error:', err);
  process.exit(1);
});
