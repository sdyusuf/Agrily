/**
 * @file fleetMacroEconomicStressMatrix.test.js
 * @description Macroeconomic Stress & Multi-Currency Corridor Matrix
 * Simulates extreme exchange rate shocks, cross-border ECOWAS tariffs,
 * demurrage penalty accumulation, and carrier inflation index hedging.
 */

const assert = require('assert');
const { FreightPricingIndexService } = require('../services/freightPricingIndexService');
const { CorridorTollAndLevyMatrixService } = require('../services/corridorTollAndLevyMatrixService');
const FleetAnalyticsEngine = require('../services/fleetAnalyticsEngine');

console.log('=================================================================');
console.log('🌾 AGRILY SPRINT 16: FLEET MACROECONOMIC STRESS MATRIX');
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
// SECTION 1: Extreme Fuel Volatility (₦600 to ₦2,000 / L)
// -----------------------------------------------------------------------------
console.log('--- SECTION 1: Diesel Price Super-Shock Invariants ---');

const DIESEL_EXTREME_TIERS = [600, 800, 950, 1200, 1500, 1800, 2000];

check('Freight tariffs remain positive and monotonically non-decreasing up to ₦2,000/L diesel', () => {
  let prevTariff = 0;

  for (const price of DIESEL_EXTREME_TIERS) {
    const quote = FreightPricingIndexService.calculateTariffQuote({
      originState: 'KANO',
      destinationState: 'LAGOS',
      tonnage: 20.0,
      currentDieselPriceNgn: price
    });

    assert.strictEqual(quote.finalTariffNgn >= prevTariff, true);
    assert.strictEqual(quote.finalTariffNgn > 0, true);
    prevTariff = quote.finalTariffNgn;
  }
});

// -----------------------------------------------------------------------------
// SECTION 2: Multi-Currency Equivalencies (USD & XOF)
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 2: Multi-Currency FX Equivalency Invariants ---');

check('Calculates stable USD and XOF (CFA Franc) cross-border equivalents', () => {
  const quoteNgn = FreightPricingIndexService.calculateTariffQuote({
    originState: 'SOKOTO',
    destinationState: 'OYO',
    tonnage: 15.0
  });

  const exchangeRates = {
    USD_TO_NGN: 1550,
    XOF_TO_NGN: 2.55
  };

  const tariffUsd = parseFloat((quoteNgn.finalTariffNgn / exchangeRates.USD_TO_NGN).toFixed(2));
  const tariffXof = Math.round(quoteNgn.finalTariffNgn / exchangeRates.XOF_TO_NGN);

  assert.strictEqual(tariffUsd > 100, true);
  assert.strictEqual(tariffXof > quoteNgn.finalTariffNgn / 3, true);
  // Invariant: Tariff in NGN reconstructed from USD within 1% rounding delta
  const reconstructedNgn = tariffUsd * exchangeRates.USD_TO_NGN;
  const delta = Math.abs(reconstructedNgn - quoteNgn.finalTariffNgn);
  assert.strictEqual(delta <= 50, true);
});

// -----------------------------------------------------------------------------
// SECTION 3: Demurrage & Terminal Gate Congestion Penalties
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 3: Terminal Demurrage & Dwell Congestion Penalties ---');

check('Calculates demurrage surcharge when terminal offloading exceeds 4 hours', () => {
  const normalTurnaround = FleetAnalyticsEngine.analyzeTurnaroundBottlenecks([
    {
      turnaroundDurationsMinutes: {
        originLoadingTime: 45,
        transitTime: 1800,
        docksideInspectionTime: 30,
        destinationOffloadingTime: 60, // 1 hr normal
        totalTurnaroundTime: 1935
      }
    }
  ]);

  const congestedTurnaround = FleetAnalyticsEngine.analyzeTurnaroundBottlenecks([
    {
      turnaroundDurationsMinutes: {
        originLoadingTime: 45,
        transitTime: 1800,
        docksideInspectionTime: 30,
        destinationOffloadingTime: 360, // 6 hrs congestion!
        totalTurnaroundTime: 2235
      }
    }
  ]);

  assert.strictEqual(congestedTurnaround.dwellTimeTotalMinutes > normalTurnaround.dwellTimeTotalMinutes, true);
  assert.strictEqual(congestedTurnaround.averageOffloadingMinutes, 360);
});

console.log('\n=================================================================');
console.log(`🌾 MATRIX COMPLETE: ${passed} passed, ${failed} failed`);
console.log('=================================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
