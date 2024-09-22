/**
 * ==============================================================================
 * AGRILY SPRINT 18 TEST SUITE - CROP NUTRIENT UPTAKE & FERTILITY ADVISORY
 * ==============================================================================
 * 
 * Tests the CropSpecificFertilityAdvisoryService:
 * 1. Phenological uptake curves across all 10 staples (Maize, Rice, Cassava, Yam,
 *    Tomato, Sorghum, Cowpea, Soybean, Millet, Groundnut).
 * 2. Stage-by-stage macro and micronutrient uptake partitioning summation checks.
 * 3. Visual deficiency symptom diagnostics (chlorosis, purpling, firing, blossom-end rot).
 * 4. Mobility in plant heuristics (mobile = lower leaves, immobile = upper leaves / fruits).
 * 5. Emergency foliar chelate rescue prescriptions and hectare dosage calculations.
 * 6. Critical nutrient removal and soil replacement balances.
 * 7. 100-permutation stress matrix testing across yields and acreage combinations.
 */

'use strict';

const assert = require('assert');
const {
  CropSpecificFertilityAdvisoryService,
  CROP_PHENOLOGY_NUTRIENT_CURVES,
  VISUAL_DEFICIENCY_SYMPTOM_CATALOG,
  CROP_REMOVAL_FACTORS
} = require('../services/cropSpecificFertilityAdvisoryService');

console.log('\n=================================================================');
console.log('🌾 AGRILY SPRINT 18: CROP NUTRIENT UPTAKE & ADVISORY TEST SUITE');
console.log('=================================================================\n');

let testsPassed = 0;
let testsFailed = 0;

function runTest(testName, fn) {
  try {
    fn();
    console.log(`  [PASS] ${testName}`);
    testsPassed++;
  } catch (err) {
    console.error(`  [FAIL] ${testName}: ${err.message}`);
    testsFailed++;
  }
}

// 1. All 10 Core Staple Crops Defined
runTest('All 10 Nigerian staple crops have comprehensive phenology curves defined', () => {
  const expectedCrops = ['MAIZE', 'RICE', 'CASSAVA', 'YAM', 'TOMATO', 'SORGHUM', 'COWPEA', 'SOYBEAN', 'MILLET', 'GROUNDNUT'];
  for (const c of expectedCrops) {
    const curve = CropSpecificFertilityAdvisoryService.getCropUptakeCurve(c);
    assert(curve.crop === c);
    assert(curve.lifeCycleDays > 0);
    assert(Array.isArray(curve.stages) && curve.stages.length >= 3);
  }
});

// 2. Stage Nutrient Partition Summation Validation
runTest('Stage nutrient partition fractions total ~100% for each macronutrient across life cycle', () => {
  const crops = Object.keys(CROP_PHENOLOGY_NUTRIENT_CURVES);
  for (const c of crops) {
    const curve = CROP_PHENOLOGY_NUTRIENT_CURVES[c];
    let sumN = 0;
    let sumP = 0;
    let sumK = 0;
    for (const stage of curve.stages) {
      sumN += stage.partitionPct.N || 0;
      sumP += stage.partitionPct.P2O5 || 0;
      sumK += stage.partitionPct.K2O || 0;
    }
    assert(sumN >= 95 && sumN <= 105, `Crop ${c} sumN must be ~100%, got ${sumN}`);
    assert(sumP >= 95 && sumP <= 105, `Crop ${c} sumP must be ~100%, got ${sumP}`);
    assert(sumK >= 95 && sumK <= 105, `Crop ${c} sumK must be ~100%, got ${sumK}`);
  }
});

// 3. Stage Key Retrieval
runTest('getCropUptakeCurve retrieves specific stage when stageKey is provided', () => {
  const stageData = CropSpecificFertilityAdvisoryService.getCropUptakeCurve('MAIZE', 'RAPID_VEGETATIVE');
  assert.strictEqual(stageData.crop, 'MAIZE');
  assert.strictEqual(stageData.selectedStage.stageKey, 'RAPID_VEGETATIVE');
  assert(stageData.selectedStage.advisory.includes('Urea'));
});

// 4. Visual Deficiency Diagnostics: Nitrogen Chlorosis on Lower Leaves
runTest('Visual diagnostic identifies Nitrogen deficiency for V-shaped yellowing on lower leaves', () => {
  const diag = CropSpecificFertilityAdvisoryService.diagnoseDeficiencySymptom(
    'MAIZE',
    ['v-shaped', 'yellowing', 'midrib', 'lower leaves'],
    'LOWER_OLD'
  );
  assert(diag.topDiagnosis !== null);
  assert.strictEqual(diag.topDiagnosis.deficiencyKey, 'NITROGEN_DEFICIENCY');
  assert.strictEqual(diag.topDiagnosis.element, 'N');
  assert.strictEqual(diag.topDiagnosis.mobilityInPlant, 'HIGHLY_MOBILE');
});

// 5. Visual Deficiency Diagnostics: Blossom-End Rot on Tomato
runTest('Visual diagnostic identifies Calcium deficiency for blossom-end rot on tomato fruits', () => {
  const diag = CropSpecificFertilityAdvisoryService.diagnoseDeficiencySymptom(
    'TOMATO',
    ['blossom-end', 'rot', 'black spot', 'fruit'],
    'FRUITS_BUDS'
  );
  assert(diag.topDiagnosis !== null);
  assert.strictEqual(diag.topDiagnosis.deficiencyKey, 'CALCIUM_DEFICIENCY');
  assert.strictEqual(diag.topDiagnosis.mobilityInPlant, 'IMMOBILE');
  assert(diag.topDiagnosis.rescueProtocol.product.includes('Calcium'));
});

