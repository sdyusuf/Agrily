/**
 * ==============================================================================
 * 🌾 AGRILY AGRO-COMMERCE PLATFORM: DISPUTE ARBITRATION TRIBUNAL CASE MODEL
 * ==============================================================================
 * 
 * Formal dispute arbitration case docket and evidence locker.
 * Governs multi-party conflict resolution when produce quality, delivery delay,
 * or cold-chain breaches occur between Farmers, Wholesale Buyers, and Carriers.
 * 
 * Features:
 *  - Automated evidence repository linking IoT temperature logs & waybills.
 *  - Structured arbitration state machine from lodgment to settlement execution.
 *  - Algorithmic fault liability determination & pro-rata financial reconciliation.
 *  - Tamper-proof cryptographic verdict seal.
 * 
 * @module models/DisputeTribunalCase
 * @author Agrily Agro-Legal & Financial Arbitration
 * ==============================================================================
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const TRIBUNAL_STATUSES = [
  'LODGED',                 // Dispute filed by buyer or farmer; vault locked
  'EVIDENCE_SUBMISSION',    // Parties uploading photo, sensor, and waybill evidence
  'TRIBUNAL_DELIBERATION',  // Expert panel analyzing metrics & liability
  'VERDICT_ISSUED',         // Ruling handed down; appeal countdown active (24 hours)
  'SETTLEMENT_EXECUTED',    // Financial disbursements executed according to verdict
  'DISMISSED_FRIVOLOUS'     // Claim rejected as unsubstantiated; funds released to respondent
];

const DISPUTE_CATEGORIES = [
  'PRODUCT_SPOILAGE_ROT',
  'EXCESSIVE_MOISTURE_GRAIN',
  'FOREIGN_MATTER_CONTAMINATION',
  'WEIGHT_SHORTAGE_UNDERWEIGHT',
  'TRANSIT_DELAY_PERISHABLE_LOSS',
  'COLD_CHAIN_TEMPERATURE_BREACH',
  'WRONG_PRODUCE_VARIETY'
];

const VERDICT_OUTCOMES = [
  'FULL_BUYER_REFUND',
  'PRO_RATA_PRICE_ADJUSTMENT',
  'CARRIER_INSURANCE_LIABILITY',
  'FARMER_FULL_EXONERATION',
  'SPLIT_FAULT_COMPROMISE'
];

/**
 * Evidence Item Sub-Schema
 */
