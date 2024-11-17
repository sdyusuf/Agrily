/**
 * ==============================================================================
 * 🏛️ AGRILY SPRINT 22: NATIONAL 37-STATE PEST EPIDEMIC & BIO-FACTORY ENGINE
 * ==============================================================================
 *
 * Computes state-by-state entomological outbreak pressure, agricultural revenue
 * Value-at-Risk (VaR), and national biological control insectary allocation
 * (Trichogramma / Telenomus parasitoid cards, pheromone septa lures, and Bt/Metarhizium
 * biopesticide drum stockpiles) across all 36 Nigerian states + FCT Abuja.
 *
 * @module services/nationalPestEpidemicSurveillanceEngine
 */

const {
  NATIONAL_STATE_AGRO_REGISTRY,
} = require('./nationalAgroZoneYieldBenchmarkEngine');
const {
  PEST_ENTOMOLOGY_CATALOG,
  evaluatePestDegreeDayPhenology,
  calculatePedigoEconomicInjuryLevel,
} = require('./pestPhenologyAndEilEngine');

const ZONE_PEST_AFFINITY_MULTIPLIERS = {
  SAHEL_SAVANNA: {
    FALL_ARMYWORM: 0.92,
    TUTA_ABSOLUTA: 1.18,
    QUELEA_BIRDS: 1.42,
    DESERT_LOCUST: 1.55,
    BEMISIA_WHITEFLY: 0.85,
    COWPEA_POD_BORER: 1.25,
    STEM_BORER: 0.95,
    RICE_GALL_MIDGE: 0.78,
    COCOA_MIRID_BUG: 0.15,
    SORGHUM_MIDGE: 1.32,
  },
  SUDAN_SAVANNA: {
    FALL_ARMYWORM: 1.15,
    TUTA_ABSOLUTA: 1.35,
    QUELEA_BIRDS: 1.38,
    DESERT_LOCUST: 1.28,
    BEMISIA_WHITEFLY: 0.98,
    COWPEA_POD_BORER: 1.32,
    STEM_BORER: 1.12,
    RICE_GALL_MIDGE: 1.18,
    COCOA_MIRID_BUG: 0.18,
    SORGHUM_MIDGE: 1.28,
  },
  NORTHERN_GUINEA_SAVANNA: {
    FALL_ARMYWORM: 1.38,
    TUTA_ABSOLUTA: 1.24,
    QUELEA_BIRDS: 1.05,
    DESERT_LOCUST: 0.85,
    BEMISIA_WHITEFLY: 1.12,
    COWPEA_POD_BORER: 1.22,
    STEM_BORER: 1.28,
    RICE_GALL_MIDGE: 1.15,
    COCOA_MIRID_BUG: 0.25,
    SORGHUM_MIDGE: 1.18,
  },
  SOUTHERN_GUINEA_SAVANNA: {
    FALL_ARMYWORM: 1.28,
    TUTA_ABSOLUTA: 1.05,
    QUELEA_BIRDS: 0.82,
    DESERT_LOCUST: 0.55,
    BEMISIA_WHITEFLY: 1.32,
    COWPEA_POD_BORER: 1.15,
    STEM_BORER: 1.22,
    RICE_GALL_MIDGE: 1.34,
    COCOA_MIRID_BUG: 0.65,
    SORGHUM_MIDGE: 0.95,
  },
  DERIVED_SAVANNA: {
    FALL_ARMYWORM: 1.25,
    TUTA_ABSOLUTA: 0.95,
    QUELEA_BIRDS: 0.55,
    DESERT_LOCUST: 0.35,
    BEMISIA_WHITEFLY: 1.36,
    COWPEA_POD_BORER: 1.08,
    STEM_BORER: 1.25,
    RICE_GALL_MIDGE: 1.20,
    COCOA_MIRID_BUG: 1.28,
    SORGHUM_MIDGE: 0.68,
  },
  HUMID_FOREST: {
    FALL_ARMYWORM: 1.12,
    TUTA_ABSOLUTA: 0.82,
    QUELEA_BIRDS: 0.38,
    DESERT_LOCUST: 0.20,
    BEMISIA_WHITEFLY: 1.28,
    COWPEA_POD_BORER: 0.88,
    STEM_BORER: 1.15,
    RICE_GALL_MIDGE: 1.18,
    COCOA_MIRID_BUG: 1.48,
    SORGHUM_MIDGE: 0.42,
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
 * Evaluates state-level pest outbreak pressure, degree-day generation velocity,
 * Pedigo EIL exceedance, and bio-factory parasitoid & pheromone trap requirements.
 */
function evaluateStatePestEpidemicRisk(params = {}) {
  const stateCode = String(params.stateCode || 'KD').toUpperCase();
  const pestKey = String(params.pestKey || 'FALL_ARMYWORM').toUpperCase();
  const microclimateRegime = String(params.microclimateRegime || 'STANDARD_SEASONAL').toUpperCase();
  const monitoredHectares = Math.max(10, Number(params.monitoredHectares ?? 1200));

  const stateEntry =
    NATIONAL_STATE_AGRO_REGISTRY.find((s) => s.stateCode === stateCode) ||
    NATIONAL_STATE_AGRO_REGISTRY[0];
  const pestSpec =
    PEST_ENTOMOLOGY_CATALOG[pestKey] || PEST_ENTOMOLOGY_CATALOG.FALL_ARMYWORM;
  const zoneAffinities =
    ZONE_PEST_AFFINITY_MULTIPLIERS[stateEntry.agroZone] ||
    ZONE_PEST_AFFINITY_MULTIPLIERS.NORTHERN_GUINEA_SAVANNA;

  const affinityMultiplier = zoneAffinities[pestSpec.pestKey] ?? 1.0;

  // Regime modifiers: DRY_SPELL_SURGE vs STANDARD_SEASONAL vs BIOCONTROL_SUPPRESSED
  const regimeIncidenceMultiplier =
    microclimateRegime === 'DRY_SPELL_SURGE'
      ? 1.42
      : microclimateRegime === 'BIOCONTROL_SUPPRESSED'
      ? 0.46
      : 1.0;

  const dailyMaxTempC =
    microclimateRegime === 'DRY_SPELL_SURGE'
      ? 34.8
      : microclimateRegime === 'BIOCONTROL_SUPPRESSED'
      ? 29.5
      : 32.0;

  const estimatedIncidencePct = clamp(
    roundTo(24.0 * affinityMultiplier * regimeIncidenceMultiplier, 1),
    2.0,
    92.0
  );
  const davisDamageScale = clamp(
    Math.round(1 + (estimatedIncidencePct / 100) * 8),
    1,
    9
  );

  const phenology = evaluatePestDegreeDayPhenology({
    pestKey: pestSpec.pestKey,
    dailyMinTempC: 21.0,
    dailyMaxTempC,
    daysSinceBiofix: 8,
  });

  const eilAnalysis = calculatePedigoEconomicInjuryLevel({
    pestKey: pestSpec.pestKey,
    observedIncidencePct: estimatedIncidencePct,
    davisDamageScale,
    expectedYieldTonsHa: 4.5,
    cropPriceNgnPerTon: 685000,
  });

  // Regional bio-factory logistics requirements for monitoredHectares
  const parasitoidReleaseCardsRequired = eilAnalysis.exceedsEconomicThreshold
    ? Math.ceil(monitoredHectares * 60) // 60 trichogramma/telenomus release cards per ha
    : 0;
  const pheromoneLureSeptaRequired = Math.ceil(monitoredHectares / 2.5); // 1 trap per 2.5 ha
  const biopesticideLitersRequired = eilAnalysis.exceedsEconomicThreshold
    ? Math.ceil(monitoredHectares * 1.5)
    : 0;
  const regionalCropValueAtRiskNgn = Math.round(
    eilAnalysis.untreatedRevenueLossNgnHa * monitoredHectares
  );

  return {
    stateCode: stateEntry.stateCode,
    stateName: stateEntry.stateName,
    agroZone: stateEntry.agroZone,
    pestKey: pestSpec.pestKey,
    microclimateRegime,
    monitoredHectares,
    affinityMultiplier,
    estimatedIncidencePct,
    davisDamageScale,
    economicThresholdPct: eilAnalysis.economicThresholdPct,
    economicInjuryLevelPct: eilAnalysis.economicInjuryLevelPct,
    exceedsEconomicThreshold: eilAnalysis.exceedsEconomicThreshold,
    exceedsEconomicInjuryLevel: eilAnalysis.exceedsEconomicInjuryLevel,
    dailyGdd: phenology.dailyGdd,
    activeStageCode: phenology.activeStageCode,
    parasitoidReleaseCardsRequired,
    pheromoneLureSeptaRequired,
    biopesticideLitersRequired,
    regionalCropValueAtRiskNgn,
  };
}

module.exports = {
  ZONE_PEST_AFFINITY_MULTIPLIERS,
  evaluateStatePestEpidemicRisk,
};

