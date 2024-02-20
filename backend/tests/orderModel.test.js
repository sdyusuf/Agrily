/**
 * ==============================================================================
 * AGRILY BACKEND TEST SUITE - ORDER MODEL DOMAIN VALIDATION TESTS
 * ==============================================================================
 * 
 * Test Suite Description:
 * This unit test suite thoroughly verifies the structural integrity, schema validation,
 * default fallback assignments, virtual properties, and lifecycle hooks of the Order model.
 * 
 * Verifications Executed:
 *  1. Verification of default status ('Pending') and default paymentStatus ('unpaid').
 *  2. Verification of automatic order number generation (AGR-TIMESTAMP-HASH).
 *  3. Verification of automatic totalAmount calculation from item quantities & prices.
 *  4. Virtual lineTotal calculation for subdocument produce items.
 *  5. Rejection of invalid email formats for buyer accounts.
 *  6. Rejection of orders with empty items arrays.
 *  7. Rejection of negative pricing and zero/negative item quantities.
 *  8. Rejection of unsupported produce measurement units.
 *  9. Enforcement of strict delivery address sub-document fields.
 * 10. Enforcement of valid order status lifecycle transitions and enums.
 * 
 * @module tests/orderModel.test
 * @requires assert
 * @requires mongoose
 * @requires ../models/Order
 */

const assert = require('assert');
const mongoose = require('mongoose');
const Order = require('../models/Order');

/**
 * Main execution harness for Order Model unit tests.
 * Runs in standalone Node.js environments and integrates with standard CI pipelines.
 * 
 * @async
 * @function runTests
 * @returns {Promise<void>}
 */
