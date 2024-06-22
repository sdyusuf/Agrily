const crypto = require('crypto');
const {
  createEscrowLockSchema,
  releaseMilestoneSchema,
  disputeContractSchema,
  createEscrowLock,
  handlePaystackWebhook,
  handleFlutterwaveWebhook,
  handleStripeWebhook,
  releaseEscrowMilestone,
  disputeEscrowContract,
  getEscrowContract,
  getUserEscrowContracts,
  router
} = require('../routes/escrow');
const { EscrowContract } = require('../models/EscrowContract');
const { PaymentTransaction } = require('../models/PaymentTransaction');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  FAIL: ${message}`);
    failedTests++;
  }
}

// Mock Express response helper
function createMockRes() {
  const res = {
    statusCode: 200,
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    }
  };
  return res;
}

async function runEscrowRouteTests() {
  console.log('\n======================================================');
  console.log('   RUNNING AGRILY ESCROW ROUTES & CONTROLLER TESTS    ');
  console.log('======================================================\n');

  try {
    // -------------------------------------------------------------
    // 1. Joi Schema Validations
    // -------------------------------------------------------------
    const validLockPayload = {
      orderId: 'ORD-88192',
      buyerEmail: 'procurement@foodchain.com',
      buyerName: 'FoodChain Procurement',
      farmerEmail: 'farmer.kaduna@agrily.com',
      farmerName: 'Ibrahim Kaduna',
      currency: 'NGN',
      totalAmount: 150000,
      inspectionWindowHours: 48
    };

    const { error: lockErr } = createEscrowLockSchema.validate(validLockPayload);
    assert(!lockErr, 'createEscrowLockSchema accepts valid escrow creation payload');

    const { error: invalidLockErr } = createEscrowLockSchema.validate({
      orderId: 'ORD-1',
      buyerEmail: 'bad-email',
      totalAmount: -100
    });
    assert(Boolean(invalidLockErr), 'createEscrowLockSchema rejects invalid email and negative amount');

    const { error: relErr } = releaseMilestoneSchema.validate({
      milestoneIndex: 1,
      buyerSignature: 'SIG-VERIFIED-AUTH-091'
    });
    assert(!relErr, 'releaseMilestoneSchema accepts valid milestone index and signature');

    const { error: disputeErr } = disputeContractSchema.validate({
      openedBy: 'buyer',
      reason: 'Produce arrived severely damaged and failed quality checks.'
    });
    assert(!disputeErr, 'disputeContractSchema validates proper dispute filing rationale');

    // -------------------------------------------------------------
    // 2. Controller: createEscrowLock
    // -------------------------------------------------------------
    // Test validation failure
    const badReq = { body: { orderId: 'ORD-99' } };
    const badRes = createMockRes();
    await createEscrowLock(badReq, badRes);
    assert(badRes.statusCode === 400, 'createEscrowLock returns HTTP 400 on validation failure');

    // Test successful lock creation
    const origSave = EscrowContract.prototype.save;
    EscrowContract.prototype.save = async function () { return this; };

    const goodReq = { body: validLockPayload };
    const goodRes = createMockRes();
    await createEscrowLock(goodReq, goodRes);
    assert(goodRes.statusCode === 201, 'createEscrowLock returns HTTP 201 on successful creation');
    assert(Boolean(goodRes.jsonData.data.contractId), 'createEscrowLock returns generated contractId');
    assert(goodRes.jsonData.data.status === 'INITIALIZED', 'Initial contract status is INITIALIZED');

    // -------------------------------------------------------------
    // 3. Webhook: Paystack Signature Verification
    // -------------------------------------------------------------
    const testSecret = 'sec_paystack_test_agrily';
    process.env.PAYSTACK_SECRET_KEY = testSecret;

    const webhookBody = {
      event: 'charge.success',
      data: {
        reference: 'TXN-PSTK-TEST-001',
        amount: 15000000,
        currency: 'NGN',
        channel: 'card',
        metadata: { contractId: 'ESC-TEST-001' },
        customer: { email: 'buyer@agrily.com' }
      }
    };

    // Forged signature
    const forgedReq = {
      headers: { 'x-paystack-signature': 'bogus_sha512_hash' },
      body: webhookBody
    };
    const forgedRes = createMockRes();
    await handlePaystackWebhook(forgedReq, forgedRes);
    assert(forgedRes.statusCode === 401, 'handlePaystackWebhook rejects forged HMAC signature with HTTP 401');

    // Authentic signature
    PaymentTransaction.prototype.save = async function () { return this; };
    const origFindOne = EscrowContract.findOne;
    const mockContract = new EscrowContract({
      contractId: 'ESC-TEST-001',
      orderId: 'ORD-88192',
      buyerEmail: 'buyer@agrily.com',
      buyerName: 'Buyer',
      farmerEmail: 'farmer@agrily.com',
      farmerName: 'Farmer',
      currency: 'NGN',
      totalAmount: 150000
    });
    EscrowContract.findOne = async () => mockContract;

    const validPaystackHash = crypto.createHmac('sha512', testSecret)
      .update(JSON.stringify(webhookBody))
      .digest('hex');

    const authReq = {
      headers: { 'x-paystack-signature': validPaystackHash },
      body: webhookBody
    };
    const authRes = createMockRes();
    await handlePaystackWebhook(authReq, authRes);
    assert(authRes.statusCode === 200, 'handlePaystackWebhook processes authentic webhook with HTTP 200');
    assert(mockContract.status === 'DEPOSITED_LOCKED', 'Paystack webhook transitions contract to DEPOSITED_LOCKED');

    // -------------------------------------------------------------
    // 4. Webhook: Flutterwave & Stripe
    // -------------------------------------------------------------
    process.env.FLW_SECRET_HASH = 'flw_secret_test';
    const flwBadReq = { headers: { 'verif-hash': 'wrong' }, body: {} };
    const flwBadRes = createMockRes();
    await handleFlutterwaveWebhook(flwBadReq, flwBadRes);
    assert(flwBadRes.statusCode === 401, 'handleFlutterwaveWebhook rejects invalid verif-hash with HTTP 401');

    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    const stripeBadReq = { headers: { 'stripe-signature': 'invalid' }, body: {} };
    const stripeBadRes = createMockRes();
    await handleStripeWebhook(stripeBadReq, stripeBadRes);
    assert(stripeBadRes.statusCode === 401, 'handleStripeWebhook rejects invalid stripe-signature with HTTP 401');

    // -------------------------------------------------------------
    // 5. Controller: releaseEscrowMilestone
    // -------------------------------------------------------------
    const relReq = {
      params: { contractId: 'ESC-TEST-001' },
      body: { milestoneIndex: 1, buyerSignature: 'AUTH-BUYER-SIGN' }
    };
    const relRes = createMockRes();
    await releaseEscrowMilestone(relReq, relRes);
    assert(relRes.statusCode === 200, 'releaseEscrowMilestone returns HTTP 200 on valid release');
    assert(relRes.jsonData.data.milestones[1].status === 'released', 'Milestone 1 marked released in response');

    // -------------------------------------------------------------
    // 6. Controller: disputeEscrowContract
    // -------------------------------------------------------------
    const disputeReq = {
      params: { contractId: 'ESC-TEST-001' },
      body: { openedBy: 'buyer', reason: 'Consignment delivery damaged upon arrival.' }
    };
    const disputeRes = createMockRes();
    await disputeEscrowContract(disputeReq, disputeRes);
    assert(disputeRes.statusCode === 200, 'disputeEscrowContract returns HTTP 200');
    assert(disputeRes.jsonData.data.status === 'DISPUTED', 'Contract marked as DISPUTED');

    // -------------------------------------------------------------
    // 7. Controller: getEscrowContract & getUserEscrowContracts
    // -------------------------------------------------------------
    PaymentTransaction.find = () => ({
      sort: () => [{ transactionReference: 'TXN-PSTK-TEST-001', amount: 150000 }]
    });

    const getReq = { params: { contractId: 'ESC-TEST-001' } };
    const getRes = createMockRes();
    await getEscrowContract(getReq, getRes);
    assert(getRes.statusCode === 200, 'getEscrowContract returns HTTP 200 with contract details');
    assert(getRes.jsonData.data.transactions.length === 1, 'Includes associated payment transactions');

    EscrowContract.find = () => ({
      sort: () => [mockContract]
    });

    const userReq = { params: { email: 'buyer@agrily.com' } };
    const userRes = createMockRes();
    await getUserEscrowContracts(userReq, userRes);
    assert(userRes.statusCode === 200, 'getUserEscrowContracts returns HTTP 200 with list');
    assert(Boolean(userRes.jsonData.stats), 'getUserEscrowContracts returns aggregate vault stats');

    // -------------------------------------------------------------
    // 8. Router configuration
    // -------------------------------------------------------------
    const registeredRoutes = router.stack.map(layer => layer.route?.path).filter(Boolean);
    assert(registeredRoutes.includes('/create-lock'), 'Router configures /create-lock');
    assert(registeredRoutes.includes('/webhook/paystack'), 'Router configures /webhook/paystack');
    assert(registeredRoutes.includes('/webhook/flutterwave'), 'Router configures /webhook/flutterwave');
    assert(registeredRoutes.includes('/webhook/stripe'), 'Router configures /webhook/stripe');
    assert(registeredRoutes.includes('/:contractId/release-milestone'), 'Router configures /:contractId/release-milestone');
    assert(registeredRoutes.includes('/:contractId/dispute'), 'Router configures /:contractId/dispute');

    // Restore mocks
    EscrowContract.prototype.save = origSave;
    EscrowContract.findOne = origFindOne;

  } catch (err) {
    console.error('Unexpected error in escrow routes tests:', err);
    failedTests++;
  }

  console.log('\n------------------------------------------------------');
  console.log(` RESULTS: ${passedTests} passed, ${failedTests} failed`);
  console.log('------------------------------------------------------\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runEscrowRouteTests();
}

module.exports = { runEscrowRouteTests };
