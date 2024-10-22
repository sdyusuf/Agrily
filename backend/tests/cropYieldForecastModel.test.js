/**
 * ==============================================================================
 * 🧪 SPRINT 21 UNIT TESTS: CROP YIELD FORECAST, HARVEST & CULTIVAR SCHEMAS
 * ==============================================================================
 */

const assert = require('assert');
const CropYieldForecast = require('../models/CropYieldForecast');
const HistoricalHarvestRecord = require('../models/HistoricalHarvestRecord');
const CultivarBiomassProfile = require('../models/CultivarBiomassProfile');

console.log('🧪 Starting CropYieldForecast, HistoricalHarvestRecord & Cultivar Schema Tests...');

// 1. CropYieldForecast Synchronous Defaults & Executive Summary
{
  const forecast = new CropYieldForecast({
    parcelCode: 'NG-MAI-KANO4B',
    parcelName: 'Kano North Irrigation Plot 4B',
    cropType: 'Maize',
    cultivarCode: 'SAMMAZ-15',
    areaHectares: 24.5,
    mechanisticBiomassTonsHa: 12.8,
    harvestIndexEffective: 0.48,
    predictedYieldTonsPerHa: 6.14,
    monteCarloConfidence: {
      p10DownsideTonsPerHa: 5.12,
      p50MedianTonsPerHa: 6.14,
      p90UpsideTonsPerHa: 7.08
    }
  });

  const err = forecast.validateSync();
  assert.strictEqual(err, undefined, 'Valid CropYieldForecast must validate without errors');
  assert.ok(forecast.forecastCode.startsWith('YLD-MAI-'));
  assert.strictEqual(forecast.totalHarvestTonnage, 150.43); // 6.14 * 24.5 = 150.43
  assert.strictEqual(forecast.commercialEquivalents.estimatedBagsCount, 1504);
  assert.strictEqual(forecast.commercialEquivalents.thirtyTonTrailersRequired, 6);

  const summary = forecast.getExecutiveSummary();
  assert.strictEqual(summary.parcelCode, 'NG-MAI-KANO4B');
  assert.strictEqual(summary.totalHarvestTonnage, 150.43);
  console.log('  ✓ CropYieldForecast computes total harvest tonnage, bag counts, trailers, and revenue');
}

// 2. HistoricalHarvestRecord Grain Drying Shrinkage & MAPE Residual Calculation
{
  const record = new HistoricalHarvestRecord({
    parcelCode: 'NG-MAI-KANO4B',
    cropType: 'Maize',
    cultivarCode: 'SAMMAZ-15',
    harvestSeasonLabel: '2023 Wet Season',
    harvestedAreaHectares: 20.0,
    wetHarvestedTonnage: 130.0,
    harvestMoisturePct: 20.0,
    standardCommercialMoisturePct: 13.0,
    preHarvestPredictedYieldTonsPerHa: 5.8
  });

  const err = record.validateSync();
  assert.strictEqual(err, undefined);
  // Dry weight adjustment: 130 * (100 - 20) / (100 - 13) = 130 * 80 / 87 = 119.54 tons
  assert.strictEqual(record.dryAdjustedCommercialTonnage, 119.54);
  // Actual yield per ha: 119.54 / 20 = 5.98 t/ha
  assert.strictEqual(record.actualYieldTonsPerHa, 5.98);
  // Error: |5.98 - 5.80| / 5.98 * 100 = 3.01%
  assert.ok(record.absolutePercentageErrorPct > 2.9 && record.absolutePercentageErrorPct < 3.1);
  console.log('  ✓ HistoricalHarvestRecord computes commercial moisture shrinkage and MAPE residual');
}

// 3. CultivarBiomassProfile Validation
{
  const cultivar = new CultivarBiomassProfile({
    cultivarCode: 'SAMMAZ-15',
    cultivarName: 'IITA Drought-Tolerant Open Pollinated Maize',
    cropType: 'Maize',
    maturityDays: 110,
    radiationUseEfficiencyGramPerMjPar: 3.75,
    canopyExtinctionCoefficientK: 0.65,
    baselineHarvestIndex: 0.49,
    fao33WaterYieldResponseKy: 1.25,
    geneticPotentialYieldTonsPerHa: 8.2
  });

  const err = cultivar.validateSync();
  assert.strictEqual(err, undefined);
  assert.strictEqual(cultivar.radiationUseEfficiencyGramPerMjPar, 3.75);
  console.log('  ✓ CultivarBiomassProfile validates RUE, extinction coefficient, and FAO-33 Ky parameters');
}

console.log('✅ All CropYieldForecast, HistoricalHarvestRecord & Cultivar Schema tests passed!');
