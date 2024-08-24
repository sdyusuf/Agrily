/**
 * @file fleetEmissionCreditCalculator.test.js
 * @description Unit tests for FleetEmissionCreditCalculatorService
 */

const assert = require('assert');
const {
  FleetEmissionCreditCalculatorService,
  BASELINE_EMISSION_STANDARDS
} = require('../services/fleetEmissionCreditCalculatorService');

console.log('=================================================================');
console.log('🌾 AGRILY SPRINT 16: FLEET CARBON CREDIT CALCULATOR TESTS');
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
// SECTION 1: Carbon Offset Credits & ESG Tiers
// -----------------------------------------------------------------------------
console.log('--- SECTION 1: Carbon Offset Credits & Certification ---');

runTest('Evaluates carbon savings and generates valid digital credit seal', () => {
  const result = FleetEmissionCreditCalculatorService.evaluateCarbonOffsetCredits({
    carrierCode: 'CAR-ECO-01',
    totalDistanceKm: 1000,
    tonnageHauled: 20.0,
    actualFuelConsumedLitres: 260, // Efficient burn
    ecoDrivingScore: 94
  });

  assert.strictEqual(typeof result.certificateId, 'string');
  assert.strictEqual(result.certificateId.startsWith('CARBON-'), true);
  assert.strictEqual(result.totalTonKmApportioned, 20000);
  assert.strictEqual(result.co2SavedKg > 500, true);
  assert.strictEqual(result.carbonCreditEarnedNgn > 5000, true);
  assert.strictEqual(result.esgRating, 'TIER_1_GREEN_PIONEER');
  assert.strictEqual(typeof result.digitalCreditSeal, 'string');
  assert.strictEqual(result.digitalCreditSeal.length, 64);
});

runTest('Assigns STANDARD_EMITTING rating when fuel burn matches baseline', () => {
  const result = FleetEmissionCreditCalculatorService.evaluateCarbonOffsetCredits({
    carrierCode: 'CAR-HEAVY-02',
    totalDistanceKm: 500,
    tonnageHauled: 10.0,
    actualFuelConsumedLitres: 200, // High consumption
    ecoDrivingScore: 65
  });

  assert.strictEqual(result.co2SavedKg, 0);
  assert.strictEqual(result.carbonCreditEarnedNgn, 0);
  assert.strictEqual(result.esgRating, 'STANDARD_EMITTING');
});

console.log('\n=================================================================');
console.log(`🌾 TEST SUITE COMPLETE: ${passed} passed, ${failed} failed`);
console.log('=================================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
