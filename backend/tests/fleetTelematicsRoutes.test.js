/**
 * @file fleetTelematicsRoutes.test.js
 * @description Supertest API integration tests for fleet telematics streaming, eco-routing,
 * roadworthiness diagnostics, corridor toll matrix, and carbon credit certification endpoints.
 */

const request = require('supertest');
const app = require('../app');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedTests++;
  }
}

async function runTests() {
  console.log('\n=================================================================');
  console.log('🌾 AGRILY SPRINT 16: FLEET TELEMATICS REST ROUTE INTEGRATION TESTS');
  console.log('=================================================================\n');

  try {
    // -----------------------------------------------------------------
    // SECTION 1: Telematics Streaming
    // -----------------------------------------------------------------
    console.log('--- SECTION 1: Real-Time Telematics Ingestion & Geofencing ---');

    // 1.1 Ingest valid coordinate in Dawanau Market
    const streamRes = await request(app)
      .post('/api/fleet-telematics/telemetry/stream')
      .send({
        truckId: 'TRK-KAN-01',
        coordinate: { lat: 12.0622, lng: 8.4419 },
        speedKmh: 15,
        ambientTempC: 34,
        cargoTempC: 11.5,
        targetTempMaxC: 12.0
      });

    assert(streamRes.status === 200, 'POST /api/fleet-telematics/telemetry/stream returns HTTP 200');
    assert(streamRes.body.success === true, 'Stream ingestion returns success: true');
    assert(streamRes.body.data.geofenceStatus.insideHub === true, 'Correctly flags coordinate inside agro market geofence');
    assert(streamRes.body.data.geofenceStatus.hubName.includes('Dawanau'), 'Identifies Dawanau Market hub');
    assert(streamRes.body.data.activeAlerts.length === 0, 'No breach alerts generated for compliant speed and temp');

    // 1.2 Reject malformed payload
    const malformedRes = await request(app)
      .post('/api/fleet-telematics/telemetry/stream')
      .send({ truckId: 'TRK-KAN-01' });

    assert(malformedRes.status === 400, 'Rejects stream payload without coordinate with HTTP 400');

    // 1.3 Speeding excursion alert
    const speedRes = await request(app)
      .post('/api/fleet-telematics/telemetry/stream')
      .send({
        truckId: 'TRK-KAN-02',
        coordinate: { lat: 10.5, lng: 7.4 },
        speedKmh: 108
      });

    assert(speedRes.status === 200, 'Speeding stream returns HTTP 200');
    assert(speedRes.body.data.activeAlerts.some(a => a.type === 'SPEEDING_EXCURSION'), 'Generates SPEEDING_EXCURSION alert when exceeding 90 km/h');

    // -----------------------------------------------------------------
    // SECTION 2: Maintenance Diagnostics & Roadworthiness
    // -----------------------------------------------------------------
    console.log('\n--- SECTION 2: Maintenance Diagnostics & Clearance ---');

    const diagRes = await request(app)
      .post('/api/fleet-telematics/maintenance/diagnose')
      .send({
        truckId: 'TRK-KAN-01',
        registrationNumber: 'KND-882-XA',
        odometerKm: 65000,
        lastOilChangeKm: 63000,
        lastBrakeServiceKm: 60000,
        lastTireRotationKm: 61000
      });

    assert(diagRes.status === 200, 'POST /api/fleet-telematics/maintenance/diagnose returns HTTP 200');
    assert(diagRes.body.data.dispatchClearance === 'APPROVED_FOR_LONG_HAUL', 'Issues APPROVED_FOR_LONG_HAUL for healthy vehicle');
    assert(diagRes.body.data.roadworthinessScore >= 90, 'Safety score is >= 90% for well-serviced truck');

    // 2.2 Reject missing registration
    const invalidDiagRes = await request(app)
      .post('/api/fleet-telematics/maintenance/diagnose')
      .send({ odometerKm: 65000 });

    assert(invalidDiagRes.status === 400, 'Rejects missing truckId and registrationNumber with HTTP 400');

    // -----------------------------------------------------------------
    // SECTION 3: Eco-Routing Optimizer
    // -----------------------------------------------------------------
    console.log('\n--- SECTION 3: Eco-Routing Multi-Path Optimizer ---');

    const ecoRes = await request(app)
      .post('/api/fleet-telematics/eco-routing/optimize')
      .send({
        originState: 'Kano',
        destinationState: 'Lagos',
        cargoTonnage: 24,
        isReefer: true,
        currentDieselPricePerLitre: 1200
      });

    assert(ecoRes.status === 200, 'POST /api/fleet-telematics/eco-routing/optimize returns HTTP 200');
    assert(Array.isArray(ecoRes.body.data.availableRoutes), 'Returns availableRoutes array');
    assert(ecoRes.body.data.availableRoutes.length >= 2, 'Evaluates at least 2 alternate corridor routes');
    assert(ecoRes.body.data.projectedSavings.costSavedNgn >= 0, 'Computes non-negative fuel cost savings in Naira');
    assert(ecoRes.body.data.projectedSavings.co2SavedKg >= 0, 'Computes non-negative carbon emissions saved in kg');

    // -----------------------------------------------------------------
    // SECTION 4: Corridor Tolls, Levies & VAT
    // -----------------------------------------------------------------
    console.log('\n--- SECTION 4: Interstate Corridor Tolls & Statutory VAT ---');

    const tollRes = await request(app)
      .get('/api/fleet-telematics/corridor-tolls/Kano/Lagos?tonnage=22&tariff=900000');

    assert(tollRes.status === 200, 'GET /api/fleet-telematics/corridor-tolls/:origin/:destination returns HTTP 200');
    assert(tollRes.body.data.haulageServiceVatRatePct === 7.5, 'Enforces standard 7.5% haulage VAT');
    assert(tollRes.body.data.produceVatStatus === 'EXEMPT_ZERO_RATED_AGRICULTURAL_PRODUCE', 'Enforces 0.0% zero-rated VAT on raw agricultural produce');
    assert(tollRes.body.data.statutoryLevyBreakdown.originStateClearance.subtotalNgn > 0, 'Resolves positive origin produce inspection levy');

    // -----------------------------------------------------------------
    // SECTION 5: Carbon Credit Certification
    // -----------------------------------------------------------------
    console.log('\n--- SECTION 5: Carbon Credit Offset Certification ---');

    const creditRes = await request(app)
      .post('/api/fleet-telematics/carbon-credits/certify')
      .send({
        tripId: 'TRP-20240824-KNLOS',
        carrierId: 'CARRIER-DAN-001',
        originState: 'Kano',
        destinationState: 'Lagos',
        distanceKm: 995,
        cargoTonnage: 20,
        actualFuelConsumedLitres: 290,
        isReefer: false
      });

    assert(creditRes.status === 200, 'POST /api/fleet-telematics/carbon-credits/certify returns HTTP 200');
    assert(creditRes.body.data.certificate.carbonCreditEarnedNgn >= 0, 'Calculates non-negative carbon credits earned');
    assert(typeof creditRes.body.data.certificate.digitalCreditSeal === 'string', 'Emits 64-character SHA-256 digital certificate seal');
    assert(creditRes.body.data.certificate.digitalCreditSeal.length === 64, 'Digital seal length is exactly 64 characters');

    // -----------------------------------------------------------------
    // SECTION 6: State Levies Dictionary
    // -----------------------------------------------------------------
    console.log('\n--- SECTION 6: State Produce Levies Reference Dictionary ---');

    const dictRes = await request(app)
      .get('/api/fleet-telematics/state-levies');

    assert(dictRes.status === 200, 'GET /api/fleet-telematics/state-levies returns HTTP 200');
    assert(Boolean(dictRes.body.data['KANO']), 'State dictionary includes Kano state registry');
    assert(Boolean(dictRes.body.data['BENUE']), 'State dictionary includes Benue state registry');
    assert(Boolean(dictRes.body.data['OYO']), 'State dictionary includes Oyo state registry');

  } catch (err) {
    console.error('Fatal error in fleet telematics tests:', err);
    failedTests++;
  } finally {
    console.log('\n=================================================================');
    console.log(`🌾 FLEET TELEMATICS REST TESTS COMPLETE: ${passedTests} passed, ${failedTests} failed`);
    console.log('=================================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

runTests();
