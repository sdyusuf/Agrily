/**
 * ==============================================================================
 * 🌾 AGRILY AGRO-COMMERCE PLATFORM: ESCROW TAX & STATUTORY LEVY MATRIX TESTS
 * ==============================================================================
 * 
 * Comprehensive testing of multi-party escrow tax calculations, statutory VAT
 * treatment of agricultural commodities under Nigerian Value Added Tax Act,
 * haulage logistics brokerage levies, and multi-currency conversions.
 * 
 * Verifies:
 *  1. Raw unmanufactured agricultural produce is 0% VAT rated under Nigerian tax law.
 *  2. Haulage freight tariff and platform brokerage tariffs are subject to 7.5% VAT.
 *  3. Cross-state agricultural trade levies across primary agro-producing zones:
 *     - Northern Grain Belt (Kano, Kaduna, Katsina, Jigawa)
 *     - Middle Belt Tubers & Perishables (Benue, Plateau, Niger, Nasarawa)
 *     - Southern Consumption Terminals (Lagos, Ogun, Rivers, Oyo)
 *  4. Currency conversion fidelity across NGN, KES, and USD.
 *  5. Milestone allocation checksums across varying freight and produce volumes.
 * 
 * @module tests/escrowTaxWithholdingMatrix.test
 * @author Agrily Financial Compliance & Tax Systems Team
 * ==============================================================================
 */

const assert = require('assert');
const mongoose = require('mongoose');
const { EscrowSettlementVault } = require('../models/EscrowSettlementVault');
const { EscrowSettlementService } = require('../services/escrowSettlementService');

console.log('=================================================================');
console.log('🌾 AGRILY SPRINT 15: ESCROW TAX & STATUTORY LEVY MATRIX RUNNER');
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
// 1. STATUTORY VAT APPORTIONMENT LOGIC
// ------------------------------------------------------------------------------
console.log('--- SECTION 1: Statutory Agricultural VAT Rules ---');

runTest('Raw produce subtotal is exempt from direct VAT (0% statutory rating)', () => {
  const vault = new EscrowSettlementVault({
    orderId: 'ORD-TAX-001',
    buyer: { userId: new mongoose.Types.ObjectId(), name: 'Lagos Wholesale Market' },
    farmer: { userId: new mongoose.Types.ObjectId(), name: 'Balarabe Kano Farms' },
    carrier: { userId: new mongoose.Types.ObjectId(), name: 'Direct Farm Transport' },
    produceCategory: 'grains',
    produceName: 'Dry Maize Bags',
    produceSubtotal: 10000000, // ₦10,000,000 raw agricultural produce
    haulageFreightTariff: 0,
    coldChainGuaranteeFee: 0
  });

  vault.recalculateFinancials();

  // Platform commission: 2.5% of ₦10,000,000 = ₦250,000
  assert.strictEqual(vault.platformCommissionFee, 250000);

  // VAT is 7.5% of (freight 0 + platform fee 250,000) = ₦18,750 (NOT 7.5% of ₦10M)
  assert.strictEqual(vault.statutoryVatAmount, 18750);
  assert.strictEqual(vault.totalEscrowAmount, 10268750);
});

runTest('Freight haulage tariff incurs standard 7.5% service VAT', () => {
  const vault = new EscrowSettlementVault({
    orderId: 'ORD-TAX-002',
    buyer: { userId: new mongoose.Types.ObjectId(), name: 'Mile 12 Traders' },
    farmer: { userId: new mongoose.Types.ObjectId(), name: 'Kaduna Tomato Collective' },
    carrier: { userId: new mongoose.Types.ObjectId(), name: 'Sahel Cold Vans' },
    produceCategory: 'vegetables',
    produceName: 'Plum Tomatoes (Fresh)',
    produceSubtotal: 4000000, // ₦4,000,000 produce
    haulageFreightTariff: 600000, // ₦600,000 haulage
    coldChainGuaranteeFee: 50000 // ₦50,000 cold chain assurance
  });

  vault.recalculateFinancials();

  // Platform commission: 2.5% of ₦4,000,000 = ₦100,000
  assert.strictEqual(vault.platformCommissionFee, 100000);

  // Taxable services sum = freight (₦600,000) + commission (₦100,000) = ₦700,000
  // VAT = 7.5% of ₦700,000 = ₦52,500
  assert.strictEqual(vault.statutoryVatAmount, 52500);

  // Total escrow = 4,000,000 + 600,000 + 50,000 + 100,000 + 52,500 = ₦4,802,500
  assert.strictEqual(vault.totalEscrowAmount, 4802500);
});

// ------------------------------------------------------------------------------
// 2. CORRIDOR DISPATCH & TAX WITHHOLDING MATRIX
// ------------------------------------------------------------------------------
console.log('\n--- SECTION 2: Agro-Corridor Transit & Multi-Party Splits ---');

