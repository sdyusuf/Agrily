/**
 * ==============================================================================
 * AGRILY BACKEND TEST SUITE - ORDER ROUTER & CONTROLLER UNIT TESTS
 * ==============================================================================
 * 
 * Test Suite Description:
 * This unit test suite thoroughly verifies the business logic, input sanitization,
 * payload validation rules, error taxonomy, and router configurations for the
 * Agrily Agricultural Order Management subsystem.
 * 
 * Verifications Executed:
 *  1. Verification that valid order submissions pass payload structural validation.
 *  2. Verification that missing or malformed buyer email triggers validation errors.
 *  3. Verification that empty items arrays are rejected before hitting database.
 *  4. Verification that zero or negative item quantities and prices are blocked.
 *  5. Verification that incomplete delivery addresses (missing street/city/state) fail.
 *  6. Verification that createOrderController gracefully returns HTTP 400 on bad input.
 *  7. Verification that getBuyerOrdersController rejects requests lacking a buyer email.
 *  8. Verification of express router setup and route stack registration.
 * 
 * @module tests/orderRoutes.test
 * @requires assert
 * @requires express
 * @requires ../routes/orders
 */

const assert = require('assert');
const orderRoutes = require('../routes/orders');
const {
  validateOrderPayload,
  createOrderController,
  getBuyerOrdersController
} = orderRoutes;

/**
 * Main execution harness for Order Routes and Controller unit tests.
 * 
 * @async
 * @function runTests
 * @returns {Promise<void>}
 */
