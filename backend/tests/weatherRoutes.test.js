/**
 * ==============================================================================
 * 🧪 SPRINT 20 INTEGRATION TESTS: HYPERLOCAL WEATHER REST API & OWM NORMALIZER
 * ==============================================================================
 */

const assert = require('assert');
const request = require('supertest');
const app = require('../app');
const { normalizeOpenWeatherPayload } = require('../services/openWeatherNormalizerService');

console.log('🧪 Starting Hyperlocal Weather REST API & OWM Normalizer Integration Tests...');

async function runWeatherApiTests() {
  // 1. OpenWeatherMap Kelvin & m/s Wind Normalization Unit Check
  {
    const rawOwm = {
      current: {
        dt: 1728907200,
        temp: 306.15, // 33.0°C in Kelvin
        humidity: 35,
        pressure: 1009,
        wind_speed: 4.5, // 16.2 km/h
        wind_deg: 65,
        clouds: 15,
        uvi: 9.2,
        visibility: 3200
      }
    };

    const norm = normalizeOpenWeatherPayload(rawOwm, {
      stationCode: 'AWS-KAN-2018',
      elevationMeters: 472,
      cropType: 'Maize'
    });

    assert.strictEqual(norm.airTempCelsius, 33.0);
    assert.strictEqual(norm.windSpeedKmh, 16.2);
    assert.strictEqual(norm.harmattanDustVisibilityKm, 3.2);
    assert.ok(norm.referenceEvapotranspirationMmDay > 4.0);
    console.log('  ✓ OpenWeatherMap payload normalizer converts Kelvin, m/s wind, and computes FAO-56 ET0');
  }

  // 2. GET /api/weather/stations
  {
    const res = await request(app).get('/api/weather/stations');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 4);
    assert.strictEqual(res.body.data[0].stationCode, 'AWS-JOS-1042');
    console.log('  ✓ GET /api/weather/stations returns seeded Nigerian agrometeorological observatories');
  }

  // 3. POST /api/weather/stations - Register new station
  let createdStationCode = '';
  {
    const payload = {
      stationCode: 'AWS-SOK-9001',
      stationName: 'Sokoto Goronyo Dam Sahelian Weather Node',
      stationType: 'Automated Weather Station (AWS)',
      stateRegion: 'Sokoto',
      agroEcologicalZone: 'Sahel Savannah',
      primaryCropFocus: 'Onion',
      location: {
        type: 'Point',
        coordinates: [5.2391, 13.0622]
      },
      elevationMeters: 315
    };

    const res = await request(app).post('/api/weather/stations').send(payload);
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.stationCode, 'AWS-SOK-9001');
    createdStationCode = res.body.data.stationCode;
    console.log('  ✓ POST /api/weather/stations registers new station with GeoJSON Point coordinates');
  }

  // 4. POST /api/weather/stations - Reject invalid payload
  {
    const res = await request(app).post('/api/weather/stations').send({ stationName: 'Missing Coords' });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    console.log('  ✓ POST /api/weather/stations rejects incomplete payload with 400 Bad Request');
  }

  // 5. GET /api/weather/stations/:id/telemetry
  {
    const res = await request(app).get('/api/weather/stations/AWS-JOS-1042/telemetry?cropType=Potato');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.station.stationCode, 'AWS-JOS-1042');
    assert.ok(res.body.currentObservation);
    assert.ok(res.body.hazardEvaluation);
    assert.strictEqual(res.body.sevenDayForecast.length, 7);
    assert.strictEqual(res.body.hourlyForecast.length, 24);
    assert.strictEqual(res.body.radarGrid.length, 64);
    console.log('  ✓ GET /api/weather/stations/:id/telemetry returns live observation, 7-day forecast, 24h spray plan, and 8x8 radar grid');
  }

  // 6. GET /api/weather/stations/:id/spray-windows
  {
    const res = await request(app).get(`/api/weather/stations/${createdStationCode}/spray-windows`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.totalHoursEvaluated, 24);
    assert.ok(Array.isArray(res.body.data.hourlyWindows));
    console.log('  ✓ GET /api/weather/stations/:id/spray-windows computes 24-hour Delta-T & drift schedule');
  }

  // 7. POST /api/weather/ingest - Ingest frost telemetry & verify alert generation
  {
    const ingestPayload = {
      stationCode: 'AWS-JOS-1042',
      cropType: 'Potato',
      airTempCelsius: 1.8,
      minTempCelsius: 0.9,
      maxTempCelsius: 15.5,
      relativeHumidityPct: 45,
      windSpeedKmh: 2.5,
      cloudCoverPct: 5
    };

    const res = await request(app).post('/api/weather/ingest').send(ingestPayload);
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.hazardEvaluation.overallRiskLevel, 'Critical Emergency');
    assert.ok(res.body.hazardEvaluation.alerts.some((a) => a.hazardType === 'RADIATIVE_FROST'));
    console.log('  ✓ POST /api/weather/ingest normalizes sensor telemetry and triggers Critical Radiative Frost alert');
  }

  // 8. GET /api/weather/alerts
  {
    const res = await request(app).get('/api/weather/alerts?stationCode=AWS-JOS-1042');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.count >= 1);
    console.log('  ✓ GET /api/weather/alerts returns active hazard alerts for target station');
  }

  // 9. POST /api/weather/subscriptions & POST /api/weather/alerts/dispatch
  {
    const subRes = await request(app).post('/api/weather/subscriptions').send({
      subscriberEmail: 'musa.danladi@agrily.ng',
      farmerName: 'Alhaji Musa Danladi',
      phoneNumber: '+2348029998877',
      stationCode: 'AWS-JOS-1042',
      cropType: 'Potato',
      preferredLanguage: 'Hausa',
      thresholds: {
        frostTemperatureThresholdCelsius: 3.0
      }
    });
    assert.strictEqual(subRes.status, 201);
    assert.strictEqual(subRes.body.success, true);

    const dispRes = await request(app).post('/api/weather/alerts/dispatch').send({
      stationCode: 'AWS-JOS-1042',
      hazardType: 'RADIATIVE_FROST',
      severity: 'Critical Emergency',
      recipientEmail: 'musa.danladi@agrily.ng',
      channels: ['Push', 'SMS', 'WhatsApp']
    });
    assert.strictEqual(dispRes.status, 200);
    assert.strictEqual(dispRes.body.receipt.deliveryStatus, 'DELIVERED');
    console.log('  ✓ POST /api/weather/subscriptions & /alerts/dispatch manage threshold rules and emergency dispatch receipts');
  }

  console.log('✅ All Hyperlocal Weather REST API integration tests passed!');
  process.exit(0);
}

runWeatherApiTests().catch((err) => {
  console.error('❌ Weather API Test Failure:', err);
  process.exit(1);
});
