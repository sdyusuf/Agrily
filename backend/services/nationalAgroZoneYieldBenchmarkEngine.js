/**
 * ==============================================================================
 * 🌾 AGRILY SPRINT 21: NATIONAL 36-STATE AGRO-ECOLOGICAL YIELD BENCHMARK ENGINE
 * ==============================================================================
 *
 * Regional crop yield gap analysis, state-level historical baseline registry,
 * fertilizer response elasticity, and strategic grain reserve (SGR) allocation
 * across Nigeria's 6 agro-ecological zones and 36 states + FCT.
 *
 * Scientific & Agronomic Foundations:
 *  - Lobell et al. (2009) Exploitable Yield Gap (Yg = Yw - Ya) framework
 *  - IITA / NAERLS Wet-Season Agricultural Performance Survey (APS) benchmarks
 *  - Mitscherlich-Baule diminishing returns curve for N-P2O5-K2O fertilization
 *  - Strategic Grain Reserve (SGR) silo hub routing & regional surplus/deficit balance
 *
 * @module services/nationalAgroZoneYieldBenchmarkEngine
 */

const AGRO_ECOLOGICAL_ZONE_PARAMETERS = {
  SAHEL_SAVANNA: {
    zoneCode: 'SAHEL_SAVANNA',
    zoneName: 'Sahel Savanna (Arid Short-Season Belt)',
    lengthOfGrowingPeriodDays: 85,
    meanAnnualRainfallMm: 460,
    meanSolarRadiationMjM2Day: 22.8,
    referenceEt0MmDay: 6.4,
    soilOrganicCarbonBaselinePct: 0.48,
    waterLimitedPotentialMultiplier: 0.72,
    dominantCrops: ['MILLET', 'SORGHUM', 'COWPEA', 'SESAME', 'GROUNDNUT'],
  },
  SUDAN_SAVANNA: {
    zoneCode: 'SUDAN_SAVANNA',
    zoneName: 'Sudan Savanna (Dryland Cereal & Pulse Belt)',
    lengthOfGrowingPeriodDays: 118,
    meanAnnualRainfallMm: 740,
    meanSolarRadiationMjM2Day: 21.4,
    referenceEt0MmDay: 5.6,
    soilOrganicCarbonBaselinePct: 0.68,
    waterLimitedPotentialMultiplier: 0.86,
    dominantCrops: ['SORGHUM', 'MILLET', 'MAIZE', 'RICE_PADDY', 'COWPEA', 'GROUNDNUT'],
  },
  NORTHERN_GUINEA_SAVANNA: {
    zoneCode: 'NORTHERN_GUINEA_SAVANNA',
    zoneName: 'Northern Guinea Savanna (Primary Maize & Soybean Breadbasket)',
    lengthOfGrowingPeriodDays: 155,
    meanAnnualRainfallMm: 1080,
    meanSolarRadiationMjM2Day: 19.8,
    referenceEt0MmDay: 4.8,
    soilOrganicCarbonBaselinePct: 0.94,
    waterLimitedPotentialMultiplier: 0.98,
    dominantCrops: ['MAIZE', 'SOYBEAN', 'SORGHUM', 'RICE_PADDY', 'GROUNDNUT', 'COWPEA'],
  },
  SOUTHERN_GUINEA_SAVANNA: {
    zoneCode: 'SOUTHERN_GUINEA_SAVANNA',
    zoneName: 'Southern Guinea Savanna (Alluvial Grain, Root & Oilseed Belt)',
    lengthOfGrowingPeriodDays: 190,
    meanAnnualRainfallMm: 1320,
    meanSolarRadiationMjM2Day: 18.2,
    referenceEt0MmDay: 4.3,
    soilOrganicCarbonBaselinePct: 1.22,
    waterLimitedPotentialMultiplier: 0.96,
    dominantCrops: ['RICE_PADDY', 'SOYBEAN', 'MAIZE', 'CASSAVA', 'SESAME'],
  },
  DERIVED_SAVANNA: {
    zoneCode: 'DERIVED_SAVANNA',
    zoneName: 'Derived Savanna Transition (Bimodal Maize & Cassava Belt)',
    lengthOfGrowingPeriodDays: 225,
    meanAnnualRainfallMm: 1540,
    meanSolarRadiationMjM2Day: 16.9,
    referenceEt0MmDay: 3.9,
    soilOrganicCarbonBaselinePct: 1.48,
    waterLimitedPotentialMultiplier: 0.92,
    dominantCrops: ['CASSAVA', 'MAIZE', 'RICE_PADDY', 'SOYBEAN', 'COWPEA'],
  },
  HUMID_FOREST: {
    zoneCode: 'HUMID_FOREST',
    zoneName: 'Humid Rainforest & Mangrove Swamp (High-Rainfall Root Crop Belt)',
    lengthOfGrowingPeriodDays: 280,
    meanAnnualRainfallMm: 2280,
    meanSolarRadiationMjM2Day: 15.1,
    referenceEt0MmDay: 3.5,
    soilOrganicCarbonBaselinePct: 1.85,
    waterLimitedPotentialMultiplier: 0.84,
    dominantCrops: ['CASSAVA', 'RICE_PADDY', 'MAIZE'],
  },
};

