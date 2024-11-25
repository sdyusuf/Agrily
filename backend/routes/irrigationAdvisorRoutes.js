/**
 * ==============================================================================
 * 💧 AGRILY SPRINT 23: IRRIGATION SCHEDULING ADVISOR REST API ROUTES
 * ==============================================================================
 *
 * Endpoints:
 *   GET  /api/irrigation-advisor/zones              - List irrigated command zones & FAO-56 root-zone schedules
 *   GET  /api/irrigation-advisor/pumps              - List smart pump relay nodes & tensiometer sensor pods
 *   POST /api/irrigation-advisor/evaluate-schedule  - Run FAO-56 dual-Kc root-zone depletion + 7-day ledger + Hazen-Williams hydraulics
 *   POST /api/irrigation-advisor/relay-command      - Dispatch safety-interlocked smart pump/solenoid relay actuation command
 *   POST /api/irrigation-advisor/tensiometer-ingest - Ingest matric suction (kPa) & FDR volumetric moisture telemetry
 *
 * @module routes/irrigationAdvisorRoutes
 */

const express = require('express');
const router = express.Router();

const {
  SOIL_HYDRAULIC_PROFILES,
  IRRIGATED_CROP_FAO56_CATALOG,
  computeVanGenuchtenMoistureFromSuction,
  evaluateFao56RootZoneSchedule,
  simulateSevenDayIrrigationLedger,
} = require('../services/fao56SoilWaterBalanceEngine');
const {
  computeSmartPumpHydraulicsAndEnergy,
  executeSmartPumpRelayCommand,
} = require('../services/smartPumpHydraulicsAndRelayService');

// Curated reference irrigation zones across Nigeria's major irrigation schemes
const SEED_IRRIGATION_ZONES = [
  {
    zoneCode: 'IRR-ZN-1001',
    zoneName: 'Hadejia-Jama’are Sector B — Drip Irrigated Roma Tomato',
    stateName: 'Kano',
    lgaName: 'Kura',
    riverBasinAuthority: 'Hadejia-Jama’are RBDA',
    cropKey: 'TOMATO_IRRIGATED',
    phenologyStage: 'MID_SEASON_FRUIT_FILL',
    soilTextureKey: 'SANDY_LOAM',
    irrigationMethod: 'SUBSURFACE_DRIP_TAPE',
    commandAreaHectares: 14.5,
    matricSuctionKpa: 46.0,
    referenceEt0MmDay: 6.4,
    effectiveRainMmDay: 0.0,
    electricalConductivityDsm: 1.65,
    assignedPumpRelayCode: 'PMP-RLY-1001',
  },
  {
    zoneCode: 'IRR-ZN-1002',
    zoneName: 'Kadawa Wheat Belt Block 4 — Center Pivot Durum Wheat',
    stateName: 'Kano',
    lgaName: 'Garun Mallam',
    riverBasinAuthority: 'Hadejia-Jama’are RBDA',
    cropKey: 'WHEAT_IRRIGATED',
    phenologyStage: 'MID_SEASON_HEADING',
    soilTextureKey: 'LOAM',
    irrigationMethod: 'CENTER_PIVOT_SPRINKLER',
    commandAreaHectares: 42.0,
    matricSuctionKpa: 68.0,
    referenceEt0MmDay: 5.9,
    effectiveRainMmDay: 0.0,
    electricalConductivityDsm: 1.35,
    assignedPumpRelayCode: 'PMP-RLY-1002',
  },
  {
    zoneCode: 'IRR-ZN-1003',
    zoneName: 'Goronyo Reservoir Left Bank — Red Creole Bulb Onion',
    stateName: 'Sokoto',
    lgaName: 'Goronyo',
    riverBasinAuthority: 'Sokoto-Rima RBDA',
    cropKey: 'ONION_BULB',
    phenologyStage: 'BULB_FORMATION',
    soilTextureKey: 'LOAMY_SAND',
    irrigationMethod: 'SURFACE_DRIP_LINE',
    commandAreaHectares: 9.2,
    matricSuctionKpa: 38.0,
    referenceEt0MmDay: 7.1,
    effectiveRainMmDay: 0.0,
    electricalConductivityDsm: 1.9,
    assignedPumpRelayCode: 'PMP-RLY-1003',
  },
  {
    zoneCode: 'IRR-ZN-1004',
    zoneName: 'Bakolori Lowland Basin — AWD Irrigated Lowland Rice (FARO-44)',
    stateName: 'Zamfara',
    lgaName: 'Talata Mafara',
    riverBasinAuthority: 'Sokoto-Rima RBDA',
    cropKey: 'RICE_IRRIGATED_AWD',
    phenologyStage: 'PANICLE_INITIATION',
    soilTextureKey: 'CLAY_LOAM',
    irrigationMethod: 'AWD_LEVEL_BASIN',
    commandAreaHectares: 28.0,
    matricSuctionKpa: 18.0,
    referenceEt0MmDay: 6.1,
    effectiveRainMmDay: 2.5,
    electricalConductivityDsm: 1.15,
    assignedPumpRelayCode: 'PMP-RLY-1004',
  },
];