async function runTests() {
  console.log('🧪 Starting Order Router & Controller Unit Tests...\n');
  let passed = 0;
  let total = 0;

  /**
   * Helper function to execute an assertion block and track success/failure tallies.
   * 
   * @param {string} description - Readable summary of test intent.
   * @param {Function} fn - Assertion function to execute.
   */
  function it(description, fn) {
    total++;
    try {
      fn();
      console.log(`  ✓ ${description}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${description}`);
      console.error(`    Error: ${err.message}`);
      throw err;
    }
  }

  // --------------------------------------------------------------------------
  // TEST CASE 1: Valid Order Payload Structural Verification
  // --------------------------------------------------------------------------
  it('should successfully validate a well-formed procurement order payload', () => {
    const validPayload = {
      buyerEmail: 'procurement@nestle.ng',
      buyerName: 'Nestle Agricultural Supply Division',
      buyerPhone: '+234 802 334 5566',
      items: [
        {
          name: 'Premium Sorghum Grains',
          unit: 'bag',
          quantity: 20,
          price: 18000,
          ownerEmail: 'farmer.kaduna@agrily.com',
          imageURL: 'https://cdn.agrily.com/sorghum.jpg'
        },
        {
          name: 'Cassava Starch Pellets',
          unit: 'ton',
          quantity: 2,
          price: 140000,
          ownerEmail: 'starch.mill@agrily.com'
        }
      ],
      deliveryAddress: {
        street: 'Agbara Industrial Estate, Km 32 Badagry Expressway',
        city: 'Agbara',
        state: 'Ogun State',
        postalCode: '110001',
        country: 'Nigeria',
        specialInstructions: 'Direct trailer to Silo unloading terminal 4'
      }
    };

    const result = validateOrderPayload(validPayload);
    assert.strictEqual(result.isValid, true, 'Valid payload must return isValid: true');
    assert.strictEqual(result.errors.length, 0, 'Valid payload must have zero validation errors');
  });

  // --------------------------------------------------------------------------
  // TEST CASE 2: Null or Non-Object Payload Rejection
  // --------------------------------------------------------------------------
  it('should reject non-object or null request bodies', () => {
    const nullResult = validateOrderPayload(null);
    assert.strictEqual(nullResult.isValid, false);
    assert.ok(nullResult.errors[0].includes('valid JSON object'));

    const stringResult = validateOrderPayload('some random text');
    assert.strictEqual(stringResult.isValid, false);
  });

  // --------------------------------------------------------------------------
  // TEST CASE 3: Buyer Email Format Enforcement
  // --------------------------------------------------------------------------
  it('should flag missing or malformed buyer email addresses', () => {
    // Missing email
    const missingEmailResult = validateOrderPayload({
      items: [{ name: 'Rice', quantity: 1, price: 1000, ownerEmail: 'f@f.com' }],
      deliveryAddress: { street: 'Main St', city: 'Abuja', state: 'FCT' }
    });
    assert.strictEqual(missingEmailResult.isValid, false);
    assert.ok(missingEmailResult.errors.some(e => e.includes('Buyer email address is mandatory')));

    // Malformed email
    const malformedResult = validateOrderPayload({
      buyerEmail: 'not-an-email-at-all',
      items: [{ name: 'Rice', quantity: 1, price: 1000, ownerEmail: 'f@f.com' }],
      deliveryAddress: { street: 'Main St', city: 'Abuja', state: 'FCT' }
    });
    assert.strictEqual(malformedResult.isValid, false);
    assert.ok(malformedResult.errors.some(e => e.includes('valid buyer email address format')));
  });

  // --------------------------------------------------------------------------
  // TEST CASE 4: Line Items Completeness & Quality Constraints
  // --------------------------------------------------------------------------
  it('should enforce item names, positive quantities, prices, and owner emails', () => {
    const defectivePayload = {
      buyerEmail: 'buyer@valid.com',
      items: [
        {
          name: '', // Empty name
          quantity: 0, // Zero quantity
          price: -500, // Negative price
          ownerEmail: '' // Missing farmer email
        }
      ],
      deliveryAddress: {
        street: 'Valid Street',
        city: 'Valid City',
        state: 'Valid State'
      }
    };

    const result = validateOrderPayload(defectivePayload);
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some(e => e.includes('Produce name is required')));
    assert.ok(result.errors.some(e => e.includes('Quantity must be at least 1 unit')));
    assert.ok(result.errors.some(e => e.includes('Unit price cannot be negative')));
    assert.ok(result.errors.some(e => e.includes('Producing farmer email is required')));
  });

  // --------------------------------------------------------------------------
  // TEST CASE 5: Delivery Destination Completeness
  // --------------------------------------------------------------------------
  it('should reject payloads with incomplete or omitted delivery addresses', () => {
    const missingAddress = {
      buyerEmail: 'buyer@valid.com',
      items: [{ name: 'Millet', quantity: 5, price: 12000, ownerEmail: 'farm@ng.com' }]
    };

    const res1 = validateOrderPayload(missingAddress);
    assert.strictEqual(res1.isValid, false);
    assert.ok(res1.errors.some(e => e.includes('Delivery destination address is required')));

    const incompleteAddress = {
      buyerEmail: 'buyer@valid.com',
      items: [{ name: 'Millet', quantity: 5, price: 12000, ownerEmail: 'farm@ng.com' }],
      deliveryAddress: {
        street: 'Warehouse 5'
        // Missing city & state
      }
    };

    const res2 = validateOrderPayload(incompleteAddress);
    assert.strictEqual(res2.isValid, false);
    assert.ok(res2.errors.some(e => e.includes('destination city')));
    assert.ok(res2.errors.some(e => e.includes('destination state')));
  });

  // --------------------------------------------------------------------------
  // TEST CASE 6: Controller HTTP 400 on Malformed Submission
  // --------------------------------------------------------------------------
  it('createOrderController should respond with HTTP 400 and validation error array', async () => {
    const mockReq = {
      body: {
        buyerEmail: 'invalid-email',
        items: []
      }
    };

    let statusCode = null;
    let responseBody = null;

    const mockRes = {
      status: function (code) {
        statusCode = code;
        return this;
      },
      json: function (data) {
        responseBody = data;
        return this;
      }
    };

    await createOrderController(mockReq, mockRes);
    assert.strictEqual(statusCode, 400, 'Controller must respond with HTTP 400 Bad Request');
    assert.strictEqual(responseBody.success, false);
    assert.ok(Array.isArray(responseBody.errors), 'Response must include list of validation errors');
    assert.ok(responseBody.errors.length > 0);
  });

  // --------------------------------------------------------------------------
  // TEST CASE 7: Buyer Order History Email Query Guard
  // --------------------------------------------------------------------------
  it('getBuyerOrdersController should respond with HTTP 400 if buyer email is missing', async () => {
    const mockReq = {
      params: {},
      query: {},
      headers: {}
    };

    let statusCode = null;
    let responseBody = null;

    const mockRes = {
      status: function (code) {
        statusCode = code;
        return this;
      },
      json: function (data) {
        responseBody = data;
        return this;
      }
    };

    await getBuyerOrdersController(mockReq, mockRes);
    assert.strictEqual(statusCode, 400, 'Controller must require buyer email');
    assert.strictEqual(responseBody.success, false);
    assert.ok(responseBody.message.includes('Buyer email parameter is required'));
  });

  // --------------------------------------------------------------------------
  // TEST CASE 8: Router Route Stack Registration
  // --------------------------------------------------------------------------
  it('should properly configure Express router with expected routes', () => {
    assert.ok(orderRoutes && orderRoutes.stack, 'Exported module should be an Express Router instance');

    const registeredPaths = orderRoutes.stack
      .filter(layer => layer.route)
      .map(layer => ({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods)
      }));

    assert.ok(
      registeredPaths.some(r => r.path === '/orders' && r.methods.includes('post')),
      'POST /orders must be registered on router'
    );
    assert.ok(
      registeredPaths.some(r => r.path === '/orders/buyer' && r.methods.includes('get')),
      'GET /orders/buyer must be registered on router'
    );
    assert.ok(
      registeredPaths.some(r => r.path === '/orders/:id' && r.methods.includes('get')),
      'GET /orders/:id must be registered on router'
    );
  });

  console.log(`\n🎉 All ${passed}/${total} Order Router Unit Tests Passed Successfully!\n`);
}

// Execute tests if invoked directly
if (require.main === module) {
  runTests().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}

module.exports = runTests;
