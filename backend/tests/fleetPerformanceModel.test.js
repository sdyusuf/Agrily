/**
 * @file fleetPerformanceModel.test.js
 * @description Unit tests for FleetPerformanceLog, RegionalFreightBenchmark, and CarrierScorecard Mongoose models
 */

const assert = require('assert');
const FleetPerformanceLog = require('../models/FleetPerformanceLog');
const RegionalFreightBenchmark = require('../models/RegionalFreightBenchmark');
const CarrierScorecard = require('../models/CarrierScorecard');

console.log('=================================================================');
console.log('🌾 AGRILY SPRINT 16: FLEET PERFORMANCE MODELS UNIT TEST RUNNER');
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
// SECTION 1: FleetPerformanceLog Model Invariants
// -----------------------------------------------------------------------------
console.log('--- SECTION 1: FleetPerformanceLog Initialization & Calculations ---');

runTest('Generates unique tracking number starting with FLT-', () => {
  const log = new FleetPerformanceLog({
    vehicleRegNumber: 'ABC-123-XY',
    origin: { state: 'KANO' },
    destination: { state: 'LAGOS' },
    fuelAndEnergyTelemetry: { totalDistanceCoveredKm: 1000 }
  });

  const trackingNum = log.generateTrackingNumber();
  assert.strictEqual(typeof trackingNum, 'string');
  assert.strictEqual(trackingNum.startsWith('FLT-'), true);
});

runTest('Calculates turnaround durations across all lifecycle gates', () => {
  const now = Date.now();
  const log = new FleetPerformanceLog({
    vehicleRegNumber: 'KND-982-AA',
    origin: { state: 'KADUNA' },
    destination: { state: 'ABUJA' },
    fuelAndEnergyTelemetry: { totalDistanceCoveredKm: 210 },
    lifecycleTimestamps: {
      gateInOrigin: new Date(now),
      loadingStarted: new Date(now + 10 * 60000),
      loadingCompleted: new Date(now + 55 * 60000), // 45 min loading
      departureOrigin: new Date(now + 60 * 60000),
      gateInDestination: new Date(now + 240 * 60000), // 180 min transit
      docksideInspectionStarted: new Date(now + 250 * 60000),
      docksideInspectionCompleted: new Date(now + 270 * 60000), // 20 min inspection
      offloadingStarted: new Date(now + 280 * 60000),
      offloadingCompleted: new Date(now + 325 * 60000), // 45 min offload
      gateOutDestination: new Date(now + 330 * 60000)
    },
    turnaroundDurationsMinutes: {
      scheduledTransitTime: 150
    }
  });

  const dur = log.calculateTurnaroundBreakdowns();
  assert.strictEqual(dur.originLoadingTime, 45);
  assert.strictEqual(dur.transitTime, 180);
  assert.strictEqual(dur.docksideInspectionTime, 20);
  assert.strictEqual(dur.destinationOffloadingTime, 45);
  assert.strictEqual(dur.transitDelayMinutes, 30);
  assert.strictEqual(dur.totalTurnaroundTime, 330);
});

runTest('Computes fuel consumption, ton-km efficiency, and CO2 emissions', () => {
  const log = new FleetPerformanceLog({
    vehicleRegNumber: 'JOS-441-PL',
    origin: { state: 'PLATEAU' },
    destination: { state: 'RIVERS' },
    commodityDetails: {
      tonnageCarriedTonnes: 15.0
    },
    fuelAndEnergyTelemetry: {
      totalDistanceCoveredKm: 650,
      initialFuelLevelLitres: 250,
      refueledLitresDuringTrip: 100,
      finalFuelLevelLitres: 150 // Consumed = 200 Litres
    }
  });

  const fuel = log.calculateFuelAndCarbonMetrics(950);
  assert.strictEqual(fuel.fuelConsumedLitres, 200);
  assert.strictEqual(fuel.fuelEfficiencyKmPerLitre, 3.25); // 650 / 200
  // Ton-Km = 650 * 15 = 9750. Litres/Ton-Km = 200 / 9750 = 0.0205
  assert.strictEqual(fuel.litresPerTonKm, 0.0205);
  assert.strictEqual(fuel.fuelCostNgn, 190000); // 200 * 950
  assert.strictEqual(fuel.estimatedCo2EmissionsKg, 536); // 200 * 2.68
});

