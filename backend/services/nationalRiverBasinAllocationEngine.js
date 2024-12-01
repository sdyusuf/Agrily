/**
 * ==============================================================================
 * 🏞️ AGRILY SPRINT 23: NATIONAL RIVER BASIN DEVELOPMENT AUTHORITY (RBDA)
 *    RESERVOIR STORAGE, CANAL CONVEYANCE & WARABANDI ALLOCATION ENGINE
 * ==============================================================================
 *
 * Models all 12 Federal River Basin Development Authorities (RBDAs) in Nigeria:
 *   1. Hadejia-Jama’are RBDA (Kano, Jigawa, Bauchi) — Tiga & Challawa Gorge Dams
 *   2. Sokoto-Rima RBDA (Sokoto, Kebbi, Zamfara, Katsina) — Goronyo, Bakolori & Zobe Dams
 *   3. Chad Basin RBDA (Borno, Yobe, Northern Adamawa) — Alau Dam & South Chad Scheme
 *   4. Upper Benue RBDA (Adamawa, Gombe, Taraba, Southern Bauchi) — Dadin Kowa & Kiri Dams
 *   5. Lower Benue RBDA (Benue, Nasarawa, Plateau, Kogi East) — Doma & Katsina-Ala Schemes
 *   6. Upper Niger RBDA (Niger, Kaduna, FCT) — Shiroro, Zungeru, Kangimi & Tungan Kawo
 *   7. Lower Niger RBDA (Kwara, Kogi West) — Omi (Kampe) & Tada-Shonga Irrigation Schemes
 *   8. Ogun-Osun RBDA (Oyo, Ogun, Osun, Lagos) — Ikere Gorge & Oyan Reservoir Schemes
 *   9. Benin-Owena RBDA (Edo, Ondo, Ekiti, Delta North) — Owena Multipurpose & Illushi Rice
 *  10. Anambra-Imo RBDA (Anambra, Enugu, Imo, Ebonyi, Abia) — Lower Anambra (Omor) & Ivo
 *  11. Cross River RBDA (Cross River, Akwa Ibom) — Ogoja, Obubra & Itu Floodplain Schemes
 *  12. Niger Delta RBDA (Rivers, Bayelsa, Delta South) — Peremabiri & Isampou Polder Schemes
 *
 * @module services/nationalRiverBasinAllocationEngine
 */

const {
  evaluateFao56RootZoneSchedule,
} = require('./fao56SoilWaterBalanceEngine');
const {
  evaluateSalinitySodicityAndLeaching,
  evaluateIrriSafeAwdRiceSchedule,
  optimizeRegulatedDeficitIrrigation,
} = require('./regulatedDeficitAndSalinityEngine');

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

function roundTo(val, digits = 2) {
  const factor = Math.pow(10, digits);
  return Math.round((Number(val) || 0) * factor) / factor;
}

/**
 * Full Registry of Nigeria's 12 Federal River Basin Development Authorities (RBDAs)
 */
