/**
 * ==============================================================================
 * AGRILY AGRICULTURAL COMMERCE PLATFORM - ORDER DOMAIN MODEL
 * ==============================================================================
 * 
 * Module Description:
 * This module defines the comprehensive Mongoose schema and model for agricultural
 * procurement orders within the Agrily ecosystem. It models multi-item transactions
 * between commercial produce buyers (wholesalers, retailers, food processors, consumers)
 * and verified agricultural producers/farmers.
 * 
 * Supply Chain Domain Lifecycle:
 * In wholesale agricultural commerce, transactions move through several stages:
 *  1. Order Placement ('Pending'): Buyer aggregates produce items into cart, enters
 *     farm-gate or warehouse delivery logistics, and submits order.
 *  2. Producer Review & Confirmation ('Confirmed'): Farmer reviews inventory allocations,
 *     verifies harvest readiness, and confirms fulfillment feasibility.
 *  3. Dispatch & Transit ('In Transit'): Produce is graded, packed into standard crates/bags,
 *     loaded onto cold-chain or ambient haulage vehicles, and leaves farm gate.
 *  4. Delivery & Quality Acceptance ('Delivered'): Logistics provider completes drop-off,
 *     buyer inspects produce quality against specifications, and payment escrow releases.
 *  5. Exception & Cancellation ('Cancelled'): Occurs prior to transit if produce is damaged,
 *     weather prevents harvest, or logistics fail reconciliation.
 * 
 * @module models/Order
 * @requires mongoose
 */

const mongoose = require('mongoose');

/**
 * Standard produce measurement units supported across Agrily orders.
 * Kept strictly synchronized with Produce schema standard packaging units.
 * @constant {string[]}
 */
const supportedUnits = [
  'kg',
  'bag',
  'crate',
  'ton',
  'basket',
  'piece',
  'liter'
];

/**
 * Valid lifecycle states for agricultural purchase orders.
 * @constant {string[]}
 */
const orderLifecycleStatuses = [
  'Pending',
  'Confirmed',
  'In Transit',
  'Delivered',
  'Cancelled'
];

/**
 * Valid escrow payment status stages.
 * @constant {string[]}
 */
const paymentStatuses = [
  'unpaid',
  'escrow',
  'paid',
  'refunded'
];

/**
 * Sub-schema for individual produce line items within an agricultural order.
 * Represents snapshot of product pricing and packaging at moment of purchase.
 */
const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Produce reference ID is required for order items']
    },
    name: {
      type: String,
      required: [true, 'Produce item name snapshot is required'],
      trim: true
    },
    unit: {
      type: String,
      enum: {
        values: supportedUnits,
        message: '{VALUE} is not a valid agricultural measurement unit'
      },
      default: 'kg',
      lowercase: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: [true, 'Order item quantity is required'],
      min: [1, 'Purchased quantity must be at least 1 unit']
    },
    price: {
      type: Number,
      required: [true, 'Unit price snapshot is required'],
      min: [0, 'Item price cannot be negative']
    },
    ownerEmail: {
      type: String,
      required: [true, 'Producing farmer email is required for fulfillment allocation'],
      lowercase: true,
      trim: true
    },
    imageURL: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    _id: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/**
 * Virtual calculation for total line item cost (quantity * price).
 * @name orderItemSchema#lineTotal
 * @returns {number} Subtotal for this specific line item
 */
orderItemSchema.virtual('lineTotal').get(function () {
  const qty = Number(this.quantity) || 0;
  const price = Number(this.price) || 0;
  return Number((qty * price).toFixed(2));
});

/**
 * Sub-schema for freight delivery location and recipient destination.
 */
const deliveryAddressSchema = new mongoose.Schema(
  {
    street: {
      type: String,
      required: [true, 'Street or farm drop-off address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'Destination city or LGA is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'Destination state or province is required'],
      trim: true
    },
    postalCode: {
      type: String,
      default: '',
      trim: true
    },
    country: {
      type: String,
      default: 'Nigeria',
      trim: true
    },
    specialInstructions: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    _id: false
  }
);

/**
 * Master Agricultural Order Schema
 */
