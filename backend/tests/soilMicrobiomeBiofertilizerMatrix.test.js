/**
 * ==============================================================================
 * AGRILY SPRINT 18 TEST SUITE - SOIL MICROBIOME & BIO-INOCULANT MATRIX
 * ==============================================================================
 * 
 * Tests the SoilMicrobiomeEnzymeActivityService:
 * 1. Enzyme kinetics benchmarking across all 5 key assays (DHA, Urease, ALP, Beta-Glucosidase, FDA).
 * 2. Biological Fertility Index (BFI) scoring and health tier categorizations.
 * 3. Disease Suppressiveness Index (DSI) and wilt pathogen vulnerability assessments.
 * 4. Legume-specific Rhizobium inoculant prescriptions (Cowpea, Soybean, Groundnut).
 * 5. Arbuscular Mycorrhizal Fungi (AMF) prescriptions for high P-demand root/cereal crops.
 * 6. Biocontrol Trichoderma and Bacillus subtilis prescriptions for Solanaceae (Tomato, Pepper).
 * 7. Combinatorial test permutations across high, medium, and depleted biological profiles.
 */

'use strict';

const assert = require('assert');
const {
  SoilMicrobiomeEnzymeActivityService,
  ENZYMATIC_ACTIVITY_BENCHMARKS,
  ACCREDITED_BIO_INOCULANTS
} = require('../services/soilMicrobiomeEnzymeActivityService');

console.log('\n=================================================================');
console.log('🔬 AGRILY SPRINT 18: SOIL MICROBIOME & BIO-INOCULANT MATRIX TEST');
console.log('=================================================================\n');

let testsPassed = 0;
let testsFailed = 0;

function runTest(testName, fn) {
  try {
    fn();
    console.log(`  [PASS] ${testName}`);
    testsPassed++;
  } catch (err) {
    console.error(`  [FAIL] ${testName}: ${err.message}`);
    testsFailed++;
  }
}

// 1. Benchmark catalog validation
runTest('Enzymatic activity benchmarks contain valid critical thresholds and units', () => {
  assert(ENZYMATIC_ACTIVITY_BENCHMARKS.dehydrogenaseDha.criticalLow === 25.0);
  assert(ENZYMATIC_ACTIVITY_BENCHMARKS.ureaseEnzyme.optimalThreshold === 90.0);
  assert(ENZYMATIC_ACTIVITY_BENCHMARKS.alkalinePhosphataseAlp.moderateThreshold === 120.0);
  assert(ENZYMATIC_ACTIVITY_BENCHMARKS.betaGlucosidaseGlu.unit.includes('µg'));
  assert(ENZYMATIC_ACTIVITY_BENCHMARKS.fluoresceinDiacetateFda.criticalLow === 0.8);
});

// 2. Individual enzyme scoring logic
runTest('Individual enzyme scoring calculates scorePct and flags depressed assays correctly', () => {
  const depressedDha = SoilMicrobiomeEnzymeActivityService.scoreEnzyme(15.0, ENZYMATIC_ACTIVITY_BENCHMARKS.dehydrogenaseDha);
  assert.strictEqual(depressedDha.tier, 'CRITICALLY_DEPRESSED_MICROBIAL_INACTIVITY');
  assert.strictEqual(depressedDha.isDepressed, true);
  assert(depressedDha.scorePct < 40);

  const optimalUre = SoilMicrobiomeEnzymeActivityService.scoreEnzyme(95.0, ENZYMATIC_ACTIVITY_BENCHMARKS.ureaseEnzyme);
  assert.strictEqual(optimalUre.tier, 'OPTIMAL_BIOLOGICAL_ACTIVITY');
  assert.strictEqual(optimalUre.isDepressed, false);
  assert.strictEqual(optimalUre.scorePct, 100);

  const moderateAlp = SoilMicrobiomeEnzymeActivityService.scoreEnzyme(80.0, ENZYMATIC_ACTIVITY_BENCHMARKS.alkalinePhosphataseAlp);
  assert.strictEqual(moderateAlp.tier, 'SUBOPTIMAL_MODERATE_ACTIVITY');
  assert(moderateAlp.scorePct > 20 && moderateAlp.scorePct < 100);
});

// 3. High Biological Fertility Profile (Regenerative Farm)
runTest('High biological activity scores THRIVING_DIVERSE_MICROBIOME with HIGH_PATHOGEN_SUPPRESSION', () => {
  const highAssays = {
    dehydrogenaseDha: 140.0,
    ureaseEnzyme: 110.0,
    alkalinePhosphataseAlp: 260.0,
    betaGlucosidaseGlu: 150.0,
    fluoresceinDiacetateFda: 3.5
  };

  const report = SoilMicrobiomeEnzymeActivityService.evaluateMicrobialFertility(highAssays, 2.8, 'MAIZE');
  assert(report.biologicalFertilityIndex.score >= 80, `Expected BFI >= 80, got ${report.biologicalFertilityIndex.score}`);
  assert.strictEqual(report.biologicalFertilityIndex.tier, 'THRIVING_DIVERSE_MICROBIOME');
  assert(report.diseaseSuppressionCapacity.suppressionScore >= 75);
  assert.strictEqual(report.diseaseSuppressionCapacity.rating, 'HIGH_PATHOGEN_SUPPRESSION');
  assert.strictEqual(report.diseaseSuppressionCapacity.wiltPathogenVulnerability, 'RESILIENT');
});

