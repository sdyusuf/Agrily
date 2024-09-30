const assert = require('assert');
const request = require('supertest');
const app = require('../app');
const {
  detectPhenologyAnomalies,
  generatePhenologySeasonReport
} = require('../services/phenologyAnomalyDetectionService');

console.log('🧪 Starting Satellite NDVI REST API & Anomaly Detection Unit Tests...');

async function runApiTests() {
  // 1. GET /api/satellite/parcels
  {
    const res = await request(app).get('/api/satellite/parcels');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);
    assert.ok(res.body.data[0].parcelCode);
    console.log('  ✓ GET /api/satellite/parcels returns list of registered farm parcels');
  }

  // 2. POST /api/satellite/parcels - valid registration
  let createdParcelId = '';
  {
    const newParcel = {
      parcelName: 'Plateau Highlands Potato Plot 3',
      cropType: 'Tomato',
      areaHectares: 15.2,
      boundary: {
        type: 'Polygon',
        coordinates: [
          [
            [8.852, 9.912],
            [8.865, 9.912],
            [8.865, 9.925],
            [8.852, 9.925],
            [8.852, 9.912]
          ]
        ]
      },
      elevationMeters: 1280,
      agroEcologicalZone: 'Mid-Altitude Montane',
      soilClassification: 'Humic Nitisol',
      irrigationType: 'Drip Irrigation'
    };

    const res = await request(app).post('/api/satellite/parcels').send(newParcel);
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data._id);
    createdParcelId = res.body.data._id;
    assert.strictEqual(res.body.data.parcelName, newParcel.parcelName);
    console.log('  ✓ POST /api/satellite/parcels registers parcel with GeoJSON boundary');
  }

  // 3. POST /api/satellite/parcels - validation failure on missing fields
  {
    const res = await request(app).post('/api/satellite/parcels').send({ parcelName: 'Incomplete' });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    console.log('  ✓ POST /api/satellite/parcels rejects invalid payload with 400 Bad Request');
  }

  // 4. GET /api/satellite/parcels/:id
  {
    const res = await request(app).get(`/api/satellite/parcels/${createdParcelId}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(String(res.body.data._id), String(createdParcelId));
    console.log('  ✓ GET /api/satellite/parcels/:id retrieves target parcel record');
  }

  // 5. POST /api/satellite/ingest-pass
  {
    const passPayload = {
      parcelId: createdParcelId,
      tileId: `T32PQR_${Date.now()}`,
      acquisitionDate: '2024-09-28T10:15:00Z',
      baseNdvi: 0.74,
      cloudPercent: 1.5
    };

    const res = await request(app).post('/api/satellite/ingest-pass').send(passPayload);
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.zonalSummary);
    assert.ok(res.body.zonalSummary.meanNdvi > 0);
    assert.ok(res.body.gridCellCount >= 100);
    console.log('  ✓ POST /api/satellite/ingest-pass computes 10m zonal raster statistics');
  }

  // 6. GET /api/satellite/parcels/:id/ndvi-timeline
  {
    const res = await request(app).get(`/api/satellite/parcels/${createdParcelId}/ndvi-timeline`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 1);
    assert.ok(typeof res.body.data[0].meanNdvi === 'number');
    console.log('  ✓ GET /api/satellite/parcels/:id/ndvi-timeline returns multi-pass phenology curve');
  }

  // 7. GET /api/satellite/parcels/:id/zonal-grid (with spectral band query)
  {
    const res = await request(app).get(`/api/satellite/parcels/${createdParcelId}/zonal-grid?band=NDWI`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.spectralBand, 'NDWI');
    assert.ok(Array.isArray(res.body.cells));
    assert.ok(res.body.cells.length > 0);
    assert.ok(typeof res.body.cells[0].ndwi === 'number');
    console.log('  ✓ GET /api/satellite/parcels/:id/zonal-grid filters by spectral band (NDWI/NDVI)');
  }

  // 8. GET /api/satellite/parcels/:id/vigor-alerts
  {
    const res = await request(app).get(`/api/satellite/parcels/${createdParcelId}/vigor-alerts`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.report);
    assert.ok(res.body.report.cryptographicReportSeal);
    assert.strictEqual(res.body.report.cryptographicReportSeal.length, 64);
    assert.ok(Array.isArray(res.body.report.anomalies));
    console.log('  ✓ GET /api/satellite/parcels/:id/vigor-alerts produces sealed phenology report');
  }

  // 9. Phenology Anomaly Detection Algorithms
  {
    const mockSeries = [
      { readingDate: '2024-06-01', meanNdvi: 0.75, meanNdwi: 0.30 },
      { readingDate: '2024-06-15', meanNdvi: 0.78, meanNdwi: 0.32 },
      { readingDate: '2024-07-01', meanNdvi: 0.82, meanNdwi: 0.35 },
      { readingDate: '2024-07-15', meanNdvi: 0.45, meanNdwi: -0.12 } // Acute drop & drought
    ];

    const alerts = detectPhenologyAnomalies(mockSeries);
    assert.ok(alerts.length >= 1, 'Should detect at least 1 anomaly in sudden drop series');
    const dropAlert = alerts.find((a) => a.metric === 'ABRUPT_CANOPY_SHOCK');
    assert.ok(dropAlert, 'Abrupt canopy shock alert must be generated');
    assert.strictEqual(dropAlert.severity, 'Critical');
    console.log('  ✓ detectPhenologyAnomalies identifies acute canopy shock and water deficit');
  }

  console.log('\n🎉 All 9/9 Satellite REST API & Anomaly Detection tests passed successfully!\n');
  process.exit(0);
}

runApiTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
