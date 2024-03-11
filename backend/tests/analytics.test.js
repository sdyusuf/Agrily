/**
 * ==============================================================================
 * AGRILY BACKEND TEST SUITE - AGRICULTURAL REVENUE & SALES ANALYTICS UNIT TESTS
 * ==============================================================================
 * 
 * Test Suite Description:
 * Verifies the mathematical accuracy of agricultural commerce analytics,
 * category revenue breakdowns, physical unit aggregations, escrow tracking,
 * and router endpoint configurations.
 * 
 * @module tests/analytics.test
 * @requires assert
 * @requires ../routes/analytics
 */

const assert = require('assert');
const analyticsRouter = require('../routes/analytics');
const {
  calculateFarmerMetrics,
  getFarmerAnalyticsController,
  getPlatformSummaryController
} = analyticsRouter;

/**
 * Main execution harness for Analytics unit tests.
 * 
 * @async
 * @function runTests
 * @returns {Promise<void>}
 */
async function runTests() {
  console.log('🧪 Starting Agricultural Analytics & Revenue Unit Tests...\n');
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
  // TEST CASE 1: Empty Orders Array Baseline
  // --------------------------------------------------------------------------
  it('calculateFarmerMetrics should return zeroed values for empty orders array', () => {
    const metrics = calculateFarmerMetrics([], 'farmer@agrily.com');

    assert.strictEqual(metrics.grossRevenue, 0);
    assert.strictEqual(metrics.pendingRevenue, 0);
    assert.strictEqual(metrics.settledRevenue, 0);
    assert.strictEqual(metrics.totalPotentialRevenue, 0);
    assert.strictEqual(metrics.totalUnitsSold, 0);
    assert.strictEqual(metrics.totalOrdersCount, 0);
    assert.strictEqual(metrics.statusCounts.pending, 0);
    assert.strictEqual(metrics.statusCounts.delivered, 0);
  });

  // --------------------------------------------------------------------------
  // TEST CASE 2: Multi-State Revenue & Volume Calculation
  // --------------------------------------------------------------------------
  it('calculateFarmerMetrics should accurately aggregate gross, pending, and settled revenue', () => {
    const mockOrders = [
      {
        status: 'Pending',
        items: [
          {
            name: 'Millet Grain',
            category: 'grains',
            unit: 'bag',
            quantity: 5,
            price: 15000,
            ownerEmail: 'kaduna.farm@agrily.com'
          }
        ]
      },
      {
        status: 'Confirmed',
        items: [
          {
            name: 'White Yam Tubers',
            category: 'tubers',
            unit: 'crate',
            quantity: 10,
            price: 7000,
            ownerEmail: 'kaduna.farm@agrily.com'
          }
        ]
      },
      {
        status: 'Delivered',
        items: [
          {
            name: 'Fresh Tomatoes',
            category: 'vegetables',
            unit: 'basket',
            quantity: 8,
            price: 5000,
            ownerEmail: 'kaduna.farm@agrily.com'
          }
        ]
      },
      {
        status: 'Cancelled',
        items: [
          {
            name: 'Rejected Grain',
            category: 'grains',
            unit: 'bag',
            quantity: 2,
            price: 15000,
            ownerEmail: 'kaduna.farm@agrily.com'
          }
        ]
      }
    ];

    const metrics = calculateFarmerMetrics(mockOrders, 'kaduna.farm@agrily.com');

    // Expected computations:
    // Pending: 5 * 15,000 = 75,000
    // Confirmed: 10 * 7,000 = 70,000
    // Delivered: 8 * 5,000 = 40,000
    // Gross Revenue (Confirmed + Delivered) = 70,000 + 40,000 = 110,000
    // Settled Revenue (Delivered only) = 40,000
    // Cancelled is excluded from revenue
    // Total Units Sold (Confirmed + Delivered) = 10 crates + 8 baskets = 18 units

    assert.strictEqual(metrics.pendingRevenue, 75000, 'Pending revenue must equal 75,000 NGN');
    assert.strictEqual(metrics.grossRevenue, 110000, 'Gross revenue must equal 110,000 NGN');
    assert.strictEqual(metrics.settledRevenue, 40000, 'Settled revenue must equal 40,000 NGN');
    assert.strictEqual(metrics.totalPotentialRevenue, 185000, 'Potential revenue must sum gross + pending');
    assert.strictEqual(metrics.totalUnitsSold, 18, 'Units sold must sum 10 crates + 8 baskets');

    // Verify status counts
    assert.strictEqual(metrics.statusCounts.pending, 1);
    assert.strictEqual(metrics.statusCounts.confirmed, 1);
    assert.strictEqual(metrics.statusCounts.delivered, 1);
    assert.strictEqual(metrics.statusCounts.cancelled, 1);
  });

  // --------------------------------------------------------------------------
  // TEST CASE 3: Category & Unit Dispersion Breakdown
  // --------------------------------------------------------------------------
  it('calculateFarmerMetrics should break down sales by produce category and unit', () => {
    const mockOrders = [
      {
        status: 'Confirmed',
        items: [
          {
            name: 'Yellow Maize',
            category: 'grains',
            unit: 'bag',
            quantity: 4,
            price: 20000,
            ownerEmail: 'farmer@agrily.com'
          },
          {
            name: 'Guinea Corn',
            category: 'grains',
            unit: 'bag',
            quantity: 2,
            price: 18000,
            ownerEmail: 'farmer@agrily.com'
          }
        ]
      },
      {
        status: 'Delivered',
        items: [
          {
            name: 'Irish Potatoes',
            category: 'tubers',
            unit: 'bag',
            quantity: 5,
            price: 12000,
            ownerEmail: 'farmer@agrily.com'
          }
        ]
      }
    ];

    const metrics = calculateFarmerMetrics(mockOrders, 'farmer@agrily.com');

    // Grains: 4 * 20,000 (80,000) + 2 * 18,000 (36,000) = 116,000 NGN across 6 bags
    assert.strictEqual(metrics.salesByCategory.grains.revenue, 116000);
    assert.strictEqual(metrics.salesByCategory.grains.units, 6);

    // Tubers: 5 * 12,000 (60,000) across 5 bags
    assert.strictEqual(metrics.salesByCategory.tubers.revenue, 60000);
    assert.strictEqual(metrics.salesByCategory.tubers.units, 5);

    // Total bags unit count: 6 + 5 = 11 bags
    assert.strictEqual(metrics.salesByUnit.bag, 11);
  });

  // --------------------------------------------------------------------------
  // TEST CASE 4: Multi-Vendor Email Isolation
  // --------------------------------------------------------------------------
  it('calculateFarmerMetrics should only calculate metrics for specified farmer email', () => {
    const multiVendorOrder = [
      {
        status: 'Confirmed',
        items: [
          {
            name: 'Rice',
            quantity: 5,
            price: 25000,
            ownerEmail: 'farmer.A@agrily.com'
          },
          {
            name: 'Beans',
            quantity: 3,
            price: 30000,
            ownerEmail: 'farmer.B@agrily.com' // Different farmer
          }
        ]
      }
    ];

    const metricsA = calculateFarmerMetrics(multiVendorOrder, 'farmer.a@agrily.com');
    assert.strictEqual(metricsA.grossRevenue, 125000, 'Farmer A revenue must be 5 * 25,000 = 125,000');
    assert.strictEqual(metricsA.totalUnitsSold, 5);

    const metricsB = calculateFarmerMetrics(multiVendorOrder, 'farmer.b@agrily.com');
    assert.strictEqual(metricsB.grossRevenue, 90000, 'Farmer B revenue must be 3 * 30,000 = 90,000');
    assert.strictEqual(metricsB.totalUnitsSold, 3);
  });

  // --------------------------------------------------------------------------
  // TEST CASE 5: Controller HTTP 400 on Missing Farmer Email
  // --------------------------------------------------------------------------
  it('getFarmerAnalyticsController should return HTTP 400 if email parameter is missing', async () => {
    const mockReq = { params: {}, query: {} };
    let code = null;
    let body = null;
    const mockRes = {
      status: c => { code = c; return mockRes; },
      json: d => { body = d; return mockRes; }
    };

    await getFarmerAnalyticsController(mockReq, mockRes);
    assert.strictEqual(code, 400);
    assert.strictEqual(body.success, false);
    assert.ok(body.message.includes('Farmer account email parameter is required'));
  });

  // --------------------------------------------------------------------------
  // TEST CASE 6: Router Stack Registration
  // --------------------------------------------------------------------------
  it('should register /analytics/farmer/:email and /analytics/summary on router', () => {
    assert.ok(analyticsRouter && analyticsRouter.stack);

    const registeredPaths = analyticsRouter.stack
      .filter(l => l.route)
      .map(l => ({
        path: l.route.path,
        methods: Object.keys(l.route.methods)
      }));

    assert.ok(
      registeredPaths.some(r => r.path === '/analytics/farmer/:email' && r.methods.includes('get')),
      'GET /analytics/farmer/:email must be registered'
    );
    assert.ok(
      registeredPaths.some(r => r.path === '/analytics/summary' && r.methods.includes('get')),
      'GET /analytics/summary must be registered'
    );
  });

  console.log(`\n🎉 All ${passed}/${total} Agricultural Analytics Unit Tests Passed Successfully!\n`);
}

// Execute tests if invoked directly
if (require.main === module) {
  runTests().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}

module.exports = runTests;