const SEED_SMART_PUMP_NODES = [
  {
    relayNodeCode: 'PMP-RLY-1001',
    stationName: 'Kura Solar-MPPT Submersible Pump Station #1',
    stateName: 'Kano',
    powerSourceType: 'SOLAR_PV_HYBRID_MPPT',
    ratedPowerKw: 15.0,
    flowRateM3PerHour: 68.0,
    pipeLengthMeters: 420.0,
    pipeInnerDiameterMm: 110.0,
    staticSuctionLiftMeters: 18.5,
    dischargePressureBar: 2.6,
    filterDifferentialPressureBar: 0.24,
    boreholeDrawdownOk: true,
    contactorState: 'ENERGIZED_PUMPING',
    activeRuntimeMinutes: 95,
  },
  {
    relayNodeCode: 'PMP-RLY-1002',
    stationName: 'Garun Mallam Center-Pivot Booster Station #2',
    stateName: 'Kano',
    powerSourceType: 'GRID_DIESEL_HYBRID',
    ratedPowerKw: 37.0,
    flowRateM3PerHour: 145.0,
    pipeLengthMeters: 680.0,
    pipeInnerDiameterMm: 160.0,
    staticSuctionLiftMeters: 14.0,
    dischargePressureBar: 3.4,
    filterDifferentialPressureBar: 0.31,
    boreholeDrawdownOk: true,
    contactorState: 'STANDBY_READY',
    activeRuntimeMinutes: 0,
  },
  {
    relayNodeCode: 'PMP-RLY-1003',
    stationName: 'Goronyo Canal Lift & Venturi Fertigation Skid #3',
    stateName: 'Sokoto',
    powerSourceType: 'SOLAR_PV_DIRECT',
    ratedPowerKw: 11.0,
    flowRateM3PerHour: 52.0,
    pipeLengthMeters: 310.0,
    pipeInnerDiameterMm: 90.0,
    staticSuctionLiftMeters: 9.5,
    dischargePressureBar: 2.3,
    filterDifferentialPressureBar: 0.42,
    boreholeDrawdownOk: true,
    contactorState: 'FERTIGATION_VENTURI_DOSING',
    activeRuntimeMinutes: 45,
  },
];

/**
 * GET /api/irrigation-advisor/zones
 * Lists active irrigation zones with live FAO-56 root-zone schedules.
 */
router.get('/zones', (req, res) => {
  const { cropKey, stateName } = req.query;

  let filteredZones = [...SEED_IRRIGATION_ZONES];
  if (cropKey) {
    filteredZones = filteredZones.filter(
      (z) => z.cropKey.toUpperCase() === String(cropKey).toUpperCase()
    );
  }
  if (stateName) {
    filteredZones = filteredZones.filter(
      (z) => z.stateName.toLowerCase() === String(stateName).toLowerCase()
    );
  }

  const enrichedZones = filteredZones.map((zone) => {
    const scheduleEvaluation = evaluateFao56RootZoneSchedule({
      cropKey: zone.cropKey,
      soilTextureKey: zone.soilTextureKey,
      commandAreaHectares: zone.commandAreaHectares,
      matricSuctionKpa: zone.matricSuctionKpa,
      referenceEt0MmDay: zone.referenceEt0MmDay,
      effectiveRainMmDay: zone.effectiveRainMmDay,
    });
    return {
      ...zone,
      scheduleEvaluation,
    };
  });

  res.status(200).json({
    success: true,
    count: enrichedZones.length,
    zones: enrichedZones,
    catalogs: {
      soilHydraulicProfiles: SOIL_HYDRAULIC_PROFILES,
      irrigatedCropCatalog: IRRIGATED_CROP_FAO56_CATALOG,
    },
  });
});

