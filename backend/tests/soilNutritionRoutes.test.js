/**
 * ==============================================================================
 * AGRILY SPRINT 18: SOIL NUTRITION & FERTILIZER REST API INTEGRATION TESTS
 * ==============================================================================
 * 
 * Verifies:
 * 1. Commercial fertilizer catalog retrieval and elemental concentration.
 * 2. 7 Nigerian agro-ecological zone profiles and geostatistical state resolution.
 * 3. Soil chemistry evaluation engine (Liebig's Law of the Minimum & liming calculations).
 * 4. Simplex fertilizer optimization engine for minimal 50kg bag combinations.
 * 5. Soil sample registration with automated USDA ternary texture classification & ECEC.
 * 6. Sample lookup by ID and by farmer email.
 * 7. Prescription plan generation with full economic analysis and cryptographic SHA-256 seal.
 * 
 * @module tests/soilNutritionRoutes.test
 */

'use strict';

const request = require('supertest');
const app = require('../app');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedTests++;
  }
}

async function runTests() {
  console.log('\n=================================================================');
  console.log('🧪 AGRILY SPRINT 18: SOIL NUTRITION REST API INTEGRATION TESTS');
  console.log('=================================================================\n');

  let sampleRegisteredId = null;
  const testFarmerEmail = 'alhaji.musa.danbaba@kura-farms.ng';

  try {
    // -----------------------------------------------------------------
    // SECTION 1: Catalog & Regional Agro-Zone Profiles
    // -----------------------------------------------------------------
    console.log('--- SECTION 1: Commercial Fertilizer Catalog & Regional Baselines ---');

    // 1.1 Commercial Fertilizer Catalog
    const catalogRes = await request(app).get('/api/soil-nutrition/fertilizer-catalog');
    assert(catalogRes.status === 200, 'GET /api/soil-nutrition/fertilizer-catalog returns HTTP 200');
    assert(catalogRes.body.success === true, 'Returns success: true');
    assert(Array.isArray(catalogRes.body.catalog) && catalogRes.body.catalog.length >= 7, 'Lists at least 7 commercial fertilizer products');
    const npk15 = catalogRes.body.catalog.find((p) => p.productCode === 'NPK-15-15-15');
    assert(npk15 && npk15.nitrogenPct === 15, 'NPK 15-15-15 contains 15% N');

    // 1.2 Agro-Zones Listing
    const zonesRes = await request(app).get('/api/soil-nutrition/agro-zones');
    assert(zonesRes.status === 200, 'GET /api/soil-nutrition/agro-zones returns HTTP 200');
    assert(zonesRes.body.zones.length === 7, 'Provides profiles for all 7 Nigerian agro-ecological zones');

    // 1.3 Regional Agro-Zone Profile by Zone Key
    const sudanRes = await request(app).get('/api/soil-nutrition/agro-zone-profile/SUDAN_SAVANNA');
    assert(sudanRes.status === 200, 'GET /api/soil-nutrition/agro-zone-profile/SUDAN_SAVANNA returns HTTP 200');
    assert(sudanRes.body.profile.zoneKey === 'SUDAN_SAVANNA', 'Zone key is SUDAN_SAVANNA');
    assert(sudanRes.body.profile.states.includes('Kano'), 'Sudan Savanna includes Kano state');

    // 1.4 Regional Agro-Zone Profile by State Name
    const stateRes = await request(app).get('/api/soil-nutrition/agro-zone-profile-by-state/Osun');
    assert(stateRes.status === 200, 'GET /api/soil-nutrition/agro-zone-profile-by-state/Osun returns HTTP 200');
    assert(stateRes.body.profile.zoneKey === 'DERIVED_SAVANNA', 'Osun state resolves to DERIVED_SAVANNA');

    // -----------------------------------------------------------------
    // SECTION 2: Soil Chemistry Evaluation Engine (Liebig's Law)
    // -----------------------------------------------------------------
    console.log('\n--- SECTION 2: Soil Chemistry Evaluation (Liebig Law & Liming) ---');

    const evalRes = await request(app)
      .post('/api/soil-nutrition/evaluate-chemistry')
      .send({
        crop: 'MAIZE',
        soilChemistry: {
          phWater: 5.2, // Acidic soil requiring liming
          organicCarbonPct: 0.7,
          totalNitrogenPct: 0.06,
          availablePhosphorusBray1MgPerKg: 8.0, // Deficient phosphorus
          exchangeablePotassiumK: 0.35,
          exchangeableCalciumCa: 2.5,
          exchangeableMagnesiumMg: 0.8,
          exchangeableSodiumNa: 0.05,
          exchangeableAcidityAlPlusH: 1.2, // Elevated acid cations
          sulfateSulfurMgPerKg: 6.0,
          zincPpm: 1.1,
          boronPpm: 0.3
        }
      });

    assert(evalRes.status === 200, 'POST /api/soil-nutrition/evaluate-chemistry returns HTTP 200');
    assert(evalRes.body.evaluation.crop === 'MAIZE', 'Evaluated crop is MAIZE');
    assert(evalRes.body.evaluation.limingRecommendation.requiresLiming === true, 'Accurately flags acidic soil requiring liming');
    assert(evalRes.body.evaluation.phStatus.aluminumToxicityRisk !== 'NONE', 'Identifies aluminum toxicity risk for low pH');
    assert(evalRes.body.evaluation.liebigLimitingNutrient.nutrient !== undefined, 'Identifies Liebig limiting nutrient');

    // -----------------------------------------------------------------
    // SECTION 3: Simplex Fertilizer Optimization Engine
    // -----------------------------------------------------------------
    console.log('\n--- SECTION 3: Simplex Commercial Fertilizer Bag Mix Optimization ---');

    const optRes = await request(app)
      .post('/api/soil-nutrition/optimize-fertilizer')
      .send({
        crop: 'TOMATO',
        fieldAcreageHectares: 2.5,
        targetYieldTonsPerHa: 25.0,
        preferredBasalType: 'NPK_15_15_15',
        soilChemistry: {
          phWater: 6.2,
          organicCarbonPct: 0.9,
          totalNitrogenPct: 0.08,
          availablePhosphorusBray1MgPerKg: 10.0,
          exchangeablePotassiumK: 0.28,
          exchangeableCalciumCa: 4.2,
          exchangeableMagnesiumMg: 1.5,
          exchangeableSodiumNa: 0.1,
          exchangeableAcidityAlPlusH: 0.2
        }
      });

    assert(optRes.status === 200, 'POST /api/soil-nutrition/optimize-fertilizer returns HTTP 200');
    assert(optRes.body.optimization.crop === 'TOMATO', 'Optimization target is TOMATO');
    assert(optRes.body.optimization.recommendedCommercialMix.items.length >= 2, 'Recommends compound basal + top-dress commercial mix');
    assert(optRes.body.optimization.economics.totalFertilizerCostNaira > 0, 'Computes total fertilizer procurement cost');
    assert(optRes.body.optimization.economics.estimatedSavingsVsGenericFertilizerNaira > 0, 'Demonstrates cost savings over generic broadcast');

    // -----------------------------------------------------------------
    // SECTION 4: Soil Sample Registration & Querying
    // -----------------------------------------------------------------
    console.log('\n--- SECTION 4: Soil Sample Registration & Telemetry Querying ---');

    const sampleRes = await request(app)
      .post('/api/soil-nutrition/sample')
      .send({
        farmerEmail: testFarmerEmail,
        farmerName: 'Alhaji Musa Danbaba',
        farmLocation: {
          state: 'Kano',
          lga: 'Kura',
          farmName: 'Bunkure Irrigation Sector 4',
          coordinates: { latitude: 11.75, longitude: 8.42 }
        },
        fieldAcreageHectares: 3.5,
        targetCrop: 'RICE',
        soilPhysics: {
          sandPercentage: 25,
          siltPercentage: 40,
          clayPercentage: 35,
          bulkDensityGramsPerCm3: 1.30
        },
        soilChemistry: {
          phWater: 6.5,
          organicCarbonPct: 1.1,
          totalNitrogenPct: 0.12,
          availablePhosphorusBray1MgPerKg: 14.0,
          exchangeablePotassiumK: 0.42,
          exchangeableCalciumCa: 5.0,
          exchangeableMagnesiumMg: 2.1,
          exchangeableSodiumNa: 0.15,
          exchangeableAcidityAlPlusH: 0.1,
          sulfateSulfurMgPerKg: 10.0,
          zincPpm: 2.4,
          boronPpm: 0.5
        }
      });

    if (sampleRes.status !== 201) {
      console.log('sampleRes error:', sampleRes.status, sampleRes.body);
    }
    assert(sampleRes.status === 201, 'POST /api/soil-nutrition/sample returns HTTP 201 Created');
    assert(sampleRes.body.success === true, 'Returns success: true');
    sampleRegisteredId = sampleRes.body.sampleId;
    assert(sampleRegisteredId && sampleRegisteredId.startsWith('SL-'), 'Generates standard SL- prefixed sampleId');
    assert(sampleRes.body.record.soilPhysics.texturalClass === 'CLAY_LOAM', 'Classifies 25% sand, 40% silt, 35% clay as CLAY_LOAM');
    assert(sampleRes.body.record.cationExchangeProperties.effectiveCec > 7.0, 'Computes accurate ECEC');
    assert(sampleRes.body.record.cryptographicSeal && sampleRes.body.record.cryptographicSeal.hashSha256, 'Generates SHA-256 seal');

    // 4.2 Query Sample By ID
    const getSampleRes = await request(app).get(`/api/soil-nutrition/sample/${sampleRegisteredId}`);
    assert(getSampleRes.status === 200, `GET /api/soil-nutrition/sample/${sampleRegisteredId} returns HTTP 200`);
    assert(getSampleRes.body.record.sampleId === sampleRegisteredId, 'Sample ID matches requested ID');

    // 4.3 Query Samples By Farmer Email
    const getFarmerRes = await request(app).get(`/api/soil-nutrition/samples/farmer/${testFarmerEmail}`);
    assert(getFarmerRes.status === 200, 'GET /api/soil-nutrition/samples/farmer/:email returns HTTP 200');
    assert(getFarmerRes.body.records.some((r) => r.sampleId === sampleRegisteredId), 'Farmer sample list includes registered sample');

    // -----------------------------------------------------------------
    // SECTION 5: Prescription Plan Generation
    // -----------------------------------------------------------------
    console.log('\n--- SECTION 5: Soil Prescription Plan Generation ---');

    const rxRes = await request(app)
      .post('/api/soil-nutrition/generate-prescription')
      .send({
        sampleId: sampleRegisteredId,
        farmerEmail: testFarmerEmail,
        farmerName: 'Alhaji Musa Danbaba',
        crop: 'RICE',
        fieldAcreageHectares: 3.5,
        targetYieldTonsPerHa: 6.5,
        soilChemistry: {
          phWater: 6.5,
          organicCarbonPct: 1.1,
          totalNitrogenPct: 0.12,
          availablePhosphorusBray1MgPerKg: 14.0,
          exchangeablePotassiumK: 0.42,
          exchangeableCalciumCa: 5.0,
          exchangeableMagnesiumMg: 2.1,
          exchangeableSodiumNa: 0.15,
          exchangeableAcidityAlPlusH: 0.1
        }
      });

    assert(rxRes.status === 201, 'POST /api/soil-nutrition/generate-prescription returns HTTP 201 Created');
    assert(rxRes.body.prescription.prescriptionId.startsWith('RX-SOIL-'), 'Generates RX-SOIL- prefixed prescriptionId');
    assert(rxRes.body.prescription.recommendedBagMix.length > 0, 'Contains commercial bag mix line items');
    assert(rxRes.body.prescription.splitApplicationSchedule.length === 2, 'Contains 2-stage split application schedule');
    assert(rxRes.body.prescription.financialSummary.estimatedReturnOnInvestmentPct > 0, 'Calculates positive return on investment %');
    assert(rxRes.body.prescription.cryptographicValidationSeal.verificationHash, 'Cryptographically seals prescription plan');

  } catch (error) {
    console.error('Test execution error:', error);
    failedTests++;
  }

  console.log('\n=================================================================');
  console.log(`🏁 INTEGRATION TEST COMPLETE: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('=================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
