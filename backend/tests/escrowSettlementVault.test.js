/**
 * ==============================================================================
 * 🌾 AGRILY AGRO-COMMERCE PLATFORM: ESCROW SETTLEMENT & TRIBUNAL MODEL TESTS
 * ==============================================================================
 * 
 * Standalone Node.js unit test suite validating:
 *  - EscrowSettlementVault schema constraints, milestone splits & SHA-256 checksum
 *  - 48-Hour dock arrival countdown & auto-release eligibility
 *  - QualityInspectionCertificate SON/NAFDAC grading logic & threshold evaluation
 *  - DisputeTribunalCase evidence locker & cryptographic verdict sealing
 * 
 * @module tests/escrowSettlementVault.test
 * ==============================================================================
 */

const { EscrowSettlementVault, VAULT_STATUSES, SUPPORTED_CURRENCIES } = require('../models/EscrowSettlementVault');
const { QualityInspectionCertificate, QUALITY_GRADES, INSPECTION_RECOMMENDATIONS } = require('../models/QualityInspectionCertificate');
const { DisputeTribunalCase, TRIBUNAL_STATUSES, DISPUTE_CATEGORIES, VERDICT_OUTCOMES } = require('../models/DisputeTribunalCase');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  FAIL: ${message}`);
  }
}

async function runEscrowSettlementVaultUnitTests() {
  console.log('\n======================================================');
  console.log('   RUNNING ESCROW SETTLEMENT VAULT MODEL UNIT TESTS   ');
  console.log('======================================================\n');

  const sampleVaultData = {
    orderId: 'ORD-20240730-8812',
    waybillNumber: 'WB-20240730-99A1',
    buyer: {
      name: 'Oluwaseun Adeyemi',
      email: 'seun@agrogrocers.ng',
      phone: '+2348021112233',
      businessName: 'Adeyemi Wholesale Mart'
    },
    farmer: {
      name: 'Musa Danladi',
      email: 'musa@kanofarms.ng',
      phone: '+2348035556677',
      farmName: 'Danladi Organic Farms Kano',
      payoutBankCode: '058',
      payoutAccountNumber: '0123456789'
    },
    carrier: {
      name: 'Aliyu Transport Logistics',
      phone: '+2348098889900',
      vehiclePlateNumber: 'KNO-554-XB',
      payoutBankCode: '011',
      payoutAccountNumber: '2098765432'
    },
    currency: 'NGN',
    produceSubtotal: 2500000,
    haulageFreightTariff: 180000,
    coldChainGuaranteeFee: 25000
  };

  // 1. Vault Number Generation
  const vault = new EscrowSettlementVault(sampleVaultData);
  vault.validateSync();
  assert(/^VAULT-\d{8}-[A-F0-9]{6}$/.test(vault.vaultNumber), `Generates valid vaultNumber (${vault.vaultNumber})`);
  assert(vault.status === 'DEPOSITED_LOCKED', 'Default escrow vault status is DEPOSITED_LOCKED');

  // 2. Automated Fee Calculations
  assert(vault.platformCommissionFee === 62500, 'Calculates 2.5% platform commission (₦62,500)');
  assert(vault.statutoryVatAmount === 18187.5, 'Calculates 7.5% statutory VAT on taxable services (₦18,187.50)');
  assert(vault.totalEscrowAmount === 2785687.5, 'Computes total escrow lock amount (₦2,785,687.50)');

  // 3. Tri-Party Milestone Schedule
  assert(vault.milestones.length === 6, 'Populates standard 6-checkpoint tri-party milestone schedule');
  const milestoneKeys = vault.milestones.map(m => m.milestoneKey);
  assert(milestoneKeys.includes('FARMER_GATE_ADVANCE'), 'Includes FARMER_GATE_ADVANCE milestone');
  assert(milestoneKeys.includes('FARMER_FINAL_ACCEPTANCE'), 'Includes FARMER_FINAL_ACCEPTANCE milestone');
  assert(milestoneKeys.includes('CARRIER_DISPATCH_ADVANCE'), 'Includes CARRIER_DISPATCH_ADVANCE milestone');
  assert(milestoneKeys.includes('CARRIER_POD_COMPLETION'), 'Includes CARRIER_POD_COMPLETION milestone');
  assert(milestoneKeys.includes('PLATFORM_COMMISSION_FEE'), 'Includes PLATFORM_COMMISSION_FEE milestone');
  assert(milestoneKeys.includes('STATUTORY_VAT_FEE'), 'Includes STATUTORY_VAT_FEE milestone');

  // 4. Net Payout Virtuals
  assert(vault.netFarmerPayout === 2437500, 'Computes net farmer payout virtual (₦2,437,500)');
  assert(vault.netCarrierPayout === 205000, 'Computes net carrier payout virtual (₦205,000)');

  // 5. SHA-256 Checksum & Tamper Detection
  assert(vault.financialChecksum && vault.financialChecksum.length === 64, 'Generates 64-character SHA-256 financial checksum');
  assert(vault.verifyChecksumIntegrity() === true, 'Validates internal checksum integrity');
  vault.totalEscrowAmount = 9999999;
  assert(vault.verifyChecksumIntegrity() === false, 'Detects financial checksum tampering');
  vault.totalEscrowAmount = 2785687.5; // restore

  // 6. Dock Arrival & 48-Hour Countdown Window
  const now = new Date();
  vault.recordDockArrival(now);
  assert(vault.status === 'INSPECTION_PENDING', 'Advances status to INSPECTION_PENDING on dock arrival');
  assert(vault.dockArrivalTimestamp === now, 'Records dock arrival timestamp');
  assert(vault.isInspectionWindowOpen === true, 'Virtual isInspectionWindowOpen is true during active countdown');
  assert(vault.isAutoReleaseEligible === false, 'Virtual isAutoReleaseEligible is false before deadline');

  // 7. Auto-Release Eligibility Past Deadline
  const pastArrival = new Date(Date.now() - (50 * 60 * 60 * 1000));
  vault.recordDockArrival(pastArrival);
  assert(vault.isInspectionWindowOpen === false, 'Virtual isInspectionWindowOpen is false past deadline');
  assert(vault.isAutoReleaseEligible === true, 'Virtual isAutoReleaseEligible is true after 48-hour expiration');

  // 8. Milestone Release
  const releasedMilestone = vault.releaseMilestone('FARMER_GATE_ADVANCE', 'PIN-8812');
  assert(releasedMilestone.status === 'RELEASED', 'Milestone status transitions to RELEASED');
  assert(releasedMilestone.releaseSignatoryPin === 'PIN-8812', 'Records release signatory PIN');
  assert(vault.totalReleasedAmount > 0, 'Reconciles totalReleasedAmount');
  assert(vault.status === 'PARTIALLY_RELEASED', 'Vault advances to PARTIALLY_RELEASED');

  // 9. Arbitration Lockout
  vault.lockForArbitration('507f1f77bcf86cd799439011', 'ARB-20240730-A1B2C3');
  assert(vault.status === 'ARBITRATION_LOCKED', 'Locks vault state to ARBITRATION_LOCKED');
  assert(vault.disputeDocketNumber === 'ARB-20240730-A1B2C3', 'Links dispute docket number');

  console.log('\n======================================================');
  console.log('   RUNNING QUALITY INSPECTION CERTIFICATE UNIT TESTS  ');
  console.log('======================================================\n');

  const sampleCertData = {
    vaultNumber: 'VAULT-20240730-AABBCC',
    waybillNumber: 'WB-20240730-112233',
    orderId: 'ORD-20240730-9988',
    produceCategory: 'vegetables',
    produceName: 'Roma Tomatoes (Plum)',
    inspectedQuantityKg: 4200,
    inspectedCratesBags: 140,
    inspectionFacility: {
      name: 'Mile 12 Central Agro-Receiving Hub',
      address: 'Ikorodu Road, Ketu, Lagos',
      state: 'Lagos',
      gpsCoordinates: { latitude: 6.6018, longitude: 3.3934 }
    },
    inspector: {
      name: 'Chinedu Eze',
      inspectorBadgeNumber: 'INSP-LAG-044',
      contactPhone: '+2348039991122'
    },
    metrics: {
      moistureContentPercentage: 92.5,
      foreignMatterPercentage: 0.8,
      spoilageRotPercentage: 1.2,
      pestInfestationDetected: false,
      moldMildewDetected: false,
      dockCoreTemperatureCelsius: 7.2,
      dockAmbientTemperatureCelsius: 28.0,
      sizeMaturityUniformityScore: 9
    },
    inspectorDigitalSignature: 'SIG-INSP-CHINEDU-20240730-A1B2',
    receiverRepresentativeSignature: {
      name: 'Babatunde Fashola',
      title: 'Receiving Dock Quality Lead'
    }
  };

  // 10. Certificate Creation & Prime Grading
  const cert = new QualityInspectionCertificate(sampleCertData);
  cert.validateSync();
  assert(/^CERT-\d{8}-[A-F0-9]{6}$/.test(cert.certificateNumber), `Generates valid certificateNumber (${cert.certificateNumber})`);
  assert(cert.overallGrade === 'GRADE_A_EXPORT_PREMIUM', 'Classifies sound produce as GRADE_A_EXPORT_PREMIUM');
  assert(cert.recommendation === 'ACCEPT_FULL_SETTLEMENT', 'Recommends ACCEPT_FULL_SETTLEMENT for Grade A produce');
  assert(cert.recommendedPriceAdjustmentPercentage === 0, 'Zero price adjustment for Grade A produce');
  assert(cert.qualityScore >= 85, `Computes high quality score (${cert.qualityScore})`);
  assert(cert.isAcceptableForCommerce === true, 'Virtual isAcceptableForCommerce is true');

  // 11. Moderate Spoilage Grading (Grade C Processing)
  const moderateCert = new QualityInspectionCertificate({
    ...sampleCertData,
    metrics: {
      ...sampleCertData.metrics,
      spoilageRotPercentage: 6.0 // 6% rot
    }
  });
  moderateCert.validateSync();
  assert(moderateCert.overallGrade === 'GRADE_C_PROCESSING_ONLY', 'Classifies 6% rot as GRADE_C_PROCESSING_ONLY');
  assert(moderateCert.recommendation === 'ACCEPT_WITH_PRO_RATA_DISCOUNT', 'Recommends ACCEPT_WITH_PRO_RATA_DISCOUNT for Grade C');
  assert(moderateCert.recommendedPriceAdjustmentPercentage === 9, 'Computes 9% pro-rata discount recommendation');

  // 12. Mold Contamination Rejection
  const moldyCert = new QualityInspectionCertificate({
    ...sampleCertData,
    metrics: {
      ...sampleCertData.metrics,
      moldMildewDetected: true
    }
  });
  moldyCert.validateSync();
  assert(moldyCert.overallGrade === 'REJECTED_UNFIT', 'Rejects moldy produce as REJECTED_UNFIT');
  assert(moldyCert.recommendation === 'LODGE_TRIBUNAL_DISPUTE', 'Recommends LODGE_TRIBUNAL_DISPUTE for unfit produce');
  assert(moldyCert.isAcceptableForCommerce === false, 'Virtual isAcceptableForCommerce is false for moldy produce');

  // 13. Certificate HMAC Token
  assert(cert.certificateIntegrityToken && cert.certificateIntegrityToken.length === 64, 'Generates 64-character HMAC-SHA256 seal');

  console.log('\n======================================================');
  console.log('   RUNNING DISPUTE ARBITRATION TRIBUNAL UNIT TESTS    ');
  console.log('======================================================\n');

  const sampleCaseData = {
    vaultNumber: 'VAULT-20240730-AABBCC',
    orderId: 'ORD-20240730-9988',
    waybillNumber: 'WB-20240730-112233',
    disputeCategory: 'COLD_CHAIN_TEMPERATURE_BREACH',
    claimant: {
      role: 'BUYER',
      name: 'Adeyemi Wholesale Mart',
      email: 'seun@agrogrocers.ng',
      phone: '+2348021112233'
    },
    respondent: {
      role: 'CARRIER',
      name: 'Aliyu Transport Logistics',
      email: 'aliyu@transporters.ng',
      phone: '+2348098889900'
    },
    carrierParty: {
      driverName: 'Ibrahim Sani',
      vehiclePlateNumber: 'KNO-554-XB',
      carrierEmail: 'aliyu@transporters.ng'
    },
    initialClaimSummary: 'Reefer unit suffered power failure across Lokoja corridor resulting in 18C temperature spike and produce spoilage.',
    demandedRefundAmount: 850000,
    totalEscrowDisputed: 2785687.5
  };

  // 14. Docket Creation
  const tribunalCase = new DisputeTribunalCase(sampleCaseData);
  tribunalCase.validateSync();
  assert(/^ARB-\d{8}-[A-F0-9]{6}$/.test(tribunalCase.docketNumber), `Generates valid docketNumber (${tribunalCase.docketNumber})`);
  assert(tribunalCase.status === 'LODGED', 'Default tribunal status is LODGED');

  // 15. Evidence Locker Submissions
  tribunalCase.addEvidenceItem({
    evidenceType: 'IOT_TEMPERATURE_LOG',
    submittedByRole: 'SYSTEM_AUDITOR',
    submittedByName: 'Agrily IoT Cold-Chain Daemon',
    title: 'Sensor Pod POD-KNO-882 Telemetry Breach Log',
    description: 'Recorded 14 hours above 12°C between Lokoja and Ore corridor',
    telemetryMetadata: {
      sensorPodSerial: 'POD-KNO-882',
      maxTemperatureCelsius: 18.4,
      breachDurationMinutes: 840
    }
  });
  assert(tribunalCase.evidenceItems.length === 1, 'Appends evidence item to tribunal locker');
  assert(tribunalCase.evidenceItems[0].sha256Hash.length === 64, 'Computes SHA-256 hash for evidence attachment');
  assert(tribunalCase.status === 'EVIDENCE_SUBMISSION', 'Advances status to EVIDENCE_SUBMISSION upon first upload');

  // 16. Binding Verdict & Cryptographic Sealing
  tribunalCase.issueVerdict({
    outcome: 'CARRIER_INSURANCE_LIABILITY',
    faultLiabilityParty: 'CARRIER',
    verdictSummary: 'Carrier reefer malfunction confirmed via IoT logs. Carrier freight fee forfeited; buyer refunded loss.',
    buyerRefundAmount: 850000,
    farmerPayoutAmount: 1850000,
    carrierPayoutAmount: 0,
    arbitrationFeeDeduction: 25000
  });
  assert(tribunalCase.status === 'VERDICT_ISSUED', 'Advances status to VERDICT_ISSUED');
  assert(tribunalCase.arbitrationVerdict.outcome === 'CARRIER_INSURANCE_LIABILITY', 'Records verdict outcome CARRIER_INSURANCE_LIABILITY');
  assert(tribunalCase.arbitrationVerdict.buyerRefundAmount === 850000, 'Assigns buyer refund amount ₦850,000');
  assert(tribunalCase.arbitrationVerdict.farmerPayoutAmount === 1850000, 'Assigns farmer payout amount ₦1,850,000');
  assert(tribunalCase.arbitrationVerdict.verdictCryptographicSeal.length === 64, 'Computes 64-character SHA-256 verdict seal');

  // Final Summary
  console.log('\n------------------------------------------------------');
  console.log(` RESULTS: ${passedTests} passed, ${failedTests} failed (${totalTests} total)`);
  console.log('------------------------------------------------------\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

// Run test suite
if (require.main === module) {
  runEscrowSettlementVaultUnitTests().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}

module.exports = { runEscrowSettlementVaultUnitTests };
