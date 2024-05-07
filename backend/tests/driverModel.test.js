/**
 * Driver Model and Logistics Fleet Unit Tests
 */

const assert = require('assert');
const { Driver, VEHICLE_TYPES, LICENSE_CLASSES, VERIFICATION_STATUSES } = require('../models/Driver');

console.log('\n======================================================');
console.log('   RUNNING AGRILY DRIVER & FLEET MODEL UNIT TESTS     ');
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

const createValidDriverPayload = () => ({
  userEmail: 'driver.kofi@agrilylogistics.com',
  fullName: 'Kofi Mensah Boateng',
  phone: '+233241234567',
  licenseNumber: 'GH-COMM-99281-B',
  licenseClass: 'heavy_duty',
  licenseExpiry: new Date('2027-12-31'),
  nationalIdNumber: 'GHA-789218291-0',
  vehicle: {
    vehicleType: 'box_truck',
    registrationNumber: 'GT-4819-23',
    make: 'Isuzu',
    model: 'F-Series 15T',
    year: 2021,
    payloadCapacityKg: 15000,
    maxVolumeCubicMeters: 45,
    hasRefrigeration: true,
    temperatureRange: { min: -18, max: 4 }
  },
  operatingRegions: ['Ashanti', 'Eastern', 'Greater Accra'],
  baseLocation: {
    city: 'Kumasi',
    state: 'Ashanti',
    coordinates: { lat: 6.6885, lng: -1.6244 }
  }
});

(async () => {
  await runTest('Constants expose valid vehicle types, license classes, and verification statuses', () => {
    assert(Array.isArray(VEHICLE_TYPES) && VEHICLE_TYPES.includes('refrigerated_van'));
    assert(Array.isArray(LICENSE_CLASSES) && LICENSE_CLASSES.includes('heavy_duty'));
    assert(Array.isArray(VERIFICATION_STATUSES) && VERIFICATION_STATUSES.includes('verified'));
  });

  await runTest('Valid driver payload successfully passes Mongoose validation', async () => {
    const driver = new Driver(createValidDriverPayload());
    const err = driver.validateSync();
    assert.strictEqual(err, undefined);
    assert.strictEqual(driver.verificationStatus, 'pending');
    assert.strictEqual(driver.isAvailable, false);
    assert.strictEqual(driver.rating, 5.0);
    assert.strictEqual(driver.totalDeliveries, 0);
  });

  await runTest('Rejects missing required driver personal information', () => {
    const driver = new Driver({});
    const err = driver.validateSync();
    assert(err && err.errors);
    assert(err.errors.userEmail);
    assert(err.errors.fullName);
    assert(err.errors.phone);
    assert(err.errors.licenseNumber);
    assert(err.errors.licenseClass);
    assert(err.errors.vehicle);
  });

  await runTest('Enforces valid email format and trims uppercase license', () => {
    const payload = createValidDriverPayload();
    payload.userEmail = 'not-an-email';
    payload.licenseNumber = 'gh-comm-test ';
    const driver = new Driver(payload);
    const err = driver.validateSync();
    assert(err && err.errors.userEmail);
    assert.strictEqual(driver.licenseNumber, 'GH-COMM-TEST');
  });

  await runTest('Rejects invalid license class enums', () => {
    const payload = createValidDriverPayload();
    payload.licenseClass = 'rocket_pilot';
    const driver = new Driver(payload);
    const err = driver.validateSync();
    assert(err && err.errors.licenseClass);
  });

  await runTest('Rejects invalid vehicle types and out-of-bounds manufacture year', () => {
    const payload = createValidDriverPayload();
    payload.vehicle.vehicleType = 'spaceship';
    payload.vehicle.year = 1985;
    const driver = new Driver(payload);
    const err = driver.validateSync();
    assert(err && err.errors['vehicle.vehicleType']);
    assert(err.errors['vehicle.year']);
  });

  await runTest('Enforces payload capacity boundaries (250 kg to 60,000 kg)', () => {
    const payloadTooLow = createValidDriverPayload();
    payloadTooLow.vehicle.payloadCapacityKg = 100;
    const errLow = new Driver(payloadTooLow).validateSync();
    assert(errLow && errLow.errors['vehicle.payloadCapacityKg']);

    const payloadTooHigh = createValidDriverPayload();
    payloadTooHigh.vehicle.payloadCapacityKg = 75000;
    const errHigh = new Driver(payloadTooHigh).validateSync();
    assert(errHigh && errHigh.errors['vehicle.payloadCapacityKg']);
  });

  await runTest('Rejects empty operating regions array', () => {
    const payload = createValidDriverPayload();
    payload.operatingRegions = [];
    const driver = new Driver(payload);
    const err = driver.validateSync();
    assert(err && err.errors.operatingRegions);
  });

  await runTest('canCarryPayload accurately validates cargo weight and cold-chain capability', () => {
    const driver = new Driver(createValidDriverPayload());
    // 10,000 kg within 15,000 kg capacity with reefer
    assert.strictEqual(driver.canCarryPayload(10000, true), true);
    // 20,000 kg exceeds capacity
    assert.strictEqual(driver.canCarryPayload(20000, false), false);

    driver.vehicle.hasRefrigeration = false;
    // Cold chain cargo requested on non-reefer vehicle
    assert.strictEqual(driver.canCarryPayload(5000, true), false);
  });

  await runTest('setAvailability enforces verificationStatus requirement', async () => {
    const driver = new Driver(createValidDriverPayload());
    driver.verificationStatus = 'pending';
    let threw = false;
    try {
      await driver.setAvailability(true);
    } catch (e) {
      threw = true;
      assert(e.message.includes('Only verified drivers'));
    }
    assert.strictEqual(threw, true);
  });

  console.log('\n------------------------------------------------------');
  console.log(` RESULTS: ${passedTests} passed, ${failedTests} failed`);
  console.log('------------------------------------------------------\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
})();
