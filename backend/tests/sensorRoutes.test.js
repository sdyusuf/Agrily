/**
 * Sensor Routes & Cold-Chain Anomaly Engine Unit Tests
 */

const assert = require('assert');
const {
  router,
  sensorRegistrationSchema,
  sensorIngestSchema,
  registerSensorPod,
  ingestSensorReading,
  getLatestConsignmentReading,
  getConsignmentExcursions,
  getConsignmentComplianceSummary
} = require('../routes/sensors');
const { SensorPod } = require('../models/SensorPod');
const { ColdChainReading } = require('../models/ColdChainReading');

console.log('\n======================================================');
console.log('   RUNNING AGRILY SENSOR ROUTES & CONTROLLER TESTS    ');
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

const validPodPayload = () => ({
  podId: 'POD-REEFER-101',
  deviceMac: 'AA:BB:CC:11:22:33',
  assignedConsignmentId: 'ORD-2024-GH-8877',
  vehicleRegistration: 'GT-5002-23',
  produceCategory: 'berries'
});

const validIngestPayload = () => ({
  podId: 'POD-REEFER-101',
  consignmentOrderId: 'ORD-2024-GH-8877',
  temperatureC: 1.8,
  humidityPercent: 92,
  ambientLightLux: 5,
  doorContactOpen: false,
  doorOpenDurationSeconds: 0,
  batteryPercent: 95
});

