/**
 * Driver Routes & Fleet Dispatch Integration & Unit Tests
 */

const assert = require('assert');
const {
  router,
  registerDriver,
  getDriverProfile,
  updateDriverProfile,
  setDriverAvailability,
  getAvailableFleet,
  driverRegistrationSchema
} = require('../routes/drivers');
const { Driver } = require('../models/Driver');

console.log('\n======================================================');
console.log('   RUNNING AGRILY DRIVER ROUTES & CONTROLLER TESTS    ');
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

const createMockRes = () => {
  const res = {
    statusCode: null,
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    }
  };
  return res;
};

const validDriverData = () => ({
  userEmail: 'driver.kofi@agrily.com',
  fullName: 'Kofi Mensah Boateng',
  phone: '+233241234567',
  licenseNumber: 'GH-COMM-99281-B',
  licenseClass: 'heavy_duty',
  licenseExpiry: '2027-12-31',
  nationalIdNumber: 'GHA-789218291-0',
  vehicle: {
    vehicleType: 'box_truck',
    registrationNumber: 'GT-4819-23',
    make: 'Isuzu',
    model: 'F-Series 15T',
    year: 2021,
    payloadCapacityKg: 15000,
    maxVolumeCubicMeters: 45,
    hasRefrigeration: true
  },
  operatingRegions: ['Ashanti', 'Eastern', 'Greater Accra'],
  baseLocation: {
    city: 'Kumasi',
    state: 'Ashanti',
    coordinates: { lat: 6.6885, lng: -1.6244 }
  }
});

(async () => {
  // 1. Schema Validation Tests
  await runTest('driverRegistrationSchema accepts well-formed registration payload', () => {
    const { error, value } = driverRegistrationSchema.validate(validDriverData());
    assert.strictEqual(error, undefined);
    assert.strictEqual(value.userEmail, 'driver.kofi@agrily.com');
  });

  await runTest('driverRegistrationSchema rejects invalid email or missing license expiry', () => {
    const data = validDriverData();
    delete data.licenseExpiry;
    data.userEmail = 'not-an-email';
    const { error } = driverRegistrationSchema.validate(data);
    assert(error);
  });

  await runTest('driverRegistrationSchema rejects payload capacity below 250 kg', () => {
    const data = validDriverData();
    data.vehicle.payloadCapacityKg = 150;
    const { error } = driverRegistrationSchema.validate(data);
    assert(error);
  });

  // 2. Controller: registerDriver
  await runTest('registerDriver responds with HTTP 400 on validation error', async () => {
    const req = { body: {} };
    const res = createMockRes();
    await registerDriver(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.jsonData.success, false);
    assert(Array.isArray(res.jsonData.errors));
  });

  await runTest('registerDriver responds with HTTP 409 when email already exists', async () => {
    const originalFindOne = Driver.findOne;
    Driver.findOne = async () => ({ _id: 'mock_driver_id', userEmail: 'driver.kofi@agrily.com' });

    try {
      const req = { body: validDriverData() };
      const res = createMockRes();
      await registerDriver(req, res);
      assert.strictEqual(res.statusCode, 409);
      assert.strictEqual(res.jsonData.success, false);
      assert(res.jsonData.message.includes('already exists'));
    } finally {
      Driver.findOne = originalFindOne;
    }
  });

  // 3. Controller: getDriverProfile
  await runTest('getDriverProfile responds with HTTP 404 when driver is not found', async () => {
    const originalFindOne = Driver.findOne;
    Driver.findOne = async () => null;

    try {
      const req = { params: { email: 'unknown@driver.com' } };
      const res = createMockRes();
      await getDriverProfile(req, res);
      assert.strictEqual(res.statusCode, 404);
      assert.strictEqual(res.jsonData.success, false);
    } finally {
      Driver.findOne = originalFindOne;
    }
  });

  await runTest('getDriverProfile responds with HTTP 200 when driver exists', async () => {
    const originalFindOne = Driver.findOne;
    Driver.findOne = async () => ({
      fullName: 'Kofi Mensah Boateng',
      userEmail: 'driver.kofi@agrily.com',
      vehicle: { make: 'Isuzu', payloadCapacityKg: 15000 }
    });

    try {
      const req = { params: { email: 'driver.kofi@agrily.com' } };
      const res = createMockRes();
      await getDriverProfile(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.jsonData.success, true);
      assert.strictEqual(res.jsonData.driver.fullName, 'Kofi Mensah Boateng');
    } finally {
      Driver.findOne = originalFindOne;
    }
  });

  // 4. Controller: setDriverAvailability
  await runTest('setDriverAvailability rejects missing boolean flag with HTTP 400', async () => {
    const req = { params: { email: 'driver.kofi@agrily.com' }, body: {} };
    const res = createMockRes();
    await setDriverAvailability(req, res);
    assert.strictEqual(res.statusCode, 400);
  });

  await runTest('setDriverAvailability updates isAvailable flag and returns HTTP 200', async () => {
    const mockDriver = {
      userEmail: 'driver.kofi@agrily.com',
      isAvailable: false,
      save: async function() { return this; }
    };
    const originalFindOne = Driver.findOne;
    Driver.findOne = async () => mockDriver;

    try {
      const req = { params: { email: 'driver.kofi@agrily.com' }, body: { isAvailable: true } };
      const res = createMockRes();
      await setDriverAvailability(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(mockDriver.isAvailable, true);
      assert.strictEqual(res.jsonData.isAvailable, true);
    } finally {
      Driver.findOne = originalFindOne;
    }
  });

  // 5. Controller: getAvailableFleet
  await runTest('getAvailableFleet filters fleet and strips sensitive ID/license numbers', async () => {
    const originalFind = Driver.find;
    Driver.find = () => ({
      sort: () => ({
        select: (fields) => {
          assert(fields.includes('-nationalIdNumber'));
          return [
            { fullName: 'Driver Kwame', isAvailable: true, rating: 4.9 },
            { fullName: 'Driver Ama', isAvailable: true, rating: 4.8 }
          ];
        }
      })
    });

    try {
      const req = { query: { region: 'Ashanti', minPayloadKg: '5000', requiresReefer: 'true' } };
      const res = createMockRes();
      await getAvailableFleet(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.jsonData.count, 2);
    } finally {
      Driver.find = originalFind;
    }
  });

  // 6. Router Bindings Check
  await runTest('Driver router configures all required endpoints', () => {
    const registeredRoutes = router.stack.map(layer => ({
      path: layer.route.path,
      method: Object.keys(layer.route.methods)[0].toUpperCase()
    }));

    const expected = [
      { path: '/drivers/register', method: 'POST' },
      { path: '/drivers/profile/:email', method: 'GET' },
      { path: '/drivers/profile', method: 'PUT' },
      { path: '/drivers/:email/availability', method: 'PATCH' },
      { path: '/drivers/available', method: 'GET' }
    ];

    expected.forEach(exp => {
      const found = registeredRoutes.some(r => r.path === exp.path && r.method === exp.method);
      assert(found, `Expected route ${exp.method} ${exp.path} was not registered on router`);
    });
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
