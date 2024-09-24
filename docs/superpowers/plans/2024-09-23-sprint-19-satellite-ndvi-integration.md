# Sprint 19: Satellite NDVI Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver end-to-end Sentinel-2 multi-spectral satellite imagery ingestion, mathematical vegetation indices (NDVI, EVI, SAVI, NDWI), GeoJSON parcel boundary mapping, and an interactive canopy vigor cockpit adhering to the Agrily Earth & Innovation Design System, expanding the codebase by ~7,000 LOC toward the 100,500 LOC milestone.

**Architecture:** A multi-layered agronomy telemetry architecture. In the backend, MongoDB models store GeoJSON farm parcel boundaries, Sentinel-2 L2A tile metadata, and 10-meter raster grid zonal readings. A dedicated vegetation index engine computes pixel-level NDVI, EVI, SAVI, and NDWI indices alongside Scene Classification Layer (SCL) cloud/shadow masking and CUSUM phenology anomaly detection. The REST API exposes secure endpoints for parcel registration, satellite pass ingestion, and raster time-series queries. The frontend provides a tactile, responsive Satellite Canopy Cockpit with canvas-based raster rendering, spectral band toggle, zonal health gauges, and seasonal phenology curves.

**Tech Stack:** Node.js, Express, Mongoose, Joi, Supertest, Jest, React, HTML5 Canvas, React Testing Library, Agrily CSS Design System tokens.

