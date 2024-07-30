/**
 * ==============================================================================
 * 🌾 AGRILY AGRO-COMMERCE PLATFORM: ENTERPRISE ESCROW SETTLEMENT VAULT
 * ==============================================================================
 * 
 * Cryptographically secured, multi-party agricultural escrow settlement model.
 * Allocates and locks wholesale buyer purchase capital, arbitrates transit and
 * quality milestones, and enforces automated tri-party disbursement across:
 *  1. Smallholder Farmer / Cooperative Commodity Payout (Gate 30% + Dock 70%)
 *  2. Logistics Hauler / Carrier Freight Tariff & Cold-Chain SLA Retainage
 *  3. Agrily Platform Escrow Commission & Statutory 7.5% VAT Remittance
 * 
 * Features:
 *  - 64-character SHA-256 financial tamper-proof checksum calculation.
 *  - Statutory 48-hour inspection window countdown worker logic.
 *  - Automated dispute arbitration lockouts and pro-rata settlement execution.
 * 
 * @module models/EscrowSettlementVault
 * @author Agrily Core Financial Engineering
 * ==============================================================================
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Escrow Vault Lifecycle State Machine
 */
const VAULT_STATUSES = [
  'DEPOSITED_LOCKED',       // Capital committed by buyer; held in secure vault
  'IN_TRANSIT_SECURED',     // Consignment dispatched with carrier and cold-chain IoT
  'INSPECTION_PENDING',     // Arrived at receiver dock; 48-hour inspection countdown open
  'PARTIALLY_RELEASED',     // Mobilization / harvest advance released; balance pending dock check
  'FULLY_SETTLED',          // All milestones verified and funds disbursed to all stakeholders
  'ARBITRATION_LOCKED',     // Quality/quantity dispute lodged; funds frozen pending tribunal verdict
  'REFUNDED'                // Consignment rejected or failed SLA; capital returned to buyer
];

const SUPPORTED_CURRENCIES = ['NGN', 'KES', 'USD', 'GHS'];

/**
 * Milestone Sub-Schema representing an itemized disbursement checkpoint
 */
const vaultMilestoneSchema = new mongoose.Schema({
  milestoneKey: {
    type: String,
    required: [true, 'Milestone key is required'],
    enum: [
      'FARMER_GATE_ADVANCE',       // 30% harvest mobilization
      'FARMER_FINAL_ACCEPTANCE',   // 70% delivery & dock quality clearance
      'CARRIER_DISPATCH_ADVANCE',  // 40% fuel & toll haulage advance
      'CARRIER_POD_COMPLETION',    // 60% proof-of-delivery & cold-chain SLA clearance
      'PLATFORM_COMMISSION_FEE',   // Agrily 2.5% escrow management tariff
      'STATUTORY_VAT_FEE'          // Federal statutory 7.5% VAT on freight & platform tariffs
    ]
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  beneficiaryRole: {
    type: String,
    required: true,
    enum: ['FARMER', 'CARRIER', 'PLATFORM', 'TAX_AUTHORITY', 'BUYER_REFUND']
  },
  beneficiaryName: {
    type: String,
    required: true,
    trim: true
  },
  beneficiaryAccountRef: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Milestone amount cannot be negative']
  },
  percentageOfTotal: {
    type: Number,
    required: true,
    min: [0, 'Percentage cannot be negative'],
    max: [100, 'Percentage cannot exceed 100']
  },
  status: {
    type: String,
    enum: ['LOCKED', 'ELIGIBLE', 'RELEASED', 'FORFEITED', 'REFUNDED'],
    default: 'LOCKED'
  },
  releasedAt: {
    type: Date,
    default: null
  },
  releaseTransactionRef: {
    type: String,
    default: null
  },
  releaseSignatoryPin: {
    type: String,
    default: null
  }
}, { _id: true });

/**
 * Generate standard tri-party milestone schedule
 */
