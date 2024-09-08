/**
 * @file nationalCropPathologyStressMatrix.test.js
 * @description Exhaustive Combinatorial Permutation Stress Matrix for Nigerian Agronomy.
 * Evaluates 840 permutations:
 * - 10 Supported Agricultural Commodities
 * - 7 Agro-Ecological Zones
 * - 3 Climatological Seasons (Wet Monsoon, Harmattan Dry, Dry Irrigation)
 * - 4 Lesion Severity Staging Tiers (Early, Moderate, Severe, Catastrophic)
 */

const assert = require('assert');
const { LeafPathologyInferenceEngine } = require('../services/leafPathologyInferenceEngine');
const { CropPathologyZonalDistributionService } = require('../services/cropPathologyZonalDistributionService');
const { AgronomyTreatmentAdvisorService } = require('../services/agronomyTreatmentAdvisorService');
const { SUPPORTED_CROPS, AGRO_ECOLOGICAL_ZONES } = require('../models/CropPathologyRecord');

console.log('=================================================================');
console.log('🌾 AGRILY SPRINT 17: NATIONAL COMBINATORIAL STRESS MATRIX (840)');
console.log('=================================================================\n');

let passed = 0;
let failed = 0;

function runTest(desc, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${desc}`);
    console.error(`     Reason: ${err.message}`);
    failed++;
  }
}

const SEASONS = ['WET_MONSOON', 'HARMATTAN_DRY', 'DRY_IRRIGATION'];
const SEVERITIES = ['EARLY', 'MODERATE', 'SEVERE', 'CATASTROPHIC'];

// -----------------------------------------------------------------------------
// SECTION 1: Combinatorial Permutation Execution
// -----------------------------------------------------------------------------
console.log('--- SECTION 1: Executing 840 Combinatorial Permutations ---');

runTest('Executes all 840 permutations with 100% valid SHA-256 seals and bounded metrics', () => {
  let executedCount = 0;
  let highestR0 = 0;
  let lowestR0 = Infinity;

  SUPPORTED_CROPS.forEach((crop) => {
    AGRO_ECOLOGICAL_ZONES.forEach((zone) => {
      SEASONS.forEach((season) => {
        // 1. Zonal Proliferation Evaluation
        const zonalEval = CropPathologyZonalDistributionService.evaluateZonalPathologyRisk({
          agroZone: zone,
          cropType: crop,
          season
        });

        assert.strictEqual(zonalEval.success, true);
        assert.ok(zonalEval.cryptographicZonalSeal.length === 64);
        assert.ok(zonalEval.epidemiologyModel.calculatedR0ProliferationIndex > 0);

        if (zonalEval.epidemiologyModel.calculatedR0ProliferationIndex > highestR0) {
          highestR0 = zonalEval.epidemiologyModel.calculatedR0ProliferationIndex;
        }
        if (zonalEval.epidemiologyModel.calculatedR0ProliferationIndex < lowestR0) {
          lowestR0 = zonalEval.epidemiologyModel.calculatedR0ProliferationIndex;
        }

        SEVERITIES.forEach((severity) => {
          // 2. Leaf Pathology Inference Simulation
          const inference = LeafPathologyInferenceEngine.inferLeafPathology({
            cropType: crop,
            severityLevel: severity,
            fieldAcreageHectares: 2.0
          });

          assert.strictEqual(inference.success, true);
          assert.strictEqual(inference.cropType, crop);
          assert.ok(inference.cryptographicSeal.length === 64);
          assert.ok(inference.diagnosis.confidenceScore >= 0.80);
          assert.ok(inference.economicImpact.projectedYieldLossPct >= 0 && inference.economicImpact.projectedYieldLossPct <= 100);

          executedCount++;
        });
      });
    });
  });

  assert.strictEqual(executedCount, 840);
  console.log(`    ↳ Verified 840 permutations. Max R0: ${highestR0}, Min R0: ${lowestR0}`);
});

// -----------------------------------------------------------------------------
// SECTION 2: Zonal Climatology Invariants
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 2: Agro-Ecological Zonal Climatology Invariants ---');

runTest('Humid Rainforest Belt exhibits higher proliferation risk than Sahel Savanna during Wet Monsoon', () => {
  const rainforestEval = CropPathologyZonalDistributionService.evaluateZonalPathologyRisk({
    agroZone: 'HUMID_FOREST_BELT',
    cropType: 'COCOA',
    season: 'WET_MONSOON'
  });

  const sahelEval = CropPathologyZonalDistributionService.evaluateZonalPathologyRisk({
    agroZone: 'SAHEL_SAVANNA',
    cropType: 'SORGHUM',
    season: 'WET_MONSOON'
  });

  assert.ok(
    rainforestEval.epidemiologyModel.calculatedR0ProliferationIndex >
    sahelEval.epidemiologyModel.calculatedR0ProliferationIndex,
    'Rainforest R0 must exceed Sahel R0 during monsoon rains'
  );
});

runTest('Harmattan dry season attenuates fungal proliferation across Sudan Savanna', () => {
  const dryEval = CropPathologyZonalDistributionService.evaluateZonalPathologyRisk({
    agroZone: 'SUDAN_SAVANNA',
    cropType: 'TOMATO',
    season: 'HARMATTAN_DRY'
  });

  assert.ok(dryEval.epidemiologyModel.calculatedR0ProliferationIndex < 1.0);
  assert.strictEqual(dryEval.epidemiologyModel.riskClassification, 'LOW_DRY_ATTENUATION');
});

// -----------------------------------------------------------------------------
// SECTION 3: Curative Dosage Monotonicity
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 3: Curative Dosage Monotonic Scaling Invariants ---');

runTest('Chemical and water volumes scale strictly monotonically with field acreage', () => {
  const rx1Ha = AgronomyTreatmentAdvisorService.generatePrescription({
    diseaseCode: 'TOM-EB-001',
    cropType: 'TOMATO',
    fieldAcreageHectares: 1.0
  });

  const rx5Ha = AgronomyTreatmentAdvisorService.generatePrescription({
    diseaseCode: 'TOM-EB-001',
    cropType: 'TOMATO',
    fieldAcreageHectares: 5.0
  });

  const chem1 = rx1Ha.treatments[0].acreageCalculations;
  const chem5 = rx5Ha.treatments[0].acreageCalculations;

  assert.strictEqual(chem5.totalChemicalProductRequired, chem1.totalChemicalProductRequired * 5);
  assert.strictEqual(chem5.totalDilutionWaterLiters, chem1.totalDilutionWaterLiters * 5);
  assert.ok(chem5.estimated20LKnapsackLoads > chem1.estimated20LKnapsackLoads);
});

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n=================================================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('=================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
