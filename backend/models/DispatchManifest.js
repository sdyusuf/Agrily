/**
 * ==============================================================================
 * AGRILY AGRICULTURAL LOGISTICS PLATFORM - DISPATCH CARGO MANIFEST MODEL
 * ==============================================================================
 * 
 * Module Description:
 * This module defines the Mongoose schema and model for legal agricultural freight
 * manifests and bills of lading. In inter-state and regional agricultural transit,
 * commercial haulage drivers must present verified cargo manifests at agricultural
 * quarantine checkpoints, state revenue inspection barriers, and wholesale market
 * arrival gates.
 * 
 * Domain Requirements:
 *  1. Statutory Agricultural Chain of Custody:
 *     - Records consignment breakdown per farm-gate pickup with producer tax identifiers,
 *       crop types, verified crate counts, and gross weight tonnage.
 *  2. Security Seals & Inspection Verifications:
 *     - Logs cargo hold tamper-evident seal serial numbers applied at dispatch and
 *       inspected at destination drop-off.
 *  3. Transit Authority & Quarantine Permits:
 *     - Stores phytosanitary clearance certificate numbers issued by federal/state
 *       plant protection agencies.
 * 
 * @module models/DispatchManifest
 * @requires mongoose
 */

const mongoose = require('mongoose');

const MANIFEST_STATUSES = [
  'ISSUED',     // Manifest created and electronically signed by dispatch manager
  'IN_TRANSIT', // Cargo actively transported under manifest authority
  'VERIFIED',   // Seals and consignments verified at destination receiving dock
  'DISCREPANCY',// Cargo mismatch detected between farm collection and receiving
  'VOIDED'      // Manifest cancelled prior to transit
];

const ConsignmentItemSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  stopSequence: {
    type: Number,
    required: true
  },
  farmerName: {
    type: String,
    required: true,
    trim: true
  },
  farmerPhone: {
    type: String,
    required: true,
    trim: true
  },
  farmLocation: {
    type: String,
    required: true,
    trim: true
  },
  produceName: {
    type: String,
    required: true,
    trim: true
  },
  produceCategory: {
    type: String,
    required: true,
    trim: true
  },
  manifestedWeightKg: {
    type: Number,
    required: true,
    min: 0.1
  },
  verifiedWeightKg: {
    type: Number,
    default: null
  },
  cratesCount: {
    type: Number,
    required: true,
    min: 1
  },
  packagingType: {
    type: String,
    default: 'plastic_crate'
  },
  perishabilityTier: {
    type: String,
    default: 'MEDIUM'
  },
  farmerSignature: {
    type: String,
    default: ''
  },
  driverInitial: {
    type: String,
    default: ''
  }
}, { _id: false });

const DispatchManifestSchema = new mongoose.Schema({
  manifestNumber: {
    type: String,
    required: [true, 'Manifest number is required'],
    unique: true,
    trim: true,
    uppercase: true,
    index: true
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OptimizedRoute',
    required: [true, 'Associated optimized route reference is required'],
    index: true
  },
  routeCode: {
    type: String,
    required: true,
    trim: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: [true, 'Assigned driver is required'],
    index: true
  },
  driverFullName: {
    type: String,
    required: [true, 'Driver full name is required'],
    trim: true
  },
  driverLicenseNumber: {
    type: String,
    required: [true, 'Driver license number is required'],
    trim: true
  },
  vehicleRegistrationNumber: {
    type: String,
    required: [true, 'Vehicle plate number is required'],
    trim: true,
    uppercase: true
  },
  vehicleMakeModel: {
    type: String,
    default: 'Commercial Haulage Truck'
  },
  departureDepot: {
    facilityName: { type: String, required: true },
    address: { type: String, required: true },
    cityState: { type: String, required: true }
  },
  destinationTerminal: {
    facilityName: { type: String, required: true },
    address: { type: String, required: true },
    cityState: { type: String, required: true }
  },
  consignments: {
    type: [ConsignmentItemSchema],
    default: []
  },
  summaryTotals: {
    totalWeightKg: { type: Number, default: 0 },
    totalCratesCount: { type: Number, default: 0 },
    totalStopsCount: { type: Number, default: 0 }
  },
  securitySeals: [{
    sealNumber: { type: String, trim: true, uppercase: true, required: true },
    appliedAt: { type: Date, default: Date.now },
    appliedBy: { type: String, trim: true, default: 'Depot Dispatcher' },
    tamperDetected: { type: Boolean, default: false }
  }],
  phytosanitaryPermitNumber: {
    type: String,
    trim: true,
    default: null
  },
  status: {
    type: String,
    enum: MANIFEST_STATUSES,
    default: 'ISSUED',
    index: true
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  receivedAt: {
    type: Date,
    default: null
  },
  receivingAgentName: {
    type: String,
    trim: true,
    default: ''
  },
  discrepancyNotes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

/**
 * Generates an official manifest number.
 * Format: MNF-YYYYMMDD-XXXX
 */
DispatchManifestSchema.statics.generateManifestNumber = function() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MNF-${year}${month}${day}-${random}`;
};

const DispatchManifest = mongoose.model('DispatchManifest', DispatchManifestSchema);

module.exports = {
  DispatchManifest,
  MANIFEST_STATUSES
};
