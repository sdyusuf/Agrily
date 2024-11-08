const assert = require('assert');
const {
  PEST_ENTOMOLOGY_CATALOG,
  evaluatePestDegreeDayPhenology,
  calculatePedigoEconomicInjuryLevel,
} = require('../services/pestPhenologyAndEilEngine');
const {
  generatePestOutbreakKdeSurface,
} = require('../services/pestSpatialKernelDensityService');

console.log('🧪 Starting Sprint 22 Degree-Day Phenology, Pedigo EIL/ET & Spatial KDE Unit Tests...');

// 1. Verify all 10 tropical pest profiles exist in catalog
const pestKeys = Object.keys(PEST_ENTOMOLOGY_CATALOG);
assert.strictEqual(pestKeys.length, 10, 'Expected 10 tropical pest species in catalog');

// 2. Verify Baskerville-Emin degree-day progression from L1/L2 to L5/L6
const earlyInstar = evaluatePestDegreeDayPhenology({
  pestKey: 'FALL_ARMYWORM',
  dailyMinTempC: 21.0,
  dailyMaxTempC: 31.0,
  accumulatedGddOverride: 95,
});
assert.strictEqual(earlyInstar.activeStageCode, 'L1_L2_EARLY_INSTAR');
assert.strictEqual(earlyInstar.optimalBiocontrolWindowOpen, true);

const lateInstar = evaluatePestDegreeDayPhenology({
  pestKey: 'FALL_ARMYWORM',
  dailyMinTempC: 21.0,
  dailyMaxTempC: 31.0,
  accumulatedGddOverride: 295,
});
assert.strictEqual(lateInstar.activeStageCode, 'L5_L6_LATE_BORING');
assert.strictEqual(lateInstar.optimalBiocontrolWindowOpen, false);
console.log('  ✓ Baskerville-Emin degree-day larval instar clock & spray window verified');

// 3. Verify Pedigo EIL & ET bio-economic decision invariants
const lowIncidenceEil = calculatePedigoEconomicInjuryLevel({
  pestKey: 'FALL_ARMYWORM',
  observedIncidencePct: 5.0,
  davisDamageScale: 2,
  expectedYieldTonsHa: 5.0,
  cropPriceNgnPerTon: 685000,
});
assert(
  lowIncidenceEil.economicThresholdPct < lowIncidenceEil.economicInjuryLevelPct,
  'Expected ET < EIL'
);
assert.strictEqual(lowIncidenceEil.exceedsEconomicThreshold, false);

const severeOutbreakEil = calculatePedigoEconomicInjuryLevel({
  pestKey: 'FALL_ARMYWORM',
  observedIncidencePct: 38.0,
  davisDamageScale: 7,
  expectedYieldTonsHa: 5.0,
  cropPriceNgnPerTon: 685000,
});
assert.strictEqual(severeOutbreakEil.exceedsEconomicInjuryLevel, true);
assert(
  severeOutbreakEil.benefitCostRatio > 1.5,
  'Expected strong positive Benefit-Cost Ratio (>1.5) when treating severe outbreak'
);
console.log('  ✓ Pedigo EIL/ET threshold and Benefit-Cost Ratio verified');

// 4. Verify 2D Gaussian KDE spatial surface & 64-cell heatmap grid
const kdeSurface = generatePestOutbreakKdeSurface({
  pestKey: 'FALL_ARMYWORM',
  bandwidthKm: 185,
});
assert.strictEqual(kdeSurface.corridorCount, 12);
assert.strictEqual(kdeSurface.gridCells.length, 64);
assert(
  kdeSurface.corridors.every((c) => c.displacement72hKm > 0),
  'Expected positive 72h wind displacement across all sentinel corridors'
);
console.log('  ✓ 2D Gaussian KDE hotspot surface and 64-cell spatial grid verified');

console.log('✅ All Sprint 22 Degree-Day Phenology, Pedigo EIL/ET & Spatial KDE tests passed!');
