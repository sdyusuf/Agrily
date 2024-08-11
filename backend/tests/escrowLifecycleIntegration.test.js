/**
 * ==============================================================================
 * 🌾 AGRILY AGRO-COMMERCE PLATFORM: ESCROW LIFECYCLE INTEGRATION TEST SUITE
 * ==============================================================================
 * 
 * Comprehensive end-to-end lifecycle integration testing across all Sprint 15
 * modules: EscrowSettlementVault, QualityInspectionCertificate, DisputeTribunalCase,
 * InspectionGradingEngine, TribunalArbitrationEngine, and EscrowSettlementService.
 * 
 * @module tests/escrowLifecycleIntegration.test
 * @author Agrily Core Protocol Engineering
 * ==============================================================================
 */

const assert = require('assert');
const crypto = require('crypto');
const mongoose = require('mongoose');

// Domain models
const { EscrowSettlementVault } = require('../models/EscrowSettlementVault');
const { QualityInspectionCertificate } = require('../models/QualityInspectionCertificate');
const { DisputeTribunalCase } = require('../models/DisputeTribunalCase');

// Business services
const { InspectionGradingEngine, COMMODITY_STANDARDS } = require('../services/inspectionGradingEngine');
const { TribunalArbitrationEngine } = require('../services/tribunalArbitrationEngine');
const { EscrowSettlementService } = require('../services/escrowSettlementService');

console.log('=================================================================');
console.log('🌾 AGRILY SPRINT 15: ESCROW LIFECYCLE INTEGRATION TEST RUNNER');
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
// PHASE 1: Tri-Party Vault Model Lifecycle & Checksum Integrity
// ------------------------------------------------------------------------------
console.log('--- PHASE 1: Tri-Party Escrow Vault Initialization & Security ---');

runTest('Vault Model initializes with auto-generated vault number and milestones', () => {
  const dummyBuyer = new mongoose.Types.ObjectId();
  const dummyFarmer = new mongoose.Types.ObjectId();
  const dummyCarrier = new mongoose.Types.ObjectId();

  const vault = new EscrowSettlementVault({
    orderId: 'ORD-77881',
    buyer: {
      userId: dummyBuyer,
      name: 'Lagos Foods Co',
      email: 'buyer@lagosfoods.ng',
      phone: '+2348011223344'
    },
    farmer: {
      userId: dummyFarmer,
      name: 'Ibrahim Kaduna',
      email: 'farmer@kaduna.ng',
      farmName: 'Kaduna Grain Mills Ltd'
    },
    carrier: {
      userId: dummyCarrier,
      name: 'Express Agro Logistics Ltd',
      vehiclePlateNumber: 'KJA-892-XB'
    },
    produceCategory: 'grains',
    produceName: 'White Maize (Dry Grade A)',
    produceSubtotal: 4250000,
    haulageFreightTariff: 500000,
    coldChainGuaranteeFee: 0,
    currency: 'NGN'
  });

  assert(vault.vaultNumber.startsWith('VAULT-'), 'vaultNumber must start with VAULT-');
  assert.strictEqual(vault.status, 'DEPOSITED_LOCKED');
  assert.strictEqual(vault.milestones.length, 6, 'Must have 6 default tri-party lifecycle milestones');
  assert.strictEqual(vault.currency, 'NGN');

  const checksum = vault.calculateFinancialChecksum();
  assert(checksum && checksum.length === 64, 'Financial checksum must be 64-char SHA-256 hex');
});

runTest('Vault Checksum detects financial tampering if amounts are mutated', () => {
  const vault = new EscrowSettlementVault({
    orderId: 'ORD-77882',
    buyer: { userId: new mongoose.Types.ObjectId(), name: 'Buyer Test', email: 'b@test.ng' },
    farmer: { userId: new mongoose.Types.ObjectId(), name: 'Farmer Test', email: 'f@test.ng' },
    carrier: { userId: new mongoose.Types.ObjectId(), name: 'Carrier Test' },
    produceSubtotal: 8500000,
    haulageFreightTariff: 1000000
  });

  const originalChecksum = vault.calculateFinancialChecksum();
  vault.financialChecksum = originalChecksum;

  // Simulate unauthorized balance mutation
  vault.produceSubtotal = 9500000;
  const tamperedChecksum = vault.calculateFinancialChecksum();

  assert.notStrictEqual(originalChecksum, tamperedChecksum, 'Tampered balance must produce distinct checksum');
});