const NATIONAL_STATE_AGRO_REGISTRY = [
  { stateCode: 'KD', stateName: 'Kaduna', agroZone: 'NORTHERN_GUINEA_SAVANNA', sgrSiloHub: 'Zaria Silo Complex (25,000 MT)', irrigationSharePct: 24, smallholderYieldFactor: 1.16 },
  { stateCode: 'KN', stateName: 'Kano', agroZone: 'SUDAN_SAVANNA', sgrSiloHub: 'Gaya Silo Complex (25,000 MT)', irrigationSharePct: 38, smallholderYieldFactor: 1.14 },
  { stateCode: 'KT', stateName: 'Katsina', agroZone: 'SUDAN_SAVANNA', sgrSiloHub: 'Dutsin-Ma Silo Complex (25,000 MT)', irrigationSharePct: 21, smallholderYieldFactor: 1.04 },
  { stateCode: 'JG', stateName: 'Jigawa', agroZone: 'SUDAN_SAVANNA', sgrSiloHub: 'Jahun Silo Complex (25,000 MT)', irrigationSharePct: 42, smallholderYieldFactor: 1.15 },
  { stateCode: 'KB', stateName: 'Kebbi', agroZone: 'SUDAN_SAVANNA', sgrSiloHub: 'Birnin Kebbi Silo Complex (100,000 MT)', irrigationSharePct: 46, smallholderYieldFactor: 1.18 },
  { stateCode: 'SO', stateName: 'Sokoto', agroZone: 'SAHEL_SAVANNA', sgrSiloHub: 'Sokoto Silo Complex (25,000 MT)', irrigationSharePct: 31, smallholderYieldFactor: 0.98 },
  { stateCode: 'ZM', stateName: 'Zamfara', agroZone: 'SUDAN_SAVANNA', sgrSiloHub: 'Gusau Silo Complex (25,000 MT)', irrigationSharePct: 19, smallholderYieldFactor: 1.01 },
  { stateCode: 'BO', stateName: 'Borno', agroZone: 'SAHEL_SAVANNA', sgrSiloHub: 'Maiduguri Silo Complex (25,000 MT)', irrigationSharePct: 16, smallholderYieldFactor: 0.91 },
  { stateCode: 'YB', stateName: 'Yobe', agroZone: 'SAHEL_SAVANNA', sgrSiloHub: 'Damaturu Aggregation Hub (15,000 MT)', irrigationSharePct: 18, smallholderYieldFactor: 0.92 },
  { stateCode: 'BA', stateName: 'Bauchi', agroZone: 'NORTHERN_GUINEA_SAVANNA', sgrSiloHub: 'Bauchi Silo Complex (25,000 MT)', irrigationSharePct: 22, smallholderYieldFactor: 1.07 },
  { stateCode: 'GM', stateName: 'Gombe', agroZone: 'SUDAN_SAVANNA', sgrSiloHub: 'Gombe Silo Complex (25,000 MT)', irrigationSharePct: 25, smallholderYieldFactor: 1.08 },
  { stateCode: 'AD', stateName: 'Adamawa', agroZone: 'NORTHERN_GUINEA_SAVANNA', sgrSiloHub: 'Yola Silo Complex (25,000 MT)', irrigationSharePct: 23, smallholderYieldFactor: 1.06 },
  { stateCode: 'TR', stateName: 'Taraba', agroZone: 'SOUTHERN_GUINEA_SAVANNA', sgrSiloHub: 'Jalingo Silo Complex (25,000 MT)', irrigationSharePct: 27, smallholderYieldFactor: 1.12 },
  { stateCode: 'PL', stateName: 'Plateau', agroZone: 'NORTHERN_GUINEA_SAVANNA', sgrSiloHub: 'Jos Silo Complex (25,000 MT)', irrigationSharePct: 26, smallholderYieldFactor: 1.14 },
  { stateCode: 'NG', stateName: 'Niger', agroZone: 'NORTHERN_GUINEA_SAVANNA', sgrSiloHub: 'Minna Silo Complex (25,000 MT)', irrigationSharePct: 29, smallholderYieldFactor: 1.15 },
  { stateCode: 'BN', stateName: 'Benue', agroZone: 'SOUTHERN_GUINEA_SAVANNA', sgrSiloHub: 'Makurdi Silo Complex (25,000 MT)', irrigationSharePct: 20, smallholderYieldFactor: 1.17 },
  { stateCode: 'NS', stateName: 'Nasarawa', agroZone: 'SOUTHERN_GUINEA_SAVANNA', sgrSiloHub: 'Lafia Silo Complex (25,000 MT)', irrigationSharePct: 21, smallholderYieldFactor: 1.11 },
  { stateCode: 'KG', stateName: 'Kogi', agroZone: 'SOUTHERN_GUINEA_SAVANNA', sgrSiloHub: 'Lokoja Silo Complex (25,000 MT)', irrigationSharePct: 19, smallholderYieldFactor: 1.08 },
  { stateCode: 'KW', stateName: 'Kwara', agroZone: 'SOUTHERN_GUINEA_SAVANNA', sgrSiloHub: 'Ilorin Silo Complex (25,000 MT)', irrigationSharePct: 22, smallholderYieldFactor: 1.10 },
  { stateCode: 'FC', stateName: 'FCT Abuja', agroZone: 'SOUTHERN_GUINEA_SAVANNA', sgrSiloHub: 'Gwagwalada Silo Complex (100,000 MT)', irrigationSharePct: 24, smallholderYieldFactor: 1.09 },
  { stateCode: 'OY', stateName: 'Oyo', agroZone: 'DERIVED_SAVANNA', sgrSiloHub: 'Ibadan Silo Complex (25,000 MT)', irrigationSharePct: 15, smallholderYieldFactor: 1.12 },
  { stateCode: 'OG', stateName: 'Ogun', agroZone: 'DERIVED_SAVANNA', sgrSiloHub: 'Abeokuta Silo Complex (25,000 MT)', irrigationSharePct: 14, smallholderYieldFactor: 1.09 },
  { stateCode: 'OS', stateName: 'Osun', agroZone: 'DERIVED_SAVANNA', sgrSiloHub: 'Ilesa Silo Complex (25,000 MT)', irrigationSharePct: 13, smallholderYieldFactor: 1.07 },
  { stateCode: 'OD', stateName: 'Ondo', agroZone: 'HUMID_FOREST', sgrSiloHub: 'Akure Silo Complex (25,000 MT)', irrigationSharePct: 12, smallholderYieldFactor: 1.06 },
  { stateCode: 'EK', stateName: 'Ekiti', agroZone: 'DERIVED_SAVANNA', sgrSiloHub: 'Ado-Ekiti Silo Complex (25,000 MT)', irrigationSharePct: 13, smallholderYieldFactor: 1.05 },
  { stateCode: 'LA', stateName: 'Lagos', agroZone: 'HUMID_FOREST', sgrSiloHub: 'Imota Rice Mill & Silo Hub (32,000 MT)', irrigationSharePct: 28, smallholderYieldFactor: 1.08 },
  { stateCode: 'ED', stateName: 'Edo', agroZone: 'HUMID_FOREST', sgrSiloHub: 'Irrua Silo Complex (25,000 MT)', irrigationSharePct: 14, smallholderYieldFactor: 1.07 },
  { stateCode: 'DT', stateName: 'Delta', agroZone: 'HUMID_FOREST', sgrSiloHub: 'Asaba Agro Storage Hub (20,000 MT)', irrigationSharePct: 13, smallholderYieldFactor: 1.04 },
  { stateCode: 'AN', stateName: 'Anambra', agroZone: 'DERIVED_SAVANNA', sgrSiloHub: 'Igbariam Silo Complex (25,000 MT)', irrigationSharePct: 21, smallholderYieldFactor: 1.09 },
  { stateCode: 'EN', stateName: 'Enugu', agroZone: 'DERIVED_SAVANNA', sgrSiloHub: 'Ezillo Silo Complex (25,000 MT)', irrigationSharePct: 18, smallholderYieldFactor: 1.07 },
  { stateCode: 'EB', stateName: 'Ebonyi', agroZone: 'DERIVED_SAVANNA', sgrSiloHub: 'Abakaliki Rice Silo Cluster (50,000 MT)', irrigationSharePct: 34, smallholderYieldFactor: 1.16 },
  { stateCode: 'IM', stateName: 'Imo', agroZone: 'HUMID_FOREST', sgrSiloHub: 'Okigwe Silo Complex (25,000 MT)', irrigationSharePct: 11, smallholderYieldFactor: 1.02 },
  { stateCode: 'AB', stateName: 'Abia', agroZone: 'HUMID_FOREST', sgrSiloHub: 'Umuahia Agro Silo Hub (20,000 MT)', irrigationSharePct: 12, smallholderYieldFactor: 1.03 },
  { stateCode: 'CR', stateName: 'Cross River', agroZone: 'HUMID_FOREST', sgrSiloHub: 'Ogoja Silo Complex (25,000 MT)', irrigationSharePct: 17, smallholderYieldFactor: 1.08 },
  { stateCode: 'AK', stateName: 'Akwa Ibom', agroZone: 'HUMID_FOREST', sgrSiloHub: 'Uyo Silo Complex (25,000 MT)', irrigationSharePct: 12, smallholderYieldFactor: 1.04 },
  { stateCode: 'RV', stateName: 'Rivers', agroZone: 'HUMID_FOREST', sgrSiloHub: 'Port Harcourt Export Terminal Silo (35,000 MT)', irrigationSharePct: 14, smallholderYieldFactor: 1.03 },
  { stateCode: 'BY', stateName: 'Bayelsa', agroZone: 'HUMID_FOREST', sgrSiloHub: 'Yenagoa Peremabiri Rice Hub (15,000 MT)', irrigationSharePct: 19, smallholderYieldFactor: 1.01 },
];

