/**
 * ==============================================================================
 * AGRILY BACKEND TEST SUITE - AGROCHEMICAL RESISTANCE RISK & ROTATION ENGINE
 * ==============================================================================
 * 
 * Verifies:
 * 1. FRAC and IRAC chemical metadata indexing and fuzzy matching.
 * 2. Consecutive application tracking and streak detection.
 * 3. Mandatory rotation enforcement when max safe threshold is exceeded.
 * 4. Multi-site contact protectant (FRAC M) tank mix pairing generation.
 * 5. Full seasonal rotation calendar generation.
 * 
 * @module tests/agrochemicalResistanceRiskEngine.test
 */

'use strict';

const assert = require('assert');
const {
  AgrochemicalResistanceRiskEngine,
  AGROCHEMICAL_CLASSIFICATIONS
} = require('../services/agrochemicalResistanceRiskEngine');

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
  console.log('\n🧪 Starting Agrochemical Resistance Risk Engine Tests...\n');

  // Test 1: Chemical Metadata Lookup
  await runTest('getChemicalMetadata should resolve active ingredients and trade names accurately', async () => {
    const azoxy = AgrochemicalResistanceRiskEngine.getChemicalMetadata('Amistar');
    assert.ok(azoxy, 'Amistar trade name should resolve');
    assert.strictEqual(azoxy.fracCode, '11');
    assert.strictEqual(azoxy.resistanceRisk, 'HIGH');

    const mancozeb = AgrochemicalResistanceRiskEngine.getChemicalMetadata('mancozeb');
    assert.strictEqual(mancozeb.fracCode, 'M03');
    assert.strictEqual(mancozeb.resistanceRisk, 'LOW');

    const neem = AgrochemicalResistanceRiskEngine.getChemicalMetadata('Neem Oil');
    assert.strictEqual(neem.type, 'ORGANIC_BOTANICAL');
  });

  // Test 2: Low-risk single application evaluation
  await runTest('evaluateResistanceRisk should approve first application of single-site chemical', async () => {
    const history = [];
    const evaluation = AgrochemicalResistanceRiskEngine.evaluateResistanceRisk({
      sprayHistory: history,
      proposedChemical: 'AZOXYSTROBIN',
      cropName: 'Tomato'
    });

    assert.strictEqual(evaluation.consecutiveSpraysCount, 1);
    assert.strictEqual(evaluation.rotationMandatory, false);
    assert.ok(evaluation.advisoryWarning.includes('COMPLIANT'));
    assert.ok(evaluation.recommendedRotationPartners.length > 0);
  });

  // Test 3: Detection of excessive consecutive applications (FRAC Violation)
  await runTest('evaluateResistanceRisk should trigger critical resistance alert on consecutive repeat sprays', async () => {
    const history = [
      { chemicalName: 'Amistar (Azoxystrobin)', date: '2024-08-10' },
      { chemicalName: 'Heritage (Azoxystrobin)', date: '2024-08-20' }
    ];

    // Proposing 3rd consecutive spray of FRAC 11
    const evaluation = AgrochemicalResistanceRiskEngine.evaluateResistanceRisk({
      sprayHistory: history,
      proposedChemical: 'AZOXYSTROBIN',
      cropName: 'Tomato'
    });

    assert.strictEqual(evaluation.consecutiveSpraysCount, 3);
    assert.strictEqual(evaluation.rotationMandatory, true, '3 consecutive sprays of FRAC 11 must be rejected');
    assert.strictEqual(evaluation.resistanceRiskLevel, 'CRITICAL_HIGH');
    assert.ok(evaluation.advisoryWarning.includes('CRITICAL RESISTANCE ALERT'));
    assert.ok(evaluation.recommendedRotationPartners.some((p) => p.code.includes('M03') || p.code.includes('M01')));
  });

  // Test 4: Streak reset on proper MoA rotation
  await runTest('evaluateResistanceRisk should reset consecutive streak when rotated to multi-site protectant', async () => {
    const history = [
      { chemicalName: 'Azoxystrobin', date: '2024-08-10' },
      { chemicalName: 'Azoxystrobin', date: '2024-08-20' },
      { chemicalName: 'Mancozeb 80% WP', date: '2024-08-30' } // Rotated to FRAC M03
    ];

    const evaluation = AgrochemicalResistanceRiskEngine.evaluateResistanceRisk({
      sprayHistory: history,
      proposedChemical: 'AZOXYSTROBIN',
      cropName: 'Tomato'
    });

    // Streak of FRAC 11 was broken by Mancozeb (M03)
    assert.strictEqual(evaluation.consecutiveSpraysCount, 1);
    assert.strictEqual(evaluation.rotationMandatory, false);
  });

  // Test 5: Seasonal rotation schedule generator
  await runTest('buildSeasonalSpraySchedule should construct balanced alternating season plan', async () => {
    const schedule = AgrochemicalResistanceRiskEngine.buildSeasonalSpraySchedule('TOMATO', 8);
    assert.strictEqual(schedule.length, 8);
    assert.strictEqual(schedule[0].week, 1);
    assert.strictEqual(schedule[7].week, 8);
    // Last week before harvest should be organic botanical or zero PHI
    assert.strictEqual(schedule[7].estimatedPHIWithdrawalDays, 0);
  });

  console.log(`\n🎉 Agrochemical Resistance Risk Engine Tests: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

runSuite().catch((err) => {
  console.error('Resistance Risk test runner error:', err);
  process.exit(1);
});