// 4. Depleted Soil Microbial Profile (Fumigated / Degraded Soil)
runTest('Depleted biological profile flags STERILIZED_DEPLETED_MICROBIOME and VULNERABLE_ROOT_ROT_PRONE', () => {
  const depletedAssays = {
    dehydrogenaseDha: 12.0,
    ureaseEnzyme: 8.0,
    alkalinePhosphataseAlp: 30.0,
    betaGlucosidaseGlu: 20.0,
    fluoresceinDiacetateFda: 0.4
  };

  const report = SoilMicrobiomeEnzymeActivityService.evaluateMicrobialFertility(depletedAssays, 0.4, 'TOMATO');
  assert(report.biologicalFertilityIndex.score < 40, `Expected BFI < 40, got ${report.biologicalFertilityIndex.score}`);
  assert.strictEqual(report.biologicalFertilityIndex.tier, 'STERILIZED_DEPLETED_MICROBIOME');
  assert(report.diseaseSuppressionCapacity.suppressionScore < 45);
  assert.strictEqual(report.diseaseSuppressionCapacity.rating, 'VULNERABLE_ROOT_ROT_PRONE');
  assert.strictEqual(report.diseaseSuppressionCapacity.wiltPathogenVulnerability, 'HIGH_RISK');
  assert(report.regenerativeBioAdvisory.includes('vermicompost'));
});

// 5. Legume Inoculation Protocol (Cowpea, Soybean, Groundnut)
runTest('All legumes receive Rhizobium leguminosarum bio-inoculant recommendation', () => {
  const legumes = ['COWPEA', 'SOYBEAN', 'GROUNDNUT'];
  for (const crop of legumes) {
    const report = SoilMicrobiomeEnzymeActivityService.evaluateMicrobialFertility({}, 1.0, crop);
    const hasRhizobium = report.prescribedBioInoculants.some(
      inoc => inoc.strainCode === ACCREDITED_BIO_INOCULANTS.RHIZOBIUM_LEGUMINOSARUM.strainCode
    );
    assert(hasRhizobium, `Legume ${crop} must be prescribed Rhizobium inoculant`);
  }
});

// 6. Arbuscular Mycorrhizal Fungi (AMF) for root tubers and cereals
runTest('Cereals and root tubers are prescribed Glomus intraradices mycorrhizae', () => {
  const mycoTargets = ['MAIZE', 'CASSAVA', 'YAM', 'TOMATO'];
  for (const crop of mycoTargets) {
    const report = SoilMicrobiomeEnzymeActivityService.evaluateMicrobialFertility({}, 1.2, crop);
    const hasAMF = report.prescribedBioInoculants.some(
      inoc => inoc.strainCode === ACCREDITED_BIO_INOCULANTS.GLOMUS_INTRARADICES_AMF.strainCode
    );
    assert(hasAMF, `Crop ${crop} must receive AMF Glomus mycorrhizae prescription`);
  }
});

// 7. Solanaceous Wilt Biocontrol Inoculants (Tomato)
runTest('Tomato crops with low disease suppression receive Trichoderma harzianum and Bacillus subtilis', () => {
  const depressedAssays = {
    dehydrogenaseDha: 30.0,
    ureaseEnzyme: 25.0,
    alkalinePhosphataseAlp: 60.0,
    betaGlucosidaseGlu: 35.0,
    fluoresceinDiacetateFda: 0.6
  };

  const report = SoilMicrobiomeEnzymeActivityService.evaluateMicrobialFertility(depressedAssays, 0.7, 'TOMATO');
  const strainCodes = report.prescribedBioInoculants.map(i => i.strainCode);
  assert(strainCodes.includes('TH-NIG-042'), 'Must include Trichoderma harzianum');
  assert(strainCodes.includes('BS-NIG-088'), 'Must include Bacillus subtilis for bacterial wilt suppression');
});

// 8. 50 Combinatorial Crop & Assay Permutations
runTest('50 combinatorial crop x enzyme perturbations run without throwing or NaN', () => {
  const crops = ['MAIZE', 'RICE', 'CASSAVA', 'YAM', 'TOMATO', 'SORGHUM', 'COWPEA', 'SOYBEAN', 'MILLET', 'GROUNDNUT'];
  const testLevels = [10, 45, 80, 150, 250];

  let permutationCount = 0;
  for (const crop of crops) {
    for (const lvl of testLevels) {
      const simulatedAssays = {
        dehydrogenaseDha: lvl * 0.8,
        ureaseEnzyme: lvl * 0.6,
        alkalinePhosphataseAlp: lvl * 1.5,
        betaGlucosidaseGlu: lvl * 0.7,
        fluoresceinDiacetateFda: Math.max(0.1, lvl * 0.02)
      };

      const report = SoilMicrobiomeEnzymeActivityService.evaluateMicrobialFertility(simulatedAssays, 1.2, crop);
      assert(!isNaN(report.biologicalFertilityIndex.score));
      assert(!isNaN(report.diseaseSuppressionCapacity.suppressionScore));
      assert(Array.isArray(report.prescribedBioInoculants));
      assert(report.targetCrop === crop);
      permutationCount++;
    }
  }
  assert.strictEqual(permutationCount, 50);
});

console.log('\n=================================================================');
console.log(`🏁 TEST RESULTS: ${testsPassed} Passed, ${testsFailed} Failed.`);
console.log('=================================================================\n');

if (testsFailed > 0) {
  process.exit(1);
}
