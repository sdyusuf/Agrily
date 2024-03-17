/**
 * ==============================================================================
 * AGRILY AGRICULTURAL COMMERCE PLATFORM - ORDER MANAGEMENT ROUTER & CONTROLLER
 * ==============================================================================
 * 
 * Module Description:
 * This Express router handles order placement, buyer order history queries,
 * produce reservation checks, and logistics dispatch status updates.
 * 
 * Supply Chain Context:
 * In wholesale agricultural markets, produce availability is time-sensitive and highly
 * perishable. Unlike standard e-commerce shelf inventory:
 *  1. Stock Levels: Represent live harvest capacity at the farm.
 *  2. Minimum Order Quantities (MOQ): Enforce commercial viability (e.g. minimum 5 crates
 *     to justify freight haulage).
 *  3. Payment & Escrow: Funds are held in escrow or marked pending until produce arrives
 *     at destination and undergoes physical quality inspection.
 * 
 * Route Endpoints Provided:
 *  - POST   /api/orders             -> Submit new procurement order with stock verification
 *  - GET    /api/orders/buyer       -> Retrieve order history for buyer (via query or header)
 *  - GET    /api/orders/buyer/:email -> Retrieve order history for a specific buyer email
 *  - GET    /api/orders/:id         -> Retrieve single order by MongoDB ID or order reference
 * 
 * @module routes/orders
 * @requires express
 * @requires ../models/Order
 * @requires ../models/Product
 */

const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const {
  sendNewOrderAlertToFarmer,
  sendOrderDispatchedAlertToBuyer
} = require('../utils/emailService');

/**
 * Validates the raw order submission payload prior to database interaction.
 * Checks for mandatory buyer contact details, non-empty items array, positive
 * quantities and valid delivery coordinates.
 * 
 * @function validateOrderPayload
 * @param {Object} payload - Raw request body submitted by client
 * @returns {{ isValid: boolean, errors: string[] }} Validation result and list of issues
 */
