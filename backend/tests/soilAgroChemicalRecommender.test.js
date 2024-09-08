/**
 * ==============================================================================
 * AGRILY BACKEND TEST SUITE - SOIL AGRO-CHEMICAL NUTRITION & TANK MIX RECOMMENDER
 * ==============================================================================
 * 
 * Verifies:
 * 1. Tropical crop soil NPK ratio and optimal pH evaluation.
 * 2. Acidic vs alkaline corrective amendment recommendations (lime vs sulfur).
 * 3. Water spray pH conditioning and alkaline hydrolysis prevention buffer advice.
 * 4. Tank-mixing physical/chemical compatibility matrix rules.
 * 
 * @module tests/soilAgroChemicalRecommender.test
 */

'use strict';

const assert = require('assert');
const {
  SoilAgroChemicalRecommenderService,
  TROPICAL_CROP_NUTRIENT_PROFILES,
  TANK_MIX_COMPATIBILITY_RULES
} = require('../services/soilAgroChemicalRecommenderService');

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
  console.log('\n🧪 Starting Soil Agro-Chemical Recommender Unit Tests...\n');

  // Test 1: Optimal soil telemetry analysis
  await runTest('evaluateSoilNutrition should approve optimal soil pH for Tomato', async () => {
    const result = SoilAgroChemicalRecommenderService.evaluateSoilNutrition(
      { soilPh: 6.4, sprayWaterPh: 6.2 },
      'TOMATO'
    );

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.cropType, 'TOMATO');
    assert.strictEqual(result.soilTelemetry.phStatus, 'OPTIMAL');
    assert.strictEqual(result.sprayWaterTelemetry.requiresAcidifyingBuffer, false);
    assert.strictEqual(result.correctiveActions.length, 0);
    assert.ok(result.micronutrientAdvisory.some((m) => m.nutrient === 'CALCIUM'));
  });

  // Test 2: Acidic soil condition recommendation
  await runTest('evaluateSoilNutrition should recommend dolomitic lime for acidic soil', async () => {
    const result = SoilAgroChemicalRecommenderService.evaluateSoilNutrition(
      { soilPh: 5.1 },
      'TOMATO'
    );

    assert.strictEqual(result.soilTelemetry.phStatus, 'ACIDIC_NUTRIENT_LOCKOUT');
    assert.ok(result.correctiveActions.some((a) => a.action === 'APPLY_AGRICULTURAL_DOLOMITIC_LIME'));
    assert.ok(result.correctiveActions[0].targetDosageKgPerHa >= 500);
  });

  // Test 3: Alkaline borehole spray water conditioning
  await runTest('evaluateSoilNutrition should flag alkaline water and recommend citric acid buffer', async () => {
    const result = SoilAgroChemicalRecommenderService.evaluateSoilNutrition(
      { soilPh: 6.5, sprayWaterPh: 8.2 },
      'MAIZE'
    );

    assert.strictEqual(result.sprayWaterTelemetry.requiresAcidifyingBuffer, true);
    assert.ok(result.sprayWaterTelemetry.bufferingAdvisory.includes('Citric Acid'));
  });

  // Test 4: Incompatible tank mix detection
  await runTest('verifyTankMixCompatibility should reject Fixed Copper paired with Organic Phosphates', async () => {
    const check = SoilAgroChemicalRecommenderService.verifyTankMixCompatibility(
      'COPPER_HYDROXIDE',
      'ORGANIC_PHOSPHATES'
    );

    assert.strictEqual(check.compatible, false);
    assert.strictEqual(check.riskLevel, 'HIGH_PHYTOTOXICITY_RISK');
    assert.strictEqual(check.jarTestMandatory, true);
    assert.ok(check.advisory.includes('DO NOT TANK MIX'));
  });

  // Test 5: Synergistic tank mix detection
  await runTest('verifyTankMixCompatibility should approve Mancozeb and Zinc Chelate pairing', async () => {
    const check = SoilAgroChemicalRecommenderService.verifyTankMixCompatibility(
      'MANCOZEB_WP',
      'FOLIA_ZINC_CHELATE'
    );

    assert.strictEqual(check.compatible, true);
    assert.strictEqual(check.riskLevel, 'SYNERGISTIC_COMPATIBLE');
  });

  // Test 6: Default fallback for unlisted tank mix
  await runTest('verifyTankMixCompatibility should mandate jar test for unlisted chemical combinations', async () => {
    const check = SoilAgroChemicalRecommenderService.verifyTankMixCompatibility(
      'LAMBDA_CYHALOTHRIN',
      'NEW_CUSTOM_FERTILIZER'
    );

    assert.strictEqual(check.compatible, true);
    assert.strictEqual(check.riskLevel, 'STANDARD_CAUTION');
    assert.strictEqual(check.jarTestMandatory, true);
  });

  console.log(`\n🎉 Soil Agro-Chemical Recommender Tests: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

runSuite().catch((err) => {
  console.error('Soil Recommender test runner error:', err);
  process.exit(1);
});
