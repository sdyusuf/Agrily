/**
 * ==============================================================================
 * 🛰️ SATELLITE PHENOLOGY HARMONICS & LAND SURFACE PHENOLOGY TEST MATRIX
 * ==============================================================================
 * 
 * Verifies:
 * 1. Fourier Harmonic Decomposition (Annual vs Semi-Annual components):
 *    - Amplitudes, phase angles, and bimodal ratios.
 * 2. Unimodal vs Bimodal Regime Classification:
 *    - Unimodal Savanna in Northern Nigeria (single monsoon rainfall peak).
 *    - Bimodal Rainforest in Southern Nigeria (early season + late season with August break).
 * 3. Seasonal Transition Markers (LSP):
 *    - Start of Season (SOS), Peak of Season (POS), End of Season (EOS), Length of Season (LOS).
 * 4. Biomass Productivity Integrals.
 * 
 * @module tests/satellitePhenologyHarmonicsMatrix.test
 * ==============================================================================
 */

'use strict';

const assert = require('assert');
const {
  satellitePhenologyHarmonicsEngine,
  NIGERIAN_PHENOLOGY_REGIMES
} = require('../services/satellitePhenologyHarmonicsEngine');

let passed = 0;
let failed = 0;

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function runSuite() {
  console.log('\n🛰️ Starting Satellite Phenology Harmonics Matrix Tests...\n');

  // Test 1: Phenology regime reference presets
  await runTest('NIGERIAN_PHENOLOGY_REGIMES should define characteristics for all major ecological zones', async () => {
    assert.ok(NIGERIAN_PHENOLOGY_REGIMES.UNIMODAL_SAVANNA, 'UNIMODAL_SAVANNA must exist');
    assert.ok(NIGERIAN_PHENOLOGY_REGIMES.BIMODAL_RAINFOREST, 'BIMODAL_RAINFOREST must exist');
    assert.ok(NIGERIAN_PHENOLOGY_REGIMES.TRANSITIONAL_GUINEA, 'TRANSITIONAL_GUINEA must exist');

    assert.strictEqual(NIGERIAN_PHENOLOGY_REGIMES.UNIMODAL_SAVANNA.dominantHarmonic, 1);
    assert.strictEqual(NIGERIAN_PHENOLOGY_REGIMES.BIMODAL_RAINFOREST.dominantHarmonic, 2);
  });

  // Test 2: Unimodal series harmonic decomposition (Kano Maize)
  await runTest('computeHarmonicDecomposition should detect unimodal regime for single-season Savanna data', async () => {
    // Single unimodal bell curve peaking around DOY 240 (late August)
    const unimodalSeries = [
      { dayOfYear: 30, ndvi: 0.15 },
      { dayOfYear: 90, ndvi: 0.18 },
      { dayOfYear: 150, ndvi: 0.32 },
      { dayOfYear: 190, ndvi: 0.58 },
      { dayOfYear: 240, ndvi: 0.78 },
      { dayOfYear: 280, ndvi: 0.52 },
      { dayOfYear: 330, ndvi: 0.22 }
    ];

    const harmonics = satellitePhenologyHarmonicsEngine.computeHarmonicDecomposition(unimodalSeries);

    assert.ok(harmonics.annualHarmonic.amplitude > 0.20, 'Annual amplitude should be strong');
    assert.strictEqual(harmonics.regimeDetected, 'UNIMODAL_REGIME');
    assert.ok(harmonics.bimodalRatio <= 0.45, 'Bimodal ratio should be <= 0.45');
  });

  // Test 3: Bimodal series harmonic decomposition (Oyo Cassava/Maize intercrop)
  await runTest('computeHarmonicDecomposition should detect bimodal regime for twin-peak Southern series', async () => {
    // Twin peaks around DOY 170 (June) and DOY 290 (October), dip in August (DOY 230)
    const bimodalSeries = [
      { dayOfYear: 30, ndvi: 0.25 },
      { dayOfYear: 90, ndvi: 0.38 },
      { dayOfYear: 170, ndvi: 0.72 },
      { dayOfYear: 225, ndvi: 0.42 }, // August break dip
      { dayOfYear: 290, ndvi: 0.68 },
      { dayOfYear: 340, ndvi: 0.30 }
    ];

    const harmonics = satellitePhenologyHarmonicsEngine.computeHarmonicDecomposition(bimodalSeries);

    assert.ok(harmonics.semiAnnualHarmonic.amplitude > 0.05, 'Semi-annual amplitude should be significant');
    assert.strictEqual(harmonics.regimeDetected, 'BIMODAL_REGIME');
    assert.ok(harmonics.bimodalRatio > 0.45, 'Bimodal ratio should exceed 0.45');
  });

  // Test 4: End-to-end phenology transition metrics extraction
  await runTest('extractPhenologyTransitionMetrics should extract accurate SOS, POS, EOS, and season length', async () => {
    const savannaSeries = [
      { dayOfYear: 30, ndvi: 0.15 },
      { dayOfYear: 90, ndvi: 0.18 },
      { dayOfYear: 150, ndvi: 0.35 },
      { dayOfYear: 195, ndvi: 0.62 },
      { dayOfYear: 240, ndvi: 0.76 },
      { dayOfYear: 285, ndvi: 0.48 },
      { dayOfYear: 330, ndvi: 0.20 }
    ];

    const result = satellitePhenologyHarmonicsEngine.extractPhenologyTransitionMetrics(savannaSeries, 'KADUNA');

    assert.strictEqual(result.stateContext, 'KADUNA');
    assert.ok(result.phenologyTransitions.startOfSeasonDoy >= 100 && result.phenologyTransitions.startOfSeasonDoy <= 200);
    assert.ok(result.phenologyTransitions.peakOfSeasonDoy >= 200 && result.phenologyTransitions.peakOfSeasonDoy <= 280);
    assert.ok(result.phenologyTransitions.endOfSeasonDoy >= 270 && result.phenologyTransitions.endOfSeasonDoy <= 365);
    assert.ok(result.phenologyTransitions.lengthOfSeasonDays > 60);
    assert.ok(result.seasonalProductivity.largeIntegralBiomassProxy > 0);
  });

  // Test 5: Error handling on insufficient temporal data points
  await runTest('computeHarmonicDecomposition should throw when fewer than 4 points provided', async () => {
    assert.throws(() => {
      satellitePhenologyHarmonicsEngine.computeHarmonicDecomposition([{ dayOfYear: 10, ndvi: 0.3 }]);
    }, /A minimum of 4 temporal observations/);
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Fatal suite failure:', err);
  process.exit(1);
});