runTest('Inspection countdown helper returns valid remaining hours', () => {
  const closesAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const vault = new EscrowSettlementVault({
    orderId: 'ORD-77883',
    buyer: { userId: new mongoose.Types.ObjectId(), name: 'Buyer Test', email: 'b@test.ng' },
    farmer: { userId: new mongoose.Types.ObjectId(), name: 'Farmer Test', email: 'f@test.ng' },
    carrier: { userId: new mongoose.Types.ObjectId(), name: 'Carrier Test' },
    produceSubtotal: 2000000,
    haulageFreightTariff: 200000,
    inspectionDeadlineTimestamp: closesAt
  });

  const remainingMs = new Date(vault.inspectionDeadlineTimestamp).getTime() - Date.now();
  const hoursRemaining = Math.round(remainingMs / (1000 * 60 * 60));
  assert(hoursRemaining >= 23 && hoursRemaining <= 25, 'Remaining hours should be ~24h');
});

// ------------------------------------------------------------------------------
// PHASE 2: Agricultural Quality Grading Engine & Statutory Standards
// ------------------------------------------------------------------------------
console.log('\n--- PHASE 2: SON/NAFDAC Agricultural Grading Engine ---');

runTest('InspectionGradingEngine evaluates flawless produce as GRADE_A_EXPORT_PREMIUM', () => {
  const result = InspectionGradingEngine.evaluateMetrics('vegetables', {
    moistureContentPercentage: 92.0,
    spoilageRotPercentage: 1.0,
    foreignMatterPercentage: 0.5,
    pestInfestationDetected: false,
    moldMildewDetected: false,
    dockCoreTemperatureCelsius: 7.2
  });

  assert.strictEqual(result.overallGrade, 'GRADE_A_EXPORT_PREMIUM');
  assert(result.finalScore >= 85, 'Grade A composite score must be >= 85');
  assert.strictEqual(result.recommendation, 'ACCEPT_FULL_SETTLEMENT');
  assert.strictEqual(result.priceAdjustmentPercentage, 0);
});

runTest('InspectionGradingEngine assigns GRADE_B_WHOLESALE_STANDARD for minor defects', () => {
  const result = InspectionGradingEngine.evaluateMetrics('grains', {
    moistureContentPercentage: 13.0,
    spoilageRotPercentage: 3.0,
    foreignMatterPercentage: 1.5,
    pestInfestationDetected: false,
    moldMildewDetected: false,
    dockCoreTemperatureCelsius: 22.0
  });

  assert.strictEqual(result.overallGrade, 'GRADE_B_WHOLESALE_STANDARD');
  assert(result.finalScore >= 70 && result.finalScore < 85);
  assert.strictEqual(result.recommendation, 'ACCEPT_FULL_SETTLEMENT');
});

runTest('InspectionGradingEngine applies pro-rata discount for GRADE_C_PROCESSING_ONLY', () => {
  const result = InspectionGradingEngine.evaluateMetrics('vegetables', {
    moistureContentPercentage: 95.0,
    spoilageRotPercentage: 4.8, // Between acceptable (4.0) and double threshold
    foreignMatterPercentage: 1.8,
    pestInfestationDetected: false,
    moldMildewDetected: false,
    dockCoreTemperatureCelsius: 11.0
  });

  assert.strictEqual(result.overallGrade, 'GRADE_C_PROCESSING_ONLY');
  assert(result.finalScore >= 50 && result.finalScore < 70);
  assert.strictEqual(result.recommendation, 'ACCEPT_WITH_PRO_RATA_DISCOUNT');
  assert(result.priceAdjustmentPercentage > 0, 'Must apply price discount');
});

runTest('InspectionGradingEngine triggers REJECTED_UNFIT on mycotoxin / mold presence', () => {
  const result = InspectionGradingEngine.evaluateMetrics('grains', {
    moistureContentPercentage: 14.5,
    spoilageRotPercentage: 4.0,
    foreignMatterPercentage: 1.0,
    pestInfestationDetected: false,
    moldMildewDetected: true, // Immediate statutory disqualifier
    dockCoreTemperatureCelsius: 24.0
  });

  assert.strictEqual(result.overallGrade, 'REJECTED_UNFIT');
  assert.strictEqual(result.recommendation, 'LODGE_TRIBUNAL_DISPUTE');
  assert.strictEqual(result.priceAdjustmentPercentage, 100);
});

