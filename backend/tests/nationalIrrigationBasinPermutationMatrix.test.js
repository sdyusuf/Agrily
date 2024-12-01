/**
 * ==============================================================================
 * 🧪 AGRILY SPRINT 23: NATIONAL 12-RBDA IRRIGATION ALLOCATION, RHOADES SALINITY
 *    LEACHING, IRRI SAFE-AWD RICE & STEWART RDI PERMUTATION MATRIX TESTS
 * ==============================================================================
 */

const assert = require('assert');
const {
  MAAS_HOFFMAN_SALINITY_CATALOG,
  evaluateSalinitySodicityAndLeaching,
  evaluateIrriSafeAwdRiceSchedule,
  optimizeRegulatedDeficitIrrigation,
} = require('../services/regulatedDeficitAndSalinityEngine');
const {
  NIGERIAN_RIVER_BASIN_AUTHORITIES,
  evaluateRiverBasinSeasonalAllocation,
  evaluateNationalIrrigationBasinMatrix,
} = require('../services/nationalRiverBasinAllocationEngine');

console.log(
  '🧪 Starting Sprint 23 National 12-RBDA Irrigation, Salinity Leaching, Safe-AWD & RDI Permutation Tests...'
);

// 1. Test Rhoades FAO-29 Salinity Leaching, Maas-Hoffman Yield, SAR & Gypsum
{
  const lowSalinity = evaluateSalinitySodicityAndLeaching({
    cropKey: 'TOMATO_IRRIGATED',
    irrigationWaterEcDsm: 0.8,
    soilSaturationExtractEceDsm: 1.8,
    sodiumMeqL: 3.2,
    calciumMeqL: 4.5,
    magnesiumMeqL: 2.1,
    isHighFrequencyDrip: true,
    netCropWaterNeedMm: 50.0,
  });

  const highSalinitySodic = evaluateSalinitySodicityAndLeaching({
    cropKey: 'ONION_BULB',
    irrigationWaterEcDsm: 3.2,
    soilSaturationExtractEceDsm: 4.8,
    sodiumMeqL: 22.0,
    calciumMeqL: 2.2,
    magnesiumMeqL: 1.4,
    cecCmolKg: 16.0,
    isHighFrequencyDrip: false,
    netCropWaterNeedMm: 50.0,
  });

  assert.strictEqual(lowSalinity.relativeYieldPct, 100);
  assert.strictEqual(
    lowSalinity.sodicityHazardBand,
    'LOW_SODICITY_OPTIMAL_INFILTRATION'
  );
  assert.ok(highSalinitySodic.relativeYieldPct < 60);
  assert.ok(highSalinitySodic.sarValue > 12);
  assert.strictEqual(
    highSalinitySodic.sodicityHazardBand,
    'SEVERE_SODIC_DISPERSION_GYPSUM_MANDATORY'
  );
  assert.ok(highSalinitySodic.gypsumRequirementTonnesHa > 1.5);
  assert.ok(
    highSalinitySodic.totalGrossDepthWithLeachingMm >
      lowSalinity.totalGrossDepthWithLeachingMm
  );
  console.log(
    '  ✓ Rhoades FAO-29 leaching fraction, Maas-Hoffman yield response, SAR & gypsum verified'
  );
}

// 2. Test IRRI Safe-AWD Field Water Tube & IPCC Tier-2 Methane Abatement
{
  const vegReflood = evaluateIrriSafeAwdRiceSchedule({
    fieldWaterTubeDepthCm: -16.0,
    phenologyStage: 'VEGETATIVE_TILLERING',
    fieldAreaHectares: 20.0,
    daysCultivationPeriod: 115,
  });

  const vegAeration = evaluateIrriSafeAwdRiceSchedule({
    fieldWaterTubeDepthCm: -8.5,
    phenologyStage: 'VEGETATIVE_TILLERING',
    fieldAreaHectares: 20.0,
  });

  const floweringLock = evaluateIrriSafeAwdRiceSchedule({
    fieldWaterTubeDepthCm: 1.0,
    phenologyStage: 'FLOWERING_HEADING',
    fieldAreaHectares: 20.0,
  });

  assert.strictEqual(vegReflood.awdRefloodTriggered, true);
  assert.ok(vegReflood.requiredRefloodDepthMm > 90);
  assert.strictEqual(vegAeration.awdRefloodTriggered, false);
  assert.strictEqual(
    vegAeration.advisoryStatus,
    'AERATION_PHASE_ACTIVE_ROOT_OXYGENATION'
  );
  assert.strictEqual(floweringLock.isFloweringSensitiveWindow, true);
  assert.strictEqual(
    floweringLock.advisoryStatus,
    'FLOWERING_LOCK_MAINTAIN_5CM_PONDING'
  );
  assert.ok(vegReflood.abatedCh4KgPerHa > 60);
  assert.ok(vegReflood.totalAbatedCo2eTonnes > 30);
  console.log(
    '  ✓ IRRI Safe-AWD field water tube (-15 cm trigger & flowering lock) and CH4 carbon credits verified'
  );
}

// 3. Test Stewart-Doorenbos Regulated Deficit Irrigation (RDI) Stage Optimizer
{
  for (const cropKey of Object.keys(MAAS_HOFFMAN_SALINITY_CATALOG)) {
    const rdi = optimizeRegulatedDeficitIrrigation({
      cropKey,
      seasonalMaxEtMm: 650,
      waterSupplyAllocationPct: 78,
    });
    assert.strictEqual(rdi.stageAllocations.length, 4);
    assert.ok(
      rdi.optimizedYieldTonnesHa >= rdi.naiveUniformYieldTonnesHa,
      `RDI must outperform or equal naive uniform deficit for ${cropKey}`
    );
    assert.ok(rdi.optimizedRdiCwpKgM3 > 0);
  }
  console.log(
    '  ✓ Stewart-Doorenbos stage-wise Regulated Deficit Irrigation (RDI) CWP optimization verified'
  );
}

// 4. Test All 12 Nigerian River Basin Development Authorities (RBDAs)
{
  assert.strictEqual(NIGERIAN_RIVER_BASIN_AUTHORITIES.length, 12);

  const nationalMatrix = evaluateNationalIrrigationBasinMatrix({
    currentStorageFillPct: 76.0,
  });

  assert.strictEqual(nationalMatrix.totalBasinsEvaluated, 12);
  assert.ok(nationalMatrix.totalDesignStorageMcm > 10000);
  assert.ok(nationalMatrix.totalActiveIrrigatedHa > 100000);
  assert.ok(nationalMatrix.totalAbatedCo2eTonnes > 50000);

  for (const report of nationalMatrix.basinReports) {
    assert.ok(report.netAllocatableWaterMcm > 0);
    assert.ok(report.warabandiHoursPerBlock > 5);
    assert.ok(report.fao56Sample.tawMm > 50);
    assert.ok(report.salinityEval.totalGrossDepthWithLeachingMm > 0);
  }
  console.log(
    `  ✓ All ${nationalMatrix.totalBasinsEvaluated} Nigerian River Basin Development Authorities (RBDAs) verified`
  );
}

console.log(
  '✅ All Sprint 23 National 12-RBDA Irrigation, Salinity Leaching, Safe-AWD & RDI tests passed!'
);
