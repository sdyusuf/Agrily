/**
 * ==============================================================================
 * 🌾 AGRILY AGRO-COMMERCE PLATFORM: COMMODITY STANDARDS DICTIONARY UNIT TESTS
 * ==============================================================================
 * 
 * Verifies statutory grading evaluation across all 20 Nigerian commodities,
 * defect penalties, biological pathogen rejection rules, and dictionary integrity.
 * 
 * @module tests/sonCommodityStandards.test
 * @author Agrily Standards Team
 * ==============================================================================
 */

const assert = require('assert');
const {
  NIGERIAN_COMMODITY_STANDARDS,
  getCommodityStandard,
  evaluateCommodityGrade
} = require('../utils/sonAgriculturalCommodityStandards');

console.log('=================================================================');
console.log('🌾 AGRILY SPRINT 15: SON COMMODITY STANDARDS DICTIONARY TESTS');
console.log('=================================================================\n');

let testsPassed = 0;
let testsFailed = 0;

function runTest(testName, testFn) {
  try {
    testFn();
    console.log(`  ✓ PASS: ${testName}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${testName}`);
    console.error(`    ${err.message}\n${err.stack}`);
    testsFailed++;
  }
}

// ------------------------------------------------------------------------------
// DICTIONARY METRICS & LOCALIZATION
// ------------------------------------------------------------------------------
console.log('--- SECTION 1: Dictionary Key Definitions & Indigenous Naming ---');

runTest('Dictionary contains all major Nigerian agro-commodities', () => {
  const keys = Object.keys(NIGERIAN_COMMODITY_STANDARDS);
  assert(keys.length >= 10, 'Must have at least 10 core commodities');
  assert(keys.includes('WHITE_MAIZE'), 'Must contain White Maize');
  assert(keys.includes('ROMA_TOMATOES'), 'Must contain Roma Tomatoes');
  assert(keys.includes('WHITE_YAM_PONA'), 'Must contain Benue Pona Yam');
  assert(keys.includes('COCOA_BEANS_GRADE_ONE'), 'Must contain Export Grade 1 Cocoa');
  assert(keys.includes('SESAME_SEED_WHITE'), 'Must contain Natural White Sesame');
});

runTest('Commodity profiles include accurate Hausa, Yoruba, and Igbo local names', () => {
  const maize = NIGERIAN_COMMODITY_STANDARDS.WHITE_MAIZE;
  assert.strictEqual(maize.localNames.hausa, 'Masara Farin');
  assert.strictEqual(maize.localNames.yoruba, 'Agbado Funfun');
  assert.strictEqual(maize.localNames.igbo, 'Oka Ocha');

  const yam = NIGERIAN_COMMODITY_STANDARDS.WHITE_YAM_PONA;
  assert.strictEqual(yam.localNames.hausa, 'Doya Pona');
  assert.strictEqual(yam.localNames.yoruba, 'Isu Pona');
  assert.strictEqual(yam.localNames.igbo, 'Ji Ocha Pona');
});

runTest('getCommodityStandard resolves fuzzy inputs case-insensitively', () => {
  const s1 = getCommodityStandard('white_maize');
  assert(s1 && s1.key === 'WHITE_MAIZE');

  const s2 = getCommodityStandard('ROMA-TOMATOES');
  assert(s2 && s2.key === 'ROMA_TOMATOES');

  const s3 = getCommodityStandard('non_existent_crop');
  assert.strictEqual(s3, null);
});

// ------------------------------------------------------------------------------
// STATUTORY DEFECT & GRADE EVALUATION
// ------------------------------------------------------------------------------
console.log('\n--- SECTION 2: Statutory Defect Grading Algorithms ---');

runTest('Flawless White Maize earns GRADE_A_EXPORT_PREMIUM', () => {
  const res = evaluateCommodityGrade('WHITE_MAIZE', {
    moistureContentPercentage: 12.2,
    foreignMatterPercentage: 0.5,
    moldMildewDetected: false,
    pestInfestationDetected: false
  });

  assert.strictEqual(res.grade, 'GRADE_A_EXPORT_PREMIUM');
  assert.strictEqual(res.isCompliantWithSon, true);
  assert.strictEqual(res.priceDiscountPct, 0);
  assert.strictEqual(res.recommendation, 'ACCEPT_FULL_SETTLEMENT');
});

runTest('White Maize with 16.5% moisture triggers statutory rejection', () => {
  const res = evaluateCommodityGrade('WHITE_MAIZE', {
    moistureContentPercentage: 16.5, // Exceeds 16.0% immediate reject
    foreignMatterPercentage: 0.5
  });

  assert.strictEqual(res.grade, 'REJECTED_UNFIT');
  assert.strictEqual(res.isCompliantWithSon, false);
  assert.strictEqual(res.recommendation, 'LODGE_TRIBUNAL_DISPUTE');
  assert.strictEqual(res.priceDiscountPct, 100);
  assert(res.violations.some(v => v.includes('Moisture')));
});

runTest('Roma Tomatoes with 12% rot triggers statutory rejection and food safety alert', () => {
  const res = evaluateCommodityGrade('ROMA_TOMATOES', {
    moistureContentPercentage: 93.0,
    spoilageRotPercentage: 12.0, // Exceeds 8% statutory limit
    foreignMatterPercentage: 0.5
  });

  assert.strictEqual(res.grade, 'REJECTED_UNFIT');
  assert.strictEqual(res.isCompliantWithSon, false);
  assert.strictEqual(res.recommendation, 'LODGE_TRIBUNAL_DISPUTE');
});

runTest('Biological mold presence immediately fails cargo under NAFDAC standards', () => {
  const res = evaluateCommodityGrade('COCOA_BEANS_GRADE_ONE', {
    moistureContentPercentage: 7.2,
    foreignMatterPercentage: 0.2,
    moldMildewDetected: true // Biological pathogen presence
  });

  assert.strictEqual(res.grade, 'REJECTED_UNFIT');
  assert.strictEqual(res.isCompliantWithSon, false);
  assert(res.violations.some(v => v.includes('NAFDAC') || v.includes('mold')));
});

console.log('\n=================================================================');
console.log(`🌾 TEST SUITE COMPLETE: ${testsPassed} passed, ${testsFailed} failed`);
console.log('=================================================================\n');

if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
