/**
 * ==============================================================================
 * 🌾 AGRILY HARVEST YIELD PREDICTOR: REST API ROUTES
 * ==============================================================================
 *
 * Exposes endpoints for:
 *  - GET /api/yield-predictor/cultivars: Genetic cultivar parameter catalog
 *  - GET /api/yield-predictor/parcels: Monitored farm parcels with yield baselines
 *  - GET /api/yield-predictor/parcels/:id/forecast: Full mechanistic + ML ensemble
 *    forecast, Monte Carlo P10/P50/P90 intervals, 8x8 yield grid & biomass curve
 *  - POST /api/yield-predictor/simulate: Interactive What-If sensitivity simulator
 *  - POST /api/yield-predictor/calibrate-harvest: Weighbridge ticket ingestion &
 *    model residual calibration
 * ==============================================================================
 */

const express = require('express');
const router = express.Router();
const HistoricalHarvestRecord = require('../models/HistoricalHarvestRecord');
const {
  CULTIVAR_CATALOG,
  predictParcelHarvestYield,
  generateBiomassAccumulationCurve
} = require('../services/yieldBiomassRegressionEngine');
const { runYieldMonteCarloSimulation } = require('../services/yieldMonteCarloSimulationService');
const { generateSubParcelYieldGrid } = require('../services/subParcelYieldZoneService');

const inMemoryHarvestTickets = [
  {
    ticketCode: 'WBG-2023-8841',
    parcelCode: 'NG-MAI-KANO4B',
    cropType: 'Maize',
    cultivarCode: 'SAMMAZ-15',
    harvestSeasonLabel: '2023 Wet Season',
    harvestedAreaHectares: 24.5,
    wetHarvestedTonnage: 158.2,
    harvestMoisturePct: 18.2,
    standardCommercialMoisturePct: 13.0,
    dryAdjustedCommercialTonnage: 148.74,
    actualYieldTonsPerHa: 6.07,
    preHarvestPredictedYieldTonsPerHa: 5.95,
    absolutePercentageErrorPct: 1.98,
    qualityGrade: 'SON Grade 1 Export'
  },
  {
    ticketCode: 'WBG-2023-9104',
    parcelCode: 'NG-RIC-KEBBI2',
    cropType: 'Rice',
    cultivarCode: 'FARO-44',
    harvestSeasonLabel: '2023 Dry Season Irrigated',
    harvestedAreaHectares: 18.0,
    wetHarvestedTonnage: 116.5,
    harvestMoisturePct: 17.5,
    standardCommercialMoisturePct: 12.5,
    dryAdjustedCommercialTonnage: 109.84,
    actualYieldTonsPerHa: 6.10,
    preHarvestPredictedYieldTonsPerHa: 6.22,
    absolutePercentageErrorPct: 1.97,
    qualityGrade: 'SON Grade 1 Export'
  }
];

function getDemoYieldParcels() {
  return [
    {
      _id: '671000000000000000000201',
      parcelCode: 'NG-MAI-KANO4B',
      parcelName: 'Kano North Irrigation Plot 4B',
      cropType: 'Maize',
      cultivarCode: 'SAMMAZ-15',
      agroEcologicalZone: 'Sudan Savannah',
      areaHectares: 24.5,
      daysAfterPlanting: 88,
      phenologyStage: 'Grain Fill / Tuber Bulking',
      peakNdvi: 0.79,
      seasonalRainfallMm: 645,
      appliedNitrogenKgHa: 118,
      appliedPhosphorusKgHa: 48,
      appliedPotassiumKgHa: 52,
      plantPopulationPerHa: 53333,
      pestDiseaseLossPct: 3.5
    },
    {
      _id: '671000000000000000000202',
      parcelCode: 'NG-RIC-KEBBI2',
      parcelName: 'Argungu Floodplain Lowland Rice Block 2',
      cropType: 'Rice',
      cultivarCode: 'FARO-44',
      agroEcologicalZone: 'Sudan Savannah',
      areaHectares: 18.0,
      daysAfterPlanting: 94,
      phenologyStage: 'Grain Fill / Tuber Bulking',
      peakNdvi: 0.81,
      seasonalRainfallMm: 920,
      appliedNitrogenKgHa: 112,
      appliedPhosphorusKgHa: 45,
      appliedPotassiumKgHa: 50,
      plantPopulationPerHa: 158000,
      pestDiseaseLossPct: 4.0
    },
    {
      _id: '671000000000000000000203',
      parcelCode: 'NG-CAS-BENUE1',
      parcelName: 'Benue River Basin Cassava Field 1',
      cropType: 'Cassava',
      cultivarCode: 'TME-419',
      agroEcologicalZone: 'Southern Guinea Savannah',
      areaHectares: 42.0,
      daysAfterPlanting: 225,
      phenologyStage: 'Grain Fill / Tuber Bulking',
      peakNdvi: 0.76,
      seasonalRainfallMm: 1080,
      appliedNitrogenKgHa: 85,
      appliedPhosphorusKgHa: 42,
      appliedPotassiumKgHa: 65,
      plantPopulationPerHa: 12200,
      pestDiseaseLossPct: 5.0
    },
    {
      _id: '671000000000000000000204',
      parcelCode: 'NG-POT-JOS07',
      parcelName: 'Jos Plateau Bokkos Montane Potato Seed Lot',
      cropType: 'Potato',
      cultivarCode: 'MARABEL-J1',
      agroEcologicalZone: 'Mid-Altitude Montane',
      areaHectares: 14.0,
      daysAfterPlanting: 74,
      phenologyStage: 'Grain Fill / Tuber Bulking',
      peakNdvi: 0.82,
      seasonalRainfallMm: 575,
      appliedNitrogenKgHa: 135,
      appliedPhosphorusKgHa: 55,
      appliedPotassiumKgHa: 70,
      plantPopulationPerHa: 44000,
      pestDiseaseLossPct: 3.0
    }
  ];
}