const CROP_YIELD_POTENTIAL_SPEC = {
  MAIZE: {
    cropKey: 'MAIZE',
    geneticPotentialTonsHa: 7.8,
    nationalSmallholderBaselineTonsHa: 2.35,
    optimalNRateKgHa: 145,
    optimalP2O5RateKgHa: 60,
    optimalK2ORateKgHa: 45,
    farmGatePriceNgnTon: 685000,
    mitscherlichResponseCoeffC: 0.0145,
  },
  RICE_PADDY: {
    cropKey: 'RICE_PADDY',
    geneticPotentialTonsHa: 8.2,
    nationalSmallholderBaselineTonsHa: 2.85,
    optimalNRateKgHa: 135,
    optimalP2O5RateKgHa: 55,
    optimalK2ORateKgHa: 50,
    farmGatePriceNgnTon: 820000,
    mitscherlichResponseCoeffC: 0.0138,
  },
  SORGHUM: {
    cropKey: 'SORGHUM',
    geneticPotentialTonsHa: 4.5,
    nationalSmallholderBaselineTonsHa: 1.65,
    optimalNRateKgHa: 85,
    optimalP2O5RateKgHa: 40,
    optimalK2ORateKgHa: 30,
    farmGatePriceNgnTon: 620000,
    mitscherlichResponseCoeffC: 0.0175,
  },
  SOYBEAN: {
    cropKey: 'SOYBEAN',
    geneticPotentialTonsHa: 3.6,
    nationalSmallholderBaselineTonsHa: 1.38,
    optimalNRateKgHa: 30, // Biological N2 fixation credit
    optimalP2O5RateKgHa: 65,
    optimalK2ORateKgHa: 45,
    farmGatePriceNgnTon: 940000,
    mitscherlichResponseCoeffC: 0.022,
  },
  COWPEA: {
    cropKey: 'COWPEA',
    geneticPotentialTonsHa: 2.8,
    nationalSmallholderBaselineTonsHa: 1.05,
    optimalNRateKgHa: 25,
    optimalP2O5RateKgHa: 50,
    optimalK2ORateKgHa: 35,
    farmGatePriceNgnTon: 1050000,
    mitscherlichResponseCoeffC: 0.024,
  },
  GROUNDNUT: {
    cropKey: 'GROUNDNUT',
    geneticPotentialTonsHa: 3.4,
    nationalSmallholderBaselineTonsHa: 1.32,
    optimalNRateKgHa: 30,
    optimalP2O5RateKgHa: 60,
    optimalK2ORateKgHa: 45,
    farmGatePriceNgnTon: 980000,
    mitscherlichResponseCoeffC: 0.021,
  },
  CASSAVA: {
    cropKey: 'CASSAVA',
    geneticPotentialTonsHa: 34.0,
    nationalSmallholderBaselineTonsHa: 12.4,
    optimalNRateKgHa: 110,
    optimalP2O5RateKgHa: 50,
    optimalK2ORateKgHa: 120,
    farmGatePriceNgnTon: 215000,
    mitscherlichResponseCoeffC: 0.013,
  },
  SESAME: {
    cropKey: 'SESAME',
    geneticPotentialTonsHa: 1.85,
    nationalSmallholderBaselineTonsHa: 0.74,
    optimalNRateKgHa: 60,
    optimalP2O5RateKgHa: 35,
    optimalK2ORateKgHa: 25,
    farmGatePriceNgnTon: 1650000,
    mitscherlichResponseCoeffC: 0.019,
  },
  MILLET: {
    cropKey: 'MILLET',
    geneticPotentialTonsHa: 3.5,
    nationalSmallholderBaselineTonsHa: 1.35,
    optimalNRateKgHa: 70,
    optimalP2O5RateKgHa: 35,
    optimalK2ORateKgHa: 25,
    farmGatePriceNgnTon: 590000,
    mitscherlichResponseCoeffC: 0.0185,
  },
};

