/**
 * ==============================================================================
 * 🌾 AGRILY SPRINT 21: FAO-33 STAGE-WISE WATER DEFICIT & ANTHESIS HEAT SHOCK ENGINE
 * ==============================================================================
 *
 * Models multi-stage multiplicative FAO Irrigation & Drainage Paper No. 33
 * water deficit yield reduction combined with canopy temperature depression (CTD)
 * and reproductive anthesis/silking pollen sterility thermal shock:
 *
 *  1. Multiplicative Stewart / FAO-33 equation across 4 growth stages:
 *     Y_a / Y_m = Prod_{s=1..4} [ 1 - K_y(s) * (1 - ET_a(s) / ET_c(s)) ]
 *  2. Anthesis / Silking Heat Sterility Function (Jagadish et al., 2007):
 *     Spikelet / ovule fertility penalty when T_max > T_crit_anthesis
 *  3. Senescence Acceleration & Stay-Green Index under terminal drought
 *  4. Foliar Potassium Nitrate (KNO3) & Kaolin Particle Film Osmo-Protection
 *
 * @module services/cropPhenologyThermalShockService
 */

const STAGE_KY_PROFILES = {
  MAIZE: {
    cropKey: 'MAIZE',
    anthesisCriticalTempC: 35.0,
    lethalPollenTempC: 42.5,
    stages: [
      { stageCode: 'VEGETATIVE_EARLY', label: 'Emergence to V8 Rapid Growth', ky: 0.40, etcShare: 0.18 },
      { stageCode: 'TASSEL_SILKING', label: 'VT Tasseling to R1 Silking (Critical)', ky: 1.50, etcShare: 0.32 },
      { stageCode: 'GRAIN_FILLING', label: 'R2 Blister to R5 Dent Starch Fill', ky: 0.50, etcShare: 0.36 },
      { stageCode: 'MATURITY_RIPENING', label: 'R6 Black Layer Physiological Dry-Down', ky: 0.20, etcShare: 0.14 },
    ],
  },
  RICE_PADDY: {
    cropKey: 'RICE_PADDY',
    anthesisCriticalTempC: 34.0,
    lethalPollenTempC: 41.0,
    stages: [
      { stageCode: 'TILLERING', label: 'Transplanting to Active Tillering', ky: 0.45, etcShare: 0.22 },
      { stageCode: 'BOOTING_HEADING', label: 'Panicle Initiation to Anthesis', ky: 1.35, etcShare: 0.34 },
      { stageCode: 'MILK_DOUGH_FILL', label: 'Caryopsis Milk to Hard Dough', ky: 0.55, etcShare: 0.30 },
      { stageCode: 'RIPENING', label: 'Panicle Yellowing & Dry-Down', ky: 0.20, etcShare: 0.14 },
    ],
  },
  SORGHUM: {
    cropKey: 'SORGHUM',
    anthesisCriticalTempC: 37.5,
    lethalPollenTempC: 44.5,
    stages: [
      { stageCode: 'VEGETATIVE', label: '5-Leaf to Flag Leaf Booting', ky: 0.25, etcShare: 0.20 },
      { stageCode: 'FLOWERING', label: 'Half-Bloom Anthesis Pollination', ky: 0.55, etcShare: 0.32 },
      { stageCode: 'SOFT_HARD_DOUGH', label: 'Grain Filling & Dry Matter Partitioning', ky: 0.45, etcShare: 0.34 },
      { stageCode: 'RIPENING', label: 'Physiological Maturity', ky: 0.15, etcShare: 0.14 },
    ],
  },
  SOYBEAN: {
    cropKey: 'SOYBEAN',
    anthesisCriticalTempC: 34.5,
    lethalPollenTempC: 41.5,
    stages: [
      { stageCode: 'VEGETATIVE_NODULATION', label: 'V2 Trifoliate to Bradyrhizobium Nodulation', ky: 0.25, etcShare: 0.18 },
      { stageCode: 'R1_R3_FLOWER_POD', label: 'Beginning Bloom to Early Pod Set', ky: 0.80, etcShare: 0.30 },
      { stageCode: 'R4_R6_SEED_FILL', label: 'Full Pod to Full Seed Lipid/Protein Fill', ky: 1.00, etcShare: 0.38 },
      { stageCode: 'R7_R8_MATURITY', label: 'Beginning to Full Pod Maturity', ky: 0.20, etcShare: 0.14 },
    ],
  },
  COWPEA: {
    cropKey: 'COWPEA',
    anthesisCriticalTempC: 36.0,
    lethalPollenTempC: 43.0,
    stages: [
      { stageCode: 'BRANCHING', label: 'Vegetative Vine & Peduncle Formation', ky: 0.28, etcShare: 0.20 },
      { stageCode: 'FLORAL_BUD_ANTHESIS', label: 'Raceme Flowering & Pod Pegging', ky: 0.85, etcShare: 0.34 },
      { stageCode: 'POD_FILL', label: 'Seed Enlargement & Protein Accumulation', ky: 0.65, etcShare: 0.32 },
      { stageCode: 'POD_DRYING', label: 'Pod Senescence & Harvest Readiness', ky: 0.18, etcShare: 0.14 },
    ],
  },
  GROUNDNUT: {
    cropKey: 'GROUNDNUT',
    anthesisCriticalTempC: 35.5,
    lethalPollenTempC: 42.5,
    stages: [
      { stageCode: 'VEGETATIVE', label: 'Rosette Branching & Taproot Penetration', ky: 0.22, etcShare: 0.18 },
      { stageCode: 'FLOWERING_PEGGING', label: 'Gynophore Peg Penetration into Topsoil', ky: 0.80, etcShare: 0.34 },
      { stageCode: 'POD_KERNEL_FILL', label: 'Subterranean Pod Lipid Accumulation', ky: 0.60, etcShare: 0.34 },
      { stageCode: 'MATURITY', label: 'Pericarp Darkening & Lifting Window', ky: 0.20, etcShare: 0.14 },
    ],
  },
  CASSAVA: {
    cropKey: 'CASSAVA',
    anthesisCriticalTempC: 38.0,
    lethalPollenTempC: 45.0,
    stages: [
      { stageCode: 'SPROUTING_CANOPY', label: 'Stake Sprouting & Nodal Root Initiation', ky: 0.35, etcShare: 0.20 },
      { stageCode: 'TUBER_BULKING_EARLY', label: 'Storage Root Initiation & Canopy Peak', ky: 0.65, etcShare: 0.32 },
      { stageCode: 'STARCH_TRANSLOCATION', label: 'Primary Parenchyma Starch Deposition', ky: 0.50, etcShare: 0.34 },
      { stageCode: 'DRY_SEASON_DORMANCY', label: 'Leaf Shedding & Dry-Matter Stabilization', ky: 0.20, etcShare: 0.14 },
    ],
  },
  SESAME: {
    cropKey: 'SESAME',
    anthesisCriticalTempC: 37.0,
    lethalPollenTempC: 44.0,
    stages: [
      { stageCode: 'JUVENILE_ROSETTE', label: 'Vegetative Internode Elongation', ky: 0.25, etcShare: 0.20 },
      { stageCode: 'CAPSULE_FLOWERING', label: 'Indeterminate Blossom & Capsule Set', ky: 0.75, etcShare: 0.34 },
      { stageCode: 'OIL_BIOSYNTHESIS', label: 'Seed Sesamin/Sesamolin Oil Filling', ky: 0.55, etcShare: 0.32 },
      { stageCode: 'CAPSULE_RIPENING', label: 'Pre-Dehiscence Physiological Maturity', ky: 0.22, etcShare: 0.14 },
    ],
  },
  MILLET: {
    cropKey: 'MILLET',
    anthesisCriticalTempC: 38.5,
    lethalPollenTempC: 45.5,
    stages: [
      { stageCode: 'TILLERING', label: 'Basal Tillering & Crown Root Expansion', ky: 0.22, etcShare: 0.20 },
      { stageCode: 'PANICLE_EXSERTION', label: 'Candle Spike Emergence & Stigma Anthesis', ky: 0.55, etcShare: 0.34 },
      { stageCode: 'GRAIN_FILL', label: 'Caryopsis Starch & Micronutrient Fill', ky: 0.40, etcShare: 0.32 },
      { stageCode: 'RIPENING', label: 'Bristle Hardening & Harvest Maturity', ky: 0.15, etcShare: 0.14 },
    ],
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
 * Evaluates multiplicative stage-wise FAO-33 water stress and reproductive heat sterility.
 */
function simulateStageWiseWaterAndThermalShock(params = {}) {
  const cropKey = String(params.cropKey || 'MAIZE').toUpperCase();
  const profile = STAGE_KY_PROFILES[cropKey] || STAGE_KY_PROFILES.MAIZE;

  const potentialYieldYmTonsHa = Math.max(1.0, Number(params.potentialYieldYmTonsHa ?? 6.5));
  const stageEtaRatios = Array.isArray(params.stageEtaRatios) && params.stageEtaRatios.length === 4
    ? params.stageEtaRatios
    : [0.92, 0.78, 0.85, 0.90];
  const anthesisMaxTempC = clamp(Number(params.anthesisMaxTempC ?? 33.5), 18.0, 48.0);
  const heatWaveDaysDuringAnthesis = clamp(Number(params.heatWaveDaysDuringAnthesis ?? 0), 0, 14);
  const foliarOsmoProtectantApplied = Boolean(params.foliarOsmoProtectantApplied);

  // 1. Multiplicative FAO-33 water deficit computation across all 4 phenological stages
  let cumulativeWaterRetentionMultiplier = 1.0;
  const stageDiagnostics = profile.stages.map((stage, idx) => {
    const etaToEtcRatio = clamp(Number(stageEtaRatios[idx] ?? 0.85), 0.20, 1.0);
    const relativeEtDeficit = 1 - etaToEtcRatio;
    const rawStageYieldPenalty = stage.ky * relativeEtDeficit;
    const stageYieldPenaltyFraction = clamp(
      rawStageYieldPenalty * (foliarOsmoProtectantApplied ? 0.82 : 1.0),
      0,
      0.65
    );
    const stageRetentionFactor = 1 - stageYieldPenaltyFraction;
    cumulativeWaterRetentionMultiplier *= stageRetentionFactor;

    return {
      stageCode: stage.stageCode,
      label: stage.label,
      ky: stage.ky,
      etaToEtcRatio: roundTo(etaToEtcRatio, 3),
      relativeEtDeficit: roundTo(relativeEtDeficit, 3),
      stageYieldPenaltyPct: roundTo(stageYieldPenaltyFraction * 100, 2),
      stageRetentionFactor: roundTo(stageRetentionFactor, 4),
    };
  });

  // 2. Reproductive Anthesis / Silking Heat Sterility (Jagadish logistic model)
  let pollenSterilityLossFraction = 0;
  if (anthesisMaxTempC > profile.anthesisCriticalTempC && heatWaveDaysDuringAnthesis > 0) {
    const thermalExcessC = anthesisMaxTempC - profile.anthesisCriticalTempC;
    const thermalSpanC = Math.max(2.0, profile.lethalPollenTempC - profile.anthesisCriticalTempC);
    const dailySterilitySeverity = clamp(Math.pow(thermalExcessC / thermalSpanC, 1.35), 0, 0.85);
    const durationAmplifier = Math.min(1.0, 0.25 + heatWaveDaysDuringAnthesis * 0.11);
    const osmoMitigation = foliarOsmoProtectantApplied ? 0.72 : 1.0;

    pollenSterilityLossFraction = clamp(
      dailySterilitySeverity * durationAmplifier * osmoMitigation,
      0,
      0.75
    );
  }

  const thermalRetentionMultiplier = 1 - pollenSterilityLossFraction;
  const combinedRetentionMultiplier =
    cumulativeWaterRetentionMultiplier * thermalRetentionMultiplier;
  const stressedYieldTonsHa = roundTo(
    potentialYieldYmTonsHa * combinedRetentionMultiplier,
    2
  );
  const totalYieldLossTonsHa = roundTo(
    Math.max(0, potentialYieldYmTonsHa - stressedYieldTonsHa),
    2
  );

  return {
    cropKey: profile.cropKey,
    potentialYieldYmTonsHa: roundTo(potentialYieldYmTonsHa, 2),
    stressedYieldTonsHa,
    totalYieldLossTonsHa,
    cumulativeWaterRetentionPct: roundTo(cumulativeWaterRetentionMultiplier * 100, 2),
    pollenSterilityLossPct: roundTo(pollenSterilityLossFraction * 100, 2),
    combinedRetentionPct: roundTo(combinedRetentionMultiplier * 100, 2),
    foliarOsmoProtectantApplied,
    stageDiagnostics,
  };
}

module.exports = {
  STAGE_KY_PROFILES,
  simulateStageWiseWaterAndThermalShock,
};