function findYieldParcel(identifier) {
  const list = getDemoYieldParcels();
  return (
    list.find(
      (p) =>
        String(p._id) === String(identifier) ||
        String(p.parcelCode).toUpperCase() === String(identifier).toUpperCase()
    ) || list[0]
  );
}

/**
 * GET /api/yield-predictor/cultivars
 */
router.get('/cultivars', (req, res) => {
  const list = Object.values(CULTIVAR_CATALOG);
  return res.status(200).json({
    success: true,
    count: list.length,
    data: list
  });
});

/**
 * GET /api/yield-predictor/parcels
 */
router.get('/parcels', (req, res) => {
  const parcels = getDemoYieldParcels();
  return res.status(200).json({
    success: true,
    count: parcels.length,
    data: parcels
  });
});

/**
 * GET /api/yield-predictor/parcels/:id/forecast
 */
router.get('/parcels/:id/forecast', (req, res) => {
  try {
    const parcel = findYieldParcel(req.params.id);
    const cultivarCode = req.query.cultivarCode || parcel.cultivarCode;

    const forecastInput = {
      ...parcel,
      cultivarCode
    };

    const prediction = predictParcelHarvestYield(forecastInput);
    const monteCarlo = runYieldMonteCarloSimulation(forecastInput, 250);
    const biomassCurve = generateBiomassAccumulationCurve(prediction);
    const spatialZoneGrid = generateSubParcelYieldGrid(prediction);
    const historicalRecords = inMemoryHarvestTickets.filter(
      (t) => t.parcelCode === parcel.parcelCode || t.cropType === parcel.cropType
    );

    return res.status(200).json({
      success: true,
      parcel,
      prediction,
      monteCarlo,
      biomassCurve,
      spatialZoneGrid,
      historicalRecords
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate parcel harvest yield forecast',
      error: err.message
    });
  }
});

/**
 * POST /api/yield-predictor/simulate
 * Run interactive What-If agronomic management scenario simulation
 */
router.post('/simulate', (req, res) => {
  try {
    const body = req.body || {};
    if (!body.cropType && !body.cultivarCode) {
      return res.status(400).json({
        success: false,
        message: 'cropType or cultivarCode is required for yield simulation'
      });
    }

    const prediction = predictParcelHarvestYield(body);
    const monteCarlo = runYieldMonteCarloSimulation(body, 200);
    const biomassCurve = generateBiomassAccumulationCurve(prediction);

    return res.status(200).json({
      success: true,
      prediction,
      monteCarlo,
      biomassCurve
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to execute yield sensitivity simulation',
      error: err.message
    });
  }
});

/**
 * POST /api/yield-predictor/calibrate-harvest
 * Record actual post-harvest weighbridge ticket & compute MAPE calibration residual
 */
router.post('/calibrate-harvest', (req, res) => {
  try {
    const {
      parcelCode,
      cropType,
      cultivarCode,
      harvestSeasonLabel,
      harvestedAreaHectares,
      wetHarvestedTonnage,
      harvestMoisturePct,
      standardCommercialMoisturePct,
      preHarvestPredictedYieldTonsPerHa
    } = req.body || {};

    if (!parcelCode || !cropType || !wetHarvestedTonnage || !harvestedAreaHectares) {
      return res.status(400).json({
        success: false,
        message: 'parcelCode, cropType, harvestedAreaHectares, and wetHarvestedTonnage are required'
      });
    }

    const recordDoc = new HistoricalHarvestRecord({
      parcelCode,
      cropType,
      cultivarCode: cultivarCode || 'SAMMAZ-15',
      harvestSeasonLabel: harvestSeasonLabel || '2024 Wet Season',
      harvestedAreaHectares: Number(harvestedAreaHectares),
      wetHarvestedTonnage: Number(wetHarvestedTonnage),
      harvestMoisturePct: Number(harvestMoisturePct ?? 18.0),
      standardCommercialMoisturePct: Number(standardCommercialMoisturePct ?? 13.0),
      preHarvestPredictedYieldTonsPerHa: Number(preHarvestPredictedYieldTonsPerHa ?? 5.8)
    });

    const validationErr = recordDoc.validateSync();
    if (validationErr) {
      return res.status(400).json({
        success: false,
        message: 'Weighbridge calibration record validation failed',
        error: validationErr.message
      });
    }

    const plainRecord = recordDoc.toObject();
    inMemoryHarvestTickets.unshift(plainRecord);

    return res.status(201).json({
      success: true,
      message: 'Weighbridge harvest ticket recorded and model residual calibrated',
      data: plainRecord
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to calibrate harvest record',
      error: err.message
    });
  }
});

module.exports = router;