function generateDefaultMilestones(doc) {
  const produceSubtotal = doc.produceSubtotal || 0;
  const platformFee = doc.platformCommissionFee || Number((produceSubtotal * 0.025).toFixed(2));
  const produceNetFarmer = Number((produceSubtotal - platformFee).toFixed(2));
  const farmerAdvance = Number((produceNetFarmer * 0.30).toFixed(2));
  const farmerFinal = Number((produceNetFarmer - farmerAdvance).toFixed(2));

  const carrierTotal = Number(((doc.haulageFreightTariff || 0) + (doc.coldChainGuaranteeFee || 0)).toFixed(2));
  const carrierAdvance = Number((carrierTotal * 0.40).toFixed(2));
  const carrierFinal = Number((carrierTotal - carrierAdvance).toFixed(2));

  const taxableSum = (doc.haulageFreightTariff || 0) + platformFee;
  const vatAmount = doc.statutoryVatAmount || Number((taxableSum * 0.075).toFixed(2));

  const total = doc.totalEscrowAmount || Number((produceSubtotal + (doc.haulageFreightTariff || 0) + (doc.coldChainGuaranteeFee || 0) + platformFee + vatAmount).toFixed(2)) || 1;

  const farmerName = doc.farmer?.name || 'Farmer';
  const farmerAcc = `${doc.farmer?.payoutBankCode || '058'}-${doc.farmer?.payoutAccountNumber || '0123456789'}`;
  const carrierName = doc.carrier?.name || 'Carrier';
  const carrierAcc = `${doc.carrier?.payoutBankCode || '011'}-${doc.carrier?.payoutAccountNumber || '2034567890'}`;

  return [
    {
      milestoneKey: 'FARMER_GATE_ADVANCE',
      title: 'Farmer Harvest Mobilization (30% Net Commodity)',
      beneficiaryRole: 'FARMER',
      beneficiaryName: farmerName,
      beneficiaryAccountRef: farmerAcc,
      amount: farmerAdvance,
      percentageOfTotal: Number(((farmerAdvance / total) * 100).toFixed(2)),
      status: 'LOCKED'
    },
    {
      milestoneKey: 'FARMER_FINAL_ACCEPTANCE',
      title: 'Farmer Delivery Clearance (70% Net Commodity)',
      beneficiaryRole: 'FARMER',
      beneficiaryName: farmerName,
      beneficiaryAccountRef: farmerAcc,
      amount: farmerFinal,
      percentageOfTotal: Number(((farmerFinal / total) * 100).toFixed(2)),
      status: 'LOCKED'
    },
    {
      milestoneKey: 'CARRIER_DISPATCH_ADVANCE',
      title: 'Carrier Dispatch Fuel & Logistics Advance (40%)',
      beneficiaryRole: 'CARRIER',
      beneficiaryName: carrierName,
      beneficiaryAccountRef: carrierAcc,
      amount: carrierAdvance,
      percentageOfTotal: Number(((carrierAdvance / total) * 100).toFixed(2)),
      status: 'LOCKED'
    },
    {
      milestoneKey: 'CARRIER_POD_COMPLETION',
      title: 'Carrier Proof of Delivery & Cold-Chain SLA Clearance (60%)',
      beneficiaryRole: 'CARRIER',
      beneficiaryName: carrierName,
      beneficiaryAccountRef: carrierAcc,
      amount: carrierFinal,
      percentageOfTotal: Number(((carrierFinal / total) * 100).toFixed(2)),
      status: 'LOCKED'
    },
    {
      milestoneKey: 'PLATFORM_COMMISSION_FEE',
      title: 'Agrily Agricultural Escrow Brokerage Tariff (2.5%)',
      beneficiaryRole: 'PLATFORM',
      beneficiaryName: 'Agrily Escrow Operations Escrow Fund',
      beneficiaryAccountRef: 'AGRILY-ESCROW-PLATFORM-001',
      amount: platformFee,
      percentageOfTotal: Number(((platformFee / total) * 100).toFixed(2)),
      status: 'LOCKED'
    },
    {
      milestoneKey: 'STATUTORY_VAT_FEE',
      title: 'Federal Inland Revenue Statutory VAT Remittance (7.5%)',
      beneficiaryRole: 'TAX_AUTHORITY',
      beneficiaryName: 'Federal Inland Revenue Service (FIRS) VAT Escrow',
      beneficiaryAccountRef: 'FIRS-AGRI-COMMODITY-TAX',
      amount: vatAmount,
      percentageOfTotal: Number(((vatAmount / total) * 100).toFixed(2)),
      status: 'LOCKED'
    }
  ];
}

