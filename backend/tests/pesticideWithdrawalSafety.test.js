/**
 * @file pesticideWithdrawalSafety.test.js
 * @description Comprehensive unit tests for PesticideWithdrawalSafetyService.
 * Validates MRL limits, first-order kinetic decay, PHI windows, and export food safety clearance.
 */

const assert = require('assert');
const {
  PesticideWithdrawalSafetyService,
  AGROCHEMICAL_RESIDUE_DATABASE
} = require('../services/pesticideWithdrawalSafetyService');

console.log('=================================================================');
console.log('🌾 AGRILY SPRINT 17: PESTICIDE WITHDRAWAL & MRL SAFETY TESTS');
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
// SECTION 1: Chemical Registry & Formulations Coverage
// -----------------------------------------------------------------------------
console.log('--- SECTION 1: Agrochemical Formulations Registry ---');

runTest('Exports all major Nigerian agrochemical formulations', () => {
  const registry = PesticideWithdrawalSafetyService.getChemicalRegistry();
  const keys = Object.keys(registry);

  assert.ok(keys.length >= 10);
  assert.ok(keys.includes('MANCOZEB_80WP'));
  assert.ok(keys.includes('METALAXYL_M_68WG'));
  assert.ok(keys.includes('COPPER_HYDROXIDE_77WP'));
  assert.ok(keys.includes('LAMBDA_CYHALOTHRIN_5EC'));
  assert.ok(keys.includes('CHLORPYRIFOS_48EC'));
  assert.ok(keys.includes('BACILLUS_THURINGIENSIS_2X'));
});

// -----------------------------------------------------------------------------
// SECTION 2: Kinetic Decay & PHI Clearance Calculations
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 2: First-Order Residue Degradation & Clearance ---');

runTest('Blocks harvest clearance when elapsed days is less than required PHI (Mancozeb)', () => {
  // Last spray was 5 days ago (Mancozeb standard PHI is 14 days)
  const sprayDate = new Date();
  sprayDate.setDate(sprayDate.getDate() - 5);

  const result = PesticideWithdrawalSafetyService.evaluateResidueClearance({
    formulationKey: 'MANCOZEB_80WP',
    lastSprayDate: sprayDate.toISOString().split('T')[0],
    exportMarketDestination: 'NIGERIA_DOMESTIC'
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.foodSafetyVerdict.isClearedForCommercialHarvest, false);
  assert.strictEqual(result.foodSafetyVerdict.safetyVerdictPill, 'MANDATORY_RESIDUE_HOLD_ACTIVE');
  assert.ok(result.foodSafetyVerdict.daysRemainingToClearance > 0);
  assert.strictEqual(result.foodSafetyVerdict.requiredPhiDays, 14);
  assert.ok(result.cryptographicSafetySeal.length === 64);
});

runTest('Clears harvest for Mancozeb after elapsed days exceeds PHI window', () => {
  // Last spray was 18 days ago
  const sprayDate = new Date();
  sprayDate.setDate(sprayDate.getDate() - 18);

  const result = PesticideWithdrawalSafetyService.evaluateResidueClearance({
    formulationKey: 'MANCOZEB_80WP',
    lastSprayDate: sprayDate.toISOString().split('T')[0],
    exportMarketDestination: 'NIGERIA_DOMESTIC'
  });

  assert.strictEqual(result.foodSafetyVerdict.isClearedForCommercialHarvest, true);
  assert.strictEqual(result.foodSafetyVerdict.safetyVerdictPill, 'CLEARED_SAFE_FOR_CONSUMPTION');
  assert.strictEqual(result.foodSafetyVerdict.daysRemainingToClearance, 0);
});

runTest('Enforces stricter EU MRL threshold and extended PHI delay for export', () => {
  // Last spray was 15 days ago (Domestic Mancozeb is 14d, but EU Strict is 21d)
  const sprayDate = new Date();
  sprayDate.setDate(sprayDate.getDate() - 15);

  const domesticResult = PesticideWithdrawalSafetyService.evaluateResidueClearance({
    formulationKey: 'MANCOZEB_80WP',
    lastSprayDate: sprayDate.toISOString().split('T')[0],
    exportMarketDestination: 'NIGERIA_DOMESTIC'
  });

  const exportResult = PesticideWithdrawalSafetyService.evaluateResidueClearance({
    formulationKey: 'MANCOZEB_80WP',
    lastSprayDate: sprayDate.toISOString().split('T')[0],
    exportMarketDestination: 'EU_STRICT'
  });

  assert.strictEqual(domesticResult.foodSafetyVerdict.isClearedForCommercialHarvest, true);
  assert.strictEqual(exportResult.foodSafetyVerdict.isClearedForCommercialHarvest, false); // Requires 21d
  assert.strictEqual(exportResult.foodSafetyVerdict.requiredPhiDays, 21);
});

runTest('Biological Bt microbial treatment provides instant clearance (0-day PHI)', () => {
  const sprayDate = new Date(); // Sprayed today

  const result = PesticideWithdrawalSafetyService.evaluateResidueClearance({
    formulationKey: 'BACILLUS_THURINGIENSIS_2X',
    lastSprayDate: sprayDate.toISOString().split('T')[0]
  });

  assert.strictEqual(result.foodSafetyVerdict.isClearedForCommercialHarvest, true);
  assert.strictEqual(result.foodSafetyVerdict.requiredPhiDays, 0);
  assert.strictEqual(result.foodSafetyVerdict.daysRemainingToClearance, 0);
});

runTest('Generates complete 7-day residue degradation curve table', () => {
  const result = PesticideWithdrawalSafetyService.evaluateResidueClearance({
    formulationKey: 'LAMBDA_CYHALOTHRIN_5EC',
    lastSprayDate: new Date().toISOString().split('T')[0]
  });

  assert.ok(Array.isArray(result.degradationCurve));
  assert.ok(result.degradationCurve.length >= 7);
  assert.strictEqual(result.degradationCurve[0].dayPostSpray, 0);
  // Verify exponential decay trend: Day 0 concentration > Day 5 concentration
  assert.ok(result.degradationCurve[0].projectedResidueMgKg > result.degradationCurve[5].projectedResidueMgKg);
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
