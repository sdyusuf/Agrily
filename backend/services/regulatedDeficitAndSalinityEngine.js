/**
 * ==============================================================================
 * 🧂 AGRILY SPRINT 23: REGULATED DEFICIT IRRIGATION (RDI), SALINITY LEACHING
 *    (RHOADES FAO-29 / MAAS-HOFFMAN) & IRRI SAFE-AWD RICE METHANE ENGINE
 * ==============================================================================
 *
 * Implements:
 *  1. Rhoades (FAO-29) & Maas-Hoffman Root-Zone Salinity & Sodicity Engine:
 *       - Sodium Adsorption Ratio: SAR = Na / sqrt((Ca + Mg) / 2)  (meq/L)
 *       - Exchangeable Sodium Percentage: ESP = (100 * (-0.0126 + 0.01475 * SAR)) / (1 + (-0.0126 + 0.01475 * SAR))
 *       - Maas-Hoffman Relative Yield: Yr (%) = 100 - b * max(0, ECe - a)
 *       - Drip vs. Surface Leaching Requirement: LR_surface = ECw / (5 * ECe_target - ECw)
 *       - Agricultural Gypsum (CaSO4·2H2O) requirement for sodic soil reclamation.
 *  2. IRRI Alternate Wetting and Drying (Safe-AWD) Field Water Tube Engine:
 *       - Monitors perched water table depth (-15 cm trigger in vegetative/grain fill,
 *         +5 cm continuous ponding lock during sensitive flowering/anthesis).
 *       - Computes IPCC Tier-2 scaling factor (SF_w = 0.52 for multiple aeration)
 *         and methane (CH4 & tCO2e/ha) emission abatement + water savings.
 *  3. Stewart-Doorenbos (FAO-33) Multiplicative Stage-Specific RDI Optimizer:
 *       - Ya / Ym = Product_{s=1..4} [ 1 - Ky_s * (1 - ETa_s / ETm_s) ]
 *       - Identifies optimal vegetative/ripening deficit allocation that protects
 *         flowering (Ky_flower) while maximizing Crop Water Productivity (kg/m³).
 *
 * @module services/regulatedDeficitAndSalinityEngine
 */

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

function roundTo(val, digits = 2) {
  const factor = Math.pow(10, digits);
  return Math.round((Number(val) || 0) * factor) / factor;
}

/**
 * Maas-Hoffman Crop Salt Tolerance Catalog (Threshold ECe_a in dS/m, Slope b in % per dS/m)
 */
const MAAS_HOFFMAN_SALINITY_CATALOG = {
  TOMATO_IRRIGATED: {
    cropKey: 'TOMATO_IRRIGATED',
    cropName: 'Irrigated Roma Tomato',
    thresholdEceDsm: 2.5,
    slopePctPerDsm: 9.9,
    toleranceClass: 'MODERATELY_SENSITIVE',
    potentialYieldTonnesHa: 38.0,
    stageKyFactors: {
      INITIAL: 0.4,
      VEGETATIVE: 0.4,
      FLOWERING_FRUIT_SET: 1.1,
      RIPENING: 0.4,
    },
  },
  WHEAT_IRRIGATED: {
    cropKey: 'WHEAT_IRRIGATED',
    cropName: 'Irrigated Durum / Bread Wheat',
    thresholdEceDsm: 6.0,
    slopePctPerDsm: 7.1,
    toleranceClass: 'MODERATELY_TOLERANT',
    potentialYieldTonnesHa: 5.8,
    stageKyFactors: {
      INITIAL: 0.2,
      VEGETATIVE: 0.2,
      FLOWERING_ANTESIS: 0.65,
      GRAIN_FILL: 0.55,
    },
  },
  ONION_BULB: {
    cropKey: 'ONION_BULB',
    cropName: 'Irrigated Red Creole Bulb Onion',
    thresholdEceDsm: 1.2,
    slopePctPerDsm: 16.0,
    toleranceClass: 'SENSITIVE',
    potentialYieldTonnesHa: 28.5,
    stageKyFactors: {
      INITIAL: 0.45,
      VEGETATIVE: 0.45,
      BULB_FORMATION: 0.85,
      MATURATION: 0.3,
    },
  },
  RICE_IRRIGATED_AWD: {
    cropKey: 'RICE_IRRIGATED_AWD',
    cropName: 'Irrigated Lowland Rice (FARO-44)',
    thresholdEceDsm: 3.0,
    slopePctPerDsm: 12.0,
    toleranceClass: 'SENSITIVE',
    potentialYieldTonnesHa: 6.8,
    stageKyFactors: {
      INITIAL: 1.0,
      VEGETATIVE_TILLERING: 1.1,
      FLOWERING_HEADING: 2.2,
      GRAIN_RIPENING: 0.9,
    },
  },
  MAIZE_IRRIGATED: {
    cropKey: 'MAIZE_IRRIGATED',
    cropName: 'Dry-Season Irrigated Hybrid Maize',
    thresholdEceDsm: 1.7,
    slopePctPerDsm: 12.0,
    toleranceClass: 'MODERATELY_SENSITIVE',
    potentialYieldTonnesHa: 7.4,
    stageKyFactors: {
      INITIAL: 0.4,
      VEGETATIVE: 0.4,
      TASSELING_SILKING: 1.5,
      GRAIN_FILL: 0.5,
    },
  },
  SUGARCANE_ESTATE: {
    cropKey: 'SUGARCANE_ESTATE',
    cropName: 'Estate Furrow/Pivot Sugarcane',
    thresholdEceDsm: 1.7,
    slopePctPerDsm: 5.9,
    toleranceClass: 'MODERATELY_SENSITIVE',
    potentialYieldTonnesHa: 85.0,
    stageKyFactors: {
      INITIAL: 0.5,
      TILLERING: 0.75,
      GRAND_GROWTH: 1.2,
      RIPENING_DRY_OFF: 0.1,
    },
  },
};

