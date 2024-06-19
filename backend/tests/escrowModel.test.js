const crypto = require('crypto');
const { EscrowContract, ESCROW_STATUSES, SUPPORTED_CURRENCIES } = require('../models/EscrowContract');
const { PaymentTransaction, GATEWAY_PROVIDERS } = require('../models/PaymentTransaction');

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

async function runEscrowModelTests() {
  console.log('\n======================================================');
  console.log('    RUNNING AGRILY ESCROW & PAYMENT MODEL TESTS       ');
  console.log('======================================================\n');

  try {
    // -------------------------------------------------------------
    // 1. Constants verification
    // -------------------------------------------------------------
    assert(
      ESCROW_STATUSES.includes('DEPOSITED_LOCKED') && ESCROW_STATUSES.includes('RELEASED_TO_FARMER'),
      'EscrowContract exposes full lifecycle statuses'
    );
    assert(
      SUPPORTED_CURRENCIES.includes('NGN') && SUPPORTED_CURRENCIES.includes('KES') && SUPPORTED_CURRENCIES.includes('USD'),
      'EscrowContract supports multi-currency options (NGN, KES, USD)'
    );

    // -------------------------------------------------------------
    // 2. EscrowContract Schema Validation & Fee Calculations
    // -------------------------------------------------------------
    const validContract = new EscrowContract({
      contractId: 'ESC-2024-901',
      orderId: 'ORD-77123',
      buyerEmail: 'buyer.lagos@foodco.ng',
      buyerName: 'Lagos Foods Co',
      farmerEmail: 'farmer.kaduna@agrily.com',
      farmerName: 'Ibrahim Kaduna',
      currency: 'NGN',
      totalAmount: 100000
    });

    const valErr = validContract.validateSync();
    assert(!valErr, 'EscrowContract validates properly with valid payload');
    assert(validContract.escrowFee === 1500, 'EscrowContract computes 1.5% platform fee correctly (1,500 NGN)');
    assert(validContract.farmerPayoutAmount === 98500, 'EscrowContract computes farmer payout amount correctly (98,500 NGN)');
    assert(validContract.status === 'INITIALIZED', 'Default escrow contract status is INITIALIZED');
    assert(validContract.milestones.length === 3, 'Initializes default milestone tranche schedule');

    // -------------------------------------------------------------
    // 3. Schema Rejection of Invalid Data
    // -------------------------------------------------------------
    const invalidContract = new EscrowContract({
      contractId: 'ESC-INVALID',
      totalAmount: -500,
      buyerEmail: 'not-an-email'
    });
    const invErr = invalidContract.validateSync();
    assert(Boolean(invErr && invErr.errors['buyerEmail']), 'Rejects invalid buyer email format');
    assert(Boolean(invErr && invErr.errors['totalAmount']), 'Rejects negative totalAmount');
    assert(Boolean(invErr && invErr.errors['farmerEmail']), 'Enforces required farmerEmail');

    // -------------------------------------------------------------
    // 4. State Machine Transition Rules
    // -------------------------------------------------------------
    assert(validContract.canTransitionTo('DEPOSITED_LOCKED'), 'Allows transition from INITIALIZED to DEPOSITED_LOCKED');
    assert(!validContract.canTransitionTo('RELEASED_TO_FARMER'), 'Disallows direct jump from INITIALIZED to RELEASED_TO_FARMER');

    validContract.transitionTo('DEPOSITED_LOCKED');
    assert(validContract.status === 'DEPOSITED_LOCKED', 'Transitions cleanly to DEPOSITED_LOCKED and sets depositedAt');
    assert(Boolean(validContract.depositedAt), 'depositedAt timestamp is recorded upon lock');

    validContract.transitionTo('IN_TRANSIT_SECURED');
    validContract.transitionTo('INSPECTION_PENDING');
    assert(validContract.status === 'INSPECTION_PENDING', 'Transitions to INSPECTION_PENDING');
    assert(Boolean(validContract.inspectionExpiresAt), 'inspectionExpiresAt window is calculated');

    // -------------------------------------------------------------
    // 5. Milestone Release Logic
    // -------------------------------------------------------------
    validContract.releaseMilestone(1, 'TXN-REL-01');
    assert(validContract.milestones[1].status === 'released', 'Milestone 1 is marked as released');
    assert(validContract.amountReleased > 0, 'Contract tracks incremental released funds');

    // Releasing remaining milestone
    validContract.releaseMilestone(2, 'TXN-REL-02');
    assert(validContract.status === 'RELEASED_TO_FARMER', 'Automatically transitions to RELEASED_TO_FARMER once all tranches are released');

    // -------------------------------------------------------------
    // 6. Dispute Arbitration Mechanism
    // -------------------------------------------------------------
    const disputedContract = new EscrowContract({
      contractId: 'ESC-2024-902',
      orderId: 'ORD-77124',
      buyerEmail: 'buyer@kenya.co.ke',
      buyerName: 'Nairobi Grocers',
      farmerEmail: 'farmer@eldoret.com',
      farmerName: 'Eldoret Farms',
      currency: 'KES',
      totalAmount: 50000,
      status: 'INSPECTION_PENDING'
    });

    disputedContract.transitionTo('DISPUTED', {
      openedBy: 'buyer',
      reason: '30% produce arrived bruised due to reefer temperature excursion'
    });

    assert(disputedContract.status === 'DISPUTED', 'Transitions to DISPUTED');
    assert(disputedContract.dispute.isDisputed === true, 'Sets dispute flag to true');
    assert(disputedContract.dispute.reason.includes('bruised'), 'Records dispute rationale for arbitration');

    // -------------------------------------------------------------
    // 7. PaymentTransaction Schema Validation
    // -------------------------------------------------------------
    const payment = new PaymentTransaction({
      transactionReference: 'TXN-PSTK-00192',
      escrowContractId: 'ESC-2024-901',
      orderId: 'ORD-77123',
      gatewayProvider: 'paystack',
      currency: 'NGN',
      amount: 100000,
      customerEmail: 'buyer.lagos@foodco.ng'
    });

    const payErr = payment.validateSync();
    assert(!payErr, 'PaymentTransaction validates valid payload');
    assert(payment.netAmount === 100000, 'Calculates netAmount correctly with default zero fee');

    // -------------------------------------------------------------
    // 8. HMAC Signature Verification (Paystack, Flutterwave, Stripe)
    // -------------------------------------------------------------
    const secret = 'sec_agrily_test_key_9981';
    const payload = { event: 'charge.success', data: { reference: 'TXN-PSTK-00192', amount: 10000000 } };
    const payloadStr = JSON.stringify(payload);

    // Paystack HMAC-SHA512
    const paystackSig = crypto.createHmac('sha512', secret).update(payloadStr).digest('hex');
    const isPaystackValid = PaymentTransaction.verifyHmacSignature(payload, paystackSig, secret, 'paystack');
    const isPaystackFake = PaymentTransaction.verifyHmacSignature(payload, 'bogus_signature', secret, 'paystack');
    assert(isPaystackValid === true, 'verifyHmacSignature validates authentic Paystack SHA512 signature');
    assert(isPaystackFake === false, 'verifyHmacSignature rejects forged Paystack signature');

    // Flutterwave secret hash
    const isFlwValid = PaymentTransaction.verifyHmacSignature(payload, secret, secret, 'flutterwave');
    assert(isFlwValid === true, 'verifyHmacSignature validates Flutterwave verif-hash');

    // Stripe signature
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const stripeSig = crypto.createHmac('sha256', secret).update(`${timestamp}.${payloadStr}`).digest('hex');
    const stripeHeader = `t=${timestamp},v1=${stripeSig}`;
    const isStripeValid = PaymentTransaction.verifyHmacSignature(payload, stripeHeader, secret, 'stripe');
    assert(isStripeValid === true, 'verifyHmacSignature validates authentic Stripe v1 webhook signature');

  } catch (err) {
    console.error('Unexpected error in escrow model tests:', err);
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
  runEscrowModelTests();
}

module.exports = { runEscrowModelTests };
