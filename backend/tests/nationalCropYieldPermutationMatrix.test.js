/**
 * ==============================================================================
 * 🧪 AGRILY SPRINT 21: NATIONAL 37-JURISDICTION × 9-CROP YIELD PERMUTATION MATRIX
 * ==============================================================================
 *
 * Exhaustively verifies:
 *  1. 37 Nigerian Jurisdictions (36 States + FCT) × 9 Staple Crops = 333 regional
 *     yield gap benchmarks under Low-Input, Standard-Input, and High-Input regimes
 *     (999 total agronomic state-crop-input permutations).
 *  2. Lobell Yield Gap Law: Actual Yield (Ya) <= Water-Limited Potential (Yw) <= Genetic Ceiling (Yp).
 *  3. Mitscherlich-Baule Monotonicity: Higher applied N strictly increases or maintains Ya.
 *  4. Certified hybrid seed & irrigation uplift invariants across all 6 agro-ecological zones.
 *  5. Post-harvest shrinkage & aflatoxin coupling across national Strategic Grain Reserve (SGR) hubs.
 *  6. Multiplicative FAO-33 stage-wise water stress & Jagadish anthesis heat sterility across all 9 crops.
 */

const assert = require('assert');
const {
  AGRO_ECOLOGICAL_ZONE_PARAMETERS,
  NATIONAL_STATE_AGRO_REGISTRY,
  CROP_YIELD_POTENTIAL_SPEC,
  evaluateStateCropYieldBenchmark,
  generateNationalHarvestBalanceSheet,
} = require('../services/nationalAgroZoneYieldBenchmarkEngine');
const {
  CROP_POST_HARVEST_SPECS,
  computePostHarvestShrinkageBalance,
  evaluateAflatoxinAndStorageSafety,
  planCombineAndFleetEvacuation,
} = require('../services/postHarvestShrinkageAndLogisticsEngine');
const {
  STAGE_KY_PROFILES,
  simulateStageWiseWaterAndThermalShock,
} = require('../services/cropPhenologyThermalShockService');

console.log('🧪 Running Sprint 21 National 37-State × 9-Crop Combinatorial Yield Permutation Matrix...');

// 1. Validate registry completeness
assert.strictEqual(
  Object.keys(AGRO_ECOLOGICAL_ZONE_PARAMETERS).length,
  6,
  'Expected 6 Nigerian agro-ecological zones'
);
assert.strictEqual(
  NATIONAL_STATE_AGRO_REGISTRY.length,
  37,
  'Expected 36 Nigerian states + FCT Abuja (37 jurisdictions)'
);
const allCrops = Object.keys(CROP_YIELD_POTENTIAL_SPEC);
assert.strictEqual(allCrops.length, 9, 'Expected 9 staple crops in yield benchmark spec');
assert.strictEqual(
  Object.keys(STAGE_KY_PROFILES).length,
  9,
  'Expected 9 staple crops in FAO-33 stage-wise Ky catalog'
);

// 2. Execute 37 Jurisdictions × 9 Crops × 3 Fertility Regimes = 999 Permutations
let totalPermutationsVerified = 0;

for (const stateEntry of NATIONAL_STATE_AGRO_REGISTRY) {
  for (const cropKey of allCrops) {
    const lowFertility = evaluateStateCropYieldBenchmark({
      stateCode: stateEntry.stateCode,
      cropKey,
      appliedNitrogenKgHa: 20,
      irrigationActive: false,
      certifiedHybridSeed: false,
    });

    const mediumFertility = evaluateStateCropYieldBenchmark({
      stateCode: stateEntry.stateCode,
      cropKey,
      appliedNitrogenKgHa: 90,
      irrigationActive: false,
      certifiedHybridSeed: true,
    });

    const highFertilityIrrigated = evaluateStateCropYieldBenchmark({
      stateCode: stateEntry.stateCode,
      cropKey,
      appliedNitrogenKgHa: 165,
      irrigationActive: true,
      certifiedHybridSeed: true,
    });

    // Lobell Yield Ceiling Invariant: Ya <= Yw <= Yp
    for (const scenario of [lowFertility, mediumFertility, highFertilityIrrigated]) {
      assert(
        scenario.predictedActualYieldYaTonsHa <= scenario.waterLimitedPotentialYwTonsHa,
        `Violation: Ya (${scenario.predictedActualYieldYaTonsHa}) > Yw (${scenario.waterLimitedPotentialYwTonsHa}) in ${stateEntry.stateCode} for ${cropKey}`
      );
      assert(
        scenario.waterLimitedPotentialYwTonsHa <= scenario.geneticPotentialTonsHa,
        `Violation: Yw (${scenario.waterLimitedPotentialYwTonsHa}) > Yp (${scenario.geneticPotentialTonsHa}) in ${stateEntry.stateCode} for ${cropKey}`
      );
      assert(
        scenario.totalYieldGapTonsHa >= 0,
        `Expected non-negative total yield gap in ${stateEntry.stateCode} for ${cropKey}`
      );
      assert(
        scenario.grossRevenuePerHaNgn > 0,
        `Expected positive gross revenue per ha in ${stateEntry.stateCode} for ${cropKey}`
      );
    }

    // Mitscherlich-Baule & Seed/Irrigation Monotonicity Invariant:
    // Low input < Medium input <= High input irrigated
    assert(
      mediumFertility.predictedActualYieldYaTonsHa >=
        lowFertility.predictedActualYieldYaTonsHa,
      `Expected medium fertility + hybrid seed yield >= low fertility in ${stateEntry.stateCode} for ${cropKey}`
    );
    assert(
      highFertilityIrrigated.predictedActualYieldYaTonsHa >=
        mediumFertility.predictedActualYieldYieldTonsHa ||
        highFertilityIrrigated.predictedActualYieldYaTonsHa >=
          mediumFertility.predictedActualYieldYaTonsHa,
      `Expected high fertility irrigated yield >= medium rainfed yield in ${stateEntry.stateCode} for ${cropKey}`
    );

    totalPermutationsVerified += 3;
  }
}

