/**
 * ==============================================================================
 * 🌾 AGRILY AGRO-LOGISTICS PLATFORM: COMMERCIAL INVOICE DOMAIN MODEL
 * ==============================================================================
 *
 * @module models/CommercialInvoice
 * @description
 * Implements the automated Mongoose schema, financial calculation engine,
 * tax computation, escrow lock references, and audit tracking for agricultural
 * freight sales and transit transactions within the Agrily ecosystem.
 *
 * Each commercial invoice corresponds to a commercial bill of sale coupled with
 * logistics conveyance. It provides transparent financial settlement between
 * institutional food processors, bulk produce wholesalers, smallholder farmer
 * cooperatives, and freight transport fleet operators.
 *
 * Financial Breakdown Handled:
 *  1. Commodity Line Items: Net produce quantity x agreed contract unit price.
 *  2. Logistics & Freight Tariffs: Distance-based haulage fee + axle-load surcharge.
 *  3. Cold-Chain Surcharge: Specialized climate-controlled transport premium.
 *  4. Escrow Guarantee Fee: Agrily platform protection fee (1.5%).
 *  5. Value Added Tax (VAT): Statutory 7.5% tax calculation where applicable.
 *  6. Settlement Lifecycle: ISSUED -> PAID_TO_ESCROW -> RELEASED_TO_FARMER -> SETTLED.
 *
 * @version 1.0.0
 * @author Agrily Engineering Core
 * ==============================================================================
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Enumeration of allowable invoice payment and settlement statuses.
 */
const INVOICE_STATUSES = Object.freeze({
  DRAFT: 'DRAFT',                       // Preliminary pro-forma invoice
  ISSUED: 'ISSUED',                     // Official commercial invoice issued to buyer
  PAID_TO_ESCROW: 'PAID_TO_ESCROW',     // Funds committed and locked in Agrily multi-tier escrow
  RELEASED_TO_FARMER: 'RELEASED_TO_FARMER', // Produce accepted, farmer payout triggered
  SETTLED: 'SETTLED',                   // All parties (farmer, driver, platform) paid
  DISPUTED: 'DISPUTED',                 // Consignment defect dispute initiated
  REFUNDED: 'REFUNDED',                 // Escrow funds refunded to buyer
  VOIDED: 'VOIDED'                      // Invoice cancelled before settlement
});

/**
 * Standard African & international settlement currencies supported.
 */
const SUPPORTED_CURRENCIES = Object.freeze({
  NGN: 'NGN',                           // Nigerian Naira
  GHS: 'GHS',                           // Ghanaian Cedi
  KES: 'KES',                           // Kenyan Shilling
  USD: 'USD'                            // US Dollar
});

/**
 * Sub-schema: Invoice Line Item
 * Itemizes produce quantities, grade specs, and individual pricing.
 */