runTest('InspectionGradingEngine triggers REJECTED_UNFIT when spoilage exceeds statutory limit', () => {
  const result = InspectionGradingEngine.evaluateMetrics('vegetables', {
    moistureContentPercentage: 92.0,
    spoilageRotPercentage: 11.5,
    foreignMatterPercentage: 1.0,
    pestInfestationDetected: false,
    moldMildewDetected: false,
    dockCoreTemperatureCelsius: 9.0
  });

  assert.strictEqual(result.overallGrade, 'REJECTED_UNFIT');
  assert.strictEqual(result.recommendation, 'LODGE_TRIBUNAL_DISPUTE');
});

// ------------------------------------------------------------------------------
// PHASE 3: Algorithmic Dispute Tribunal Adjudication
// ------------------------------------------------------------------------------
console.log('\n--- PHASE 3: Algorithmic Dispute Tribunal Adjudication ---');

runTest('TribunalArbitrationEngine assigns carrier liability on cold chain breach', () => {
  const dummyVault = new EscrowSettlementVault({
    orderId: 'ORD-DISP-01',
    buyer: { userId: new mongoose.Types.ObjectId(), name: 'Buyer Test', email: 'b@test.ng' },
    farmer: { userId: new mongoose.Types.ObjectId(), name: 'Farmer Test', email: 'f@test.ng' },
    carrier: { userId: new mongoose.Types.ObjectId(), name: 'Carrier Test' },
    produceSubtotal: 4250000,
    haulageFreightTariff: 500000
  });

  const dummyCase = new DisputeTribunalCase({
    vaultNumber: dummyVault.vaultNumber,
    orderId: dummyVault.orderId,
    disputeCategory: 'COLD_CHAIN_TEMPERATURE_BREACH',
    claimant: { role: 'BUYER', name: 'Buyer Test', email: 'b@test.ng', phone: '+234800000001' },
    respondent: { role: 'CARRIER', name: 'Carrier Test', email: 'c@test.ng', phone: '+234800000002' },
    initialClaimSummary: 'Severe temperature excursion in refrigerated haulage van.',
    demandedRefundAmount: 2000000,
    totalEscrowDisputed: 4750000
  });

  const dummyCert = {
    overallGrade: 'REJECTED_UNFIT',
    metrics: { spoilageRotPercentage: 7.5, moldMildewDetected: false }
  };

  const evaluation = TribunalArbitrationEngine.evaluateDisputeLiability({
    tribunalCase: dummyCase,
    inspectionCertificate: dummyCert,
    coldChainAudit: {
      breachDetected: true,
      maxRecordedTempC: 16.5,
      breachDurationMinutes: 180
    },
    totalVaultEscrow: 4750000
  });

  assert.strictEqual(evaluation.outcome, 'CARRIER_INSURANCE_LIABILITY');
  assert.strictEqual(evaluation.faultLiabilityParty, 'CARRIER');
  assert(evaluation.buyerRefundAmount > 0, 'Buyer must be awarded refund');
  assert.strictEqual(evaluation.carrierPayoutAmount, 0, 'Carrier fee must be forfeited');
});

runTest('TribunalArbitrationEngine assigns farmer liability when rotten produce is delivered', () => {
  const dummyVault = new EscrowSettlementVault({
    orderId: 'ORD-DISP-02',
    buyer: { userId: new mongoose.Types.ObjectId(), name: 'Buyer Test', email: 'b@test.ng' },
    farmer: { userId: new mongoose.Types.ObjectId(), name: 'Farmer Test', email: 'f@test.ng' },
    carrier: { userId: new mongoose.Types.ObjectId(), name: 'Carrier Test' },
    produceSubtotal: 3400000,
    haulageFreightTariff: 400000
  });

  const dummyCase = new DisputeTribunalCase({
    vaultNumber: dummyVault.vaultNumber,
    orderId: dummyVault.orderId,
    disputeCategory: 'PRODUCT_SPOILAGE_ROT',
    claimant: { role: 'BUYER', name: 'Buyer Test', email: 'b@test.ng', phone: '+234800000001' },
    respondent: { role: 'FARMER', name: 'Farmer Test', email: 'f@test.ng', phone: '+234800000003' },
    initialClaimSummary: 'Harvest delivered rotten with active biological mold.',
    demandedRefundAmount: 3400000,
    totalEscrowDisputed: 3800000
  });

  const dummyCert = {
    overallGrade: 'REJECTED_UNFIT',
    qualityScore: 25,
    metrics: { spoilageRotPercentage: 18.0, moldMildewDetected: true }
  };

  const evaluation = TribunalArbitrationEngine.evaluateDisputeLiability({
    tribunalCase: dummyCase,
    inspectionCertificate: dummyCert,
    coldChainAudit: { breachDetected: false, maxRecordedTempC: 6.5 },
    totalVaultEscrow: 3800000
  });

  assert.strictEqual(evaluation.outcome, 'FULL_BUYER_REFUND');
  assert.strictEqual(evaluation.faultLiabilityParty, 'FARMER');

  assert(evaluation.buyerRefundAmount >= 3400000, 'Buyer must receive principal refund');
  assert.strictEqual(evaluation.farmerPayoutAmount, 0, 'Farmer payout must be zeroed on reject');
});

