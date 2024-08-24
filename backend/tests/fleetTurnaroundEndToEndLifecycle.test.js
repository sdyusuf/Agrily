/**
 * @file fleetTurnaroundEndToEndLifecycle.test.js
 * @description End-to-End Operational Lifecycle & Multi-Party Haulage Settlement Runner
 * Simulates complete trip progression from origin gate-in to destination offloading,
 * automated milestone triggers, fuel accounting, and carrier bonus disbursements.
 */

const assert = require('assert');
const FleetPerformanceLog = require('../models/FleetPerformanceLog');
const CarrierScorecard = require('../models/CarrierScorecard');
const FleetAnalyticsEngine = require('../services/fleetAnalyticsEngine');
const CarrierRankingService = require('../services/carrierRankingService');
const FleetEcosystemExportService = require('../services/fleetEcosystemExportService');
const { FreightPricingIndexService } = require('../services/freightPricingIndexService');

console.log('=================================================================');
console.log('🌾 AGRILY SPRINT 16: FLEET TURNAROUND E2E LIFECYCLE RUNNER');
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
// PHASE 1: Trip Initialization & Freight Quotation
// -----------------------------------------------------------------------------
console.log('--- PHASE 1: Trip Initialization & Dynamic Freight Quotation ---');

let quote;
runTest('Initializes trip quote for Kano to Lagos 20T maize haul', () => {
  quote = FreightPricingIndexService.calculateTariffQuote({
    originState: 'KANO',
    destinationState: 'LAGOS',
    tonnage: 20.0,
    currentDieselPriceNgn: 1050,
    season: 'DRY_SEASON_HARVEST'
  });

  assert.strictEqual(quote.originState, 'KANO');
  assert.strictEqual(quote.destinationState, 'LAGOS');
  assert.strictEqual(quote.distanceKm, 995);
  assert.strictEqual(quote.finalTariffNgn > 500000, true);
});

// -----------------------------------------------------------------------------
// PHASE 2: Trip Lifecycle Milestone Progression
// -----------------------------------------------------------------------------
console.log('\n--- PHASE 2: Trip Lifecycle Milestone Progression ---');

let performanceLog;
runTest('Progresses trip through origin loading, transit, inspection, and offloading', () => {
  const startTime = Date.now() - 36 * 3600000;

  performanceLog = new FleetPerformanceLog({
    vehicleRegNumber: 'KN-882-TRK',
    vehicleType: 'HEAVY_HAULER_30_TON',
    corridorId: 'COR-NW-01',
    corridorName: 'Kano-Lagos Grain Expressway',
    origin: {
      state: 'KANO',
      facilityName: 'Dawanau Grain Aggregation Depot',
      scheduledDeparture: new Date(startTime + 2 * 3600000),
      actualDeparture: new Date(startTime + 2.5 * 3600000)
    },
    destination: {
      state: 'LAGOS',
      facilityName: 'Mile 12 Central Wholesale Terminal',
      scheduledArrival: new Date(startTime + 35 * 3600000),
      actualArrival: new Date(startTime + 34 * 3600000)
    },
    commodityDetails: {
      commodityName: 'White Maize (Grade A)',
      tonnageCarriedTonnes: 20.0
    },
    lifecycleTimestamps: {
      gateInOrigin: new Date(startTime),
      loadingStarted: new Date(startTime + 30 * 60000),
      loadingCompleted: new Date(startTime + 120 * 60000), // 90 min loading
      departureOrigin: new Date(startTime + 150 * 60000),
      gateInDestination: new Date(startTime + 33 * 3600000), // 30.5 hr transit
      docksideInspectionStarted: new Date(startTime + 33.5 * 3600000),
      docksideInspectionCompleted: new Date(startTime + 34 * 3600000), // 30 min inspection
      offloadingStarted: new Date(startTime + 34.5 * 3600000),
      offloadingCompleted: new Date(startTime + 35.5 * 3600000), // 60 min offload
      gateOutDestination: new Date(startTime + 36 * 3600000)
    },
    fuelAndEnergyTelemetry: {
      totalDistanceCoveredKm: 995,
      initialFuelLevelLitres: 400,
      refueledLitresDuringTrip: 150,
      finalFuelLevelLitres: 240 // Consumed = 310L
    },
    ecoDrivingScorecard: {
      hardBrakingEventsCount: 2,
      rapidAccelerationCount: 1,
      excessiveIdlingDurationMinutes: 25
    }
  });

  performanceLog.generateTrackingNumber();
  performanceLog.calculateTurnaroundBreakdowns();
  performanceLog.calculateFuelAndCarbonMetrics(1050);
  performanceLog.evaluateEcoDrivingScore();
  performanceLog.calculateTelemetryChecksum();

  assert.strictEqual(performanceLog.turnaroundDurationsMinutes.originLoadingTime, 90);
  assert.strictEqual(performanceLog.turnaroundDurationsMinutes.docksideInspectionTime, 30);
  assert.strictEqual(performanceLog.turnaroundDurationsMinutes.destinationOffloadingTime, 60);
  assert.strictEqual(performanceLog.fuelAndEnergyTelemetry.fuelConsumedLitres, 310);
  assert.strictEqual(performanceLog.ecoDrivingScorecard.ecoTier, 'GREEN_CHAMPION');
  assert.strictEqual(typeof performanceLog.telemetryChecksum, 'string');
});

// -----------------------------------------------------------------------------
// PHASE 3: Audit Dossier & Carrier Settlement
// -----------------------------------------------------------------------------
console.log('\n--- PHASE 3: Carrier Scorecard & Audit Dossier Sealing ---');

runTest('Generates signed digital audit dossier and computes carrier bonus', () => {
  const scorecard = new CarrierScorecard({
    carrierCode: 'CAR-001',
    carrierName: 'Arewa Express Haulage Ltd',
    tier: 'PLATINUM_AGRO_CARRIER',
    compositeScores: { overallCarrierScore: 96 },
    incentivesAndGuarantees: { freightPaymentBonusPct: 4.5, retentionEscrowRequiredPct: 0 }
  });

  const dossier = FleetEcosystemExportService.compileTripAuditDossier({
    performanceLog,
    carrierScorecard: scorecard,
    tariffQuote: quote
  });

  assert.strictEqual(typeof dossier.digitalSeal, 'string');
  assert.strictEqual(dossier.dossierId.startsWith('DOSSIER-'), true);
  assert.strictEqual(dossier.carrierRatingSnapshot.carrierTier, 'PLATINUM_AGRO_CARRIER');

  const payout = CarrierRankingService.calculateMonthlyCarrierPayout({
    carrierScorecard: scorecard,
    monthlyGrossFreightNgn: quote.finalTariffNgn
  });

  assert.strictEqual(payout.bonusEarnedNgn > 0, true);
  assert.strictEqual(payout.retentionWithheldNgn, 0); // 0% retention for Platinum
  assert.strictEqual(payout.netDisbursedNgn > payout.monthlyGrossFreightNgn, true);
});

console.log('\n=================================================================');
console.log(`🌾 LIFECYCLE COMPLETE: ${passed} passed, ${failed} failed`);
console.log('=================================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
