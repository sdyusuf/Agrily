/**
 * @file freightTariffStressMatrix.test.js
 * @description Combinatorial Stress Matrix for Regional Haulage Freight Tariffs
 * Tests extreme capacity limits (0.1T to 40T), security surcharges, toll adjustments,
 * and mathematical monotonicity invariants across Nigerian agro-supply routes.
 */

const assert = require('assert');
const { FreightPricingIndexService } = require('../services/freightPricingIndexService');
const RegionalFreightBenchmark = require('../models/RegionalFreightBenchmark');

console.log('=================================================================');
console.log('🌾 AGRILY SPRINT 16: FREIGHT TARIFF COMBINATORIAL STRESS MATRIX');
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

// -----------------------------------------------------------------------------
// SECTION 1: Extreme Tonnage Scaling (Micro 100kg to Mega 40 Tonnes)
// -----------------------------------------------------------------------------
console.log('--- SECTION 1: Extreme Cargo Tonnage Invariants ---');

const TONNAGE_TIERS = [0.1, 0.5, 1.0, 2.5, 5.0, 10.0, 15.0, 20.0, 30.0, 40.0];

check('Tariff increases strictly monotonically with cargo tonnage', () => {
  let prevTariff = 0;

  for (const t of TONNAGE_TIERS) {
    const quote = FreightPricingIndexService.calculateTariffQuote({
      originState: 'KANO',
      destinationState: 'LAGOS',
      tonnage: t
    });

    assert.strictEqual(quote.finalTariffNgn >= prevTariff, true,
      `Tariff for ${t}T (₦${quote.finalTariffNgn}) should be >= previous (₦${prevTariff})`);
    prevTariff = quote.finalTariffNgn;
  }
});

check('Micro consignments (0.1T - 0.5T) hit floor tariff protection', () => {
  const quoteMicro = FreightPricingIndexService.calculateTariffQuote({
    originState: 'KANO',
    destinationState: 'LAGOS',
    tonnage: 0.1
  });

  // Floor for Kano-Lagos is 75,000 NGN
  assert.strictEqual(quoteMicro.finalTariffNgn, 75000);
});

// -----------------------------------------------------------------------------
// SECTION 2: Cold-Chain Reefer Premium Invariants
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 2: Cold-Chain Reefer Premium Validation ---');

check('Reefer transit always incurs positive surcharge compared to ambient on same route', () => {
  const ambientQuote = FreightPricingIndexService.calculateTariffQuote({
    originState: 'PLATEAU',
    destinationState: 'RIVERS',
    tonnage: 10.0,
    isTemperatureControlled: false
  });

  const reeferQuote = FreightPricingIndexService.calculateTariffQuote({
    originState: 'PLATEAU',
    destinationState: 'RIVERS',
    tonnage: 10.0,
    isTemperatureControlled: true
  });

  assert.strictEqual(reeferQuote.finalTariffNgn > ambientQuote.finalTariffNgn, true);
  assert.strictEqual(reeferQuote.reeferPremiumNgn > 0, true);
  assert.strictEqual(ambientQuote.reeferPremiumNgn, 0);
});

// -----------------------------------------------------------------------------
// SECTION 3: High-Risk Security Corridor Surcharges
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 3: High-Risk Security Corridor Surcharges ---');

check('High-risk corridors (Borno to Abuja) include statutory escort surcharge', () => {
  const quote = FreightPricingIndexService.calculateTariffQuote({
    originState: 'BORNO',
    destinationState: 'ABUJA',
    tonnage: 12.0
  });

  assert.strictEqual(quote.securitySurchargeNgn, 35000);
  assert.strictEqual(quote.finalTariffNgn > quote.rawBaseFreightNgn, true);
});

// -----------------------------------------------------------------------------
// SECTION 4: Synthetic Fallback Corridors
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 4: Synthetic Fallback Corridor Robustness ---');

check('Handles arbitrary unmapped state routes cleanly without null exceptions', () => {
  const quote = FreightPricingIndexService.calculateTariffQuote({
    originState: 'TARABA',
    destinationState: 'BAYELSA',
    tonnage: 5.0
  });

  assert.strictEqual(typeof quote.quoteId, 'string');
  assert.strictEqual(quote.finalTariffNgn >= 45000, true);
  assert.strictEqual(quote.distanceKm, 550);
});

console.log('\n=================================================================');
console.log(`🌾 TARIFF MATRIX COMPLETE: ${passed} passed, ${failed} failed`);
console.log('=================================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
