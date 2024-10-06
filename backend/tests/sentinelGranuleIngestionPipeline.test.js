/**
 * ==============================================================================
 * 🛰️ SENTINEL GRANULE INGESTION PIPELINE TEST SUITE
 * ==============================================================================
 * 
 * Verifies:
 * 1. SAFE Archive Directory Naming Decomposition:
 *    - Validates regex compliance against European Space Agency (ESA) format.
 *    - Extracts satellite platform (S2A/S2B), product level (MSIL2A), orbit, and MGRS tile.
 * 2. Digital Number (DN) to Physical Reflectance Conversion:
 *    - PB 04.00+ offset adjustment (BOA_ADD_OFFSET = 1000) and quantification scaling (10000).
 * 3. Scene Quality Indicator (QI) Flags & Cloud Occlusion Rejection:
 *    - Distinguishes pristine, partial cloud, and rejected scenes exceeding 45% coverage.
 * 4. End-to-End Granule Ingestion & Zonal Statistics Calculation.
 * 
 * @module tests/sentinelGranuleIngestionPipeline.test
 * ==============================================================================
 */

'use strict';

const assert = require('assert');
const {
  sentinelGranuleIngestionPipeline,
  SENTINEL_SAFE_CONSTANTS
} = require('../services/sentinelGranuleIngestionPipeline');

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
  console.log('\n🛰️ Starting Sentinel Granule Ingestion Pipeline Tests...\n');

  // Test 1: SAFE naming decomposition
  await runTest('parseSafePackageIdentifier should decompose valid Sentinel-2 SAFE granule name', async () => {
    const validSafeName = 'S2A_MSIL2A_20240918T095031_N0511_R037_T32NNG_20240918T134522.SAFE';
    const parsed = sentinelGranuleIngestionPipeline.parseSafePackageIdentifier(validSafeName);

    assert.strictEqual(parsed.isValidSafePackage, true);
    assert.strictEqual(parsed.satellitePlatform, 'S2A');
    assert.strictEqual(parsed.productLevel, 'MSIL2A');
    assert.strictEqual(parsed.processingBaseline, 'N0511');
    assert.strictEqual(parsed.relativeOrbit, 'R037');
    assert.strictEqual(parsed.mgrsTile, '32NNG');
    assert.strictEqual(parsed.sensingDate, '2024-09-18');
  });

  // Test 2: Invalid SAFE name rejection
  await runTest('parseSafePackageIdentifier should throw on malformed or non-SAFE naming conventions', async () => {
    assert.throws(() => {
      sentinelGranuleIngestionPipeline.parseSafePackageIdentifier('invalid_archive_name.zip');
    }, /Invalid Sentinel-2 SAFE package naming convention/);

    assert.throws(() => {
      sentinelGranuleIngestionPipeline.parseSafePackageIdentifier('');
    }, /A valid Sentinel-2 SAFE package name/);
  });

  // Test 3: Digital Number to Reflectance conversion
  await runTest('convertDigitalNumberToReflectance should apply baseline offset and 10000 quantification value', async () => {
    // Under PB N0511: DN 5000 -> (5000 - 1000) / 10000 = 0.4000
    const reflectanceN0511 = sentinelGranuleIngestionPipeline.convertDigitalNumberToReflectance(5000, 'N0511');
    assert.strictEqual(reflectanceN0511, 0.4000);

    // Under legacy PB N0204 (no offset): DN 4500 / 10000 = 0.4500
    const reflectanceLegacy = sentinelGranuleIngestionPipeline.convertDigitalNumberToReflectance(4500, 'N0204');
    assert.strictEqual(reflectanceLegacy, 0.4500);
  });

  // Test 4: Quality auditing and cloud threshold rejection
  await runTest('auditGranuleQuality should classify pristine vs cloud-rejected scenes', async () => {
    // 2 cloud pixels out of 100 = 2% cloud cover -> PRISTINE
    const pristineAudit = sentinelGranuleIngestionPipeline.auditGranuleQuality({}, 2, 100);
    assert.strictEqual(pristineAudit.qualityTier, 'PRISTINE_CLEAR_SKY');
    assert.strictEqual(pristineAudit.isAcceptable, true);

    // 55 cloud pixels out of 100 = 55% cloud cover -> REJECTED (> 45%)
    const rejectedAudit = sentinelGranuleIngestionPipeline.auditGranuleQuality({}, 55, 100);
    assert.strictEqual(rejectedAudit.qualityTier, 'REJECTED_EXCESSIVE_CLOUD_COVER');
    assert.strictEqual(rejectedAudit.isAcceptable, false);
  });

  // Test 5: End-to-end granule ingestion job
  await runTest('processGranuleIngestionJob should process raw pixel matrix and compute clean zonal statistics', async () => {
    const rawMatrix = [
      { dnRed: 1500, dnNir: 7500, dnGreen: 2000, scl: 4 }, // Clear vegetation
      { dnRed: 1600, dnNir: 8000, dnGreen: 2100, scl: 4 }, // Clear vegetation
      { dnRed: 2500, dnNir: 2800, dnGreen: 2600, scl: 9 }, // High prob cloud
      { dnRed: 1400, dnNir: 7000, dnGreen: 1900, scl: 4 }  // Clear vegetation
    ];

    const safeName = 'S2B_MSIL2A_20240922T100015_N0511_R080_T32NMJ_20240922T142010.SAFE';
    const jobResult = sentinelGranuleIngestionPipeline.processGranuleIngestionJob({
      safePackageName: safeName,
      parcelId: 'PARCEL_FCT_001',
      rawPixelMatrix: rawMatrix
    });

    assert.strictEqual(jobResult.status, 'COMPLETED_SUCCESS');
    assert.strictEqual(jobResult.parcelId, 'PARCEL_FCT_001');
    assert.strictEqual(jobResult.zonalStatistics.totalCells, 4);
    assert.strictEqual(jobResult.zonalStatistics.cloudMaskedCells, 1);
    assert.strictEqual(jobResult.zonalStatistics.clearSkyCells, 3);
    assert.ok(jobResult.zonalStatistics.meanNdvi > 0.60, `Mean NDVI (${jobResult.zonalStatistics.meanNdvi}) should exceed 0.60`);
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Fatal suite failure:', err);
  process.exit(1);
});
