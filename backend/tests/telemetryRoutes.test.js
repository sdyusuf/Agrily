/**
 * Telemetry Routes & Controller Unit Tests
 */

const assert = require('assert');
const {
  router,
  telemetryPingSchema,
  recordTelemetryPing,
  getLatestOrderTelemetry,
  getOrderBreadcrumbs,
  getActiveFleetTelemetry
} = require('../routes/telemetry');
const { TelemetryPing } = require('../models/TelemetryPing');

console.log('\n======================================================');
console.log('   RUNNING AGRILY TELEMETRY ROUTES & CONTROLLER TESTS ');
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

const validTelemetryPayload = () => ({
  driverEmail: 'driver.kofi@agrily.com',
  driverName: 'Kofi Mensah Boateng',
  consignmentOrderId: 'ORD-2024-GH-1011',
  vehicleRegistration: 'GT-4819-23',
  coordinates: {
    lng: -0.1870,
    lat: 5.6037
  },
  speedKmh: 62.4,
  headingDegrees: 178,
  altitudeMeters: 55,
  accuracyMeters: 4.1,
  batteryLevelPct: 92,
  isCharging: false,
  isStationary: false,
  odometerKm: 14210,
  cargoTemperatureC: 4.0
});

(async () => {
  await runTest('telemetryPingSchema accepts valid GPS coordinate payload', () => {
    const { error, value } = telemetryPingSchema.validate(validTelemetryPayload());
    assert.strictEqual(error, undefined);
    assert.strictEqual(value.consignmentOrderId, 'ORD-2024-GH-1011');
    assert.strictEqual(value.coordinates.lng, -0.1870);
    assert.strictEqual(value.coordinates.lat, 5.6037);
  });

  await runTest('telemetryPingSchema rejects missing coordinates or out of bound angles', () => {
    const badCoords = { ...validTelemetryPayload(), coordinates: { lng: 200, lat: 45 } };
    const { error: errCoords } = telemetryPingSchema.validate(badCoords);
    assert(errCoords, 'Expected longitude out of range error');

    const badHeading = { ...validTelemetryPayload(), headingDegrees: 450 };
    const { error: errH } = telemetryPingSchema.validate(badHeading);
    assert(errH, 'Expected heading out of range error');
  });

  await runTest('telemetryPingSchema rejects negative speed or battery percentage over 100', () => {
    const badSpeed = { ...validTelemetryPayload(), speedKmh: -10 };
    const { error: errS } = telemetryPingSchema.validate(badSpeed);
    assert(errS, 'Expected speed minimum error');

    const badBat = { ...validTelemetryPayload(), batteryLevelPct: 110 };
    const { error: errB } = telemetryPingSchema.validate(badBat);
    assert(errB, 'Expected battery max error');
  });

  await runTest('recordTelemetryPing returns HTTP 400 on payload validation failure', async () => {
    const req = { body: {} };
    const res = createMockRes();

    await recordTelemetryPing(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.jsonData.success, false);
    assert(Array.isArray(res.jsonData.errors));
  });

  await runTest('recordTelemetryPing saves ping and returns HTTP 201 with coordinates', async () => {
    const originalSave = TelemetryPing.prototype.save;
    let saveCalled = false;
    TelemetryPing.prototype.save = async function() {
      saveCalled = true;
      this._id = 'mock-ping-id-123';
      return this;
    };

    try {
      const req = { body: validTelemetryPayload() };
      const res = createMockRes();

      await recordTelemetryPing(req, res);
      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.jsonData.success, true);
      assert.strictEqual(res.jsonData.data.consignmentOrderId, 'ORD-2024-GH-1011');
      assert.strictEqual(res.jsonData.data.coordinates.lng, -0.1870);
      assert.strictEqual(res.jsonData.data.coordinates.lat, 5.6037);
      assert.strictEqual(saveCalled, true);
    } finally {
      TelemetryPing.prototype.save = originalSave;
    }
  });

  await runTest('getLatestOrderTelemetry returns HTTP 404 when no telemetry exists', async () => {
    const originalGetLatest = TelemetryPing.getLatestForOrder;
    TelemetryPing.getLatestForOrder = async () => null;

    try {
      const req = { params: { consignmentOrderId: 'ORD-UNKNOWN-999' } };
      const res = createMockRes();

      await getLatestOrderTelemetry(req, res);
      assert.strictEqual(res.statusCode, 404);
      assert.strictEqual(res.jsonData.success, false);
    } finally {
      TelemetryPing.getLatestForOrder = originalGetLatest;
    }
  });

  await runTest('getLatestOrderTelemetry returns HTTP 200 with formatted vehicle coordinates', async () => {
    const originalGetLatest = TelemetryPing.getLatestForOrder;
    const mockPing = {
      consignmentOrderId: 'ORD-2024-GH-1011',
      driverEmail: 'driver.kofi@agrily.com',
      driverName: 'Kofi Mensah Boateng',
      vehicleRegistration: 'GT-4819-23',
      location: { coordinates: [-0.1870, 5.6037] },
      speedKmh: 64.2,
      headingDegrees: 180,
      batteryLevelPct: 91,
      cargoTemperatureC: 3.8,
      isStationary: false,
      recordedAt: new Date()
    };
    TelemetryPing.getLatestForOrder = async () => mockPing;

    try {
      const req = { params: { consignmentOrderId: 'ORD-2024-GH-1011' } };
      const res = createMockRes();

      await getLatestOrderTelemetry(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.jsonData.success, true);
      assert.strictEqual(res.jsonData.data.coordinates.lng, -0.1870);
      assert.strictEqual(res.jsonData.data.speedKmh, 64.2);
    } finally {
      TelemetryPing.getLatestForOrder = originalGetLatest;
    }
  });

  await runTest('getOrderBreadcrumbs returns HTTP 200 with array of trail points', async () => {
    const originalBreadcrumbs = TelemetryPing.getRouteBreadcrumbs;
    const mockTrail = [
      {
        location: { coordinates: [-0.1900, 5.6010] },
        speedKmh: 45,
        headingDegrees: 90,
        accuracyMeters: 5,
        cargoTemperatureC: 4.1,
        recordedAt: new Date(Date.now() - 600000)
      },
      {
        location: { coordinates: [-0.1870, 5.6037] },
        speedKmh: 64,
        headingDegrees: 90,
        accuracyMeters: 4,
        cargoTemperatureC: 3.9,
        recordedAt: new Date()
      }
    ];
    TelemetryPing.getRouteBreadcrumbs = async () => mockTrail;

    try {
      const req = { params: { consignmentOrderId: 'ORD-2024-GH-1011' }, query: { limit: '50' } };
      const res = createMockRes();

      await getOrderBreadcrumbs(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.jsonData.count, 2);
      assert.strictEqual(res.jsonData.data[0].coordinates.lng, -0.1900);
      assert.strictEqual(res.jsonData.data[1].coordinates.lng, -0.1870);
    } finally {
      TelemetryPing.getRouteBreadcrumbs = originalBreadcrumbs;
    }
  });

  await runTest('getActiveFleetTelemetry returns HTTP 200 with aggregated fleet list', async () => {
    const originalFleet = TelemetryPing.getActiveFleetPositions;
    const mockFleet = [
      {
        driverEmail: 'driver1@agrily.com',
        driverName: 'Driver One',
        consignmentOrderId: 'ORD-1',
        vehicleRegistration: 'GT-111',
        location: { coordinates: [-0.18, 5.60] },
        speedKmh: 50,
        headingDegrees: 120,
        batteryLevelPct: 85,
        recordedAt: new Date()
      }
    ];
    TelemetryPing.getActiveFleetPositions = async () => mockFleet;

    try {
      const req = { query: { maxAgeMinutes: '30' } };
      const res = createMockRes();

      await getActiveFleetTelemetry(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.jsonData.count, 1);
      assert.strictEqual(res.jsonData.data[0].driverEmail, 'driver1@agrily.com');
    } finally {
      TelemetryPing.getActiveFleetPositions = originalFleet;
    }
  });

  await runTest('Telemetry router registers all required endpoints', () => {
    const registeredRoutes = router.stack.map(layer => ({
      path: layer.route?.path,
      method: layer.route ? Object.keys(layer.route.methods)[0].toUpperCase() : null
    })).filter(r => r.path);

    const expected = [
      { path: '/ping', method: 'POST' },
      { path: '/order/:consignmentOrderId/latest', method: 'GET' },
      { path: '/order/:consignmentOrderId/breadcrumbs', method: 'GET' },
      { path: '/fleet/active', method: 'GET' }
    ];

    expected.forEach(exp => {
      const found = registeredRoutes.some(r => r.path === exp.path && r.method === exp.method);
      assert(found, `Expected route ${exp.method} ${exp.path} to be registered on telemetry router`);
    });
  });

  console.log('\n------------------------------------------------------');
  console.log(` RESULTS: ${passedTests} passed, ${failedTests} failed`);
  console.log('------------------------------------------------------\n');

  if (failedTests > 0) {
    process.exit(1);
  }
})();
