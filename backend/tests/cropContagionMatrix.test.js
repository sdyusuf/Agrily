/**
 * @file cropContagionMatrix.test.js
 * @description Outbreak cluster contagion propagation and phytosanitary quarantine matrix tests.
 */

const assert = require('assert');
const { CropOutbreakContagionService, BASELINE_REGIONAL_OUTBREAK_DATA } = require('../services/cropOutbreakContagionService');
const { NIGERIAN_STATES, OUTBREAK_STATUSES } = require('../models/DiseaseOutbreakTelemetry');

console.log('=================================================================');
console.log('🌾 AGRILY SPRINT 17: CROP CONTAGION & REGIONAL OUTBREAK MATRIX');
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
// SECTION 1: 37 Jurisdiction Coverage & Summary Metrics
// -----------------------------------------------------------------------------
console.log('--- SECTION 1: National Telemetry & 37 Jurisdiction Coverage ---');

runTest('Covers all 37 Nigerian states and FCT in national telemetry', () => {
  const telemetry = CropOutbreakContagionService.getOutbreakTelemetrySummary();

  assert.strictEqual(telemetry.success, true);
  assert.strictEqual(telemetry.summary.totalStatesMonitored, 37);
  assert.strictEqual(telemetry.clusters.length, 37);

  // Verify all 37 are represented
  const stateNames = telemetry.clusters.map(c => c.state);
  NIGERIAN_STATES.forEach(state => {
    assert.ok(stateNames.includes(state), `Missing telemetry for state: ${state}`);
  });
});

runTest('Aggregates accurate active contagion clusters count', () => {
  const telemetry = CropOutbreakContagionService.getOutbreakTelemetrySummary();

  assert.strictEqual(telemetry.summary.activeOutbreakClustersCount, BASELINE_REGIONAL_OUTBREAK_DATA.length);
  assert.ok(telemetry.summary.totalHectaresUnderQuarantine > 500);
  assert.ok(telemetry.nationalTelemetrySeal.length === 64);
});

// -----------------------------------------------------------------------------
// SECTION 2: Quarantine Buffers & Corridor Checkpoints
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 2: Quarantine Perimeters & Freight Corridor Clearance ---');

runTest('Interdicts transit and enforces 25km buffer for Plateau Late Blight lockdown', () => {
  const clearance = CropOutbreakContagionService.checkCorridorPhytosanitaryClearance('PLATEAU');

  assert.strictEqual(clearance.isTransitInterdicted, true);
  assert.strictEqual(clearance.corridorClearance, 'TRANSIT_PROHIBITED_QUARANTINE_ACTIVE');
  assert.strictEqual(clearance.quarantineRadiusKm, 25.0);
  assert.strictEqual(clearance.primaryCropAffected, 'TOMATO');
  assert.ok(clearance.advisory.includes('HAULAGE ALERT'));
});

runTest('Enforces caution inspection for moderate spread zones (Kano, Benue, Kaduna)', () => {
  const kanoClearance = CropOutbreakContagionService.checkCorridorPhytosanitaryClearance('KANO');
  assert.strictEqual(kanoClearance.isTransitInterdicted, false);
  assert.strictEqual(kanoClearance.corridorClearance, 'TRANSIT_CAUTION_INSPECTION_MANDATORY');
  assert.strictEqual(kanoClearance.quarantineRadiusKm, 8.0);

  const benueClearance = CropOutbreakContagionService.checkCorridorPhytosanitaryClearance('BENUE');
  assert.strictEqual(benueClearance.isTransitInterdicted, false);
  assert.strictEqual(benueClearance.quarantineRadiusKm, 8.0);
});

runTest('Unrestricted transit cleared for unaffected states (Lagos, Ogun, Rivers)', () => {
  const lagosClearance = CropOutbreakContagionService.checkCorridorPhytosanitaryClearance('LAGOS');
  assert.strictEqual(lagosClearance.isTransitInterdicted, false);
  assert.strictEqual(lagosClearance.corridorClearance, 'UNRESTRICTED_TRANSIT_CLEARED');
  assert.strictEqual(lagosClearance.quarantineRadiusKm, 0);
});

// -----------------------------------------------------------------------------
// SECTION 3: Dynamic Incident Outbreak Reporting
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 3: Dynamic Incident Reporting & Triage Escalation ---');

runTest('Escalates >50 cases / >200 Ha to CRITICAL_QUARANTINE_LOCKDOWN', () => {
  const report = CropOutbreakContagionService.reportOutbreakCluster({
    state: 'KATSINA',
    cropType: 'TOMATO',
    reportedCasesCount: 65,
    confirmedAcreageHectares: 250.0
  });

  assert.strictEqual(report.success, true);
  assert.strictEqual(report.outbreakStatus, 'CRITICAL_QUARANTINE_LOCKDOWN');
  assert.strictEqual(report.quarantineRadiusKm, 25.0);
  assert.strictEqual(report.isTransitInterdicted, true);
  assert.ok(report.quarantineEnactedAt !== null);
  assert.ok(report.verificationHash.length === 64);
});

runTest('Assigns MODERATE_SPREAD_WATCH for medium scale incidents', () => {
  const report = CropOutbreakContagionService.reportOutbreakCluster({
    state: 'BAUCHI',
    cropType: 'MAIZE',
    reportedCasesCount: 15,
    confirmedAcreageHectares: 40.0
  });

  assert.strictEqual(report.outbreakStatus, 'MODERATE_SPREAD_WATCH');
  assert.strictEqual(report.quarantineRadiusKm, 8.0);
  assert.strictEqual(report.isTransitInterdicted, false);
});

runTest('Rejects outbreak reports with invalid state name', () => {
  assert.throws(() => {
    CropOutbreakContagionService.reportOutbreakCluster({
      state: 'INVALID_STATE_XYZ',
      cropType: 'RICE'
    });
  }, /Invalid Nigerian state/);
});

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n=================================================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('=================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