/**
 * Evaluates Rhoades (FAO-29) irrigation water salinity, Maas-Hoffman yield response,
 * Sodium Adsorption Ratio (SAR), and agricultural gypsum requirement.
 */
function evaluateSalinitySodicityAndLeaching(params = {}) {
  const cropKey = String(params.cropKey || 'TOMATO_IRRIGATED').toUpperCase();
  const cropSpec =
    MAAS_HOFFMAN_SALINITY_CATALOG[cropKey] ||
    MAAS_HOFFMAN_SALINITY_CATALOG.TOMATO_IRRIGATED;

  const irrigationWaterEcDsm = clamp(
    Number(params.irrigationWaterEcDsm ?? 1.45),
    0.1,
    12.0
  );
  const soilSaturationExtractEceDsm = clamp(
    Number(
      params.soilSaturationExtractEceDsm ?? irrigationWaterEcDsm * 1.5
    ),
    0.2,
    24.0
  );
  const isHighFrequencyDrip = Boolean(params.isHighFrequencyDrip ?? true);

  // Ionic concentrations in irrigation water (meq/L)
  const sodiumMeqL = clamp(Number(params.sodiumMeqL ?? 8.4), 0.1, 80.0);
  const calciumMeqL = clamp(Number(params.calciumMeqL ?? 3.2), 0.2, 40.0);
  const magnesiumMeqL = clamp(Number(params.magnesiumMeqL ?? 1.8), 0.1, 30.0);
  const cecCmolKg = clamp(Number(params.cecCmolKg ?? 14.0), 3.0, 45.0);

  // 1. Sodium Adsorption Ratio (SAR) & Exchangeable Sodium Percentage (ESP)
  const sarValue =
    sodiumMeqL / Math.sqrt((calciumMeqL + magnesiumMeqL) / 2);
  const gaponTerm = -0.0126 + 0.01475 * sarValue;
  const espPercent = clamp(
    (100 * Math.max(0.005, gaponTerm)) / (1 + Math.max(0.005, gaponTerm)),
    0.5,
    65.0
  );

  // 2. Maas-Hoffman Relative Yield (%)
  const excessSalinityDsm = Math.max(
    0,
    soilSaturationExtractEceDsm - cropSpec.thresholdEceDsm
  );
  const relativeYieldPct = clamp(
    100 - cropSpec.slopePctPerDsm * excessSalinityDsm,
    0,
    100
  );
  const salinityYieldLossPct = roundTo(100 - relativeYieldPct, 2);

  // 3. Rhoades FAO-29 Leaching Requirement (LR)
  // Surface/Sprinkler: LR = ECw / (5 * ECe_threshold - ECw)
  // High-Frequency Drip: LR = ECw / (2 * max_ECe) where max_ECe = ECe_threshold + (100 / b)
  const maxZeroYieldEceDsm =
    cropSpec.thresholdEceDsm + 100 / cropSpec.slopePctPerDsm;
  const rawLr = isHighFrequencyDrip
    ? irrigationWaterEcDsm / Math.max(1.0, 2 * maxZeroYieldEceDsm)
    : irrigationWaterEcDsm /
      Math.max(0.8, 5 * cropSpec.thresholdEceDsm - irrigationWaterEcDsm);
  const leachingRequirementFraction = clamp(rawLr, 0.02, 0.45);

  const netCropWaterNeedMm = clamp(
    Number(params.netCropWaterNeedMm ?? 48.0),
    5.0,
    250.0
  );
  const totalGrossDepthWithLeachingMm =
    netCropWaterNeedMm / (1 - leachingRequirementFraction);
  const dedicatedLeachingDepthMm =
    totalGrossDepthWithLeachingMm - netCropWaterNeedMm;

  // 4. Sodic soil infiltration hazard & Gypsum (CaSO4.2H2O) amendment (tonnes/ha)
  // Target reducing ESP down to 5% in top 15 cm soil (1 cmol Na/kg ≈ 1.72 t/ha pure gypsum for 15cm depth)
  const targetEspPct = 5.0;
  const exchangeableNaToReplaceCmolKg =
    espPercent > 8.0
      ? ((espPercent - targetEspPct) / 100) * cecCmolKg
      : 0;
  const gypsumRequirementTonnesHa = roundTo(
    exchangeableNaToReplaceCmolKg * 1.72 * 1.18, // 85% purity agricultural gypsum
    2
  );

  let sodicityHazardBand = 'LOW_SODICITY_OPTIMAL_INFILTRATION';
  if (sarValue >= 12 || espPercent >= 15) {
    sodicityHazardBand = 'SEVERE_SODIC_DISPERSION_GYPSUM_MANDATORY';
  } else if (sarValue >= 6 || espPercent >= 8) {
    sodicityHazardBand = 'MODERATE_SODIC_CRUSTING_RISK';
  }

  return {
    cropKey: cropSpec.cropKey,
    cropName: cropSpec.cropName,
    toleranceClass: cropSpec.toleranceClass,
    thresholdEceDsm: cropSpec.thresholdEceDsm,
    slopePctPerDsm: cropSpec.slopePctPerDsm,
    irrigationWaterEcDsm: roundTo(irrigationWaterEcDsm, 2),
    soilSaturationExtractEceDsm: roundTo(soilSaturationExtractEceDsm, 2),
    sarValue: roundTo(sarValue, 2),
    espPercent: roundTo(espPercent, 2),
    sodicityHazardBand,
    relativeYieldPct: roundTo(relativeYieldPct, 1),
    salinityYieldLossPct,
    leachingRequirementFraction: roundTo(leachingRequirementFraction, 3),
    dedicatedLeachingDepthMm: roundTo(dedicatedLeachingDepthMm, 2),
    totalGrossDepthWithLeachingMm: roundTo(totalGrossDepthWithLeachingMm, 2),
    gypsumRequirementTonnesHa,
  };
}