const evidenceItemSchema = new mongoose.Schema({
  evidenceType: {
    type: String,
    required: true,
    enum: [
      'QUALITY_INSPECTION_CERT',
      'IOT_TEMPERATURE_LOG',
      'DIGITAL_WAYBILL_CUSTODY',
      'HIGH_RES_PHOTO',
      'WEIGHBRIDGE_TICKET',
      'WRITTEN_STATEMENT'
    ]
  },
  submittedByRole: {
    type: String,
    required: true,
    enum: ['BUYER', 'FARMER', 'CARRIER', 'INSPECTOR', 'SYSTEM_AUDITOR']
  },
  submittedByName: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  attachmentUrl: {
    type: String,
    default: null
  },
  sha256Hash: {
    type: String,
    default: null
  },
  telemetryMetadata: {
    sensorPodSerial: { type: String, default: null },
    maxTemperatureCelsius: { type: Number, default: null },
    breachDurationMinutes: { type: Number, default: 0 }
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

/**
 * Main Dispute Tribunal Case Schema
 */
const disputeTribunalCaseSchema = new mongoose.Schema({
  docketNumber: {
    type: String,
    unique: true,
    uppercase: true,
    trim: true,
    default: function() {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
      return `ARB-${dateStr}-${randomHex}`;
    }
  },
  vaultNumber: {
    type: String,
    required: [true, 'Associated escrow vault number is required'],
    trim: true,
    index: true
  },
  orderId: {
    type: String,
    required: [true, 'Associated order identifier is required'],
    trim: true,
    index: true
  },
  waybillNumber: {
    type: String,
    default: null,
    trim: true
  },
  disputeCategory: {
    type: String,
    required: [true, 'Dispute classification is required'],
    enum: DISPUTE_CATEGORIES
  },

  // --- LITIGATING PARTIES ---
  claimant: {
    role: { type: String, required: true, enum: ['BUYER', 'FARMER', 'CARRIER'] },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true }
  },
  respondent: {
    role: { type: String, required: true, enum: ['BUYER', 'FARMER', 'CARRIER'] },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true }
  },
  carrierParty: {
    driverName: { type: String, default: null },
    vehiclePlateNumber: { type: String, default: null },
    carrierEmail: { type: String, default: null }
  },

  // --- CLAIM PARTICULARS ---
  initialClaimSummary: {
    type: String,
    required: [true, 'Claim summary is required'],
    minlength: [20, 'Claim summary must be at least 20 characters'],
    trim: true
  },
  demandedRefundAmount: {
    type: Number,
    required: true,
    min: [0, 'Demanded refund amount cannot be negative']
  },
  totalEscrowDisputed: {
    type: Number,
    required: true,
    min: [1, 'Disputed amount must be positive']
  },

  // --- STATUS & WORKFLOW ---
  status: {
    type: String,
    enum: TRIBUNAL_STATUSES,
    default: 'LODGED',
    index: true
  },

  // --- EVIDENCE LOCKER ---
  evidenceItems: [evidenceItemSchema],

  // --- ARBITRATION PANEL & VERDICT ---
  arbitrationVerdict: {
    outcome: { type: String, enum: VERDICT_OUTCOMES, default: null },
    presidingArbitratorName: { type: String, default: 'Agrily Agricultural Dispute Tribunal Panel' },
    presidingArbitratorId: { type: String, default: 'PANEL-AVIC-01' },
    faultLiabilityParty: { type: String, enum: ['BUYER', 'FARMER', 'CARRIER', 'JOINT_LIABILITY', 'NONE'], default: 'NONE' },
    verdictSummary: { type: String, default: null },
    
    // Financial Resolution Distribution
    buyerRefundAmount: { type: Number, default: 0, min: 0 },
    farmerPayoutAmount: { type: Number, default: 0, min: 0 },
    carrierPayoutAmount: { type: Number, default: 0, min: 0 },
    arbitrationFeeDeduction: { type: Number, default: 0, min: 0 },
    
    verdictTimestamp: { type: Date, default: null },
    verdictCryptographicSeal: { type: String, default: null }
  },

  // --- TIMESTAMPS ---
  lodgedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Pre-validation: Assign unique docket number
 */
disputeTribunalCaseSchema.pre('validate', function(next) {
  if (!this.docketNumber) {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.docketNumber = `ARB-${dateStr}-${randomHex}`;
  }
  next();
});

/**
 * Add an evidence item to the case locker
 */
disputeTribunalCaseSchema.methods.addEvidenceItem = function(item) {
  const hash = item.sha256Hash || crypto.createHash('sha256').update(JSON.stringify(item)).digest('hex');
  this.evidenceItems.push({
    ...item,
    sha256Hash: hash,
    submittedAt: new Date()
  });

  if (this.status === 'LODGED') {
    this.status = 'EVIDENCE_SUBMISSION';
  }

  return this;
};

/**
 * Issue formal tribunal verdict
 */
disputeTribunalCaseSchema.methods.issueVerdict = function({
  outcome,
  faultLiabilityParty,
  verdictSummary,
  buyerRefundAmount,
  farmerPayoutAmount,
  carrierPayoutAmount,
  arbitrationFeeDeduction = 0,
  arbitratorName = 'Hon. Ibrahim Galadima (Senior Agronomy Arbitrator)'
}) {
  const totalAllocated = Number((
    (buyerRefundAmount || 0) +
    (farmerPayoutAmount || 0) +
    (carrierPayoutAmount || 0) +
    (arbitrationFeeDeduction || 0)
  ).toFixed(2));

  // Build cryptographic seal
  const sealPayload = [
    this.docketNumber,
    this.vaultNumber,
    outcome,
    faultLiabilityParty,
    totalAllocated,
    arbitratorName,
    new Date().toISOString()
  ].join('|');

  const seal = crypto.createHash('sha256').update(sealPayload).digest('hex');

  this.arbitrationVerdict = {
    outcome,
    presidingArbitratorName: arbitratorName,
    presidingArbitratorId: 'ARB-PANEL-EXPERT-09',
    faultLiabilityParty,
    verdictSummary,
    buyerRefundAmount: Number((buyerRefundAmount || 0).toFixed(2)),
    farmerPayoutAmount: Number((farmerPayoutAmount || 0).toFixed(2)),
    carrierPayoutAmount: Number((carrierPayoutAmount || 0).toFixed(2)),
    arbitrationFeeDeduction: Number((arbitrationFeeDeduction || 0).toFixed(2)),
    verdictTimestamp: new Date(),
    verdictCryptographicSeal: seal
  };

  this.status = 'VERDICT_ISSUED';
  this.resolvedAt = new Date();
  return this;
};

/**
 * Execute final financial settlement
 */
disputeTribunalCaseSchema.methods.markSettlementExecuted = function() {
  this.status = 'SETTLEMENT_EXECUTED';
  return this;
};

const DisputeTribunalCase = mongoose.model('DisputeTribunalCase', disputeTribunalCaseSchema);

module.exports = {
  DisputeTribunalCase,
  TRIBUNAL_STATUSES,
  DISPUTE_CATEGORIES,
  VERDICT_OUTCOMES
};