const NIGERIAN_RIVER_BASIN_AUTHORITIES = [
  {
    rbdaCode: 'RBDA-01-HJ',
    rbdaName: 'Hadejia-Jama’are River Basin Development Authority',
    headquartersCity: 'Kano',
    statesCovered: ['Kano', 'Jigawa', 'Bauchi'],
    flagshipSchemes: [
      'Kano River Irrigation Project (KRIP Phase I & II — Kura/Garun Mallam)',
      'Hadejia Valley Irrigation Project (HVIP — Auyo/Hadejia)',
    ],
    primaryReservoirs: ['Tiga Dam (1,968 MCM)', 'Challawa Gorge Dam (972 MCM)'],
    designLiveStorageMcm: 2940.0,
    equippedIrrigableAreaHa: 36500,
    canalLiningType: 'CONCRETE_TRAPEZOIDAL_LINED',
    conveyanceEfficiencyEtaC: 0.78,
    dominantDrySeasonCrops: ['TOMATO_IRRIGATED', 'WHEAT_IRRIGATED', 'RICE_IRRIGATED_AWD'],
    baselineWaterEcDsm: 0.65,
    referenceEt0DrySeasonMmDay: 6.5,
  },
  {
    rbdaCode: 'RBDA-02-SR',
    rbdaName: 'Sokoto-Rima River Basin Development Authority',
    headquartersCity: 'Sokoto',
    statesCovered: ['Sokoto', 'Kebbi', 'Zamfara', 'Katsina'],
    flagshipSchemes: [
      'Bakolori Irrigation Scheme (Talata Mafara)',
      'Goronyo Middle Rima Valley Irrigation Project',
      'Zobe & Jibia Irrigation Schemes',
    ],
    primaryReservoirs: ['Goronyo Dam (942 MCM)', 'Bakolori Dam (450 MCM)', 'Zobe Dam (177 MCM)'],
    designLiveStorageMcm: 1569.0,
    equippedIrrigableAreaHa: 32800,
    canalLiningType: 'CONCRETE_AND_HDPE_PIPELINE',
    conveyanceEfficiencyEtaC: 0.76,
    dominantDrySeasonCrops: ['ONION_BULB', 'RICE_IRRIGATED_AWD', 'WHEAT_IRRIGATED'],
    baselineWaterEcDsm: 0.85,
    referenceEt0DrySeasonMmDay: 7.1,
  },
  {
    rbdaCode: 'RBDA-03-CB',
    rbdaName: 'Chad Basin Development Authority',
    headquartersCity: 'Maiduguri',
    statesCovered: ['Borno', 'Yobe', 'Adamawa North'],
    flagshipSchemes: [
      'South Chad Irrigation Project (SCIP — New Marte)',
      'Baga Polder & Jere Bowl Irrigation Schemes',
    ],
    primaryReservoirs: ['Alau Dam (112 MCM)', 'Lake Chad Intake Basin'],
    designLiveStorageMcm: 680.0,
    equippedIrrigableAreaHa: 18500,
    canalLiningType: 'EARTHEN_COMPACTED_CLAY',
    conveyanceEfficiencyEtaC: 0.64,
    dominantDrySeasonCrops: ['WHEAT_IRRIGATED', 'ONION_BULB', 'RICE_IRRIGATED_AWD'],
    baselineWaterEcDsm: 1.45,
    referenceEt0DrySeasonMmDay: 7.4,
  },
  {
    rbdaCode: 'RBDA-04-UB',
    rbdaName: 'Upper Benue River Basin Development Authority',
    headquartersCity: 'Yola',
    statesCovered: ['Adamawa', 'Gombe', 'Taraba', 'Bauchi South'],
    flagshipSchemes: [
      'Dadin Kowa Irrigation Scheme (Yamaltu Deba)',
      'Kiri DamSavannah Sugar Estate (Numan)',
      'Cham & Gassol Floodplain Irrigation',
    ],
    primaryReservoirs: ['Dadin Kowa Dam (2,855 MCM)', 'Kiri Dam (615 MCM)'],
    designLiveStorageMcm: 3470.0,
    equippedIrrigableAreaHa: 29400,
    canalLiningType: 'CONCRETE_TRAPEZOIDAL_LINED',
    conveyanceEfficiencyEtaC: 0.79,
    dominantDrySeasonCrops: ['SUGARCANE_ESTATE', 'RICE_IRRIGATED_AWD', 'TOMATO_IRRIGATED'],
    baselineWaterEcDsm: 0.55,
    referenceEt0DrySeasonMmDay: 6.2,
  },
  {
    rbdaCode: 'RBDA-05-LB',
    rbdaName: 'Lower Benue River Basin Development Authority',
    headquartersCity: 'Makurdi',
    statesCovered: ['Benue', 'Nasarawa', 'Plateau', 'Kogi East'],
    flagshipSchemes: [
      'Doma Dam Irrigation Scheme',
      'Katsina-Ala & Dep River Valley Schemes',
      'Bokkos / Mangu Highland Potato Sprinkler Blocks',
    ],
    primaryReservoirs: ['Doma Dam (37.5 MCM)', 'Katsina-Ala Weir'],
    designLiveStorageMcm: 420.0,
    equippedIrrigableAreaHa: 12600,
    canalLiningType: 'PRESSURIZED_UPVC_AND_LINED_CANAL',
    conveyanceEfficiencyEtaC: 0.81,
    dominantDrySeasonCrops: ['TOMATO_IRRIGATED', 'RICE_IRRIGATED_AWD', 'MAIZE_IRRIGATED'],
    baselineWaterEcDsm: 0.45,
    referenceEt0DrySeasonMmDay: 5.5,
  },
  {
    rbdaCode: 'RBDA-06-UN',
    rbdaName: 'Upper Niger River Basin Development Authority',
    headquartersCity: 'Minna',
    statesCovered: ['Niger', 'Kaduna', 'FCT Abuja'],
    flagshipSchemes: [
      'Tungan Kawo Irrigation Scheme (Wushishi)',
      'Galma & Kangimi Reservoir Irrigation (Zaria/Igabi)',
      'Swashi Valley Irrigation Project',
    ],
    primaryReservoirs: ['Shiroro / Galma / Kangimi / Tungan Kawo Dams'],
    designLiveStorageMcm: 1850.0,
    equippedIrrigableAreaHa: 24200,
    canalLiningType: 'CONCRETE_TRAPEZOIDAL_LINED',
    conveyanceEfficiencyEtaC: 0.77,
    dominantDrySeasonCrops: ['RICE_IRRIGATED_AWD', 'MAIZE_IRRIGATED', 'TOMATO_IRRIGATED'],
    baselineWaterEcDsm: 0.52,
    referenceEt0DrySeasonMmDay: 5.8,
  },
  {
    rbdaCode: 'RBDA-07-LN',
    rbdaName: 'Lower Niger River Basin Development Authority',
    headquartersCity: 'Ilorin',
    statesCovered: ['Kwara', 'Kogi West'],
    flagshipSchemes: [
      'Kampe (Omi Dam) Irrigation Project (Yagba West)',
      'Tada-Shonga Floodplain Rice & Sugarcane Scheme (Edu)',
    ],
    primaryReservoirs: ['Omi Dam (250 MCM)', 'Asa & Moro Reservoirs'],
    designLiveStorageMcm: 580.0,
    equippedIrrigableAreaHa: 15800,
    canalLiningType: 'CONCRETE_TRAPEZOIDAL_LINED',
    conveyanceEfficiencyEtaC: 0.76,
    dominantDrySeasonCrops: ['RICE_IRRIGATED_AWD', 'SUGARCANE_ESTATE', 'MAIZE_IRRIGATED'],
    baselineWaterEcDsm: 0.48,
    referenceEt0DrySeasonMmDay: 5.4,
  },
  {
    rbdaCode: 'RBDA-08-OO',
    rbdaName: 'Ogun-Osun River Basin Development Authority',
    headquartersCity: 'Abeokuta',
    statesCovered: ['Ogun', 'Oyo', 'Osun', 'Lagos'],
    flagshipSchemes: [
      'Middle Ogun Irrigation Project (Iseyin)',
      'Lower Ogun Irrigation Scheme (Mokoloki)',
      'Sepeteri & Ofiki Sprinkler Blocks',
    ],
    primaryReservoirs: ['Ikere Gorge Dam (565 MCM)', 'Oyan River Dam (270 MCM)'],
    designLiveStorageMcm: 835.0,
    equippedIrrigableAreaHa: 14200,
    canalLiningType: 'PRESSURIZED_HDPE_AND_SPRINKLER',
    conveyanceEfficiencyEtaC: 0.83,
    dominantDrySeasonCrops: ['TOMATO_IRRIGATED', 'MAIZE_IRRIGATED', 'RICE_IRRIGATED_AWD'],
    baselineWaterEcDsm: 0.42,
    referenceEt0DrySeasonMmDay: 4.9,
  },
  {
    rbdaCode: 'RBDA-09-BO',
    rbdaName: 'Benin-Owena River Basin Development Authority',
    headquartersCity: 'Benin City',
    statesCovered: ['Edo', 'Ondo', 'Ekiti', 'Delta North'],
    flagshipSchemes: [
      'Illushi-Ega Niger Floodplain Rice Project (Esan South-East)',
      'Owena Multipurpose Dam Irrigation Scheme',
      'ero River Valley Irrigation Project',
    ],
    primaryReservoirs: ['Owena Dam (36 MCM)', 'Ero Dam (21 MCM)'],
    designLiveStorageMcm: 310.0,
    equippedIrrigableAreaHa: 9400,
    canalLiningType: 'PRESSURIZED_UPVC_AND_LINED_CANAL',
    conveyanceEfficiencyEtaC: 0.80,
    dominantDrySeasonCrops: ['RICE_IRRIGATED_AWD', 'TOMATO_IRRIGATED', 'MAIZE_IRRIGATED'],
    baselineWaterEcDsm: 0.38,
    referenceEt0DrySeasonMmDay: 4.6,
  },
  {
    rbdaCode: 'RBDA-10-AI',
    rbdaName: 'Anambra-Imo River Basin Development Authority',
    headquartersCity: 'Owerri',
    statesCovered: ['Anambra', 'Enugu', 'Imo', 'Ebonyi', 'Abia'],
    flagshipSchemes: [
      'Lower Anambra Irrigation Project (LAIP — Omor, Ayamelum)',
      'Ada Rice Production Scheme (Uzo-Uwani)',
      'Ibu Dam & Ivo Valley Irrigation Project',
    ],
    primaryReservoirs: ['Anambra River Lift Station (Omor)', 'Ivo & Igwu Dams'],
    designLiveStorageMcm: 440.0,
    equippedIrrigableAreaHa: 11800,
    canalLiningType: 'CONCRETE_TRAPEZOIDAL_LINED',
    conveyanceEfficiencyEtaC: 0.77,
    dominantDrySeasonCrops: ['RICE_IRRIGATED_AWD', 'MAIZE_IRRIGATED', 'TOMATO_IRRIGATED'],
    baselineWaterEcDsm: 0.36,
    referenceEt0DrySeasonMmDay: 4.7,
  },
  {
    rbdaCode: 'RBDA-11-CR',
    rbdaName: 'Cross River Basin Development Authority',
    headquartersCity: 'Calabar',
    statesCovered: ['Cross River', 'Akwa Ibom'],
    flagshipSchemes: [
      'Ogoja / Yala Rice Irrigation Scheme',
      'Obubra / Abakaliki Boundary Lowland Project',
      'Itu / ONNA Floodplain Vegetable & Rice Scheme',
    ],
    primaryReservoirs: ['Ijegu Yala Dam', 'Nkari Dam'],
    designLiveStorageMcm: 290.0,
    equippedIrrigableAreaHa: 8200,
    canalLiningType: 'CONCRETE_TRAPEZOIDAL_LINED',
    conveyanceEfficiencyEtaC: 0.78,
    dominantDrySeasonCrops: ['RICE_IRRIGATED_AWD', 'MAIZE_IRRIGATED', 'TOMATO_IRRIGATED'],
    baselineWaterEcDsm: 0.34,
    referenceEt0DrySeasonMmDay: 4.4,
  },
  {
    rbdaCode: 'RBDA-12-ND',
    rbdaName: 'Niger Delta Basin Development Authority',
    headquartersCity: 'Port Harcourt',
    statesCovered: ['Rivers', 'Bayelsa', 'Delta South'],
    flagshipSchemes: [
      'Peremabiri Tidal & Polder Rice Irrigation Project (Southern Ijaw)',
      'Isampou & Koko Lowland Rice Schemes',
    ],
    primaryReservoirs: ['Nun & Forcados River Freshwater Tidal Intakes'],
    designLiveStorageMcm: 510.0,
    equippedIrrigableAreaHa: 9600,
    canalLiningType: 'DYKED_POLDER_AND_AXIAL_FLOW_PUMPS',
    conveyanceEfficiencyEtaC: 0.82,
    dominantDrySeasonCrops: ['RICE_IRRIGATED_AWD', 'MAIZE_IRRIGATED'],
    baselineWaterEcDsm: 0.75,
    referenceEt0DrySeasonMmDay: 4.2,
  },
];

