/**
 * @file cropPathologyModel.test.js
 * @description Comprehensive unit tests for Crop Pathology Models:
 * - CropPathologyRecord
 * - DiseaseOutbreakTelemetry
 * - AgronomyTreatmentProtocol
 */

const assert = require('assert');
const crypto = require('crypto');
const {
  CropPathologyRecord,
  SUPPORTED_CROPS,
  PATHOGEN_TYPES,
  SEVERITY_STAGES,
  TRIAGE_PRIORITIES,
  AGRO_ECOLOGICAL_ZONES
} = require('../models/CropPathologyRecord');

const {
  DiseaseOutbreakTelemetry,
  OUTBREAK_STATUSES,
  NIGERIAN_STATES
} = require('../models/DiseaseOutbreakTelemetry');

const {
  AgronomyTreatmentProtocol,
  TREATMENT_TYPES,
  APPLICATION_METHODS
} = require('../models/AgronomyTreatmentProtocol');

console.log('=================================================================');
console.log('🌾 AGRILY SPRINT 17: CROP PATHOLOGY & OUTBREAK TELEMETRY MODELS');
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
// SECTION 1: CropPathologyRecord Validations & Constants
// -----------------------------------------------------------------------------
console.log('--- SECTION 1: CropPathologyRecord Constants & Validations ---');

runTest('Exports all 10 priority Nigerian agricultural crops', () => {
  assert.strictEqual(SUPPORTED_CROPS.length, 10);
  assert.ok(SUPPORTED_CROPS.includes('TOMATO'));
  assert.ok(SUPPORTED_CROPS.includes('CASSAVA'));
  assert.ok(SUPPORTED_CROPS.includes('MAIZE'));
  assert.ok(SUPPORTED_CROPS.includes('YAM'));
  assert.ok(SUPPORTED_CROPS.includes('COCOA'));
  assert.ok(SUPPORTED_CROPS.includes('RICE'));
  assert.ok(SUPPORTED_CROPS.includes('SORGHUM'));
  assert.ok(SUPPORTED_CROPS.includes('COWPEA'));
  assert.ok(SUPPORTED_CROPS.includes('PEPPER'));
  assert.ok(SUPPORTED_CROPS.includes('OIL_PALM'));
});

runTest('Exports all pathogen taxonomies and severity stages', () => {
  assert.strictEqual(PATHOGEN_TYPES.length, 6);
  assert.ok(PATHOGEN_TYPES.includes('FUNGAL'));
  assert.ok(PATHOGEN_TYPES.includes('BACTERIAL'));
  assert.ok(PATHOGEN_TYPES.includes('VIRAL'));
  assert.ok(PATHOGEN_TYPES.includes('NONE_HEALTHY'));

  assert.strictEqual(SEVERITY_STAGES.length, 5);
  assert.ok(SEVERITY_STAGES.includes('STAGE_0_HEALTHY'));
  assert.ok(SEVERITY_STAGES.includes('STAGE_4_CATASTROPHIC_CANOPY_COLLAPSE'));

  assert.strictEqual(TRIAGE_PRIORITIES.length, 4);
  assert.strictEqual(AGRO_ECOLOGICAL_ZONES.length, 7);
});

runTest('Instantiates valid CropPathologyRecord with default diagnosis ID format', () => {
  const record = new CropPathologyRecord({
    farmerName: 'Mallam Haruna Bello',
    farmLocation: {
      state: 'KANO',
      lga: 'Kura',
      agroZone: 'SUDAN_SAVANNA',
      coordinates: { latitude: 11.7725, longitude: 8.4312 }
    },
    cropType: 'TOMATO',
    fieldAcreageHectares: 2.5,
    imageMetadata: {
      imageUrl: 'https://cdn.agrily.africa/pathology/dx_tomato_early_blight_01.jpg',
      capturedVia: 'MOBILE_CAMERA'
    },
    aiInference: {
      diseaseCode: 'TOM-EB-001',
      commonDiseaseName: 'Tomato Early Blight (Alternaria solani)',
      pathogenType: 'FUNGAL',
      confidenceScore: 0.94,
      severityStage: 'STAGE_2_MODERATE_FOLIAR_SPREAD',
      affectedCanopyPercentage: 35
    }
  });

  assert.ok(record.diagnosisId.startsWith('DX-'));
  assert.strictEqual(record.farmerName, 'Mallam Haruna Bello');
  assert.strictEqual(record.cropType, 'TOMATO');
  assert.strictEqual(record.aiInference.confidenceScore, 0.94);
  assert.strictEqual(record.isHealthyLeaf, false);
});

runTest('Validates required fields in CropPathologyRecord', () => {
  const invalidRecord = new CropPathologyRecord({});
  const err = invalidRecord.validateSync();
  assert.ok(err);
  assert.ok(err.errors['farmerName']);
  assert.ok(err.errors['farmLocation.state']);
  assert.ok(err.errors['cropType']);
  assert.ok(err.errors['imageMetadata.imageUrl']);
  assert.ok(err.errors['aiInference.diseaseCode']);
});

