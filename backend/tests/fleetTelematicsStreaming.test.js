/**
 * @file fleetTelematicsStreaming.test.js
 * @description Unit tests for FleetTelematicsStreamingService
 */

const assert = require('assert');
const {
  FleetTelematicsStreamingService,
  AGRO_HUB_GEOFENCES
} = require('../services/fleetTelematicsStreamingService');

console.log('=================================================================');
console.log('🌾 AGRILY SPRINT 16: FLEET TELEMATICS STREAMING TESTS');
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
// SECTION 1: Distance Calculation & Geofencing
// -----------------------------------------------------------------------------
console.log('--- SECTION 1: Geofence Detection in Major Nigerian Markets ---');

runTest('Detects truck inside Dawanau Grain Market geofence', () => {
  // Coordinates very close to Dawanau Market centroid
  const status = FleetTelematicsStreamingService.evaluateHubGeofences(12.0620, 8.4415);
  assert.strictEqual(status.insideHub, true);
  assert.strictEqual(status.hubId, 'HUB-KAN-DAWANAU');
  assert.strictEqual(status.hubType, 'GRAIN_AGGREGATION_DEPOT');
  assert.strictEqual(status.distanceFromCentroidMetres < 100, true);
});

runTest('Detects truck inside Mile 12 Market Lagos geofence', () => {
  const status = FleetTelematicsStreamingService.evaluateHubGeofences(6.6080, 3.3980);
  assert.strictEqual(status.insideHub, true);
  assert.strictEqual(status.hubId, 'HUB-LOS-MILE12');
  assert.strictEqual(status.hubType, 'METROPOLITAN_CONSUMPTION_TERMINAL');
});

runTest('Marks open highway coordinates outside all agro-hub geofences', () => {
  const status = FleetTelematicsStreamingService.evaluateHubGeofences(8.5000, 5.5000); // Between Jebba & Mokwa
  assert.strictEqual(status.insideHub, false);
  assert.strictEqual(status.hubId, null);
});

// -----------------------------------------------------------------------------
// SECTION 2: Telematics Alerts & Automated Milestones
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 2: Telematics Alerts & Trip Milestones ---');

runTest('Triggers SPEEDING_EXCURSION alert when truck travels at 105 km/h', () => {
  const packet = FleetTelematicsStreamingService.ingestTelematicsPing({
    vehicleRegNumber: 'KN-772-KND',
    latitude: 11.2000,
    longitude: 7.7000,
    speedKmh: 105.0,
    maxPermissibleSpeedKmh: 85.0
  });

  assert.strictEqual(packet.alertsCount >= 1, true);
  const speedAlert = packet.activeAlerts.find(a => a.type === 'SPEEDING_EXCURSION');
  assert.strictEqual(!!speedAlert, true);
  assert.strictEqual(speedAlert.recordedSpeedKmh, 105.0);
  assert.strictEqual(typeof packet.packetHash, 'string');
});

runTest('Triggers COLD_CHAIN_TEMPERATURE_BREACH alert when tomato cargo rises to 18°C', () => {
  const packet = FleetTelematicsStreamingService.ingestTelematicsPing({
    vehicleRegNumber: 'PL-311-JOS',
    latitude: 9.9540,
    longitude: 8.8840,
    speedKmh: 45.0,
    cargoTempCelsius: 18.5,
    temperatureControlled: true,
    maxPermissibleTemp: 10.0
  });

  const tempAlert = packet.activeAlerts.find(a => a.type === 'COLD_CHAIN_TEMPERATURE_BREACH');
  assert.strictEqual(!!tempAlert, true);
  assert.strictEqual(tempAlert.recordedTempCelsius, 18.5);
  assert.strictEqual(packet.suggestedMilestoneEvent, 'GATE_IN_ORIGIN_AGGREGATION');
});

console.log('\n=================================================================');
console.log(`🌾 TEST SUITE COMPLETE: ${passed} passed, ${failed} failed`);
console.log('=================================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