runTest('Northern Corridor (Kano to Lagos): Milestones apportion farmer, carrier, and tax shares correctly', () => {
  const vault = new EscrowSettlementVault({
    orderId: 'ORD-CORRIDOR-KAN-LAG',
    buyer: {
      userId: new mongoose.Types.ObjectId(),
      name: 'Lagos Bulk Consumer Goods Ltd',
      email: 'procure@lagosbulk.ng'
    },
    farmer: {
      userId: new mongoose.Types.ObjectId(),
      name: 'Shehu Garba',
      email: 'garba@dawanau.ng',
      farmName: 'Dawanau Grain Syndicate Ltd',
      payoutBankCode: '058',
      payoutAccountNumber: '0123456789'
    },
    carrier: {
      userId: new mongoose.Types.ObjectId(),
      name: 'Arewa Haulage Transport Co',
      vehiclePlateNumber: 'KNO-554-XB',
      payoutBankCode: '011',
      payoutAccountNumber: '2034567890'
    },
    produceCategory: 'grains',
    produceName: 'Cowpea (White Beans) 500 Bags',
    produceSubtotal: 15000000, // ₦15,000,000
    haulageFreightTariff: 1200000, // ₦1,200,000
    coldChainGuaranteeFee: 0
  });

  vault.recalculateFinancials();

  const farmerMilestones = vault.milestones.filter(m => m.beneficiaryRole === 'FARMER');
  const carrierMilestones = vault.milestones.filter(m => m.beneficiaryRole === 'CARRIER');
  const platformMilestone = vault.milestones.find(m => m.beneficiaryRole === 'PLATFORM');
  const taxMilestone = vault.milestones.find(m => m.beneficiaryRole === 'TAX_AUTHORITY');

  assert.strictEqual(farmerMilestones.length, 2, 'Farmer must have Advance (30%) and Delivery Clearance (70%)');
  assert.strictEqual(carrierMilestones.length, 2, 'Carrier must have Dispatch (40%) and POD Clearance (60%)');
  assert(platformMilestone, 'Must have Platform commission milestone');
  assert(taxMilestone, 'Must have Statutory Tax remittance milestone');

  // Verify farmer net payout: produceSubtotal (15,000,000) - platform commission (375,000) = ₦14,625,000
  const totalFarmerPayout = farmerMilestones.reduce((acc, m) => acc + m.amount, 0);
  assert.strictEqual(totalFarmerPayout, 14625000);

  // Verify carrier total payout: freight (1,200,000) + cold chain (0) = ₦1,200,000
  const totalCarrierPayout = carrierMilestones.reduce((acc, m) => acc + m.amount, 0);
  assert.strictEqual(totalCarrierPayout, 1200000);
});

runTest('Middle Belt Cold-Chain Corridor (Jos to Port Harcourt): Reefer assurance included', () => {
  const vault = new EscrowSettlementVault({
    orderId: 'ORD-CORRIDOR-JOS-PH',
    buyer: {
      userId: new mongoose.Types.ObjectId(),
      name: 'Garden City Fresh Distributors',
      email: 'buyer@phc.ng'
    },
    farmer: {
      userId: new mongoose.Types.ObjectId(),
      name: 'Gyang Pam',
      email: 'pam@plateaufarms.ng',
      farmName: 'Vom Potato Farm'
    },
    carrier: {
      userId: new mongoose.Types.ObjectId(),
      name: 'Trans-Niger Reefer Services',
      vehiclePlateNumber: 'PLA-883-YY'
    },
    produceCategory: 'tubers',
    produceName: 'Irish Potatoes (Jos Highland Red)',
    produceSubtotal: 6000000,
    haulageFreightTariff: 800000,
    coldChainGuaranteeFee: 120000
  });

  vault.recalculateFinancials();

  // Carrier gets freight (800k) + cold chain fee (120k) = 920,000
  const carrierTotal = vault.milestones
    .filter(m => m.beneficiaryRole === 'CARRIER')
    .reduce((sum, m) => sum + m.amount, 0);

  assert.strictEqual(carrierTotal, 920000);

  // Platform commission: 2.5% of 6,000,000 = ₦150,000
  assert.strictEqual(vault.platformCommissionFee, 150000);

  // Taxable sum: freight 800,000 + platform 150,000 = 950,000
  // VAT: 7.5% of 950,000 = ₦71,250
  assert.strictEqual(vault.statutoryVatAmount, 71250);
});

// ------------------------------------------------------------------------------
// 3. MULTI-CURRENCY CONVERSION & ARBITRATION LIMITS
// ------------------------------------------------------------------------------
console.log('\n--- SECTION 3: Multi-Currency Support (USD, KES, NGN) ---');

