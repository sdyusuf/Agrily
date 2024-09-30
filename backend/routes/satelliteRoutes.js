const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const FarmParcel = require('../models/FarmParcel');
const SatellitePassRecord = require('../models/SatellitePassRecord');
const NdviZonalReading = require('../models/NdviZonalReading');
const {
  computePixelIndices,
  generateSyntheticRasterGrid
} = require('../services/vegetationIndexEngine');
const {
  filterMaskedCells,
  calculateSceneCloudPercentage,
  interpolateCloudGaps
} = require('../services/sentinelSceneMaskService');
const { computeZonalStatistics } = require('../services/canopyVigorZonalService');
const {
  detectPhenologyAnomalies,
  generatePhenologySeasonReport
} = require('../services/phenologyAnomalyDetectionService');

// In-memory demo store for seamless demonstration and testing without requiring external MongoDB instances
const inMemoryParcels = [];
const inMemoryReadings = {};

/**
 * Helper to seed initial sample parcels if database is clean
 */
function getDemoParcels(userId) {
  return [
    {
      _id: '66f100000000000000000001',
      parcelCode: 'NG-MAI-KANO4B',
      parcelName: 'Kano North Irrigation Plot 4B',
      cropType: 'Maize',
      cropVariety: 'SAMMAZ-15 Hybrid',
      areaHectares: 24.5,
      elevationMeters: 472,
      agroEcologicalZone: 'Sudan Savannah',
      soilClassification: 'Ferric Luvisol',
      irrigationType: 'Center Pivot',
      centroid: { latitude: 12.0152, longitude: 8.5254 },
      status: 'Active',
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
      }
    },
    {
      _id: '66f100000000000000000002',
      parcelCode: 'NG-CAS-BENUE1',
      parcelName: 'Benue River Basin Cassava Field',
      cropType: 'Cassava',
      cropVariety: 'TME-419 Biofortified',
      areaHectares: 42.0,
      elevationMeters: 185,
      agroEcologicalZone: 'Southern Guinea Savannah',
      soilClassification: 'Dystric Nitisol',
      irrigationType: 'Rainfed',
      centroid: { latitude: 7.7321, longitude: 8.5391 },
      status: 'Active',
      boundary: {
        type: 'Polygon',
        coordinates: [
          [
            [8.534, 7.728],
            [8.545, 7.728],
            [8.545, 7.738],
            [8.534, 7.738],
            [8.534, 7.728]
          ]
        ]
      }
    }
  ];
}

/**
 * -----------------------------------------------------------------------------
 * GET /api/satellite/parcels
 * List all farm parcels registered by farmer
 * -----------------------------------------------------------------------------
 */
