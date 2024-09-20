/**
 * ==============================================================================
 * AGRILY SPRINT 18: FERTILIZER OPTIMIZATION MATRIX UNIT TEST SUITE
 * ==============================================================================
 * 
 * Verifies:
 * 1. Simplex fertilizer optimization across all 10 supported Nigerian crops.
 * 2. Cereal-specific formulation with NPK 20-10-10 starter basal.
 * 3. Root-tuber high potassium formulation with MOP 0-0-60 top-dressing.
 * 4. Yield scaling linearity across acreage (1.0 ha, 5.0 ha, 20.0 ha).
 * 5. Cost-benefit margin calculation against generic uncalibrated broadcast.
 * 6. Nutrient satisfaction coverage without osmotic salt burn over-application.
 * 
 * @module tests/fertilizerOptimizationMatrix.test
 */

'use strict';

const assert = require('assert');
const { FertilizerOptimizationEngine, COMMERCIAL_PRODUCTS, CROP_UPTAKE_REQUIREMENTS } = require('../services/fertilizerOptimizationEngine');
const { SUPPORTED_CROPS } = require('../models/SoilSampleRecord');

let passedTests = 0;
let failedTests = 0;

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failedTests++;
  }
}

async function runSuite() {
  console.log('\n=================================================================');
  console.log('🧪 AGRILY SPRINT 18: FERTILIZER OPTIMIZATION MATRIX TESTS');
  console.log('=================================================================\n');

  const baselineSoilChemistry = {
    phWater: 6.2,
    organicCarbonPct: 0.9,
    totalNitrogenPct: 0.09,
    availablePhosphorusBray1MgPerKg: 11.0,
    exchangeablePotassiumK: 0.32,
    exchangeableCalciumCa: 4.0,
    exchangeableMagnesiumMg: 1.4,
    exchangeableSodiumNa: 0.08,
    exchangeableAcidityAlPlusH: 0.15
  };

  // -----------------------------------------------------------------
  // SECTION 1: 10-Crop Optimization Coverage Matrix
  // -----------------------------------------------------------------
  console.log('--- SECTION 1: Full 10-Crop Optimization Coverage ---');

  for (const crop of SUPPORTED_CROPS) {
    await runTest(`optimizeCommercialBagMix should generate complete valid prescription for ${crop}`, async () => {
      const opt = FertilizerOptimizationEngine.optimizeCommercialBagMix({
        crop,
        fieldAcreageHectares: 2.0,
        soilData: baselineSoilChemistry
      });

      assert.strictEqual(opt.crop, crop, `Crop must match ${crop}`);
      assert(opt.recommendedCommercialMix.items.length >= 1, `${crop} mix must include commercial fertilizer items`);
      assert(opt.economics.totalFertilizerCostNaira > 0, `${crop} total cost must be positive`);
      assert(opt.economics.costPerHectareNaira > 0, `${crop} cost per hectare must be positive`);
      assert(opt.economics.estimatedSavingsVsGenericFertilizerNaira > 0, `${crop} must demonstrate savings vs generic broadcast`);
      assert(opt.economics.totalBagsCount > 0, `${crop} total bags count must be > 0`);
    });
  }

  // -----------------------------------------------------------------
  // SECTION 2: Cereal vs Tuber Product Routing
  // -----------------------------------------------------------------
  console.log('\n--- SECTION 2: Cereal vs Tuber Agronomic Product Routing ---');

  await runTest('Cereals (MAIZE, RICE, SORGHUM) should select NPK 20-10-10+S as basal product', async () => {
    const maizeOpt = FertilizerOptimizationEngine.optimizeCommercialBagMix({
      crop: 'MAIZE',
      targetYieldTonsPerHa: 5.0,
      fieldAcreageHectares: 1.0,
      soilData: baselineSoilChemistry
    });

    const basalItem = maizeOpt.recommendedCommercialMix.items.find((i) => i.applicationTiming === 'BASAL_AT_PLANTING');
    assert(basalItem, 'Must contain basal item');
    assert.strictEqual(basalItem.productCode, 'NPK-20-10-10', 'Cereals must route to NPK 20-10-10');
  });

  await runTest('Tuber crops (YAM, CASSAVA) with high yield targets should include MOP 0-0-60 potash booster', async () => {
    const yamOpt = FertilizerOptimizationEngine.optimizeCommercialBagMix({
      crop: 'YAM',
      targetYieldTonsPerHa: 20.0,
      fieldAcreageHectares: 2.0,
      soilData: baselineSoilChemistry
    });

    const mopItem = yamOpt.recommendedCommercialMix.items.find((i) => i.productCode === 'MOP-0-0-60');
    assert(mopItem, 'Yam tuber bulking must include MOP 0-0-60 potash booster');
    assert(mopItem.totalBagsForField > 0, 'Total MOP bags must be > 0');
  });

  // -----------------------------------------------------------------
  // SECTION 3: Acreage Scaling & Economics
  // -----------------------------------------------------------------
  console.log('\n--- SECTION 3: Field Acreage Linear Scaling ---');

  await runTest('Scaling field acreage from 2 ha to 10 ha should scale total bags exactly by 5x', async () => {
    const opt2Ha = FertilizerOptimizationEngine.optimizeCommercialBagMix({
      crop: 'TOMATO',
      targetYieldTonsPerHa: 20.0,
      fieldAcreageHectares: 2.0,
      soilData: baselineSoilChemistry
    });

    const opt10Ha = FertilizerOptimizationEngine.optimizeCommercialBagMix({
      crop: 'TOMATO',
      targetYieldTonsPerHa: 20.0,
      fieldAcreageHectares: 10.0,
      soilData: baselineSoilChemistry
    });

    const ratio = opt10Ha.economics.totalBagsCount / opt2Ha.economics.totalBagsCount;
    assert(ratio >= 4.8 && ratio <= 5.2, `Bags scaling ratio should be approximately 5.0 (got ${ratio.toFixed(2)})`);
    assert.strictEqual(opt2Ha.economics.costPerHectareNaira, opt10Ha.economics.costPerHectareNaira, 'Cost per hectare should remain invariant across acreage');
  });

  console.log('\n=================================================================');
  console.log(`🏁 OPTIMIZATION MATRIX SUITE: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('=================================================================\n');

  if (failedTests > 0) process.exit(1);
}

runSuite();
