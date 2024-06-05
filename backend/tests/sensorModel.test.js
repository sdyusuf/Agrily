/**
 * SensorPod and ColdChainReading Model Unit Tests
 */

const assert = require('assert');
const { SensorPod, PRODUCE_STORAGE_PROFILES, POD_STATUSES } = require('../models/SensorPod');
const { ColdChainReading } = require('../models/ColdChainReading');

console.log('\n======================================================');
console.log('   RUNNING AGRILY COLD-CHAIN SENSOR MODEL UNIT TESTS  ');
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

const createValidPodPayload = () => ({
  podId: 'POD-REEFER-001',
  deviceMac: 'AC:67:B2:11:89:FE',
  assignedConsignmentId: 'ORD-2024-GH-99812',
  vehicleRegistration: 'GT-4819-23',
  produceCategory: 'berries',
  batteryPercent: 96,
  batteryVoltage: 3.82,
  status: 'active'
});

(async () => {
  await runTest('Storage profiles define standard thresholds for major produce types', () => {
    assert(PRODUCE_STORAGE_PROFILES.berries);
    assert(PRODUCE_STORAGE_PROFILES.leafy_greens);
    assert(PRODUCE_STORAGE_PROFILES.dairy);
    assert.strictEqual(PRODUCE_STORAGE_PROFILES.berries.minTemp, 0.5);
    assert.strictEqual(PRODUCE_STORAGE_PROFILES.berries.maxTemp, 3.0);
  });

  await runTest('SensorPod pre-validate hook assigns crop storage thresholds automatically', () => {
    const pod = new SensorPod(createValidPodPayload());
    const err = pod.validateSync();
    assert.strictEqual(err, undefined);
    assert.strictEqual(pod.targetTempRange.min, 0.5);
    assert.strictEqual(pod.targetTempRange.max, 3.0);
    assert.strictEqual(pod.targetTempRange.optimal, 1.5);
    assert.strictEqual(pod.targetHumidityRange.min, 90);
    assert.strictEqual(pod.targetHumidityRange.max, 95);
  });

  await runTest('SensorPod rejects malformed MAC address or missing required identifiers', () => {
    const badMac = new SensorPod({
      ...createValidPodPayload(),
      deviceMac: 'INVALID-MAC-FORMAT'
    });
    const errMac = badMac.validateSync();
    assert(errMac && errMac.errors.deviceMac);

    const missingId = new SensorPod({});
    const errId = missingId.validateSync();
    assert(errId && errId.errors.podId);
    assert(errId && errId.errors.assignedConsignmentId);
  });

  await runTest('evaluateReading returns no breach when environmental conditions are optimal', () => {
    const pod = new SensorPod(createValidPodPayload());
    pod.validateSync();
    const result = pod.evaluateReading(1.8, 92, 0);
    assert.strictEqual(result.isBreach, false);
    assert.strictEqual(result.severity, 'none');
    assert.strictEqual(result.breaches.length, 0);
  });

  await runTest('evaluateReading detects high critical temperature and door open breach', () => {
    const pod = new SensorPod(createValidPodPayload());
    pod.validateSync();
    // Berries max temp is 3.0°C; 8.5°C is +5.5°C over max -> high_critical
    const result = pod.evaluateReading(8.5, 92, 300);
    assert.strictEqual(result.isBreach, true);
    assert.strictEqual(result.severity, 'high_critical');
    assert(result.breaches.some(b => b.includes('High temperature excursion')));
    assert(result.breaches.some(b => b.includes('Door open breach')));
  });

  await runTest('ColdChainReading validates required numeric temperature and humidity', () => {
    const reading = new ColdChainReading({
      podId: 'POD-REEFER-001',
      consignmentOrderId: 'ORD-2024-GH-99812',
      temperatureC: 2.4,
      humidityPercent: 91,
      doorContactOpen: false,
      isBreach: false,
      recordedAt: new Date()
    });
    const err = reading.validateSync();
    assert.strictEqual(err, undefined);
    assert.strictEqual(reading.temperatureC, 2.4);
    assert.strictEqual(reading.humidityPercent, 91);
  });

  await runTest('ColdChainReading rejects out-of-range humidity and temperatures', () => {
    const badHum = new ColdChainReading({
      podId: 'POD-1',
      consignmentOrderId: 'ORD-1',
      temperatureC: 4.0,
      humidityPercent: 125 // Out of bounds > 100
    });
    const err = badHum.validateSync();
    assert(err && err.errors.humidityPercent);
  });

  console.log('\n------------------------------------------------------');
  console.log(` RESULTS: ${passedTests} passed, ${failedTests} failed`);
  console.log('------------------------------------------------------\n');

  if (failedTests > 0) {
    process.exit(1);
  }
})();
