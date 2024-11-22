/**
 * ==============================================================================
 * 💧 AGRILY SPRINT 23: FAO-56 DUAL KCB SOIL WATER BALANCE & VAN GENUCHTEN ENGINE
 * ==============================================================================
 *
 * Implements:
 *  1. Van Genuchten (1980) Soil Water Retention Curve (SWRC):
 *       theta(psi) = theta_r + (theta_s - theta_r) / [ 1 + (alpha * |psi|)^n ]^m
 *     where m = 1 - 1/n, psi in kPa.
 *  2. FAO-56 Dual Crop Coefficient Evapotranspiration & Root-Zone Depletion:
 *       TAW = 1000 * (theta_FC - theta_WP) * Z_r
 *       RAW = p_adj * TAW, where p_adj = p_table + 0.04 * (5 - ET_c)
 *       K_s = (TAW - D_r) / ((1 - p_adj) * TAW)   for D_r > RAW, else 1.0
 *       ET_c = (K_cb * K_s + K_e) * ET_0
 *  3. 7-Day Forward Root-Zone Moisture Depletion & Smart Irrigation Triggering.
 *
 * @module services/fao56SoilWaterBalanceEngine
 */

const SOIL_HYDRAULIC_PROFILES = {
  SANDY_LOAM: {
    textureKey: 'SANDY_LOAM',
    textureName: 'Savanna Sandy Loam',
    thetaSatVolPct: 41.0,
    thetaResVolPct: 6.5,
    fieldCapacityVolPct: 21.5,
    wiltingPointVolPct: 9.5,
    vanGenuchtenAlphaPerKpa: 0.075,
    vanGenuchtenN: 1.89,
    saturatedHydraulicCondMmHr: 44.2,
    wettedFractionDripFw: 0.35,
  },
  LOAM: {
    textureKey: 'LOAM',
    textureName: 'Alluvial Loam',
    thetaSatVolPct: 43.0,
    thetaResVolPct: 7.8,
    fieldCapacityVolPct: 27.0,
    wiltingPointVolPct: 12.0,
    vanGenuchtenAlphaPerKpa: 0.036,
    vanGenuchtenN: 1.56,
    saturatedHydraulicCondMmHr: 13.4,
    wettedFractionDripFw: 0.42,
  },
  SANDY_CLAY_LOAM: {
    textureKey: 'SANDY_CLAY_LOAM',
    textureName: 'Ferruginous Sandy Clay Loam',
    thetaSatVolPct: 39.0,
    thetaResVolPct: 10.0,
    fieldCapacityVolPct: 29.5,
    wiltingPointVolPct: 14.5,
    vanGenuchtenAlphaPerKpa: 0.059,
    vanGenuchtenN: 1.48,
    saturatedHydraulicCondMmHr: 13.1,
    wettedFractionDripFw: 0.46,
  },
  CLAY_LOAM: {
    textureKey: 'CLAY_LOAM',
    textureName: 'Upland Clay Loam',
    thetaSatVolPct: 41.0,
    thetaResVolPct: 9.5,
    fieldCapacityVolPct: 33.5,
    wiltingPointVolPct: 18.0,
    vanGenuchtenAlphaPerKpa: 0.019,
    vanGenuchtenN: 1.31,
    saturatedHydraulicCondMmHr: 2.6,
    wettedFractionDripFw: 0.52,
  },
  SILTY_CLAY_LOAM: {
    textureKey: 'SILTY_CLAY_LOAM',
    textureName: 'Floodplain Silty Clay Loam',
    thetaSatVolPct: 43.0,
    thetaResVolPct: 8.9,
    fieldCapacityVolPct: 35.5,
    wiltingPointVolPct: 19.5,
    vanGenuchtenAlphaPerKpa: 0.010,
    vanGenuchtenN: 1.23,
    saturatedHydraulicCondMmHr: 1.7,
    wettedFractionDripFw: 0.55,
  },
  FADAMA_VERTISOL_CLAY: {
    textureKey: 'FADAMA_VERTISOL_CLAY',
    textureName: 'Fadama Black Cotton Vertisol Clay',
    thetaSatVolPct: 47.5,
    thetaResVolPct: 11.2,
    fieldCapacityVolPct: 39.5,
    wiltingPointVolPct: 23.0,
    vanGenuchtenAlphaPerKpa: 0.008,
    vanGenuchtenN: 1.18,
    saturatedHydraulicCondMmHr: 0.85,
    wettedFractionDripFw: 0.62,
  },
};

