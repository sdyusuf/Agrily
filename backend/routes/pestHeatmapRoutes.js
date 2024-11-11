/**
 * ==============================================================================
 * 🐛 AGRILY SPRINT 22: PEST INFESTATION HEATMAP & IPM BIOCONTROL REST API ROUTES
 * ==============================================================================
 *
 * Endpoints:
 *  - GET  /api/pest-heatmap/species           -> 10-species entomology & IPM catalog
 *  - GET  /api/pest-heatmap/kde-surface       -> 2D Gaussian KDE contagion grid & wind vectors
 *  - GET  /api/pest-heatmap/traps             -> Active pheromone & light trap telemetry stations
 *  - POST /api/pest-heatmap/evaluate-eil      -> Degree-day phenology & Pedigo EIL/ET analysis
 *  - POST /api/pest-heatmap/scouting-reports  -> Ingest W-pattern scouting report & return IPM plan
 *
 * @module routes/pestHeatmapRoutes
 */

const express = require('express');
const router = express.Router();
const { PestOutbreakReport } = require('../models/PestOutbreakReport');
const { PheromoneTrapStation } = require('../models/PheromoneTrapStation');
const {
  PEST_ENTOMOLOGY_CATALOG,
  evaluatePestDegreeDayPhenology,
  calculatePedigoEconomicInjuryLevel,
} = require('../services/pestPhenologyAndEilEngine');
const {
  generatePestOutbreakKdeSurface,
} = require('../services/pestSpatialKernelDensityService');

const SEEDED_TRAP_STATIONS = [
  {
    trapCode: 'TRP-NG-1041',
    stationName: 'Zaria Samaru IAR Pheromone Sentinel #01',
    trapDesignType: 'UNIVERSAL_BUCKET_FUNNEL',
    targetPestKey: 'FALL_ARMYWORM',
    stateCode: 'KD',
    lgaName: 'Sabon Gari',
    coordinates: { latitude: 11.165, longitude: 7.635 },
    biofixEstablished: true,
    biofixDateIso: '2024-10-26',
    accumulatedDegreeDaysSinceBiofix: 142.5,
    nightlyCatchSeries7Days: [8, 12, 17, 23, 29, 34, 41],
    sevenDayCumulativeMoths: 164,
    lureReplacementCountdownDays: 18,
    trapAlertState: 'MASS_FLIGHT_CRITICAL',
  },
  {
    trapCode: 'TRP-NG-1042',
    stationName: 'Kura Irrigation Canal Delta Trap #03',
    trapDesignType: 'DELTA_STICKY_WING',
    targetPestKey: 'TUTA_ABSOLUTA',
    stateCode: 'KN',
    lgaName: 'Kura',
    coordinates: { latitude: 11.772, longitude: 8.431 },
    biofixEstablished: true,
    biofixDateIso: '2024-10-29',
    accumulatedDegreeDaysSinceBiofix: 118.0,
    nightlyCatchSeries7Days: [11, 15, 19, 24, 31, 38, 45],
    sevenDayCumulativeMoths: 183,
    lureReplacementCountdownDays: 14,
    trapAlertState: 'MASS_FLIGHT_CRITICAL',
  },
  {
    trapCode: 'TRP-NG-1043',
    stationName: 'Gboko Alluvial Whitefly Sticky Sentinel #02',
    trapDesignType: 'YELLOW_STICKY_WHITEFLY_CARD',
    targetPestKey: 'BEMISIA_WHITEFLY',
    stateCode: 'BN',
    lgaName: 'Gboko',
    coordinates: { latitude: 7.331, longitude: 9.004 },
    biofixEstablished: true,
    biofixDateIso: '2024-11-01',
    accumulatedDegreeDaysSinceBiofix: 96.4,
    nightlyCatchSeries7Days: [5, 6, 8, 9, 11, 12, 14],
    sevenDayCumulativeMoths: 65,
    lureReplacementCountdownDays: 22,
    trapAlertState: 'BIOFIX_SURGE',
  },
  {
    trapCode: 'TRP-NG-1044',
    stationName: 'Argungu Fadama Solar UV Light Trap #05',
    trapDesignType: 'SOLAR_UV_LIGHT_TRAP',
    targetPestKey: 'RICE_GALL_MIDGE',
    stateCode: 'KB',
    lgaName: 'Argungu',
    coordinates: { latitude: 12.744, longitude: 4.525 },
    biofixEstablished: true,
    biofixDateIso: '2024-11-02',
    accumulatedDegreeDaysSinceBiofix: 84.0,
    nightlyCatchSeries7Days: [3, 4, 4, 5, 6, 5, 6],
    sevenDayCumulativeMoths: 33,
    lureReplacementCountdownDays: 27,
    trapAlertState: 'BASELINE_MONITORING',
  },
];

const IN_MEMORY_SCOUTING_LEDGER = [];

/**
 * GET /api/pest-heatmap/species
 * Returns full 10-species tropical entomological & IPM biocontrol catalog
 */
router.get('/species', (req, res) => {
  const speciesList = Object.values(PEST_ENTOMOLOGY_CATALOG);
  res.status(200).json({
    success: true,
    count: speciesList.length,
    species: speciesList,
  });
});

/**
 * GET /api/pest-heatmap/kde-surface
 * Computes 2D Gaussian Kernel Density Estimation hotspot map and 72h wind plumes
 */
router.get('/kde-surface', (req, res) => {
  const { pestKey, bandwidthKm } = req.query;
  const surface = generatePestOutbreakKdeSurface({
    pestKey,
    bandwidthKm: bandwidthKm ? Number(bandwidthKm) : 185,
  });

  res.status(200).json({
    success: true,
    surface,
  });
});