/**
 * Simulates IRRI Safe-AWD (Alternate Wetting & Drying) Perforated Field Water Tube
 * scheduling and IPCC Tier-2 methane (CH4) emission reductions for lowland rice.
 */
function evaluateIrriSafeAwdRiceSchedule(params = {}) {
  const fieldWaterTubeDepthCm = clamp(
    Number(params.fieldWaterTubeDepthCm ?? -14.0), // negative = below soil surface, positive = ponded
    -35.0,
    15.0
  );
  const phenologyStage = String(
    params.phenologyStage || 'VEGETATIVE_TILLERING'
  ).toUpperCase();
  const fieldAreaHectares = clamp(
    Number(params.fieldAreaHectares ?? 12.0),
    0.5,
    50000.0
  );
  const daysCultivationPeriod = clamp(
    Number(params.daysCultivationPeriod ?? 115),
    75,
    160
  );

  const isFloweringSensitiveWindow =
    phenologyStage.includes('FLOWER') ||
    phenologyStage.includes('ANTESIS') ||
    phenologyStage.includes('HEADING');

  // IRRI Safe-AWD threshold:
  // During flowering (7 days before to 7 days after full heading), maintain +5 cm ponded water.
  // Outside flowering, allow perched water table to drop to -15 cm before re-flooding to +5 cm.
  const triggerThresholdCm = isFloweringSensitiveWindow ? 2.0 : -15.0;
  const targetRefloodPondingCm = 5.0;

  const awdRefloodTriggered = fieldWaterTubeDepthCm <= triggerThresholdCm;
  const effectiveSoilPorosity = 0.42; // saturated puddled clay loam macro-porosity above perched table

  let requiredRefloodDepthMm = 0;
  if (awdRefloodTriggered) {
    const subsurfaceRefillCm = Math.max(0, -fieldWaterTubeDepthCm) * effectiveSoilPorosity;
    const surfacePondingCm = targetRefloodPondingCm - Math.max(0, fieldWaterTubeDepthCm);
    requiredRefloodDepthMm = (subsurfaceRefillCm + surfacePondingCm) * 10;
  }

  // Seasonal water savings vs. Continuous Flooding (CF baseline = 1,350 mm/season)
  const continuousFloodingSeasonalMm = 1350;
  const safeAwdSeasonalMm = Math.round(continuousFloodingSeasonalMm * 0.72); // 28% water savings
  const seasonalWaterSavedM3PerHa = (continuousFloodingSeasonalMm - safeAwdSeasonalMm) * 10;
  const totalBasinWaterSavedM3 = Math.round(
    seasonalWaterSavedM3PerHa * fieldAreaHectares
  );

  // IPCC 2019 Refinement Tier-2 Paddy Methane (CH4) Factor:
  // Baseline EF_c = 1.30 kg CH4 / ha / day under continuous flooding
  // Scaling factor for multiple aeration episodes (SF_w) = 0.52 (48% CH4 reduction)
  const baselineCh4KgPerHa = 1.3 * daysCultivationPeriod;
  const awdCh4KgPerHa = baselineCh4KgPerHa * 0.52;
  const abatedCh4KgPerHa = baselineCh4KgPerHa - awdCh4KgPerHa;
  // GWP100 for CH4 = 28 kg CO2e / kg CH4
  const abatedCo2eTonnesPerHa = (abatedCh4KgPerHa * 28) / 1000;
  const totalAbatedCo2eTonnes = roundTo(
    abatedCo2eTonnesPerHa * fieldAreaHectares,
    2
  );
  const estimatedCarbonCreditValueNgn = Math.round(
    totalAbatedCo2eTonnes * 18500
  );

  return {
    phenologyStage,
    isFloweringSensitiveWindow,
    fieldWaterTubeDepthCm: roundTo(fieldWaterTubeDepthCm, 1),
    triggerThresholdCm,
    awdRefloodTriggered,
    requiredRefloodDepthMm: roundTo(requiredRefloodDepthMm, 1),
    requiredRefloodVolumeM3: Math.round(
      requiredRefloodDepthMm * 10 * fieldAreaHectares
    ),
    seasonalWaterSavedPct: 28.0,
    seasonalWaterSavedM3PerHa,
    totalBasinWaterSavedM3,
    abatedCh4KgPerHa: roundTo(abatedCh4KgPerHa, 2),
    abatedCo2eTonnesPerHa: roundTo(abatedCo2eTonnesPerHa, 2),
    totalAbatedCo2eTonnes,
    estimatedCarbonCreditValueNgn,
    advisoryStatus: isFloweringSensitiveWindow
      ? 'FLOWERING_LOCK_MAINTAIN_5CM_PONDING'
      : awdRefloodTriggered
      ? 'PERCHED_TABLE_AT_15CM_REFLOOD_TO_5CM'
      : 'AERATION_PHASE_ACTIVE_ROOT_OXYGENATION',
  };
}