const IRRIGATED_CROP_FAO56_CATALOG = {
  MAIZE: {
    cropKey: 'MAIZE',
    cropName: 'Irrigated Hybrid Maize',
    kcbIni: 0.15,
    kcbMid: 1.15,
    kcbEnd: 0.50,
    maxRootDepthMetersZr: 1.10,
    depletionFractionP: 0.55,
    salinityThresholdEcDsm: 1.7,
    salinitySlopePctPerDsm: 12.0,
  },
  RICE_PADDY: {
    cropKey: 'RICE_PADDY',
    cropName: 'Lowland Irrigated Paddy Rice (AWD Regime)',
    kcbIni: 1.00,
    kcbMid: 1.20,
    kcbEnd: 0.75,
    maxRootDepthMetersZr: 0.60,
    depletionFractionP: 0.20,
    salinityThresholdEcDsm: 3.0,
    salinitySlopePctPerDsm: 12.0,
  },
  TOMATO: {
    cropKey: 'TOMATO',
    cropName: 'Drip-Irrigated Determinate Tomato',
    kcbIni: 0.15,
    kcbMid: 1.10,
    kcbEnd: 0.70,
    maxRootDepthMetersZr: 0.85,
    depletionFractionP: 0.40,
    salinityThresholdEcDsm: 2.5,
    salinitySlopePctPerDsm: 9.9,
  },
  ONION: {
    cropKey: 'ONION',
    cropName: 'Dry-Season Red Sokoto / Kano Bulb Onion',
    kcbIni: 0.15,
    kcbMid: 1.00,
    kcbEnd: 0.65,
    maxRootDepthMetersZr: 0.45,
    depletionFractionP: 0.30,
    salinityThresholdEcDsm: 1.2,
    salinitySlopePctPerDsm: 16.0,
  },
  WHEAT: {
    cropKey: 'WHEAT',
    cropName: 'Harmattan Irrigated Bread Wheat (LACRI-Norman)',
    kcbIni: 0.15,
    kcbMid: 1.10,
    kcbEnd: 0.30,
    maxRootDepthMetersZr: 1.05,
    depletionFractionP: 0.55,
    salinityThresholdEcDsm: 6.0,
    salinitySlopePctPerDsm: 7.1,
  },
  POTATO: {
    cropKey: 'POTATO',
    cropName: 'Jos Highland Irrigated Irish Potato',
    kcbIni: 0.15,
    kcbMid: 1.10,
    kcbEnd: 0.65,
    maxRootDepthMetersZr: 0.60,
    depletionFractionP: 0.35,
    salinityThresholdEcDsm: 1.7,
    salinitySlopePctPerDsm: 12.0,
  },
  SOYBEAN: {
    cropKey: 'SOYBEAN',
    cropName: 'Supplemental Irrigated Seed Soybean',
    kcbIni: 0.15,
    kcbMid: 1.10,
    kcbEnd: 0.40,
    maxRootDepthMetersZr: 0.90,
    depletionFractionP: 0.50,
    salinityThresholdEcDsm: 5.0,
    salinitySlopePctPerDsm: 20.0,
  },
  SUGARCANE: {
    cropKey: 'SUGARCANE',
    cropName: 'Savanna Estate Drip Sugarcane',
    kcbIni: 0.35,
    kcbMid: 1.20,
    kcbEnd: 0.70,
    maxRootDepthMetersZr: 1.35,
    depletionFractionP: 0.65,
    salinityThresholdEcDsm: 1.7,
    salinitySlopePctPerDsm: 5.9,
  },
  PEPPER: {
    cropKey: 'PEPPER',
    cropName: 'Irrigated Bell & Scotch Bonnet Pepper',
    kcbIni: 0.15,
    kcbMid: 1.00,
    kcbEnd: 0.80,
    maxRootDepthMetersZr: 0.70,
    depletionFractionP: 0.30,
    salinityThresholdEcDsm: 1.5,
    salinitySlopePctPerDsm: 14.0,
  },
};

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

function roundTo(val, digits = 2) {
  const factor = Math.pow(10, digits);
  return Math.round((Number(val) || 0) * factor) / factor;
}

/**
 * Computes volumetric soil moisture theta (%) from tensiometer matric suction psi (kPa)
 * using the Van Genuchten (1980) water retention equation.
 */