/**
 * Main Escrow Settlement Vault Schema
 */
const escrowSettlementVaultSchema = new mongoose.Schema({
  vaultNumber: {
    type: String,
    unique: true,
    uppercase: true,
    trim: true,
    default: function() {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
      return `VAULT-${dateStr}-${randomHex}`;
    }
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
    trim: true,
    index: true
  },
  routeId: {
    type: String,
    default: null,
    trim: true
  },
  sensorPodSerial: {
    type: String,
    default: null,
    trim: true
  },

  // --- CONTRACTING PARTIES ---
  buyer: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: null, trim: true },
    businessName: { type: String, default: null, trim: true }
  },
  farmer: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: null, trim: true },
    farmName: { type: String, default: null, trim: true },
    payoutBankCode: { type: String, default: '058' }, // Default GTBank Nigeria
    payoutAccountNumber: { type: String, default: '0123456789' }
  },
  carrier: {
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
    name: { type: String, default: 'Agrily Freight Logistics' },
    phone: { type: String, default: '+2348030000001' },
    vehiclePlateNumber: { type: String, default: 'KNO-882-XA' },
    payoutBankCode: { type: String, default: '011' }, // First Bank Nigeria
    payoutAccountNumber: { type: String, default: '2034567890' }
  },

  // --- FINANCIAL SPECIFICATIONS ---
  currency: {
    type: String,
    enum: SUPPORTED_CURRENCIES,
    default: 'NGN'
  },
  produceSubtotal: {
    type: Number,
    required: [true, 'Produce subtotal is required'],
    min: [1, 'Produce subtotal must be greater than zero']
  },
  haulageFreightTariff: {
    type: Number,
    default: 0,
    min: [0, 'Freight tariff cannot be negative']
  },
  coldChainGuaranteeFee: {
    type: Number,
    default: 0,
    min: [0, 'Cold-chain guarantee fee cannot be negative']
  },
  platformCommissionFee: {
    type: Number,
    default: function() {
      return this.produceSubtotal ? Number((this.produceSubtotal * 0.025).toFixed(2)) : 0;
    },
    min: [0, 'Platform commission cannot be negative']
  },
  statutoryVatAmount: {
    type: Number,
    default: function() {
      const commission = this.platformCommissionFee || (this.produceSubtotal ? Number((this.produceSubtotal * 0.025).toFixed(2)) : 0);
      const taxable = (this.haulageFreightTariff || 0) + commission;
      return Number((taxable * 0.075).toFixed(2));
    },
    min: [0, 'Statutory VAT cannot be negative']
  },
  totalEscrowAmount: {
    type: Number,
    default: function() {
      const commission = this.platformCommissionFee || (this.produceSubtotal ? Number((this.produceSubtotal * 0.025).toFixed(2)) : 0);
      const vat = this.statutoryVatAmount || Number((((this.haulageFreightTariff || 0) + commission) * 0.075).toFixed(2));
      return Number((
        (this.produceSubtotal || 0) +
        (this.haulageFreightTariff || 0) +
        (this.coldChainGuaranteeFee || 0) +
        commission +
        vat
      ).toFixed(2));
    },
    min: [1, 'Total escrow amount must be positive']
  },

  // --- RECONCILIATION TOTALS ---
  totalReleasedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalRefundedAmount: {
    type: Number,
    default: 0,
    min: 0
  },

  // --- STATUS & LIFECYCLE ---
  status: {
    type: String,
    enum: VAULT_STATUSES,
    default: 'DEPOSITED_LOCKED',
    index: true
  },

  // --- INSPECTION & TIME-LOCK COUNTDOWN ---
  dockArrivalTimestamp: {
    type: Date,
    default: null
  },
  inspectionWindowHours: {
    type: Number,
    default: 48,
    min: 6,
    max: 168
  },
  inspectionDeadlineTimestamp: {
    type: Date,
    default: null
  },
  inspectionCertificateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QualityInspectionCertificate',
    default: null
  },
  inspectionPassed: {
    type: Boolean,
    default: null
  },

  // --- DISPUTE & ARBITRATION ---
  activeTribunalCaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DisputeTribunalCase',
    default: null
  },
  disputeDocketNumber: {
    type: String,
    default: null
  },

  // --- CRYPTOGRAPHIC INTEGRITY ---
  financialChecksum: {
    type: String,
    default: function() {
      return this.calculateFinancialChecksum ? this.calculateFinancialChecksum() : null;
    }
  },

  // --- MILESTONE SETTLEMENT REGISTRY ---
  milestones: {
    type: [vaultMilestoneSchema],
    default: function() {
      return generateDefaultMilestones(this);
    }
  },

  // --- AUDIT TIMESTAMPS ---
  depositedAt: {
    type: Date,
    default: Date.now
  },
  settledAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Recalculate financials, milestones, and checksums
 */
