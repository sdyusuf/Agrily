/**
 * ==============================================================================
 * 🧪 SPRINT 21 UNIT TESTS: MONTEITH BIOMASS, RIDGE REGRESSION & MONTE CARLO
 * ==============================================================================
 */

const assert = require('assert');
const {
  estimateLeafAreaIndexFromNdvi,
  computeFao33WaterYieldScalar,
  computeMitscherlichNutrientScalar,
  predictParcelHarvestYield,
  generateBiomassAccumulationCurve
} = require('../services/yieldBiomassRegressionEngine');
const { runYieldMonteCarloSimulation } = require('../services/yieldMonteCarloSimulationService');

console.log('🧪 Starting Monteith Biomass, Ridge Regression & Monte Carlo Yield Unit Tests...');

// 1. Leaf Area Index (LAI) & FAO-33 Water Deficit Scalar
{
  const laiHigh = estimateLeafAreaIndexFromNdvi(0.80);
  const laiLow = estimateLeafAreaIndexFromNdvi(0.32);
  assert.ok(laiHigh > 3.5 && laiHigh > laiLow);

  const ksOptimal = computeFao33WaterYieldScalar(660, 650, 1.25);
  const ksDrought = computeFao33WaterYieldScalar(325, 650, 1.25);
  assert.strictEqual(ksOptimal, 1.0);
  assert.ok(ksDrought < 0.55, `Expected drought Ks < 0.55, got ${ksDrought}`);
  console.log('  ✓ Beer-Lambert LAI inversion and FAO-33 Ky water deficit response verified');
}

// 2. Mitscherlich-Baule NPK Nutrient Response & Ensemble Yield Prediction
{
  const lowFert = predictParcelHarvestYield({
    cropType: 'Maize',
    cultivarCode: 'SAMMAZ-15',
    areaHectares: 20.0,
    peakNdvi: 0.45,
    seasonalRainfallMm: 420,
    appliedNitrogenKgHa: 30,
    pestDiseaseLossPct: 15
  });

  const highFert = predictParcelHarvestYield({
    cropType: 'Maize',
    cultivarCode: 'SAMMAZ-15',
    areaHectares: 20.0,
    peakNdvi: 0.82,
    seasonalRainfallMm: 660,
    appliedNitrogenKgHa: 125,
    pestDiseaseLossPct: 2
  });

  assert.ok(
    highFert.predictedYieldTonsPerHa > lowFert.predictedYieldTonsPerHa * 1.6,
    `High management yield (${highFert.predictedYieldTonsPerHa}) must significantly exceed stressed yield (${lowFert.predictedYieldTonsPerHa})`
  );
  assert.strictEqual(highFert.featureAttributions.length, 5);
  console.log('  ✓ Hybrid Monteith + Ridge Regression ensemble responds accurately to NDVI, water, and NPK');
}

// 3. Sigmoidal Biomass & Partitioning Growth Curve
{
  const forecast = predictParcelHarvestYield({
    cropType: 'Rice',
    cultivarCode: 'FARO-44',
    areaHectares: 15.0,
    peakNdvi: 0.78
  });
  const curve = generateBiomassAccumulationCurve(forecast);
  assert.strictEqual(curve.length, 7);
  assert.strictEqual(curve[0].harvestableYieldTonsHa, 0);
  assert.ok(curve[6].totalBiomassTonsHa > curve[2].totalBiomassTonsHa);
  assert.ok(curve[6].harvestableYieldTonsHa > 0);
  console.log('  ✓ Sigmoidal dry-matter biomass and grain-fill partitioning curve verified');
}

// 4. Monte Carlo Stochastic Quantiles (P10 < P50 < P90)
{
  const mc = runYieldMonteCarloSimulation(
    {
      cropType: 'Maize',
      cultivarCode: 'SAMMAZ-15',
      areaHectares: 24.5,
      peakNdvi: 0.76,
      seasonalRainfallMm: 640,
      appliedNitrogenKgHa: 115
    },
    200
  );

  assert.strictEqual(mc.iterations, 200);
  assert.ok(
    mc.p10DownsideTonsPerHa < mc.p50MedianTonsPerHa &&
      mc.p50MedianTonsPerHa < mc.p90UpsideTonsPerHa,
    `Expected P10 (${mc.p10DownsideTonsPerHa}) < P50 (${mc.p50MedianTonsPerHa}) < P90 (${mc.p90UpsideTonsPerHa})`
  );
  assert.ok(mc.p90GrossRevenueNgn > mc.p10GrossRevenueNgn);
  console.log('  ✓ 200-iteration Monte Carlo simulation satisfies P10 < P50 < P90 quantile ordering');
}

console.log('✅ All Monteith Biomass, Ridge Regression & Monte Carlo Yield tests passed!');
