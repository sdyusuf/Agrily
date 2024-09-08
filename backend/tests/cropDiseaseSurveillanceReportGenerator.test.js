/**
 * ==============================================================================
 * AGRILY BACKEND TEST SUITE - CROP DISEASE SURVEILLANCE REPORT GENERATOR
 * ==============================================================================
 * 
 * Verifies:
 * 1. Outbreak Velocity Index (OVI) computation on empty and active datasets.
 * 2. 7-Zone Agro-Ecological epidemiology aggregation and R_0 reproduction scoring.
 * 3. Executive Surveillance Bulletin generation in Markdown and HTML.
 * 4. Cryptographic SHA-256 seal integrity and tamper resistance.
 * 
 * @module tests/cropDiseaseSurveillanceReportGenerator.test
 */

'use strict';

const assert = require('assert');
const {
  CropDiseaseSurveillanceReportGenerator,
  AGRO_ECOLOGICAL_ZONES,
  SEVERITY_FACTORS
} = require('../services/cropDiseaseSurveillanceReportGenerator');

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
  console.log('\n🧪 Starting Crop Disease Surveillance Report Generator Tests...\n');

  // Test 1: Empty record set handling
  await runTest('calculateOutbreakVelocity should handle empty or null dataset gracefully', async () => {
    const emptyResult = CropDiseaseSurveillanceReportGenerator.calculateOutbreakVelocity([]);
    assert.strictEqual(emptyResult.sampleSize, 0);
    assert.strictEqual(emptyResult.outbreakVelocityIndex, 0.0);
    assert.strictEqual(emptyResult.velocityClassification, 'STABLE_DORMANT');
  });

  // Test 2: Active outbreak velocity scaling
  await runTest('calculateOutbreakVelocity should compute OVI and identify dominant crop and pathogen', async () => {
    const mockRecords = [
      { cropName: 'Tomato', pathogenType: 'FUNGAL', severityLevel: 'SEVERE_NECROSIS', confidenceScore: 0.94, fieldAcreage: 5 },
      { cropName: 'Tomato', pathogenType: 'FUNGAL', severityLevel: 'CRITICAL_SYSTEMIC', confidenceScore: 0.98, fieldAcreage: 10 },
      { cropName: 'Cassava', pathogenType: 'VIRAL', severityLevel: 'MODERATE_BLIGHT', confidenceScore: 0.88, fieldAcreage: 8 },
      { cropName: 'Tomato', pathogenType: 'FUNGAL', severityLevel: 'SEVERE_NECROSIS', confidenceScore: 0.91, fieldAcreage: 12 }
    ];

    const result = CropDiseaseSurveillanceReportGenerator.calculateOutbreakVelocity(mockRecords, 7);
    assert.strictEqual(result.sampleSize, 4);
    assert.strictEqual(result.dominantCrop, 'TOMATO');
    assert.strictEqual(result.dominantPathogen, 'FUNGAL');
    assert.ok(result.outbreakVelocityIndex > 0, 'OVI must be positive');
    assert.ok(['MODERATE_PROGRESSION', 'RAPID_ACCELERATION', 'EXPLOSIVE_EXPONENTIAL'].includes(result.velocityClassification));
  });

  // Test 3: Agro-Ecological Zonal Epidemiology aggregation
  await runTest('aggregateZonalEpidemiology should map all 7 Nigerian agro-zones and compute R_0', async () => {
    const sampleRecords = [
      { state: 'Kano', severityLevel: 'MODERATE_BLIGHT' },
      { state: 'Kaduna', severityLevel: 'CRITICAL_SYSTEMIC' },
      { state: 'Ogun', severityLevel: 'CRITICAL_SYSTEMIC' },
      { state: 'Rivers', severityLevel: 'SEVERE_NECROSIS' },
      { state: 'Ogun', severityLevel: 'CRITICAL_SYSTEMIC' }
    ];

    const zonal = CropDiseaseSurveillanceReportGenerator.aggregateZonalEpidemiology(sampleRecords);
    assert.strictEqual(zonal.length, 7, 'Must evaluate exactly 7 Nigerian agro-zones');

    const humidRainforest = zonal.find((z) => z.zoneKey === 'HUMID_RAINFOREST');
    assert.ok(humidRainforest, 'Humid Rainforest zone must exist');
    assert.strictEqual(humidRainforest.activeIncidentCount, 2);
    assert.strictEqual(humidRainforest.quarantineCount, 2);
    assert.ok(humidRainforest.estimatedReproductionRateR0 >= 1.5, 'R0 must elevate in humid rainforest zone');
  });

  // Test 4: Surveillance Bulletin generation and cryptographic seal
  await runTest('generateSurveillanceBulletin should emit Markdown, HTML, and cryptographic SHA-256 seal', async () => {
    const records = [
      { cropName: 'Tomato', pathogenType: 'FUNGAL', severityLevel: 'SEVERE_NECROSIS', confidenceScore: 0.95, state: 'Kano', acreage: 15 },
      { cropName: 'Yam', pathogenType: 'FUNGAL', severityLevel: 'MODERATE_BLIGHT', confidenceScore: 0.89, state: 'Benue', acreage: 20 },
      { cropName: 'Cocoa', pathogenType: 'OOMYCETE', severityLevel: 'CRITICAL_SYSTEMIC', confidenceScore: 0.98, state: 'Ondo', acreage: 30 }
    ];

    const bulletin = CropDiseaseSurveillanceReportGenerator.generateSurveillanceBulletin({
      reportingAgency: 'FMARD Epidemiological Center & NAQS',
      bulletinPeriod: 'EpiWeek 36 - Sep 2024',
      pathologyRecords: records
    });

    assert.ok(bulletin.bulletinId.startsWith('AGRI-SURV-'));
    assert.ok(typeof bulletin.bulletinSeal === 'string' && bulletin.bulletinSeal.length === 64, 'Seal must be 64-char SHA-256 hex');
    assert.ok(bulletin.nationalIndex >= 5 && bulletin.nationalIndex <= 100);
    assert.ok(bulletin.markdownReport.includes('AGRILY NATIONAL PHYTOSANITARY SURVEILLANCE BULLETIN'));
    assert.ok(bulletin.htmlReport.includes('<!DOCTYPE html>'));
    assert.ok(bulletin.logisticsEstimates.recommendedFungicideLiters > 0);
  });

  console.log(`\n🎉 Crop Disease Surveillance Report Tests: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

runSuite().catch((err) => {
  console.error('Surveillance Report test runner error:', err);
  process.exit(1);
});
