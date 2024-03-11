/**
 * ==============================================================================
 * AGRILY AGRICULTURAL COMMERCE PLATFORM - PRODUCER REVENUE & SALES ANALYTICS
 * ==============================================================================
 * 
 * Module Description:
 * This Express router and analytics engine aggregates agricultural commercial data,
 * computing gross sales revenue, physical produce volume (units/tonnage sold), category-wise
 * distribution, and fulfillment velocity metrics for registered producers and cooperatives.
 * 
 * Agricultural Analytics Domain Scope:
 * Unlike conventional e-commerce metrics, farm economics require specialized analysis:
 *  1. Harvest Unit Aggregation: Tracking sales by standard produce units (bags, crates,
 *     metric tons, baskets) across diverse crop classifications.
 *  2. Escrow vs Settled Revenue: Separating funds held in transit escrow from settled
 *     payouts received upon buyer delivery acceptance.
 *  3. Produce Category Dispersion: Evaluating whether farmer income is diversified
 *     across staples (grains, tubers) and perishables (vegetables, fruits).
 *  4. Velocity: Identifying pending fulfillment bottlenecks to optimize harvest schedules.
 * 
 * Route Endpoints Provided:
 *  - GET /api/analytics/farmer/:email -> Comprehensive revenue & unit analytics for a farmer
 *  - GET /api/analytics/summary        -> Platform-wide agricultural trade summary
 * 
 * @module routes/analytics
 * @requires express
 * @requires ../models/Order
 * @requires ../models/Product
 */

const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');

/**
 * Pure calculation helper: aggregates revenue, volumes, and categories from an array of order records.
 * Isolated from database I/O to enable deterministic, zero-latency unit testing.
 * 
 * @function calculateFarmerMetrics
 * @param {Array<Object>} orders - Array of Order documents or plain objects
 * @param {string} farmerEmail - Normalized email address of farmer
 * @returns {Object} Comprehensive sales and volume analytics object
 */
function calculateFarmerMetrics(orders = [], farmerEmail = '') {
  const normalizedEmail = (farmerEmail || '').toLowerCase().trim();

  let grossRevenue = 0;       // Confirmed, In Transit, Delivered
  let pendingRevenue = 0;     // Pending
  let settledRevenue = 0;     // Delivered & Settled
  let totalUnitsSold = 0;     // Total physical units confirmed or delivered

  const salesByCategory = {};
  const salesByUnit = {};
  const statusCounts = {
    pending: 0,
    confirmed: 0,
    inTransit: 0,
    delivered: 0,
    cancelled: 0
  };

  orders.forEach(order => {
    const status = order.status || 'Pending';

    // Map status key
    if (status === 'Pending') statusCounts.pending++;
    else if (status === 'Confirmed') statusCounts.confirmed++;
    else if (status === 'In Transit') statusCounts.inTransit++;
    else if (status === 'Delivered') statusCounts.delivered++;
    else if (status === 'Cancelled') statusCounts.cancelled++;

    // Process line items belonging to this farmer
    const items = Array.isArray(order.items) ? order.items : [];
    items.forEach(item => {
      const itemOwner = (item.ownerEmail || order.farmerEmail || '').toLowerCase().trim();

      // If item belongs to this farmer (or if no farmer filter specified)
      if (!normalizedEmail || itemOwner === normalizedEmail) {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        const lineTotal = qty * price;
        const category = (item.category || 'other').toLowerCase().trim();
        const unit = (item.unit || 'unit').toLowerCase().trim();

        // Categorize revenue based on order state
        if (status === 'Pending') {
          pendingRevenue += lineTotal;
        } else if (status === 'Confirmed' || status === 'In Transit') {
          grossRevenue += lineTotal;
          totalUnitsSold += qty;
        } else if (status === 'Delivered') {
          grossRevenue += lineTotal;
          settledRevenue += lineTotal;
          totalUnitsSold += qty;
        }

        // Aggregate by category (only for non-cancelled orders)
        if (status !== 'Cancelled') {
          if (!salesByCategory[category]) {
            salesByCategory[category] = { revenue: 0, units: 0 };
          }
          salesByCategory[category].revenue += lineTotal;
          salesByCategory[category].units += qty;

          // Aggregate by unit
          if (!salesByUnit[unit]) {
            salesByUnit[unit] = 0;
          }
          salesByUnit[unit] += qty;
        }
      }
    });
  });

  return {
    grossRevenue: Number(grossRevenue.toFixed(2)),
    pendingRevenue: Number(pendingRevenue.toFixed(2)),
    settledRevenue: Number(settledRevenue.toFixed(2)),
    totalPotentialRevenue: Number((grossRevenue + pendingRevenue).toFixed(2)),
    totalUnitsSold,
    totalOrdersCount: orders.length,
    statusCounts,
    salesByCategory,
    salesByUnit
  };
}

