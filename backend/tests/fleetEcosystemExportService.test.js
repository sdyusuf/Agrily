/**
 * @file fleetEcosystemExportService.test.js
 * @description Unit tests for FleetEcosystemExportService dossier compilation and HTML sealing
 */

const assert = require('assert');
const FleetEcosystemExportService = require('../services/fleetEcosystemExportService');
const FleetPerformanceLog = require('../models/FleetPerformanceLog');
const CarrierScorecard = require('../models/CarrierScorecard');

console.log('=================================================================');
console.log('🌾 AGRILY SPRINT 16: FLEET ECOSYSTEM EXPORT SERVICE TESTS');
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
// SECTION 1: Digital Seal Generation
// -----------------------------------------------------------------------------
console.log('--- SECTION 1: Digital Seal Verification ---');

runTest('Generates deterministic 64-character SHA-256 seal', () => {
  const seal1 = FleetEcosystemExportService.calculateDossierDigitalSeal({ test: 123 });
  const seal2 = FleetEcosystemExportService.calculateDossierDigitalSeal({ test: 123 });
  assert.strictEqual(typeof seal1, 'string');
  assert.strictEqual(seal1.length, 64);
  assert.strictEqual(seal1, seal2);
});

// -----------------------------------------------------------------------------
// SECTION 2: Dossier Compilation
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 2: Trip Audit Dossier Compilation ---');

runTest('Compiles complete audit dossier from FleetPerformanceLog and CarrierScorecard', () => {
  const log = new FleetPerformanceLog({
    logTrackingNumber: 'FLT-20240815-AUD',
    vehicleRegNumber: 'KN-992-KND',
    vehicleType: 'MEDIUM_TRUCK_8_TON',
    corridorId: 'COR-NW-01',
    corridorName: 'Kano-Lagos Grain Expressway',
    origin: { state: 'KANO', facilityName: 'Dawanau Grain Market' },
    destination: { state: 'LAGOS', facilityName: 'Mile 12 Terminal' },
    turnaroundDurationsMinutes: {
      originLoadingTime: 60,
      transitTime: 2040,
      docksideInspectionTime: 30,
      destinationOffloadingTime: 45,
      totalTurnaroundTime: 2175,
      transitDelayMinutes: 0
    },
    fuelAndEnergyTelemetry: {
      totalDistanceCoveredKm: 995,
      fuelConsumedLitres: 290,
      fuelEfficiencyKmPerLitre: 3.43,
      litresPerTonKm: 0.0243,
      fuelCostNgn: 275500,
      estimatedCo2EmissionsKg: 777.2
    },
    ecoDrivingScorecard: {
      ecoDrivingScore: 89,
      ecoTier: 'GREEN_CHAMPION'
    },
    temperatureCompliance: {
      reeferIntegrityPassed: true
    }
  });

  const scorecard = new CarrierScorecard({
    carrierCode: 'CAR-001',
    carrierName: 'Arewa Logistics Ltd',
    tier: 'PLATINUM_AGRO_CARRIER',
    compositeScores: { overallCarrierScore: 95 },
    incentivesAndGuarantees: { freightPaymentBonusPct: 4.5 }
  });

  const dossier = FleetEcosystemExportService.compileTripAuditDossier({
    performanceLog: log,
    carrierScorecard: scorecard
  });

  assert.strictEqual(dossier.trackingNumber, 'FLT-20240815-AUD');
  assert.strictEqual(typeof dossier.digitalSeal, 'string');
  assert.strictEqual(dossier.digitalSeal.length, 64);
  assert.strictEqual(dossier.turnaroundAudit.totalTurnaroundMinutes, 2175);
  assert.strictEqual(dossier.turnaroundAudit.dwellEfficiencyRating, 'OPTIMAL');
  assert.strictEqual(dossier.fuelAndEmissionsAudit.fuelConsumedLitres, 290);
  assert.strictEqual(dossier.driverBehaviorScorecard.ecoTier, 'GREEN_CHAMPION');
  assert.strictEqual(dossier.carrierRatingSnapshot.carrierTier, 'PLATINUM_AGRO_CARRIER');
});

// -----------------------------------------------------------------------------
// SECTION 3: HTML Dossier Rendering
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 3: Standalone HTML Dossier Generation ---');

runTest('Generates valid standalone HTML with Agrily branding and seal', () => {
  const log = new FleetPerformanceLog({
    logTrackingNumber: 'FLT-20240815-AUD',
    vehicleRegNumber: 'KN-992-KND',
    origin: { state: 'KANO' },
    destination: { state: 'LAGOS' },
    fuelAndEnergyTelemetry: { totalDistanceCoveredKm: 995 }
  });

  const dossier = FleetEcosystemExportService.compileTripAuditDossier({ performanceLog: log });
  const html = FleetEcosystemExportService.generateFleetAuditReportHtml(dossier);

  assert.strictEqual(typeof html, 'string');
  assert.strictEqual(html.includes('<!DOCTYPE html>'), true);
  assert.strictEqual(html.includes('AGRILY LOGISTICS OS'), true);
  assert.strictEqual(html.includes(dossier.digitalSeal), true);
  assert.strictEqual(html.includes(dossier.trackingNumber), true);
});

console.log('\n=================================================================');
console.log(`🌾 TEST SUITE COMPLETE: ${passed} passed, ${failed} failed`);
console.log('=================================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
