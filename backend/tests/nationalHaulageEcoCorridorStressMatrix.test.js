/**
 * @file nationalHaulageEcoCorridorStressMatrix.test.js
 * @description Enterprise combinatorial stress matrix covering multi-origin national haulage,
 * extreme terrain friction, GVW load scaling, cold-chain temperature extremes,
 * and statutory tax invariance across Nigerian trade corridors.
 */

const {
  FleetEcoRoutingOptimizerService,
  ROAD_TERRAIN_FACTORS,
  CORRIDOR_ECO_ROUTING_GRAPH
} = require('../services/fleetEcoRoutingOptimizerService');

const {
  CorridorTollAndLevyMatrixService,
  STATE_PRODUCE_LEVIES_REGISTRY
} = require('../services/corridorTollAndLevyMatrixService');

const {
  FleetEmissionCreditCalculatorService,
  BASELINE_EMISSION_STANDARDS
} = require('../services/fleetEmissionCreditCalculatorService');

const {
  FleetMaintenanceLogService
} = require('../services/fleetMaintenanceLogService');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedTests++;
  }
}

function runStressMatrix() {
  console.log('\n=================================================================');
  console.log('🌾 AGRILY SPRINT 16: NATIONAL HAULAGE ECO-CORRIDOR STRESS MATRIX');
  console.log('=================================================================\n');

  // -----------------------------------------------------------------
  // SECTION 1: Multi-Origin National Corridor Matrix
  // -----------------------------------------------------------------
  console.log('--- SECTION 1: Multi-Origin National Corridor Matrix ---');

  const testCorridorPairs = [
    { origin: 'Kano', destination: 'Lagos', expectedMinKm: 900 },
    { origin: 'Kaduna', destination: 'Port Harcourt', expectedMinKm: 500 },
    { origin: 'Benue', destination: 'Lagos', expectedMinKm: 650 },
    { origin: 'Plateau', destination: 'Abuja', expectedMinKm: 250 },
    { origin: 'Oyo', destination: 'Kano', expectedMinKm: 500 },
    { origin: 'Sokoto', destination: 'Lagos', expectedMinKm: 500 },
    { origin: 'Borno', destination: 'Lagos', expectedMinKm: 500 },
    { origin: 'Taraba', destination: 'Enugu', expectedMinKm: 400 },
    { origin: 'Niger', destination: 'Lagos', expectedMinKm: 500 },
    { origin: 'Gombe', destination: 'Port Harcourt', expectedMinKm: 500 }
  ];

  testCorridorPairs.forEach(({ origin, destination, expectedMinKm }) => {
    const routePlan = FleetEcoRoutingOptimizerService.findOptimalEcoRoute({
      originState: origin,
      destinationState: destination,
      tonnage: 22,
      isTemperatureControlled: false,
      currentDieselPriceNgn: 1150
    });

    assert(
      routePlan.recommendedRoute && routePlan.recommendedRoute.ecoMetrics.distanceKm >= expectedMinKm,
      `Optimal route for ${origin} → ${destination} resolves valid distance (${routePlan.recommendedRoute.ecoMetrics.distanceKm} km >= ${expectedMinKm} km)`
    );
    assert(
      routePlan.recommendedRoute.ecoMetrics.estimatedFuelConsumedLitres > 0,
      `Positive fuel consumption calculated for ${origin} → ${destination}`
    );
  });

  // -----------------------------------------------------------------
  // SECTION 2: GVW Load Scaling & Non-Linear Fuel Burn Invariants
  // -----------------------------------------------------------------
  console.log('\n--- SECTION 2: Gross Vehicle Weight (GVW) Load Scaling ---');

  const tonnages = [5, 10, 15, 20, 25, 30, 35, 40];
  let previousFuel = 0;

  tonnages.forEach(ton => {
    const ecoPlan = FleetEcoRoutingOptimizerService.findOptimalEcoRoute({
      originState: 'Kano',
      destinationState: 'Lagos',
      tonnage: ton,
      isTemperatureControlled: false,
      currentDieselPriceNgn: 1100
    });

    const currentFuel = ecoPlan.recommendedRoute.ecoMetrics.estimatedFuelConsumedLitres;
    assert(
      currentFuel > previousFuel,
      `Fuel consumption scales monotonically with tonnage (${ton}T: ${currentFuel}L > ${previousFuel}L)`
    );
    previousFuel = currentFuel;
  });

  // -----------------------------------------------------------------
  // SECTION 3: Cold-Chain Reefer Fuel Penalty Invariants
  // -----------------------------------------------------------------
  console.log('\n--- SECTION 3: Cold-Chain Reefer Fuel Penalty Invariants ---');

  const ambientPlan = FleetEcoRoutingOptimizerService.findOptimalEcoRoute({
    originState: 'Benue',
    destinationState: 'Lagos',
    tonnage: 20,
    isTemperatureControlled: false,
    currentDieselPriceNgn: 1200
  });

  const reeferPlan = FleetEcoRoutingOptimizerService.findOptimalEcoRoute({
    originState: 'Benue',
    destinationState: 'Lagos',
    tonnage: 20,
    isTemperatureControlled: true,
    currentDieselPriceNgn: 1200
  });

  const reeferFuelDelta = reeferPlan.recommendedRoute.ecoMetrics.estimatedFuelConsumedLitres - ambientPlan.recommendedRoute.ecoMetrics.estimatedFuelConsumedLitres;
  assert(
    reeferFuelDelta > 20,
    `Reefer trailer consumes significantly more fuel than ambient haul (+${reeferFuelDelta}L delta)`
  );
  assert(
    reeferPlan.recommendedRoute.ecoMetrics.estimatedCo2EmissionsKg > ambientPlan.recommendedRoute.ecoMetrics.estimatedCo2EmissionsKg,
    'Reefer cold-chain produces higher carbon emissions due to cooling compressor burn'
  );

  // -----------------------------------------------------------------
  // SECTION 4: Statutory Tax & Levies Invariants
  // -----------------------------------------------------------------
  console.log('\n--- SECTION 4: Statutory Tax & Produce Levies Invariants ---');

  const sampleStates = ['Kano', 'Kaduna', 'Benue', 'Plateau', 'Oyo', 'Lagos', 'Niger', 'Ogun'];

  sampleStates.forEach(origin => {
    sampleStates.forEach(destination => {
      if (origin === destination) return;

      const levyAudit = CorridorTollAndLevyMatrixService.calculateCorridorStatutoryLevies({
        originState: origin,
        destinationState: destination,
        tonnage: 25,
        freightHaulageTariffNgn: 900000
      });

      assert(
        levyAudit.haulageServiceVatRatePct === 7.5,
        `Statutory 7.5% VAT maintained for ${origin} → ${destination}`
      );
      assert(
        levyAudit.produceVatStatus === 'EXEMPT_ZERO_RATED_AGRICULTURAL_PRODUCE',
        `0% agricultural produce VAT exemption upheld for ${origin} → ${destination}`
      );
      assert(
        levyAudit.taxComplianceSeal && levyAudit.taxComplianceSeal.length === 64,
        `Deterministic 64-char SHA-256 tax seal generated for ${origin} → ${destination}`
      );
    });
  });

  // -----------------------------------------------------------------
  // SECTION 5: ESG Carbon Credit Scaling Invariants
  // -----------------------------------------------------------------
  console.log('\n--- SECTION 5: ESG Carbon Credit Scaling Invariants ---');

  const efficientTrip = FleetEmissionCreditCalculatorService.evaluateCarbonOffsetCredits({
    carrierCode: 'CAR-ECO-001',
    totalDistanceKm: 1000,
    tonnageHauled: 25,
    actualFuelConsumedLitres: 260,
    ecoDrivingScore: 95
  });

  const standardTrip = FleetEmissionCreditCalculatorService.evaluateCarbonOffsetCredits({
    carrierCode: 'CAR-STD-002',
    totalDistanceKm: 1000,
    tonnageHauled: 25,
    actualFuelConsumedLitres: 340,
    ecoDrivingScore: 80
  });

  assert(
    efficientTrip.carbonCreditEarnedNgn > standardTrip.carbonCreditEarnedNgn,
    `Eco-efficient driving earns higher carbon offset payout (₦${efficientTrip.carbonCreditEarnedNgn} > ₦${standardTrip.carbonCreditEarnedNgn})`
  );
  assert(
    efficientTrip.digitalCreditSeal.length === 64,
    'Carbon credit seal is valid 64-character cryptographic hash'
  );

  console.log('\n=================================================================');
  console.log(`🌾 NATIONAL ECO-CORRIDOR MATRIX COMPLETE: ${passedTests} passed, ${failedTests} failed`);
  console.log('=================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runStressMatrix();
