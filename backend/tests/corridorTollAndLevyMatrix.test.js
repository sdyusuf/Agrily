/**
 * @file corridorTollAndLevyMatrix.test.js
 * @description Unit tests for CorridorTollAndLevyMatrixService
 */

const assert = require('assert');
const {
  CorridorTollAndLevyMatrixService,
  STATE_PRODUCE_LEVIES_REGISTRY
} = require('../services/corridorTollAndLevyMatrixService');

console.log('=================================================================');
console.log('🌾 AGRILY SPRINT 16: CORRIDOR TOLL & LEVY MATRIX TESTS');
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

// -----------------------------------------------------------------------------
// SECTION 1: Registry Lookup & State Levies
// -----------------------------------------------------------------------------
console.log('--- SECTION 1: State Produce Registry Lookups ---');

runTest('Resolves Kano state agricultural produce and sanitation levies', () => {
  const levy = CorridorTollAndLevyMatrixService.getStateLevy('KANO');
  assert.strictEqual(levy.produceInspectionFeeNgn, 4500);
  assert.strictEqual(levy.stateForestryLevyNgn, 1500);
  assert.strictEqual(levy.lgaSanitationPermitNgn, 1000);
});

runTest('Gracefully falls back to default produce levies on unmapped state', () => {
  const levy = CorridorTollAndLevyMatrixService.getStateLevy('ZAMFARA');
  assert.strictEqual(levy.produceInspectionFeeNgn, 3500);
  assert.strictEqual(levy.stateForestryLevyNgn, 1500);
});

// -----------------------------------------------------------------------------
// SECTION 2: Statutory Haulage Service VAT & Grand Total Calculations
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 2: Statutory Haulage VAT & Checkpoint Outlays ---');

runTest('Applies strictly 7.5% VAT on haulage tariff while raw produce is zero-rated', () => {
  const calculation = CorridorTollAndLevyMatrixService.calculateCorridorStatutoryLevies({
    originState: 'KANO',
    transitStates: ['KADUNA', 'NIGER', 'KOGI'],
    destinationState: 'LAGOS',
    freightHaulageTariffNgn: 400000,
    tonnage: 15.0
  });

  assert.strictEqual(calculation.produceVatStatus, 'EXEMPT_ZERO_RATED_AGRICULTURAL_PRODUCE');
  assert.strictEqual(calculation.haulageServiceVatRatePct, 7.5);
  assert.strictEqual(calculation.haulageServiceVatNgn, 30000); // 7.5% of 400,000 NGN
  assert.strictEqual(calculation.totalGovernmentLeviesAndTollsNgn > 15000, true);
  assert.strictEqual(calculation.grandTotalStatutoryTariffNgn, calculation.totalGovernmentLeviesAndTollsNgn + 30000);
  assert.strictEqual(typeof calculation.taxComplianceSeal, 'string');
  assert.strictEqual(calculation.taxComplianceSeal.length, 64);
});

runTest('Increases FRSC weighbridge tariff for heavy-duty mega-trucks (>25T)', () => {
  const calcLight = CorridorTollAndLevyMatrixService.calculateCorridorStatutoryLevies({
    originState: 'OYO',
    destinationState: 'LAGOS',
    tonnage: 5.0
  });

  const calcHeavy = CorridorTollAndLevyMatrixService.calculateCorridorStatutoryLevies({
    originState: 'OYO',
    destinationState: 'LAGOS',
    tonnage: 35.0
  });

  assert.strictEqual(
    calcHeavy.statutoryLevyBreakdown.transitTollsAndBridges.frscWeighbridgeTariffNgn >
    calcLight.statutoryLevyBreakdown.transitTollsAndBridges.frscWeighbridgeTariffNgn,
    true
  );
});

console.log('\n=================================================================');
console.log(`🌾 TEST SUITE COMPLETE: ${passed} passed, ${failed} failed`);
console.log('=================================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