/**
 * GET /api/pest-heatmap/traps
 * Returns active pheromone & light trap stations with degree-day instar telemetry
 */
router.get('/traps', (req, res) => {
  const trapsWithPhenology = SEEDED_TRAP_STATIONS.map((trap) => {
    const phenology = evaluatePestDegreeDayPhenology({
      pestKey: trap.targetPestKey,
      accumulatedGddOverride: trap.accumulatedDegreeDaysSinceBiofix,
    });
    return {
      ...trap,
      phenology,
    };
  });

  res.status(200).json({
    success: true,
    count: trapsWithPhenology.length,
    traps: trapsWithPhenology,
  });
});

/**
 * POST /api/pest-heatmap/evaluate-eil
 * Evaluates Baskerville-Emin degree-day larval instar and Pedigo EIL/ET bio-economics
 */
router.post('/evaluate-eil', (req, res) => {
  const body = req.body || {};
  const phenology = evaluatePestDegreeDayPhenology({
    pestKey: body.pestKey || 'FALL_ARMYWORM',
    dailyMinTempC: body.dailyMinTempC,
    dailyMaxTempC: body.dailyMaxTempC,
    daysSinceBiofix: body.daysSinceBiofix,
    accumulatedGddOverride: body.accumulatedGddOverride,
  });

  const eilAnalysis = calculatePedigoEconomicInjuryLevel({
    pestKey: body.pestKey || 'FALL_ARMYWORM',
    observedIncidencePct: body.observedIncidencePct,
    davisDamageScale: body.davisDamageScale,
    expectedYieldTonsHa: body.expectedYieldTonsHa,
    cropPriceNgnPerTon: body.cropPriceNgnPerTon,
    controlCostNgnPerHa: body.controlCostNgnPerHa,
    controlEfficacyK: body.controlEfficacyK,
  });

  res.status(200).json({
    success: true,
    phenology,
    eilAnalysis,
  });
});

/**
 * POST /api/pest-heatmap/scouting-reports
 * Ingests a W-pattern field scouting observation, validates against PestOutbreakReport,
 * and returns severity classification + IPM biocontrol prescription.
 */
router.post('/scouting-reports', (req, res) => {
  const body = req.body || {};
  const pestKey = String(body.pestSpeciesKey || 'FALL_ARMYWORM').toUpperCase();
  const spec =
    PEST_ENTOMOLOGY_CATALOG[pestKey] || PEST_ENTOMOLOGY_CATALOG.FALL_ARMYWORM;

  const totalPlants = Math.max(10, Number(body.totalPlantsInspected || 100));
  const infestedPlants = Math.min(
    totalPlants,
    Math.max(0, Number(body.infestedPlantsCount ?? 32))
  );
  const incidencePct = Number(((infestedPlants / totalPlants) * 100).toFixed(1));
  const davisScale = Math.min(9, Math.max(1, Number(body.davisFoliarDamageScale || 5)));

  const eilEval = calculatePedigoEconomicInjuryLevel({
    pestKey,
    observedIncidencePct: incidencePct,
    davisDamageScale: davisScale,
    expectedYieldTonsHa: Number(body.expectedYieldTonsPerHa || 4.5),
    cropPriceNgnPerTon: Number(body.cropMarketValueNgnPerTon || 685000),
    controlCostNgnPerHa: Number(
      body.treatmentCostNgnPerHa || spec.defaultBiocontrolCostNgnHa
    ),
  });

  const reportDoc = new PestOutbreakReport({
    pestSpeciesKey: spec.pestKey,
    scientificName: spec.scientificName,
    hostCropKey: body.hostCropKey || spec.primaryHostCrops[0] || 'MAIZE',
    stateCode: body.stateCode || 'KD',
    stateName: body.stateName || 'Kaduna',
    lgaName: body.lgaName || 'Giwa',
    agroEcologicalZone: body.agroEcologicalZone || 'NORTHERN_GUINEA_SAVANNA',
    scoutingProtocol: {
      wPatternStationsSampled: Number(body.wPatternStationsSampled || 5),
      totalPlantsInspected: totalPlants,
      infestedPlantsCount: infestedPlants,
      infestedPlantsIncidencePct: incidencePct,
      meanLarvaePerPlant: Number(body.meanLarvaePerPlant || 2.1),
      davisFoliarDamageScale: davisScale,
      dominantInstarStage: body.dominantInstarStage || 'L1_L2_EARLY_INSTAR',
      pheromoneTrapMothsPerNight: Number(body.pheromoneTrapMothsPerNight || 18),
    },
    economicThresholdAssessment: {
      treatmentCostNgnPerHa: eilEval.controlCostNgnPerHa,
      cropMarketValueNgnPerTon: Number(body.cropMarketValueNgnPerTon || 685000),
      expectedYieldTonsPerHa: Number(body.expectedYieldTonsPerHa || 4.5),
      economicInjuryLevelPct: eilEval.economicInjuryLevelPct,
      economicThresholdPct: eilEval.economicThresholdPct,
      exceedsEconomicThreshold: eilEval.exceedsEconomicThreshold,
    },
  });

  const validationError = reportDoc.validateSync();
  if (validationError) {
    return res.status(400).json({
      success: false,
      message: validationError.message,
    });
  }

  const serialized = reportDoc.toObject();
  IN_MEMORY_SCOUTING_LEDGER.unshift(serialized);

  res.status(201).json({
    success: true,
    report: serialized,
    eilEvaluation: eilEval,
  });
});

module.exports = router;