runTest('Evaluates eco-driving scorecard and assigns GREEN_CHAMPION tier', () => {
  const log = new FleetPerformanceLog({
    vehicleRegNumber: 'LAG-772-XA',
    origin: { state: 'OGUN' },
    destination: { state: 'LAGOS' },
    fuelAndEnergyTelemetry: { totalDistanceCoveredKm: 200 },
    ecoDrivingScorecard: {
      hardBrakingEventsCount: 0,
      rapidAccelerationCount: 1,
      speedingExcursionsCount: 0,
      excessiveIdlingDurationMinutes: 15
    }
  });

  const eco = log.evaluateEcoDrivingScore();
  assert.strictEqual(eco.ecoDrivingScore >= 88, true);
  assert.strictEqual(eco.ecoTier, 'GREEN_CHAMPION');
});

runTest('Generates SHA-256 telemetry checksum', () => {
  const log = new FleetPerformanceLog({
    vehicleRegNumber: 'EN-881-UG',
    origin: { state: 'ENUGU' },
    destination: { state: 'IMO' },
    fuelAndEnergyTelemetry: { totalDistanceCoveredKm: 120, fuelConsumedLitres: 40 }
  });

  log.generateTrackingNumber();
  const checksum = log.calculateTelemetryChecksum();
  assert.strictEqual(typeof checksum, 'string');
  assert.strictEqual(checksum.length, 64);
});

// -----------------------------------------------------------------------------
// SECTION 2: RegionalFreightBenchmark Model & Dynamic Tariff Engine
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 2: RegionalFreightBenchmark Tariff Calculation ---');

runTest('Calculates baseline quote for standard dry cargo', () => {
  const benchmark = new RegionalFreightBenchmark({
    benchmarkCode: 'BENCH-KN-LOS-01',
    corridorName: 'Kano-Lagos Grain Route',
    originState: 'KANO',
    destinationState: 'LAGOS',
    distanceKm: 1000,
    estimatedTransitHours: 36,
    baseTariffPerTonKmNgn: 30.0,
    dieselBenchmarkPriceNgn: 950,
    statutoryTollsAndLeviesNgn: 10000,
    minimumConsignmentTariffNgn: 50000,
    seasonalMultipliers: { drySeasonHarvest: 1.0 }
  });

  // 10 tons, dry season, normal diesel
  const quote = benchmark.calculateFreightQuote({
    tonnage: 10.0,
    isTemperatureControlled: false,
    currentDieselPriceNgn: 950,
    season: 'DRY_SEASON_HARVEST'
  });

  // Base = 1000 km * 10 ton * 30 = 300,000 NGN
  assert.strictEqual(quote.rawBaseFreightNgn, 300000);
  assert.strictEqual(quote.fuelSurchargeNgn, 0);
  assert.strictEqual(quote.reeferPremiumNgn, 0);
  assert.strictEqual(quote.statutoryTollsNgn, 10000);
  assert.strictEqual(quote.finalTariffNgn, 310000);
});

runTest('Applies diesel price surge and cold-chain reefer premium correctly', () => {
  const benchmark = new RegionalFreightBenchmark({
    benchmarkCode: 'BENCH-JS-PH-02',
    corridorName: 'Jos-Port Harcourt Perishable Corridor',
    originState: 'PLATEAU',
    destinationState: 'RIVERS',
    distanceKm: 800,
    estimatedTransitHours: 24,
    baseTariffPerTonKmNgn: 40.0,
    dieselBenchmarkPriceNgn: 950,
    dieselSensitivityCoeff: 0.5,
    reeferColdChainPremiumPct: 25.0,
    statutoryTollsAndLeviesNgn: 8000,
    seasonalMultipliers: { drySeasonHarvest: 1.0 }
  });

  // Diesel rose to 1140 (+20%). Sensitivity = 0.5 -> +10% fuel surcharge
  // Reefer = +25%
  const quote = benchmark.calculateFreightQuote({
    tonnage: 5.0,
    isTemperatureControlled: true,
    currentDieselPriceNgn: 1140,
    season: 'DRY_SEASON_HARVEST'
  });

  // Base = 800 * 5 * 40 = 160,000 NGN
  assert.strictEqual(quote.rawBaseFreightNgn, 160000);
  assert.strictEqual(quote.fuelSurchargeNgn, 16000); // 10% of 160k
  assert.strictEqual(quote.reeferPremiumNgn, 40000); // 25% of 160k
  // Subtotal = 160,000 + 16,000 + 40,000 = 216,000 + 8,000 tolls = 224,000 NGN
  assert.strictEqual(quote.finalTariffNgn, 224000);
});

