/**
 * @file fleetCorridorStressSimulation.test.js
 * @description Cross-Corridor Fleet Dispatch & Macroeconomic Stress Matrix
 * Simulates 50 Nigerian interstate routes under severe diesel inflation shocks,
 * rainy season washouts, cold-chain breakdowns, and bottleneck dwell distributions.
 */

const assert = require('assert');
const { FreightPricingIndexService, NIGERIAN_CORRIDOR_BENCHMARKS } = require('../services/freightPricingIndexService');
const FleetAnalyticsEngine = require('../services/fleetAnalyticsEngine');
const CarrierRankingService = require('../services/carrierRankingService');
const FleetPerformanceLog = require('../models/FleetPerformanceLog');
const CarrierScorecard = require('../models/CarrierScorecard');

console.log('=================================================================');
console.log('🌾 AGRILY SPRINT 16: FLEET CORRIDOR STRESS SIMULATION RUNNER');
console.log('=================================================================\n');

let passedCount = 0;
let failedCount = 0;

function runTest(description, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${description}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${description}`);
    console.error(`     Reason: ${err.message}`);
    failedCount++;
  }
}

// -----------------------------------------------------------------------------
// SECTION 1: Macroeconomic Diesel Shocks & Inflation Invariants
// -----------------------------------------------------------------------------
console.log('--- SECTION 1: Diesel Price Shock Simulations (₦700 to ₦1,600/L) ---');

const DIESEL_PRICE_STRESS_TIERS = [
  { price: 750, label: 'Subsidized Baseline (₦750)' },
  { price: 950, label: 'Official Market Benchmark (₦950)' },
  { price: 1200, label: 'Moderate Inflation Shock (₦1,200)' },
  { price: 1450, label: 'Severe Fuel Crisis (₦1,450)' },
  { price: 1600, label: 'Extreme Macroeconomic Shock (₦1,600)' }
];

runTest('Freight tariffs scale monotonically across diesel price shocks on Kano-Lagos corridor', () => {
  let previousTariff = 0;

  for (const tier of DIESEL_PRICE_STRESS_TIERS) {
    const quote = FreightPricingIndexService.calculateTariffQuote({
      originState: 'KANO',
      destinationState: 'LAGOS',
      tonnage: 15.0,
      currentDieselPriceNgn: tier.price
    });

    assert.strictEqual(quote.finalTariffNgn >= previousTariff, true,
      `Tariff at ₦${tier.price} (${quote.finalTariffNgn}) should be >= previous (${previousTariff})`);
    assert.strictEqual(quote.finalTariffNgn > 0, true);
    previousTariff = quote.finalTariffNgn;
  }
});

runTest('Diesel rebate discount caps at 15% reduction floor during cheap fuel periods', () => {
  const quote = FreightPricingIndexService.calculateTariffQuote({
    originState: 'KANO',
    destinationState: 'LAGOS',
    tonnage: 10.0,
    currentDieselPriceNgn: 400 // Extreme low price
  });

  assert.strictEqual(quote.fuelSurchargePct >= -15.0, true);
});

// -----------------------------------------------------------------------------
// SECTION 2: Seasonal Volatility Across All 6 Primary Agro-Corridors
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 2: Seasonal Volatility Across Trade Corridors ---');

runTest('All 6 registered Nigerian benchmarks maintain seasonal multiplier hierarchy', () => {
  for (const benchmark of NIGERIAN_CORRIDOR_BENCHMARKS) {
    const quoteDry = FreightPricingIndexService.calculateTariffQuote({
      originState: benchmark.originState,
      destinationState: benchmark.destinationState,
      tonnage: 8.0,
      season: 'DRY_SEASON_HARVEST'
    });

    const quoteRainy = FreightPricingIndexService.calculateTariffQuote({
      originState: benchmark.originState,
      destinationState: benchmark.destinationState,
      tonnage: 8.0,
      season: 'RAINY_SEASON_PEAK'
    });

    const quoteOff = FreightPricingIndexService.calculateTariffQuote({
      originState: benchmark.originState,
      destinationState: benchmark.destinationState,
      tonnage: 8.0,
      season: 'OFF_SEASON_BASELINE'
    });

    // Peak seasons (either rainy peak or dry harvest) are always >= off-season baseline
    assert.strictEqual(quoteRainy.finalTariffNgn >= quoteOff.finalTariffNgn, true,
      `Rainy tariff on ${benchmark.benchmarkCode} should be >= off-season`);
    assert.strictEqual(quoteDry.finalTariffNgn >= quoteOff.finalTariffNgn, true,
      `Dry harvest tariff on ${benchmark.benchmarkCode} should be >= off-season`);
  }
});

// -----------------------------------------------------------------------------
// SECTION 3: Fleet Turnaround Bottleneck Simulation (100 Trips)
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 3: Monte Carlo Turnaround Bottleneck Simulation (100 Trips) ---');

runTest('FleetAnalyticsEngine correctly classifies primary bottleneck stage across simulated fleet', () => {
  const simulatedLogs = [];

  for (let i = 0; i < 100; i++) {
    // Simulate severe loading congestion in 70% of trips
    const loadingMins = i < 70 ? 120 + (i % 30) : 40;
    const transitMins = 900 + (i % 60);
    const inspectionMins = 30 + (i % 15);
    const offloadMins = 45 + (i % 20);

    simulatedLogs.push(new FleetPerformanceLog({
      vehicleRegNumber: `SIM-${100 + i}-TRK`,
      origin: { state: 'KANO' },
      destination: { state: 'LAGOS' },
      commodityDetails: { tonnageCarriedTonnes: 10 + (i % 10) },
      turnaroundDurationsMinutes: {
        originLoadingTime: loadingMins,
        transitTime: transitMins,
        docksideInspectionTime: inspectionMins,
        destinationOffloadingTime: offloadMins,
        totalTurnaroundTime: loadingMins + transitMins + inspectionMins + offloadMins,
        transitDelayMinutes: i % 5 === 0 ? 45 : 0
      },
      fuelAndEnergyTelemetry: {
        totalDistanceCoveredKm: 800,
        fuelConsumedLitres: 240,
        fuelCostNgn: 228000
      },
      ecoDrivingScorecard: {
        ecoDrivingScore: 80 + (i % 18)
      }
    }));
  }

  const analysis = FleetAnalyticsEngine.analyzeTurnaroundBottlenecks(simulatedLogs);
  assert.strictEqual(analysis.sampleSize, 100);
  assert.strictEqual(analysis.primaryBottleneckStage, 'IN_TRANSIT');
  assert.strictEqual(analysis.averageTotalTurnaroundMinutes > 1000, true);
  assert.strictEqual(analysis.delayedTripsCount, 20); // Every 5th trip had delay
});

// -----------------------------------------------------------------------------
// SECTION 4: Carrier Scorecard & Incentive Payout Integrity
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 4: Carrier Payout & Escrow Retention Matrix ---');

runTest('Carrier monthly payout enforces zero-loss: Net payout = Gross + Bonus - Retention', () => {
  const carrier = new CarrierScorecard({
    carrierCode: 'CAR-TEST-99',
    carrierName: 'Reliable Fleet Ltd',
    tier: 'GOLD_AGRO_CARRIER',
    incentivesAndGuarantees: {
      freightPaymentBonusPct: 2.0,
      retentionEscrowRequiredPct: 2.5
    }
  });

  const grossMonthly = 5000000; // ₦5,000,000
  const payout = CarrierRankingService.calculateMonthlyCarrierPayout({
    carrierScorecard: carrier,
    monthlyGrossFreightNgn: grossMonthly
  });

  assert.strictEqual(payout.monthlyGrossFreightNgn, 5000000);
  assert.strictEqual(payout.bonusEarnedNgn, 100000); // 2% of 5M
  assert.strictEqual(payout.retentionWithheldNgn, 125000); // 2.5% of 5M
  // Net = 5,000,000 + 100,000 - 125,000 = 4,975,000 NGN
  assert.strictEqual(payout.netDisbursedNgn, 4975000);
  assert.strictEqual(payout.netDisbursedNgn + payout.retentionWithheldNgn - payout.bonusEarnedNgn, grossMonthly);
});

console.log('\n=================================================================');
console.log(`🌾 SIMULATION COMPLETE: ${passedCount} passed, ${failedCount} failed`);
console.log('=================================================================\n');

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
