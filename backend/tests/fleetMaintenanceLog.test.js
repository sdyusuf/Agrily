/**
 * @file fleetMaintenanceLog.test.js
 * @description Unit tests for FleetMaintenanceLogService
 */

const assert = require('assert');
const {
  FleetMaintenanceLogService,
  MAINTENANCE_INTERVALS_KM
} = require('../services/fleetMaintenanceLogService');

console.log('=================================================================');
console.log('🌾 AGRILY SPRINT 16: FLEET MAINTENANCE & ROADWORTHINESS TESTS');
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
// SECTION 1: Service Intervals & Roadworthiness Scoring
// -----------------------------------------------------------------------------
console.log('--- SECTION 1: Roadworthiness Clearance & Diagnostics ---');

runTest('Issues APPROVED_FOR_LONG_HAUL for freshly serviced truck', () => {
  const audit = FleetMaintenanceLogService.assessVehicleRoadworthiness({
    vehicleRegNumber: 'ABJ-111-AA',
    odometerKm: 50000,
    lastOilChangeKm: 48000,
    lastBrakeServiceKm: 45000,
    lastTireRotationKm: 45000,
    isRefrigerated: false
  });

  assert.strictEqual(audit.roadworthinessScore, 100);
  assert.strictEqual(audit.dispatchClearance, 'APPROVED_FOR_LONG_HAUL');
  assert.strictEqual(audit.pendingMaintenanceCount, 0);
  assert.strictEqual(typeof audit.roadworthinessSeal, 'string');
  assert.strictEqual(audit.roadworthinessSeal.length, 64);
});

runTest('Flags GROUNDED_SAFETY_STANDSTILL when brakes and oil are severely overdue', () => {
  const audit = FleetMaintenanceLogService.assessVehicleRoadworthiness({
    vehicleRegNumber: 'KN-999-DNG',
    odometerKm: 120000,
    lastOilChangeKm: 100000, // 20k overdue (max 10k)
    lastBrakeServiceKm: 80000, // 40k overdue (max 25k)
    lastTireRotationKm: 100000, // 20k overdue
    isRefrigerated: false
  });

  assert.strictEqual(audit.roadworthinessScore < 50, true);
  assert.strictEqual(audit.dispatchClearance, 'GROUNDED_SAFETY_STANDSTILL');
  assert.strictEqual(audit.pendingMaintenanceCount >= 3, true);
  assert.strictEqual(audit.totalEstimatedMaintenanceCostNgn > 100000, true);
});

runTest('Detects overdue reefer compressor overhaul on refrigerated trailer', () => {
  const audit = FleetMaintenanceLogService.assessVehicleRoadworthiness({
    vehicleRegNumber: 'JOS-552-REF',
    odometerKm: 95000,
    lastOilChangeKm: 92000,
    lastBrakeServiceKm: 85000,
    lastTireRotationKm: 90000,
    lastReeferServiceKm: 55000, // 40k overdue (max 30k)
    isRefrigerated: true
  });

  const reeferAction = audit.pendingMaintenanceActions.find(a => a.component === 'REEFER_COMPRESSOR');
  assert.strictEqual(!!reeferAction, true);
  assert.strictEqual(reeferAction.severity, 'HIGH_COLD_CHAIN_RISK');
  assert.strictEqual(audit.roadworthinessScore, 75);
  assert.strictEqual(audit.dispatchClearance, 'APPROVED_FOR_LONG_HAUL');
});

console.log('\n=================================================================');
console.log(`🌾 TEST SUITE COMPLETE: ${passed} passed, ${failed} failed`);
console.log('=================================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