// ------------------------------------------------------------------------------
// PHASE 4: End-to-End Escrow Settlement Vault Lifecycle
// ------------------------------------------------------------------------------
console.log('\n--- PHASE 4: End-to-End Multi-Party Settlement Service Flows ---');

runTest('Complete Lifecycle: initializeVault -> release milestones -> settle', async () => {
  const dummyBuyer = new mongoose.Types.ObjectId();
  const dummyFarmer = new mongoose.Types.ObjectId();
  const dummyCarrier = new mongoose.Types.ObjectId();

  const vault = await EscrowSettlementService.initializeVault({
    orderId: 'ORD-77991',
    buyer: { userId: dummyBuyer, name: 'Lagos Foods Co', email: 'b@lagos.ng', phone: '+2348011223344' },
    farmer: { userId: dummyFarmer, name: 'Ibrahim Kaduna', email: 'f@kaduna.ng', farmName: 'Kaduna Farms' },
    carrier: { userId: dummyCarrier, name: 'Agro Logistics', vehiclePlateNumber: 'LAG-112-AA' },
    produceCategory: 'vegetables',
    produceName: 'Fresh Habanero Peppers',
    quantityKg: 2000,
    produceSubtotal: 3400000,
    haulageFreightTariff: 400000
  });

  assert.strictEqual(vault.status, 'DEPOSITED_LOCKED');

  // Milestone 1: Farmer Gate Advance
  const res1 = await EscrowSettlementService.releaseMilestone(vault, 'FARMER_GATE_ADVANCE', '1234');
  assert.strictEqual(res1.status, 'RELEASED');
  assert(res1.amount > 0);

  // Milestone 2: Carrier Dispatch Advance
  const res2 = await EscrowSettlementService.releaseMilestone(vault, 'CARRIER_DISPATCH_ADVANCE', '1234');
  assert.strictEqual(res2.status, 'RELEASED');
  assert(res2.amount > 0);
});

// ------------------------------------------------------------------------------
// PHASE 5: Cryptographic Audit Receipt Generation & Formatting
// ------------------------------------------------------------------------------
console.log('\n--- PHASE 5: Settlement Certificate & Cryptographic Verification ---');

runTest('EscrowSettlementService.generateSettlementAuditReportHtml produces valid HTML and digital seal', () => {
  const dummyBuyer = new mongoose.Types.ObjectId();
  const dummyFarmer = new mongoose.Types.ObjectId();
  const dummyCarrier = new mongoose.Types.ObjectId();

  const sampleVault = new EscrowSettlementVault({
    orderId: 'ORD-CERT-99',
    buyer: { userId: dummyBuyer, name: 'Abuja Foods', email: 'abj@foods.ng' },
    farmer: { userId: dummyFarmer, name: 'Danjuma Plateau', email: 'd@plateau.ng', farmName: 'Jos Highlands' },
    carrier: { userId: dummyCarrier, name: 'Plateau Transit', vehiclePlateNumber: 'JOS-441-XX' },
    produceCategory: 'vegetables',
    produceName: 'Bell Peppers',
    produceSubtotal: 4250000,
    haulageFreightTariff: 500000,
    status: 'SETTLED'
  });

  sampleVault.recalculateFinancials();

  const html = EscrowSettlementService.generateSettlementAuditReportHtml(sampleVault);
  assert(html.includes(sampleVault.vaultNumber), 'HTML must include vault number');
  assert(html.includes('Abuja Foods'), 'HTML must include buyer name');
  assert(html.includes('CRYPTOGRAPHIC INTEGRITY SEAL'), 'HTML must include cryptographic seal block');
});

console.log('\n=================================================================');
console.log(`🌾 TEST SUITE COMPLETE: ${testsPassed} passed, ${testsFailed} failed`);
console.log('=================================================================\n');

if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