assert.strictEqual(
  totalPermutationsVerified,
  999,
  'Expected 999 state × crop × management permutations to be verified'
);

// 3. Verify National Harvest Balance Sheet & Strategic Grain Reserve (SGR) Silo Evacuation Coupling
for (const cropKey of allCrops) {
  const balanceSheet = generateNationalHarvestBalanceSheet(cropKey, {
    appliedNitrogenKgHa: 115,
    meanClusterAreaHa: 200,
  });

  assert.strictEqual(balanceSheet.jurisdictionCount, 37);
  assert(
    balanceSheet.totalNationalClusterTons > 0,
    `Expected positive national cluster tonnage for ${cropKey}`
  );

  // Couple top-producing state cluster with post-harvest shrinkage & fleet logistics
  const topState = balanceSheet.stateSummaries[0];
  const shrinkage = computePostHarvestShrinkageBalance({
    cropKey,
    grossWetWeightKg: topState.clusterProductionTons * 1000,
    tareWeightKg: 0,
  });
  const fleetPlan = planCombineAndFleetEvacuation({
    cropKey,
    areaHectares: topState.clusterAreaHa,
    predictedYieldTonsHa: topState.predictedActualYieldYaTonsHa,
    daysDelayedAfterMaturity: 2,
    activeCombineCount: 3,
  });
  const storageSafety = evaluateAflatoxinAndStorageSafety({
    cropKey,
    grainMoisturePct: CROP_POST_HARVEST_SPECS[cropKey].safeLongTermMoisturePct,
    grainTemperatureC: 26.5,
    hermeticPictBagging: true,
  });

  assert(shrinkage.netDeliverableSiloTons > 0);
  assert(fleetPlan.thirtyTonTrailersRequired >= 1);
  assert(storageSafety.safeStorageDays >= 10);
}

// 4. Verify FAO-33 Stage-Wise Water Deficit & Anthesis Heat Sterility across all 9 crops
for (const cropKey of allCrops) {
  const optimalRegime = simulateStageWiseWaterAndThermalShock({
    cropKey,
    potentialYieldYmTonsHa: 6.5,
    stageEtaRatios: [0.98, 0.98, 0.98, 0.98],
    anthesisMaxTempC: 31.0,
    heatWaveDaysDuringAnthesis: 0,
    foliarOsmoProtectantApplied: false,
  });

  const reproductiveDroughtAndHeatShock = simulateStageWiseWaterAndThermalShock({
    cropKey,
    potentialYieldYmTonsHa: 6.5,
    stageEtaRatios: [0.85, 0.52, 0.68, 0.80],
    anthesisMaxTempC: 40.5,
    heatWaveDaysDuringAnthesis: 5,
    foliarOsmoProtectantApplied: false,
  });

  const osmoProtectedDroughtAndHeatShock = simulateStageWiseWaterAndThermalShock({
    cropKey,
    potentialYieldYmTonsHa: 6.5,
    stageEtaRatios: [0.85, 0.52, 0.68, 0.80],
    anthesisMaxTempC: 40.5,
    heatWaveDaysDuringAnthesis: 5,
    foliarOsmoProtectantApplied: true,
  });

  assert.strictEqual(optimalRegime.stageDiagnostics.length, 4);
  assert(
    reproductiveDroughtAndHeatShock.stressedYieldTonsHa <
      optimalRegime.stressedYieldTonsHa,
    `Expected reproductive drought + heat shock to reduce yield for ${cropKey}`
  );
  assert(
    reproductiveDroughtAndHeatShock.pollenSterilityLossPct > 0,
    `Expected positive pollen sterility loss at 40.5°C for ${cropKey}`
  );
  assert(
    osmoProtectedDroughtAndHeatShock.stressedYieldTonsHa >
      reproductiveDroughtAndHeatShock.stressedYieldTonsHa,
    `Expected foliar osmo-protectant to mitigate drought & heat loss for ${cropKey}`
  );
}

console.log(
  `✅ Sprint 21 National Combinatorial Yield Matrix Passed (${totalPermutationsVerified} state-crop-input permutations + 27 FAO-33 thermal shock regimes verified)!`
);