function validateOrderPayload(payload) {
  const errors = [];

  if (!payload || typeof payload !== 'object') {
    return { isValid: false, errors: ['Request body must be a valid JSON object'] };
  }

  // 1. Verify Buyer Email Address
  if (!payload.buyerEmail || typeof payload.buyerEmail !== 'string') {
    errors.push('Buyer email address is mandatory');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.buyerEmail.trim())) {
      errors.push('A valid buyer email address format is required');
    }
  }

  // 2. Verify Line Items Array
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    errors.push('At least one produce line item must be included in the order');
  } else {
    payload.items.forEach((item, index) => {
      const idx = index + 1;
      if (!item.name || typeof item.name !== 'string' || item.name.trim().length === 0) {
        errors.push(`Line item #${idx}: Produce name is required`);
      }
      if (item.quantity === undefined || Number(item.quantity) < 1) {
        errors.push(`Line item #${idx}: Quantity must be at least 1 unit`);
      }
      if (item.price === undefined || Number(item.price) < 0) {
        errors.push(`Line item #${idx}: Unit price cannot be negative`);
      }
      if (!item.ownerEmail || typeof item.ownerEmail !== 'string') {
        errors.push(`Line item #${idx}: Producing farmer email is required`);
      }
    });
  }

  // 3. Verify Delivery Address Information
  if (!payload.deliveryAddress || typeof payload.deliveryAddress !== 'object') {
    errors.push('Delivery destination address is required');
  } else {
    const { street, city, state } = payload.deliveryAddress;
    if (!street || typeof street !== 'string' || street.trim().length === 0) {
      errors.push('Delivery address requires a valid street or farm gate address');
    }
    if (!city || typeof city !== 'string' || city.trim().length === 0) {
      errors.push('Delivery address requires a destination city or LGA');
    }
    if (!state || typeof state !== 'string' || state.trim().length === 0) {
      errors.push('Delivery address requires a destination state or province');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Controller: Handles POST /api/orders
 * Processes new order submission, verifies produce stock availability when available,
 * computes monetary totals, saves the document to MongoDB, and returns confirmation.
 * 
 * @async
 * @function createOrderController
 * @param {express.Request} req - Express request object containing order payload
 * @param {express.Response} res - Express response object
 * @returns {Promise<express.Response>} JSON response with created order and metadata
 */
async function createOrderController(req, res) {
  try {
    const payload = req.body;

    // Step A: Perform structural validation on incoming request payload
    const validation = validateOrderPayload(payload);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Order validation failed. Please check the provided information.',
        errors: validation.errors
      });
    }

    // Step B: Sanitize and format items array
    const sanitizedItems = payload.items.map(item => ({
      productId: item.productId || item._id,
      name: String(item.name).trim(),
      unit: item.unit ? String(item.unit).toLowerCase().trim() : 'kg',
      quantity: Number(item.quantity),
      price: Number(item.price),
      ownerEmail: String(item.ownerEmail).toLowerCase().trim(),
      imageURL: item.imageURL ? String(item.imageURL).trim() : ''
    }));

    // Step C: Stock verification pass (optional if products exist in database)
    const stockIssues = [];
    for (const item of sanitizedItems) {
      if (item.productId && Product.findById) {
        try {
          const product = await Product.findById(item.productId);
          if (product) {
            if (product.quantity < item.quantity) {
              stockIssues.push(
                `Insufficient stock for "${item.name}". Requested: ${item.quantity} ${item.unit}, Available: ${product.quantity} ${item.unit}`
              );
            }
          }
        } catch {
          // If product lookup fails or is not a valid ObjectId, continue gracefully
        }
      }
    }

    if (stockIssues.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'One or more produce items exceed currently available harvest capacity.',
        stockIssues
      });
    }

    // Step D: Calculate final monetary order total
    const computedTotal = sanitizedItems.reduce((acc, item) => {
      return acc + (item.quantity * item.price);
    }, 0);

    const totalAmount = (payload.totalAmount && Number(payload.totalAmount) > 0)
      ? Number(payload.totalAmount)
      : Number(computedTotal.toFixed(2));

    // Step E: Construct Order document
    const newOrder = new Order({
      buyerEmail: payload.buyerEmail.toLowerCase().trim(),
      buyerName: payload.buyerName ? String(payload.buyerName).trim() : '',
      buyerPhone: payload.buyerPhone ? String(payload.buyerPhone).trim() : '',
      farmerEmail: sanitizedItems[0]?.ownerEmail || '',
      items: sanitizedItems,
      totalAmount: totalAmount,
      deliveryAddress: {
        street: String(payload.deliveryAddress.street).trim(),
        city: String(payload.deliveryAddress.city).trim(),
        state: String(payload.deliveryAddress.state).trim(),
        postalCode: payload.deliveryAddress.postalCode ? String(payload.deliveryAddress.postalCode).trim() : '',
        country: payload.deliveryAddress.country ? String(payload.deliveryAddress.country).trim() : 'Nigeria',
        specialInstructions: payload.deliveryAddress.specialInstructions ? String(payload.deliveryAddress.specialInstructions).trim() : ''
      },
      status: 'Pending',
      paymentStatus: payload.paymentStatus || 'unpaid',
      notes: payload.notes ? String(payload.notes).trim() : ''
    });

    // Step F: Save order to database
    const savedOrder = await newOrder.save();

    // Trigger automated email alert to producing farmer (non-blocking)
    if (savedOrder.farmerEmail) {
      sendNewOrderAlertToFarmer(savedOrder.farmerEmail, savedOrder).catch(err => {
        console.warn('Asynchronous farmer email notification warning:', err.message);
      });
    }

    // Step G: Return response with confirmation metadata
    return res.status(201).json({
      success: true,
      message: 'Agricultural procurement order created successfully!',
      order: savedOrder,
      orderReference: savedOrder.orderNumber,
      estimatedDeliveryDays: '2 - 4 business days'
    });
  } catch (error) {
    console.error('Error creating agricultural order:', error);
    return res.status(500).json({
      success: false,
      message: 'An unexpected internal error occurred while processing your order.',
      error: error.message
    });
  }
}

/**
 * Controller: Handles GET /api/orders/buyer and GET /api/orders/buyer/:email
 * Retrieves historical orders placed by a specific buyer account.
 * 
 * @async
 * @function getBuyerOrdersController
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {Promise<express.Response>} JSON response with list of matched orders
 */
async function getBuyerOrdersController(req, res) {
  try {
    // Extract buyer email from route parameters, query string, or auth header
    const buyerEmail = (
      req.params.email ||
      req.query.email ||
      req.headers['x-buyer-email'] ||
      ''
    ).toLowerCase().trim();

    if (!buyerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Buyer email parameter is required to retrieve procurement orders'
      });
    }

    // Build query filter
    const query = { buyerEmail: buyerEmail };

    // Optional status filter
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Retrieve orders sorted by most recent first
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Calculate summary statistics
    const totalSpent = orders.reduce((sum, ord) => sum + (Number(ord.totalAmount) || 0), 0);
    const activeOrdersCount = orders.filter(ord => ord.status !== 'Delivered' && ord.status !== 'Cancelled').length;

    return res.status(200).json({
      success: true,
      count: orders.length,
      activeCount: activeOrdersCount,
      totalSpent: Number(totalSpent.toFixed(2)),
      orders: orders
    });
  } catch (error) {
    console.error('Error fetching buyer orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve buyer order history at this time.',
      error: error.message
    });
  }
}