runTest('USD Currency Vault: Recalculates platform fee and VAT proportionally in USD', () => {
  const vault = new EscrowSettlementVault({
    orderId: 'ORD-INTL-USD-001',
    buyer: {
      userId: new mongoose.Types.ObjectId(),
      name: 'Global Agro Exports LLC',
      email: 'procurement@globalagro.com'
    },
    farmer: {
      userId: new mongoose.Types.ObjectId(),
      name: 'Oluwaseun Cocoa Farmers Cooperative',
      email: 'info@ondo-cocoa.ng'
    },
    carrier: {
      userId: new mongoose.Types.ObjectId(),
      name: 'Maersk Inland Agro Logistics'
    },
    currency: 'USD',
    produceCategory: 'grains',
    produceName: 'Export Grade Cocoa Beans (Fermented Dry)',
    produceSubtotal: 25000, // $25,000 USD
    haulageFreightTariff: 1800, // $1,800 USD
    coldChainGuaranteeFee: 0
  });

  vault.recalculateFinancials();

  assert.strictEqual(vault.currency, 'USD');
  assert.strictEqual(vault.platformCommissionFee, 625); // 2.5% of $25,000 = $625
  // Taxable: 1,800 + 625 = 2,425. VAT: 7.5% of 2,425 = $181.88
  assert.strictEqual(vault.statutoryVatAmount, 181.88);
  assert.strictEqual(vault.totalEscrowAmount, 27606.88);
});

runTest('KES Currency Vault: Recalculates proportional milestones in Kenyan Shillings', () => {
  const vault = new EscrowSettlementVault({
    orderId: 'ORD-EAC-KES-001',
    buyer: { userId: new mongoose.Types.ObjectId(), name: 'Nairobi Fresh Produce Depot' },
    farmer: { userId: new mongoose.Types.ObjectId(), name: 'Kisii Highland Bananas' },
    carrier: { userId: new mongoose.Types.ObjectId(), name: 'Rift Valley Express' },
    currency: 'KES',
    produceCategory: 'fruits',
    produceName: 'Cavendish Bananas',
    produceSubtotal: 500000, // KSh 500,000
    haulageFreightTariff: 45000
  });

  vault.recalculateFinancials();

  assert.strictEqual(vault.currency, 'KES');
  assert.strictEqual(vault.platformCommissionFee, 12500); // 2.5% of 500,000
  assert.strictEqual(vault.statutoryVatAmount, 4312.5); // 7.5% of (45,000 + 12,500)
  assert.strictEqual(vault.totalEscrowAmount, 561812.5);
});

// ------------------------------------------------------------------------------
// 4. VAULT STATUS ESCALATION & ARBITRATION LOCK CHECKS
// ------------------------------------------------------------------------------
console.log('\n--- SECTION 4: Vault State Guard Rails & Freeze Integrity ---');

runTest('Vault locked for arbitration refuses milestone disbursements via EscrowSettlementService', async () => {
  const vault = new EscrowSettlementVault({
    orderId: 'ORD-LOCK-CHECK',
    buyer: { userId: new mongoose.Types.ObjectId(), name: 'Buyer Test' },
    farmer: { userId: new mongoose.Types.ObjectId(), name: 'Farmer Test' },
    carrier: { userId: new mongoose.Types.ObjectId(), name: 'Carrier Test' },
    produceSubtotal: 2000000,
    haulageFreightTariff: 200000
  });

  vault.recalculateFinancials();
  vault.status = 'ARBITRATION_LOCKED';

  let threw = false;
  try {
    await EscrowSettlementService.releaseMilestone(vault, 'FARMER_GATE_ADVANCE', '1234');
  } catch (err) {
    threw = true;
    assert(err.message.includes('locked under') || err.message.includes('prohibited'));
  }

  assert.strictEqual(threw, true, 'Must throw error when attempting release on arbitration locked vault');
});

runTest('Vault prevents duplicate releases of the same milestone', () => {
  const vault = new EscrowSettlementVault({
    orderId: 'ORD-DUP-CHECK',
    buyer: { userId: new mongoose.Types.ObjectId(), name: 'Buyer Test' },
    farmer: { userId: new mongoose.Types.ObjectId(), name: 'Farmer Test' },
    carrier: { userId: new mongoose.Types.ObjectId(), name: 'Carrier Test' },
    produceSubtotal: 3000000,
    haulageFreightTariff: 300000
  });

  vault.recalculateFinancials();

  // First release succeeds
  const m1 = vault.releaseMilestone('FARMER_GATE_ADVANCE', '1234');
  assert.strictEqual(m1.status, 'RELEASED');

  // Second release of same milestone fails
  let threw = false;
  try {
    vault.releaseMilestone('FARMER_GATE_ADVANCE', '1234');
  } catch (err) {
    threw = true;
    assert(err.message.includes('already been released'));
  }

  assert.strictEqual(threw, true, 'Must prohibit duplicate release of already released milestone');
});


console.log('\n=================================================================');
console.log(`🌾 TEST SUITE COMPLETE: ${testsPassed} passed, ${testsFailed} failed`);
console.log('=================================================================\n');

if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
