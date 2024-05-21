/**
 * TelemetryPing Model Unit Tests
 */

const assert = require('assert');
const { TelemetryPing } = require('../models/TelemetryPing');

console.log('\n======================================================');
console.log('   RUNNING AGRILY TELEMETRY PING MODEL UNIT TESTS     ');
console.log('======================================================\n');

let passedTests = 0;
let failedTests = 0;

const runTest = async (description, testFn) => {
  try {
    await testFn();
    console.log(`  PASS: ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  FAIL: ${description}`);
    console.error(`        ${err.message}`);
    failedTests++;
  }
};

const createValidPingPayload = () => ({
  driverEmail: 'driver.kofi@agrilylogistics.com',
  driverName: 'Kofi Mensah Boateng',
  consignmentOrderId: 'ORD-2024-GH-99812',
  vehicleRegistration: 'GT-4819-23',
  location: {
    type: 'Point',
    coordinates: [-0.1870, 5.6037] // [lng, lat]
  },
  speedKmh: 68.5,
  headingDegrees: 182,
  altitudeMeters: 45,
  accuracyMeters: 3.2,
  batteryLevelPct: 88,
  isCharging: false,
  isStationary: false,
  odometerKm: 14205.8,
  cargoTemperatureC: 3.5,
  recordedAt: new Date()
});

(async () => {
  await runTest('Creates valid TelemetryPing instance without validation errors', () => {
    const ping = new TelemetryPing(createValidPingPayload());
    const err = ping.validateSync();
    assert.strictEqual(err, undefined);
    assert.strictEqual(ping.driverEmail, 'driver.kofi@agrilylogistics.com');
    assert.strictEqual(ping.consignmentOrderId, 'ORD-2024-GH-99812');
    assert.strictEqual(ping.location.type, 'Point');
    assert.strictEqual(ping.location.coordinates[0], -0.1870);
    assert.strictEqual(ping.location.coordinates[1], 5.6037);
  });

  await runTest('Validates required fields (driverEmail, consignmentOrderId, location, speedKmh)', () => {
    const emptyPing = new TelemetryPing({});
    const err = emptyPing.validateSync();
    assert(err, 'Expected validation error');
    assert(err.errors.driverEmail, 'Expected driverEmail validation error');
    assert(err.errors.consignmentOrderId, 'Expected consignmentOrderId validation error');
    assert(err.errors.location, 'Expected location validation error');
    assert(err.errors.speedKmh, 'Expected speedKmh validation error');
  });

  await runTest('Rejects malformed GeoJSON coordinates (out of bound lat/lng)', () => {
    const badCoordsPing = new TelemetryPing({
      ...createValidPingPayload(),
      location: {
        type: 'Point',
        coordinates: [195, 95] // Invalid longitude > 180 and latitude > 90
      }
    });
    const err = badCoordsPing.validateSync();
    assert(err, 'Expected coordinate validation error');
    assert(err.errors['location.coordinates']);
  });

  await runTest('Rejects negative speed or speed over commercial limit', () => {
    const negativeSpeed = new TelemetryPing({
      ...createValidPingPayload(),
      speedKmh: -5
    });
    const errNeg = negativeSpeed.validateSync();
    assert(errNeg && errNeg.errors.speedKmh);

    const excessiveSpeed = new TelemetryPing({
      ...createValidPingPayload(),
      speedKmh: 350
    });
    const errExcess = excessiveSpeed.validateSync();
    assert(errExcess && errExcess.errors.speedKmh);
  });

  await runTest('Rejects heading outside [0, 360] degrees and battery outside [0, 100]%', () => {
    const badHeading = new TelemetryPing({
      ...createValidPingPayload(),
      headingDegrees: 400
    });
    const errH = badHeading.validateSync();
    assert(errH && errH.errors.headingDegrees);

    const badBattery = new TelemetryPing({
      ...createValidPingPayload(),
      batteryLevelPct: 150
    });
    const errB = badBattery.validateSync();
    assert(errB && errB.errors.batteryLevelPct);
  });

  await runTest('toCoordinates instance method returns normalized projection object', () => {
    const ping = new TelemetryPing(createValidPingPayload());
    const coords = ping.toCoordinates();
    assert.strictEqual(coords.longitude, -0.1870);
    assert.strictEqual(coords.latitude, 5.6037);
    assert.strictEqual(coords.speedKmh, 68.5);
    assert.strictEqual(coords.heading, 182);
    assert(coords.recordedAt instanceof Date);
  });

  console.log('\n------------------------------------------------------');
  console.log(`TelemetryPing Model Tests: ${passedTests} Passed, ${failedTests} Failed`);
  console.log('------------------------------------------------------\n');

  if (failedTests > 0) {
    process.exit(1);
  }
})();
