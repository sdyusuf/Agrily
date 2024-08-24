/**
 * @file fleetEcoRoutingOptimizer.test.js
 * @description Unit tests for FleetEcoRoutingOptimizerService
 */

const assert = require('assert');
const {
  FleetEcoRoutingOptimizerService,
  ROAD_TERRAIN_FACTORS,
  CORRIDOR_ECO_ROUTING_GRAPH
} = require('../services/fleetEcoRoutingOptimizerService');

console.log('=================================================================');
console.log('🌾 AGRILY SPRINT 16: FLEET ECO-ROUTING OPTIMIZER TESTS');
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
// SECTION 1: Terrain Road Friction Metrics
// -----------------------------------------------------------------------------
console.log('--- SECTION 1: Terrain Friction & Fuel Efficiency Penalties ---');

runTest('Smooth dual carriageway delivers highest effective km/L efficiency', () => {
  const smooth = FleetEcoRoutingOptimizerService.evaluateRouteEcoMetrics({
    distanceKm: 500,
    terrainProfileKey: 'DUAL_CARRIAGEWAY_PAVED_SMOOTH',
    tonnage: 10.0,
    vehicleBaselineKmL: 3.8
  });

  const potholed = FleetEcoRoutingOptimizerService.evaluateRouteEcoMetrics({
    distanceKm: 500,
    terrainProfileKey: 'DEGRADED_POTHOLE_CORRIDOR',
    tonnage: 10.0,
    vehicleBaselineKmL: 3.8
  });

  assert.strictEqual(smooth.effectiveFuelEfficiencyKmL > potholed.effectiveFuelEfficiencyKmL, true);
  assert.strictEqual(smooth.estimatedFuelConsumedLitres < potholed.estimatedFuelConsumedLitres, true);
});

// -----------------------------------------------------------------------------
// SECTION 2: Optimal Eco-Path Finding
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 2: Multi-Route Optimization Comparison ---');

runTest('Finds greenest path between Kano and Lagos with positive diesel savings', () => {
  const opt = FleetEcoRoutingOptimizerService.findOptimalEcoRoute({
    originState: 'KANO',
    destinationState: 'LAGOS',
    tonnage: 15.0,
    currentDieselPriceNgn: 950
  });

  assert.strictEqual(typeof opt.optimizationId, 'string');
  assert.strictEqual(opt.optimizationId.startsWith('ECO-OPT-'), true);
  assert.strictEqual(opt.allEvaluatedRoutes.length >= 3, true);
  assert.strictEqual(opt.recommendedRoute.ecoMetrics.estimatedFuelConsumedLitres > 0, true);
  assert.strictEqual(opt.projectedSavings.fuelSavedLitres >= 0, true);
  assert.strictEqual(opt.projectedSavings.costSavedNgn >= 0, true);
});

runTest('Reefer cold-chain load incurs higher fuel consumption than ambient load', () => {
  const ambientOpt = FleetEcoRoutingOptimizerService.findOptimalEcoRoute({
    originState: 'PLATEAU',
    destinationState: 'RIVERS',
    tonnage: 10.0,
    isTemperatureControlled: false
  });

  const reeferOpt = FleetEcoRoutingOptimizerService.findOptimalEcoRoute({
    originState: 'PLATEAU',
    destinationState: 'RIVERS',
    tonnage: 10.0,
    isTemperatureControlled: true
  });

  assert.strictEqual(
    reeferOpt.recommendedRoute.ecoMetrics.estimatedFuelConsumedLitres >
    ambientOpt.recommendedRoute.ecoMetrics.estimatedFuelConsumedLitres,
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