const orderSchema = new mongoose.Schema(
  {
    /**
     * Unique human-readable procurement order reference code.
     * Example: AGR-20240220-AB4F
     */
    orderNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      default: function () {
        const timestamp = Date.now().toString(36).toUpperCase();
        const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `AGR-${timestamp}-${randomHex}`;
      }
    },

    /**
     * Authenticated account email address of the buyer.
     */
    buyerEmail: {
      type: String,
      required: [true, 'Buyer email is required for order ownership'],
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid buyer email address'
      ]
    },

    /**
     * Full legal or trading name of the procuring buyer.
     */
    buyerName: {
      type: String,
      default: '',
      trim: true
    },

    /**
     * Contact phone number for logistics drivers and gatehouse check-in.
     */
    buyerPhone: {
      type: String,
      default: '',
      trim: true
    },

    /**
     * Primary producer farmer email associated with this order.
     */
    farmerEmail: {
      type: String,
      default: function () {
        return (this.items && this.items[0] && this.items[0].ownerEmail) ? this.items[0].ownerEmail.toLowerCase() : '';
      },
      lowercase: true,
      trim: true
    },

    /**
     * Array of produce items included in this procurement consignment.
     */
    items: {
      type: [orderItemSchema],
      validate: {
        validator: function (items) {
          return Array.isArray(items) && items.length > 0;
        },
        message: 'An agricultural order must contain at least one produce item'
      }
    },

    /**
     * Gross monetary order total in local currency (NGN).
     */
    totalAmount: {
      type: Number,
      required: [true, 'Total order amount is required'],
      min: [0, 'Total order amount cannot be negative'],
      default: function () {
        if (Array.isArray(this.items) && this.items.length > 0) {
          return this.items.reduce((sum, item) => {
            const q = Number(item.quantity) || 0;
            const p = Number(item.price) || 0;
            return sum + (q * p);
          }, 0);
        }
        return 0;
      }
    },

    /**
     * Logistics destination details for produce transport.
     */
    deliveryAddress: {
      type: deliveryAddressSchema,
      required: [true, 'Delivery address information is required']
    },

    /**
     * Current supply chain progress status.
     */
    status: {
      type: String,
      enum: {
        values: orderLifecycleStatuses,
        message: '{VALUE} is not a recognised order lifecycle status'
      },
      default: 'Pending',
      trim: true
    },

    /**
     * Status of financial reconciliation and settlement.
     */
    paymentStatus: {
      type: String,
      enum: {
        values: paymentStatuses,
        message: '{VALUE} is not a valid escrow payment status'
      },
      default: 'unpaid',
      lowercase: true,
      trim: true
    },

    /**
     * Logistic consignment or waybill tracking number.
     */
    trackingNumber: {
      type: String,
      default: '',
      trim: true
    },

    /**
     * Explanatory note if order is revoked or rejected.
     */
    cancellationReason: {
      type: String,
      default: '',
      trim: true
    },

    /**
     * Additional logistical or temperature requirements (e.g. perishable storage).
     */
    notes: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/**
 * Pre-save lifecycle hook:
 * Automatically computes order total if not explicitly provided or to prevent discrepancies.
 * Generates human-friendly order reference number if unset.
 */
orderSchema.pre('validate', function (next) {
  // Generate human-friendly reference if absent
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderNumber = `AGR-${timestamp}-${randomHex}`;
  }

  // Recalculate total amount from items if needed
  if (Array.isArray(this.items) && this.items.length > 0) {
    const computedTotal = this.items.reduce((sum, item) => {
      const q = Number(item.quantity) || 0;
      const p = Number(item.price) || 0;
      return sum + q * p;
    }, 0);

    // If totalAmount was not provided or is 0, initialize to computed total
    if (this.totalAmount === undefined || this.totalAmount === null || this.totalAmount === 0) {
      this.totalAmount = Number(computedTotal.toFixed(2));
    }
  }

  // Populate primary farmerEmail from first item if empty
  if (!this.farmerEmail && Array.isArray(this.items) && this.items.length > 0) {
    this.farmerEmail = this.items[0].ownerEmail || '';
  }

  next();
});

/**
 * Compile Order Model
 */
const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
module.exports.supportedUnits = supportedUnits;
module.exports.orderLifecycleStatuses = orderLifecycleStatuses;
module.exports.paymentStatuses = paymentStatuses;
