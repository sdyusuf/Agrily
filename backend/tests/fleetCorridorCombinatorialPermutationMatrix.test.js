/**
 * @file fleetCorridorCombinatorialPermutationMatrix.test.js
 * @description Combinatorial Permutation Matrix across 25 Geopolitical Agro-Corridors
 * Tests synthetic rate estimation, multi-state toll allocations, and freight invariants.
 */

const assert = require('assert');
const { FreightPricingIndexService } = require('../services/freightPricingIndexService');
const { CorridorTollAndLevyMatrixService } = require('../services/corridorTollAndLevyMatrixService');

console.log('=================================================================');
console.log('🌾 AGRILY SPRINT 16: 25-CORRIDOR COMBINATORIAL PERMUTATION MATRIX');
console.log('=================================================================\n');

let passed = 0;
let failed = 0;

function check(desc, fn) {
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

const CORRIDOR_TEST_PAIRS = [
  { origin: 'KANO', dest: 'LAGOS', expectedMinDistance: 900 },
  { origin: 'KADUNA', dest: 'OGUN', expectedMinDistance: 500 },
  { origin: 'KATSINA', dest: 'OYO', expectedMinDistance: 500 },
  { origin: 'SOKOTO', dest: 'LAGOS', expectedMinDistance: 500 },
  { origin: 'JIGAWA', dest: 'ABUJA', expectedMinDistance: 400 },
  { origin: 'PLATEAU', dest: 'RIVERS', expectedMinDistance: 700 },
  { origin: 'BENUE', dest: 'DELTA', expectedMinDistance: 450 },
  { origin: 'NASARAWA', dest: 'BAYELSA', expectedMinDistance: 450 },
  { origin: 'KOGI', dest: 'EDO', expectedMinDistance: 150 },
  { origin: 'KWARA', dest: 'LAGOS', expectedMinDistance: 250 },
  { origin: 'BORNO', dest: 'ABUJA', expectedMinDistance: 800 },
  { origin: 'GOMBE', dest: 'PLATEAU', expectedMinDistance: 250 },
  { origin: 'BAUCHI', dest: 'KADUNA', expectedMinDistance: 300 },
  { origin: 'TARABA', dest: 'ENUGU', expectedMinDistance: 400 },
  { origin: 'ADAMAWA', dest: 'LAGOS', expectedMinDistance: 500 },
  { origin: 'ONDO', dest: 'LAGOS', expectedMinDistance: 300 },
  { origin: 'OSUN', dest: 'RIVERS', expectedMinDistance: 450 },
  { origin: 'EKITI', dest: 'ABUJA', expectedMinDistance: 350 },
  { origin: 'OGUN', dest: 'OYO', expectedMinDistance: 80 },
  { origin: 'OYO', dest: 'LAGOS', expectedMinDistance: 100 },
  { origin: 'ENUGU', dest: 'RIVERS', expectedMinDistance: 200 },
  { origin: 'ANAMBRA', dest: 'LAGOS', expectedMinDistance: 450 },
  { origin: 'IMO', dest: 'ABUJA', expectedMinDistance: 450 },
  { origin: 'ABIA', dest: 'KANO', expectedMinDistance: 500 },
  { origin: 'EBONYI', dest: 'LAGOS', expectedMinDistance: 500 }
];

check('All 25 geopolitical corridor pairs evaluate with valid positive tariff and distance', () => {
  for (const pair of CORRIDOR_TEST_PAIRS) {
    const quote = FreightPricingIndexService.calculateTariffQuote({
      originState: pair.origin,
      destinationState: pair.dest,
      tonnage: 10.0,
      currentDieselPriceNgn: 1000
    });

    assert.strictEqual(typeof quote.quoteId, 'string');
    assert.strictEqual(quote.distanceKm >= 80, true);
    assert.strictEqual(quote.finalTariffNgn >= 45000, true);
    assert.strictEqual(quote.effectiveRatePerTonKmNgn > 0, true);
  }
});

check('State produce inspection fee resolves accurately across all 25 pairs', () => {
  for (const pair of CORRIDOR_TEST_PAIRS) {
    const levies = CorridorTollAndLevyMatrixService.calculateCorridorStatutoryLevies({
      originState: pair.origin,
      destinationState: pair.dest,
      tonnage: 10.0,
      freightHaulageTariffNgn: 200000
    });

    assert.strictEqual(levies.totalGovernmentLeviesAndTollsNgn > 0, true);
    assert.strictEqual(levies.haulageServiceVatNgn, 15000); // 7.5% of 200k
    assert.strictEqual(typeof levies.taxComplianceSeal, 'string');
    assert.strictEqual(levies.taxComplianceSeal.length, 64);
  }
});

console.log('\n=================================================================');
console.log(`🌾 25-CORRIDOR MATRIX COMPLETE: ${passed} passed, ${failed} failed`);
console.log('=================================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
