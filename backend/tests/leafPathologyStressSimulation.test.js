/**
 * @file leafPathologyStressSimulation.test.js
 * @description Monte Carlo simulation and stress test suite for Leaf Pathology Inference,
 * Phytosanitary Export Passports, and Soil Agro-Chemical Tank Compatibility.
 */

const assert = require('assert');
const { LeafPathologyInferenceEngine } = require('../services/leafPathologyInferenceEngine');
const { CropPathologyExportService } = require('../services/cropPathologyExportService');
const { SoilAgroChemicalRecommenderService } = require('../services/soilAgroChemicalRecommenderService');
const { SUPPORTED_CROPS } = require('../models/CropPathologyRecord');

console.log('=================================================================');
console.log('🌾 AGRILY SPRINT 17: LEAF PATHOLOGY STRESS SIMULATION & EXPORTS');
console.log('=================================================================\n');

let passed = 0;
let failed = 0;

function runTest(desc, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${desc}`);
    console.error(`     Reason: ${err.message}`);
    failed++;
  }
}

// -----------------------------------------------------------------------------
// SECTION 1: Monte Carlo Pathology Inference Simulation (10 Crops x 4 Severities)
// -----------------------------------------------------------------------------
console.log('--- SECTION 1: Monte Carlo Multi-Crop Foliar Inference Simulation ---');

const SEVERITY_TIERS = ['EARLY', 'MODERATE', 'SEVERE', 'CATASTROPHIC'];

runTest('Executes simulated foliar diagnosis across all 10 Nigerian agricultural crops', () => {
  let totalSimulations = 0;

  SUPPORTED_CROPS.forEach((crop) => {
    SEVERITY_TIERS.forEach((tier) => {
      const result = LeafPathologyInferenceEngine.inferLeafPathology({
        cropType: crop,
        severityLevel: tier,
        fieldAcreageHectares: 2.5
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.cropType, crop);
      assert.ok(result.diagnosis.confidenceScore >= 0.80 && result.diagnosis.confidenceScore <= 1.0);
      assert.ok(result.cryptographicSeal.length === 64);
      assert.ok(result.visionTelemetry.detectedLesionCount >= 0);
      assert.ok(result.economicImpact.estimatedFinancialLossNgn >= 0);

      totalSimulations++;
    });
  });

  assert.strictEqual(totalSimulations, 40); // 10 crops * 4 tiers
});

runTest('Detects healthy foliage across all crops with zero yield loss', () => {
  SUPPORTED_CROPS.forEach((crop) => {
    const result = LeafPathologyInferenceEngine.inferLeafPathology({
      cropType: crop,
      forcedDiseaseCode: `${crop}-HEALTHY`,
      severityLevel: 'HEALTHY'
    });

    assert.strictEqual(result.diagnosis.isHealthyLeaf, true);
    assert.strictEqual(result.diagnosis.affectedCanopyPercentage, 0);
    assert.strictEqual(result.economicImpact.projectedYieldLossPct, 0);
    assert.strictEqual(result.economicImpact.estimatedFinancialLossNgn, 0);
    assert.strictEqual(result.visionTelemetry.detectedLesionCount, 0);
  });
});

// -----------------------------------------------------------------------------
// SECTION 2: Phytosanitary Passport & HTML Export Tests
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 2: Phytosanitary Digital Passports & HTML Certificate Exports ---');

runTest('Generates tamper-evident Digital Phytosanitary Passport with 14-day validity', () => {
  const sampleRecord = {
    diagnosisId: 'DX-TOM-2024-KANO',
    cropType: 'TOMATO',
    farmerName: 'Kano Tomato Growers Apex Cooperative',
    farmLocation: { state: 'KANO', lga: 'Kura' },
    fieldAcreageHectares: 5.0,
    aiInference: {
      diseaseCode: 'TOM-EB-001',
      commonDiseaseName: 'Tomato Early Blight',
      pathogenType: 'FUNGAL',
      affectedCanopyPercentage: 25,
      severityStage: 'STAGE_2_MODERATE_FOLIAR_SPREAD',
      triagePriority: 'MEDIUM_ISOLATE_ZONE'
    }
  };

  const passport = CropPathologyExportService.generatePhytosanitaryPassport(sampleRecord);

  assert.strictEqual(passport.success, true);
  assert.ok(passport.passportId.startsWith('PHYT-NIG-'));
  assert.strictEqual(passport.metadata.commodityType, 'TOMATO');
  assert.strictEqual(passport.quarantineClearance.isClearedForInterstateHaulage, true);
  assert.strictEqual(passport.cryptographicPassportSeal.length === 64, true);
  assert.ok(passport.qrVerificationUri.includes('verify.agrily.africa'));
});

runTest('Restricts interstate haulage passport for critical quarantine eradication status', () => {
  const criticalRecord = {
    diagnosisId: 'DX-PLATEAU-CRIT',
    cropType: 'TOMATO',
    farmLocation: { state: 'PLATEAU', lga: 'Barkin Ladi' },
    aiInference: {
      diseaseCode: 'TOM-LB-002',
      commonDiseaseName: 'Tomato Late Blight',
      affectedCanopyPercentage: 85,
      severityStage: 'STAGE_4_CATASTROPHIC_CANOPY_COLLAPSE',
      triagePriority: 'CRITICAL_QUARANTINE_ERADICATION'
    }
  };

  const passport = CropPathologyExportService.generatePhytosanitaryPassport(criticalRecord);

  assert.strictEqual(passport.quarantineClearance.isClearedForInterstateHaulage, false);
  assert.strictEqual(passport.quarantineClearance.transitClearanceCode, 'QUARANTINE-HOLD-INTERDICTED-RED');
});

runTest('Generates valid self-contained HTML print certificate', () => {
  const sampleRecord = {
    diagnosisId: 'DX-HTML-TEST',
    cropType: 'YAM',
    farmerName: 'Gboko Yam Farmers Union',
    farmLocation: { state: 'BENUE', lga: 'Gboko' },
    aiInference: {
      commonDiseaseName: 'Yam Anthracnose',
      severityStage: 'STAGE_2_MODERATE_FOLIAR_SPREAD',
      affectedCanopyPercentage: 30,
      triagePriority: 'MEDIUM_ISOLATE_ZONE'
    }
  };

  const passport = CropPathologyExportService.generatePhytosanitaryPassport(sampleRecord);
  const html = CropPathologyExportService.generatePrintableHtmlCertificate(passport);

  assert.ok(html.includes('<!DOCTYPE html>'));
  assert.ok(html.includes(passport.passportId));
  assert.ok(html.includes('Gboko Yam Farmers Union'));
  assert.ok(html.includes('BENUE'));
  assert.ok(html.includes('CRYPTOGRAPHIC SHA-256 DIGITAL PASSPORT SEAL'));
});

runTest('Exports batch pathology dataset in CSV format with sanitized strings', () => {
  const records = [
    {
      diagnosisId: 'DX-001',
      cropType: 'MAIZE',
      farmerName: 'Zaria Farmers, Ltd.',
      farmLocation: { state: 'KADUNA', lga: 'Zaria' },
      aiInference: { diseaseCode: 'MAIZ-FAW', commonDiseaseName: 'Fall Armyworm', affectedCanopyPercentage: 40 },
      economicImpactEstimate: { projectedYieldLossPct: 35, estimatedFinancialLossNgn: 450000 },
      cryptographicSeal: 'abcdef123456'
    }
  ];

  const csv = CropPathologyExportService.exportBatchCsv(records);
  assert.ok(csv.includes('DiagnosisId,CropType,State'));
  assert.ok(csv.includes('DX-001,MAIZE,KADUNA,Zaria'));
  assert.ok(csv.includes('"Zaria Farmers, Ltd."'));
});

// -----------------------------------------------------------------------------
// SECTION 3: Soil Nutrition & Tank Compatibility Tests
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 3: Soil Nutrition & Agrochemical Tank Compatibility ---');

runTest('Evaluates acidic soil pH and prescribes dolomitic limestone amendment', () => {
  const evalResult = SoilAgroChemicalRecommenderService.evaluateSoilNutrition({
    soilPh: 5.2, // Acidic
    sprayWaterPh: 8.1 // Alkaline borehole water
  }, 'TOMATO');

  assert.strictEqual(evalResult.success, true);
  assert.strictEqual(evalResult.soilTelemetry.phStatus, 'ACIDIC_NUTRIENT_LOCKOUT');
  assert.ok(evalResult.correctiveActions.some(a => a.action === 'APPLY_AGRICULTURAL_DOLOMITIC_LIME'));
  assert.strictEqual(evalResult.sprayWaterTelemetry.requiresAcidifyingBuffer, true);
});

runTest('Detects phytotoxicity incompatibility between Copper Hydroxide and Acidic Phosphates', () => {
  const tankCheck = SoilAgroChemicalRecommenderService.verifyTankMixCompatibility(
    'COPPER_HYDROXIDE',
    'ORGANIC_PHOSPHATES'
  );

  assert.strictEqual(tankCheck.compatible, false);
  assert.strictEqual(tankCheck.riskLevel, 'HIGH_PHYTOTOXICITY_RISK');
  assert.strictEqual(tankCheck.jarTestMandatory, true);
});

runTest('Identifies synergistic compatibility between Mancozeb and Foliar Zinc', () => {
  const tankCheck = SoilAgroChemicalRecommenderService.verifyTankMixCompatibility(
    'MANCOZEB_WP',
    'FOLIA_ZINC_CHELATE'
  );

  assert.strictEqual(tankCheck.compatible, true);
  assert.strictEqual(tankCheck.riskLevel, 'SYNERGISTIC_COMPATIBLE');
  assert.strictEqual(tankCheck.jarTestMandatory, false);
});

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n=================================================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('=================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