/**
 * Evaluates Stewart-Doorenbos Multiplicative Regulated Deficit Irrigation (RDI)
 * across 4 crop stages to maximize Crop Water Productivity (CWP, kg/m³).
 */
function optimizeRegulatedDeficitIrrigation(params = {}) {
  const cropKey = String(params.cropKey || 'TOMATO_IRRIGATED').toUpperCase();
  const cropSpec =
    MAAS_HOFFMAN_SALINITY_CATALOG[cropKey] ||
    MAAS_HOFFMAN_SALINITY_CATALOG.TOMATO_IRRIGATED;

  const seasonalMaxEtMm = clamp(
    Number(params.seasonalMaxEtMm ?? 620.0),
    250.0,
    1600.0
  );
  const waterSupplyAllocationPct = clamp(
    Number(params.waterSupplyAllocationPct ?? 82.0),
    45.0,
    100.0
  );

  const stageKeys = Object.keys(cropSpec.stageKyFactors);
  const stageWeights = [0.15, 0.28, 0.35, 0.22];

  // Smart RDI concentrates deficit in low-Ky stages (Initial, Vegetative, Ripening)
  // while protecting the peak flowering/fruit-set stage (Ky >= 0.85).
  const totalAvailableEtMm = seasonalMaxEtMm * (waterSupplyAllocationPct / 100);
  const deficitToAbsorbMm = seasonalMaxEtMm - totalAvailableEtMm;

  // Inverse-Ky weights for absorbing deficit safely
  const inverseKyWeights = stageKeys.map((k) => {
    const ky = cropSpec.stageKyFactors[k];
    return ky >= 1.0 ? 0.08 : 1 / Math.max(0.15, ky);
  });
  const sumInverseKy = inverseKyWeights.reduce((a, b) => a + b, 0);

  let multiplicativeRelativeYieldRatio = 1.0;
  let uniformDeficitRelativeYieldRatio = 1.0;

  const stageAllocations = stageKeys.map((stageName, idx) => {
    const ky = cropSpec.stageKyFactors[stageName];
    const stageMaxEtMm = seasonalMaxEtMm * stageWeights[idx];
    const stageDeficitShareMm = Math.min(
      stageMaxEtMm * 0.55,
      deficitToAbsorbMm * (inverseKyWeights[idx] / sumInverseKy)
    );
    const stageActualEtMm = Math.max(
      stageMaxEtMm * 0.45,
      stageMaxEtMm - stageDeficitShareMm
    );

    const relativeEtRatio = stageActualEtMm / stageMaxEtMm;
    const stageYieldFactor = clamp(1 - ky * (1 - relativeEtRatio), 0.2, 1.0);
    multiplicativeRelativeYieldRatio *= stageYieldFactor;

    // Compare against naive uniform deficit across all stages
    const uniformStageFactor = clamp(
      1 - ky * (1 - waterSupplyAllocationPct / 100),
      0.1,
      1.0
    );
    uniformDeficitRelativeYieldRatio *= uniformStageFactor;

    return {
      stageName,
      kyFactor: ky,
      stageMaxEtMm: roundTo(stageMaxEtMm, 1),
      stageActualEtMm: roundTo(stageActualEtMm, 1),
      stageDeficitPct: roundTo((1 - relativeEtRatio) * 100, 1),
      stageYieldRetentionPct: roundTo(stageYieldFactor * 100, 1),
    };
  });

  const optimizedYieldTonnesHa =
    cropSpec.potentialYieldTonnesHa * multiplicativeRelativeYieldRatio;
  const naiveUniformYieldTonnesHa =
    cropSpec.potentialYieldTonnesHa * uniformDeficitRelativeYieldRatio;

  // Crop Water Productivity (kg grain/fruit per m³ of water consumed)
  const fullIrrigationCwpKgM3 =
    (cropSpec.potentialYieldTonnesHa * 1000) / (seasonalMaxEtMm * 10);
  const optimizedRdiCwpKgM3 =
    (optimizedYieldTonnesHa * 1000) / (totalAvailableEtMm * 10);

  return {
    cropKey: cropSpec.cropKey,
    cropName: cropSpec.cropName,
    waterSupplyAllocationPct: roundTo(waterSupplyAllocationPct, 1),
    seasonalMaxEtMm: roundTo(seasonalMaxEtMm, 1),
    allocatedSeasonalEtMm: roundTo(totalAvailableEtMm, 1),
    optimizedYieldTonnesHa: roundTo(optimizedYieldTonnesHa, 2),
    naiveUniformYieldTonnesHa: roundTo(naiveUniformYieldTonnesHa, 2),
    rdiYieldAdvantagePct: roundTo(
      (multiplicativeRelativeYieldRatio - uniformDeficitRelativeYieldRatio) * 100,
      2
    ),
    fullIrrigationCwpKgM3: roundTo(fullIrrigationCwpKgM3, 2),
    optimizedRdiCwpKgM3: roundTo(optimizedRdiCwpKgM3, 2),
    stageAllocations,
  };
}

module.exports = {
  MAAS_HOFFMAN_SALINITY_CATALOG,
  evaluateSalinitySodicityAndLeaching,
  evaluateIrriSafeAwdRiceSchedule,
  optimizeRegulatedDeficitIrrigation,
};
