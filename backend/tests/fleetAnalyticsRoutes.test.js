/**
 * @file fleetAnalyticsRoutes.test.js
 * @description Supertest HTTP integration tests for Fleet Analytics REST Router
 */

const assert = require('assert');
const request = require('supertest');
const app = require('../app');

console.log('======================================================');
console.log('  RUNNING FLEET LOGISTICS ANALYTICS REST ROUTE TESTS  ');
console.log('======================================================\n');

let passed = 0;
let failed = 0;

function check(desc, fn) {
  try {
    fn();
    console.log(`  PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  FAIL: ${desc}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function runFleetAnalyticsRouteTests() {
  try {
    // 1. POST /api/fleet-analytics/log - Validation Rejection
    const resRejectLog = await request(app)
      .post('/api/fleet-analytics/log')
      .send({});

    check('POST /api/fleet-analytics/log rejects empty body with HTTP 400', () => {
      assert.strictEqual(resRejectLog.status, 400);
      assert.strictEqual(resRejectLog.body.success, false);
    });

    // 2. POST /api/fleet-analytics/log - Valid Creation
    const resCreateLog = await request(app)
      .post('/api/fleet-analytics/log')
      .send({
        vehicleRegNumber: 'KND-882-TRK',
        vehicleType: 'MEDIUM_TRUCK_8_TON',
        corridorId: 'COR-NW-01',
        corridorName: 'Kano-Lagos Grain Route',
        origin: { state: 'KANO', facilityName: 'Dawanau Grain Market' },
        destination: { state: 'LAGOS', facilityName: 'Mile 12 Perishable Market' },
        commodityDetails: {
          commodityName: 'White Maize',
          tonnageCarriedTonnes: 12.0
        },
        lifecycleTimestamps: {
          gateInOrigin: new Date(Date.now() - 36 * 3600000),
          loadingStarted: new Date(Date.now() - 35 * 3600000),
          loadingCompleted: new Date(Date.now() - 34 * 3600000), // 60 min loading
          departureOrigin: new Date(Date.now() - 33 * 3600000),
          gateInDestination: new Date(Date.now() - 2 * 3600000), // 31 hr transit
          docksideInspectionStarted: new Date(Date.now() - 110 * 60000),
          docksideInspectionCompleted: new Date(Date.now() - 80 * 60000), // 30 min inspection
          offloadingStarted: new Date(Date.now() - 70 * 60000),
          offloadingCompleted: new Date(Date.now() - 20 * 60000), // 50 min offload
          gateOutDestination: new Date()
        },
        fuelAndEnergyTelemetry: {
          totalDistanceCoveredKm: 995,
          initialFuelLevelLitres: 350,
          refueledLitresDuringTrip: 100,
          finalFuelLevelLitres: 160 // Consumed = 290 L
        },
        ecoDrivingScorecard: {
          hardBrakingEventsCount: 2,
          rapidAccelerationCount: 1,
          excessiveIdlingDurationMinutes: 20
        }
      });

    check('POST /api/fleet-analytics/log creates trip log with HTTP 201', () => {
      assert.strictEqual(resCreateLog.status, 201);
      assert.strictEqual(resCreateLog.body.success, true);
      assert.strictEqual(resCreateLog.body.log.logTrackingNumber.startsWith('FLT-'), true);
      assert.strictEqual(resCreateLog.body.log.turnaroundDurationsMinutes.originLoadingTime, 60);
      assert.strictEqual(resCreateLog.body.log.turnaroundDurationsMinutes.docksideInspectionTime, 30);
      assert.strictEqual(resCreateLog.body.log.turnaroundDurationsMinutes.destinationOffloadingTime, 50);
      assert.strictEqual(typeof resCreateLog.body.log.telemetryChecksum, 'string');
      assert.strictEqual(resCreateLog.body.log.telemetryChecksum.length, 64);
    });

    // 3. GET /api/fleet-analytics/turnaround-metrics
    const resTurnaround = await request(app)
      .get('/api/fleet-analytics/turnaround-metrics');

    check('GET /api/fleet-analytics/turnaround-metrics returns HTTP 200', () => {
      assert.strictEqual(resTurnaround.status, 200);
      assert.strictEqual(resTurnaround.body.success, true);
      assert.strictEqual(typeof resTurnaround.body.metrics.primaryBottleneckStage, 'string');
      assert.strictEqual(typeof resTurnaround.body.metrics.stageBreakdownPercentages, 'object');
      assert.strictEqual(typeof resTurnaround.body.metrics.averageTotalTurnaroundMinutes, 'number');
    });

    // 4. GET /api/fleet-analytics/fuel-efficiency
    const resFuel = await request(app)
      .get('/api/fleet-analytics/fuel-efficiency');

    check('GET /api/fleet-analytics/fuel-efficiency returns HTTP 200', () => {
      assert.strictEqual(resFuel.status, 200);
      assert.strictEqual(resFuel.body.success, true);
      assert.strictEqual(typeof resFuel.body.aggregates.totalDistanceCoveredKm, 'number');
      assert.strictEqual(typeof resFuel.body.aggregates.totalCo2EmissionsKg, 'number');
      assert.strictEqual(typeof resFuel.body.aggregates.averageFuelEfficiencyKmPerLitre, 'number');
    });

    // 5. POST /api/fleet-analytics/quote - Missing Parameters
    const resRejectQuote = await request(app)
      .post('/api/fleet-analytics/quote')
      .send({});

    check('POST /api/fleet-analytics/quote rejects missing route with HTTP 400', () => {
      assert.strictEqual(resRejectQuote.status, 400);
      assert.strictEqual(resRejectQuote.body.success, false);
    });

    // 6. POST /api/fleet-analytics/quote - Valid Quote Calculation
    const resQuote = await request(app)
      .post('/api/fleet-analytics/quote')
      .send({
        originState: 'KANO',
        destinationState: 'LAGOS',
        tonnage: 10,
        isTemperatureControlled: false,
        currentDieselPriceNgn: 1100,
        season: 'DRY_SEASON_HARVEST'
      });

    check('POST /api/fleet-analytics/quote calculates freight tariff quote with HTTP 200', () => {
      assert.strictEqual(resQuote.status, 200);
      assert.strictEqual(resQuote.body.success, true);
      assert.strictEqual(resQuote.body.quote.quoteId.startsWith('QT-'), true);
      assert.strictEqual(resQuote.body.quote.distanceKm, 995);
      assert.strictEqual(resQuote.body.quote.tonnage, 10);
      assert.strictEqual(resQuote.body.quote.finalTariffNgn > 0, true);
      assert.strictEqual(resQuote.body.quote.fuelSurchargeNgn > 0, true); // Diesel price was 1100 > 950
    });

    // 7. GET /api/fleet-analytics/leaderboard
    const resLeaderboard = await request(app)
      .get('/api/fleet-analytics/leaderboard');

    check('GET /api/fleet-analytics/leaderboard returns ranked carrier scorecards with HTTP 200', () => {
      assert.strictEqual(resLeaderboard.status, 200);
      assert.strictEqual(resLeaderboard.body.success, true);
      assert.strictEqual(resLeaderboard.body.leaderboard.rankings.length >= 3, true);
      assert.strictEqual(resLeaderboard.body.leaderboard.rankings[0].rank, 1);
      assert.strictEqual(resLeaderboard.body.leaderboard.rankings[0].tier, 'PLATINUM_AGRO_CARRIER');
      assert.strictEqual(resLeaderboard.body.leaderboard.rankings[0].freightBonusPct, 4.5);
    });

    // 8. GET /api/fleet-analytics/corridors
    const resCorridors = await request(app)
      .get('/api/fleet-analytics/corridors');

    check('GET /api/fleet-analytics/corridors returns Nigerian trade corridors with HTTP 200', () => {
      assert.strictEqual(resCorridors.status, 200);
      assert.strictEqual(resCorridors.body.success, true);
      assert.strictEqual(resCorridors.body.corridors.length >= 6, true);
      assert.strictEqual(resCorridors.body.corridors[0].originState, 'KANO');
      assert.strictEqual(resCorridors.body.corridors[0].destinationState, 'LAGOS');
    });

    console.log('\n------------------------------------------------------');
    console.log(` RESULTS: ${passed} passed, ${failed} failed (${passed + failed} total)`);
    console.log('------------------------------------------------------\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution exception:', err);
    process.exit(1);
  }
}

runFleetAnalyticsRouteTests();