function roundTo(val, digits = 2) {
  const factor = Math.pow(10, digits);
  return Math.round((Number(val) || 0) * factor) / factor;
}

/**
 * Computes Lobell exploitable yield gap (Yg = Yw - Ya) and Mitscherlich-Baule fertilizer uplift
 * for any combination of Nigerian state, staple crop, and agronomic management intensity.
 */
function evaluateStateCropYieldBenchmark(params = {}) {
  const stateCode = String(params.stateCode || 'KD').toUpperCase();
  const cropKey = String(params.cropKey || 'MAIZE').toUpperCase();
  const appliedNitrogenKgHa = Math.max(0, Number(params.appliedNitrogenKgHa ?? 95));
  const irrigationActive = Boolean(params.irrigationActive);
  const certifiedHybridSeed = params.certifiedHybridSeed !== false;

  const stateEntry =
    NATIONAL_STATE_AGRO_REGISTRY.find((s) => s.stateCode === stateCode) ||
    NATIONAL_STATE_AGRO_REGISTRY[0];
  const zoneSpec =
    AGRO_ECOLOGICAL_ZONE_PARAMETERS[stateEntry.agroZone] ||
    AGRO_ECOLOGICAL_ZONE_PARAMETERS.NORTHERN_GUINEA_SAVANNA;
  const cropSpec =
    CROP_YIELD_POTENTIAL_SPEC[cropKey] || CROP_YIELD_POTENTIAL_SPEC.MAIZE;

  // Water-limited yield ceiling Yw (t/ha)
  const irrigationCeilingBoost = irrigationActive ? 1.12 : 1.0;
  const waterLimitedPotentialYwTonsHa = roundTo(
    Math.min(
      cropSpec.geneticPotentialTonsHa,
      cropSpec.geneticPotentialTonsHa *
        zoneSpec.waterLimitedPotentialMultiplier *
        irrigationCeilingBoost
    ),
    2
  );

  // Smallholder regional baseline Ya_baseline (t/ha)
  const regionalBaselineTonsHa = roundTo(
    cropSpec.nationalSmallholderBaselineTonsHa * stateEntry.smallholderYieldFactor,
    2
  );

  // Mitscherlich-Baule nutrient response factor: 1 - exp(-c * (N_applied + N_soil_indigenous))
  const indigenousSoilNKgHa = zoneSpec.soilOrganicCarbonBaselinePct * 38;
  const nutrientSufficiencyFactor =
    1 -
    Math.exp(
      -cropSpec.mitscherlichResponseCoeffC *
        (appliedNitrogenKgHa + indigenousSoilNKgHa)
    );

  const seedVigorMultiplier = certifiedHybridSeed ? 1.14 : 0.88;
  const irrigationStabilityMultiplier = irrigationActive ? 1.11 : 0.96;

  const predictedActualYieldYaTonsHa = roundTo(
    Math.min(
      waterLimitedPotentialYwTonsHa * 0.96,
      Math.max(
        regionalBaselineTonsHa * 0.72,
        waterLimitedPotentialYwTonsHa *
          nutrientSufficiencyFactor *
          seedVigorMultiplier *
          irrigationStabilityMultiplier *
          0.78
      )
    ),
    2
  );

  // Exploitable yield gap (Lobell 80% of Yw threshold)
  const exploitableCeiling80PctYw = roundTo(waterLimitedPotentialYwTonsHa * 0.8, 2);
  const totalYieldGapTonsHa = roundTo(
    Math.max(0, waterLimitedPotentialYwTonsHa - predictedActualYieldYaTonsHa),
    2
  );
  const exploitableYieldGapTonsHa = roundTo(
    Math.max(0, exploitableCeiling80PctYw - predictedActualYieldYaTonsHa),
    2
  );
  const yieldGapClosurePct = roundTo(
    (predictedActualYieldYaTonsHa / waterLimitedPotentialYwTonsHa) * 100,
    1
  );

  const regionalUpliftPct = roundTo(
    ((predictedActualYieldYaTonsHa - regionalBaselineTonsHa) /
      regionalBaselineTonsHa) *
      100,
    1
  );

  const grossRevenuePerHaNgn = Math.round(
    predictedActualYieldYaTonsHa * cropSpec.farmGatePriceNgnTon
  );
  const exploitableRevenueUpsidePerHaNgn = Math.round(
    exploitableYieldGapTonsHa * cropSpec.farmGatePriceNgnTon
  );

  return {
    stateCode: stateEntry.stateCode,
    stateName: stateEntry.stateName,
    agroZone: stateEntry.agroZone,
    sgrSiloHub: stateEntry.sgrSiloHub,
    cropKey: cropSpec.cropKey,
    geneticPotentialTonsHa: cropSpec.geneticPotentialTonsHa,
    waterLimitedPotentialYwTonsHa,
    exploitableCeiling80PctYw,
    regionalBaselineTonsHa,
    predictedActualYieldYaTonsHa,
    totalYieldGapTonsHa,
    exploitableYieldGapTonsHa,
    yieldGapClosurePct,
    regionalUpliftPct,
    grossRevenuePerHaNgn,
    exploitableRevenueUpsidePerHaNgn,
  };
}