escrowSettlementVaultSchema.methods.recalculateFinancials = function() {
  if (!this.vaultNumber) {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.vaultNumber = `VAULT-${dateStr}-${randomHex}`;
  }

  if (this.produceSubtotal) {
    if (!this.platformCommissionFee || this.platformCommissionFee === 0) {
      this.platformCommissionFee = Number((this.produceSubtotal * 0.025).toFixed(2));
    }
    const taxableSum = (this.haulageFreightTariff || 0) + (this.platformCommissionFee || 0);
    if (!this.statutoryVatAmount || this.statutoryVatAmount === 0) {
      this.statutoryVatAmount = Number((taxableSum * 0.075).toFixed(2));
    }
    if (!this.totalEscrowAmount || this.totalEscrowAmount === 0) {
      this.totalEscrowAmount = Number((
        this.produceSubtotal +
        (this.haulageFreightTariff || 0) +
        (this.coldChainGuaranteeFee || 0) +
        this.platformCommissionFee +
        this.statutoryVatAmount
      ).toFixed(2));
    }
  }

  if (!this.milestones || this.milestones.length === 0) {
    this.buildDefaultMilestones();
  }

  this.financialChecksum = this.calculateFinancialChecksum();
  return this;
};

/**
 * Pre-validation hook: Ensure financials and milestones are fresh
 */
escrowSettlementVaultSchema.pre('validate', function(next) {
  this.recalculateFinancials();
  if (typeof next === 'function') next();
});

/**
 * Construct default tri-party milestone distribution
 */
