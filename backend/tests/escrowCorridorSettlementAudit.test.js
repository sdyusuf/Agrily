/**
 * @file escrowCorridorSettlementAudit.test.js
 * @description Comprehensive unit & integration tests for Agro-Corridor Settlement Audit Service
 */

const assert = require('assert');
const {
  EscrowCorridorSettlementAuditService,
  AGRO_CORRIDOR_REGISTRY
} = require('../services/escrowCorridorSettlementAuditService');

console.log('=================================================================');
console.log('🌾 AGRILY SPRINT 15: AGRO-CORRIDOR SETTLEMENT AUDIT SUITE');
console.log('=================================================================\n');

let passedCount = 0;
let failedCount = 0;

function runTest(description, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${description}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${description}`);
    console.error(`     Reason: ${err.message}`);
    failedCount++;
  }
}

// -----------------------------------------------------------------------------
// SECTION 1: Corridor Resolution Tests
// -----------------------------------------------------------------------------
console.log('--- SECTION 1: Agro-Corridor Resolution Logic ---');

runTest('Resolves Kano to Lagos as NORTH_WEST_GRAIN corridor', () => {
  const corridor = EscrowCorridorSettlementAuditService.resolveCorridor('Kano', 'Lagos');
  assert.strictEqual(corridor.corridorId, 'COR-NW-01');
  assert.strictEqual(corridor.primaryCommodities.includes('WHITE_MAIZE'), true);
  assert.strictEqual(corridor.baselineTransitHours, 36);
});

runTest('Resolves Jos to Port Harcourt as MIDDLE_BELT_PERISHABLE corridor', () => {
  const corridor = EscrowCorridorSettlementAuditService.resolveCorridor('Plateau', 'Rivers');
  assert.strictEqual(corridor.corridorId, 'COR-MB-02');
  assert.strictEqual(corridor.recommendedReeferAssurance, true);
  assert.strictEqual(corridor.primaryCommodities.includes('ROMA_TOMATOES'), true);
});

runTest('Resolves Ondo to Lagos as SOUTH_WEST_COCOA_TUBER corridor', () => {
  const corridor = EscrowCorridorSettlementAuditService.resolveCorridor('Ondo', 'Lagos');
  assert.strictEqual(corridor.corridorId, 'COR-SW-03');
  assert.strictEqual(corridor.primaryCommodities.includes('COCOA_BEANS'), true);
});

runTest('Resolves Borno to Jos as NORTH_EAST_LIVESTOCK_PULSES corridor', () => {
  const corridor = EscrowCorridorSettlementAuditService.resolveCorridor('Borno', 'Plateau');
  assert.strictEqual(corridor.corridorId, 'COR-NE-04');
});

runTest('Falls back gracefully to general corridor on undefined or unknown routes', () => {
  const corridor = EscrowCorridorSettlementAuditService.resolveCorridor(null, null);
  assert.strictEqual(corridor.corridorId, 'COR-GEN-99');
});

// -----------------------------------------------------------------------------
// SECTION 2: Perishable Transit Delay & Escrow Hold Disposition
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 2: Transit Impact & Escrow Disposition ---');

runTest('Authorizes automatic release for on-time grain delivery', () => {
  const impact = EscrowCorridorSettlementAuditService.evaluateCorridorTransitImpact({
    originState: 'Kano',
    destinationState: 'Lagos',
    transitDurationHours: 32,
    commodityKey: 'WHITE_MAIZE',
    reeferActive: false
  });

  assert.strictEqual(impact.escrowDisposition, 'PROCEED_AUTOMATIC_RELEASE');
  assert.strictEqual(impact.delayHours, 0);
  assert.strictEqual(impact.isExceededMaxPermissible, false);
});

runTest('Triggers MANDATORY QUALITY INSPECTION hold when tomatoes exceed max permissible without reefer', () => {
  const impact = EscrowCorridorSettlementAuditService.evaluateCorridorTransitImpact({
    originState: 'Plateau',
    destinationState: 'Rivers',
    transitDurationHours: 42, // Max is 36
    commodityKey: 'ROMA_TOMATOES',
    reeferActive: false
  });

  assert.strictEqual(impact.escrowDisposition, 'HOLD_MANDATORY_QUALITY_INSPECTION');
  assert.strictEqual(impact.isExceededMaxPermissible, true);
  assert.strictEqual(impact.suggestedPenaltyDeductionPct, 25.0);
  assert.strictEqual(impact.riskMultiplier > 1.25, true);
});

runTest('Allows consignee review hold for non-perishable grains exceeding max transit', () => {
  const impact = EscrowCorridorSettlementAuditService.evaluateCorridorTransitImpact({
    originState: 'Kano',
    destinationState: 'Lagos',
    transitDurationHours: 60, // Max is 54
    commodityKey: 'SOYBEANS',
    reeferActive: false
  });

  assert.strictEqual(impact.escrowDisposition, 'FLAG_FOR_CONSIGNEE_REVIEW');
  assert.strictEqual(impact.suggestedPenaltyDeductionPct, 5.0);
});

// -----------------------------------------------------------------------------
// SECTION 3: Carrier Corridor Performance & Rating
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 3: Carrier Corridor Scoring & Bonus Matrix ---');

runTest('Awards PLATINUM_AGRO_CARRIER and bonus to stellar carriers', () => {
  const rating = EscrowCorridorSettlementAuditService.calculateCarrierCorridorRating({
    completedWaybills: 50,
    onTimeDeliveries: 48,
    coldChainExcursions: 0,
    averageTransitHours: 32,
    corridorBaselineHours: 36
  });

  assert.strictEqual(rating.tier, 'PLATINUM_AGRO_CARRIER');
  assert.strictEqual(rating.carrierScore >= 90, true);
  assert.strictEqual(rating.freightPaymentBonusPct, 3.5);
  assert.strictEqual(rating.retentionEscrowRequiredPct, 0);
});

runTest('Applies HIGH_RISK_CARRIER tier and retention escrow to unreliable carriers', () => {
  const rating = EscrowCorridorSettlementAuditService.calculateCarrierCorridorRating({
    completedWaybills: 20,
    onTimeDeliveries: 10,
    coldChainExcursions: 4,
    averageTransitHours: 58,
    corridorBaselineHours: 36
  });

  assert.strictEqual(rating.tier, 'HIGH_RISK_CARRIER');
  assert.strictEqual(rating.carrierScore < 65, true);
  assert.strictEqual(rating.retentionEscrowRequiredPct, 20.0);
});

runTest('Defaults new carriers to PROBATIONARY_CARRIER', () => {
  const rating = EscrowCorridorSettlementAuditService.calculateCarrierCorridorRating({
    completedWaybills: 0
  });

  assert.strictEqual(rating.tier, 'PROBATIONARY_CARRIER');
  assert.strictEqual(rating.retentionEscrowRequiredPct, 15);
});

// -----------------------------------------------------------------------------
// SECTION 4: Digital Audit Certificate Generation
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 4: Tamper-Evident Digital Audit Certificate ---');

runTest('Generates digital certificate with valid SHA-256 seal', () => {
  const corridor = AGRO_CORRIDOR_REGISTRY.NORTH_WEST_GRAIN;
  const carrierMetrics = { tier: 'GOLD_AGRO_CARRIER', carrierScore: 84, freightPaymentBonusPct: 1.5 };
  const transitImpact = { escrowDisposition: 'PROCEED_AUTOMATIC_RELEASE', suggestedPenaltyDeductionPct: 0 };

  const cert = EscrowCorridorSettlementAuditService.generateCorridorAuditCertificate({
    vaultNumber: 'VAULT-2024-KANO-001',
    corridor,
    carrierMetrics,
    transitImpact,
    totalDisbursement: 1250000
  });

  assert.strictEqual(cert.certificateId.startsWith('COR-AUDIT-'), true);
  assert.strictEqual(cert.vaultNumber, 'VAULT-2024-KANO-001');
  assert.strictEqual(cert.carrierTier, 'GOLD_AGRO_CARRIER');
  assert.strictEqual(typeof cert.digitalSeal, 'string');
  assert.strictEqual(cert.digitalSeal.length, 64);
  assert.strictEqual(cert.totalDisbursedNgn, 1250000);
});

console.log('\n=================================================================');
console.log(`🌾 TEST SUITE COMPLETE: ${passedCount} passed, ${failedCount} failed`);
console.log('=================================================================\n');

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