/**
 * Generates a full 37-jurisdiction (36 states + FCT) national harvest balance sheet for a given crop.
 */
function generateNationalHarvestBalanceSheet(cropKey = 'MAIZE', options = {}) {
  const normalizedCrop = String(cropKey || 'MAIZE').toUpperCase();
  const appliedNitrogenKgHa = Number(options.appliedNitrogenKgHa ?? 110);
  const meanClusterAreaHa = Number(options.meanClusterAreaHa ?? 250);

  const stateSummaries = NATIONAL_STATE_AGRO_REGISTRY.map((stateItem) => {
    const benchmark = evaluateStateCropYieldBenchmark({
      stateCode: stateItem.stateCode,
      cropKey: normalizedCrop,
      appliedNitrogenKgHa,
      irrigationActive: stateItem.irrigationSharePct >= 28,
      certifiedHybridSeed: true,
    });
    const clusterProductionTons = roundTo(
      benchmark.predictedActualYieldYaTonsHa * meanClusterAreaHa,
      1
    );
    return {
      ...benchmark,
      clusterAreaHa: meanClusterAreaHa,
      clusterProductionTons,
    };
  });

  const totalNationalClusterTons = roundTo(
    stateSummaries.reduce((acc, s) => acc + s.clusterProductionTons, 0),
    1
  );
  const nationalMeanYieldTonsHa = roundTo(
    stateSummaries.reduce((acc, s) => acc + s.predictedActualYieldYaTonsHa, 0) /
      stateSummaries.length,
    2
  );

  return {
    cropKey: normalizedCrop,
    jurisdictionCount: stateSummaries.length,
    nationalMeanYieldTonsHa,
    totalNationalClusterTons,
    stateSummaries,
  };
}

module.exports = {
  AGRO_ECOLOGICAL_ZONE_PARAMETERS,
  NATIONAL_STATE_AGRO_REGISTRY,
  CROP_YIELD_POTENTIAL_SPEC,
  evaluateStateCropYieldBenchmark,
  generateNationalHarvestBalanceSheet,
};