runTest('Rejects unsupported crop commodities', () => {
  const invalidCropRecord = new CropPathologyRecord({
    farmerName: 'John Okafor',
    farmLocation: { state: 'ENUGU', lga: 'Nkanu' },
    cropType: 'AVOCADO_UNSUPPORTED',
    imageMetadata: { imageUrl: 'https://test.com/img.jpg' },
    aiInference: { diseaseCode: 'TEST', commonDiseaseName: 'Test' }
  });
  const err = invalidCropRecord.validateSync();
  assert.ok(err);
  assert.ok(err.errors['cropType']);
});

// -----------------------------------------------------------------------------
// SECTION 2: Pre-Save Hooks & Cryptographic Seal Generation
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 2: Triage Priority Logic & Cryptographic Seal ---');

runTest('Derives CRITICAL_QUARANTINE_ERADICATION for Stage 4 catastrophic collapse', () => {
  const record = new CropPathologyRecord({
    farmerName: 'Chief Adebayo',
    farmLocation: { state: 'ONDO', lga: 'Idanre' },
    cropType: 'COCOA',
    imageMetadata: { imageUrl: 'https://test.com/cocoa.jpg' },
    aiInference: {
      diseaseCode: 'COC-BP-001',
      commonDiseaseName: 'Cocoa Black Pod Disease',
      severityStage: 'STAGE_4_CATASTROPHIC_CANOPY_COLLAPSE',
      affectedCanopyPercentage: 85
    }
  });

  record.computeTriageAndSeal();

  assert.strictEqual(record.aiInference.triagePriority, 'CRITICAL_QUARANTINE_ERADICATION');
  assert.ok(record.economicImpactEstimate.projectedYieldLossPct >= 75);
  assert.strictEqual(record.requiresQuarantineAction, true);
  assert.ok(record.cryptographicSeal.length === 64);
});

runTest('Derives HIGH_EMERGENCY for Stage 3 severe defoliation', () => {
  const record = new CropPathologyRecord({
    farmerName: 'Emeka Nwosu',
    farmLocation: { state: 'BENUE', lga: 'Gboko' },
    cropType: 'YAM',
    imageMetadata: { imageUrl: 'https://test.com/yam.jpg' },
    aiInference: {
      diseaseCode: 'YAM-ANT-001',
      commonDiseaseName: 'Yam Anthracnose',
      severityStage: 'STAGE_3_SEVERE_DEFOLIATION',
      affectedCanopyPercentage: 55
    }
  });

  record.computeTriageAndSeal();

  assert.strictEqual(record.aiInference.triagePriority, 'HIGH_EMERGENCY_CHEMICAL_INTERVENTION');
  assert.ok(record.economicImpactEstimate.projectedYieldLossPct >= 45);
  assert.strictEqual(record.requiresQuarantineAction, false); // < 65% canopy
  assert.ok(record.cryptographicSeal.length === 64);
});

runTest('Correctly classifies healthy leaf diagnosis without quarantine or economic loss', () => {
  const healthyRecord = new CropPathologyRecord({
    farmerName: 'Danladi Garba',
    farmLocation: { state: 'KADUNA', lga: 'Zaria' },
    cropType: 'MAIZE',
    imageMetadata: { imageUrl: 'https://test.com/healthy_maize.jpg' },
    aiInference: {
      diseaseCode: 'MAIZ-HEALTHY',
      commonDiseaseName: 'Healthy Foliage',
      pathogenType: 'NONE_HEALTHY',
      severityStage: 'STAGE_0_HEALTHY',
      affectedCanopyPercentage: 0
    }
  });

  healthyRecord.computeTriageAndSeal();

  assert.strictEqual(healthyRecord.aiInference.triagePriority, 'LOW_WATCHLIST');
  assert.strictEqual(healthyRecord.economicImpactEstimate.projectedYieldLossPct, 0);
  assert.strictEqual(healthyRecord.isHealthyLeaf, true);
  assert.strictEqual(healthyRecord.requiresQuarantineAction, false);
});

// -----------------------------------------------------------------------------
// SECTION 3: DiseaseOutbreakTelemetry Tests
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 3: DiseaseOutbreakTelemetry Tests ---');

runTest('Validates Nigerian states list in Outbreak Telemetry', () => {
  assert.strictEqual(NIGERIAN_STATES.length, 37); // 36 States + FCT
  assert.ok(NIGERIAN_STATES.includes('KANO'));
  assert.ok(NIGERIAN_STATES.includes('LAGOS'));
  assert.ok(NIGERIAN_STATES.includes('PLATEAU'));
  assert.ok(NIGERIAN_STATES.includes('BENUE'));
  assert.ok(NIGERIAN_STATES.includes('FCT'));
});

