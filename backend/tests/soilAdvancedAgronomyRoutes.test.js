/**
 * ==============================================================================
 * AGRILY SPRINT 18 TEST SUITE - ADVANCED AGRONOMY ROUTE INTEGRATION TESTS
 * ==============================================================================
 * 
 * Verifies the 6 new advanced agronomic API endpoints:
 * 1. POST /api/soil-nutrition/cation-balance (BCSR cation equilibrium & gypsum)
 * 2. POST /api/soil-nutrition/carbon-dynamics (RothC/Century multi-year SOC)
 * 3. POST /api/soil-nutrition/microbial-enzymes (BFI & bio-inoculants)
 * 4. GET  /api/soil-nutrition/crop-phenology/:crop (Phenological uptake curves)
 * 5. POST /api/soil-nutrition/diagnose-symptoms (Visual deficiency diagnostics & foliar recipes)
 * 6. POST /api/soil-nutrition/nutrient-removal-budget (Harvest removal balances)
 */

'use strict';

const assert = require('assert');
const http = require('http');
const express = require('express');
const soilNutritionRoutes = require('../routes/soilNutritionRoutes');

console.log('\n=================================================================');
console.log('🌾 AGRILY SPRINT 18: ADVANCED AGRONOMY REST API TEST SUITE');
console.log('=================================================================\n');

let server;
let baseUrl;
let passed = 0;
let failed = 0;

function runTest(desc, fn) {
  return fn()
    .then(() => {
      console.log(`  ✓ PASS: ${desc}`);
      passed++;
    })
    .catch((err) => {
      console.error(`  ✗ FAIL: ${desc} -> ${err.message}`);
      failed++;
    });
}

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function startSuite() {
  const app = express();
  app.use(express.json());
  app.use('/api/soil-nutrition', soilNutritionRoutes);

  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  // TEST 1: Cation Balance BCSR
  await runTest('POST /api/soil-nutrition/cation-balance returns BCSR saturation and gypsum advisory', async () => {
    const payload = {
      exchangeableCations: {
        calcium: 3.5,
        magnesium: 2.2,
        potassium: 0.2,
        sodium: 1.1,
        exchangeableAcidity: 0.8
      },
      phWater: 6.8,
      targetedCrop: 'MAIZE',
      soilTexture: 'SANDY_LOAM'
    };

    const res = await makeRequest('POST', '/api/soil-nutrition/cation-balance', payload);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(res.body.data.effectiveCationExchangeCapacity > 0);
    assert(res.body.data.cationSaturationPercentages.calciumPct > 0);
    assert(res.body.data.dispersionRisk.riskLevel);
  });

  // TEST 2: Multi-Year Carbon Dynamics
  await runTest('POST /api/soil-nutrition/carbon-dynamics simulates multi-year SOC trajectory', async () => {
    const payload = {
      baselineOrganicMatterPct: 1.2,
      managementPractice: 'INTEGRATED_BIOCHAR_ORGANIC',
      simulationYears: 5,
      agroEcologicalZone: 'SUDAN_SAVANNA',
      clayContentPct: 12.0
    };

    const res = await makeRequest('POST', '/api/soil-nutrition/carbon-dynamics', payload);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.simulationHorizonYears, 5);
    assert(Array.isArray(res.body.data.annualTrajectory));
    assert.strictEqual(res.body.data.annualTrajectory.length, 5);
    assert(res.body.data.summary.netCarbonSequestrationTonsPerHa > 0);
  });

  // TEST 3: Soil Microbial Enzymes & Bio-Inoculants
  await runTest('POST /api/soil-nutrition/microbial-enzymes evaluates BFI and prescribes bio-inoculants', async () => {
    const payload = {
      enzymaticAssays: {
        dehydrogenaseDha: 35.0,
        ureaseEnzyme: 30.0,
        alkalinePhosphataseAlp: 70.0,
        betaGlucosidaseGlu: 40.0,
        fluoresceinDiacetateFda: 1.1
      },
      soilOrganicCarbonPct: 0.9,
      targetCrop: 'COWPEA'
    };

    const res = await makeRequest('POST', '/api/soil-nutrition/microbial-enzymes', payload);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(res.body.data.biologicalFertilityIndex.score > 0);
    assert(Array.isArray(res.body.data.prescribedBioInoculants));
    const hasRhizobium = res.body.data.prescribedBioInoculants.some(i => i.targetCrops && i.targetCrops.includes('COWPEA'));
    assert(hasRhizobium);
  });

  // TEST 4: Phenological Uptake Curve
  await runTest('GET /api/soil-nutrition/crop-phenology/RICE returns stage uptake partitioning', async () => {
    const res = await makeRequest('GET', '/api/soil-nutrition/crop-phenology/RICE');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.crop, 'RICE');
    assert(Array.isArray(res.body.data.stages));
    assert(res.body.data.stages.length >= 3);
  });

  // TEST 5: Visual Deficiency Diagnostics & Foliar Chelate Recipe
  await runTest('POST /api/soil-nutrition/diagnose-symptoms diagnoses Blossom-End Rot and gives foliar recipe', async () => {
    const payload = {
      crop: 'TOMATO',
      observedKeywords: ['blossom-end', 'rot', 'fruit'],
      affectedCanopyPosition: 'FRUITS_BUDS',
      fieldAcreageHectares: 2.0
    };

    const res = await makeRequest('POST', '/api/soil-nutrition/diagnose-symptoms', payload);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.diagnosis.topDiagnosis.deficiencyKey, 'CALCIUM_DEFICIENCY');
    assert(res.body.emergencyFoliarPrescription !== null);
    assert.strictEqual(res.body.emergencyFoliarPrescription.fieldAcreageHectares, 2.0);
    assert(res.body.emergencyFoliarPrescription.prescriptionProtocols.length > 0);
  });

  // TEST 6: Harvest Removal Balance & Soil Replenishment Budget
  await runTest('POST /api/soil-nutrition/nutrient-removal-budget computes stoichiometric crop removal', async () => {
    const payload = {
      crop: 'CASSAVA',
      targetedYieldTonsPerHa: 20.0,
      fieldAcreageHectares: 3.0
    };

    const res = await makeRequest('POST', '/api/soil-nutrition/nutrient-removal-budget', payload);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.totalExpectedHarvestTons, 60.0);
    assert(res.body.data.elementalRemovalBudget.potashK2OKg > 0);
    assert(res.body.data.soilDepletionAdvisory.includes('replenish'));
  });

  // Cleanup
  await new Promise(r => server.close(r));

  console.log('\n=================================================================');
  console.log(`🏁 TEST RESULTS: ${passed} Passed, ${failed} Failed.`);
  console.log('=================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

startSuite().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