// 6. Visual Deficiency Diagnostics: Zinc Deficiency in Maize White Bud
runTest('Visual diagnostic identifies Zinc deficiency for broad white bands on maize leaves', () => {
  const diag = CropSpecificFertilityAdvisoryService.diagnoseDeficiencySymptom(
    'MAIZE',
    ['white', 'band', 'bleached', 'internode'],
    'UPPER_YOUNG'
  );
  assert(diag.topDiagnosis !== null);
  assert.strictEqual(diag.topDiagnosis.deficiencyKey, 'ZINC_DEFICIENCY');
  assert.strictEqual(diag.topDiagnosis.element, 'Zn');
});

// 7. Visual Deficiency Diagnostics: Phosphorus Purpling
runTest('Visual diagnostic identifies Phosphorus deficiency for intense purpling anthocyanin tint', () => {
  const diag = CropSpecificFertilityAdvisoryService.diagnoseDeficiencySymptom(
    'SORGHUM',
    ['purple', 'anthocyanin', 'dark green', 'root stunt'],
    'LOWER_OLD'
  );
  assert(diag.topDiagnosis !== null);
  assert.strictEqual(diag.topDiagnosis.deficiencyKey, 'PHOSPHORUS_DEFICIENCY');
  assert.strictEqual(diag.topDiagnosis.element, 'P');
});

// 8. Emergency Foliar Chelate Rescue Protocol Formulation
runTest('formulateFoliarRescuePrescription computes correct product quantities for multi-hectare field', () => {
  const prescription = CropSpecificFertilityAdvisoryService.formulateFoliarRescuePrescription(
    'TOMATO',
    ['CALCIUM_DEFICIENCY', 'BORON_DEFICIENCY'],
    2.5 // 2.5 hectares
  );

  assert.strictEqual(prescription.crop, 'TOMATO');
  assert.strictEqual(prescription.fieldAcreageHectares, 2.5);
  assert.strictEqual(prescription.recipeCount, 2);

  const caProtocol = prescription.prescriptionProtocols.find(p => p.deficiency === 'CALCIUM_DEFICIENCY');
  assert(caProtocol);
  // 5 kg/ha * 2.5 ha = 12.5 kg
  assert.strictEqual(caProtocol.totalChemicalProductRequiredKg, 12.5);
  // 200 L/ha * 2.5 ha = 500 L
  assert.strictEqual(caProtocol.sprayWaterVolumeLitres, 500);

  const bProtocol = prescription.prescriptionProtocols.find(p => p.deficiency === 'BORON_DEFICIENCY');
  assert(bProtocol);
  // 1.2 kg/ha * 2.5 ha = 3.0 kg
  assert.strictEqual(bProtocol.totalChemicalProductRequiredKg, 3.0);
});

// 9. Crop Nutrient Removal and Soil Depletion Balance
runTest('computeCriticalNutrientRemovalBalances computes stoichiometric elemental removal for target yields', () => {
  const removal = CropSpecificFertilityAdvisoryService.computeCriticalNutrientRemovalBalances(
    'MAIZE',
    5.0, // 5 tons/ha
    2.0  // 2 hectares = 10 tons total
  );

  assert.strictEqual(removal.crop, 'MAIZE');
  assert.strictEqual(removal.totalExpectedHarvestTons, 10.0);
  // Maize removal: N=22, P2O5=9, K2O=20 per ton
  assert.strictEqual(removal.elementalRemovalBudget.nitrogenKg, 220.0);
  assert.strictEqual(removal.elementalRemovalBudget.phosphateP2O5Kg, 90.0);
  assert.strictEqual(removal.elementalRemovalBudget.potashK2OKg, 200.0);
  assert(removal.soilDepletionAdvisory.includes('220 kg N'));
});

// 10. 100 Permutation Combinatorial Stress Matrix
runTest('100 combinatorial permutations of crop x yield x acreage execute without error', () => {
  const crops = Object.keys(CROP_REMOVAL_FACTORS);
  const yieldLevels = [1.5, 3.0, 5.0, 10.0, 25.0];
  const acreages = [0.5, 1.0, 5.0, 20.0];

  let testCount = 0;
  for (const crop of crops) {
    for (const y of yieldLevels) {
      for (const ha of acreages) {
        const bal = CropSpecificFertilityAdvisoryService.computeCriticalNutrientRemovalBalances(crop, y, ha);
        assert(bal.totalExpectedHarvestTons > 0);
        assert(bal.elementalRemovalBudget.nitrogenKg > 0);
        assert(bal.elementalRemovalBudget.phosphateP2O5Kg > 0);
        assert(bal.elementalRemovalBudget.potashK2OKg > 0);
        testCount++;
      }
    }
  }
  assert(testCount >= 100, `Expected >= 100 permutations, ran ${testCount}`);
});

console.log('\n=================================================================');
console.log(`🏁 TEST RESULTS: ${testsPassed} Passed, ${testsFailed} Failed.`);
console.log('=================================================================\n');

if (testsFailed > 0) {
  process.exit(1);
}
