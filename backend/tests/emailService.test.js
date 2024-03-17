/**
 * ==============================================================================
 * AGRILY BACKEND TEST SUITE - AUTOMATED EMAIL SERVICE UNIT TESTS
 * ==============================================================================
 * 
 * Test Suite Description:
 * Verifies email template generation, recipient formatting, HTML content composition,
 * and dispatch mechanics for agricultural order notifications.
 * 
 * @module tests/emailService.test
 * @requires assert
 * @requires ../utils/emailService
 */

const assert = require('assert');
const {
  createEmailTransporter,
  buildOrderEmailContent,
  sendNewOrderAlertToFarmer,
  sendOrderDispatchedAlertToBuyer
} = require('../utils/emailService');

/**
 * Main execution harness for Email Service unit tests.
 * 
 * @async
 * @function runTests
 * @returns {Promise<void>}
 */
async function runTests() {
  console.log('🧪 Starting Automated Email Service Unit Tests...\n');
  let passed = 0;
  let total = 0;

  /**
   * Helper function to execute an assertion block and track success/failure tallies.
   * 
   * @param {string} description - Readable summary of test intent.
   * @param {Function} fn - Assertion function to execute.
   */
  async function it(description, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✓ ${description}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${description}`);
      console.error(`    Error: ${err.message}`);
      throw err;
    }
  }

  const sampleOrder = {
    orderNumber: 'AGR-20240317-TEST',
    buyerName: 'Crown Flour Mills Ltd',
    buyerEmail: 'procure@crownflour.ng',
    totalAmount: 185000,
    items: [
      {
        name: 'Hard Red Wheat',
        quantity: 10,
        unit: 'bag',
        price: 18500
      }
    ],
    deliveryAddress: {
      street: 'Wholesale Grain Silo 4',
      city: 'Kano',
      state: 'Kano State'
    }
  };

  // --------------------------------------------------------------------------
  // TEST CASE 1: Farmer New Order Alert Template Generation
  // --------------------------------------------------------------------------
  await it('buildOrderEmailContent should generate complete NEW_ORDER_FARMER template', () => {
    const email = buildOrderEmailContent('NEW_ORDER_FARMER', sampleOrder);

    assert.ok(email.subject.includes('AGR-20240317-TEST'), 'Subject must include order reference');
    assert.ok(email.text.includes('Hard Red Wheat'), 'Text body must list produce items');
    assert.ok(email.text.includes('Crown Flour Mills Ltd'), 'Text body must mention buyer name');
    assert.ok(email.text.includes('Kano, Kano State'), 'Text body must list delivery territory');
    assert.ok(email.html.includes('AGR-20240317-TEST'), 'HTML body must contain order reference');
  });

  // --------------------------------------------------------------------------
  // TEST CASE 2: Buyer In-Transit Alert Template Generation
  // --------------------------------------------------------------------------
  await it('buildOrderEmailContent should generate ORDER_IN_TRANSIT alert template with escrow details', () => {
    const email = buildOrderEmailContent('ORDER_IN_TRANSIT', sampleOrder);

    assert.ok(email.subject.includes('Dispatched') || email.subject.includes('In Transit'));
    assert.ok(email.text.includes('Agrily Escrow'), 'Text body must mention escrow terms');
    assert.ok(email.html.includes('2 - 4 Business Days'), 'HTML body must state delivery window');
  });

  // --------------------------------------------------------------------------
  // TEST CASE 3: Buyer Delivery Completion Template Generation
  // --------------------------------------------------------------------------
  await it('buildOrderEmailContent should generate ORDER_DELIVERED completion template', () => {
    const email = buildOrderEmailContent('ORDER_DELIVERED', sampleOrder);

    assert.ok(email.subject.includes('Delivered') || email.subject.includes('Completed'));
    assert.ok(email.html.toLowerCase().includes('released to the producer'), 'HTML body must confirm escrow release');
  });

  // --------------------------------------------------------------------------
  // TEST CASE 4: Mock Transporter Dispatch Execution
  // --------------------------------------------------------------------------
  await it('sendNewOrderAlertToFarmer should successfully dispatch email via transporter', async () => {
    let capturedOptions = null;
    const mockTransporter = {
      sendMail: async (options) => {
        capturedOptions = options;
        return { response: '250 Sent Successfully' };
      }
    };

    const res = await sendNewOrderAlertToFarmer('farmer@agrily.com', sampleOrder, mockTransporter);
    assert.ok(res);
    assert.strictEqual(capturedOptions.to, 'farmer@agrily.com');
    assert.ok(capturedOptions.subject.includes('AGR-20240317-TEST'));
  });

  // --------------------------------------------------------------------------
  // TEST CASE 5: Buyer Dispatch Notification Trigger
  // --------------------------------------------------------------------------
  await it('sendOrderDispatchedAlertToBuyer should dispatch waybill details to buyer email', async () => {
    let capturedOptions = null;
    const mockTransporter = {
      sendMail: async (options) => {
        capturedOptions = options;
        return { response: '250 Waybill Alert Sent' };
      }
    };

    const res = await sendOrderDispatchedAlertToBuyer('buyer@grainco.ng', sampleOrder, mockTransporter);
    assert.ok(res);
    assert.strictEqual(capturedOptions.to, 'buyer@grainco.ng');
    assert.ok(capturedOptions.subject.includes('AGR-20240317-TEST'));
  });

  // --------------------------------------------------------------------------
  // TEST CASE 6: Missing Recipient Graceful Handling
  // --------------------------------------------------------------------------
  await it('sendNewOrderAlertToFarmer should return null safely without throwing when email is empty', async () => {
    const res = await sendNewOrderAlertToFarmer('', sampleOrder);
    assert.strictEqual(res, null);
  });

  console.log(`\n🎉 All ${passed}/${total} Email Service Unit Tests Passed Successfully!\n`);
}

// Execute tests if invoked directly
if (require.main === module) {
  runTests().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}

module.exports = runTests;