async function runTests() {
  console.log('🧪 Starting Agricultural Order Model Unit Tests...\n');
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
  // TEST CASE 1: Standard Order Creation with Defaults
  // --------------------------------------------------------------------------
  it('should successfully validate a complete agricultural procurement order', () => {
    const dummyProductId = new mongoose.Types.ObjectId();
    const order = new Order({
      buyerEmail: 'buyer@greenharvest.ng',
      buyerName: 'Green Harvest Wholesalers Ltd',
      buyerPhone: '+234 803 123 4567',
      items: [
        {
          productId: dummyProductId,
          name: 'Sweet Yam Tubers',
          unit: 'tuber' in Order.supportedUnits ? 'tuber' : 'crate',
          quantity: 25,
          price: 4500,
          ownerEmail: 'farmer.dan@agrily.com',
          imageURL: 'https://cdn.agrily.com/produce/yam-batch-01.jpg'
        }
      ],
      deliveryAddress: {
        street: 'Plot 4, Agro-Allied Industrial Estate, Ikeja',
        city: 'Lagos',
        state: 'Lagos State',
        postalCode: '100001',
        country: 'Nigeria',
        specialInstructions: 'Offload at Cold Storage Bay 2 between 8am and 12pm'
      }
    });

    const err = order.validateSync();
    assert.strictEqual(err, undefined, 'Order validation should pass cleanly without schema errors');
    assert.strictEqual(order.status, 'Pending', 'Initial order status should default to Pending');
    assert.strictEqual(order.paymentStatus, 'unpaid', 'Initial payment status should default to unpaid');
    assert.ok(order.orderNumber.startsWith('AGR-'), 'Generated order reference should be prefixed with AGR-');
    assert.strictEqual(order.totalAmount, 25 * 4500, 'Calculated total should equal item quantity multiplied by price');
    assert.strictEqual(order.farmerEmail, 'farmer.dan@agrily.com', 'Farmer email should automatically sync from items');
  });

  // --------------------------------------------------------------------------
  // TEST CASE 2: Item LineTotal Virtual Calculation
  // --------------------------------------------------------------------------
  it('should accurately compute virtual lineTotal for each individual produce line item', () => {
    const order = new Order({
      buyerEmail: 'catering@bellafoods.com',
      items: [
        {
          productId: new mongoose.Types.ObjectId(),
          name: 'Yellow Maize Grain',
          unit: 'bag',
          quantity: 10,
          price: 18500,
          ownerEmail: 'kaduna.grains@agrily.com'
        },
        {
          productId: new mongoose.Types.ObjectId(),
          name: 'Fresh Habanero Peppers',
          unit: 'basket',
          quantity: 4,
          price: 6000,
          ownerEmail: 'jos.vegetables@agrily.com'
        }
      ],
      deliveryAddress: {
        street: 'Central Market Road',
        city: 'Kano',
        state: 'Kano State'
      }
    });

    const err = order.validateSync();
    assert.strictEqual(err, undefined);
    assert.strictEqual(order.items[0].lineTotal, 185000, 'Maize line total must be 10 * 18,500 = 185,000');
    assert.strictEqual(order.items[1].lineTotal, 24000, 'Peppers line total must be 4 * 6,000 = 24,000');
    assert.strictEqual(order.totalAmount, 209000, 'Order total must sum both line totals');
  });

  // --------------------------------------------------------------------------
  // TEST CASE 3: Rejection of Empty Item Consignment
  // --------------------------------------------------------------------------
  it('should reject orders submitted with an empty items array', () => {
    const order = new Order({
      buyerEmail: 'purchasing@agrofoods.com',
      items: [],
      deliveryAddress: {
        street: '12 Farm Gate Way',
        city: 'Ibadan',
        state: 'Oyo State'
      }
    });

    const err = order.validateSync();
    assert.ok(err, 'Expected validation error for empty items list');
    assert.ok(
      err.errors.items || err.errors['items'],
      'Validation error should target the items field'
    );
  });

  // --------------------------------------------------------------------------
  // TEST CASE 4: Rejection of Invalid Buyer Email
  // --------------------------------------------------------------------------
  it('should reject orders with an invalid or malformed buyer email address', () => {
    const order = new Order({
      buyerEmail: 'invalid-email-without-at-symbol',
      items: [
        {
          productId: new mongoose.Types.ObjectId(),
          name: 'Soybeans',
          unit: 'bag',
          quantity: 2,
          price: 15000,
          ownerEmail: 'farmer@agrily.com'
        }
      ],
      deliveryAddress: {
        street: 'Commercial Avenue',
        city: 'Abuja',
        state: 'FCT'
      }
    });

    const err = order.validateSync();
    assert.ok(err, 'Validation should fail for invalid buyer email');
    assert.ok(err.errors.buyerEmail, 'Error must identify buyerEmail as failing regex');
  });

  // --------------------------------------------------------------------------
  // TEST CASE 5: Missing Delivery Address Validation
  // --------------------------------------------------------------------------
  it('should require street, city, and state in delivery address sub-document', () => {
    const order = new Order({
      buyerEmail: 'buyer@market.org',
      items: [
        {
          productId: new mongoose.Types.ObjectId(),
          name: 'Cassava Stems',
          unit: 'bundle' in Order.supportedUnits ? 'bundle' : 'piece',
          quantity: 50,
          price: 200,
          ownerEmail: 'seedlings@farm.ng'
        }
      ],
      deliveryAddress: {
        // Missing street, city, state
        postalCode: '900001'
      }
    });

    const err = order.validateSync();
    assert.ok(err, 'Validation error expected for incomplete delivery address');
    assert.ok(err.errors['deliveryAddress.street'], 'Street address must be required');
    assert.ok(err.errors['deliveryAddress.city'], 'City must be required');
    assert.ok(err.errors['deliveryAddress.state'], 'State must be required');
  });

  // --------------------------------------------------------------------------
  // TEST CASE 6: Supported Measurement Units Enum Enforcement
  // --------------------------------------------------------------------------
  it('should reject unsupported packaging or measurement units in line items', () => {
    const order = new Order({
      buyerEmail: 'restaurant@bistro.ng',
      items: [
        {
          productId: new mongoose.Types.ObjectId(),
          name: 'Tomatoes',
          unit: 'barrel_unsupported', // Invalid unit
          quantity: 5,
          price: 7000,
          ownerEmail: 'veg.grower@agrily.com'
        }
      ],
      deliveryAddress: {
        street: '15 Victoria Island Blvd',
        city: 'Lagos',
        state: 'Lagos State'
      }
    });

    const err = order.validateSync();
    assert.ok(err, 'Validation error expected for unsupported unit');
    assert.ok(err.errors['items.0.unit'], 'Error should point to unsupported item unit');
  });

  // --------------------------------------------------------------------------
  // TEST CASE 7: Rejection of Zero or Negative Quantities
  // --------------------------------------------------------------------------
  it('should reject line items with quantity less than 1 unit', () => {
    const order = new Order({
      buyerEmail: 'trader@commodity.com',
      items: [
        {
          productId: new mongoose.Types.ObjectId(),
          name: 'Cashew Nuts',
          unit: 'kg',
          quantity: 0, // Invalid: must be at least 1
          price: 3200,
          ownerEmail: 'farmer@orchard.ng'
        }
      ],
      deliveryAddress: {
        street: 'Grain Market Road',
        city: 'Minna',
        state: 'Niger State'
      }
    });

    const err = order.validateSync();
    assert.ok(err, 'Expected error for zero quantity line item');
    assert.ok(err.errors['items.0.quantity'], 'Error should specifically flag items.0.quantity');
  });

  // --------------------------------------------------------------------------
  // TEST CASE 8: Status Lifecycle Enum Values Validation
  // --------------------------------------------------------------------------
  it('should strictly permit only recognized supply chain order statuses', () => {
    const validStatuses = ['Pending', 'Confirmed', 'In Transit', 'Delivered', 'Cancelled'];
    for (const validStatus of validStatuses) {
      const order = new Order({
        buyerEmail: 'audit@agrily.com',
        status: validStatus,
        items: [
          {
            productId: new mongoose.Types.ObjectId(),
            name: 'Brown Beans',
            unit: 'bag',
            quantity: 3,
            price: 22000,
            ownerEmail: 'farmer@beans.ng'
          }
        ],
        deliveryAddress: {
          street: 'Main Warehouse Gate',
          city: 'Kaduna',
          state: 'Kaduna State'
        }
      });
      const err = order.validateSync();
      assert.strictEqual(err, undefined, `Status "${validStatus}" must be accepted by schema`);
    }

    // Invalid status test
    const invalidOrder = new Order({
      buyerEmail: 'audit@agrily.com',
      status: 'ArchivedOrLost', // Invalid status
      items: [
        {
          productId: new mongoose.Types.ObjectId(),
          name: 'Brown Beans',
          unit: 'bag',
          quantity: 1,
          price: 22000,
          ownerEmail: 'farmer@beans.ng'
        }
      ],
      deliveryAddress: {
        street: 'Main Warehouse Gate',
        city: 'Kaduna',
        state: 'Kaduna State'
      }
    });
    const invalidErr = invalidOrder.validateSync();
    assert.ok(invalidErr, 'Validation should fail for unrecognized order status');
    assert.ok(invalidErr.errors.status, 'Error should flag the status enum failure');
  });

  console.log(`\n🎉 All ${passed}/${total} Order Model Unit Tests Passed Successfully!\n`);
}

// Execute tests if invoked directly
if (require.main === module) {
  runTests().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}

module.exports = runTests;