/**
 * Controller: Handles GET /api/orders/:id
 * Fetches a single order document by either its MongoDB ObjectId or orderNumber reference.
 * 
 * @async
 * @function getOrderByIdController
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 * @returns {Promise<express.Response>}
 */
async function getOrderByIdController(req, res) {
  try {
    const identifier = req.params.id;
    let order = null;

    // Check if valid ObjectId or custom order reference
    if (identifier.startsWith('AGR-')) {
      order = await Order.findOne({ orderNumber: identifier }).lean();
    } else {
      try {
        order = await Order.findById(identifier).lean();
      } catch {
        order = await Order.findOne({ orderNumber: identifier }).lean();
      }
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order with reference "${identifier}" was not found.`
      });
    }

    return res.status(200).json({
      success: true,
      order: order
    });
  } catch (error) {
    console.error('Error retrieving order by identifier:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve order details.',
      error: error.message
    });
  }
}

/**
 * Validates whether an order status change complies with agricultural supply chain state machine.
 * 
 * Permitted Lifecycle Transitions:
 *  - 'Pending'    -> 'Confirmed', 'Cancelled'
 *  - 'Confirmed'  -> 'In Transit', 'Cancelled'
 *  - 'In Transit' -> 'Delivered', 'Cancelled'
 *  - 'Delivered'  -> Terminal state (no further transitions permitted)
 *  - 'Cancelled'  -> Terminal state (no further transitions permitted)
 * 
 * @function isValidStatusTransition
 * @param {string} currentStatus - Existing order status in database
 * @param {string} newStatus - Requested target status
 * @returns {boolean} True if transition is legally allowed by state machine
 */
function isValidStatusTransition(currentStatus, newStatus) {
  if (currentStatus === newStatus) return true;

  const validTransitions = {
    'Pending': ['Confirmed', 'Cancelled'],
    'Confirmed': ['In Transit', 'Cancelled'],
    'In Transit': ['Delivered', 'Cancelled'],
    'Delivered': [],
    'Cancelled': []
  };

  const allowedNext = validTransitions[currentStatus] || [];
  return allowedNext.includes(newStatus);
}

/**
 * Controller: Handles GET /api/orders/farmer and GET /api/orders/farmer/:email
 * Retrieves all incoming buyer procurement orders allocated to a farmer producer account.
 * 
 * @async
 * @function getFarmerOrdersController
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 * @returns {Promise<express.Response>} List of matching farmer orders and revenue aggregates
 */
async function getFarmerOrdersController(req, res) {
  try {
    const farmerEmail = (
      req.params.email ||
      req.query.email ||
      req.headers['x-farmer-email'] ||
      ''
    ).toLowerCase().trim();

    if (!farmerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Farmer producer email is mandatory to fetch allocated orders'
      });
    }

    // Filter by farmerEmail in master record or nested item line allocation
    const query = {
      $or: [
        { farmerEmail: farmerEmail },
        { 'items.ownerEmail': farmerEmail }
      ]
    };

    if (req.query.status) {
      query.status = req.query.status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Compute fulfillment pipeline aggregates
    let totalFarmerRevenue = 0;
    let pendingCount = 0;
    let confirmedCount = 0;
    let inTransitCount = 0;
    let deliveredCount = 0;

    orders.forEach(order => {
      // Sum items allocated to this specific farmer
      const farmerItems = (order.items || []).filter(
        it => it.ownerEmail && it.ownerEmail.toLowerCase() === farmerEmail
      );
      const orderFarmerSubtotal = farmerItems.reduce(
        (sum, it) => sum + ((Number(it.quantity) || 0) * (Number(it.price) || 0)),
        0
      );
      totalFarmerRevenue += orderFarmerSubtotal;

      if (order.status === 'Pending') pendingCount++;
      else if (order.status === 'Confirmed') confirmedCount++;
      else if (order.status === 'In Transit') inTransitCount++;
      else if (order.status === 'Delivered') deliveredCount++;
    });

    return res.status(200).json({
      success: true,
      count: orders.length,
      metrics: {
        totalRevenue: Number(totalFarmerRevenue.toFixed(2)),
        pendingCount,
        confirmedCount,
        inTransitCount,
        deliveredCount
      },
      orders
    });
  } catch (error) {
    console.error('Error fetching farmer incoming orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve farmer order queue.',
      error: error.message
    });
  }
}

/**
 * Controller: Handles PATCH /api/orders/:id/status
 * Updates the lifecycle progress of an agricultural order (e.g. from 'Pending' to 'Confirmed').
 * Automatically decrements inventory in the Product catalog when an order is Confirmed.
 * 
 * @async
 * @function updateOrderStatusController
 * @param {express.Request} req - Express request
 * @param {express.Response} res - Express response
 * @returns {Promise<express.Response>} Updated order details
 */
async function updateOrderStatusController(req, res) {
  try {
    const identifier = req.params.id;
    const { status: requestedStatus, trackingNumber, cancellationReason } = req.body;

    if (!requestedStatus) {
      return res.status(400).json({
        success: false,
        message: 'A target status is required in the request body.'
      });
    }

    // Verify requested status is a recognized enum
    const validStatuses = Order.orderLifecycleStatuses || [
      'Pending',
      'Confirmed',
      'In Transit',
      'Delivered',
      'Cancelled'
    ];

    if (!validStatuses.includes(requestedStatus)) {
      return res.status(400).json({
        success: false,
        message: `"${requestedStatus}" is not a valid order status. Permitted statuses: ${validStatuses.join(', ')}`
      });
    }

    // Find the order by ObjectId or orderNumber
    let order = null;
    if (identifier.startsWith('AGR-')) {
      order = await Order.findOne({ orderNumber: identifier });
    } else {
      try {
        order = await Order.findById(identifier);
      } catch {
        order = await Order.findOne({ orderNumber: identifier });
      }
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order with reference "${identifier}" was not found.`
      });
    }

    // Verify state machine transition legality
    const currentStatus = order.status;
    if (!isValidStatusTransition(currentStatus, requestedStatus)) {
      return res.status(400).json({
        success: false,
        message: `Illegal lifecycle transition: cannot move order from "${currentStatus}" to "${requestedStatus}".`
      });
    }

    // Inventory Adjustment Trigger:
    // When moving from 'Pending' to 'Confirmed', decrement available produce stock
    if (currentStatus === 'Pending' && requestedStatus === 'Confirmed') {
      if (Array.isArray(order.items)) {
        for (const lineItem of order.items) {
          if (lineItem.productId && Product.findByIdAndUpdate) {
            try {
              await Product.findByIdAndUpdate(lineItem.productId, {
                $inc: { quantity: -lineItem.quantity }
              });
            } catch (err) {
              console.warn(`Could not adjust inventory for product ${lineItem.productId}:`, err);
            }
          }
        }
      }
    }

    // Restock adjustment if order is Cancelled after being Confirmed or In Transit
    if ((currentStatus === 'Confirmed' || currentStatus === 'In Transit') && requestedStatus === 'Cancelled') {
      if (Array.isArray(order.items)) {
        for (const lineItem of order.items) {
          if (lineItem.productId && Product.findByIdAndUpdate) {
            try {
              await Product.findByIdAndUpdate(lineItem.productId, {
                $inc: { quantity: lineItem.quantity }
              });
            } catch (err) {
              console.warn(`Could not restock product ${lineItem.productId}:`, err);
            }
          }
        }
      }
    }

    // Update order state fields
    order.status = requestedStatus;

    if (trackingNumber !== undefined) {
      order.trackingNumber = String(trackingNumber).trim();
    }

    if (cancellationReason !== undefined) {
      order.cancellationReason = String(cancellationReason).trim();
    }

    // Update paymentStatus to 'paid' when Delivered
    if (requestedStatus === 'Delivered' && order.paymentStatus === 'escrow') {
      order.paymentStatus = 'paid';
    }

    const updatedOrder = await order.save();

    // Trigger automated email alert to buyer when produce enters transit
    if (requestedStatus === 'In Transit' && updatedOrder.buyerEmail) {
      sendOrderDispatchedAlertToBuyer(updatedOrder.buyerEmail, updatedOrder).catch(err => {
        console.warn('Asynchronous buyer dispatch notification warning:', err.message);
      });
    }

    return res.status(200).json({
      success: true,
      message: `Order status successfully transitioned from "${currentStatus}" to "${requestedStatus}".`,
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order lifecycle status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update order status.',
      error: error.message
    });
  }
}

// Route definitions
router.post('/orders', createOrderController);
router.get('/orders/buyer', getBuyerOrdersController);
router.get('/orders/buyer/:email', getBuyerOrdersController);
router.get('/orders/farmer', getFarmerOrdersController);
router.get('/orders/farmer/:email', getFarmerOrdersController);
router.get('/orders/:id', getOrderByIdController);
router.patch('/orders/:id/status', updateOrderStatusController);

// Export router and isolated helper controllers for automated unit testing
module.exports = router;
module.exports.validateOrderPayload = validateOrderPayload;
module.exports.createOrderController = createOrderController;
module.exports.getBuyerOrdersController = getBuyerOrdersController;
module.exports.getFarmerOrdersController = getFarmerOrdersController;
module.exports.getOrderByIdController = getOrderByIdController;
module.exports.updateOrderStatusController = updateOrderStatusController;
module.exports.isValidStatusTransition = isValidStatusTransition;
