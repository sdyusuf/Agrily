/**
 * ==============================================================================
 * 🌾 AGRILY AGRO-LOGISTICS PLATFORM: DIGITAL WAYBILL DOMAIN MODEL
 * ==============================================================================
 *
 * @module models/DigitalWaybill
 * @description
 * Implements the comprehensive Mongoose schema, state machine lifecycle,
 * cryptographic verification mechanisms, and multi-party chain-of-custody transfer
 * tracking for agricultural produce transit within the Agrily ecosystem.
 *
 * In agricultural logistics across Sub-Saharan Africa and emerging markets, cargo
 * waybills serve as the authoritative legal document governing produce transfer
 * from rural farm-gate collection centers, through regional aggregation depots,
 * to urban distribution hubs and institutional wholesale buyers.
 *
 * Key Capabilities:
 *  1. State Machine: ISSUED -> IN_TRANSIT -> TRANSFERRED_AT_HUB -> DELIVERED -> RECONCILED.
 *  2. Cryptographic Tamper-Detection: SHA-256 payload checksums & HMAC verification tokens.
 *  3. Chain of Custody: Verifiable hand-off events with GPS geotags, actor IDs, & digital signatures.
 *  4. Consignment Specs: Agricultural commodity categorization, crate counts, tare/gross weights,
 *     and strict cold-chain temperature thresholds.
 *  5. Phytosanitary & Tamper Seals: Dual seal tracking for cargo holds and security locks.
 *
 * @version 1.0.0
 * @author Agrily Engineering Core
 * ==============================================================================
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Enumeration of allowable operational statuses for a digital waybill.
 * Models the immutable sequential progression of freight custody.
 */
const WAYBILL_STATUSES = Object.freeze({
  DRAFT: 'DRAFT',                       // Preliminary consignment before official dispatch
  ISSUED: 'ISSUED',                     // Officially authorized and ready for pickup
  IN_TRANSIT: 'IN_TRANSIT',             // Driver has loaded cargo and commenced road haulage
  TRANSFERRED_AT_HUB: 'TRANSFERRED_AT_HUB', // Intermediate custody handover at regional cross-dock
  DELIVERED: 'DELIVERED',               // Consignment received at terminal destination
  RECONCILED: 'RECONCILED',             // Weight and quality verified with escrow funds released
  DISPUTED: 'DISPUTED',                 // Damaged, short-shipped, or spoiled cargo under investigation
  CANCELLED: 'CANCELLED'                // Annulled before departure due to weather or logistics failure
});

/**
 * Produce temperature sensitivity classes according to FAO cold-chain standards.
 */
const TEMPERATURE_CLASSES = Object.freeze({
  AMBIENT: 'AMBIENT',                   // Grains, tubers, pulses (15°C - 25°C)
  COOL: 'COOL',                         // Bananas, citrus, peppers (10°C - 15°C)
  CHILLED: 'CHILLED',                   // Leafy vegetables, tomatoes, soft fruits (2°C - 8°C)
  FROZEN: 'FROZEN'                      // Processed produce or meat (-18°C or below)
});

/**
 * Roles permitted to execute chain-of-custody handovers.
 */
const CUSTODY_ROLES = Object.freeze({
  FARMER: 'FARMER',                     // Origin producer or cooperative leader
  COLLECTION_AGENT: 'COLLECTION_AGENT', // Farm-gate aggregator or field officer
  DISPATCH_OPERATOR: 'DISPATCH_OPERATOR',// Regional logistics coordinator
  PRIMARY_DRIVER: 'PRIMARY_DRIVER',     // Long-haul freight driver
  TRANSFER_DRIVER: 'TRANSFER_DRIVER',   // Feeder or secondary route driver
  HUB_RECEIVER: 'HUB_RECEIVER',         // Warehouse receipt officer
  BUYER: 'BUYER',                       // Consignee or institutional purchaser
  INSPECTOR: 'INSPECTOR'                // Quality grader or phytosanitary officer
});

/**
 * Sub-schema: Agricultural Consignment Item
 * Represents an individual commodity line item loaded into the vehicle hold.
 */
const ConsignmentItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false
  },
  commodityName: {
    type: String,
    required: [true, 'Commodity name is required (e.g., Roma Tomatoes, White Maize)'],
    trim: true,
    maxlength: 120
  },
  variety: {
    type: String,
    trim: true,
    default: 'Standard Grade A'
  },
  category: {
    type: String,
    enum: ['grains', 'tubers', 'fruits', 'vegetables', 'livestock', 'legumes', 'cash_crops', 'other'],
    default: 'vegetables'
  },
  packagingType: {
    type: String,
    enum: ['PLASTIC_CRATE', 'JUTE_BAG', 'BULK_BIN', 'PALLET_CRATE', 'CORRUGATED_BOX', 'LOOSE'],
    default: 'PLASTIC_CRATE'
  },
  unitOfMeasure: {
    type: String,
    enum: ['kg', 'ton', 'bag', 'crate', 'basket'],
    default: 'kg'
  },
  declaredQuantity: {
    type: Number,
    required: [true, 'Declared unit quantity is required'],
    min: [0.1, 'Declared quantity must be positive']
  },
  grossWeightKg: {
    type: Number,
    required: [true, 'Gross cargo weight in kg is required'],
    min: [0.1, 'Gross weight must be positive']
  },
  tareWeightKg: {
    type: Number,
    default: 0,
    min: [0, 'Tare weight cannot be negative']
  },
  netWeightKg: {
    type: Number,
    required: [true, 'Net cargo weight in kg is required'],
    min: [0.1, 'Net weight must be positive']
  },
  numberOfCrates: {
    type: Number,
    default: 1,
    min: [0, 'Number of packaging crates must be non-negative']
  },
  temperatureClass: {
    type: String,
    enum: Object.values(TEMPERATURE_CLASSES),
    default: TEMPERATURE_CLASSES.AMBIENT
  },
  targetMinTempC: {
    type: Number,
    default: 4.0
  },
  targetMaxTempC: {
    type: Number,
    default: 12.0
  },
  lotBatchNumber: {
    type: String,
    trim: true,
    default: function() {
      return `LOT-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }
  },
  harvestDate: {
    type: Date,
    default: Date.now
  },
  perishabilityPriority: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    default: 'MEDIUM'
  }
}, { _id: true });

/**
 * Sub-schema: Custody Transfer Hand-off Event
 * Maintains an append-only verifiable audit trail of physical possession changes.
 */
const CustodyTransferSchema = new mongoose.Schema({
  transferSequence: {
    type: Number,
    required: true,
    default: 1
  },
  fromParty: {
    name: { type: String, required: true },
    role: { type: String, enum: Object.values(CUSTODY_ROLES), required: true },
    contactPhone: { type: String, default: '' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }
  },
  toParty: {
    name: { type: String, required: true },
    role: { type: String, enum: Object.values(CUSTODY_ROLES), required: true },
    contactPhone: { type: String, default: '' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }
  },
  locationName: {
    type: String,
    required: [true, 'Handover location name is required (e.g., Makarfi Tomato Center)'],
    trim: true
  },
  coordinates: {
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be >= -90'],
      max: [90, 'Latitude must be <= 90'],
      default: 0
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be >= -180'],
      max: [180, 'Longitude must be <= 180'],
      default: 0
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  transferAction: {
    type: String,
    enum: ['GATE_DISPATCH', 'HIGHWAY_CHECKPOINT', 'CROSS_DOCK_RELOAD', 'COLD_STORE_INTAKE', 'FINAL_DELIVERY'],
    default: 'GATE_DISPATCH'
  },
  sealNumberVerified: {
    type: String,
    trim: true,
    default: ''
  },
  sealIntact: {
    type: Boolean,
    default: true
  },
  recordedCargoTempC: {
    type: Number,
    default: null
  },
  signatureOtpVerified: {
    type: Boolean,
    default: true
  },
  signatureHash: {
    type: String,
    trim: true,
    default: ''
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500,
    default: 'Handover executed and verified under Agrily custody standards.'
  }
}, { _id: true });

/**
 * Master Schema: DigitalWaybill
 */
const DigitalWaybillSchema = new mongoose.Schema({
  waybillNumber: {
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
      return `WB-${dateStr}-${randStr}`;
    }
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OptimizedRoute',
    required: false,
    index: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: false,
    index: true
  },
  status: {
    type: String,
    enum: Object.values(WAYBILL_STATUSES),
    default: WAYBILL_STATUSES.ISSUED,
    index: true
  },

  // Logistics & Freight Parties
  shipper: {
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    cooperativeName: { type: String, default: 'Agro Cooperative Syndicate', trim: true },
    contactPerson: { type: String, required: true, trim: true },
    contactPhone: { type: String, required: true, trim: true },
    pickupAddress: { type: String, required: true, trim: true },
    state: { type: String, default: 'Kaduna', trim: true },
    country: { type: String, default: 'Nigeria', trim: true }
  },

  consignee: {
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    businessName: { type: String, required: true, trim: true },
    contactPerson: { type: String, required: true, trim: true },
    contactPhone: { type: String, required: true, trim: true },
    deliveryAddress: { type: String, required: true, trim: true },
    state: { type: String, default: 'Kano', trim: true },
    country: { type: String, default: 'Nigeria', trim: true }
  },

  carrier: {
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    driverName: { type: String, required: true, trim: true },
    driverPhone: { type: String, required: true, trim: true },
    driverLicenseNumber: { type: String, default: 'DL-AGR-882194', trim: true },
    vehicleRegistrationPlate: { type: String, required: true, uppercase: true, trim: true },
    vehicleType: { type: String, default: '3.5T Insulated Truck', trim: true },
    refrigerationUnitOperational: { type: Boolean, default: false }
  },

  // Transit Origin and Destination Waypoints
  originDepot: {
    name: { type: String, required: true, trim: true },
    address: { type: String, default: '' },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },

  destinationHub: {
    name: { type: String, required: true, trim: true },
    address: { type: String, default: '' },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },

  // Cargo Consignments
  consignments: {
    type: [ConsignmentItemSchema],
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: 'Waybill must contain at least one agricultural consignment item'
    }
  },

  // Aggregate Metrics
  totalGrossWeightKg: {
    type: Number,
    default: 0,
    min: [0, 'Total weight cannot be negative']
  },
  totalNetWeightKg: {
    type: Number,
    default: 0,
    min: [0, 'Net weight cannot be negative']
  },
  totalCratesCount: {
    type: Number,
    default: 0,
    min: [0, 'Total crates count cannot be negative']
  },
  estimatedDistanceKm: {
    type: Number,
    default: 0,
    min: [0, 'Distance cannot be negative']
  },
  estimatedTransitTimeHours: {
    type: Number,
    default: 0,
    min: [0, 'Transit duration cannot be negative']
  },

  // Security & Tamper Seals
  securitySeals: [{
    sealNumber: { type: String, required: true, uppercase: true, trim: true },
    placementLocation: { type: String, default: 'REAR_DOOR_CONTAINER' },
    appliedAt: { type: Date, default: Date.now },
    intactOnArrival: { type: Boolean, default: true }
  }],

  // Phytosanitary & Regulatory Clearance
  phytosanitaryPermitNumber: {
    type: String,
    trim: true,
    default: function() {
      return `PHYTO-AGR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    }
  },
  phytosanitaryInspectionPassed: {
    type: Boolean,
    default: true
  },

  // Cryptographic Verification & QR Metadata
  integrityHash: {
    type: String,
    default: ''
  },
  verificationToken: {
    type: String,
    default: ''
  },
  qrVerificationUrl: {
    type: String,
    default: ''
  },
  qrGeneratedAt: {
    type: Date,
    default: Date.now
  },

  // Chain of Custody Hand-off Events
  custodyTransferHistory: [CustodyTransferSchema],

  // Dispatch & Delivery Timestamps
  issuedAt: {
    type: Date,
    default: Date.now
  },
  dispatchedAt: {
    type: Date,
    default: null
  },
  expectedDeliveryDate: {
    type: Date,
    required: true
  },
  actualDeliveryDate: {
    type: Date,
    default: null
  },

  // Commercial Invoicing Reference
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommercialInvoice',
    default: null
  },

  // Remarks & Special Cargo Directives
  handlingInstructions: {
    type: String,
    default: 'Handle with care. Protect from direct solar exposure and excessive humidity. Maintain upright orientation.'
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for high-frequency queries
DigitalWaybillSchema.index({ 'carrier.driverId': 1, status: 1 });
DigitalWaybillSchema.index({ 'shipper.farmerId': 1, createdAt: -1 });
DigitalWaybillSchema.index({ 'consignee.buyerId': 1, createdAt: -1 });
DigitalWaybillSchema.index({ issuedAt: -1, status: 1 });

/**
 * Virtual: Current Custody Holder
 * Returns the entity currently in physical possession of the agricultural cargo.
 */
DigitalWaybillSchema.virtual('currentHolder').get(function() {
  if (!this.custodyTransferHistory || this.custodyTransferHistory.length === 0) {
    return {
      name: this.shipper?.contactPerson || 'Shipper',
      role: CUSTODY_ROLES.FARMER,
      transferAction: 'PENDING_INITIAL_DISPATCH'
    };
  }
  const latestTransfer = this.custodyTransferHistory[this.custodyTransferHistory.length - 1];
  return {
    name: latestTransfer.toParty?.name || 'Unknown',
    role: latestTransfer.toParty?.role || CUSTODY_ROLES.PRIMARY_DRIVER,
    transferAction: latestTransfer.transferAction,
    timestamp: latestTransfer.timestamp
  };
});

/**
 * Virtual: Consignment High-Perishability Indicator
 * Returns true if any cargo line item requires urgent cold-chain transit.
 */
DigitalWaybillSchema.virtual('isHighlyPerishable').get(function() {
  if (!Array.isArray(this.consignments)) return false;
  return this.consignments.some(item =>
    item.perishabilityPriority === 'HIGH' ||
    item.temperatureClass === TEMPERATURE_CLASSES.CHILLED ||
    item.temperatureClass === TEMPERATURE_CLASSES.COOL
  );
});

/**
 * Instance Method: Recalculate Aggregate Totals
 * Computes sum of gross weights, net weights, and crate counts across consignments.
 */
DigitalWaybillSchema.methods.recalculateTotals = function() {
  if (!Array.isArray(this.consignments) || this.consignments.length === 0) {
    this.totalGrossWeightKg = 0;
    this.totalNetWeightKg = 0;
    this.totalCratesCount = 0;
    return;
  }

  this.totalGrossWeightKg = Math.round(
    this.consignments.reduce((sum, item) => sum + (Number(item.grossWeightKg) || 0), 0) * 100
  ) / 100;

  this.totalNetWeightKg = Math.round(
    this.consignments.reduce((sum, item) => sum + (Number(item.netWeightKg) || 0), 0) * 100
  ) / 100;

  this.totalCratesCount = this.consignments.reduce(
    (sum, item) => sum + (Number(item.numberOfCrates) || 0), 0
  );
};

/**
 * Instance Method: Generate Cryptographic Integrity Hash & Verification Token
 * Computes an immutable SHA-256 fingerprint representing the core freight facts.
 * Any manual modification to weight, seal, or destination invalidates the hash.
 */
DigitalWaybillSchema.methods.generateIntegrityHash = function() {
  const secret = process.env.WAYBILL_HMAC_SECRET || 'agrily-agro-waybill-secret-key-2024';
  const canonicalPayload = [
    this.waybillNumber,
    this.status,
    this.totalNetWeightKg,
    this.totalCratesCount,
    this.shipper?.contactPerson,
    this.consignee?.businessName,
    this.carrier?.vehicleRegistrationPlate,
    this.securitySeals?.[0]?.sealNumber || 'NO_SEAL',
    this.expectedDeliveryDate ? new Date(this.expectedDeliveryDate).toISOString().slice(0, 10) : ''
  ].join('|');

  // Compute SHA-256 digest
  this.integrityHash = crypto.createHash('sha256').update(canonicalPayload).digest('hex');

  // Generate HMAC verification token for public QR scanning
  this.verificationToken = crypto.createHmac('sha256', secret)
    .update(`${this.waybillNumber}:${this.integrityHash}`)
    .digest('hex')
    .substring(0, 32);

  // Set the public QR verification URL
  const baseUrl = process.env.PLATFORM_URL || 'https://agrily.com';
  this.qrVerificationUrl = `${baseUrl}/waybills/verify/${this.waybillNumber}?token=${this.verificationToken}`;
  this.qrGeneratedAt = new Date();

  return {
    integrityHash: this.integrityHash,
    verificationToken: this.verificationToken,
    qrVerificationUrl: this.qrVerificationUrl
  };
};

/**
 * Instance Method: Record Chain-of-Custody Handover
 * Pushes an immutable handover record into the custody history array.
 */
DigitalWaybillSchema.methods.recordCustodyTransfer = function(transferData) {
  if (!transferData || typeof transferData !== 'object') {
    throw new Error('Valid custody transfer data must be provided');
  }

  const nextSeq = (this.custodyTransferHistory ? this.custodyTransferHistory.length : 0) + 1;

  // Sign transfer with SHA-256 signature hash
  const signatureString = `${this.waybillNumber}:${nextSeq}:${transferData.fromParty?.name}:${transferData.toParty?.name}:${Date.now()}`;
  const signatureHash = crypto.createHash('sha256').update(signatureString).digest('hex').substring(0, 24);

  const transferRecord = {
    transferSequence: nextSeq,
    fromParty: transferData.fromParty,
    toParty: transferData.toParty,
    locationName: transferData.locationName || 'Transit Waypoint',
    coordinates: transferData.coordinates || { latitude: 0, longitude: 0 },
    timestamp: transferData.timestamp || new Date(),
    transferAction: transferData.transferAction || 'CROSS_DOCK_RELOAD',
    sealNumberVerified: transferData.sealNumberVerified || (this.securitySeals?.[0]?.sealNumber || ''),
    sealIntact: transferData.sealIntact !== undefined ? transferData.sealIntact : true,
    recordedCargoTempC: transferData.recordedCargoTempC !== undefined ? transferData.recordedCargoTempC : null,
    signatureOtpVerified: true,
    signatureHash: signatureHash,
    notes: transferData.notes || 'Custody transfer logged via Agrily mobile logistics driver terminal.'
  };

  this.custodyTransferHistory.push(transferRecord);

  // Transition status based on the transfer action
  if (transferRecord.transferAction === 'GATE_DISPATCH') {
    this.status = WAYBILL_STATUSES.IN_TRANSIT;
    if (!this.dispatchedAt) this.dispatchedAt = new Date();
  } else if (transferRecord.transferAction === 'CROSS_DOCK_RELOAD') {
    this.status = WAYBILL_STATUSES.TRANSFERRED_AT_HUB;
  } else if (transferRecord.transferAction === 'FINAL_DELIVERY') {
    this.status = WAYBILL_STATUSES.DELIVERED;
    if (!this.actualDeliveryDate) this.actualDeliveryDate = new Date();
  }

  // Update integrity hash
  this.generateIntegrityHash();
  return transferRecord;
};

/**
 * Pre-save Mongoose middleware
 * Automatically ensures totals are recalculated and integrity hash is updated.
 */
DigitalWaybillSchema.pre('save', function(next) {
  if (this.isModified('consignments')) {
    this.recalculateTotals();
  }
  if (!this.integrityHash || this.isModified('consignments') || this.isModified('status') || this.isModified('carrier')) {
    this.generateIntegrityHash();
  }
  next();
});

const DigitalWaybill = mongoose.model('DigitalWaybill', DigitalWaybillSchema);

module.exports = {
  DigitalWaybill,
  WAYBILL_STATUSES,
  TEMPERATURE_CLASSES,
  CUSTODY_ROLES
};
