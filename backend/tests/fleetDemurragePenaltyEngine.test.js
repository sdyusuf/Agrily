/**
 * @file fleetDemurragePenaltyEngine.test.js
 * @description Unit & invariant tests for FleetDemurragePenaltyEngineService
 */

const {
  FleetDemurragePenaltyEngineService,
  TERMINAL_DEMURRAGE_STANDARDS
} = require('../services/fleetDemurragePenaltyEngineService');

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

function runDemurrageTests() {
  console.log('\n=================================================================');
  console.log('🌾 AGRILY SPRINT 16: FLEET DEMURRAGE PENALTY ENGINE TESTS');
  console.log('=================================================================\n');

  // -----------------------------------------------------------------
  // SECTION 1: Free Dwell Allowance Compliance
  // -----------------------------------------------------------------
  console.log('--- SECTION 1: Free Dwell Allowance Compliance ---');

  const now = Date.now();
  const threeHoursAgo = new Date(now - 3 * 3600 * 1000).toISOString();
  const currentTime = new Date(now).toISOString();

  const freeResult = FleetDemurragePenaltyEngineService.calculateTerminalDemurrage({
    tripId: 'TRP-DEM-001',
    carrierCode: 'CARRIER-KANO-01',
    cargoCategory: 'DRY_GRAIN_AGGREGATION',
    gateInTime: threeHoursAgo,
    gateOutTime: currentTime
  });

  assert(freeResult.timestamps.totalDwellHours === 3.0, 'Computes accurate total dwell duration (3.0 hours)');
  assert(freeResult.timestamps.billableDetentionHours === 0, 'No billable detention when within 4.0 hr grain allowance');
  assert(freeResult.financialBreakdown.totalDemurragePayableNgn === 0, 'Total demurrage fee is ₦0 for punctual turnarounds');
  assert(freeResult.detentionClassification === 'WITHIN_FREE_WINDOW', 'Classifies turnaround as WITHIN_FREE_WINDOW');

  // -----------------------------------------------------------------
  // SECTION 2: Billable Detention & Perishable Reefer Penalties
  // -----------------------------------------------------------------
  console.log('\n--- SECTION 2: Billable Detention & Perishable Reefer Penalties ---');

  const eightHoursAgo = new Date(now - 8 * 3600 * 1000).toISOString();

  const detentionResult = FleetDemurragePenaltyEngineService.calculateTerminalDemurrage({
    tripId: 'TRP-DEM-002',
    carrierCode: 'CARRIER-COLD-02',
    vehicleType: 'HEAVY_DUTY_30T_RIGID',
    cargoCategory: 'PERISHABLE_COLD_CHAIN',
    gateInTime: eightHoursAgo,
    gateOutTime: currentTime,
    hasReeferAuxEngineRunning: true
  });

  // Perishable free window is 2.0 hrs, so billable detention is 8 - 2 = 6.0 hrs
  assert(detentionResult.timestamps.billableDetentionHours === 6.0, 'Accurately computes 6.0 hours detention for perishable cargo');
  assert(detentionResult.financialBreakdown.baseDetentionFeeNgn > 0, 'Applies positive base detention penalty');
  assert(detentionResult.financialBreakdown.reeferDieselAuxPenaltyNgn > 0, 'Calculates auxiliary diesel loss for stationary reefer chiller');
  assert(detentionResult.carrierCompensationPayoutNgn > 0, 'Allocates 90% detention compensation to affected driver');
  assert(detentionResult.demurrageSeal && detentionResult.demurrageSeal.length === 64, 'Generates 64-char SHA-256 tamper-evident invoice seal');

  // -----------------------------------------------------------------
  // SECTION 3: Night Stayover Surcharge (> 18h Gridlock)
  // -----------------------------------------------------------------
  console.log('\n--- SECTION 3: Night Stayover Surcharge (> 18h Gridlock) ---');

  const twentyFourHoursAgo = new Date(now - 24 * 3600 * 1000).toISOString();

  const gridlockResult = FleetDemurragePenaltyEngineService.calculateTerminalDemurrage({
    tripId: 'TRP-DEM-003',
    carrierCode: 'CARRIER-HEAVY-03',
    cargoCategory: 'DRY_GRAIN_AGGREGATION',
    gateInTime: twentyFourHoursAgo,
    gateOutTime: currentTime
  });

  assert(gridlockResult.ratesApplied.nightStayoversCount === 1, 'Flags 1 overnight terminal stayover event');
  assert(gridlockResult.financialBreakdown.nightStayoverSurchargeTotalNgn === 30000, 'Applies ₦30,000 statutory night stayover surcharge');
  assert(gridlockResult.detentionClassification === 'SEVERE_TERMINAL_GRIDLOCK', 'Marks severe terminal gridlock');

  console.log('\n=================================================================');
  console.log(`🌾 DEMURRAGE TESTS COMPLETE: ${passedTests} passed, ${failedTests} failed`);
  console.log('=================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runDemurrageTests();
