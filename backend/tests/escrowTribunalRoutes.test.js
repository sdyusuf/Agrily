/**
 * ==============================================================================
 * 🌾 AGRILY AGRO-COMMERCE PLATFORM: ESCROW VAULT & TRIBUNAL REST ROUTE TESTS
 * ==============================================================================
 * 
 * Integration test suite exercising:
 *  - Escrow Vault creation, listing, dock arrival logging & milestone releases
 *  - Dockside Quality Inspection Certificate generation & grading
 *  - Dispute Tribunal Case filing, evidence locker submissions & verdict adjudication
 *  - Final financial disbursement execution & HTML audit certificate generation
 * 
 * @module tests/escrowTribunalRoutes.test
 * ==============================================================================
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const { EscrowSettlementVault } = require('../models/EscrowSettlementVault');
const { QualityInspectionCertificate } = require('../models/QualityInspectionCertificate');
const { DisputeTribunalCase } = require('../models/DisputeTribunalCase');

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

async function runEscrowTribunalRouteTests() {
  console.log('\n======================================================');
  console.log('    RUNNING ESCROW VAULT & TRIBUNAL REST ROUTE TESTS  ');
  console.log('======================================================\n');

  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve) => {
      if (mongoose.connection.readyState === 1) return resolve();
      mongoose.connection.once('open', resolve);
      setTimeout(resolve, 2500);
    });
  }

  try {
    // -------------------------------------------------------------
    // 1. POST /api/escrow-vault/create validation
    // -------------------------------------------------------------
    const resBadCreate = await request(app)
      .post('/api/escrow-vault/create')
      .send({});
    assert(resBadCreate.status === 400, 'POST /api/escrow-vault/create rejects empty payload with HTTP 400');
    assert(resBadCreate.body.success === false, 'Returns success: false on validation error');

    // Valid payload
    const validVaultPayload = {
      orderId: 'ORD-TEST-ESCROW-001',
      waybillNumber: 'WB-TEST-202408-01',
      produceSubtotal: 1800000, // ₦1,800,000
      haulageFreightTariff: 120000,
      coldChainGuaranteeFee: 15000,
      currency: 'NGN',
      buyer: {
        name: 'Chioma Okeke',
        email: 'chioma.okeke@lagoswholesalers.ng',
        phone: '+2348031234567',
        businessName: 'Okeke Fresh Farm Mart'
      },
      farmer: {
        name: 'Garba Shehu',
        email: 'garba.shehu@kanofarms.ng',
        phone: '+2348029876543',
        farmName: 'Shehu Tomato Orchards',
        payoutBankCode: '058',
        payoutAccountNumber: '0123456789'
      },
      carrier: {
        name: 'Sahel Logistics Haulage',
        phone: '+2348091112233',
        vehiclePlateNumber: 'KNO-991-XA',
        payoutBankCode: '011',
        payoutAccountNumber: '2034567890'
      }
    };

    const resCreate = await request(app)
      .post('/api/escrow-vault/create')
      .send(validVaultPayload);
    assert(resCreate.status === 201, 'POST /api/escrow-vault/create creates new vault with HTTP 201');
    assert(resCreate.body.success === true, 'Returns success: true for vault creation');
    assert(Boolean(resCreate.body.data.vaultNumber), `Created vault has vaultNumber (${resCreate.body.data.vaultNumber})`);
    assert(resCreate.body.data.status === 'DEPOSITED_LOCKED', 'Initial vault status is DEPOSITED_LOCKED');

    const createdVaultNumber = resCreate.body.data.vaultNumber;
    const createdVaultId = resCreate.body.data._id;

    // -------------------------------------------------------------
    // 2. GET /api/escrow-vault (Query & Filter)
    // -------------------------------------------------------------
    const resList = await request(app).get('/api/escrow-vault');
    assert(resList.status === 200, 'GET /api/escrow-vault returns HTTP 200');
    assert(Array.isArray(resList.body.data), 'Returns data array of vaults');
    assert(resList.body.totalCount > 0, 'Total count is positive');

    // Single vault fetch
    const resGetOne = await request(app).get(`/api/escrow-vault/${createdVaultNumber}`);
    assert(resGetOne.status === 200, 'GET /api/escrow-vault/:id returns HTTP 200 for valid code');
    assert(resGetOne.body.data.vaultNumber === createdVaultNumber, 'Returns matching vault record');

    // -------------------------------------------------------------
    // 3. POST /api/escrow-vault/:id/dock-arrival
    // -------------------------------------------------------------
    const resArrival = await request(app).post(`/api/escrow-vault/${createdVaultNumber}/dock-arrival`);
    assert(resArrival.status === 200, 'POST /api/escrow-vault/:id/dock-arrival returns HTTP 200');
    assert(resArrival.body.data.status === 'INSPECTION_PENDING', 'Advances vault status to INSPECTION_PENDING');
    assert(resArrival.body.data.isOpen === true, 'Countdown inspection window is currently active');

    // -------------------------------------------------------------
    // 4. POST /api/escrow-vault/:id/inspect
    // -------------------------------------------------------------
    const inspectionPayload = {
      produceCategory: 'vegetables',
      produceName: 'Roma Tomatoes (Plum)',
      inspectedQuantityKg: 3500,
      inspectedCratesBags: 120,
      inspectionFacility: {
        name: 'Mile 12 Perishable Intake Dock',
        address: 'Mile 12 Market, Lagos',
        state: 'Lagos',
        gpsCoordinates: { latitude: 6.6018, longitude: 3.3934 }
      },
      inspector: {
        name: 'Emeka Anyaoku',
        inspectorBadgeNumber: 'INSP-LAG-088',
        contactPhone: '+2348051239900'
      },
      metrics: {
        moistureContentPercentage: 93.0,
        foreignMatterPercentage: 1.0,
        spoilageRotPercentage: 5.5, // 5.5% rot -> Grade C Processing with discount
        pestInfestationDetected: false,
        moldMildewDetected: false,
        dockCoreTemperatureCelsius: 11.5,
        dockAmbientTemperatureCelsius: 28.5,
        sizeMaturityUniformityScore: 8
      },
      inspectorDigitalSignature: 'SIG-EMEKA-202408-01',
      receiverRepresentativeSignature: {
        name: 'Tunde Bakare',
        title: 'Receiving Dock Lead'
      }
    };

    const resInspect = await request(app)
      .post(`/api/escrow-vault/${createdVaultNumber}/inspect`)
      .send(inspectionPayload);
    assert(resInspect.status === 201, 'POST /api/escrow-vault/:id/inspect creates inspection cert with HTTP 201');
    assert(resInspect.body.data.overallGrade === 'GRADE_C_PROCESSING_ONLY', 'Engine classifies produce as GRADE_C_PROCESSING_ONLY');
    assert(resInspect.body.data.recommendation === 'ACCEPT_WITH_PRO_RATA_DISCOUNT', 'Recommends ACCEPT_WITH_PRO_RATA_DISCOUNT');

    // -------------------------------------------------------------
    // 5. POST /api/escrow-vault/:id/release-milestone
    // -------------------------------------------------------------
    const resRelease = await request(app)
      .post(`/api/escrow-vault/${createdVaultNumber}/release-milestone`)
      .send({
        milestoneKey: 'FARMER_GATE_ADVANCE',
        signatoryPin: 'PIN-9912'
      });
    assert(resRelease.status === 200, 'POST /api/escrow-vault/:id/release-milestone releases milestone with HTTP 200');
    assert(resRelease.body.data.status === 'RELEASED', 'Milestone status is RELEASED');
    assert(resRelease.body.data.vaultStatus === 'PARTIALLY_RELEASED', 'Vault advances to PARTIALLY_RELEASED');

    // -------------------------------------------------------------
    // 6. POST /api/escrow-vault/:id/dispute (File Arbitration Case)
    // -------------------------------------------------------------
    const disputePayload = {
      disputeCategory: 'PRODUCT_SPOILAGE_ROT',
      claimant: {
        role: 'BUYER',
        name: 'Chioma Okeke',
        email: 'chioma.okeke@lagoswholesalers.ng',
        phone: '+2348031234567'
      },
      initialClaimSummary: 'Discovered 5.5% rot exceeding allowable 2% gate threshold. Requesting pro-rata discount resolution.',
      demandedRefundAmount: 250000
    };

    const resDispute = await request(app)
      .post(`/api/escrow-vault/${createdVaultNumber}/dispute`)
      .send(disputePayload);
    if (resDispute.status !== 201) {
      console.error('DISPUTE ERROR:', resDispute.status, resDispute.body);
    }
    assert(resDispute.status === 201, 'POST /api/escrow-vault/:id/dispute lodges dispute with HTTP 201');
    assert(Boolean(resDispute.body.data && resDispute.body.data.docketNumber), `Lodged tribunal case has docketNumber (${resDispute.body.data?.docketNumber})`);
    assert(resDispute.body.data.status === 'LODGED', 'Tribunal status is LODGED');

    // Verify vault is locked
    const resCheckLocked = await request(app).get(`/api/escrow-vault/${createdVaultNumber}`);
    assert(resCheckLocked.body.data.status === 'ARBITRATION_LOCKED', 'Escrow vault status is ARBITRATION_LOCKED');

    // -------------------------------------------------------------
    // 7. POST /api/escrow-vault/:id/tribunal/evidence
    // -------------------------------------------------------------
    const evidencePayload = {
      evidenceType: 'QUALITY_INSPECTION_CERT',
      submittedByRole: 'INSPECTOR',
      submittedByName: 'Emeka Anyaoku',
      title: 'Mile 12 Dock Inspection Sheet #088',
      description: 'Official inspection certificate verifying 5.5% rot defect rate.'
    };

    const resEvidence = await request(app)
      .post(`/api/escrow-vault/${createdVaultNumber}/tribunal/evidence`)
      .send(evidencePayload);
    assert(resEvidence.status === 200, 'POST /api/escrow-vault/:id/tribunal/evidence returns HTTP 200');
    assert(resEvidence.body.data.evidenceItems.length > 0, 'Evidence appended to tribunal locker');

    // -------------------------------------------------------------
    // 8. POST /api/escrow-vault/:id/tribunal/adjudicate
    // -------------------------------------------------------------
    const resAdjudicate = await request(app)
      .post(`/api/escrow-vault/${createdVaultNumber}/tribunal/adjudicate`)
      .send({
        arbitratorName: 'Hon. Justice B. K. Aliyu (Senior Agro-Arbitrator)'
      });
    assert(resAdjudicate.status === 200, 'POST /api/escrow-vault/:id/tribunal/adjudicate returns HTTP 200');
    assert(resAdjudicate.body.data.status === 'VERDICT_ISSUED', 'Tribunal case status is VERDICT_ISSUED');
    assert(resAdjudicate.body.data.arbitrationVerdict.outcome === 'PRO_RATA_PRICE_ADJUSTMENT', 'Issues PRO_RATA_PRICE_ADJUSTMENT verdict');
    assert(resAdjudicate.body.data.arbitrationVerdict.buyerRefundAmount > 0, 'Assigns buyer refund amount');

    // -------------------------------------------------------------
    // 9. POST /api/escrow-vault/:id/tribunal/execute
    // -------------------------------------------------------------
    const resExecute = await request(app)
      .post(`/api/escrow-vault/${createdVaultNumber}/tribunal/execute`);
    assert(resExecute.status === 200, 'POST /api/escrow-vault/:id/tribunal/execute executes settlement with HTTP 200');
    assert(resExecute.body.data.totalReleased > 0, 'Total funds released is positive');
    assert(resExecute.body.data.totalRefunded > 0, 'Total funds refunded to buyer is positive');

    // Verify vault is fully settled
    const resCheckSettled = await request(app).get(`/api/escrow-vault/${createdVaultNumber}`);
    assert(resCheckSettled.body.data.status === 'FULLY_SETTLED', 'Vault state advanced to FULLY_SETTLED');

    // -------------------------------------------------------------
    // 10. GET /api/escrow-vault/:id/certificate-print
    // -------------------------------------------------------------
    const resPrint = await request(app).get(`/api/escrow-vault/${createdVaultNumber}/certificate-print`);
    assert(resPrint.status === 200, 'GET /api/escrow-vault/:id/certificate-print returns HTTP 200');
    assert(resPrint.text.includes('Agrily Agricultural Escrow Settlement'), 'Printout embeds official Agrily header');
    assert(resPrint.text.includes(createdVaultNumber), 'Printout includes unique vault identifier');

    console.log('\n------------------------------------------------------');
    console.log(` RESULTS: ${passedTests} passed, ${failedTests} failed (${totalTests} total)`);
    console.log('------------------------------------------------------\n');

    if (failedTests > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  runEscrowTribunalRouteTests().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { runEscrowTribunalRouteTests };