runTest('Auto-adjusts quarantine perimeter & interdiction on CRITICAL_QUARANTINE_LOCKDOWN', () => {
  const telemetry = new DiseaseOutbreakTelemetry({
    state: 'PLATEAU',
    lgaCluster: ['Barkin Ladi', 'Mangu', 'Bokkos'],
    primaryCropAffected: 'TOMATO',
    targetPathogenCode: 'TOM-LB-002',
    pathogenCommonName: 'Tomato Late Blight',
    outbreakStatus: 'CRITICAL_QUARANTINE_LOCKDOWN',
    reportedCasesCount: 48,
    confirmedAcreageHectares: 120.0,
    quarantineRadiusKm: 5.0
  });

  telemetry.computeQuarantinePerimeter();

  assert.strictEqual(telemetry.quarantineRadiusKm, 25.0);
  assert.strictEqual(telemetry.containmentProtocol.isBorderTransitInterdicted, true);
  assert.strictEqual(telemetry.containmentProtocol.mandatoryChemicalSprayZone, true);
  assert.ok(telemetry.containmentProtocol.quarantineEnactedAt instanceof Date);
  assert.strictEqual(telemetry.isHighRiskEmergency, true);
  assert.ok(telemetry.estimatedProduceVolumeAtRiskMt > 1800);
  assert.ok(telemetry.telemetryIntegrityHash.length === 64);
});

runTest('Normal monitoring status maintains localized parameters', () => {
  const telemetry = new DiseaseOutbreakTelemetry({
    state: 'OYO',
    lgaCluster: ['Iseyin'],
    primaryCropAffected: 'CASSAVA',
    targetPathogenCode: 'CAS-CMD-001',
    pathogenCommonName: 'Cassava Mosaic Disease',
    outbreakStatus: 'LOCALIZED_SPORADIC',
    reportedCasesCount: 3,
    confirmedAcreageHectares: 5.0
  });

  const preSaveHook = telemetry.schema.s.hooks._pres.get('save')[0].fn;
  preSaveHook.call(telemetry, () => {});

  assert.strictEqual(telemetry.quarantineRadiusKm, 5.0);
  assert.strictEqual(telemetry.containmentProtocol.isBorderTransitInterdicted, false);
  assert.strictEqual(telemetry.isHighRiskEmergency, false);
});

// -----------------------------------------------------------------------------
// SECTION 4: AgronomyTreatmentProtocol Tests
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 4: AgronomyTreatmentProtocol Tests ---');

runTest('Instantiates valid chemical fungicide protocol with PHI withdrawal safety', () => {
  const protocol = new AgronomyTreatmentProtocol({
    protocolCode: 'PROT-TOM-FUNG-01',
    diseaseCode: 'TOM-EB-001',
    targetCrop: 'TOMATO',
    treatmentName: 'Mancozeb 80% WP High-Efficacy Foliar Fungicide',
    treatmentType: 'SYSTEMIC_CHEMICAL_FUNGICIDE',
    activeIngredients: [{
      chemicalName: 'Mancozeb',
      concentrationPct: 80.0
    }],
    applicationMethod: 'FOLIAR_KNAPSACK_SPRAY',
    dosageRate: {
      quantity: 2.5,
      unit: 'KG_PER_HA',
      dilutionWaterLitersPerHa: 250
    },
    safetyAndWithdrawal: {
      preHarvestIntervalDays: 14,
      reEntryIntervalHours: 24,
      requiredPPE: ['Chemical Nitrile Gloves', 'N95 Respirator', 'Eye Goggles'],
      nafdacRegNumber: 'NAFDAC-AG-048291',
      pollinatorToxicity: 'LOW_RISK'
    },
    curativeEfficacyPct: 91.5,
    curativeInstructions: 'Dilute 50g per 20L knapsack. Spray early morning before 9 AM.'
  });

  assert.strictEqual(protocol.protocolCode, 'PROT-TOM-FUNG-01');
  assert.strictEqual(protocol.requiresLongWithdrawal, true);
  assert.strictEqual(protocol.isPollinatorFriendly, true);
  assert.strictEqual(protocol.organicCertified, false);
});

runTest('Instantiates organic bio-fungicide with zero PHI restriction and bee-friendly profile', () => {
  const bioProtocol = new AgronomyTreatmentProtocol({
    protocolCode: 'PROT-BIO-NEEM-01',
    diseaseCode: 'MAIZ-FAW-001',
    targetCrop: 'MAIZE',
    treatmentName: 'Cold-Pressed Azadirachtin Neem Oil Botanical',
    treatmentType: 'BOTANICAL_NEEM_EXTRACT',
    activeIngredients: [{
      chemicalName: 'Azadirachtin A & B',
      concentrationPct: 1.5
    }],
    applicationMethod: 'FOLIAR_KNAPSACK_SPRAY',
    dosageRate: {
      quantity: 3.0,
      unit: 'L_PER_HA'
    },
    safetyAndWithdrawal: {
      preHarvestIntervalDays: 1,
      reEntryIntervalHours: 4,
      requiredPPE: ['Standard Coveralls', 'Face Mask'],
      pollinatorToxicity: 'NON_TOXIC'
    },
    organicCertified: true,
    curativeEfficacyPct: 84.0,
    curativeInstructions: 'Mix with biodegradable emulsifier and spray immediately upon egg hatch.'
  });

  assert.strictEqual(bioProtocol.requiresLongWithdrawal, false);
  assert.strictEqual(bioProtocol.isPollinatorFriendly, true);
  assert.strictEqual(bioProtocol.organicCertified, true);
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
