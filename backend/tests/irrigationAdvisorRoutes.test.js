/**
 * ==============================================================================
 * 🧪 AGRILY SPRINT 23: IRRIGATION ADVISOR REST API ROUTES UNIT TESTS
 * ==============================================================================
 */

const assert = require('assert');
const express = require('express');
const http = require('http');
const irrigationAdvisorRoutes = require('../routes/irrigationAdvisorRoutes');

console.log('🧪 Starting Sprint 23 Irrigation Advisor REST API Route Tests...');

const app = express();
app.use(express.json());
app.use('/api/irrigation-advisor', irrigationAdvisorRoutes);

function requestJson(server, method, path, body = null) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: addr.port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw) });
          } catch (err) {
            reject(err);
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

(async () => {
  const server = app.listen(0);
  try {
    // 1. GET /api/irrigation-advisor/zones
    const zonesRes = await requestJson(server, 'GET', '/api/irrigation-advisor/zones');
    assert.strictEqual(zonesRes.status, 200);
    assert.strictEqual(zonesRes.data.success, true);
    assert.ok(zonesRes.data.zones.length >= 4);
    assert.ok(zonesRes.data.zones[0].scheduleEvaluation.tawMm > 0);
    console.log('  ✓ GET /api/irrigation-advisor/zones verified');

    // 2. GET /api/irrigation-advisor/pumps
    const pumpsRes = await requestJson(server, 'GET', '/api/irrigation-advisor/pumps');
    assert.strictEqual(pumpsRes.status, 200);
    assert.strictEqual(pumpsRes.data.success, true);
    assert.ok(pumpsRes.data.pumps.length >= 3);
    assert.ok(pumpsRes.data.pumps[0].hydraulics.totalDynamicHeadMeters > 15);
    console.log('  ✓ GET /api/irrigation-advisor/pumps verified');

    // 3. POST /api/irrigation-advisor/evaluate-schedule
    const evalRes = await requestJson(
      server,
      'POST',
      '/api/irrigation-advisor/evaluate-schedule',
      {
        cropKey: 'TOMATO_IRRIGATED',
        soilTextureKey: 'SANDY_LOAM',
        commandAreaHectares: 15.0,
        matricSuctionKpa: 52.0,
        referenceEt0MmDay: 6.5,
        effectiveRainMmDay: 0.0,
        flowRateM3PerHour: 70.0,
      }
    );
    assert.strictEqual(evalRes.status, 200);
    assert.strictEqual(evalRes.data.success, true);
    assert.strictEqual(evalRes.data.sevenDayLedger.dailyLedger.length, 7);
    assert.ok(evalRes.data.pumpHydraulics.electricalInputPowerKw > 0);
    console.log('  ✓ POST /api/irrigation-advisor/evaluate-schedule verified');

    // 4. POST /api/irrigation-advisor/relay-command
    const relayRes = await requestJson(
      server,
      'POST',
      '/api/irrigation-advisor/relay-command',
      {
        relayNodeCode: 'PMP-RLY-1001',
        commandAction: 'ENERGIZE_PUMP',
        targetRuntimeMinutes: 150,
        boreholeDrawdownOk: true,
        filterDifferentialPressureBar: 0.25,
      }
    );
    assert.strictEqual(relayRes.status, 200);
    assert.strictEqual(relayRes.data.relayDispatch.commandAccepted, true);
    assert.strictEqual(relayRes.data.relayDispatch.newContactorState, 'ENERGIZED_PUMPING');
    console.log('  ✓ POST /api/irrigation-advisor/relay-command verified');

    // 5. POST /api/irrigation-advisor/tensiometer-ingest
    const tensRes = await requestJson(
      server,
      'POST',
      '/api/irrigation-advisor/tensiometer-ingest',
      {
        podCode: 'TNS-POD-1001',
        soilTextureKey: 'SANDY_LOAM',
        matricSuctionKpa: 64.0,
        soilTempCelsius: 29.2,
      }
    );
    assert.strictEqual(tensRes.status, 201);
    assert.strictEqual(tensRes.data.success, true);
    assert.strictEqual(
      tensRes.data.telemetryPacket.stressBand,
      'HIGH_MATRIC_TENSION_IRRIGATION_URGENT'
    );
    console.log('  ✓ POST /api/irrigation-advisor/tensiometer-ingest verified');

    console.log('✅ All Sprint 23 Irrigation Advisor REST API route tests passed!');
  } finally {
    server.close();
  }
})();