/**
 * GET /api/irrigation-advisor/pumps
 * Lists smart pump relay nodes with Hazen-Williams hydraulic head and energy telemetry.
 */
router.get('/pumps', (req, res) => {
  const enrichedPumps = SEED_SMART_PUMP_NODES.map((pump) => {
    const hydraulics = computeSmartPumpHydraulicsAndEnergy({
      flowRateM3PerHour: pump.flowRateM3PerHour,
      pipeLengthMeters: pump.pipeLengthMeters,
      pipeInnerDiameterMm: pump.pipeInnerDiameterMm,
      staticSuctionLiftMeters: pump.staticSuctionLiftMeters,
      emitterOperatingPressureBar: pump.dischargePressureBar,
      requiredWaterVolumeM3: 640,
    });
    return {
      ...pump,
      hydraulics,
    };
  });

  res.status(200).json({
    success: true,
    count: enrichedPumps.length,
    pumps: enrichedPumps,
  });
});

/**
 * POST /api/irrigation-advisor/evaluate-schedule
 * Computes FAO-56 root-zone depletion, 7-day rolling ledger, and Hazen-Williams pump hydraulics.
 */
router.post('/evaluate-schedule', (req, res) => {
  const body = req.body || {};

  const scheduleEvaluation = evaluateFao56RootZoneSchedule(body);
  const sevenDayLedger = simulateSevenDayIrrigationLedger({
    ...body,
    currentDepletionDrMm: scheduleEvaluation.currentDepletionDrMm,
  });
  const pumpHydraulics = computeSmartPumpHydraulicsAndEnergy({
    flowRateM3PerHour: body.flowRateM3PerHour ?? 68.0,
    pipeLengthMeters: body.pipeLengthMeters ?? 420.0,
    pipeInnerDiameterMm: body.pipeInnerDiameterMm ?? 110.0,
    staticSuctionLiftMeters: body.staticSuctionLiftMeters ?? 18.5,
    emitterOperatingPressureBar: body.emitterOperatingPressureBar ?? 2.4,
    requiredWaterVolumeM3: Math.max(50, scheduleEvaluation.grossWaterVolumeM3 || 520),
  });

  res.status(200).json({
    success: true,
    scheduleEvaluation,
    sevenDayLedger,
    pumpHydraulics,
  });
});

/**
 * POST /api/irrigation-advisor/relay-command
 * Dispatches a safety-interlocked relay command to a smart pump & solenoid valve station.
 */
router.post('/relay-command', (req, res) => {
  const body = req.body || {};
  if (!body.relayNodeCode || !body.commandAction) {
    return res.status(400).json({
      success: false,
      message: 'relayNodeCode and commandAction are required.',
    });
  }

  const relayDispatch = executeSmartPumpRelayCommand(body);

  res.status(200).json({
    success: true,
    dispatchedAt: new Date().toISOString(),
    relayDispatch,
  });
});

/**
 * POST /api/irrigation-advisor/tensiometer-ingest
 * Ingests tensiometer matric suction (kPa) and computes Van Genuchten volumetric moisture.
 */
router.post('/tensiometer-ingest', (req, res) => {
  const body = req.body || {};
  const podCode = String(body.podCode || 'TNS-POD-1001');
  const soilTextureKey = String(body.soilTextureKey || 'SANDY_LOAM');
  const matricSuctionKpa = Number(body.matricSuctionKpa ?? 42.0);
  const soilTempCelsius = Number(body.soilTempCelsius ?? 28.4);
  const bulkEcDsm = Number(body.bulkEcDsm ?? 1.45);

  const vanGenuchtenMoistureVolPct = computeVanGenuchtenMoistureFromSuction(
    matricSuctionKpa,
    soilTextureKey
  );

  res.status(201).json({
    success: true,
    telemetryPacket: {
      podCode,
      soilTextureKey,
      matricSuctionKpa,
      vanGenuchtenMoistureVolPct,
      soilTempCelsius,
      bulkEcDsm,
      stressBand:
        matricSuctionKpa > 60
          ? 'HIGH_MATRIC_TENSION_IRRIGATION_URGENT'
          : matricSuctionKpa > 33
          ? 'MODERATE_DEPLETION_MONITOR'
          : 'OPTIMAL_FIELD_CAPACITY_BAND',
      ingestedAt: new Date().toISOString(),
    },
  });
});

module.exports = router;
