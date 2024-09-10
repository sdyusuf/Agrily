/**
 * ==============================================================================
 * AGRILY BACKEND TEST SUITE - SOIL SAMPLE TELEMETRY & FERTILIZER SCHEMAS
 * ==============================================================================
 * 
 * Verifies:
 * 1. SoilSampleRecord Mongoose model validation constraints.
 * 2. Static USDA Textural Triangle Ternary Classifier across boundaries.
 * 3. Instance Effective Cation Exchange Capacity (ECEC) and Base Saturation %.
 * 4. Soil pH acidity liming recommendations vs alkaline sulfur amendments.
 * 5. Virtual Organic Matter % and C:N Ratio calculations.
 * 6. Cryptographic SHA-256 seal generation on sample records.
 * 7. FertilizerProductCatalog elemental analysis per standard 50kg bag.
 * 8. SoilPrescriptionPlan cost accounting and return-on-investment calculation.
 * 
 * @module tests/soilSampleModel.test
 */

'use strict';

const assert = require('assert');
const SoilSampleRecord = require('../models/SoilSampleRecord');
const FertilizerProductCatalog = require('../models/FertilizerProductCatalog');
const SoilPrescriptionPlan = require('../models/SoilPrescriptionPlan');

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
  console.log('\n🧪 Starting Soil Sample Telemetry & Fertilizer Model Unit Tests...\n');

  // Test 1: Required field validation on SoilSampleRecord
  await runTest('SoilSampleRecord should require sampleId, farmerEmail, state, crop, and chemistry', async () => {
    const invalidSample = new SoilSampleRecord({});
    const err = invalidSample.validateSync();
    assert.ok(err, 'Validation error must be thrown for empty record');
    assert.ok(err.errors['sampleId']);
    assert.ok(err.errors['farmerEmail']);
    assert.ok(err.errors['farmLocation.state']);
    assert.ok(err.errors['targetCrop']);
    assert.ok(err.errors['soilChemistry.phWater']);
  });

  // Test 2: USDA Soil Texture Ternary Classification - Sand
  await runTest('classifySoilTexture should accurately classify SAND (88% sand, 7% silt, 5% clay)', async () => {
    const texture = SoilSampleRecord.classifySoilTexture(88, 7, 5);
    assert.strictEqual(texture, 'SAND');
  });

  // Test 3: USDA Soil Texture Ternary Classification - Clay
  await runTest('classifySoilTexture should classify CLAY (20% sand, 25% silt, 55% clay)', async () => {
    const texture = SoilSampleRecord.classifySoilTexture(20, 25, 55);
    assert.strictEqual(texture, 'CLAY');
  });

  // Test 4: USDA Soil Texture Ternary Classification - Sandy Loam
  await runTest('classifySoilTexture should classify SANDY_LOAM (65% sand, 20% silt, 15% clay)', async () => {
    const texture = SoilSampleRecord.classifySoilTexture(65, 20, 15);
    assert.strictEqual(texture, 'SANDY_LOAM');
  });

  // Test 5: USDA Soil Texture Ternary Classification - Silty Clay
  await runTest('classifySoilTexture should classify SILTY_CLAY (10% sand, 45% silt, 45% clay)', async () => {
    const texture = SoilSampleRecord.classifySoilTexture(10, 45, 45);
    assert.strictEqual(texture, 'SILTY_CLAY');
  });

  // Test 6: ECEC & Base Saturation Computation
  await runTest('computeEcecAndBaseSaturation should compute ECEC and BS% correctly', async () => {
    const sample = new SoilSampleRecord({
      sampleId: 'SOIL-TEST-001',
      farmerEmail: 'farmer@kaduna.ng',
      farmerName: 'Ibrahim Musa',
      farmLocation: { state: 'KADUNA', lga: 'Zaria' },
      agroEcologicalZone: 'NORTHERN_GUINEA_SAVANNA',
      targetCrop: 'MAIZE',
      soilPhysics: { sandPct: 60, siltPct: 25, clayPct: 15 },
      soilChemistry: {
        phWater: 6.2,
        organicCarbonPct: 1.2,
        totalNitrogenPct: 0.11,
        availablePhosphorusBray1MgPerKg: 14.5,
        exchangeableAcidityAlPlusH: 0.2,
        exchangeableCations: {
          calciumCa: 4.5,
          magnesiumMg: 1.8,
          potassiumK: 0.45,
          sodiumNa: 0.05
        }
      }
    });

    sample.computeEcecAndBaseSaturation();

    // Sum bases = 4.5 + 1.8 + 0.45 + 0.05 = 6.8
    // ECEC = 6.8 + 0.2 = 7.0
    // BS% = (6.8 / 7.0) * 100 = 97.1%
    assert.strictEqual(sample.soilChemistry.effectiveCec, 7.0);
    assert.strictEqual(sample.soilChemistry.baseSaturationPct, 97.1);
    assert.strictEqual(sample.amendmentAdvisory.requiresLiming, false);
  });

  // Test 7: Acidic Soil Liming Prescription
  await runTest('computeEcecAndBaseSaturation should recommend dolomitic lime for low pH (< 5.5)', async () => {
    const acidicSample = new SoilSampleRecord({
      sampleId: 'SOIL-TEST-ACIDIC',
      farmerEmail: 'chidi@enugu.ng',
      farmerName: 'Chidi Okonkwo',
      farmLocation: { state: 'ENUGU', lga: 'Nsukka' },
      agroEcologicalZone: 'DERIVED_SAVANNA',
      targetCrop: 'CASSAVA',
      soilPhysics: { sandPct: 50, siltPct: 30, clayPct: 20 },
      soilChemistry: {
        phWater: 4.8,
        organicCarbonPct: 0.8,
        totalNitrogenPct: 0.07,
        availablePhosphorusBray1MgPerKg: 6.2,
        exchangeableAcidityAlPlusH: 1.8,
        exchangeableCations: {
          calciumCa: 1.5,
          magnesiumMg: 0.6,
          potassiumK: 0.2,
          sodiumNa: 0.05
        }
      }
    });

    acidicSample.computeEcecAndBaseSaturation();
    assert.strictEqual(acidicSample.amendmentAdvisory.requiresLiming, true);
    assert.strictEqual(acidicSample.amendmentAdvisory.recommendedMaterial, 'DOLOMITIC_LIMESTONE');
    assert.ok(acidicSample.amendmentAdvisory.recommendedDoseKgPerHa > 500);
  });

  // Test 8: Alkaline Soil Sulfur Amendment
  await runTest('computeEcecAndBaseSaturation should recommend elemental sulfur for high pH (> 7.8)', async () => {
    const alkalineSample = new SoilSampleRecord({
      sampleId: 'SOIL-TEST-ALKALINE',
      farmerEmail: 'bello@sokoto.ng',
      farmerName: 'Bello Danladi',
      farmLocation: { state: 'SOKOTO', lga: 'Wamako' },
      agroEcologicalZone: 'SUDAN_SAVANNA',
      targetCrop: 'SORGHUM',
      soilPhysics: { sandPct: 75, siltPct: 15, clayPct: 10 },
      soilChemistry: {
        phWater: 8.2,
        organicCarbonPct: 0.5,
        totalNitrogenPct: 0.05,
        availablePhosphorusBray1MgPerKg: 18.0,
        exchangeableAcidityAlPlusH: 0.0,
        exchangeableCations: {
          calciumCa: 8.0,
          magnesiumMg: 3.5,
          potassiumK: 0.8,
          sodiumNa: 0.4
        }
      }
    });

    alkalineSample.computeEcecAndBaseSaturation();
    assert.strictEqual(alkalineSample.amendmentAdvisory.requiresLiming, true);
    assert.strictEqual(alkalineSample.amendmentAdvisory.recommendedMaterial, 'ELEMENTAL_SULFUR');
    assert.strictEqual(alkalineSample.amendmentAdvisory.recommendedDoseKgPerHa, 400);
  });

  // Test 9: Virtual Organic Matter % and C:N Ratio
  await runTest('SoilSampleRecord virtuals should calculate OM% and C:N ratio', async () => {
    const record = new SoilSampleRecord({
      sampleId: 'SOIL-TEST-VIRTUALS',
      farmerEmail: 'aisha@kano.ng',
      farmerName: 'Aisha Garba',
      farmLocation: { state: 'KANO', lga: 'Kura' },
      targetCrop: 'TOMATO',
      soilPhysics: { sandPct: 60, siltPct: 25, clayPct: 15 },
      soilChemistry: {
        phWater: 6.5,
        organicCarbonPct: 1.5, // OM = 1.5 * 1.724 = 2.59%
        totalNitrogenPct: 0.12, // C:N = 1.5 / 0.12 = 12.5
        availablePhosphorusBray1MgPerKg: 20.0,
        exchangeableCations: { calciumCa: 5.0, magnesiumMg: 2.0, potassiumK: 0.5, sodiumNa: 0.1 }
      }
    });

    assert.strictEqual(record.soilChemistry.organicMatterPct, 2.59);
    assert.strictEqual(record.soilChemistry.carbonNitrogenRatio, 12.5);
  });

  // Test 10: Cryptographic Seal computation
  await runTest('computeDiagnosticsAndSeal should generate valid SHA-256 seal', async () => {
    const record = new SoilSampleRecord({
      sampleId: 'SOIL-TEST-SEAL',
      farmerEmail: 'audit@agrily.ng',
      farmerName: 'Agrily Test Agronomist',
      farmLocation: { state: 'PLATEAU', lga: 'Jos South' },
      targetCrop: 'PEPPER',
      soilPhysics: { sandPct: 55, siltPct: 25, clayPct: 20 },
      soilChemistry: {
        phWater: 6.1,
        organicCarbonPct: 1.4,
        totalNitrogenPct: 0.11,
        availablePhosphorusBray1MgPerKg: 16.0,
        exchangeableCations: { calciumCa: 4.2, magnesiumMg: 1.6, potassiumK: 0.4, sodiumNa: 0.05 }
      }
    });

    record.computeDiagnosticsAndSeal();
    assert.ok(typeof record.cryptographicSeal === 'string');
    assert.strictEqual(record.cryptographicSeal.length, 64, 'SHA-256 seal must be 64-hex string');
  });

  // Test 11: FertilizerProductCatalog nutrient calculation
  await runTest('FertilizerProductCatalog should calculate exact elemental kg per 50kg bag', async () => {
    const npk15 = new FertilizerProductCatalog({
      productCode: 'NPK-15-15-15',
      brandName: 'Golden Fertilizer NPK 15-15-15',
      manufacturer: 'Flour Mills of Nigeria',
      category: 'INORGANIC_BLENDED',
      guaranteedAnalysis: {
        totalNitrogenPct: 15,
        availablePhosphateP2O5Pct: 15,
        solublePotashK2OPct: 15
      },
      packagingBagSizeKg: 50,
      marketWholesalePriceNaira: 38000,
      nafdacOrFsrNumber: 'FS-REG-01'
    });

    const nutrients = npk15.computeNutrientsPerBag();
    assert.strictEqual(nutrients.nitrogenKg, 7.5);
    assert.strictEqual(nutrients.phosphateP2O5Kg, 7.5);
    assert.strictEqual(nutrients.potashK2OKg, 7.5);
    assert.strictEqual(npk15.npkGrade, '15-15-15');
  });

  // Test 12: Urea 46% Nitrogen Calculation
  await runTest('FertilizerProductCatalog should calculate 23kg pure N per 50kg bag of Urea', async () => {
    const urea = new FertilizerProductCatalog({
      productCode: 'UREA-46',
      brandName: 'Indorama Granular Urea 46% N',
      manufacturer: 'Indorama Eleme Petrochemicals',
      category: 'INORGANIC_STRAIGHT',
      guaranteedAnalysis: {
        totalNitrogenPct: 46,
        availablePhosphateP2O5Pct: 0,
        solublePotashK2OPct: 0
      },
      packagingBagSizeKg: 50,
      marketWholesalePriceNaira: 39500,
      nafdacOrFsrNumber: 'FS-REG-02'
    });

    const nutrients = urea.computeNutrientsPerBag();
    assert.strictEqual(nutrients.nitrogenKg, 23.0);
    assert.strictEqual(urea.npkGrade, '46-0-0');
  });

  // Test 13: SoilPrescriptionPlan cost and seal computation
  await runTest('SoilPrescriptionPlan should compute total input costs, net profit, and seal', async () => {
    const plan = new SoilPrescriptionPlan({
      prescriptionId: 'RX-TEST-001',
      farmerEmail: 'farmer@benue.ng',
      farmerName: 'Torkwase Agber',
      targetCrop: 'YAM',
      fieldAcreageHectares: 2.0,
      targetYieldTonsPerHa: 15.0,
      elementalDeficitKgPerHa: { netNitrogenN: 60, netPhosphateP2O5: 40, netPotashK2O: 80 },
      recommendedCommercialMix: {
        programName: 'High Yield Tuber Program',
        items: [
          {
            productCode: 'NPK-15-15-15',
            brandName: 'Golden NPK',
            bagsPerHectare: 5,
            totalBagsForField: 10,
            applicationTiming: 'BASAL_AT_PLANTING',
            unitCostNaira: 38000,
            lineTotalNaira: 0
          },
          {
            productCode: 'MOP-0-0-60',
            brandName: 'Potassium Chloride',
            bagsPerHectare: 2,
            totalBagsForField: 4,
            applicationTiming: 'FIRST_TOP_DRESS_VEGETATIVE',
            unitCostNaira: 42000,
            lineTotalNaira: 0
          }
        ]
      },
      soilAmendmentPlan: {
        requiresLiming: true,
        amendmentMaterial: 'DOLOMITIC_LIMESTONE',
        dosageTonsPerHa: 1.0,
        totalLimeTonsForField: 2.0
      },
      economicImpact: {
        projectedGrossRevenueNaira: 2500000
      }
    });

    plan.computeCostAndSeal();

    // fertCost = (10 * 38000) + (4 * 42000) = 380000 + 168000 = 548000
    // limeCost = 2.0 * 45000 = 90000
    // totalCost = 548000 + 90000 = 638000
    // netProfit = 2500000 - 638000 = 1862000
    // ROI = 1862000 / 638000 = 2.92
    assert.strictEqual(plan.economicImpact.totalFertilizerCostNaira, 548000);
    assert.strictEqual(plan.economicImpact.estimatedLimeCostNaira, 90000);
    assert.strictEqual(plan.economicImpact.totalGrossInputCostNaira, 638000);
    assert.strictEqual(plan.economicImpact.projectedNetProfitNaira, 1862000);
    assert.strictEqual(plan.economicImpact.returnOnInvestmentMultiplier, 2.92);
    assert.strictEqual(plan.cryptographicValidationSeal.length, 64);
  });

  console.log(`\n🎉 Soil Sample & Fertilizer Model Tests: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

runSuite().catch((err) => {
  console.error('Soil Model test runner error:', err);
  process.exit(1);
});