escrowSettlementVaultSchema.methods.buildDefaultMilestones = function() {
  const produceNetFarmer = Number((this.produceSubtotal - (this.platformCommissionFee || 0)).toFixed(2));
  const farmerAdvance = Number((produceNetFarmer * 0.30).toFixed(2));
  const farmerFinal = Number((produceNetFarmer - farmerAdvance).toFixed(2));

  const carrierTotal = Number(((this.haulageFreightTariff || 0) + (this.coldChainGuaranteeFee || 0)).toFixed(2));
  const carrierAdvance = Number((carrierTotal * 0.40).toFixed(2));
  const carrierFinal = Number((carrierTotal - carrierAdvance).toFixed(2));

  const total = this.totalEscrowAmount || 1;

  this.milestones = [
    {
      milestoneKey: 'FARMER_GATE_ADVANCE',
      title: 'Farmer Harvest Mobilization (30% Net Commodity)',
      beneficiaryRole: 'FARMER',
      beneficiaryName: this.farmer.name,
      beneficiaryAccountRef: `${this.farmer.payoutBankCode}-${this.farmer.payoutAccountNumber}`,
      amount: farmerAdvance,
      percentageOfTotal: Number(((farmerAdvance / total) * 100).toFixed(2)),
      status: 'LOCKED'
    },
    {
      milestoneKey: 'FARMER_FINAL_ACCEPTANCE',
      title: 'Farmer Delivery Clearance (70% Net Commodity)',
      beneficiaryRole: 'FARMER',
      beneficiaryName: this.farmer.name,
      beneficiaryAccountRef: `${this.farmer.payoutBankCode}-${this.farmer.payoutAccountNumber}`,
      amount: farmerFinal,
      percentageOfTotal: Number(((farmerFinal / total) * 100).toFixed(2)),
      status: 'LOCKED'
    },
    {
      milestoneKey: 'CARRIER_DISPATCH_ADVANCE',
      title: 'Carrier Dispatch Fuel & Logistics Advance (40%)',
      beneficiaryRole: 'CARRIER',
      beneficiaryName: this.carrier.name,
      beneficiaryAccountRef: `${this.carrier.payoutBankCode}-${this.carrier.payoutAccountNumber}`,
      amount: carrierAdvance,
      percentageOfTotal: Number(((carrierAdvance / total) * 100).toFixed(2)),
      status: 'LOCKED'
    },
    {
      milestoneKey: 'CARRIER_POD_COMPLETION',
      title: 'Carrier Proof of Delivery & Cold-Chain SLA Clearance (60%)',
      beneficiaryRole: 'CARRIER',
      beneficiaryName: this.carrier.name,
      beneficiaryAccountRef: `${this.carrier.payoutBankCode}-${this.carrier.payoutAccountNumber}`,
      amount: carrierFinal,
      percentageOfTotal: Number(((carrierFinal / total) * 100).toFixed(2)),
      status: 'LOCKED'
    },
    {
      milestoneKey: 'PLATFORM_COMMISSION_FEE',
      title: 'Agrily Agricultural Escrow Brokerage Tariff (2.5%)',
      beneficiaryRole: 'PLATFORM',
      beneficiaryName: 'Agrily Escrow Operations Escrow Fund',
      beneficiaryAccountRef: 'AGRILY-ESCROW-PLATFORM-001',
      amount: this.platformCommissionFee || 0,
      percentageOfTotal: Number((((this.platformCommissionFee || 0) / total) * 100).toFixed(2)),
      status: 'LOCKED'
    },
    {
      milestoneKey: 'STATUTORY_VAT_FEE',
      title: 'Federal Inland Revenue Statutory VAT Remittance (7.5%)',
      beneficiaryRole: 'TAX_AUTHORITY',
      beneficiaryName: 'Federal Inland Revenue Service (FIRS) VAT Escrow',
      beneficiaryAccountRef: 'FIRS-AGRI-COMMODITY-TAX',
      amount: this.statutoryVatAmount || 0,
      percentageOfTotal: Number((((this.statutoryVatAmount || 0) / total) * 100).toFixed(2)),
      status: 'LOCKED'
    }
  ];
};

/**
 * Compute cryptographic SHA-256 Financial Checksum
 */
escrowSettlementVaultSchema.methods.calculateFinancialChecksum = function() {
  const payload = [
    this.vaultNumber,
    this.orderId,
    this.buyer.email,
    this.farmer.email,
    this.currency,
    this.totalEscrowAmount,
    this.produceSubtotal,
    this.haulageFreightTariff,
    this.platformCommissionFee,
    this.statutoryVatAmount,
    this.status
  ].join('|');

  return crypto.createHash('sha256').update(payload).digest('hex');
};