router.get('/parcels', async (req, res) => {
  try {
    let parcels = [];
    if (mongoose.connection.readyState === 1) {
      parcels = await FarmParcel.find().sort({ createdAt: -1 });
    }
    if (parcels.length === 0) {
      parcels = inMemoryParcels.length > 0 ? inMemoryParcels : getDemoParcels();
    }
    return res.status(200).json({
      success: true,
      count: parcels.length,
      data: parcels
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * -----------------------------------------------------------------------------
 * POST /api/satellite/parcels
 * Register a new farm parcel with GeoJSON boundary
 * -----------------------------------------------------------------------------
 */
router.post('/parcels', async (req, res) => {
  try {
    const {
      parcelName,
      cropType,
      areaHectares,
      boundary,
      elevationMeters,
      agroEcologicalZone,
      soilClassification,
      irrigationType
    } = req.body;

    if (!parcelName || !cropType || !areaHectares || !boundary) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parcel registration fields: parcelName, cropType, areaHectares, boundary'
      });
    }

    const newParcelData = {
      _id: new mongoose.Types.ObjectId(),
      farmerId: req.body.farmerId || new mongoose.Types.ObjectId(),
      parcelName,
      cropType,
      areaHectares: Number(areaHectares),
      boundary,
      elevationMeters: Number(elevationMeters) || 0,
      agroEcologicalZone: agroEcologicalZone || 'Northern Guinea Savannah',
      soilClassification: soilClassification || 'Ferric Luvisol',
      irrigationType: irrigationType || 'Rainfed',
      status: 'Active',
      parcelCode: `NG-${cropType.substring(0, 3).toUpperCase()}-${Math.random().toString(16).substring(2, 8).toUpperCase()}`,
      centroid: {
        latitude: boundary?.coordinates?.[0]?.[0]?.[1] || 12.015,
        longitude: boundary?.coordinates?.[0]?.[0]?.[0] || 8.525
      }
    };

    let saved = newParcelData;
    if (mongoose.connection.readyState === 1) {
      const doc = new FarmParcel(newParcelData);
      saved = await doc.save();
    } else {
      inMemoryParcels.push(newParcelData);
    }

    return res.status(201).json({
      success: true,
      message: 'Farm parcel successfully registered with 2dsphere indexing',
      data: saved
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * -----------------------------------------------------------------------------
 * GET /api/satellite/parcels/:id
 * Retrieve specific parcel details
 * -----------------------------------------------------------------------------
 */
router.get('/parcels/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let parcel = null;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      parcel = await FarmParcel.findById(id);
    }
    if (!parcel) {
      parcel = [...inMemoryParcels, ...getDemoParcels()].find((p) => String(p._id) === String(id) || p.parcelCode === id);
    }

    if (!parcel) {
      return res.status(404).json({ success: false, message: 'Parcel not found' });
    }

    return res.status(200).json({ success: true, data: parcel });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * -----------------------------------------------------------------------------
 * POST /api/satellite/ingest-pass
 * Ingest a Sentinel-2 multispectral pass and calculate zonal analytics
 * -----------------------------------------------------------------------------
 */
router.post('/ingest-pass', async (req, res) => {
  try {
    const {
      parcelId,
      tileId,
      acquisitionDate,
      cloudCoveragePercentage,
      baseNdvi = 0.68,
      cloudPercent = 2.0
    } = req.body;

    if (!parcelId) {
      return res.status(400).json({ success: false, message: 'parcelId is required' });
    }

    // Generate multispectral synthetic 10m grid
    const rawGrid = generateSyntheticRasterGrid({
      rows: 10,
      cols: 10,
      baseNdvi: Number(baseNdvi),
      cloudPercent: Number(cloudPercent)
    });

    // Run SCL masking & gap-filling
    const maskedGrid = filterMaskedCells(rawGrid);
    const restoredGrid = interpolateCloudGaps(maskedGrid, 10, 10);
    const zonalStats = computeZonalStatistics(restoredGrid, 24.5);

    const passRecord = {
      _id: new mongoose.Types.ObjectId(),
      tileId: tileId || `T32PQR_${Date.now()}`,
      satelliteSource: 'Sentinel-2B',
      acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : new Date(),
      cloudCoveragePercentage: Number(cloudCoveragePercentage) || cloudPercent,
      processingLevel: 'L2A_SurfaceReflectance',
      dataQualityStatus: 'Verified'
    };

    const zonalRecord = {
      _id: new mongoose.Types.ObjectId(),
      parcelId,
      passId: passRecord._id,
      readingDate: passRecord.acquisitionDate,
      ...zonalStats,
      gridRaster: restoredGrid
    };

    if (!inMemoryReadings[parcelId]) {
      inMemoryReadings[parcelId] = [];
    }
    inMemoryReadings[parcelId].push(zonalRecord);

    return res.status(201).json({
      success: true,
      message: 'Sentinel-2 pass successfully ingested and analyzed',
      pass: passRecord,
      zonalSummary: zonalStats,
      gridCellCount: restoredGrid.length
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * -----------------------------------------------------------------------------
 * GET /api/satellite/parcels/:id/ndvi-timeline
 * Retrieve chronological time-series readings for seasonal phenology progression
 * -----------------------------------------------------------------------------
 */
router.get('/parcels/:id/ndvi-timeline', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if recorded in memory or generate rich seasonal 8-point timeline
    let timeline = inMemoryReadings[id];
    if (!timeline || timeline.length === 0) {
      const dates = [
        '2024-05-15',
        '2024-06-05',
        '2024-06-25',
        '2024-07-15',
        '2024-08-05',
        '2024-08-25',
        '2024-09-15',
        '2024-09-28'
      ];
      const ndviCurve = [0.24, 0.42, 0.58, 0.74, 0.81, 0.78, 0.69, 0.64];
      const ndwiCurve = [0.08, 0.18, 0.26, 0.32, 0.35, 0.28, 0.20, 0.16];

      timeline = dates.map((d, i) => ({
        readingDate: d,
        meanNdvi: ndviCurve[i],
        minNdvi: parseFloat((ndviCurve[i] - 0.15).toFixed(3)),
        maxNdvi: parseFloat((ndviCurve[i] + 0.12).toFixed(3)),
        meanEvi: parseFloat((ndviCurve[i] * 0.82).toFixed(3)),
        meanSavi: parseFloat((ndviCurve[i] * 0.75).toFixed(3)),
        meanNdwi: ndwiCurve[i],
        chlorophyllIndex: parseFloat((ndviCurve[i] * 5.2).toFixed(2)),
        waterStressIndex: parseFloat((Math.max(0, 0.35 - ndwiCurve[i]) * 2.5).toFixed(2))
      }));
    }

    return res.status(200).json({
      success: true,
      parcelId: id,
      count: timeline.length,
      data: timeline
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * -----------------------------------------------------------------------------
 * GET /api/satellite/parcels/:id/zonal-grid
 * Retrieve 2D raster grid for canvas visualization with spectral band filter
 * -----------------------------------------------------------------------------
 */
router.get('/parcels/:id/zonal-grid', async (req, res) => {
  try {
    const { id } = req.params;
    const band = (req.query.band || 'NDVI').toUpperCase(); // NDVI, EVI, SAVI, NDWI, RGB, CIR

    // Find latest reading or generate fresh representative grid
    const list = inMemoryReadings[id];
    let grid = list && list.length > 0 ? list[list.length - 1].gridRaster : null;

    if (!grid || grid.length === 0) {
      grid = generateSyntheticRasterGrid({ rows: 12, cols: 12, baseNdvi: 0.72, cloudPercent: 4.0 });
    }

    return res.status(200).json({
      success: true,
      parcelId: id,
      spectralBand: band,
      rows: 12,
      cols: 12,
      cells: grid
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * -----------------------------------------------------------------------------
 * GET /api/satellite/parcels/:id/vigor-alerts
 * Anomaly and vegetative stress detection alerts
 * -----------------------------------------------------------------------------
 */
router.get('/parcels/:id/vigor-alerts', async (req, res) => {
  try {
    const { id } = req.params;
    const parcel = [...inMemoryParcels, ...getDemoParcels()].find((p) => String(p._id) === String(id)) || { parcelCode: 'NG-PARCEL' };

    // Form timeline
    const dates = ['2024-07-01', '2024-07-15', '2024-08-01', '2024-08-15', '2024-09-01'];
    const readings = [
      { readingDate: '2024-07-01', meanNdvi: 0.72, meanNdwi: 0.28 },
      { readingDate: '2024-07-15', meanNdvi: 0.78, meanNdwi: 0.32 },
      { readingDate: '2024-08-01', meanNdvi: 0.82, meanNdwi: 0.30 },
      { readingDate: '2024-08-15', meanNdvi: 0.65, meanNdwi: 0.12 }, // Drop
      { readingDate: '2024-09-01', meanNdvi: 0.48, meanNdwi: -0.08 } // Stress alert
    ];

    const report = generatePhenologySeasonReport(parcel, readings);
    return res.status(200).json({
      success: true,
      report
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