function computeVanGenuchtenMoistureFromSuction(params = {}) {
  const textureKey = String(params.textureKey || 'SANDY_CLAY_LOAM').toUpperCase();
  const soil =
    SOIL_HYDRAULIC_PROFILES[textureKey] ||
    SOIL_HYDRAULIC_PROFILES.SANDY_CLAY_LOAM;

  const matricSuctionKpa = clamp(Number(params.matricSuctionKpa ?? 42.0), 0.1, 1500.0);
  const m = 1 - 1 / soil.vanGenuchtenN;
  const denom = Math.pow(
    1 + Math.pow(soil.vanGenuchtenAlphaPerKpa * matricSuctionKpa, soil.vanGenuchtenN),
    m
  );

  const thetaVolPct =
    soil.thetaResVolPct +
    (soil.thetaSatVolPct - soil.thetaResVolPct) / Math.max(1.0, denom);

  const boundedThetaPct = clamp(
    roundTo(thetaVolPct, 2),
    soil.thetaResVolPct,
    soil.thetaSatVolPct
  );

  return {
    textureKey: soil.textureKey,
    matricSuctionKpa: roundTo(matricSuctionKpa, 1),
    volumetricMoisturePct: boundedThetaPct,
    fieldCapacityVolPct: soil.fieldCapacityVolPct,
    wiltingPointVolPct: soil.wiltingPointVolPct,
  };
}

/**
 * Evaluates FAO-56 Dual Crop Coefficient root-zone water balance, water stress
 * coefficient Ks, and gross irrigation depth & runtime requirements.
 */
function evaluateFao56RootZoneSchedule(params = {}) {
  const cropKey = String(params.cropKey || 'MAIZE').toUpperCase();
  const textureKey = String(params.textureKey || 'SANDY_CLAY_LOAM').toUpperCase();
  const crop =
    IRRIGATED_CROP_FAO56_CATALOG[cropKey] || IRRIGATED_CROP_FAO56_CATALOG.MAIZE;
  const soil =
    SOIL_HYDRAULIC_PROFILES[textureKey] ||
    SOIL_HYDRAULIC_PROFILES.SANDY_CLAY_LOAM;

  const referenceEt0MmDay = clamp(Number(params.referenceEt0MmDay ?? 5.8), 1.2, 12.5);
  const growthStage = String(params.growthStage || 'MID_SEASON').toUpperCase();
  const effectiveRootDepthMetersZr = clamp(
    Number(params.effectiveRootDepthMetersZr ?? crop.maxRootDepthMetersZr * 0.85),
    0.20,
    2.0
  );
  const currentMoistureVolPct = clamp(
    Number(params.currentMoistureVolPct ?? soil.fieldCapacityVolPct - 6.8),
    soil.wiltingPointVolPct * 0.85,
    soil.thetaSatVolPct
  );
  const commandAreaHectares = Math.max(0.5, Number(params.commandAreaHectares ?? 10.0));
  const applicationEfficiencyEa = clamp(
    Number(params.applicationEfficiencyEa ?? 0.90),
    0.50,
    0.98
  );
  const distributionUniformityDuLq = clamp(
    Number(params.distributionUniformityDuLq ?? 0.91),
    0.60,
    0.98
  );

  const kcb =
    growthStage === 'INITIAL'
      ? crop.kcbIni
      : growthStage === 'LATE_SEASON'
      ? crop.kcbEnd
      : crop.kcbMid;
  const ke = growthStage === 'INITIAL' ? 0.24 : 0.08;

  // TAW & RAW (with FAO-56 Eq. 82 atmospheric demand adjustment on p)
  const tawMm =
    1000 *
    ((soil.fieldCapacityVolPct - soil.wiltingPointVolPct) / 100) *
    effectiveRootDepthMetersZr;
  const unadjustedEtc = (kcb + ke) * referenceEt0MmDay;
  const pAdjusted = clamp(
    crop.depletionFractionP + 0.04 * (5.0 - unadjustedEtc),
    0.10,
    0.80
  );
  const rawMm = tawMm * pAdjusted;

  // Current root-zone depletion D_r (mm)
  const currentDepletionDrMm = clamp(
    1000 *
      ((soil.fieldCapacityVolPct - currentMoistureVolPct) / 100) *
      effectiveRootDepthMetersZr,
    0,
    tawMm * 1.05
  );

  // FAO-56 Eq. 84 Water Stress Coefficient K_s
  const waterStressCoeffKs =
    currentDepletionDrMm <= rawMm
      ? 1.0
      : clamp(
          (tawMm - currentDepletionDrMm) / Math.max(1.0, (1 - pAdjusted) * tawMm),
          0.08,
          1.0
        );

  const actualCropEtcMmDay = (kcb * waterStressCoeffKs + ke) * referenceEt0MmDay;

  // Net and Gross Irrigation Depth to refill root zone to Field Capacity
  const netIrrigationDepthMm =
    currentDepletionDrMm >= rawMm * 0.85 ? currentDepletionDrMm : 0;
  const grossIrrigationDepthMm =
    netIrrigationDepthMm / (applicationEfficiencyEa * distributionUniformityDuLq);
  const grossWaterVolumeM3 = grossIrrigationDepthMm * commandAreaHectares * 10;

  // Days until RAW threshold is crossed if currently below RAW
  const daysToNextIrrigationTrigger =
    currentDepletionDrMm >= rawMm
      ? 0
      : Math.max(
          1,
          Math.ceil((rawMm - currentDepletionDrMm) / Math.max(1.0, actualCropEtcMmDay))
        );

  let triggerDecision = 'HOLD_IRRIGATION_ADEQUATE_MOISTURE';
  if (currentDepletionDrMm >= tawMm * 0.78) {
    triggerDecision = 'EMERGENCY_HIGH_PRESSURE_REFILL_NOW';
  } else if (currentDepletionDrMm >= rawMm) {
    triggerDecision = 'ACTIVATE_SMART_PUMP_RELAY_CYCLE';
  } else if (currentDepletionDrMm >= rawMm * 0.82) {
    triggerDecision = 'QUEUE_NIGHT_VALVE_CYCLE';
  }

  return {
    cropKey: crop.cropKey,
    cropName: crop.cropName,
    textureKey: soil.textureKey,
    textureName: soil.textureName,
    commandAreaHectares: roundTo(commandAreaHectares, 2),
    effectiveRootDepthMetersZr: roundTo(effectiveRootDepthMetersZr, 2),
    tawMm: roundTo(tawMm, 1),
    rawMm: roundTo(rawMm, 1),
    pAdjusted: roundTo(pAdjusted, 3),
    currentMoistureVolPct: roundTo(currentMoistureVolPct, 2),
    currentDepletionDrMm: roundTo(currentDepletionDrMm, 1),
    depletionOfTawPct: roundTo((currentDepletionDrMm / Math.max(1, tawMm)) * 100, 1),
    waterStressCoeffKs: roundTo(waterStressCoeffKs, 3),
    referenceEt0MmDay: roundTo(referenceEt0MmDay, 2),
    actualCropEtcMmDay: roundTo(actualCropEtcMmDay, 2),
    netIrrigationDepthMm: roundTo(netIrrigationDepthMm, 1),
    grossIrrigationDepthMm: roundTo(grossIrrigationDepthMm, 1),
    grossWaterVolumeM3: Math.round(grossWaterVolumeM3),
    daysToNextIrrigationTrigger,
    triggerDecision,
  };
}

