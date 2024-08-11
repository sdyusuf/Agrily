/**
 * ==============================================================================
 * 🌾 AGRILY AGRO-COMMERCE PLATFORM: TRIBUNAL EVIDENCE VAULT TESTS
 * ==============================================================================
 * 
 * Unit and integration tests for TribunalEvidenceVaultService:
 *  - Evidence SHA-256 HMAC hash generation and tamper detection
 *  - Chain of custody role and evidence type validation
 *  - Transit telemetry temperature excursion analysis
 *  - Digital waybill signature authentication
 *  - Standalone HTML evidence dossier compilation
 * 
 * @module tests/tribunalEvidenceVault.test
 * @author Agrily Security Team
 * ==============================================================================
 */

const assert = require('assert');
const crypto = require('crypto');
const {
  TribunalEvidenceVaultService,
  EVIDENCE_TYPES,
  CHAIN_OF_CUSTODY_ROLES
} = require('../services/tribunalEvidenceVaultService');

console.log('=================================================================');
console.log('🌾 AGRILY SPRINT 15: TRIBUNAL EVIDENCE VAULT SERVICE TESTS');
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
// 1. EVIDENCE HASHING & CHAIN OF CUSTODY
// ------------------------------------------------------------------------------
console.log('--- SECTION 1: Chain of Custody & Cryptographic Hashing ---');

runTest('calculateEvidenceHash generates deterministic 64-char SHA-256 hash', () => {
  const item = {
    evidenceType: 'QUALITY_INSPECTION_CERT',
    submittedByRole: 'INSPECTOR',
    title: 'Dockside Inspection Report',
    description: 'SON Grade B certified',
    attachmentUrl: 'https://cdn.agrily.com/docs/cert-001.pdf',
    telemetryMetadata: { score: 82 }
  };

  const hash1 = TribunalEvidenceVaultService.calculateEvidenceHash(item);
  const hash2 = TribunalEvidenceVaultService.calculateEvidenceHash(item);

  assert.strictEqual(hash1.length, 64);
  assert.strictEqual(hash1, hash2);
});

runTest('validateChainOfCustody accepts properly structured evidence item', () => {
  const item = {
    evidenceType: 'IOT_TEMPERATURE_LOG',
    submittedByRole: 'SYSTEM_AUDITOR',
    title: 'Reefer Continuous Telemetry Log',
    description: 'Lagos-Kaduna corridor',
    attachmentUrl: 'https://cdn.agrily.com/telemetry/log.json'
  };

  const report = TribunalEvidenceVaultService.validateChainOfCustody(item);
  assert.strictEqual(report.valid, true);
  assert.strictEqual(report.evidenceType, 'IOT_TEMPERATURE_LOG');
  assert.strictEqual(report.role, 'SYSTEM_AUDITOR');
});

runTest('validateChainOfCustody rejects unsupported evidence types', () => {
  const badItem = {
    evidenceType: 'BOGUS_INVALID_TYPE',
    submittedByRole: 'BUYER',
    title: 'Random note'
  };

  const report = TribunalEvidenceVaultService.validateChainOfCustody(badItem);
  assert.strictEqual(report.valid, false);
  assert(report.reason.includes('Unsupported evidence type'));
});

// ------------------------------------------------------------------------------
// 2. CORRELATE TRANSIT TELEMETRY
// ------------------------------------------------------------------------------
console.log('\n--- SECTION 2: IoT Transit Telemetry Synthesis ---');

runTest('correlateTransitTelemetry correctly identifies catastrophic reefer failure', () => {
  const logs = [
    { temperatureCelsius: 6.5, recordedAt: '2024-08-01T10:00:00Z' },
    { temperatureCelsius: 12.0, recordedAt: '2024-08-01T11:00:00Z' },
    { temperatureCelsius: 19.5, recordedAt: '2024-08-01T12:00:00Z' }, // Extreme excursion
    { temperatureCelsius: 21.0, recordedAt: '2024-08-01T13:00:00Z' }
  ];

  const synthesis = TribunalEvidenceVaultService.correlateTransitTelemetry(logs, {
    maxSafeTempCelsius: 10.0,
    samplingIntervalMinutes: 30
  });

  assert.strictEqual(synthesis.hasData, true);
  assert.strictEqual(synthesis.breached, true);
  assert.strictEqual(synthesis.maxTempC, 21.0);
  assert.strictEqual(synthesis.excursionCount, 3);
  assert.strictEqual(synthesis.verdict, 'CATASTROPHIC_REEFER_FAILURE');
});

