/**
 * ==============================================================================
 * 🌾 AGRILY AGRO-LOGISTICS PLATFORM: DIGITAL WAYBILL & INVOICE MODEL TESTS
 * ==============================================================================
 *
 * @description
 * Unit tests validating schema constraints, state machine transitions,
 * cryptographic SHA-256 checksums, HMAC verification tokens, and financial
 * calculations on DigitalWaybill and CommercialInvoice domain models.
 * ==============================================================================
 */

const mongoose = require('mongoose');
const {
  DigitalWaybill,
  WAYBILL_STATUSES,
  TEMPERATURE_CLASSES,
  CUSTODY_ROLES
} = require('../models/DigitalWaybill');
const {
  CommercialInvoice,
  INVOICE_STATUSES,
  SUPPORTED_CURRENCIES
} = require('../models/CommercialInvoice');

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

async function runWaybillModelTests() {
  console.log('\n======================================================');
  console.log('   RUNNING AGRILY DIGITAL WAYBILL MODEL UNIT TESTS   ');
  console.log('======================================================\n');

  // Test 1: Waybill number format
  const sampleWaybill = new DigitalWaybill({
    shipper: {
      contactPerson: 'Musa Danladi',
      contactPhone: '+2348031112233',
      pickupAddress: 'Farm Gate Km 14, Makarfi Road',
      state: 'Kaduna'
    },
    consignee: {
      businessName: 'Kano Fresh Foods Processing Ltd',
      contactPerson: 'Amina Bello',
      contactPhone: '+2348029998877',
      deliveryAddress: 'Plot 44 Bompai Industrial Area',
      state: 'Kano'
    },
    carrier: {
      driverName: 'Ibrahim Sani',
      driverPhone: '+2348054443322',
      vehicleRegistrationPlate: 'KAD-882-TR'
    },
    originDepot: {
      name: 'Zaria Agro Hub',
      latitude: 11.0855,
      longitude: 7.7199
    },
    destinationHub: {
      name: 'Kano Distribution Terminal',
      latitude: 12.0022,
      longitude: 8.5920
    },
    expectedDeliveryDate: new Date('2024-07-20T18:00:00Z'),
    consignments: [
      {
        commodityName: 'Roma Tomatoes',
        category: 'vegetables',
        packagingType: 'PLASTIC_CRATE',
        declaredQuantity: 80,
        grossWeightKg: 2000,
        netWeightKg: 1850,
        numberOfCrates: 80,
        temperatureClass: TEMPERATURE_CLASSES.CHILLED,
        perishabilityPriority: 'HIGH'
      },
      {
        commodityName: 'Habanero Peppers',
        category: 'vegetables',
        packagingType: 'PLASTIC_CRATE',
        declaredQuantity: 30,
        grossWeightKg: 650,
        netWeightKg: 600,
        numberOfCrates: 30,
        temperatureClass: TEMPERATURE_CLASSES.COOL,
        perishabilityPriority: 'MEDIUM'
      }
    ]
  });

  assert(
    sampleWaybill.waybillNumber && sampleWaybill.waybillNumber.startsWith('WB-'),
    `Waybill number generated with WB- prefix (${sampleWaybill.waybillNumber})`
  );

  assert(
    sampleWaybill.status === WAYBILL_STATUSES.ISSUED,
    'Default waybill status is ISSUED'
  );

  // Test 2: Validation
  const validationError = sampleWaybill.validateSync();
  assert(
    !validationError,
    'Valid DigitalWaybill passes Mongoose schema validation without errors'
  );

  // Test 3: Total recalculation
  sampleWaybill.recalculateTotals();
  assert(
    sampleWaybill.totalGrossWeightKg === 2650,
    `Recalculates total gross weight accurately (2,650 kg, actual: ${sampleWaybill.totalGrossWeightKg})`
  );
  assert(
    sampleWaybill.totalNetWeightKg === 2450,
    `Recalculates total net weight accurately (2,450 kg, actual: ${sampleWaybill.totalNetWeightKg})`
  );
  assert(
    sampleWaybill.totalCratesCount === 110,
    `Recalculates total crates count accurately (110 crates, actual: ${sampleWaybill.totalCratesCount})`
  );

  // Test 4: High Perishability Virtual
  assert(
    sampleWaybill.isHighlyPerishable === true,
    'Virtual isHighlyPerishable returns true for route with chilled Roma Tomatoes'
  );

  // Test 5: Cryptographic Integrity Hash & Token
  const cryptoMeta = sampleWaybill.generateIntegrityHash();
  assert(
    cryptoMeta.integrityHash && cryptoMeta.integrityHash.length === 64,
    `Generates 64-char SHA-256 integrity hash (${cryptoMeta.integrityHash.substring(0, 16)}...)`
  );
  assert(
    cryptoMeta.verificationToken && cryptoMeta.verificationToken.length === 32,
    `Generates 32-char HMAC verification token (${cryptoMeta.verificationToken.substring(0, 16)}...)`
  );
  assert(
    cryptoMeta.qrVerificationUrl.includes('/waybills/verify/'),
    `Constructs standard QR verification URL (${cryptoMeta.qrVerificationUrl})`
  );

  // Test 6: Default Current Holder Virtual
  const initialHolder = sampleWaybill.currentHolder;
  assert(
    initialHolder.name === 'Musa Danladi',
    `Initial holder before dispatch defaults to shipper (${initialHolder.name})`
  );
  assert(
    initialHolder.role === CUSTODY_ROLES.FARMER,
    'Initial holder role is FARMER'
  );

  // Test 7: Record Gate Dispatch Custody Transfer
  const dispatchTransfer = sampleWaybill.recordCustodyTransfer({
    fromParty: {
      name: 'Musa Danladi',
      role: CUSTODY_ROLES.FARMER
    },
    toParty: {
      name: 'Ibrahim Sani',
      role: CUSTODY_ROLES.PRIMARY_DRIVER
    },
    locationName: 'Makarfi Farm Gate Depot',
    coordinates: { latitude: 11.3800, longitude: 7.8700 },
    transferAction: 'GATE_DISPATCH',
    sealNumberVerified: 'SEAL-AGR-9921',
    sealIntact: true,
    recordedCargoTempC: 6.8,
    notes: 'Produce loaded onto insulated reefer truck. Temperature confirmed at 6.8°C.'
  });

  assert(
    sampleWaybill.status === WAYBILL_STATUSES.IN_TRANSIT,
    'Recording GATE_DISPATCH automatically transitions status to IN_TRANSIT'
  );
  assert(
    sampleWaybill.dispatchedAt instanceof Date,
    'dispatchedAt timestamp is recorded upon GATE_DISPATCH'
  );
  assert(
    dispatchTransfer.transferSequence === 1,
    'First custody transfer sequence is 1'
  );
  assert(
    dispatchTransfer.signatureHash.length === 24,
    `Transfer recorded with 24-character cryptographic signature hash (${dispatchTransfer.signatureHash})`
  );

  // Test 8: Current Holder Virtual after Dispatch
  const updatedHolder = sampleWaybill.currentHolder;
  assert(
    updatedHolder.name === 'Ibrahim Sani',
    `Updated current holder reflects primary driver (${updatedHolder.name})`
  );
  assert(
    updatedHolder.role === CUSTODY_ROLES.PRIMARY_DRIVER,
    'Updated holder role is PRIMARY_DRIVER'
  );

  // Test 9: Record Intermediate Cross-Dock Reload
  sampleWaybill.recordCustodyTransfer({
    fromParty: {
      name: 'Ibrahim Sani',
      role: CUSTODY_ROLES.PRIMARY_DRIVER
    },
    toParty: {
      name: 'Zaria Logistics Hub Agent',
      role: CUSTODY_ROLES.HUB_RECEIVER
    },
    locationName: 'Zaria Regional Cross-Dock Hub',
    transferAction: 'CROSS_DOCK_RELOAD',
    sealIntact: true,
    recordedCargoTempC: 7.1
  });

  assert(
    sampleWaybill.status === WAYBILL_STATUSES.TRANSFERRED_AT_HUB,
    'Recording CROSS_DOCK_RELOAD transitions status to TRANSFERRED_AT_HUB'
  );
  assert(
    sampleWaybill.custodyTransferHistory.length === 2,
    'Custody transfer history contains 2 sequential handovers'
  );

  // Test 10: Final Delivery Custody Transfer
  sampleWaybill.recordCustodyTransfer({
    fromParty: {
      name: 'Zaria Logistics Hub Agent',
      role: CUSTODY_ROLES.HUB_RECEIVER
    },
    toParty: {
      name: 'Amina Bello',
      role: CUSTODY_ROLES.BUYER
    },
    locationName: 'Kano Fresh Foods Processing Terminal',
    transferAction: 'FINAL_DELIVERY',
    sealIntact: true,
    recordedCargoTempC: 6.5,
    notes: 'Cargo inspected and accepted at dock 4.'
  });

  assert(
    sampleWaybill.status === WAYBILL_STATUSES.DELIVERED,
    'Recording FINAL_DELIVERY transitions status to DELIVERED'
  );
  assert(
    sampleWaybill.actualDeliveryDate instanceof Date,
    'actualDeliveryDate timestamp is recorded upon FINAL_DELIVERY'
  );
  assert(
    sampleWaybill.currentHolder.role === CUSTODY_ROLES.BUYER,
    'Final custody holder role is BUYER'
  );

  // Test 11: Security Seals validation
  sampleWaybill.securitySeals.push({
    sealNumber: 'SEAL-LOCK-8812',
    placementLocation: 'REAR_DOOR_CONTAINER',
    intactOnArrival: true
  });
  assert(
    sampleWaybill.securitySeals[0].sealNumber === 'SEAL-LOCK-8812',
    'Security seal attached successfully to consignment'
  );

  // Test 12: Empty consignments rejected
  const invalidWaybill = new DigitalWaybill({
    shipper: { contactPerson: 'Test', contactPhone: '123', pickupAddress: 'Depot' },
    consignee: { businessName: 'Test Buyer', contactPerson: 'Test', contactPhone: '123', deliveryAddress: 'Hub' },
    carrier: { driverName: 'Driver', driverPhone: '123', vehicleRegistrationPlate: 'KAD-111-AB' },
    expectedDeliveryDate: new Date(),
    consignments: []
  });
  const emptyError = invalidWaybill.validateSync();
  assert(
    emptyError && emptyError.errors && emptyError.errors.consignments,
    'Rejects DigitalWaybill with empty consignments array'
  );

  console.log('\n======================================================');
  console.log('   RUNNING AGRILY COMMERCIAL INVOICE UNIT TESTS      ');
  console.log('======================================================\n');

  // Test 13: Commercial Invoice instantiation
  const sampleInvoice = new CommercialInvoice({
    seller: {
      entityName: 'Makarfi Tomato Growers Cooperative',
      contactEmail: 'makarfi.coop@agrily.ng',
      contactPhone: '+2348031112233',
      address: 'Agro Extension Zone 3, Makarfi, Kaduna'
    },
    buyer: {
      entityName: 'Kano Fresh Foods Processing Ltd',
      contactEmail: 'procurement@kanofresh.com',
      contactPhone: '+2348029998877',
      billingAddress: 'Plot 44 Bompai Industrial Area, Kano'
    },
    dueDate: new Date('2024-07-25T18:00:00Z'),
    currency: SUPPORTED_CURRENCIES.NGN,
    freightHaulageFee: 45000,
    coldChainSurcharge: 15000,
    items: [
      {
        commodityName: 'Roma Tomatoes',
        quantity: 1850,
        unitOfMeasure: 'kg',
        unitPrice: 350,
        totalAmount: 647500
      },
      {
        commodityName: 'Habanero Peppers',
        quantity: 600,
        unitOfMeasure: 'kg',
        unitPrice: 500,
        totalAmount: 300000
      }
    ]
  });

  assert(
    sampleInvoice.invoiceNumber && sampleInvoice.invoiceNumber.startsWith('INV-'),
    `Invoice number generated with INV- prefix (${sampleInvoice.invoiceNumber})`
  );
  assert(
    sampleInvoice.status === INVOICE_STATUSES.ISSUED,
    'Default invoice status is ISSUED'
  );

  // Test 14: Invoice Validation
  const invValidationError = sampleInvoice.validateSync();
  assert(
    !invValidationError,
    'Valid CommercialInvoice passes schema validation without errors'
  );

  // Test 15: Recalculate Financials
  sampleInvoice.recalculateFinancials();

  // Produce Subtotal: 647,500 + 300,000 = 947,500
  assert(
    sampleInvoice.produceSubtotal === 947500,
    `Calculates produce subtotal accurately (₦947,500, actual: ₦${sampleInvoice.produceSubtotal})`
  );

  // Escrow Fee: 1.5% of 947,500 = 14,212.50
  assert(
    sampleInvoice.escrowProtectionFee === 14212.5,
    `Calculates escrow protection fee (1.5% of produce = ₦14,212.50, actual: ₦${sampleInvoice.escrowProtectionFee})`
  );

  // Platform Commission: 2.5% of 947,500 = 23,687.50
  assert(
    sampleInvoice.platformCommissionFee === 23687.5,
    `Calculates platform commission fee (2.5% of produce = ₦23,687.50, actual: ₦${sampleInvoice.platformCommissionFee})`
  );

  // Taxable Services: Freight (45,000) + Cold Chain (15,000) + Commission (23,687.50) = 83,687.50
  // VAT: 7.5% of 83,687.50 = 6,276.56
  assert(
    sampleInvoice.taxVatAmount === 6276.56,
    `Calculates statutory 7.5% VAT on freight and platform services (₦6,276.56, actual: ₦${sampleInvoice.taxVatAmount})`
  );

  // Grand Total: 947,500 (produce) + 45,000 (freight) + 15,000 (cold chain) + 14,212.50 (escrow) + 6,276.56 (VAT) = 1,027,989.06
  assert(
    sampleInvoice.totalInvoiceAmount === 1027989.06,
    `Calculates total invoice amount accurately (₦1,027,989.06, actual: ₦${sampleInvoice.totalInvoiceAmount})`
  );

  // Test 16: Virtual Net Farmer Payout
  // 947,500 - 23,687.50 = 923,812.50
  assert(
    sampleInvoice.netFarmerPayout === 923812.5,
    `Virtual netFarmerPayout deducts commission (₦923,812.50, actual: ₦${sampleInvoice.netFarmerPayout})`
  );

  // Test 17: Virtual Net Carrier Payout
  // 45,000 + 15,000 = 60,000
  assert(
    sampleInvoice.netCarrierPayout === 60000,
    `Virtual netCarrierPayout aggregates freight & cold chain (₦60,000, actual: ₦${sampleInvoice.netCarrierPayout})`
  );

  // Test 18: Invoice Checksum
  assert(
    sampleInvoice.invoiceChecksum && sampleInvoice.invoiceChecksum.length === 64,
    `Generates 64-character SHA-256 financial checksum (${sampleInvoice.invoiceChecksum.substring(0, 16)}...)`
  );

  // Test 19: Status transition to PAID_TO_ESCROW
  sampleInvoice.status = INVOICE_STATUSES.PAID_TO_ESCROW;
  sampleInvoice.paidAt = new Date();
  assert(
    sampleInvoice.status === INVOICE_STATUSES.PAID_TO_ESCROW,
    'Allows advancing invoice status to PAID_TO_ESCROW'
  );

  // Test 20: Status transition to SETTLED
  sampleInvoice.status = INVOICE_STATUSES.SETTLED;
  sampleInvoice.settledAt = new Date();
  assert(
    sampleInvoice.status === INVOICE_STATUSES.SETTLED,
    'Allows advancing invoice status to SETTLED upon delivery verification'
  );

  console.log('\n------------------------------------------------------');
  console.log(` RESULTS: ${passedTests} passed, ${failedTests} failed`);
  console.log('------------------------------------------------------\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runWaybillModelTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