**Spec:** [SPRINT_LOC_TRACKER.md: Sprint 19 (lines 87)](file:///c:/Users/User/Documents/GitHub/Agrily/SPRINT_LOC_TRACKER.md#L87) and [DESIGN_SYSTEM.md](file:///c:/Users/User/Documents/GitHub/Agrily/DESIGN_SYSTEM.md).

---

## Global Constraints

- Target Timeframe: **September 23 – October 06, 2024**
- Commit Authors & Commit Dates MUST adhere strictly to the 2024 calendar:
  - Commit 19.1: `SD Yusuf <sdyusuf@users.noreply.github.com>` @ `2024-09-24T10:15:00`
  - Commit 19.2: `babban-dev <mryusuf7sd@gmail.com>` @ `2024-09-27T14:30:20`
  - Commit 19.3: `YSD Hillside <ysdhilsyde@users.noreply.github.com>` @ `2024-09-30T11:45:10`
  - Commit 19.4: `Yasin <114921676+yacxeen1@users.noreply.github.com>` @ `2024-10-03T15:20:40`
  - Commit 19.5: `Yusuf Samaila <114921676+ysamaila@users.noreply.github.com>` @ `2024-10-06T16:50:00`
- Both `$env:GIT_COMMITTER_DATE = $env:GIT_AUTHOR_DATE` and `$env:GIT_COMMITTER_NAME = $env:GIT_AUTHOR_NAME` on every commit.
- Path A Git Workflow: Fast-forward merge directly into `main` locally without opening web PRs.
- 100% test pass rate required on both backend (`npm.cmd test` in `backend/`) and frontend (`npm.cmd test -- --watchAll=false` in `frontend/`).
- Design System: Zero emojis in UI components. Only curated SVG icons (`Icons.jsx`) and brand colors (`#1b4332`, `#2d6a4f`, `#bc6c25`, `#dda15e`, `#f8faf9`, `#0f172a`).

---

## File Structure Overview

### Backend Subsystem
- `backend/models/FarmParcel.js`: Farm boundary GeoJSON Polygon/MultiPolygon, area in hectares, active crop, centroid coordinates, soil reference.
- `backend/models/SatellitePassRecord.js`: Sentinel-2 L2A tile ID, pass date, cloud cover %, solar angles, data quality flags.
- `backend/models/NdviZonalReading.js`: 10-meter raster cells grid, zonal statistical aggregates (min, max, mean, stdDev, chlorophyll index, water stress score).
- `backend/services/vegetationIndexEngine.js`: Pure mathematical computation of NDVI, EVI, SAVI, NDWI, GNDVI, and NDRE.
- `backend/services/sentinelSceneMaskService.js`: SCL scene classification cloud, shadow, and cirrus filtering.
- `backend/services/canopyVigorZonalService.js`: Zonal histogram categorization (Severe Stress, Moderate, Healthy, Dense Canopy).
- `backend/services/phenologyAnomalyDetectionService.js`: Statistical CUSUM & Z-score time-series crop anomaly detection.
- `backend/routes/satelliteRoutes.js`: Express REST API for parcel registration, pass ingestion, time-series metrics, and zonal raster grids.

### Backend Tests
- `backend/tests/farmParcelModel.test.js`: Schema validation, GeoJSON geometry constraints, index verification.
- `backend/tests/vegetationIndexEngine.test.js`: Mathematical formulas, edge cases (division by zero, saturation, clamping).
- `backend/tests/sentinelSceneMaskService.test.js`: Cloud mask filtering and interpolation.
- `backend/tests/satelliteRoutes.test.js`: Supertest integration testing all API endpoints with authenticated JWT.

### Frontend Subsystem
- `frontend/src/components/SatelliteCanopyVigorMap.jsx` & `.css`: HTML5 Canvas / SVG interactive raster grid with hover coordinates, color ramps, and tactile controls.
- `frontend/src/components/ZonalCropHealthMetricsCard.jsx` & `.css`: Mean NDVI meter, active canopy area, water stress gauge, and vegetation health classification.
- `frontend/src/components/SpectralBandSelector.jsx` & `.css`: Tactile pill switches for True Color RGB, False Color Infrared, NDVI, and NDWI.
- `frontend/src/components/PhenologyTimelineChart.jsx` & `.css`: 12-month seasonal phenology curve with historical baseline envelope.
- `frontend/src/pages/SatelliteNdviCockpit.jsx` & `.css`: Master farm canopy command cockpit integrating parcel switcher, date scrubber, and export.
- `frontend/src/pages/__tests__/SatelliteNdviCockpit.test.jsx`: React Testing Library test suite verifying render, interaction, and data binding.

---

### Task 1: Satellite Telemetry Schemas, Spectral Indices & Farm Parcel Models (Commit 19.1)

**Files:**
- Create: `backend/models/FarmParcel.js`
- Create: `backend/models/SatellitePassRecord.js`
- Create: `backend/models/NdviZonalReading.js`
- Create: `backend/tests/farmParcelModel.test.js`
- Modify: `backend/package.json`

**Interfaces:**
- Consumes: Mongoose, MongoDB 2dsphere indexing.
- Produces: `FarmParcel`, `SatellitePassRecord`, and `NdviZonalReading` models with GeoJSON polygon validation and aggregation helpers.

- [ ] **Step 1: Write the failing unit tests for FarmParcel and Satellite models**
Create `backend/tests/farmParcelModel.test.js`:
```javascript
const mongoose = require('mongoose');
const FarmParcel = require('../models/FarmParcel');
const SatellitePassRecord = require('../models/SatellitePassRecord');
const NdviZonalReading = require('../models/NdviZonalReading');

describe('FarmParcel and Satellite Data Models', () => {
  it('should validate a complete GeoJSON farm parcel polygon', () => {
    const parcel = new FarmParcel({
      farmerId: new mongoose.Types.ObjectId(),
      parcelName: 'Green Valley Plot Alpha',
      cropType: 'Maize',
      areaHectares: 24.5,
      boundary: {
        type: 'Polygon',
        coordinates: [
          [
            [8.521, 10.312],
            [8.528, 10.312],
            [8.528, 10.319],
            [8.521, 10.319],
            [8.521, 10.312]
          ]
        ]
      },
      elevationMeters: 412,
      soilClassification: 'Ferric Luvisol'
    });
    const err = parcel.validateSync();
    expect(err).toBeUndefined();
    expect(parcel.status).toBe('Active');
  });

  it('should reject invalid coordinates in FarmParcel boundary', () => {
    const parcel = new FarmParcel({
      farmerId: new mongoose.Types.ObjectId(),
      parcelName: 'Invalid Plot',
      cropType: 'Soybean',
      areaHectares: 10,
      boundary: {
        type: 'Point',
        coordinates: [8.5]
      }
    });
    const err = parcel.validateSync();
    expect(err).toBeDefined();
  });

  it('should validate SatellitePassRecord metadata', () => {
    const pass = new SatellitePassRecord({
      tileId: 'T32PQR_20240924T101500',
      satelliteSource: 'Sentinel-2B',
      acquisitionDate: new Date('2024-09-24T10:15:00Z'),
      cloudCoveragePercentage: 4.8,
      sunZenithAngle: 28.4,
      sunAzimuthAngle: 112.6,
      processingLevel: 'L2A_SurfaceReflectance'
    });
    const err = pass.validateSync();
    expect(err).toBeUndefined();
  });

  it('should validate NdviZonalReading statistics structure', () => {
    const reading = new NdviZonalReading({
      parcelId: new mongoose.Types.ObjectId(),
      passId: new mongoose.Types.ObjectId(),
      readingDate: new Date('2024-09-24'),
      meanNdvi: 0.68,
      minNdvi: 0.22,
      maxNdvi: 0.89,
      stdDevNdvi: 0.11,
      meanEvi: 0.54,
      meanSavi: 0.49,
      meanNdwi: 0.18,
      cloudMaskPercentage: 1.2,
      vigorDistribution: {
        severeStressHectares: 1.2,
        moderateStressHectares: 3.5,
        healthyHectares: 14.8,
        hyperDenseHectares: 5.0
      }
    });
    const err = reading.validateSync();
    expect(err).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm.cmd test -- backend/tests/farmParcelModel.test.js`
Expected: FAIL (Cannot find module '../models/FarmParcel')

- [ ] **Step 3: Implement `backend/models/FarmParcel.js`**
Define Mongoose schema with GeoJSON polygon validation, 2dsphere index, and helper methods:
```javascript
const mongoose = require('mongoose');

const farmParcelSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    parcelName: {
      type: String,
      required: true,
      trim: true
    },
    cropType: {
      type: String,
      required: true,
      enum: ['Maize', 'Cassava', 'Yam', 'Rice', 'Sorghum', 'Millet', 'Soybean', 'Groundnut', 'Tomato', 'Oil Palm', 'Fallow']
    },
    variety: {
      type: String,
      default: 'Standard Hybrid'
    },
    plantingDate: {
      type: Date,
      default: Date.now
    },
    expectedHarvestDate: {
      type: Date
    },
    areaHectares: {
      type: Number,
      required: true,
      min: 0.1
    },
    boundary: {
      type: {
        type: String,
        enum: ['Polygon', 'MultiPolygon'],
        required: true
      },
      coordinates: {
        type: [[[Number]]],
        required: true
      }
    },
    elevationMeters: {
      type: Number,
      default: 0
    },
    soilClassification: {
      type: String,
      default: 'Unclassified'
    },
    irrigationType: {
      type: String,
      enum: ['Rainfed', 'Drip', 'Pivot', 'Furrow', 'Manual'],
      default: 'Rainfed'
    },
    status: {
      type: String,
      enum: ['Active', 'Fallow', 'Harvested', 'Archived'],
      default: 'Active'
    }
  },
  { timestamps: true }
);

farmParcelSchema.index({ boundary: '2dsphere' });

module.exports = mongoose.model('FarmParcel', farmParcelSchema);
```

- [ ] **Step 4: Implement `backend/models/SatellitePassRecord.js` and `backend/models/NdviZonalReading.js`**
Create `backend/models/SatellitePassRecord.js`:
```javascript
const mongoose = require('mongoose');

const satellitePassRecordSchema = new mongoose.Schema(
  {
    tileId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    satelliteSource: {
      type: String,
      enum: ['Sentinel-2A', 'Sentinel-2B', 'Landsat-8', 'Landsat-9', 'PlanetScope'],
      default: 'Sentinel-2B'
    },
    acquisitionDate: {
      type: Date,
      required: true,
      index: true
    },
    cloudCoveragePercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    sunZenithAngle: {
      type: Number,
      default: 30
    },
    sunAzimuthAngle: {
      type: Number,
      default: 120
    },
    processingLevel: {
      type: String,
      enum: ['L1C_TopAtmosphere', 'L2A_SurfaceReflectance'],
      default: 'L2A_SurfaceReflectance'
    },
    dataQualityStatus: {
      type: String,
      enum: ['Verified', 'Degraded_Cloud', 'Partial_Coverage', 'Sensor_Error'],
      default: 'Verified'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SatellitePassRecord', satellitePassRecordSchema);
```

Create `backend/models/NdviZonalReading.js`:
```javascript
const mongoose = require('mongoose');

const gridCellSchema = new mongoose.Schema(
  {
    x: Number,
    y: Number,
    lat: Number,
    lng: Number,
    ndvi: Number,
    evi: Number,
    savi: Number,
    ndwi: Number,
    scl: Number, // Scene classification layer code
    isMasked: { type: Boolean, default: false }
  },
  { _id: false }
);

const ndviZonalReadingSchema = new mongoose.Schema(
  {
    parcelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FarmParcel',
      required: true,
      index: true
    },
    passId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SatellitePassRecord',
      required: true,
      index: true
    },
    readingDate: {
      type: Date,
      required: true,
      index: true
    },
    meanNdvi: {
      type: Number,
      required: true
    },
    minNdvi: Number,
    maxNdvi: Number,
    stdDevNdvi: Number,
    meanEvi: Number,
    meanSavi: Number,
    meanNdwi: Number,
    cloudMaskPercentage: {
      type: Number,
      default: 0
    },
    chlorophyllIndex: {
      type: Number,
      default: 0
    },
    waterStressIndex: {
      type: Number,
      default: 0
    },
    vigorDistribution: {
      severeStressHectares: { type: Number, default: 0 },
      moderateStressHectares: { type: Number, default: 0 },
      healthyHectares: { type: Number, default: 0 },
      hyperDenseHectares: { type: Number, default: 0 }
    },
    gridRaster: [gridCellSchema]
  },
  { timestamps: true }
);

ndviZonalReadingSchema.index({ parcelId: 1, readingDate: -1 });

module.exports = mongoose.model('NdviZonalReading', ndviZonalReadingSchema);
```

- [ ] **Step 5: Run tests and verify PASS**
Run: `npm.cmd test -- backend/tests/farmParcelModel.test.js`
Expected: PASS (4 tests passed)

- [ ] **Step 6: Commit as Commit 19.1**
```powershell
$env:GIT_AUTHOR_NAME = "SD Yusuf"
$env:GIT_AUTHOR_EMAIL = "sdyusuf@users.noreply.github.com"
$env:GIT_COMMITTER_NAME = "SD Yusuf"
$env:GIT_COMMITTER_EMAIL = "sdyusuf@users.noreply.github.com"
$env:GIT_AUTHOR_DATE = "2024-09-24T10:15:00"
$env:GIT_COMMITTER_DATE = "2024-09-24T10:15:00"
git add backend/models/FarmParcel.js backend/models/SatellitePassRecord.js backend/models/NdviZonalReading.js backend/tests/farmParcelModel.test.js
git commit -m "feat(satellite): define FarmParcel, SatellitePassRecord, and NdviZonalReading schemas with 2dsphere indexing"
```

---

### Task 2: Multi-Spectral Vegetation Index Engine & Cloud Masking Pipeline (Commit 19.2)

**Files:**
- Create: `backend/services/vegetationIndexEngine.js`
- Create: `backend/services/sentinelSceneMaskService.js`
- Create: `backend/services/canopyVigorZonalService.js`
- Create: `backend/tests/vegetationIndexEngine.test.js`
- Create: `backend/tests/sentinelSceneMaskService.test.js`

**Interfaces:**
- Consumes: Spectral reflectances (B02 Blue, B03 Green, B04 Red, B08 NIR, B11 SWIR, SCL).
- Produces: Normalized indices clamped to [-1.0, 1.0], cloud mask filtering, and zonal stress aggregation.

- [ ] **Step 1: Write unit tests for Vegetation Index Engine and Masking Service**
Create `backend/tests/vegetationIndexEngine.test.js`:
```javascript
const {
  calculateNdvi,
  calculateEvi,
  calculateSavi,
  calculateNdwi,
  computePixelIndices
} = require('../services/vegetationIndexEngine');

describe('Vegetation Index Engine', () => {
  it('should accurately compute NDVI for dense canopy', () => {
    // NIR = 0.8, Red = 0.1 -> NDVI = (0.8 - 0.1) / (0.8 + 0.1) = 0.7 / 0.9 = 0.7778
    const ndvi = calculateNdvi(0.8, 0.1);
    expect(ndvi).toBeCloseTo(0.7778, 3);
  });

  it('should return 0 or clamp if NIR + Red is 0 or negative', () => {
    expect(calculateNdvi(0, 0)).toBe(0);
    expect(calculateNdvi(-0.1, -0.1)).toBe(0);
  });

  it('should compute Enhanced Vegetation Index (EVI)', () => {
    // EVI = 2.5 * ((NIR - Red) / (NIR + 6*Red - 7.5*Blue + 1))
    const evi = calculateEvi(0.75, 0.12, 0.05);
    expect(evi).toBeGreaterThan(0.3);
    expect(evi).toBeLessThan(1.0);
  });

  it('should compute Soil-Adjusted Vegetation Index (SAVI) with L=0.5', () => {
    const savi = calculateSavi(0.70, 0.15, 0.5);
    expect(savi).toBeGreaterThan(0.3);
    expect(savi).toBeLessThan(0.9);
  });

  it('should compute Normalized Difference Water Index (NDWI)', () => {
    // NDWI = (NIR - SWIR) / (NIR + SWIR)
    const ndwi = calculateNdwi(0.65, 0.35);
    expect(ndwi).toBeCloseTo(0.30, 2);
  });

  it('should compute all pixel indices in unified struct', () => {
    const res = computePixelIndices({ nir: 0.82, red: 0.09, blue: 0.04, swir: 0.22 });
    expect(res.ndvi).toBeGreaterThan(0.75);
    expect(res.evi).toBeGreaterThan(0.5);
    expect(res.savi).toBeGreaterThan(0.45);
    expect(res.ndwi).toBeGreaterThan(0.4);
    expect(res.healthCategory).toBe('Dense Canopy');
  });
});
```

Create `backend/tests/sentinelSceneMaskService.test.js`:
```javascript
const {
  isCloudOrShadow,
  filterMaskedCells,
  interpolateCloudGaps
} = require('../services/sentinelSceneMaskService');

describe('Sentinel Scene Masking Service (SCL)', () => {
  it('should flag cloud and cloud shadow SCL classification codes', () => {
    // SCL: 3 = Cloud Shadow, 8 = Cloud Medium Prob, 9 = Cloud High Prob, 10 = Cirrus
    expect(isCloudOrShadow(3)).toBe(true);
    expect(isCloudOrShadow(8)).toBe(true);
    expect(isCloudOrShadow(9)).toBe(true);
    expect(isCloudOrShadow(10)).toBe(true);
    // SCL: 4 = Vegetation, 5 = Not Vegetated, 7 = Unclassified
    expect(isCloudOrShadow(4)).toBe(false);
    expect(isCloudOrShadow(5)).toBe(false);
  });

  it('should correctly flag masked cells in a grid matrix', () => {
    const cells = [
      { x: 0, y: 0, scl: 4, ndvi: 0.65 },
      { x: 0, y: 1, scl: 9, ndvi: 0.10 },
      { x: 1, y: 0, scl: 3, ndvi: 0.12 }
    ];
    const filtered = filterMaskedCells(cells);
    expect(filtered[0].isMasked).toBe(false);
    expect(filtered[1].isMasked).toBe(true);
    expect(filtered[2].isMasked).toBe(true);
  });

  it('should interpolate masked values from valid neighbors', () => {
    const grid = [
      { x: 0, y: 0, ndvi: 0.70, isMasked: false },
      { x: 1, y: 0, ndvi: 0.00, isMasked: true },
      { x: 2, y: 0, ndvi: 0.74, isMasked: false }
    ];
    const interpolated = interpolateCloudGaps(grid);
    expect(interpolated[1].ndvi).toBeCloseTo(0.72, 2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**
Run: `npm.cmd test -- backend/tests/vegetationIndexEngine.test.js`
Expected: FAIL

- [ ] **Step 3: Implement `backend/services/vegetationIndexEngine.js`**
Write math formulas with robust boundaries and edge clamping:
```javascript
/**
 * Normalized Difference Vegetation Index (NDVI)
 * Formula: (NIR - Red) / (NIR + Red)
 */
function calculateNdvi(nir, red) {
  const sum = nir + red;
  if (sum <= 0.0001) return 0;
  const val = (nir - red) / sum;
  return Math.max(-1, Math.min(1, parseFloat(val.toFixed(4))));
}

/**
 * Enhanced Vegetation Index (EVI)
 * Formula: 2.5 * ((NIR - Red) / (NIR + 6 * Red - 7.5 * Blue + 1))
 */
function calculateEvi(nir, red, blue) {
  const denom = nir + (6.0 * red) - (7.5 * blue) + 1.0;
  if (Math.abs(denom) <= 0.0001) return 0;
  const val = 2.5 * ((nir - red) / denom);
  return Math.max(-1, Math.min(1.5, parseFloat(val.toFixed(4))));
}

/**
 * Soil-Adjusted Vegetation Index (SAVI)
 * Formula: ((NIR - Red) / (NIR + Red + L)) * (1 + L), where L = 0.5
 */
function calculateSavi(nir, red, L = 0.5) {
  const denom = nir + red + L;
  if (denom <= 0.0001) return 0;
  const val = ((nir - red) / denom) * (1.0 + L);
  return Math.max(-1, Math.min(1, parseFloat(val.toFixed(4))));
}

/**
 * Normalized Difference Water Index (NDWI)
 * Formula: (NIR - SWIR) / (NIR + SWIR)
 */
function calculateNdwi(nir, swir) {
  const sum = nir + swir;
  if (sum <= 0.0001) return 0;
  const val = (nir - swir) / sum;
  return Math.max(-1, Math.min(1, parseFloat(val.toFixed(4))));
}

function classifyVigor(ndvi) {
  if (ndvi < 0.20) return 'Severe Stress';
  if (ndvi < 0.40) return 'Moderate Stress';
  if (ndvi < 0.65) return 'Healthy Vegetation';
  return 'Dense Canopy';
}

function computePixelIndices({ nir, red, blue = 0.05, swir = 0.25 }) {
  const ndvi = calculateNdvi(nir, red);
  const evi = calculateEvi(nir, red, blue);
  const savi = calculateSavi(nir, red);
  const ndwi = calculateNdwi(nir, swir);
  const healthCategory = classifyVigor(ndvi);

  return {
    ndvi,
    evi,
    savi,
    ndwi,
    healthCategory
  };
}

module.exports = {
  calculateNdvi,
  calculateEvi,
  calculateSavi,
  calculateNdwi,
  classifyVigor,
  computePixelIndices
};
```

- [ ] **Step 4: Implement `backend/services/sentinelSceneMaskService.js` and `backend/services/canopyVigorZonalService.js`**
Write `sentinelSceneMaskService.js`:
```javascript
/**
 * Sentinel-2 Scene Classification Layer (SCL) codes:
 * 0: No Data
 * 1: Saturated or Defective
 * 2: Dark Area Pixels
 * 3: Cloud Shadows
 * 4: Vegetation
 * 5: Not Vegetated
 * 6: Water
 * 7: Unclassified
 * 8: Cloud Medium Probability
 * 9: Cloud High Probability
 * 10: Thin Cirrus
 * 11: Snow
 */
function isCloudOrShadow(scl) {
  return [3, 8, 9, 10].includes(Number(scl));
}

function filterMaskedCells(cells = []) {
  return cells.map((cell) => ({
    ...cell,
    isMasked: isCloudOrShadow(cell.scl)
  }));
}

function interpolateCloudGaps(grid = []) {
  return grid.map((cell, idx, arr) => {
    if (!cell.isMasked) return cell;
    // Find nearest unmasked neighbors
    const validNeighbors = arr.filter((c, i) => !c.isMasked && Math.abs(i - idx) <= 2);
    if (validNeighbors.length === 0) return cell;
    const avgNdvi = validNeighbors.reduce((acc, n) => acc + n.ndvi, 0) / validNeighbors.length;
    return {
      ...cell,
      ndvi: parseFloat(avgNdvi.toFixed(4)),
      interpolated: true
    };
  });
}

module.exports = {
  isCloudOrShadow,
  filterMaskedCells,
  interpolateCloudGaps
};
```

Write `canopyVigorZonalService.js`:
```javascript
function computeZonalStatistics(cells = [], totalHectares = 10) {
  const validCells = cells.filter((c) => !c.isMasked);
  if (validCells.length === 0) {
    return {
      meanNdvi: 0,
      minNdvi: 0,
      maxNdvi: 0,
      stdDevNdvi: 0,
      meanEvi: 0,
      meanSavi: 0,
      meanNdwi: 0,
      vigorDistribution: {
        severeStressHectares: 0,
        moderateStressHectares: 0,
        healthyHectares: 0,
        hyperDenseHectares: 0
      }
    };
  }

  const ndviValues = validCells.map((c) => c.ndvi);
  const sum = ndviValues.reduce((a, b) => a + b, 0);
  const meanNdvi = parseFloat((sum / ndviValues.length).toFixed(4));
  const minNdvi = Math.min(...ndviValues);
  const maxNdvi = Math.max(...ndviValues);

  const variance = ndviValues.reduce((acc, val) => acc + Math.pow(val - meanNdvi, 2), 0) / ndviValues.length;
  const stdDevNdvi = parseFloat(Math.sqrt(variance).toFixed(4));

  const meanEvi = parseFloat((validCells.reduce((a, c) => a + (c.evi || 0), 0) / validCells.length).toFixed(4));
  const meanSavi = parseFloat((validCells.reduce((a, c) => a + (c.savi || 0), 0) / validCells.length).toFixed(4));
  const meanNdwi = parseFloat((validCells.reduce((a, c) => a + (c.ndwi || 0), 0) / validCells.length).toFixed(4));

  // Area distribution
  const countSevere = validCells.filter((c) => c.ndvi < 0.20).length;
  const countModerate = validCells.filter((c) => c.ndvi >= 0.20 && c.ndvi < 0.40).length;
  const countHealthy = validCells.filter((c) => c.ndvi >= 0.40 && c.ndvi < 0.65).length;
  const countHyper = validCells.filter((c) => c.ndvi >= 0.65).length;

  const total = validCells.length;
  const severeStressHectares = parseFloat(((countSevere / total) * totalHectares).toFixed(2));
  const moderateStressHectares = parseFloat(((countModerate / total) * totalHectares).toFixed(2));
  const healthyHectares = parseFloat(((countHealthy / total) * totalHectares).toFixed(2));
  const hyperDenseHectares = parseFloat(((countHyper / total) * totalHectares).toFixed(2));

  return {
    meanNdvi,
    minNdvi,
    maxNdvi,
    stdDevNdvi,
    meanEvi,
    meanSavi,
    meanNdwi,
    vigorDistribution: {
      severeStressHectares,
      moderateStressHectares,
      healthyHectares,
      hyperDenseHectares
    }
  };
}

module.exports = {
  computeZonalStatistics
};
```

- [ ] **Step 5: Run tests and verify PASS**
Run: `npm.cmd test -- backend/tests/vegetationIndexEngine.test.js backend/tests/sentinelSceneMaskService.test.js`
Expected: PASS (all tests pass)

- [ ] **Step 6: Commit as Commit 19.2**
```powershell
$env:GIT_AUTHOR_NAME = "babban-dev"
$env:GIT_AUTHOR_EMAIL = "mryusuf7sd@gmail.com"
$env:GIT_COMMITTER_NAME = "babban-dev"
$env:GIT_COMMITTER_EMAIL = "mryusuf7sd@gmail.com"
$env:GIT_AUTHOR_DATE = "2024-09-27T14:30:20"
$env:GIT_COMMITTER_DATE = "2024-09-27T14:30:20"
git add backend/services/vegetationIndexEngine.js backend/services/sentinelSceneMaskService.js backend/services/canopyVigorZonalService.js backend/tests/vegetationIndexEngine.test.js backend/tests/sentinelSceneMaskService.test.js
git commit -m "feat(satellite): implement multi-spectral vegetation index engine, SCL cloud mask, and zonal statistics calculator"
```

---

### Task 3: Satellite Ingestion REST API & Phenology Anomaly Alert Routes (Commit 19.3)

**Files:**
- Create: `backend/services/phenologyAnomalyDetectionService.js`
- Create: `backend/routes/satelliteRoutes.js`
- Modify: `backend/app.js`
- Create: `backend/tests/satelliteRoutes.test.js`

**Interfaces:**
- Consumes: JWT bearer token, Express request routing.
- Produces: `/api/satellite/parcels`, `/api/satellite/ingest-pass`, `/api/satellite/parcels/:id/ndvi-timeline`, `/api/satellite/parcels/:id/zonal-grid`, and `/api/satellite/parcels/:id/vigor-alerts`.

- [ ] **Step 1: Write integration tests for Satellite API Routes**
Create `backend/tests/satelliteRoutes.test.js` with Supertest testing:
1. Parcel registration with GeoJSON boundary.
2. Ingestion of satellite pass with synthetic multi-spectral grid.
3. Querying timeline of NDVI readings.
4. Detecting phenology anomaly alerts when vigor drops significantly.

- [ ] **Step 2: Run test to verify it fails**
Run: `npm.cmd test -- backend/tests/satelliteRoutes.test.js`
Expected: FAIL (404 Route not found)

- [ ] **Step 3: Implement `backend/services/phenologyAnomalyDetectionService.js`**
Write time-series anomaly detection calculating Z-score and sudden drops:
```javascript
function detectPhenologyAnomalies(readings = [], thresholdZ = -1.8) {
  if (readings.length < 3) return [];
  const ndviValues = readings.map((r) => r.meanNdvi);
  const mean = ndviValues.reduce((a, b) => a + b, 0) / ndviValues.length;
  const variance = ndviValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / ndviValues.length;
  const stdDev = Math.sqrt(variance) || 0.05;

  const alerts = [];
  readings.forEach((reading, idx) => {
    const zScore = (reading.meanNdvi - mean) / stdDev;
    if (zScore < thresholdZ) {
      alerts.push({
        date: reading.readingDate,
        meanNdvi: reading.meanNdvi,
        zScore: parseFloat(zScore.toFixed(2)),
        alertType: 'Severe Canopy Degradation',
        severity: zScore < -2.5 ? 'Critical' : 'Warning',
        recommendation: 'Immediate ground-truth inspection advised. Check for localized pest infestation or irrigation failure.'
      });
    }

    // Check abrupt delta between consecutive passes
    if (idx > 0) {
      const prev = readings[idx - 1];
      const delta = reading.meanNdvi - prev.meanNdvi;
      if (delta < -0.15) {
        alerts.push({
          date: reading.readingDate,
          deltaNdvi: parseFloat(delta.toFixed(3)),
          alertType: 'Abrupt Vigor Drop',
          severity: 'Critical',
          recommendation: 'Acute vegetation shock detected. Potential chemical scorch or water stress.'
        });
      }
    }
  });

  return alerts;
}

module.exports = {
  detectPhenologyAnomalies
};
```

- [ ] **Step 4: Implement `backend/routes/satelliteRoutes.js` and wire into `backend/app.js`**
Create routes with JWT authentication via `auth.js` and error handling. Wire into `app.js`:
```javascript
const satelliteRoutes = require('./routes/satelliteRoutes');
app.use('/api/satellite', satelliteRoutes);
```

- [ ] **Step 5: Run tests and verify PASS**
Run: `npm.cmd test -- backend/tests/satelliteRoutes.test.js`
Expected: PASS

- [ ] **Step 6: Commit as Commit 19.3**
```powershell
$env:GIT_AUTHOR_NAME = "YSD Hillside"
$env:GIT_AUTHOR_EMAIL = "ysdhilsyde@users.noreply.github.com"
$env:GIT_COMMITTER_NAME = "YSD Hillside"
$env:GIT_COMMITTER_EMAIL = "ysdhilsyde@users.noreply.github.com"
$env:GIT_AUTHOR_DATE = "2024-09-30T11:45:10"
$env:GIT_COMMITTER_DATE = "2024-09-30T11:45:10"
git add backend/services/phenologyAnomalyDetectionService.js backend/routes/satelliteRoutes.js backend/app.js backend/tests/satelliteRoutes.test.js
git commit -m "feat(satellite): implement satellite telemetry REST API, phenology anomaly detector, and parcel ingestion routes"
```

---

### Task 4: Interactive Satellite Canvas & Zonal Crop Vigor Heatmap Components (Commit 19.4)

**Files:**
- Create: `frontend/src/components/SatelliteCanopyVigorMap.jsx`
- Create: `frontend/src/components/SatelliteCanopyVigorMap.css`
- Create: `frontend/src/components/ZonalCropHealthMetricsCard.jsx`
- Create: `frontend/src/components/ZonalCropHealthMetricsCard.css`
- Create: `frontend/src/components/SpectralBandSelector.jsx`
- Create: `frontend/src/components/SpectralBandSelector.css`
- Create: `frontend/src/components/__tests__/SatelliteCanopyVigorMap.test.jsx`
- Create: `frontend/src/components/__tests__/ZonalCropHealthMetricsCard.test.jsx`

**Interfaces:**
- Consumes: GeoJSON boundary, raster grid cells with index values, band selection state.
- Produces: HTML5 Canvas multi-spectral raster overlay, tactile band toggles, and responsive health telemetry meters adhering strictly to [DESIGN_SYSTEM.md](file:///c:/Users/User/Documents/GitHub/Agrily/DESIGN_SYSTEM.md).

- [ ] **Step 1: Write RTL component tests for SatelliteCanopyVigorMap and MetricsCard**
Verify canvas rendering, spectral band switching, hover tooltips, and health card stat pills.

- [ ] **Step 2: Run tests to verify they fail**
Run: `npm.cmd test -- --watchAll=false SatelliteCanopyVigorMap`
Expected: FAIL

- [ ] **Step 3: Implement `SatelliteCanopyVigorMap.jsx` and CSS**
Build high-performance 2D Canvas grid visualizer:
- Custom color gradient maps: Red-Amber-Emerald for NDVI, Blue-Cyan for NDWI, Infrared CIR false color.
- Boundary polygon overlay with dashed glow stroke (`#bc6c25`).
- Tactile hover inspection displaying pixel coordinate, exact NDVI/NDWI values, and health rating.
- Zoom in/out and pan controls.

- [ ] **Step 4: Implement `ZonalCropHealthMetricsCard.jsx`, `SpectralBandSelector.jsx` and CSS**
Adhere to Design System tokens:
- Status pill badges: `#f0fdf4` / `#15803d` for Healthy, `#fffbeb` / `#b45309` for Moderate, `#fef2f2` / `#991b1b` for Severe.
- Smooth transitions and hover lifts (`translateY(-4px)`).
- Zero emojis. Clean SVG icons.

- [ ] **Step 5: Run tests and verify PASS**
Run: `npm.cmd test -- --watchAll=false SatelliteCanopyVigorMap ZonalCropHealthMetricsCard`
Expected: PASS

- [ ] **Step 6: Commit as Commit 19.4**
```powershell
$env:GIT_AUTHOR_NAME = "Yasin"
$env:GIT_AUTHOR_EMAIL = "114921676+yacxeen1@users.noreply.github.com"
$env:GIT_COMMITTER_NAME = "Yasin"
$env:GIT_COMMITTER_EMAIL = "114921676+yacxeen1@users.noreply.github.com"
$env:GIT_AUTHOR_DATE = "2024-10-03T15:20:40"
$env:GIT_COMMITTER_DATE = "2024-10-03T15:20:40"
git add frontend/src/components/SatelliteCanopyVigorMap.jsx frontend/src/components/SatelliteCanopyVigorMap.css frontend/src/components/ZonalCropHealthMetricsCard.jsx frontend/src/components/ZonalCropHealthMetricsCard.css frontend/src/components/SpectralBandSelector.jsx frontend/src/components/SpectralBandSelector.css frontend/src/components/__tests__/SatelliteCanopyVigorMap.test.jsx frontend/src/components/__tests__/ZonalCropHealthMetricsCard.test.jsx
git commit -m "feat(frontend): create interactive SatelliteCanopyVigorMap canvas, spectral band selector, and zonal health cards"
```

---

### Task 5: Farm Satellite Telemetry Cockpit Page, Phenology Chart & Route Navigation (Commit 19.5)

**Files:**
- Create: `frontend/src/components/PhenologyTimelineChart.jsx`
- Create: `frontend/src/components/PhenologyTimelineChart.css`
- Create: `frontend/src/pages/SatelliteNdviCockpit.jsx`
- Create: `frontend/src/pages/SatelliteNdviCockpit.css`
- Create: `frontend/src/pages/__tests__/SatelliteNdviCockpit.test.jsx`
- Modify: `frontend/src/App.js`
- Modify: `frontend/src/components/TopBar.js`
- Modify: `SPRINT_LOC_TRACKER.md`

**Interfaces:**
- Consumes: Express `/api/satellite` endpoints, auth context.
- Produces: Master satellite cockpit route `/satellite-ndvi`, seasonal phenology curves, parcel switcher drawer, and updated LOC tracker.

- [ ] **Step 1: Write component and integration tests for `SatelliteNdviCockpit.jsx`**
Create `frontend/src/pages/__tests__/SatelliteNdviCockpit.test.jsx` verifying:
1. Parcel selector dropdown populates.
2. Timeline scrubber updates selected satellite pass.
3. Anomaly alert banners display actionable guidance.
4. Export GeoJSON/PDF buttons are present.

- [ ] **Step 2: Run test to verify it fails**
Run: `npm.cmd test -- --watchAll=false SatelliteNdviCockpit`
Expected: FAIL

- [ ] **Step 3: Implement `PhenologyTimelineChart.jsx` and `SatelliteNdviCockpit.jsx`**
Create master page connecting parcel selection, satellite pass timeline, canvas raster view, zonal health metrics, and phenology curves.
Provide null-safe fallbacks (`user?.email || ''`, `parcels?.[0] || null`).

- [ ] **Step 4: Wire `/satellite-ndvi` into `App.js` and `TopBar.js`**
Add route to React router and navigation bar with satellite dish icon.

- [ ] **Step 5: Run full test suites and perform live LOC audit**
Run:
```powershell
# Backend tests
cd backend; npm.cmd test
# Frontend tests
cd ../frontend; npm.cmd test -- --watchAll=false
# Live LOC audit
cd ..; node scripts/count-loc.js
```
Update `SPRINT_LOC_TRACKER.md` with verified LOC count (~100,500+ lines).

- [ ] **Step 6: Commit as Commit 19.5**
```powershell
$env:GIT_AUTHOR_NAME = "Yusuf Samaila"
$env:GIT_AUTHOR_EMAIL = "114921676+ysamaila@users.noreply.github.com"
$env:GIT_COMMITTER_NAME = "Yusuf Samaila"
$env:GIT_COMMITTER_EMAIL = "114921676+ysamaila@users.noreply.github.com"
$env:GIT_AUTHOR_DATE = "2024-10-06T16:50:00"
$env:GIT_COMMITTER_DATE = "2024-10-06T16:50:00"
git add frontend/src/components/PhenologyTimelineChart.jsx frontend/src/components/PhenologyTimelineChart.css frontend/src/pages/SatelliteNdviCockpit.jsx frontend/src/pages/SatelliteNdviCockpit.css frontend/src/pages/__tests__/SatelliteNdviCockpit.test.jsx frontend/src/App.js frontend/src/components/TopBar.js SPRINT_LOC_TRACKER.md
git commit -m "feat(navigation): integrate SatelliteNdviCockpit into App routing, add phenology chart, and log Sprint 19 LOC"
```

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2024-09-23-sprint-19-satellite-ndvi-integration.md`. Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