/**
 * Evaluates reservoir water balance, canal conveyance losses, rotational Warabandi
 * gate turns, and RDI / AWD savings for a specific Nigerian River Basin Authority.
 */
function evaluateRiverBasinSeasonalAllocation(params = {}) {
  const rbdaCode = String(params.rbdaCode || 'RBDA-01-HJ').toUpperCase();
  const basin =
    NIGERIAN_RIVER_BASIN_AUTHORITIES.find((b) => b.rbdaCode === rbdaCode) ||
    NIGERIAN_RIVER_BASIN_AUTHORITIES[0];

  const currentStorageFillPct = clamp(
    Number(params.currentStorageFillPct ?? 78.0),
    15.0,
    100.0
  );
  const activeCroppedAreaHa = clamp(
    Number(params.activeCroppedAreaHa ?? basin.equippedIrrigableAreaHa * 0.75),
    100,
    basin.equippedIrrigableAreaHa * 1.2
  );
  const primaryCropKey = String(
    params.primaryCropKey || basin.dominantDrySeasonCrops[0]
  ).toUpperCase();

  // 1. Reservoir Storage Accounting (MCM = Million Cubic Meters = 10^6 m³)
  const grossAvailableStorageMcm =
    basin.designLiveStorageMcm * (currentStorageFillPct / 100);
  const deadStorageAndEcologicalFlowMcm = basin.designLiveStorageMcm * 0.14;
  const openWaterEvaporationLossMcm = grossAvailableStorageMcm * 0.085;
  const netAllocatableWaterMcm = Math.max(
    10,
    grossAvailableStorageMcm -
      deadStorageAndEcologicalFlowMcm -
      openWaterEvaporationLossMcm
  );

  // 2. Seasonal Field & Headworks Water Demand
  const seasonalNetCropEtMm =
    primaryCropKey === 'RICE_IRRIGATED_AWD'
      ? 972
      : primaryCropKey === 'SUGARCANE_ESTATE'
      ? 1280
      : 580;

  const fieldLevelDemandMcm =
    (seasonalNetCropEtMm * 10 * activeCroppedAreaHa) / 1e6;
  const headworksReleaseDemandMcm =
    fieldLevelDemandMcm / basin.conveyanceEfficiencyEtaC;

  const waterSupplyAdequacyRatio = clamp(
    netAllocatableWaterMcm / Math.max(1, headworksReleaseDemandMcm),
    0.45,
    1.0
  );

  // 3. Rotational Warabandi Secondary/Tertiary Canal Turnout Schedule
  // Standard 7-day (168 hours) rotational cycle across 12 secondary distributor blocks
  const warabandiHoursPerBlock = roundTo(
    (168 * waterSupplyAdequacyRatio) / 12,
    2
  );

  // 4. Integrate FAO-56, Salinity, Safe-AWD, and RDI sub-models
  const fao56Sample = evaluateFao56RootZoneSchedule({
    cropKey: primaryCropKey,
    soilTextureKey: 'SANDY_LOAM',
    commandAreaHectares: 25.0,
    matricSuctionKpa: 48.0,
    referenceEt0MmDay: basin.referenceEt0DrySeasonMmDay,
  });

  const salinityEval = evaluateSalinitySodicityAndLeaching({
    cropKey: primaryCropKey,
    irrigationWaterEcDsm: basin.baselineWaterEcDsm,
    netCropWaterNeedMm: fao56Sample.netIrrigationDepthMm || 45.0,
  });

  const rdiOptimization = optimizeRegulatedDeficitIrrigation({
    cropKey: primaryCropKey,
    seasonalMaxEtMm: seasonalNetCropEtMm,
    waterSupplyAllocationPct: waterSupplyAdequacyRatio * 100,
  });

  const awdRiceMetrics = evaluateIrriSafeAwdRiceSchedule({
    fieldWaterTubeDepthCm: -15.0,
    phenologyStage: 'VEGETATIVE_TILLERING',
    fieldAreaHectares: activeCroppedAreaHa * 0.35,
  });

  return {
    rbdaCode: basin.rbdaCode,
    rbdaName: basin.rbdaName,
    headquartersCity: basin.headquartersCity,
    statesCovered: basin.statesCovered,
    flagshipSchemes: basin.flagshipSchemes,
    designLiveStorageMcm: basin.designLiveStorageMcm,
    currentStorageFillPct: roundTo(currentStorageFillPct, 1),
    netAllocatableWaterMcm: roundTo(netAllocatableWaterMcm, 2),
    activeCroppedAreaHa: Math.round(activeCroppedAreaHa),
    headworksReleaseDemandMcm: roundTo(headworksReleaseDemandMcm, 2),
    waterSupplyAdequacyPct: roundTo(waterSupplyAdequacyRatio * 100, 1),
    warabandiHoursPerBlock,
    conveyanceEfficiencyEtaC: basin.conveyanceEfficiencyEtaC,
    fao56Sample,
    salinityEval,
    rdiOptimization,
    awdRiceMetrics,
  };
}

