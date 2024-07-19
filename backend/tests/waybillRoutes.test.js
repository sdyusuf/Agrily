/**
 * ==============================================================================
 * 🌾 AGRILY AGRO-LOGISTICS PLATFORM: DIGITAL WAYBILL REST CONTROLLER TESTS
 * ==============================================================================
 *
 * @description
 * Unit and integration tests for Digital Waybill REST endpoints, Joi payload
 * validation, cryptographic QR verification, custody handovers, and invoice generation.
 * ==============================================================================
 */

const request = require('supertest');
const express = require('express');
const waybillRouter = require('../routes/waybillRoutes');
const { DigitalWaybill, WAYBILL_STATUSES, CUSTODY_ROLES, TEMPERATURE_CLASSES } = require('../models/DigitalWaybill');
const { CommercialInvoice } = require('../models/CommercialInvoice');
const { generateVerificationToken } = require('../services/qrVerificationService');

// Construct mock Express application for router testing
const app = express();
app.use(express.json());
app.use('/api/waybills', waybillRouter);

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

async function runWaybillRouteTests() {
  console.log('\n======================================================');
  console.log('   RUNNING AGRILY DIGITAL WAYBILL REST ROUTE TESTS    ');
  console.log('======================================================\n');

  // Test 1: POST /api/waybills rejects empty payload with HTTP 400
  const emptyRes = await request(app).post('/api/waybills').send({});
  assert(emptyRes.status === 400, 'POST /api/waybills rejects empty payload with HTTP 400');
  assert(emptyRes.body.success === false, 'Returns success: false on validation error');
  assert(Array.isArray(emptyRes.body.details), 'Returns validation details array');

  // Test 2: POST /api/waybills rejects payload missing required consignments
  const missingConsignmentsRes = await request(app).post('/api/waybills').send({
    expectedDeliveryDate: new Date('2024-07-25T18:00:00Z'),
    shipper: {
      contactPerson: 'Musa Danladi',
      contactPhone: '+2348031112233',
      pickupAddress: 'Farm Gate Km 14'
    },
    consignee: {
      businessName: 'Kano Foods Ltd',
      contactPerson: 'Amina Bello',
      contactPhone: '+2348029998877',
      deliveryAddress: 'Plot 44 Bompai'
    },
    carrier: {
      driverName: 'Ibrahim Sani',
      driverPhone: '+2348054443322',
      vehicleRegistrationPlate: 'KAD-882-TR'
    },
    originDepot: { name: 'Zaria Hub', latitude: 11.0855, longitude: 7.7199 },
    destinationHub: { name: 'Kano Terminal', latitude: 12.0022, longitude: 8.5920 },
    consignments: []
  });
  assert(missingConsignmentsRes.status === 400, 'Rejects payload with empty consignments array');

  // Create an in-memory waybill document to test retrieval, verification, and transfers
  const testWaybill = new DigitalWaybill({
    waybillNumber: 'WB-20240716-TEST01',
    status: WAYBILL_STATUSES.ISSUED,
    expectedDeliveryDate: new Date('2024-07-25T18:00:00Z'),
    shipper: {
      contactPerson: 'Musa Danladi',
      contactPhone: '+2348031112233',
      pickupAddress: 'Farm Gate Km 14, Makarfi Road',
      state: 'Kaduna',
      cooperativeName: 'Makarfi Agro Coop'
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
      driverLicenseNumber: 'DL-KAN-889124',
      vehicleRegistrationPlate: 'KAD-882-TR',
      vehicleType: '3.5T Insulated Truck',
      refrigerationUnitOperational: true
    },
    originDepot: {
      name: 'Zaria Agro Logistics Hub',
      latitude: 11.0855,
      longitude: 7.7199
    },
    destinationHub: {
      name: 'Kano Distribution Terminal',
      latitude: 12.0022,
      longitude: 8.5920
    },
    estimatedDistanceKm: 128.5,
    estimatedTransitTimeHours: 3.2,
    securitySeals: [{
      sealNumber: 'SEAL-AGR-4412',
      placementLocation: 'REAR_DOOR_CONTAINER',
      appliedAt: new Date(),
      intactOnArrival: true
    }],
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
        targetMinTempC: 4.0,
        targetMaxTempC: 10.0,
        perishabilityPriority: 'HIGH'
      }
    ]
  });

  testWaybill.recalculateTotals();
  testWaybill.generateIntegrityHash();

  // Mock Mongoose model queries
  DigitalWaybill.find = function(query) {
    return {
      sort: () => ({
        skip: () => ({
          limit: () => ({
            lean: async () => [testWaybill.toObject({ virtuals: true })]
          })
        })
      })
    };
  };

  DigitalWaybill.countDocuments = async function() {
    return 1;
  };

  DigitalWaybill.findById = async function(id) {
    if (id === testWaybill._id.toString() || id === 'mock-valid-id') {
      return testWaybill;
    }
    return null;
  };

  DigitalWaybill.findOne = async function(query) {
    if (query.waybillNumber === 'WB-20240716-TEST01') {
      return testWaybill;
    }
    return null;
  };

  // Mock save
  testWaybill.save = async function() {
    return testWaybill;
  };

  // Test 3: GET /api/waybills returns list with pagination
  const listRes = await request(app).get('/api/waybills');
  assert(listRes.status === 200, 'GET /api/waybills returns HTTP 200');
  assert(listRes.body.success === true, 'Returns success: true for waybill query');
  assert(listRes.body.count === 1, 'Returns correct returned count');
  assert(listRes.body.totalCount === 1, 'Returns correct totalCount');
  assert(listRes.body.data[0].waybillNumber === 'WB-20240716-TEST01', 'Returns matching waybill in dataset');

  // Test 4: GET /api/waybills/:id returns details by waybillNumber
  const getByIdRes = await request(app).get('/api/waybills/WB-20240716-TEST01');
  assert(getByIdRes.status === 200, 'GET /api/waybills/:id returns HTTP 200 for valid WB code');
  assert(getByIdRes.body.data.waybillNumber === 'WB-20240716-TEST01', 'Returns matching waybillNumber');
  assert(getByIdRes.body.coldChainAudit && getByIdRes.body.coldChainAudit.compliant === true, 'Includes coldChainAudit object');

  // Test 5: GET /api/waybills/:id returns 404 for non-existent waybill
  const notFoundRes = await request(app).get('/api/waybills/WB-NON-EXISTENT-99');
  assert(notFoundRes.status === 404, 'GET /api/waybills/:id returns HTTP 404 for missing code');

  // Test 6: GET /api/waybills/:id/verify with valid token
  const validToken = generateVerificationToken(testWaybill.waybillNumber, testWaybill.integrityHash);
  const verifyValidRes = await request(app).get(`/api/waybills/WB-20240716-TEST01/verify?token=${validToken}`);
  assert(verifyValidRes.status === 200, 'GET /api/waybills/:id/verify returns HTTP 200');
  assert(verifyValidRes.body.verified === true, 'Returns verified: true for cryptographic token match');
  assert(verifyValidRes.body.totalNetWeightKg === 1850, 'Returns verified total net weight (1850 kg)');
  assert(verifyValidRes.body.message.includes('Waybill authenticity verified'), 'Includes tamper-proof verification confirmation');

  // Test 7: GET /api/waybills/:id/verify with fraudulent token
  const verifyTamperedRes = await request(app).get('/api/waybills/WB-20240716-TEST01/verify?token=fraudulent-bogus-token-123456');
  assert(verifyTamperedRes.status === 200, 'Returns HTTP 200 with tamper flag on invalid token');
  assert(verifyTamperedRes.body.verified === false, 'Returns verified: false for bogus token');
  assert(verifyTamperedRes.body.message.includes('Warning: Verification token missing or invalid'), 'Emits tamper warning');

  // Test 8: POST /api/waybills/:id/custody-transfer records hand-off
  const transferRes = await request(app)
    .post('/api/waybills/WB-20240716-TEST01/custody-transfer')
    .send({
      fromParty: {
        name: 'Musa Danladi',
        role: CUSTODY_ROLES.FARMER
      },
      toParty: {
        name: 'Ibrahim Sani',
        role: CUSTODY_ROLES.PRIMARY_DRIVER,
        contactPhone: '+2348054443322'
      },
      locationName: 'Makarfi Agro Collection Hub',
      transferAction: 'GATE_DISPATCH',
      sealNumberVerified: 'SEAL-AGR-4412',
      sealIntact: true,
      recordedCargoTempC: 6.2,
      notes: 'Consignment inspected, weighed, and sealed into refrigerated trailer.'
    });

  assert(transferRes.status === 200, 'POST /api/waybills/:id/custody-transfer returns HTTP 200');
  assert(transferRes.body.success === true, 'Returns success: true on custody handover');
  assert(transferRes.body.status === WAYBILL_STATUSES.IN_TRANSIT, 'Transitions waybill status to IN_TRANSIT');
  assert(transferRes.body.transferRecord.transferSequence === 1, 'Records transfer sequence #1');
  assert(transferRes.body.currentHolder.name === 'Ibrahim Sani', 'Current holder virtual reflects driver');

  // Test 9: GET /api/waybills/:id/invoice generates commercial invoice
  CommercialInvoice.prototype.save = async function() { return this; };
  const invoiceRes = await request(app).get('/api/waybills/WB-20240716-TEST01/invoice');
  assert(invoiceRes.status === 200, 'GET /api/waybills/:id/invoice returns HTTP 200');
  assert(invoiceRes.body.success === true, 'Returns success: true for invoice');
  assert(invoiceRes.body.data.produceSubtotal > 0, 'Includes positive produceSubtotal');
  assert(invoiceRes.body.data.totalInvoiceAmount > 0, 'Includes positive totalInvoiceAmount');
  assert(invoiceRes.body.data.taxVatAmount > 0, 'Includes statutory VAT calculation');

  // Test 10: PATCH /api/waybills/:id/status updates status
  const statusRes = await request(app)
    .patch('/api/waybills/WB-20240716-TEST01/status')
    .send({ status: WAYBILL_STATUSES.DELIVERED, notes: 'Delivered to buyer dock' });
  assert(statusRes.status === 200, 'PATCH /api/waybills/:id/status returns HTTP 200');
  assert(statusRes.body.data.status === WAYBILL_STATUSES.DELIVERED, 'Status updated to DELIVERED');

  // Test 11: GET /api/waybills/:id/print returns HTML printout
  const printRes = await request(app).get('/api/waybills/WB-20240716-TEST01/print');
  assert(printRes.status === 200, 'GET /api/waybills/:id/print returns HTTP 200');
  assert(printRes.text.includes('AGRILY LOGISTICS & WAYBILL'), 'Printout contains Agrily header');
  assert(printRes.text.includes('WB-20240716-TEST01'), 'Printout includes waybill number');
  assert(printRes.text.includes('<svg'), 'Printout embeds verification QR SVG');

  console.log('\n------------------------------------------------------');
  console.log(` RESULTS: ${passedTests} passed, ${failedTests} failed`);
  console.log('------------------------------------------------------\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runWaybillRouteTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