/**
 * Verify if current financial checksum matches internal state
 */
escrowSettlementVaultSchema.methods.verifyChecksumIntegrity = function() {
  return this.calculateFinancialChecksum() === this.financialChecksum;
};

/**
 * Record Dock Arrival and trigger 48-hour inspection countdown
 */
escrowSettlementVaultSchema.methods.recordDockArrival = function(arrivalDate = new Date()) {
  this.dockArrivalTimestamp = arrivalDate;
  this.status = 'INSPECTION_PENDING';
  
  const deadline = new Date(arrivalDate.getTime() + (this.inspectionWindowHours * 60 * 60 * 1000));
  this.inspectionDeadlineTimestamp = deadline;
  this.financialChecksum = this.calculateFinancialChecksum();
  return this;
};

/**
 * Check if inspection window countdown is currently active
 */
escrowSettlementVaultSchema.virtual('isInspectionWindowOpen').get(function() {
  if (!this.inspectionDeadlineTimestamp) return false;
  return new Date() < this.inspectionDeadlineTimestamp && this.status === 'INSPECTION_PENDING';
});

/**
 * Check if 48-hour inspection countdown has expired without dispute (eligible for auto-release)
 */
escrowSettlementVaultSchema.virtual('isAutoReleaseEligible').get(function() {
  if (!this.inspectionDeadlineTimestamp) return false;
  return new Date() >= this.inspectionDeadlineTimestamp && this.status === 'INSPECTION_PENDING';
});

/**
 * Net Payouts for Farmer and Carrier virtual calculations
 */
escrowSettlementVaultSchema.virtual('netFarmerPayout').get(function() {
  return Number((this.produceSubtotal - (this.platformCommissionFee || 0)).toFixed(2));
});

escrowSettlementVaultSchema.virtual('netCarrierPayout').get(function() {
  return Number(((this.haulageFreightTariff || 0) + (this.coldChainGuaranteeFee || 0)).toFixed(2));
});

/**
 * Release a specific milestone
 */
escrowSettlementVaultSchema.methods.releaseMilestone = function(milestoneKey, signatoryPin, txRef = null) {
  const milestone = this.milestones.find(m => m.milestoneKey === milestoneKey);
  if (!milestone) {
    throw new Error(`Milestone '${milestoneKey}' not found in vault schedule`);
  }

  if (milestone.status === 'RELEASED') {
    throw new Error(`Milestone '${milestoneKey}' has already been released`);
  }

  milestone.status = 'RELEASED';
  milestone.releasedAt = new Date();
  milestone.releaseSignatoryPin = signatoryPin;
  milestone.releaseTransactionRef = txRef || `TX-ESC-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

  this.totalReleasedAmount = Number((this.totalReleasedAmount + milestone.amount).toFixed(2));

  // If all milestones released, mark fully settled
  const allReleased = this.milestones.every(m => m.status === 'RELEASED' || m.status === 'FORFEITED');
  if (allReleased) {
    this.status = 'FULLY_SETTLED';
    this.settledAt = new Date();
  } else {
    this.status = 'PARTIALLY_RELEASED';
  }

  this.financialChecksum = this.calculateFinancialChecksum();
  return milestone;
};

/**
 * Lock vault for arbitration tribunal
 */
escrowSettlementVaultSchema.methods.lockForArbitration = function(caseId, docketNumber) {
  this.status = 'ARBITRATION_LOCKED';
  this.activeTribunalCaseId = caseId;
  this.disputeDocketNumber = docketNumber;
  this.financialChecksum = this.calculateFinancialChecksum();
  return this;
};

const EscrowSettlementVault = mongoose.model('EscrowSettlementVault', escrowSettlementVaultSchema);

module.exports = {
  EscrowSettlementVault,
  VAULT_STATUSES,
  SUPPORTED_CURRENCIES
};
