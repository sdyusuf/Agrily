/**
 * @file agronomyVisionRoutes.test.js
 * @description Supertest API integration tests for Agronomy AI Leaf Disease Vision,
 * Treatment Advisor, and Regional Outbreak Contagion Telemetry endpoints.
 */

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
  console.log('🌾 AGRILY SPRINT 17: AGRONOMY VISION REST API INTEGRATION TESTS');
  console.log('=================================================================\n');

  let sampleDiagnosisId = null;

  try {
    // -----------------------------------------------------------------
    // SECTION 1: Taxonomies & Metadata
    // -----------------------------------------------------------------
    console.log('--- SECTION 1: Supported Taxonomies & Pathology Knowledge Graph ---');

    const taxRes = await request(app).get('/api/agronomy-vision/supported-taxonomies');
    assert(taxRes.status === 200, 'GET /api/agronomy-vision/supported-taxonomies returns HTTP 200');
    assert(taxRes.body.success === true, 'Returns success: true');
    assert(Array.isArray(taxRes.body.supportedCrops) && taxRes.body.supportedCrops.length === 10, 'Lists 10 supported Nigerian crops');
    assert(taxRes.body.supportedCrops.includes('TOMATO') && taxRes.body.supportedCrops.includes('CASSAVA'), 'Includes Tomato and Cassava');
    assert(Array.isArray(taxRes.body.pathogenTypes) && taxRes.body.pathogenTypes.includes('FUNGAL'), 'Includes FUNGAL pathogen taxonomy');
    assert(taxRes.body.taxonomyGraph && taxRes.body.taxonomyGraph.TOMATO.length >= 4, 'Provides comprehensive tomato diseases in graph');

    // -----------------------------------------------------------------
    // SECTION 2: AI Leaf Pathology Diagnosis
    // -----------------------------------------------------------------
    console.log('\n--- SECTION 2: AI Leaf Disease Inference & Triage Staging ---');

    // 2.1 Diagnosis of Tomato Early Blight
    const diagRes = await request(app)
      .post('/api/agronomy-vision/diagnose')
      .send({
        cropType: 'TOMATO',
        farmerName: 'Alhaji Musa Danbaba',
        farmLocation: {
          state: 'KANO',
          lga: 'Kura',
          agroZone: 'SUDAN_SAVANNA',
          coordinates: { latitude: 11.77, longitude: 8.43 }
        },
        fieldAcreageHectares: 3.5,
        imageUrl: 'https://cdn.agrily.africa/leaves/tomato_early_blight.jpg',
        forcedDiseaseCode: 'TOM-EB-001',
        severityLevel: 'MODERATE'
      });

    assert(diagRes.status === 201, 'POST /api/agronomy-vision/diagnose returns HTTP 201 Created');
    assert(diagRes.body.success === true, 'Diagnosis returns success: true');
    assert(diagRes.body.record && diagRes.body.record.diagnosisId, 'Generates valid unique diagnosisId');
    assert(diagRes.body.record.aiInference.diseaseCode === 'TOM-EB-001', 'Correctly diagnoses TOM-EB-001');
    assert(diagRes.body.record.aiInference.triagePriority === 'MEDIUM_ISOLATE_ZONE', 'Stages triage priority as MEDIUM_ISOLATE_ZONE');
    assert(diagRes.body.record.cryptographicSeal && diagRes.body.record.cryptographicSeal.length === 64, 'Includes 64-character SHA-256 seal');
    assert(diagRes.body.visionTelemetry.detectedLesionCount > 0, 'Detects foliar lesion bounding boxes');

    sampleDiagnosisId = diagRes.body.record.diagnosisId;

    // 2.2 Diagnosis of Healthy Leaf
    const healthyRes = await request(app)
      .post('/api/agronomy-vision/diagnose')
      .send({
        cropType: 'MAIZE',
        farmerName: 'Audu Bako',
        farmLocation: { state: 'KADUNA', lga: 'Zaria' },
        fieldAcreageHectares: 2.0,
        forcedDiseaseCode: 'MAIZ-HEALTHY'
      });

    assert(healthyRes.status === 201, 'POST /api/agronomy-vision/diagnose for healthy foliage returns HTTP 201');
    assert(healthyRes.body.record.aiInference.pathogenType === 'NONE_HEALTHY', 'Identifies healthy pathogen profile');
    assert(healthyRes.body.record.economicImpactEstimate.projectedYieldLossPct === 0, 'Zero projected yield loss for healthy foliage');

    // 2.3 Rejects diagnosis request without cropType
    const badDiag = await request(app)
      .post('/api/agronomy-vision/diagnose')
      .send({ farmerName: 'Incomplete Request' });

    assert(badDiag.status === 400, 'Rejects diagnosis without cropType with HTTP 400');

    // -----------------------------------------------------------------
    // SECTION 3: Diagnosis History & Retrieval
    // -----------------------------------------------------------------
    console.log('\n--- SECTION 3: Diagnosis History & By-ID Retrieval ---');

    // 3.1 Fetch list of diagnoses
    const listRes = await request(app).get('/api/agronomy-vision/diagnoses?crop=TOMATO');
    assert(listRes.status === 200, 'GET /api/agronomy-vision/diagnoses returns HTTP 200');
    assert(listRes.body.success === true, 'Returns success: true for list');
    assert(Array.isArray(listRes.body.records) && listRes.body.records.length >= 1, 'Returns array of diagnoses filtered by crop');

    // 3.2 Fetch individual diagnosis by diagnosisId
    const singleRes = await request(app).get(`/api/agronomy-vision/diagnoses/${sampleDiagnosisId}`);
    assert(singleRes.status === 200, `GET /api/agronomy-vision/diagnoses/${sampleDiagnosisId} returns HTTP 200`);
    assert(singleRes.body.record.diagnosisId === sampleDiagnosisId, 'Returns matched diagnosis record');

    // 3.3 Nonexistent diagnosis returns 404
    const notFoundRes = await request(app).get('/api/agronomy-vision/diagnoses/DX-NONEXISTENT-999');
    assert(notFoundRes.status === 404, 'Returns HTTP 404 for non-existent diagnosis ID');

    // -----------------------------------------------------------------
    // SECTION 4: Agronomy Treatment Prescriptions
    // -----------------------------------------------------------------
    console.log('\n--- SECTION 4: Treatment Prescriptions & Dosage Calculator ---');

    // 4.1 Chemical & organic prescriptions for Tomato Early Blight
    const rxRes = await request(app)
      .post('/api/agronomy-vision/treatment-prescription')
      .send({
        diseaseCode: 'TOM-EB-001',
        cropType: 'TOMATO',
        fieldAcreageHectares: 4.0
      });

    assert(rxRes.status === 200, 'POST /api/agronomy-vision/treatment-prescription returns HTTP 200');
    assert(rxRes.body.success === true, 'Prescription generation returns success: true');
    assert(rxRes.body.treatments.length >= 2, 'Recommends both chemical and biological treatments');
    
    const chemTreatment = rxRes.body.treatments.find(t => t.type === 'SYSTEMIC_CHEMICAL_FUNGICIDE');
    assert(chemTreatment !== undefined, 'Includes systemic chemical fungicide');
    assert(chemTreatment.acreageCalculations.totalChemicalProductRequired === 10.0, 'Correctly computes dosage for 4 hectares (2.5kg * 4 = 10.0kg)');
    assert(chemTreatment.safetyClearance.preHarvestIntervalDays === 14, 'Enforces 14-day Pre-Harvest Interval (PHI)');
    assert(chemTreatment.safetyClearance.foodSafetyStatus === 'MANDATORY_RESIDUE_WITHDRAWAL_WINDOW', 'Marks mandatory withdrawal safety window');
    assert(rxRes.body.phytosanitaryClearanceSeal.length === 64, 'Includes 64-char phytosanitary clearance seal');

    // 4.2 Filter Organic Only
    const organicRxRes = await request(app)
      .post('/api/agronomy-vision/treatment-prescription')
      .send({
        diseaseCode: 'TOM-EB-001',
        cropType: 'TOMATO',
        fieldAcreageHectares: 2.0,
        preferOrganicOnly: true
      });

    assert(organicRxRes.status === 200, 'Organic-only prescription returns HTTP 200');
    assert(organicRxRes.body.treatments.every(t => t.organicCertified === true), 'All recommended treatments are 100% organic certified');

    // 4.3 Missing disease code
    const badRx = await request(app)
      .post('/api/agronomy-vision/treatment-prescription')
      .send({});

    assert(badRx.status === 400, 'Rejects prescription request without diseaseCode with HTTP 400');

    // -----------------------------------------------------------------
    // SECTION 5: Regional Outbreak Telemetry & Haulage Corridor Check
    // -----------------------------------------------------------------
    console.log('\n--- SECTION 5: Regional Outbreak Telemetry & Corridor Clearance ---');

    // 5.1 Outbreak telemetry summary
    const outRes = await request(app).get('/api/agronomy-vision/outbreak-telemetry');
    assert(outRes.status === 200, 'GET /api/agronomy-vision/outbreak-telemetry returns HTTP 200');
    assert(outRes.body.success === true, 'Returns success: true for outbreak telemetry');
    assert(outRes.body.summary.totalStatesMonitored === 37, 'Monitors 37 Nigerian administrative territories');
    assert(outRes.body.summary.criticalLockdownsCount >= 1, 'Identifies critical quarantine lockdown clusters');
    assert(outRes.body.nationalTelemetrySeal.length === 64, 'Includes tamper-evident national telemetry seal');

    // 5.2 Corridor clearance for Plateau State (under lockdown for Late Blight)
    const plateauClearance = await request(app).get('/api/agronomy-vision/corridor-clearance/PLATEAU');
    assert(plateauClearance.status === 200, 'GET /api/agronomy-vision/corridor-clearance/PLATEAU returns HTTP 200');
    assert(plateauClearance.body.clearance.isTransitInterdicted === true, 'Flags Plateau corridor as transit interdicted');
    assert(plateauClearance.body.clearance.corridorClearance === 'TRANSIT_PROHIBITED_QUARANTINE_ACTIVE', 'Flags transit prohibited quarantine active');

    // 5.3 Corridor clearance for unaffected state (e.g. Lagos)
    const lagosClearance = await request(app).get('/api/agronomy-vision/corridor-clearance/LAGOS');
    assert(lagosClearance.status === 200, 'GET /api/agronomy-vision/corridor-clearance/LAGOS returns HTTP 200');
    assert(lagosClearance.body.clearance.isTransitInterdicted === false, 'Transit clear across Lagos state');

    // 5.4 Report new outbreak incident
    const reportRes = await request(app)
      .post('/api/agronomy-vision/report-outbreak')
      .send({
        state: 'KADUNA',
        lgas: ['Makarfi', 'Kudan'],
        cropType: 'TOMATO',
        pathogenName: 'Bacterial Spot (Xanthomonas)',
        reportedCasesCount: 30,
        confirmedAcreageHectares: 120.0
      });

    assert(reportRes.status === 201, 'POST /api/agronomy-vision/report-outbreak returns HTTP 201');
    assert(reportRes.body.success === true, 'Incident registration returns success: true');
    assert(reportRes.body.outbreakStatus === 'EPIDEMIC_SURGE_WARNING', 'Correctly rates 30 cases as EPIDEMIC_SURGE_WARNING');
    assert(reportRes.body.quarantineRadiusKm === 15.0, 'Enforces 15km quarantine radius');

  } catch (err) {
    console.error('Test execution fatal error:', err);
    failedTests++;
  }

  console.log('\n=================================================================');
  console.log(`TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('=================================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