runTest('correlateTransitTelemetry marks sound reefer transit as compliant', () => {
  const soundLogs = [
    { temperatureCelsius: 6.0, recordedAt: '2024-08-01T10:00:00Z' },
    { temperatureCelsius: 7.2, recordedAt: '2024-08-01T11:00:00Z' },
    { temperatureCelsius: 6.8, recordedAt: '2024-08-01T12:00:00Z' },
    { temperatureCelsius: 7.0, recordedAt: '2024-08-01T13:00:00Z' }
  ];

  const synthesis = TribunalEvidenceVaultService.correlateTransitTelemetry(soundLogs, {
    maxSafeTempCelsius: 10.0
  });

  assert.strictEqual(synthesis.hasData, true);
  assert.strictEqual(synthesis.breached, false);
  assert.strictEqual(synthesis.excursionCount, 0);
  assert.strictEqual(synthesis.verdict, 'COLD_CHAIN_COMPLIANT');
});

// ------------------------------------------------------------------------------
// 3. WAYBILL SIGNATURE VERIFICATION
// ------------------------------------------------------------------------------
console.log('\n--- SECTION 3: Waybill Custody Handover Signatures ---');

runTest('verifyWaybillHandoverSignature authenticates valid signature token', () => {
  const waybill = {
    waybillNumber: 'WB-202408-999',
    orderId: 'ORD-WB-TEST-001',
    driverLicenseNumber: 'DL-KNO-99120',
    dockDispatchTimestamp: '2024-08-01T08:00:00Z'
  };

  const payload = [
    waybill.waybillNumber,
    waybill.orderId,
    waybill.driverLicenseNumber,
    waybill.dockDispatchTimestamp
  ].join(':');

  waybill.driverSignatureToken = crypto.createHash('sha256').update(payload).digest('hex');

  const result = TribunalEvidenceVaultService.verifyWaybillHandoverSignature(waybill);
  assert.strictEqual(result.authentic, true);
  assert.strictEqual(result.waybillNumber, 'WB-202408-999');
});

runTest('verifyWaybillHandoverSignature detects forged or tampered token', () => {
  const forgedWaybill = {
    waybillNumber: 'WB-202408-FORGED',
    orderId: 'ORD-WB-FORGED',
    driverLicenseNumber: 'DL-FAKE',
    dockDispatchTimestamp: '2024-08-01T08:00:00Z',
    driverSignatureToken: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
  };

  const result = TribunalEvidenceVaultService.verifyWaybillHandoverSignature(forgedWaybill);
  assert.strictEqual(result.authentic, false);
});

// ------------------------------------------------------------------------------
// 4. HTML EVIDENCE DOSSIER COMPILATION
// ------------------------------------------------------------------------------
console.log('\n--- SECTION 4: Standalone Evidence Dossier HTML ---');

runTest('generateTribunalEvidenceDossierHtml compiles complete HTML document', () => {
  const dummyCase = {
    docketNumber: 'ARB-202408-TEST-01',
    vaultNumber: 'VAULT-2024-001',
    disputeCategory: 'COLD_CHAIN_TEMPERATURE_BREACH',
    claimant: { role: 'BUYER', name: 'Chioma Okeke', email: 'c@okeke.ng', phone: '+2348011223344' },
    respondent: { role: 'CARRIER', name: 'Sahel Logistics', email: 's@sahel.ng', phone: '+2348099887766' },
    evidenceItems: [
      {
        evidenceType: 'IOT_TEMPERATURE_LOG',
        submittedByName: 'System Telemetry Daemon',
        title: 'Reefer Excursion Log',
        description: 'Temp reached 21°C',
        sha256Hash: crypto.randomBytes(32).toString('hex')
      }
    ]
  };

  const html = TribunalEvidenceVaultService.generateTribunalEvidenceDossierHtml(dummyCase, {
    verdict: 'CATASTROPHIC_REEFER_FAILURE',
    maxTempC: 21.0,
    excursionCount: 3
  });

  assert(html.includes('ARB-202408-TEST-01'), 'HTML must include docket number');
  assert(html.includes('Chioma Okeke'), 'HTML must include claimant name');
  assert(html.includes('Sahel Logistics'), 'HTML must include respondent name');
  assert(html.includes('CATASTROPHIC_REEFER_FAILURE'), 'HTML must include telemetry verdict');
  assert(html.includes('Reefer Excursion Log'), 'HTML must include evidence exhibit title');
});

console.log('\n=================================================================');
console.log(`🌾 TEST SUITE COMPLETE: ${testsPassed} passed, ${testsFailed} failed`);
console.log('=================================================================\n');

if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