/**
 * Evaluates all 12 Federal RBDAs simultaneously for national dry-season irrigation surveillance.
 */
function evaluateNationalIrrigationBasinMatrix(params = {}) {
  const storageFillPct = Number(params.currentStorageFillPct ?? 76.0);
  const basinReports = NIGERIAN_RIVER_BASIN_AUTHORITIES.map((basin) =>
    evaluateRiverBasinSeasonalAllocation({
      rbdaCode: basin.rbdaCode,
      currentStorageFillPct: storageFillPct,
    })
  );

  const totalDesignStorageMcm = basinReports.reduce(
    (sum, b) => sum + b.designLiveStorageMcm,
    0
  );
  const totalActiveIrrigatedHa = basinReports.reduce(
    (sum, b) => sum + b.activeCroppedAreaHa,
    0
  );
  const totalAbatedCo2eTonnes = basinReports.reduce(
    (sum, b) => sum + b.awdRiceMetrics.totalAbatedCo2eTonnes,
    0
  );

  return {
    totalBasinsEvaluated: basinReports.length,
    totalDesignStorageMcm: roundTo(totalDesignStorageMcm, 1),
    totalActiveIrrigatedHa,
    totalAbatedCo2eTonnes: roundTo(totalAbatedCo2eTonnes, 1),
    basinReports,
  };
}

module.exports = {
  NIGERIAN_RIVER_BASIN_AUTHORITIES,
  evaluateRiverBasinSeasonalAllocation,
  evaluateNationalIrrigationBasinMatrix,
};
