const assert = require('assert');
const {
  PARASITOID_GUILD_CATALOG,
  PUSH_PULL_ARCHITECTURES,
  IRAC_MOA_RESISTANCE_PROFILES,
  simulateParasitoidHollingSuppression,
  evaluatePushPullCompanionCropping,
  evaluatePheromoneLureVolatilization,
  simulateHardyWeinbergIracResistanceTrajectory,
} = require('../services/parasitoidBioFactoryAndPushPullEngine');

console.log('🧪 Running Sprint 22 Parasitoid Bio-Factory, Holling Type II & Push-Pull Companion Cropping Tests...');

// 1. Verify all 5 parasitoid guilds and 3 push-pull architectures
const guildKeys = Object.keys(PARASITOID_GUILD_CATALOG);
assert.strictEqual(guildKeys.length, 5, 'Expected 5 parasitoid guilds in catalog');
assert.strictEqual(
  Object.keys(PUSH_PULL_ARCHITECTURES).length,
  3,
  'Expected 3 Push-Pull companion cropping architectures'
);

// 2. Verify Holling Type II / Nicholson-Bailey dose-response monotonicity across all 5 guilds
for (const agentKey of guildKeys) {
  const lowRelease = simulateParasitoidHollingSuppression({
    agentKey,
    hostEggDensityPerHa: 90000,
    releaseCardsPerHa: 6,
    ambientFieldTempC: 27.5,
    clusterAreaHectares: 100,
  });

  const highRelease = simulateParasitoidHollingSuppression({
    agentKey,
    hostEggDensityPerHa: 90000,
    releaseCardsPerHa: 32,
    ambientFieldTempC: 27.5,
    clusterAreaHectares: 100,
  });

  const heatStressedRelease = simulateParasitoidHollingSuppression({
    agentKey,
    hostEggDensityPerHa: 90000,
    releaseCardsPerHa: 32,
    ambientFieldTempC: 40.5,
    clusterAreaHectares: 100,
  });

  assert(
    highRelease.parasitismEfficiencyPct > lowRelease.parasitismEfficiencyPct,
    `Expected higher parasitoid card density to increase parasitism % for ${agentKey}`
  );
  assert(
    highRelease.survivingPestLarvaePerHa < lowRelease.survivingPestLarvaePerHa,
    `Expected higher parasitoid release to leave fewer surviving larvae for ${agentKey}`
  );
  assert(
    heatStressedRelease.parasitismEfficiencyPct < highRelease.parasitismEfficiencyPct,
    `Expected 40.5°C extreme heat to reduce parasitoid searching fitness for ${agentKey}`
  );
}

// 3. Verify ICIPE Push-Pull Companion Cropping suppression & economic benefits
const climateSmartPushPull = evaluatePushPullCompanionCropping({
  systemKey: 'CLIMATE_SMART_PUSH_PULL',
  areaHectares: 10,
  baselinePestIncidencePct: 48.0,
  strigaInfestedSoil: true,
});

const conventionalIntercrop = evaluatePushPullCompanionCropping({
  systemKey: 'LEGUME_TRAP_STRIP_INTERCROP',
  areaHectares: 10,
  baselinePestIncidencePct: 48.0,
  strigaInfestedSoil: true,
});

assert(
  climateSmartPushPull.residualFawIncidencePct <
    conventionalIntercrop.residualFawIncidencePct,
  'Expected Climate-Smart Desmodium Push-Pull to achieve lower residual FAW incidence than simple strip intercrop'
);
assert(
  climateSmartPushPull.netAnnualMarginNgnHa > 0,
  'Expected positive net annual margin per hectare for Push-Pull system'
);

// 4. Verify Arrhenius pheromone lure volatilization kinetics
const coolFreshLure = evaluatePheromoneLureVolatilization({
  initialLoadingMg: 3.0,
  daysExposedInField: 5,
  meanAmbientTempC: 24.0,
  meanWindSpeedKmh: 10.0,
});

const hotAgedLure = evaluatePheromoneLureVolatilization({
  initialLoadingMg: 3.0,
  daysExposedInField: 32,
  meanAmbientTempC: 37.0,
  meanWindSpeedKmh: 24.0,
});

assert(
  coolFreshLure.remainingPheromoneMg > hotAgedLure.remainingPheromoneMg,
  'Expected fresh cool lure to retain more pheromone than 32-day hot/windy lure'
);
assert(
  coolFreshLure.totalEffectiveLifespanDays > hotAgedLure.totalEffectiveLifespanDays,
  'Expected cooler microclimate to extend pheromone septa effective field lifespan'
);
assert.strictEqual(hotAgedLure.replacementRequiredNow, true);

// 5. Verify Hardy-Weinberg IRAC Resistance Evolution & Refuge/Rotation Delay across all 5 MoA groups
const iracKeys = Object.keys(IRAC_MOA_RESISTANCE_PROFILES);
assert.strictEqual(iracKeys.length, 5, 'Expected 5 IRAC MoA resistance profiles');

for (const iracGroupCode of iracKeys) {
  const monocultureAbuse = simulateHardyWeinbergIracResistanceTrajectory({
    iracGroupCode,
    generationsSimulated: 18,
    unsprayedRefugeFraction: 0.0,
    rotateMoaEveryGeneration: false,
    biocontrolCoApplication: false,
  });

  const ipmRefugeAndRotation = simulateHardyWeinbergIracResistanceTrajectory({
    iracGroupCode,
    generationsSimulated: 18,
    unsprayedRefugeFraction: 0.25,
    rotateMoaEveryGeneration: true,
    biocontrolCoApplication: true,
  });

  assert.strictEqual(monocultureAbuse.trajectory.length, 18);
  assert(
    ipmRefugeAndRotation.finalAlleleFreqQ < monocultureAbuse.finalAlleleFreqQ,
    `Expected 25% refuge + MoA rotation + biocontrol to slow resistance allele q for ${iracGroupCode}`
  );
  assert(
    ipmRefugeAndRotation.finalControlEfficacyPct >
      monocultureAbuse.finalControlEfficacyPct,
    `Expected IPM refuge + rotation to preserve higher field control efficacy % for ${iracGroupCode}`
  );
}

// 6. Verify all 3 Push-Pull architectures across varying baseline pest pressure & Striga status
for (const systemKey of Object.keys(PUSH_PULL_ARCHITECTURES)) {
  const withStriga = evaluatePushPullCompanionCropping({
    systemKey,
    areaHectares: 25,
    baselinePestIncidencePct: 55.0,
    strigaInfestedSoil: true,
    ureaPriceNgnPerKgN: 1500,
    forageValueNgnPerTon: 130000,
  });

  const withoutStriga = evaluatePushPullCompanionCropping({
    systemKey,
    areaHectares: 25,
    baselinePestIncidencePct: 55.0,
    strigaInfestedSoil: false,
    ureaPriceNgnPerKgN: 1500,
    forageValueNgnPerTon: 130000,
  });

  assert(
    withStriga.totalGrainYieldUpliftTonsHa >
      withoutStriga.totalGrainYieldUpliftTonsHa,
    `Expected higher grain yield uplift when Striga suicidal germination is active in ${systemKey}`
  );
  assert(
    withStriga.totalClusterNetBenefitNgn > 0,
    `Expected positive 25-ha cluster net benefit for ${systemKey}`
  );
}

console.log('✅ All Sprint 22 Parasitoid Bio-Factory, Holling Type II, Push-Pull & Hardy-Weinberg IRAC tests passed!');