const InvoiceLineItemSchema = new mongoose.Schema({
  commodityName: {
    type: String,
    required: [true, 'Line item commodity name is required'],
    trim: true
  },
  variety: {
    type: String,
    trim: true,
    default: 'Grade 1 Wholesale'
  },
  unitOfMeasure: {
    type: String,
    enum: ['kg', 'ton', 'bag', 'crate', 'basket'],
    default: 'kg'
  },
  quantity: {
    type: Number,
    required: [true, 'Billed quantity is required'],
    min: [0.01, 'Quantity must be positive']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Agreed unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Line total cannot be negative']
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, { _id: true });

/**
 * Master Schema: CommercialInvoice
 */
const CommercialInvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
    uppercase: true,
    default: function() {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const randStr = crypto.randomBytes(3).toString('hex').toUpperCase();
      return `INV-${dateStr}-${randStr}`;
    }
  },
  waybillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DigitalWaybill',
    required: false,
    index: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: false,
    index: true
  },
  escrowTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EscrowTransaction',
    required: false,
    index: true
  },
  status: {
    type: String,
    enum: Object.values(INVOICE_STATUSES),
    default: INVOICE_STATUSES.ISSUED,
    index: true
  },
  currency: {
    type: String,
    enum: Object.values(SUPPORTED_CURRENCIES),
    default: SUPPORTED_CURRENCIES.NGN
  },

  // Billed Seller / Farmer Cooperative
  seller: {
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    entityName: { type: String, required: true, trim: true },
    taxIdentificationNumber: { type: String, default: 'TIN-NG-88912401', trim: true },
    contactEmail: { type: String, required: true, trim: true },
    contactPhone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    bankDetails: {
      bankName: { type: String, default: 'First Bank of Nigeria' },
      accountNumber: { type: String, default: '3091884210' },
      accountName: { type: String, default: 'Agro Cooperative Syndicate Ltd' }
    }
  },

  // Billed Buyer / Consignee
  buyer: {
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    entityName: { type: String, required: true, trim: true },
    taxIdentificationNumber: { type: String, default: 'TIN-NG-99210452', trim: true },
    contactEmail: { type: String, required: true, trim: true },
    contactPhone: { type: String, required: true, trim: true },
    billingAddress: { type: String, required: true, trim: true }
  },

  // Produce Line Items
  items: {
    type: [InvoiceLineItemSchema],
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: 'Invoice must contain at least one line item'
    }
  },

  // Financial Subtotals & Breakdown
  produceSubtotal: {
    type: Number,
    default: 0,
    min: [0, 'Produce subtotal cannot be negative']
  },
  freightHaulageFee: {
    type: Number,
    default: 0,
    min: [0, 'Haulage fee cannot be negative']
  },
  coldChainSurcharge: {
    type: Number,
    default: 0,
    min: [0, 'Cold-chain surcharge cannot be negative']
  },
  escrowProtectionFee: {
    type: Number,
    default: 0,
    min: [0, 'Escrow fee cannot be negative']
  },
  platformCommissionFee: {
    type: Number,
    default: 0,
    min: [0, 'Platform commission cannot be negative']
  },
  taxVatRatePercent: {
    type: Number,
    default: 7.5,
    min: [0, 'VAT rate cannot be negative']
  },
  taxVatAmount: {
    type: Number,
    default: 0,
    min: [0, 'VAT amount cannot be negative']
  },
  totalInvoiceAmount: {
    type: Number,
    default: 0,
    min: [0, 'Total invoice amount cannot be negative']
  },

  // Payment Terms & Due Dates
  paymentTerms: {
    type: String,
    enum: ['DUE_ON_RECEIPT', 'NET_7', 'NET_14', 'NET_30', 'ESCROW_FUNDED_UPFRONT'],
    default: 'ESCROW_FUNDED_UPFRONT'
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidAt: {
    type: Date,
    default: null
  },
  settledAt: {
    type: Date,
    default: null
  },

  // Digital Signature & Integrity Checksum
  invoiceChecksum: {
    type: String,
    default: ''
  },
  authorizedSignatory: {
    name: { type: String, default: 'Agrily Finance Controller' },
    title: { type: String, default: 'Chief Financial Officer' },
    signedAt: { type: Date, default: Date.now }
  },

  notes: {
    type: String,
    default: 'Payment secured via Agrily Smart Escrow. Funds disbursed upon consignee verification.'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
CommercialInvoiceSchema.index({ 'seller.farmerId': 1, status: 1 });
CommercialInvoiceSchema.index({ 'buyer.buyerId': 1, status: 1 });
CommercialInvoiceSchema.index({ issuedDate: -1, status: 1 });

/**
 * Virtual: Net Payout Due to Farmer Cooperative
 * Produce subtotal minus platform commission and escrow fee.
 */
CommercialInvoiceSchema.virtual('netFarmerPayout').get(function() {
  const produce = this.produceSubtotal || 0;
  const commission = this.platformCommissionFee || 0;
  return Math.max(0, Math.round((produce - commission) * 100) / 100);
});

/**
 * Virtual: Net Logistics Payout Due to Carrier
 * Freight haulage fee + cold-chain surcharge.
 */
CommercialInvoiceSchema.virtual('netCarrierPayout').get(function() {
  const freight = this.freightHaulageFee || 0;
  const coldChain = this.coldChainSurcharge || 0;
  return Math.round((freight + coldChain) * 100) / 100;
});

/**
 * Instance Method: Calculate and Reconcile Financials
 * Computes all line item totals, charges, statutory VAT, and grand total.
 */
CommercialInvoiceSchema.methods.recalculateFinancials = function() {
  if (!Array.isArray(this.items) || this.items.length === 0) {
    this.produceSubtotal = 0;
    this.totalInvoiceAmount = 0;
    return;
  }

  // Update line item totals
  let rawProduceSubtotal = 0;
  this.items.forEach(item => {
    item.totalAmount = Math.round((Number(item.quantity || 0) * Number(item.unitPrice || 0)) * 100) / 100;
    rawProduceSubtotal += item.totalAmount;
  });
  this.produceSubtotal = Math.round(rawProduceSubtotal * 100) / 100;

  // Standard platform rates:
  // Escrow protection fee: 1.5% of produce
  if (!this.escrowProtectionFee || this.isModified('items')) {
    this.escrowProtectionFee = Math.round((this.produceSubtotal * 0.015) * 100) / 100;
  }

  // Platform commission: 2.5% of produce
  if (!this.platformCommissionFee || this.isModified('items')) {
    this.platformCommissionFee = Math.round((this.produceSubtotal * 0.025) * 100) / 100;
  }

  // Taxable basis: Freight + Platform services (Produce itself is exempt from VAT in many agro jurisdictions)
  const taxableServices = (this.freightHaulageFee || 0) + (this.coldChainSurcharge || 0) + this.platformCommissionFee;
  const vatRate = (this.taxVatRatePercent || 0) / 100;
  this.taxVatAmount = Math.round((taxableServices * vatRate) * 100) / 100;

  // Grand total invoice amount
  const grandTotal = this.produceSubtotal +
    (this.freightHaulageFee || 0) +
    (this.coldChainSurcharge || 0) +
    (this.escrowProtectionFee || 0) +
    this.taxVatAmount;

  this.totalInvoiceAmount = Math.round(grandTotal * 100) / 100;

  // Re-generate checksum
  this.generateChecksum();
};

/**
 * Instance Method: Generate Financial Integrity Checksum
 * Generates an immutable SHA-256 hash across invoice financial parameters.
 */
CommercialInvoiceSchema.methods.generateChecksum = function() {
  const payload = [
    this.invoiceNumber,
    this.status,
    this.currency,
    this.produceSubtotal,
    this.freightHaulageFee,
    this.totalInvoiceAmount,
    this.seller?.entityName,
    this.buyer?.entityName,
    this.dueDate ? new Date(this.dueDate).toISOString().slice(0, 10) : ''
  ].join('|');

  this.invoiceChecksum = crypto.createHash('sha256').update(payload).digest('hex');
  return this.invoiceChecksum;
};

/**
 * Pre-save Mongoose middleware
 */
CommercialInvoiceSchema.pre('save', function(next) {
  if (this.isModified('items') || this.isModified('freightHaulageFee') || this.isModified('coldChainSurcharge')) {
    this.recalculateFinancials();
  }
  if (!this.invoiceChecksum) {
    this.generateChecksum();
  }
  next();
});

const CommercialInvoice = mongoose.model('CommercialInvoice', CommercialInvoiceSchema);

module.exports = {
  CommercialInvoice,
  INVOICE_STATUSES,
  SUPPORTED_CURRENCIES
};
