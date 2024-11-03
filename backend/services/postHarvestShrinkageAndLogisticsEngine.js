/**
 * ==============================================================================
 * 🌾 AGRILY SPRINT 21: POST-HARVEST SHRINKAGE, DRYING & FLEET LOGISTICS ENGINE
 * ==============================================================================
 *
 * Mechanistic post-harvest engineering service covering:
 *  1. Commercial moisture shrinkage & chaff cleaning mass-balance equations
 *  2. Psychrometric grain drying thermal energy & propane/biomass fuel demand
 *  3. Aflatoxin B1 / Aspergillus flavus equilibrium relative humidity (ERH) risk
 *  4. Combine harvester work-rate & field threshing loss optimization
 *  5. 30-ton silo trailer & 50kg jute/polypropylene bag evacuation scheduling
 *
 * @module services/postHarvestShrinkageAndLogisticsEngine
 */

const CROP_POST_HARVEST_SPECS = {
  MAIZE: {
    cropKey: 'MAIZE',
    cropName: 'White / Yellow Hybrid Maize',
    standardMoisturePct: 13.5,
    safeLongTermMoisturePct: 12.5,
    bulkDensityKgM3: 745,
    latentHeatVaporizationKjKgWater: 2680,
    combineSwathWidthM: 6.0,
    optimalCombineSpeedKmH: 6.5,
    combineFieldEfficiency: 0.76,
    baseThreshingLossPct: 2.1,
    shatteringRatePctPerDayLate: 0.38,
    standardBagWeightKg: 50,
    aflatoxinSusceptibilityFactor: 1.35,
  },
  RICE_PADDY: {
    cropKey: 'RICE_PADDY',
    cropName: 'Lowland Irrigated Paddy Rice',
    standardMoisturePct: 14.0,
    safeLongTermMoisturePct: 13.0,
    bulkDensityKgM3: 585,
    latentHeatVaporizationKjKgWater: 2740,
    combineSwathWidthM: 4.8,
    optimalCombineSpeedKmH: 5.2,
    combineFieldEfficiency: 0.72,
    baseThreshingLossPct: 2.6,
    shatteringRatePctPerDayLate: 0.45,
    standardBagWeightKg: 50,
    aflatoxinSusceptibilityFactor: 0.95,
  },
  SORGHUM: {
    cropKey: 'SORGHUM',
    cropName: 'Guinea Corn (Sorghum bicolor)',
    standardMoisturePct: 13.0,
    safeLongTermMoisturePct: 12.0,
    bulkDensityKgM3: 755,
    latentHeatVaporizationKjKgWater: 2660,
    combineSwathWidthM: 6.0,
    optimalCombineSpeedKmH: 6.8,
    combineFieldEfficiency: 0.78,
    baseThreshingLossPct: 1.9,
    shatteringRatePctPerDayLate: 0.29,
    standardBagWeightKg: 50,
    aflatoxinSusceptibilityFactor: 1.05,
  },
  SOYBEAN: {
    cropKey: 'SOYBEAN',
    cropName: 'Commercial Non-GMO Soybean',
    standardMoisturePct: 12.0,
    safeLongTermMoisturePct: 11.0,
    bulkDensityKgM3: 770,
    latentHeatVaporizationKjKgWater: 2790,
    combineSwathWidthM: 6.2,
    optimalCombineSpeedKmH: 6.0,
    combineFieldEfficiency: 0.75,
    baseThreshingLossPct: 2.8,
    shatteringRatePctPerDayLate: 0.65,
    standardBagWeightKg: 50,
    aflatoxinSusceptibilityFactor: 0.85,
  },
  COWPEA: {
    cropKey: 'COWPEA',
    cropName: 'Savanna White / Brown Cowpea',
    standardMoisturePct: 12.5,
    safeLongTermMoisturePct: 11.5,
    bulkDensityKgM3: 760,
    latentHeatVaporizationKjKgWater: 2720,
    combineSwathWidthM: 5.0,
    optimalCombineSpeedKmH: 5.4,
    combineFieldEfficiency: 0.73,
    baseThreshingLossPct: 2.5,
    shatteringRatePctPerDayLate: 0.52,
    standardBagWeightKg: 50,
    aflatoxinSusceptibilityFactor: 0.90,
  },
  GROUNDNUT: {
    cropKey: 'GROUNDNUT',
    cropName: 'Shelled Savanna Groundnut',
    standardMoisturePct: 9.0,
    safeLongTermMoisturePct: 8.0,
    bulkDensityKgM3: 640,
    latentHeatVaporizationKjKgWater: 2850,
    combineSwathWidthM: 4.2,
    optimalCombineSpeedKmH: 4.5,
    combineFieldEfficiency: 0.70,
    baseThreshingLossPct: 3.4,
    shatteringRatePctPerDayLate: 0.48,
    standardBagWeightKg: 50,
    aflatoxinSusceptibilityFactor: 1.65,
  },
  CASSAVA: {
    cropKey: 'CASSAVA',
    cropName: 'Fresh Industrial Starch Cassava Roots',
    standardMoisturePct: 65.0,
    safeLongTermMoisturePct: 12.0,
    bulkDensityKgM3: 620,
    latentHeatVaporizationKjKgWater: 2520,
    combineSwathWidthM: 3.6,
    optimalCombineSpeedKmH: 3.8,
    combineFieldEfficiency: 0.68,
    baseThreshingLossPct: 3.8,
    shatteringRatePctPerDayLate: 0.85,
    standardBagWeightKg: 50,
    aflatoxinSusceptibilityFactor: 0.75,
  },
  SESAME: {
    cropKey: 'SESAME',
    cropName: 'Export-Grade White Sesame Seed',
    standardMoisturePct: 8.0,
    safeLongTermMoisturePct: 7.0,
    bulkDensityKgM3: 615,
    latentHeatVaporizationKjKgWater: 2890,
    combineSwathWidthM: 4.5,
    optimalCombineSpeedKmH: 4.6,
    combineFieldEfficiency: 0.71,
    baseThreshingLossPct: 3.9,
    shatteringRatePctPerDayLate: 0.92,
    standardBagWeightKg: 50,
    aflatoxinSusceptibilityFactor: 0.80,
  },
  MILLET: {
    cropKey: 'MILLET',
    cropName: 'Sahelian Pearl Millet (Pennisetum glaucum)',
    standardMoisturePct: 12.5,
    safeLongTermMoisturePct: 11.5,
    bulkDensityKgM3: 750,
    latentHeatVaporizationKjKgWater: 2670,
    combineSwathWidthM: 5.5,
    optimalCombineSpeedKmH: 6.2,
    combineFieldEfficiency: 0.76,
    baseThreshingLossPct: 2.2,
    shatteringRatePctPerDayLate: 0.34,
    standardBagWeightKg: 50,
    aflatoxinSusceptibilityFactor: 0.92,
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
 * Computes exact commercial grain shrinkage, water evaporation mass, and thermal drying fuel demand.
 */
function computePostHarvestShrinkageBalance(params = {}) {
  const cropKey = String(params.cropKey || 'MAIZE').toUpperCase();
  const spec = CROP_POST_HARVEST_SPECS[cropKey] || CROP_POST_HARVEST_SPECS.MAIZE;

  const grossWetWeightKg = Math.max(100, Number(params.grossWetWeightKg) || 28000);
  const tareWeightKg = Math.max(0, Number(params.tareWeightKg) || 0);
  const wetScaleNetKg = Math.max(50, grossWetWeightKg - tareWeightKg);

  const harvestMoisturePct = clamp(
    Number(params.harvestMoisturePct ?? spec.standardMoisturePct + 4.2),
    5.0,
    72.0
  );
  const targetMoisturePct = clamp(
    Number(params.targetMoisturePct ?? spec.standardMoisturePct),
    5.0,
    68.0
  );
  const foreignMatterPct = clamp(Number(params.foreignMatterPct ?? 1.5), 0, 25);
  const brokenKernelsPct = clamp(Number(params.brokenKernelsPct ?? 1.8), 0, 30);

  // Step 1: Pre-cleaning chaff & foreign matter screen deduction
  const foreignMatterRemovedKg = wetScaleNetKg * (foreignMatterPct / 100);
  const cleanWetGrainKg = wetScaleNetKg - foreignMatterRemovedKg;

  // Step 2: Commercial moisture shrinkage mass balance:
  // W_final = W_clean_wet * (100 - M_wet) / (100 - M_target)
  const moistureShrinkFactor =
    harvestMoisturePct > targetMoisturePct
      ? (100 - harvestMoisturePct) / (100 - targetMoisturePct)
      : 1.0;

  const standardDryGrainKg = cleanWetGrainKg * moistureShrinkFactor;
  const waterEvaporatedKg = Math.max(0, cleanWetGrainKg - standardDryGrainKg);

  // Commercial elevator handling loss (0.15% per percentage point of moisture removed)
  const moisturePointsRemoved = Math.max(0, harvestMoisturePct - targetMoisturePct);
  const handlingInvisibleLossKg = cleanWetGrainKg * (moisturePointsRemoved * 0.0015);
  const netDeliverableSiloKg = Math.max(0, standardDryGrainKg - handlingInvisibleLossKg);

  // Step 3: Thermal drying energy & fuel requirement (kJ -> MJ -> LPG kg)
  // Effective dryer efficiency ~ 0.58 for recirculating batch column dryers
  const dryerThermalEfficiency = 0.58;
  const thermalEnergyMj =
    (waterEvaporatedKg * (spec.latentHeatVaporizationKjKgWater / 1000)) /
    dryerThermalEfficiency;
  const lpgFuelEquivalentKg = thermalEnergyMj / 46.1; // LPG LHV = 46.1 MJ/kg
  const dryingCostNgn = lpgFuelEquivalentKg * 1250;

  // Quality grade deduction check
  let commercialGradeTier = 'GRADE_1_EXPORT';
  if (brokenKernelsPct > 5.0 || foreignMatterPct > 3.5) {
    commercialGradeTier = 'GRADE_3_FEED';
  } else if (brokenKernelsPct > 2.5 || foreignMatterPct > 2.0) {
    commercialGradeTier = 'GRADE_2_MILLING';
  }

  return {
    cropKey: spec.cropKey,
    cropName: spec.cropName,
    wetScaleNetKg: roundTo(wetScaleNetKg, 1),
    foreignMatterRemovedKg: roundTo(foreignMatterRemovedKg, 1),
    cleanWetGrainKg: roundTo(cleanWetGrainKg, 1),
    harvestMoisturePct: roundTo(harvestMoisturePct, 2),
    targetMoisturePct: roundTo(targetMoisturePct, 2),
    moisturePointsRemoved: roundTo(moisturePointsRemoved, 2),
    waterEvaporatedKg: roundTo(waterEvaporatedKg, 1),
    handlingInvisibleLossKg: roundTo(handlingInvisibleLossKg, 1),
    standardDryGrainKg: roundTo(standardDryGrainKg, 1),
    netDeliverableSiloKg: roundTo(netDeliverableSiloKg, 1),
    netDeliverableSiloTons: roundTo(netDeliverableSiloKg / 1000, 3),
    totalShrinkagePct: roundTo(
      ((wetScaleNetKg - netDeliverableSiloKg) / wetScaleNetKg) * 100,
      2
    ),
    thermalEnergyMj: roundTo(thermalEnergyMj, 1),
    lpgFuelEquivalentKg: roundTo(lpgFuelEquivalentKg, 2),
    dryingCostNgn: Math.round(dryingCostNgn),
    commercialGradeTier,
  };
}

/**
 * Evaluates Aflatoxin B1 / Aspergillus flavus mycotoxin growth hazard and safe silo storage window
 * using Modified Henderson Equilibrium Relative Humidity (ERH) and grain temperature.
 */
function evaluateAflatoxinAndStorageSafety(params = {}) {
  const cropKey = String(params.cropKey || 'MAIZE').toUpperCase();
  const spec = CROP_POST_HARVEST_SPECS[cropKey] || CROP_POST_HARVEST_SPECS.MAIZE;

  const grainMoisturePct = clamp(
    Number(params.grainMoisturePct ?? spec.standardMoisturePct),
    6.0,
    35.0
  );
  const grainTemperatureC = clamp(Number(params.grainTemperatureC ?? 28.5), 10.0, 48.0);
  const ambientRelativeHumidityPct = clamp(
    Number(params.ambientRelativeHumidityPct ?? 68.0),
    15.0,
    98.0
  );
  const hermeticPictBagging = Boolean(params.hermeticPictBagging);

  // Approximate Equilibrium Relative Humidity (ERH %) inside inter-granular air spaces
  const moistureExcess = grainMoisturePct - spec.safeLongTermMoisturePct;
  const rawErhPct =
    58 +
    moistureExcess * 4.8 +
    (grainTemperatureC - 25) * 0.65 +
    (ambientRelativeHumidityPct - 60) * 0.12;
  const equilibriumRelativeHumidityPct = clamp(rawErhPct, 30, 99);
  const waterActivityAw = roundTo(equilibriumRelativeHumidityPct / 100, 3);

  // Aspergillus flavus grows aggressively when Aw > 0.78 (ERH > 78%) and T in [24, 38] °C
  const tempHazardFactor =
    grainTemperatureC >= 24 && grainTemperatureC <= 39
      ? 1.25
      : grainTemperatureC > 39
      ? 0.95
      : 0.65;

  const awHazardBase =
    waterActivityAw <= 0.68
      ? 8
      : waterActivityAw <= 0.74
      ? 24 + (waterActivityAw - 0.68) * 350
      : 45 + (waterActivityAw - 0.74) * 260;

  const hermeticModifier = hermeticPictBagging ? 0.52 : 1.0;
  const aflatoxinRiskScore = clamp(
    Math.round(
      awHazardBase * tempHazardFactor * spec.aflatoxinSusceptibilityFactor * hermeticModifier
    ),
    2,
    100
  );

  let riskCategory = 'SAFE_LONG_TERM_SILO';
  if (aflatoxinRiskScore >= 75) {
    riskCategory = 'CRITICAL_AFLATOXIN_OUTBREAK_RISK';
  } else if (aflatoxinRiskScore >= 48) {
    riskCategory = 'ELEVATED_MOLD_RESPIRATION_WARNING';
  } else if (aflatoxinRiskScore >= 26) {
    riskCategory = 'MODERATE_AERATION_REQUIRED';
  }

  // Safe storage days before 0.5% dry-matter respiration loss
  const baseSafeDays =
    240 *
    Math.exp(-0.18 * Math.max(0, grainMoisturePct - spec.safeLongTermMoisturePct)) *
    Math.exp(-0.065 * Math.max(0, grainTemperatureC - 20));
  const safeStorageDays = Math.max(
    3,
    Math.round(baseSafeDays * (hermeticPictBagging ? 1.65 : 1.0))
  );

  return {
    cropKey: spec.cropKey,
    grainMoisturePct: roundTo(grainMoisturePct, 2),
    grainTemperatureC: roundTo(grainTemperatureC, 1),
    equilibriumRelativeHumidityPct: roundTo(equilibriumRelativeHumidityPct, 1),
    waterActivityAw,
    aflatoxinRiskScore,
    riskCategory,
    safeStorageDays,
    hermeticPictBagging,
  };
}

/**
 * Generates an optimal combine harvesting & 30-ton truck fleet evacuation schedule.
 */
function planCombineAndFleetEvacuation(params = {}) {
  const cropKey = String(params.cropKey || 'MAIZE').toUpperCase();
  const spec = CROP_POST_HARVEST_SPECS[cropKey] || CROP_POST_HARVEST_SPECS.MAIZE;

  const areaHectares = Math.max(0.5, Number(params.areaHectares) || 12.0);
  const predictedYieldTonsHa = Math.max(0.4, Number(params.predictedYieldTonsHa) || 4.5);
  const daysDelayedAfterMaturity = clamp(
    Number(params.daysDelayedAfterMaturity ?? 0),
    0,
    25
  );
  const activeCombineCount = Math.max(1, Math.round(Number(params.activeCombineCount) || 1));

  const grossFieldProductionTons = areaHectares * predictedYieldTonsHa;

  // Combine work rate (ha/hr) = (Swath_m * Speed_kmh * Efficiency) / 10
  const singleCombineHaPerHour =
    (spec.combineSwathWidthM *
      spec.optimalCombineSpeedKmH *
      spec.combineFieldEfficiency) /
    10;
  const totalCombineHaPerDay = singleCombineHaPerHour * 8.5 * activeCombineCount;
  const combineHarvestDaysRequired = Math.max(
    0.5,
    roundTo(areaHectares / totalCombineHaPerDay, 2)
  );

  // Shattering + threshing losses
  const totalFieldLossPct = clamp(
    spec.baseThreshingLossPct +
      daysDelayedAfterMaturity * spec.shatteringRatePctPerDayLate,
    1.0,
    28.0
  );
  const fieldLossTons = grossFieldProductionTons * (totalFieldLossPct / 100);
  const recoverableHarvestTons = Math.max(0, grossFieldProductionTons - fieldLossTons);

  // Volumetric & packaging logistics
  const bulkVolumeCubicMeters =
    (recoverableHarvestTons * 1000) / spec.bulkDensityKgM3;
  const standardBagsRequired = Math.ceil(
    (recoverableHarvestTons * 1000) / spec.standardBagWeightKg
  );
  const thirtyTonTrailersRequired = Math.max(
    1,
    Math.ceil(recoverableHarvestTons / 28.5)
  );
  const tenTonCanterTrucksRequired = Math.max(
    1,
    Math.ceil(recoverableHarvestTons / 9.5)
  );

  return {
    cropKey: spec.cropKey,
    areaHectares: roundTo(areaHectares, 2),
    predictedYieldTonsHa: roundTo(predictedYieldTonsHa, 2),
    grossFieldProductionTons: roundTo(grossFieldProductionTons, 2),
    totalFieldLossPct: roundTo(totalFieldLossPct, 2),
    fieldLossTons: roundTo(fieldLossTons, 2),
    recoverableHarvestTons: roundTo(recoverableHarvestTons, 2),
    singleCombineHaPerHour: roundTo(singleCombineHaPerHour, 2),
    combineHarvestDaysRequired,
    bulkVolumeCubicMeters: roundTo(bulkVolumeCubicMeters, 1),
    standardBagsRequired,
    thirtyTonTrailersRequired,
    tenTonCanterTrucksRequired,
  };
}

module.exports = {
  CROP_POST_HARVEST_SPECS,
  computePostHarvestShrinkageBalance,
  evaluateAflatoxinAndStorageSafety,
  planCombineAndFleetEvacuation,
};