runTest('Enforces minimum consignment tariff floor protection', () => {
  const benchmark = new RegionalFreightBenchmark({
    benchmarkCode: 'BENCH-IB-LG-03',
    corridorName: 'Ibadan-Lagos Short Shuttle',
    originState: 'OYO',
    destinationState: 'LAGOS',
    distanceKm: 120,
    estimatedTransitHours: 3,
    baseTariffPerTonKmNgn: 35.0,
    minimumConsignmentTariffNgn: 50000
  });

  // Small 0.5 ton load: raw = 120 * 0.5 * 35 = 2,100 NGN -> floor kicks in!
  const quote = benchmark.calculateFreightQuote({
    tonnage: 0.5,
    isTemperatureControlled: false
  });

  assert.strictEqual(quote.finalTariffNgn, 50000);
});

// -----------------------------------------------------------------------------
// SECTION 3: CarrierScorecard Model & Ranking Logic
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 3: CarrierScorecard Composite Ranking & Bonuses ---');

runTest('Assigns PLATINUM_AGRO_CARRIER and 4.5% bonus to elite carrier', () => {
  const scorecard = new CarrierScorecard({
    carrierCode: 'CAR-EXCELLENCE-01',
    carrierName: 'Kano Express Haulage Ltd',
    contactPhone: '+2348031234567',
    fleetSize: 12,
    lifetimeMetrics: {
      totalTripsAssigned: 50,
      completedTrips: 50,
      onTimeDeliveries: 48, // 96% on time
      coldChainExcursionIncidents: 0,
      cargoDamageClaimsCount: 0
    },
    compositeScores: {
      ecoEfficiencyScore: 92
    }
  });

  scorecard.recalculatePerformanceScores();
  assert.strictEqual(scorecard.tier, 'PLATINUM_AGRO_CARRIER');
  assert.strictEqual(scorecard.compositeScores.overallCarrierScore >= 92, true);
  assert.strictEqual(scorecard.incentivesAndGuarantees.freightPaymentBonusPct, 4.5);
  assert.strictEqual(scorecard.incentivesAndGuarantees.retentionEscrowRequiredPct, 0);
  assert.strictEqual(scorecard.incentivesAndGuarantees.priorityDispatchAccess, true);
});

runTest('Suspends carrier with multiple damage claims and poor score', () => {
  const scorecard = new CarrierScorecard({
    carrierCode: 'CAR-RISKY-02',
    carrierName: 'Negligent Hauler Logistics',
    contactPhone: '+2348099887766',
    fleetSize: 2,
    lifetimeMetrics: {
      totalTripsAssigned: 10,
      completedTrips: 10,
      onTimeDeliveries: 4, // 40% on time
      coldChainExcursionIncidents: 5,
      cargoDamageClaimsCount: 4 // Exceeds threshold
    },
    compositeScores: {
      ecoEfficiencyScore: 40
    }
  });

  scorecard.recalculatePerformanceScores();
  assert.strictEqual(scorecard.tier, 'SUSPENDED');
  assert.strictEqual(scorecard.incentivesAndGuarantees.retentionEscrowRequiredPct, 30);
  assert.strictEqual(scorecard.incentivesAndGuarantees.priorityDispatchAccess, false);
});

runTest('Defaults new carrier with zero trips to PROBATIONARY_CARRIER', () => {
  const scorecard = new CarrierScorecard({
    carrierCode: 'CAR-NEW-03',
    carrierName: 'Fresh Start Transport',
    contactPhone: '+2348145551234'
  });

  scorecard.recalculatePerformanceScores();
  assert.strictEqual(scorecard.tier, 'PROBATIONARY_CARRIER');
  assert.strictEqual(scorecard.incentivesAndGuarantees.retentionEscrowRequiredPct, 15);
});

console.log('\n=================================================================');
console.log(`🌾 TEST SUITE COMPLETE: ${passedCount} passed, ${failedCount} failed`);
console.log('=================================================================\n');

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
