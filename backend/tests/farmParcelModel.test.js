const assert = require('assert');
const mongoose = require('mongoose');
const FarmParcel = require('../models/FarmParcel');
const SatellitePassRecord = require('../models/SatellitePassRecord');
const NdviZonalReading = require('../models/NdviZonalReading');

console.log('🧪 Starting Farm Parcel & Satellite Model Unit Tests...');

// Test 1: Valid Farm Parcel Schema Validation
{
  const parcel = new FarmParcel({
    farmerId: new mongoose.Types.ObjectId(),
    parcelName: 'Kano North Irrigation Plot 4B',
    cropType: 'Maize',
    cropVariety: 'SAMMAZ-15 Hybrid',
    areaHectares: 18.5,
    boundary: {
      type: 'Polygon',
      coordinates: [
        [
          [8.5215, 12.0124],
          [8.5310, 12.0124],
          [8.5310, 12.0210],
          [8.5215, 12.0210],
          [8.5215, 12.0124]
        ]
      ]
    },
    elevationMeters: 472,
    agroEcologicalZone: 'Sudan Savannah',
    soilClassification: 'Ferric Luvisol',
    irrigationType: 'Center Pivot'
  });

  const err = parcel.validateSync();
  assert.strictEqual(err, undefined, 'Valid farm parcel should pass validation cleanly');
  assert.strictEqual(parcel.status, 'Active', 'Default status must be Active');
  assert.strictEqual(parcel.areaHectares, 18.5, 'Area must match specified hectares');
  console.log('  ✓ should validate complete GeoJSON farm parcel polygon');
}

// Test 2: Reject Invalid Polygon Boundary & Missing Farmer
{
  const invalidParcel = new FarmParcel({
    parcelName: 'Faulty Plot',
    cropType: 'Soybean',
    areaHectares: 5.0,
    boundary: {
      type: 'LineString', // Unsupported type
      coordinates: [8.5, 12.0]
    }
  });

  const err = invalidParcel.validateSync();
  assert.ok(err, 'Validation should fail on missing farmerId and invalid boundary type');
  assert.ok(err.errors.farmerId, 'farmerId error should be present');
  assert.ok(err.errors['boundary.type'], 'boundary.type error should be present');
  console.log('  ✓ should reject invalid boundary geometry and missing required farmer identity');
}

// Test 3: Satellite Pass Record Validation
{
  const pass = new SatellitePassRecord({
    tileId: 'T32PQR_20240924T101500',
    satelliteSource: 'Sentinel-2B',
    acquisitionDate: new Date('2024-09-24T10:15:00Z'),
    cloudCoveragePercentage: 6.2,
    cloudShadowPercentage: 1.1,
    sunZenithAngle: 28.5,
    sunAzimuthAngle: 114.2,
    processingLevel: 'L2A_SurfaceReflectance',
    bandReflectanceSummary: {
      b02BlueMean: 0.042,
      b03GreenMean: 0.068,
      b04RedMean: 0.081,
      b08NirMean: 0.655,
      b11SwirMean: 0.198
    }
  });

  const err = pass.validateSync();
  assert.strictEqual(err, undefined, 'Valid SatellitePassRecord must pass validation');
  assert.strictEqual(pass.satelliteSource, 'Sentinel-2B');
  assert.strictEqual(pass.dataQualityStatus, 'Verified');
  assert.strictEqual(pass.cloudCoveragePercentage, 6.2);
  console.log('  ✓ should validate Sentinel-2 L2A tile metadata and spectral band summary');
}

// Test 4: Reject Invalid Cloud Cover Range
{
  const invalidPass = new SatellitePassRecord({
    tileId: 'T32PQR_ERR',
    acquisitionDate: new Date(),
    cloudCoveragePercentage: 145 // > 100 invalid
  });

  const err = invalidPass.validateSync();
  assert.ok(err, 'Pass record with cloud coverage > 100 must fail');
  assert.ok(err.errors.cloudCoveragePercentage, 'cloudCoveragePercentage error must exist');
  console.log('  ✓ should enforce cloud coverage percentage boundaries between 0 and 100');
}

// Test 5: NdviZonalReading Validation & Zonal Statistics Structure
{
  const zonal = new NdviZonalReading({
    parcelId: new mongoose.Types.ObjectId(),
    passId: new mongoose.Types.ObjectId(),
    readingDate: new Date('2024-09-24'),
    meanNdvi: 0.684,
    minNdvi: 0.195,
    maxNdvi: 0.882,
    stdDevNdvi: 0.124,
    meanEvi: 0.542,
    meanSavi: 0.485,
    meanNdwi: 0.185,
    cloudMaskPercentage: 1.5,
    chlorophyllIndex: 4.8,
    waterStressIndex: 0.22,
    vigorDistribution: {
      severeStressHectares: 1.1,
      moderateStressHectares: 2.8,
      healthyHectares: 10.4,
      hyperDenseHectares: 4.2
    },
    gridRaster: [
      {
        cellId: 'CELL-0-0',
        x: 0,
        y: 0,
        lat: 12.015,
        lng: 8.525,
        ndvi: 0.72,
        evi: 0.58,
        savi: 0.51,
        ndwi: 0.21,
        scl: 4,
        isMasked: false,
        stressSeverity: 'Dense Canopy'
      },
      {
        cellId: 'CELL-0-1',
        x: 0,
        y: 1,
        lat: 12.016,
        lng: 8.525,
        ndvi: 0.18,
        evi: 0.12,
        savi: 0.14,
        ndwi: -0.10,
        scl: 4,
        isMasked: false,
        stressSeverity: 'Severe Stress'
      }
    ]
  });

  const err = zonal.validateSync();
  assert.strictEqual(err, undefined, 'NdviZonalReading should pass validation cleanly');
  assert.strictEqual(zonal.meanNdvi, 0.684);
  assert.strictEqual(zonal.gridRaster.length, 2);
  assert.strictEqual(zonal.gridRaster[0].stressSeverity, 'Dense Canopy');
  assert.strictEqual(zonal.vigorDistribution.healthyHectares, 10.4);
  console.log('  ✓ should validate NdviZonalReading metrics, vigor distribution, and raster grid array');
}

console.log('\n🎉 All 5/5 Farm Parcel & Satellite Model unit tests passed successfully!\n');