(async () => {
  await runTest('sensorRegistrationSchema accepts valid pod payload and normalizes fields', () => {
    const { error, value } = sensorRegistrationSchema.validate(validPodPayload());
    assert.strictEqual(error, undefined);
    assert.strictEqual(value.podId, 'POD-REEFER-101');
    assert.strictEqual(value.produceCategory, 'berries');
  });

  await runTest('sensorRegistrationSchema rejects invalid MAC address or missing registration', () => {
    const badMac = { ...validPodPayload(), deviceMac: 'BAD-MAC' };
    const { error: errMac } = sensorRegistrationSchema.validate(badMac);
    assert(errMac, 'Expected MAC format error');

    const missingPlate = { ...validPodPayload(), vehicleRegistration: '' };
    const { error: errP } = sensorRegistrationSchema.validate(missingPlate);
    assert(errP, 'Expected vehicle registration error');
  });

  await runTest('registerSensorPod returns HTTP 400 on schema failure', async () => {
    const req = { body: {} };
    const res = createMockRes();

    await registerSensorPod(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.jsonData.success, false);
  });

  await runTest('registerSensorPod returns HTTP 409 when podId already exists', async () => {
    const originalFindOne = SensorPod.findOne;
    SensorPod.findOne = async () => ({ podId: 'POD-REEFER-101' });

    try {
      const req = { body: validPodPayload() };
      const res = createMockRes();

      await registerSensorPod(req, res);
      assert.strictEqual(res.statusCode, 409);
      assert.strictEqual(res.jsonData.success, false);
    } finally {
      SensorPod.findOne = originalFindOne;
    }
  });

  await runTest('registerSensorPod saves pod and returns HTTP 201 with target ranges', async () => {
    const originalFindOne = SensorPod.findOne;
    const originalSave = SensorPod.prototype.save;
    SensorPod.findOne = async () => null;
    SensorPod.prototype.save = async function() { return this; };

    try {
      const req = { body: validPodPayload() };
      const res = createMockRes();

      await registerSensorPod(req, res);
      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.jsonData.success, true);
      assert.strictEqual(res.jsonData.data.podId, 'POD-REEFER-101');
      assert.strictEqual(res.jsonData.data.targetTempRange.optimal, 1.5);
    } finally {
      SensorPod.findOne = originalFindOne;
      SensorPod.prototype.save = originalSave;
    }
  });

  await runTest('ingestSensorReading detects safe conditions and returns HTTP 201 with isBreach=false', async () => {
    const originalFindPod = SensorPod.findOne;
    const originalSaveReading = ColdChainReading.prototype.save;
    const originalSavePod = SensorPod.prototype.save;

    SensorPod.findOne = async () => new SensorPod(validPodPayload());
    ColdChainReading.prototype.save = async function() { this._id = 'mock-reading-1'; return this; };
    SensorPod.prototype.save = async function() { return this; };

    try {
      const req = { body: validIngestPayload() }; // 1.8°C is within [0.5, 3.0]
      const res = createMockRes();

      await ingestSensorReading(req, res);
      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.jsonData.success, true);
      assert.strictEqual(res.jsonData.data.isBreach, false);
      assert.strictEqual(res.jsonData.data.breachSeverity, 'none');
    } finally {
      SensorPod.findOne = originalFindPod;
      ColdChainReading.prototype.save = originalSaveReading;
      SensorPod.prototype.save = originalSavePod;
    }
  });

  await runTest('ingestSensorReading detects high critical excursion and returns breach details', async () => {
    const originalFindPod = SensorPod.findOne;
    const originalSaveReading = ColdChainReading.prototype.save;
    const originalSavePod = SensorPod.prototype.save;

    SensorPod.findOne = async () => new SensorPod(validPodPayload());
    ColdChainReading.prototype.save = async function() { this._id = 'mock-breach-1'; return this; };
    SensorPod.prototype.save = async function() { return this; };

    try {
      // 9.2°C exceeds 3.0°C max for berries by 6.2°C -> high_critical
      const req = { body: { ...validIngestPayload(), temperatureC: 9.2, doorOpenDurationSeconds: 400 } };
      const res = createMockRes();

      await ingestSensorReading(req, res);
      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.jsonData.data.isBreach, true);
      assert.strictEqual(res.jsonData.data.breachSeverity, 'high_critical');
      assert(res.jsonData.data.breachDetails.length >= 2);
    } finally {
      SensorPod.findOne = originalFindPod;
      ColdChainReading.prototype.save = originalSaveReading;
      SensorPod.prototype.save = originalSavePod;
    }
  });

  await runTest('getLatestConsignmentReading returns HTTP 404 when no reading exists', async () => {
    const originalFind = ColdChainReading.findOne;
    ColdChainReading.findOne = () => ({
      sort: () => ({
        exec: async () => null
      })
    });

    try {
      const req = { params: { consignmentOrderId: 'ORD-UNKNOWN' } };
      const res = createMockRes();

      await getLatestConsignmentReading(req, res);
      assert.strictEqual(res.statusCode, 404);
      assert.strictEqual(res.jsonData.success, false);
    } finally {
      ColdChainReading.findOne = originalFind;
    }
  });

  await runTest('getConsignmentExcursions returns HTTP 200 with list of excursions', async () => {
    const originalTimeline = ColdChainReading.getExcursionTimeline;
    ColdChainReading.getExcursionTimeline = async () => [
      { podId: 'POD-1', temperatureC: 9.2, breachSeverity: 'high_critical', recordedAt: new Date() }
    ];

    try {
      const req = { params: { consignmentOrderId: 'ORD-2024-GH-8877' } };
      const res = createMockRes();

      await getConsignmentExcursions(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.jsonData.count, 1);
    } finally {
      ColdChainReading.getExcursionTimeline = originalTimeline;
    }
  });

  await runTest('Sensor router registers all required endpoints', () => {
    const registeredRoutes = router.stack.map(layer => ({
      path: layer.route?.path,
      method: layer.route ? Object.keys(layer.route.methods)[0].toUpperCase() : null
    })).filter(r => r.path);

    const expected = [
      { path: '/register', method: 'POST' },
      { path: '/ingest', method: 'POST' },
      { path: '/consignment/:consignmentOrderId/latest', method: 'GET' },
      { path: '/consignment/:consignmentOrderId/excursions', method: 'GET' },
      { path: '/consignment/:consignmentOrderId/summary', method: 'GET' }
    ];

    expected.forEach(exp => {
      const found = registeredRoutes.some(r => r.path === exp.path && r.method === exp.method);
      assert(found, `Expected route ${exp.method} ${exp.path} on sensor router`);
    });
  });

  console.log('\n------------------------------------------------------');
  console.log(` RESULTS: ${passedTests} passed, ${failedTests} failed`);
  console.log('------------------------------------------------------\n');

  if (failedTests > 0) {
    process.exit(1);
  }
})();
