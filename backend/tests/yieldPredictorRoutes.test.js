/**
 * ==============================================================================
 * 🧪 SPRINT 21 INTEGRATION TESTS: HARVEST YIELD PREDICTOR REST API
 * ==============================================================================
 */

const assert = require('assert');
const request = require('supertest');
const app = require('../app');

console.log('🧪 Starting Harvest Yield Predictor REST API Integration Tests...');

async function runYieldPredictorApiTests() {
  // 1. GET /api/yield-predictor/cultivars
  {
    const res = await request(app).get('/api/yield-predictor/cultivars');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 6);
    assert.ok(res.body.data.some((c) => c.cultivarCode === 'SAMMAZ-15'));
    console.log('  ✓ GET /api/yield-predictor/cultivars returns genetic cultivar parameter catalog');
  }

  // 2. GET /api/yield-predictor/parcels
  {
    const res = await request(app).get('/api/yield-predictor/parcels');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.length >= 4);
    assert.strictEqual(res.body.data[0].parcelCode, 'NG-MAI-KANO4B');
    console.log('  ✓ GET /api/yield-predictor/parcels returns monitored farm parcels');
  }

  // 3. GET /api/yield-predictor/parcels/:id/forecast
  {
    const res = await request(app).get('/api/yield-predictor/parcels/NG-MAI-KANO4B/forecast');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.parcel.parcelCode, 'NG-MAI-KANO4B');
    assert.ok(res.body.prediction.predictedYieldTonsPerHa > 0);
    assert.ok(res.body.monteCarlo.p10DownsideTonsPerHa < res.body.monteCarlo.p90UpsideTonsPerHa);
    assert.strictEqual(res.body.biomassCurve.length, 7);
    assert.strictEqual(res.body.spatialZoneGrid.cells.length, 64);
    console.log('  ✓ GET /api/yield-predictor/parcels/:id/forecast returns ensemble forecast, Monte Carlo, biomass curve, and 8x8 spatial zone grid');
  }

  // 4. POST /api/yield-predictor/simulate - What-If sensitivity
  {
    const simRes = await request(app).post('/api/yield-predictor/simulate').send({
      cropType: 'Maize',
      cultivarCode: 'SAMMAZ-15',
      areaHectares: 30.0,
      peakNdvi: 0.84,
      seasonalRainfallMm: 670,
      appliedNitrogenKgHa: 135,
      pestDiseaseLossPct: 2.0
    });

    assert.strictEqual(simRes.status, 200);
    assert.strictEqual(simRes.body.success, true);
    assert.ok(simRes.body.prediction.totalHarvestTonnage > 120);
    assert.ok(simRes.body.monteCarlo.p50GrossRevenueNgn > 0);
    console.log('  ✓ POST /api/yield-predictor/simulate computes What-If agronomic sensitivity scenarios');
  }

  // 5. POST /api/yield-predictor/calibrate-harvest - Weighbridge calibration
  {
    const calRes = await request(app).post('/api/yield-predictor/calibrate-harvest').send({
      parcelCode: 'NG-MAI-KANO4B',
      cropType: 'Maize',
      cultivarCode: 'SAMMAZ-15',
      harvestSeasonLabel: '2024 Wet Season',
      harvestedAreaHectares: 24.5,
      wetHarvestedTonnage: 162.0,
      harvestMoisturePct: 19.0,
      standardCommercialMoisturePct: 13.0,
      preHarvestPredictedYieldTonsPerHa: 6.10
    });

    assert.strictEqual(calRes.status, 201);
    assert.strictEqual(calRes.body.success, true);
    assert.ok(calRes.body.data.dryAdjustedCommercialTonnage < 162.0);
    assert.ok(calRes.body.data.actualYieldTonsPerHa > 5.5);
    console.log('  ✓ POST /api/yield-predictor/calibrate-harvest ingests weighbridge ticket and computes dry shrinkage & MAPE');
  }

  console.log('✅ All Harvest Yield Predictor REST API integration tests passed!');
  process.exit(0);
}

runYieldPredictorApiTests().catch((err) => {
  console.error('❌ Yield Predictor API Test Failure:', err);
  process.exit(1);
});
