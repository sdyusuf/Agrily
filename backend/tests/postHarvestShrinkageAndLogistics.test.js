const assert = require('assert');
const {
  CROP_POST_HARVEST_SPECS,
  computePostHarvestShrinkageBalance,
  evaluateAflatoxinAndStorageSafety,
  planCombineAndFleetEvacuation,
} = require('../services/postHarvestShrinkageAndLogisticsEngine');

console.log('🧪 Running Sprint 21 Post-Harvest Shrinkage, Aflatoxin & Fleet Logistics Tests...');

// 1. Verify all 9 crops exist in post-harvest specification catalog
const cropKeys = Object.keys(CROP_POST_HARVEST_SPECS);
assert.strictEqual(cropKeys.length, 9, 'Expected 9 staple crop post-harvest profiles');

// 2. Verify commercial moisture shrinkage mass balance across all 9 crops
for (const cropKey of cropKeys) {
  const spec = CROP_POST_HARVEST_SPECS[cropKey];
  const wetResult = computePostHarvestShrinkageBalance({
    cropKey,
    grossWetWeightKg: 42000,
    tareWeightKg: 14000,
    harvestMoisturePct: Math.min(70, spec.standardMoisturePct + 4.5),
    targetMoisturePct: spec.standardMoisturePct,
    foreignMatterPct: 1.6,
    brokenKernelsPct: 1.5,
  });

  assert.strictEqual(wetResult.wetScaleNetKg, 28000);
  assert(
    wetResult.netDeliverableSiloKg < wetResult.wetScaleNetKg,
    `Expected net deliverable silo weight < wet scale weight for ${cropKey}`
  );
  assert(
    wetResult.waterEvaporatedKg > 0,
    `Expected positive water evaporation for wet ${cropKey}`
  );
  assert(
    wetResult.thermalEnergyMj > 0 && wetResult.lpgFuelEquivalentKg > 0,
    `Expected positive thermal drying energy for ${cropKey}`
  );
}

// 3. Verify Aflatoxin B1 & Equilibrium Relative Humidity (ERH) safety invariants
const dryCoolSafety = evaluateAflatoxinAndStorageSafety({
  cropKey: 'MAIZE',
  grainMoisturePct: 12.2,
  grainTemperatureC: 23.0,
  ambientRelativeHumidityPct: 52.0,
  hermeticPictBagging: true,
});

const wetHotHazard = evaluateAflatoxinAndStorageSafety({
  cropKey: 'MAIZE',
  grainMoisturePct: 19.4,
  grainTemperatureC: 33.5,
  ambientRelativeHumidityPct: 84.0,
  hermeticPictBagging: false,
});

assert(
  wetHotHazard.aflatoxinRiskScore > dryCoolSafety.aflatoxinRiskScore,
  'Expected wet/warm grain to have higher aflatoxin risk score than dry/hermetic grain'
);
assert(
  dryCoolSafety.safeStorageDays > wetHotHazard.safeStorageDays,
  'Expected dry/hermetic grain to have longer safe storage duration than wet/warm grain'
);

// 4. Verify combine harvester & 30-ton fleet evacuation planner
const earlyHarvestPlan = planCombineAndFleetEvacuation({
  cropKey: 'MAIZE',
  areaHectares: 45,
  predictedYieldTonsHa: 5.2,
  daysDelayedAfterMaturity: 0,
  activeCombineCount: 2,
});

const delayedHarvestPlan = planCombineAndFleetEvacuation({
  cropKey: 'MAIZE',
  areaHectares: 45,
  predictedYieldTonsHa: 5.2,
  daysDelayedAfterMaturity: 12,
  activeCombineCount: 2,
});

assert(
  delayedHarvestPlan.fieldLossTons > earlyHarvestPlan.fieldLossTons,
  'Expected delayed harvest to incur higher shattering loss'
);
assert(
  earlyHarvestPlan.thirtyTonTrailersRequired >= 8,
  'Expected at least 8 30-ton trailers for ~229 tons of maize'
);
assert(
  earlyHarvestPlan.standardBagsRequired > 4000,
  'Expected >4,000 50kg bags for ~229 tons of maize'
);

console.log('✅ Sprint 21 Post-Harvest Shrinkage, Aflatoxin & Fleet Logistics Tests Passed!');