/**
 * Simulates a 7-day rolling FAO-56 root-zone soil water balance with automatic
 * smart-relay refill events whenever D_r >= RAW.
 */
function simulateSevenDayIrrigationLedger(params = {}) {
  const baseEval = evaluateFao56RootZoneSchedule(params);
  let runningDepletionMm = baseEval.currentDepletionDrMm;
  const tawMm = baseEval.tawMm;
  const rawMm = baseEval.rawMm;
  const dailyEtcMm = baseEval.actualCropEtcMmDay;
  const forecastRainSeriesMm =
    Array.isArray(params.forecastRainSeriesMm) && params.forecastRainSeriesMm.length === 7
      ? params.forecastRainSeriesMm
      : [0, 0, 4.5, 0, 0, 0, 2.0];

  const dailyLedger = [];
  let totalAppliedIrrigationMm = 0;

  for (let day = 1; day <= 7; day++) {
    const effectiveRainMm = Number(forecastRainSeriesMm[day - 1] || 0) * 0.82;
    let appliedNetIrrigationMm = 0;
    let pumpRelayTriggered = false;

    if (runningDepletionMm >= rawMm) {
      appliedNetIrrigationMm = roundTo(runningDepletionMm, 1);
      totalAppliedIrrigationMm += appliedNetIrrigationMm;
      pumpRelayTriggered = true;
    }

    const endOfDayDepletionMm = clamp(
      runningDepletionMm + dailyEtcMm - effectiveRainMm - appliedNetIrrigationMm,
      0,
      tawMm
    );

    dailyLedger.push({
      dayIndex: day,
      startDepletionMm: roundTo(runningDepletionMm, 1),
      cropEtcMm: roundTo(dailyEtcMm, 2),
      effectiveRainMm: roundTo(effectiveRainMm, 1),
      appliedNetIrrigationMm: roundTo(appliedNetIrrigationMm, 1),
      endDepletionMm: roundTo(endOfDayDepletionMm, 1),
      pumpRelayTriggered,
    });

    runningDepletionMm = endOfDayDepletionMm;
  }

  return {
    cropKey: baseEval.cropKey,
    textureKey: baseEval.textureKey,
    tawMm,
    rawMm,
    totalAppliedIrrigationMm: roundTo(totalAppliedIrrigationMm, 1),
    dailyLedger,
  };
}

module.exports = {
  SOIL_HYDRAULIC_PROFILES,
  IRRIGATED_CROP_FAO56_CATALOG,
  computeVanGenuchtenMoistureFromSuction,
  evaluateFao56RootZoneSchedule,
  simulateSevenDayIrrigationLedger,
};