/**
 * Controller: Handles GET /api/analytics/farmer/:email
 * Fetches order history for a farmer and generates complete financial and volume analytics.
 * 
 * @async
 * @function getFarmerAnalyticsController
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 * @returns {Promise<express.Response>}
 */
async function getFarmerAnalyticsController(req, res) {
  try {
    const emailParam = (req.params.email || req.query.email || '').toLowerCase().trim();

    if (!emailParam) {
      return res.status(400).json({
        success: false,
        message: 'Farmer account email parameter is required to calculate revenue analytics.'
      });
    }

    // Query all orders associated with this producer
    const orders = await Order.find({
      $or: [
        { farmerEmail: emailParam },
        { 'items.ownerEmail': emailParam }
      ]
    })
      .sort({ createdAt: -1 })
      .lean();

    // Query active active product listings
    let activeListingsCount = 0;
    try {
      if (Product.countDocuments) {
        activeListingsCount = await Product.countDocuments({
          ownerEmail: emailParam,
          isSold: false
        });
      }
    } catch {
      // Continue gracefully if Product count fails
    }

    // Compute metrics
    const metrics = calculateFarmerMetrics(orders, emailParam);

    // Recent 5 transactions for mini-statement
    const recentOrders = orders.slice(0, 5).map(o => ({
      orderNumber: o.orderNumber,
      buyerName: o.buyerName,
      status: o.status,
      totalAmount: o.totalAmount,
      date: o.createdAt
    }));

    return res.status(200).json({
      success: true,
      farmerEmail: emailParam,
      activeListingsCount,
      metrics,
      recentOrders
    });
  } catch (error) {
    console.error('Error computing farmer analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to compute agricultural sales analytics.',
      error: error.message
    });
  }
}

/**
 * Controller: Handles GET /api/analytics/summary
 * Provides macroscopic agricultural platform statistics.
 * 
 * @async
 * @function getPlatformSummaryController
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 * @returns {Promise<express.Response>}
 */
async function getPlatformSummaryController(req, res) {
  try {
    const [totalOrders, orders, totalProducts] = await Promise.all([
      Order.countDocuments ? Order.countDocuments() : 0,
      Order.find({}).lean(),
      Product.countDocuments ? Product.countDocuments({ isSold: false }) : 0
    ]);

    const macroMetrics = calculateFarmerMetrics(orders, '');

    return res.status(200).json({
      success: true,
      platformTotals: {
        totalOrders,
        activeProducts: totalProducts,
        grossVolumeTraded: macroMetrics.grossRevenue,
        totalUnitsDispensed: macroMetrics.totalUnitsSold,
        categoryBreakdown: macroMetrics.salesByCategory
      }
    });
  } catch (error) {
    console.error('Error generating platform macro analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve macro trade statistics.',
      error: error.message
    });
  }
}

// Route definitions
router.get('/analytics/farmer/:email', getFarmerAnalyticsController);
router.get('/analytics/summary', getPlatformSummaryController);

// Export router and calculation utilities
module.exports = router;
module.exports.calculateFarmerMetrics = calculateFarmerMetrics;
module.exports.getFarmerAnalyticsController = getFarmerAnalyticsController;
module.exports.getPlatformSummaryController = getPlatformSummaryController;
