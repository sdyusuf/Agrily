/**
 * ==============================================================================
 * 🌾 AGRILY AGRO-LOGISTICS PLATFORM: DIGITAL WAYBILL E2E INTEGRATION TESTS
 * ==============================================================================
 *
 * @description
 * End-to-end integration test verifying the complete multi-party lifecycle
 * of agricultural digital waybills, automated commercial invoicing, cryptographic
 * SHA-256 seal integrity, and chain-of-custody transfer handovers.
 * ==============================================================================
 */

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
const {
  createWaybillFromRoute,
  generateCommercialInvoiceForWaybill,
  advanceWaybillCustody,
  generateWaybillHtmlPrintout,
  calculateFreightTariff
} = require('../services/waybillGenerator');
const {
  generateVerificationToken,
  verifyWaybillToken,
  assessColdChainCompliance
} = require('../services/qrVerificationService');

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

async function runWaybillIntegrationTestSuite() {
  console.log('\n======================================================');
  console.log('   RUNNING AGRILY WAYBILL E2E INTEGRATION TEST SUITE  ');
  console.log('======================================================\n');

  // Stage 1: Dispatched Route & Produce Aggregation
  const mockDispatchedRoute = {
    _id: '6695321045aa1209841288ef',
    routeCode: 'AGR-20240716-KAD01',
    status: 'DISPATCHED',
    originDepot: {
      name: 'Zaria Agro Logistics Hub',
      latitude: 11.0855,
      longitude: 7.7199
    },
    destinationTerminal: {
      name: 'Kano Food Processing Terminal',
      latitude: 12.0022,
      longitude: 8.5920
    },
    assignedDriver: {
      driverId: 'drv-7712',
      name: 'Ibrahim Sani',
      phone: '+2348054443322'
    },
    assignedVehicle: {
      plateNumber: 'KAD-882-TR',
      type: '3.5T Insulated Truck',
      refrigerationEquipped: true
    },
    metrics: {
      totalDistanceKm: 135.0,
      estimatedDurationMinutes: 210
    },
    stops: [
      {
        stopSequence: 1,
        locationName: 'Makarfi Farm Gate Depot',
        farmerName: 'Musa Danladi',
        contactPhone: '+2348031112233',
        produceCategory: 'Roma Tomatoes',
        cargoWeightKg: 2200,
        cratesCount: 88,
        perishabilityPriority: 'HIGH'
      },
      {
        stopSequence: 2,
        locationName: 'Kududan Cooperative Center',
        farmerName: 'Aliyu Bello',
        contactPhone: '+2348035559900',
        produceCategory: 'Habanero Chili Peppers',
        cargoWeightKg: 800,
        cratesCount: 40,
        perishabilityPriority: 'MEDIUM'
      }
    ]
  };

  // Step 1: Generate Digital Waybill from Route
  const waybill = await createWaybillFromRoute(mockDispatchedRoute);
  assert(waybill.waybillNumber.startsWith('WB-'), `Waybill created with standard code: ${waybill.waybillNumber}`);
  assert(waybill.status === WAYBILL_STATUSES.ISSUED, 'Initial status is ISSUED');
  assert(waybill.consignments.length === 2, 'Maps 2 farm stops into 2 consignment items');

  // Step 2: Validate Aggregate Weights & Volumes
  assert(waybill.totalNetWeightKg === 3000, `Reconciles total cargo net weight (3,000 kg, actual: ${waybill.totalNetWeightKg})`);
  assert(waybill.totalCratesCount === 128, `Reconciles total crates volume (128 crates, actual: ${waybill.totalCratesCount})`);
  assert(waybill.isHighlyPerishable === true, 'Flags waybill as highly perishable due to chilled Roma Tomatoes');

  // Step 3: Cryptographic Integrity Seal Verification
  const originalHash = waybill.integrityHash;
  assert(originalHash && originalHash.length === 64, `SHA-256 seal computed (${originalHash.substring(0, 16)}...)`);
  const token = generateVerificationToken(waybill.waybillNumber, originalHash);
  assert(verifyWaybillToken(waybill.waybillNumber, originalHash, token) === true, 'Cryptographic token validates successfully');

  // Step 4: Anti-Tamper Detection Simulation
  const fakeTamperedHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  assert(
    verifyWaybillToken(waybill.waybillNumber, fakeTamperedHash, token) === false,
    'Rejects validation and flags tamper when payload hash does not match'
  );

  // Step 5: Custody Transfer #1 - Farm Gate Dispatch
  const transfer1 = advanceWaybillCustody(waybill, {
    fromParty: { name: 'Musa Danladi', role: CUSTODY_ROLES.FARMER },
    toParty: { name: 'Ibrahim Sani', role: CUSTODY_ROLES.PRIMARY_DRIVER },
    locationName: 'Makarfi Farm Gate Depot',
    transferAction: 'GATE_DISPATCH',
    recordedCargoTempC: 6.0,
    sealNumberVerified: waybill.securitySeals[0].sealNumber
  });
  assert(waybill.status === WAYBILL_STATUSES.IN_TRANSIT, 'Advances status to IN_TRANSIT upon Gate Dispatch');
  assert(waybill.currentHolder.name === 'Ibrahim Sani', 'Current custody holder is primary driver');

  // Step 6: Custody Transfer #2 - Regional Cross-Dock Hub Handover
  const transfer2 = advanceWaybillCustody(waybill, {
    fromParty: { name: 'Ibrahim Sani', role: CUSTODY_ROLES.PRIMARY_DRIVER },
    toParty: { name: 'Kano Cross-Dock Yard Master', role: CUSTODY_ROLES.HUB_RECEIVER },
    locationName: 'Kano Southern Ring Cross-Dock',
    transferAction: 'CROSS_DOCK_RELOAD',
    recordedCargoTempC: 6.8,
    sealNumberVerified: waybill.securitySeals[0].sealNumber
  });
  assert(waybill.status === WAYBILL_STATUSES.TRANSFERRED_AT_HUB, 'Advances status to TRANSFERRED_AT_HUB at cross-dock');
  assert(waybill.custodyTransferHistory.length === 2, 'Audit trail records 2 handovers');

  // Step 7: Custody Transfer #3 - Terminal Consignee Delivery
  const transfer3 = advanceWaybillCustody(waybill, {
    fromParty: { name: 'Kano Cross-Dock Yard Master', role: CUSTODY_ROLES.HUB_RECEIVER },
    toParty: { name: 'Amina Bello (Kano Fresh Foods)', role: CUSTODY_ROLES.BUYER },
    locationName: 'Kano Food Processing Terminal Dock 4',
    transferAction: 'FINAL_DELIVERY',
    recordedCargoTempC: 6.2,
    sealNumberVerified: waybill.securitySeals[0].sealNumber
  });
  assert(waybill.status === WAYBILL_STATUSES.DELIVERED, 'Advances status to DELIVERED at consignee dock');
  assert(waybill.actualDeliveryDate instanceof Date, 'Records actual delivery timestamp');

  // Step 8: Cold-Chain Audit Compliance Assessment
  const compliance = assessColdChainCompliance(waybill);
  assert(compliance.compliant === true, 'Cold-chain audit passes without temperature threshold breaches');
  assert(compliance.maximumRecordedTempC === 6.8, 'Records max temperature of 6.8°C (within 10.0°C limit)');

  // Step 9: Automated Commercial Invoice Generation
  const invoice = generateCommercialInvoiceForWaybill(waybill);
  assert(invoice.invoiceNumber.startsWith('INV-'), `Invoice generated with INV- code: ${invoice.invoiceNumber}`);
  assert(invoice.items.length === 2, 'Contains 2 itemized produce lines');
  assert(invoice.produceSubtotal > 0, `Computes produce subtotal (₦${invoice.produceSubtotal.toLocaleString()})`);
  assert(invoice.freightHaulageFee > 0, `Computes freight haulage tariff (₦${invoice.freightHaulageFee.toLocaleString()})`);
  assert(invoice.coldChainSurcharge > 0, `Includes cold-chain reefer surcharge (₦${invoice.coldChainSurcharge.toLocaleString()})`);
  assert(invoice.taxVatAmount > 0, `Computes statutory VAT on haulage services (₦${invoice.taxVatAmount.toLocaleString()})`);
  assert(invoice.totalInvoiceAmount > invoice.produceSubtotal, 'Total invoice includes logistics tariffs & statutory taxes');

  // Step 10: Official Printout HTML Compilation
  const printHtml = generateWaybillHtmlPrintout(waybill);
  assert(printHtml.includes('<!DOCTYPE html>'), 'Compiles valid standalone HTML document');
  assert(printHtml.includes(waybill.waybillNumber), 'Embeds unique waybill identifier');
  assert(printHtml.includes('Roma Tomatoes'), 'Itemizes produce consignment lines');
  assert(printHtml.includes('<svg'), 'Embeds tamper-verification SVG QR code');

  console.log('\n------------------------------------------------------');
  console.log(` RESULTS: ${passedTests} passed, ${failedTests} failed`);
  console.log('------------------------------------------------------\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runWaybillIntegrationTestSuite().catch(err => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
